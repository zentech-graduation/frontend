import { useEffect, useRef, useState } from 'react';
import { v } from '@/config/tokens';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_ID = 'cf-turnstile-script';

/**
 * Loads the Turnstile script once, on demand.
 *
 * Kept out of the document head so it costs nothing on any route that does not
 * render the public form, which is every route but one. The promise is cached
 * on the module so a remount does not add a second script tag.
 */
let scriptPromise = null;

const loadTurnstile = () => {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.turnstile));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(window.turnstile));
    script.addEventListener('error', () => reject(new Error('turnstile script failed to load')));
    document.head.appendChild(script);
  });
  return scriptPromise;
};

/**
 * The Cloudflare Turnstile challenge for the public support form.
 *
 * Reads `VITE_TURNSTILE_SITE_KEY`. The server verifies the resulting token and
 * fails closed, so a widget that cannot render must not silently let a
 * submission through: the absent-key and script-failure states both report
 * upward and leave the form unsubmittable.
 *
 * @param {(token: string|null) => void} props.onToken called with the solved token, or null when it expires
 * @param {(message: string) => void} props.onUnavailable called when the challenge cannot run at all
 */
export function TurnstileWidget({ onToken, onUnavailable }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  // Derived rather than set from inside the effect: a missing key is knowable
  // at first render, so making it the initial state avoids a second render
  // pass that only exists to record something already true.
  const [status, setStatus] = useState(siteKey ? 'loading' : 'unavailable');

  useEffect(() => {
    if (!siteKey) {
      onUnavailable?.('the challenge is not configured for this environment.');
      return undefined;
    }

    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current || !turnstile) {
          return;
        }
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            setStatus('solved');
            onToken?.(token);
          },
          // A token is single-use and short-lived. Clearing it on expiry stops
          // the form submitting one the server would refuse, which would read
          // to the user as an unexplained failure.
          'expired-callback': () => {
            setStatus('expired');
            onToken?.(null);
          },
          'error-callback': () => {
            setStatus('unavailable');
            onToken?.(null);
            onUnavailable?.('the challenge could not be completed. reload and try again.');
          },
          theme: 'auto',
        });
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setStatus('unavailable');
        onUnavailable?.('the challenge could not be loaded. check your connection and reload.');
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // The callbacks are captured once on mount by design: re-rendering the
    // widget on every parent render would reset a challenge the user has
    // already solved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return (
    <div style={{ marginBottom: 14 }}>
      <div ref={containerRef} />
      {status === 'loading' ? (
        <div
          className="lx-skeleton"
          style={{ height: 65, width: 300, borderRadius: 8, maxWidth: '100%' }}
        />
      ) : null}
      {status === 'expired' ? (
        <div
          role="status"
          style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2, marginTop: 6 }}
        >
          the challenge expired. complete it again.
        </div>
      ) : null}
      {status === 'unavailable' ? (
        <div
          role="alert"
          style={{
            fontFamily: v.fontBody,
            fontSize: 13,
            color: v.errorText,
            background: v.errorDim,
            border: `1px solid ${v.error}`,
            borderRadius: 8,
            padding: '10px 12px',
            marginTop: 6,
          }}
        >
          the challenge is unavailable, so this form cannot be submitted right now. if you were sent
          a link in an email about a decision on your account, use that link instead.
        </div>
      ) : null}
    </div>
  );
}

export default TurnstileWidget;
