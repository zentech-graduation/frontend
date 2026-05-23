import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import PageLoader from '@/components/common/PageLoader';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * OAuthCallbackPage
 *
 * Handles the redirect back from a Google OAuth flow.
 *
 * Security invariants enforced here:
 * 1. The URL hash is NEVER parsed for access_token / id_token.
 *    The implicit flow (response_type=token id_token) is retired — only the
 *    backend-driven authorization-code flow (response_type=code) is supported.
 *    If hash tokens are present the page fails closed with an explicit error.
 * 2. `state` parameter MUST be present and MUST match the value stored in
 *    sessionStorage. Missing or mismatched state is a hard failure.
 * 3. `nonce` from a decoded JWT is NOT validated client-side; JWT parsing via
 *    window.atob provides no integrity guarantee. Nonce validation belongs on
 *    the backend token endpoint.
 * 4. The `?token=` query param path (backend-issued short-lived token) is kept
 *    and the token is exchanged server-side via /auth/oauth2/exchange, which
 *    issues a proper session.
 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [errorMessage, setErrorMessage] = useState('');
  const didRun = useRef(false);

  // Errors forwarded by the OAuth provider in the query string.
  const callbackError = searchParams.get('error') || '';

  useEffect(() => {
    // React Strict Mode mounts twice in development; the ref prevents a double
    // exchange which would consume the one-time state/nonce values.
    if (didRun.current) return;
    didRun.current = true;

    if (callbackError) {
      // callbackError is rendered below — nothing else to do.
      return;
    }

    // Detect a legacy implicit-flow redirect (URL hash contains access_token
    // or id_token). This flow is insecure and not supported.
    const rawHash = window.location.hash;
    if (rawHash) {
      const hashParams = new URLSearchParams(rawHash.replace(/^#/, ''));
      if (hashParams.get('access_token') || hashParams.get('id_token')) {
        // Scrub the hash immediately to prevent the tokens sitting in history.
        window.history.replaceState({}, document.title, window.location.pathname);
        setErrorMessage(
          'Implicit OAuth flow is not supported. Please contact support if this error persists.'
        );
        return;
      }
    }

    const finishOAuth = async () => {
      try {
        // --- Authorization-code / backend-token path ---
        // The backend redirects to this page with a short-lived ?token=
        // and, optionally, the opaque OAuth ?state= for CSRF protection.
        const token = searchParams.get('token');
        const returnedState = searchParams.get('state');

        // Consume the stored CSRF state (one-time read + delete from sessionStorage).
        const { state: storedState } = authApi.consumeGoogleOAuthState();

        // State MUST be present and MUST match. Fail closed — do not proceed
        // if either side is absent, which would silently pass a CSRF check.
        if (!storedState || !returnedState || storedState !== returnedState) {
          throw new Error(
            'OAuth state parameter is missing or invalid. The request may have been tampered with.'
          );
        }

        // Scrub the OAuth parameters from the URL before any async work so
        // they do not linger in browser history.
        window.history.replaceState({}, document.title, window.location.pathname);

        if (!token) {
          throw new Error('OAuth callback did not include a token.');
        }

        // Exchange the short-lived backend token for a full session.
        const exchange = await authApi.exchangeOAuthToken(token);

        if (!exchange?.accessToken) {
          throw new Error('Token exchange did not return a valid session.');
        }

        // Fetch the canonical user profile from the server rather than
        // trusting claims parsed client-side from an unverified JWT.
        let profile = exchange.user;
        if (!profile) {
          profile = await authApi.getCurrentUser();
        }

        if (!profile) {
          throw new Error('Could not retrieve user profile after OAuth sign in.');
        }

        setAuth({
          accessToken: exchange.accessToken,
          refreshToken: exchange.refreshToken ?? null,
          user: profile,
        });

        navigate('/dashboard', { replace: true });
      } catch (oauthError) {
        logout();
        setErrorMessage(authApi.normalizeMessage(oauthError, 'Unable to complete Google sign in.'));
      }
    };

    finishOAuth();
    // searchParams identity is stable across re-renders for the same URL;
    // callbackError is derived from it. Only run once via the didRun ref.
  }, [callbackError, logout, navigate, searchParams, setAuth]);

  if (callbackError) {
    return (
      <div className="oauth-callback-error">
        <h1>Google sign-in failed.</h1>
        <p>{callbackError}</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="oauth-callback-error">
        <h1>Google sign-in failed.</h1>
        <p>{errorMessage}</p>
      </div>
    );
  }

  return <PageLoader label="Completing Google sign in..." />;
}
