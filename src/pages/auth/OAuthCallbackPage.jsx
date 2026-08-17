import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import PageLoader from '@/components/common/PageLoader';
import { ROUTES } from '@/config/constants';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * OAuthCallbackPage
 *
 * Handles the redirect back from a Google OAuth flow.
 *
 * Security invariants enforced here:
 * 1. The URL hash is NEVER parsed for access_token / id_token.
 *    The implicit flow (response_type=token id_token) is retired - only the
 *    backend-driven authorization-code flow is supported.
 *    If hash tokens are present the page fails closed with an explicit error.
 * 2. CSRF state validation belongs to the backend's signed HttpOnly cookie
 *    repository, so the frontend does not persist or validate `state`.
 * 3. The backend redirects to this page with a short-lived `?code=...` value
 *    that the frontend exchanges via /auth/oauth2/exchange for a real session.
 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [errorMessage, setErrorMessage] = useState('');
  const didRun = useRef(false);

  const callbackError = searchParams.get('error') || '';

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (callbackError) {
      return;
    }

    const rawHash = window.location.hash;
    if (rawHash) {
      const hashParams = new URLSearchParams(rawHash.replace(/^#/, ''));
      if (hashParams.get('access_token') || hashParams.get('id_token')) {
        window.history.replaceState({}, document.title, window.location.pathname);
        // Reads the URL fragment and rewrites history; both are browser state, not props.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setErrorMessage(
          'Implicit OAuth flow is not supported. Please contact support if this error persists.'
        );
        return;
      }
    }

    const finishOAuth = async () => {
      try {
        const code = searchParams.get('code');

        window.history.replaceState({}, document.title, window.location.pathname);

        if (!code) {
          throw new Error('OAuth callback did not include an exchange code.');
        }

        const exchange = await authApi.exchangeOAuthCode(code);

        if (!exchange?.accessToken) {
          throw new Error('Token exchange did not return a valid session.');
        }

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

        navigate(ROUTES.APP, { replace: true });
      } catch (oauthError) {
        logout();
        setErrorMessage(authApi.normalizeMessage(oauthError, 'Unable to complete Google sign in.'));
      }
    };

    finishOAuth();
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
