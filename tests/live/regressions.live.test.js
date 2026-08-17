import { beforeAll, describe, expect, it } from 'vitest';
import { API_BASE, assertStackReachable } from './support/client.js';

beforeAll(async () => {
  await assertStackReachable();
});

describe('BE-STA-02: metrics are exposed for scraping', () => {
  it('serves prometheus metrics on 8080 without authentication', async () => {
    const response = await fetch(`${API_BASE}/actuator/prometheus`);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/^# (HELP|TYPE) /m);
  });

  it('keeps health on the same port', async () => {
    const response = await fetch(`${API_BASE}/actuator/health`);
    expect(response.status).toBe(200);
  });

  it('still refuses other actuator endpoints to an anonymous caller', async () => {
    // Exposure widened deliberately to prometheus only. The ADMIN gate on the rest of
    // /actuator/** must survive that change.
    const response = await fetch(`${API_BASE}/actuator/env`);
    expect([401, 403, 404]).toContain(response.status);
  });
});

describe('BE-STA-01: the comment websocket endpoint is registered', () => {
  it('answers the SockJS info handshake', async () => {
    const response = await fetch(`${API_BASE}/ws/comments/info`);
    expect(response.status).toBe(200);
  });
});
