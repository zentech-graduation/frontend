import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { axiosClient } from '@/api/axiosClient';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * The one STOMP connection the application holds.
 *
 * Subscriptions are reference counted by destination. The socket opens when the
 * first subscriber arrives and closes when the last one leaves, so a viewer who
 * never opens a post never opens a socket.
 *
 * Every failure path here is silent and non-throwing. Live updates are additive:
 * if the socket never connects, the screen that asked for it must behave exactly
 * as it did before, so nothing in this module may surface an error to a caller.
 */

// SockJS is mandatory. The server registers both endpoints with withSockJS() and
// refuses a raw WebSocket upgrade with 400, before the auth interceptor runs.
// See docs/realtime/realtime-contract.md section 1.
const SOCKJS_ENDPOINT = '/ws/comments';

// Browsers cannot set an Authorization header on a WebSocket upgrade, so a credential has to ride
// in the URL. It is a single-use ticket rather than the access token: query strings are logged by
// default by proxies and CDNs, and a token left there outlives its own expiry in log storage. The
// ticket is redeemed server-side, expires in 30 seconds, and cannot be replayed.
const TICKET_PARAM = 'ticket';
const TICKET_PATH = '/auth/ws-ticket';

/**
 * Obtains a handshake ticket, or null when one cannot be had.
 *
 * Silent on failure like everything else in this module: a live tier that cannot start must leave
 * the screen exactly as it was.
 */
const fetchTicket = async () => {
  try {
    const response = await axiosClient.post(TICKET_PATH);
    return response?.data?.data?.ticket ?? null;
  } catch {
    return null;
  }
};

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

let client = null;
/** destination -> Set of handler functions */
const handlers = new Map();
/** destination -> the live StompSubscription, present only while connected */
const subscriptions = new Map();
let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;

// Failures here stay silent by design, which is right for a flaky network and wrong for an endpoint
// that is not registered at all. Production ran for some time with the comment live flag off, so
// this module retried forever against a 404 and nothing on either side said so. A development-only
// warning after a few consecutive failures makes that visible during integration without changing
// the silent contract that shipped code relies on.
const HANDSHAKE_WARN_THRESHOLD = 3;
let consecutiveHandshakeFailures = 0;

const noteHandshakeFailure = () => {
  consecutiveHandshakeFailures += 1;
  if (import.meta.env.DEV && consecutiveHandshakeFailures === HANDSHAKE_WARN_THRESHOLD) {
    console.warn(
      `[realtime] ${HANDSHAKE_WARN_THRESHOLD} consecutive handshake failures against ` +
        `${SOCKJS_ENDPOINT}. Check that app.comment.live.enabled is true on the backend.`
    );
  }
};

const noteHandshakeSuccess = () => {
  consecutiveHandshakeFailures = 0;
};
let reconnectTimer = null;

/**
 * Derives the server origin from the configured API base URL.
 *
 * The WebSocket endpoints sit outside `/api/v1` and the Vite dev proxy only
 * forwards `/api`, so the socket is opened against the backend origin directly.
 * The origin is never hardcoded; it comes from VITE_API_URL like every other
 * server address in the application.
 */
const resolveEndpoint = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
  try {
    return new URL(SOCKJS_ENDPOINT, new URL(apiUrl).origin).toString();
  } catch {
    return null;
  }
};

const currentToken = () => useAuthStore.getState().accessToken;

const cancelReconnect = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const bindSubscription = (destination) => {
  if (!client?.connected || subscriptions.has(destination)) {
    return;
  }
  const subscription = client.subscribe(destination, (message) => {
    let payload;
    try {
      payload = JSON.parse(message.body);
    } catch {
      // A frame we cannot parse is dropped rather than propagated. REST remains
      // the source of truth, so a lost frame costs freshness and nothing else.
      return;
    }
    for (const handler of handlers.get(destination) ?? []) {
      try {
        handler(payload);
      } catch {
        // One misbehaving handler must not stop the others or kill the socket.
      }
    }
  });
  subscriptions.set(destination, subscription);
};

/** Drops the current client without touching the handler registry. */
const teardownClient = () => {
  subscriptions.clear();
  if (!client) {
    return;
  }
  const stale = client;
  client = null;
  try {
    stale.deactivate();
  } catch {
    // Already gone with the socket.
  }
};

/**
 * Queues another connection attempt, doubling the wait each time up to a cap.
 *
 * A server that is down, a live tier that is switched off, and a network that
 * has gone away all produce the same close loop. Backing off keeps a screen that
 * stays open for an hour from making thousands of failing handshakes, while
 * still recovering quickly from a brief drop.
 *
 * The client is rebuilt rather than reactivated. A stompjs client that still
 * considers itself active ignores activate(), so reusing the instance retries
 * once and then silently stops.
 */
const scheduleReconnect = () => {
  cancelReconnect();
  // Nothing to reconnect for once the last subscriber has gone, and nothing to
  // reconnect with once the session has ended.
  if (handlers.size === 0 || !currentToken()) {
    return;
  }
  const delay = reconnectDelay;
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (handlers.size === 0 || !currentToken()) {
      return;
    }
    teardownClient();
    void openClient();
  }, delay);
};

const openClient = async () => {
  if (client) {
    return client;
  }
  const endpoint = resolveEndpoint();
  if (!endpoint) {
    return null;
  }

  // Fetched before the client is built, because webSocketFactory is synchronous and a ticket is
  // single-use: one ticket per client, and scheduleReconnect builds a fresh client each attempt.
  const ticket = await fetchTicket();
  if (!ticket) {
    noteHandshakeFailure();
    scheduleReconnect();
    return null;
  }

  const created = new Client({
    // One ticket per client. A reconnect tears the client down and builds another, which fetches
    // its own ticket, so a redeemed ticket is never replayed at a second handshake.
    webSocketFactory: () => new SockJS(`${endpoint}?${TICKET_PARAM}=${encodeURIComponent(ticket)}`),
    // stompjs's own reconnect is a fixed delay with no backoff, and mutating
    // reconnectDelay from inside onWebSocketClose does not change the retry it
    // has already scheduled. Observed against a server with the live tier
    // disabled, that produced a steady one-per-second run of failing handshakes.
    // Reconnection is scheduled by scheduleReconnect instead.
    reconnectDelay: 0,
    // The server advertises heart-beat:0,0 and does not send STOMP heartbeats;
    // SockJS sends its own. Asking for STOMP heartbeats here would only add a
    // second liveness mechanism that the server ignores.
    heartbeatIncoming: 0,
    heartbeatOutgoing: 0,
    onConnect: () => {
      reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
      noteHandshakeSuccess();
      for (const destination of handlers.keys()) {
        bindSubscription(destination);
      }
    },
    onWebSocketClose: () => {
      // A close from a client we have already replaced must not queue a second
      // reconnect alongside the one its replacement is running.
      if (client !== created) {
        return;
      }
      subscriptions.clear();
      noteHandshakeFailure();
      scheduleReconnect();
    },
    // stompjs surfaces protocol and socket errors here. They are swallowed: the
    // live tier degrades, the screen does not.
    onStompError: () => {},
    onWebSocketError: () => {},
  });

  client = created;
  created.activate();
  return created;
};

/**
 * Subscribes to a STOMP destination over the shared connection.
 *
 * @param {string} destination fully qualified topic, e.g. `/topic/comments.{id}.events`
 * @param {(payload: {eventType: string, data: object}) => void} handler
 * @returns {() => void} unsubscribe; releases the connection when it was the last subscriber
 */
export const subscribeTopic = (destination, handler) => {
  if (!destination || typeof handler !== 'function' || !currentToken()) {
    return () => {};
  }

  if (!handlers.has(destination)) {
    handlers.set(destination, new Set());
  }
  handlers.get(destination).add(handler);

  void openClient();
  bindSubscription(destination);

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;

    const set = handlers.get(destination);
    set?.delete(handler);
    if (set && set.size === 0) {
      handlers.delete(destination);
      try {
        subscriptions.get(destination)?.unsubscribe();
      } catch {
        // The socket may already be gone; the registry entry still goes.
      }
      subscriptions.delete(destination);
    }
    if (handlers.size === 0) {
      closeConnection();
    }
  };
};

/**
 * Tears the connection down unconditionally.
 *
 * Called on sign-out: a signed-out browser must not hold a live authenticated
 * socket, and the server would otherwise keep it until the revocation sweep
 * notices, up to 30 seconds later.
 */
export const closeConnection = () => {
  cancelReconnect();
  reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
  for (const subscription of subscriptions.values()) {
    try {
      subscription.unsubscribe();
    } catch {
      // Already gone with the socket.
    }
  }
  handlers.clear();
  teardownClient();
};

// Sign-out is observed here rather than by calling into this module from the
// auth store, because the store cannot import this file: this file imports the
// store, and the cycle would leave one of them half-initialised at load time.
// Watching the token also covers a session cleared by anything other than the
// sign-out button, such as a failed refresh.
useAuthStore.subscribe((state, previous) => {
  if (previous?.accessToken && !state.accessToken) {
    closeConnection();
  }
});
