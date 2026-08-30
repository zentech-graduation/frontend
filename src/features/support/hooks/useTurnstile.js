import { useEffect, useRef, useState } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_ID = 'cf-turnstile-script';

/**
 * Mounts the Cloudflare Turnstile widget and yields its token.
 *
 * The script is injected on mount rather than loaded in index.html, so it costs
 * nothing on any other route. It is injected once and left in place: removing it
 * on unmount would force a re-download every time the user goes back to the form.
 *
 * The site key is public by design - it identifies the widget, and Cloudflare
 * verifies the paired secret server-side - so reading it from a VITE_ variable is
 * correct rather than a leak.
 */
export function useTurnstile(containerRef, { siteKey }) {
  const [token, setToken] = useState('');
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return undefined;
    }

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.turnstile || !containerRef.current || widgetIdRef.current !== null) {
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (value) => setToken(value),
        // A challenge that expires without being re-solved must clear the token,
        // otherwise the form would submit a value the backend has already aged out
        // and the user would see a verification failure they cannot explain.
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    };

    if (window.turnstile) {
      render();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      document.getElementById(SCRIPT_ID).addEventListener('load', render, { once: true });
    }

    return () => {
      cancelled = true;
    };
  }, [siteKey, containerRef]);

  const reset = () => {
    setToken('');
    if (window.turnstile && widgetIdRef.current !== null) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  return { token, reset };
}
