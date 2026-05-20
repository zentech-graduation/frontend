import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/authApi';
import PageLoader from '@/components/common/PageLoader';
import { useAuthStore } from '@/store/useAuthStore';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [errorMessage, setErrorMessage] = useState('');
  const searchError = searchParams.get('error');
  const hashValue = window.location.hash;
  const hashError = new URLSearchParams(hashValue.replace(/^#/, '')).get('error');
  const callbackError = searchError || hashError || '';

  useEffect(() => {
    const token = searchParams.get('token');
    const hashParams = new URLSearchParams(hashValue.replace(/^#/, ''));
    const hashAccessToken = hashParams.get('access_token');
    const hashIdToken = hashParams.get('id_token');
    const hashState = hashParams.get('state');

    if (callbackError) {
      return;
    }

    const finishOAuth = async () => {
      try {
        if (hashAccessToken || hashIdToken) {
          const { state: storedState, nonce: storedNonce } = authApi.consumeGoogleOAuthState();

          if (storedState && hashState && storedState !== hashState) {
            throw new Error('Invalid Google OAuth state.');
          }

          const claims = authApi.decodeJwt(hashIdToken);

          if (storedNonce && claims?.nonce && storedNonce !== claims.nonce) {
            throw new Error('Invalid Google OAuth nonce.');
          }

          const oauthToken = hashAccessToken || hashIdToken;
          const profile = authApi.buildUserFromGoogleClaims(claims);

          if (!oauthToken || !profile) {
            throw new Error('Google OAuth callback did not include usable profile data.');
          }

          setAuth({
            accessToken: oauthToken,
            refreshToken: null,
            user: profile,
          });

          window.history.replaceState({}, document.title, window.location.pathname);
          navigate('/dashboard', { replace: true });
          return;
        }

        if (!token) {
          setErrorMessage('OAuth callback did not include a token.');
          return;
        }

        let profile = null;
        let refreshToken = null;

        try {
          profile = await authApi.getCurrentUser();
        } catch {
          const exchange = await authApi.exchangeOAuthToken(token);
          profile = exchange.user;
          refreshToken = exchange.refreshToken;
        }

        if (!profile) {
          profile = await authApi.getCurrentUser();
        }

        setAuth({
          accessToken: token,
          refreshToken,
          user: profile,
        });

        navigate('/dashboard', { replace: true });
      } catch (oauthError) {
        logout();
        setErrorMessage(authApi.normalizeMessage(oauthError, 'Unable to complete Google sign in.'));
      }
    };

    finishOAuth();
  }, [callbackError, hashValue, logout, navigate, searchParams, setAuth]);

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
