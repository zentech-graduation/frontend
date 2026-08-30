import { useEffect, useRef } from 'react';

import { authApi } from '@/api/authApi';
import { clearLegacyAuthStorage, useAuthStore } from '@/store/useAuthStore';

const GUEST_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/oauth2/callback',
  // The anonymous help centre routes. These are not merely "reachable while
  // signed out" - they exist specifically for accounts that cannot sign in at
  // all, because the backend admits only active accounts to any authenticated
  // endpoint. Attempting a session restore here costs a request that is certain
  // to fail and gates the render on it, which strands a banned user on a loading
  // state at the exact moment they are trying to contest their ban.
  '/support/appeal',
  '/support/public',
  '/support/confirm',
  '/support/unsubscribe',
]);

export default function AuthSessionBootstrap() {
  const didRunRef = useRef(false);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated || didRunRef.current) {
      return;
    }

    didRunRef.current = true;

    const bootstrapAuth = async () => {
      const {
        accessToken,
        refreshToken,
        user,
        setAuth,
        setTokens,
        setUser,
        setBootstrapping,
        logout,
      } = useAuthStore.getState();

      setBootstrapping(true);

      try {
        clearLegacyAuthStorage();

        const pathname = window.location.pathname;
        const isGuestPath = GUEST_PATHS.has(pathname);

        if (!accessToken) {
          // Holding no refresh token is no longer the end of the road. The
          // backend issues the refresh token as an HttpOnly cookie, which the
          // browser replays automatically and application code cannot read, so
          // the same call restores a session whether the token survives in
          // memory or only in the cookie. Guest paths are token-driven pages
          // that never need a session, so the round trip is skipped there.
          if (!refreshToken && isGuestPath) {
            logout();
            return;
          }

          const refreshedSession = await authApi.refreshSession(refreshToken ?? undefined);

          if (!refreshedSession.accessToken) {
            throw new Error('Unable to restore your session.');
          }

          setTokens({
            accessToken: refreshedSession.accessToken,
            refreshToken: refreshedSession.refreshToken ?? refreshToken,
          });

          if (refreshedSession.user) {
            setUser(refreshedSession.user);
            return;
          }
        }

        if (accessToken && user) {
          return;
        }

        const nextUser = user || (await authApi.getCurrentUser());
        const currentState = useAuthStore.getState();

        setAuth({
          accessToken: currentState.accessToken,
          refreshToken: currentState.refreshToken,
          user: nextUser,
        });
      } catch (error) {
        if (error?.response?.status === 401) {
          logout();
          return;
        }

        // A network failure or a server fault is not evidence that the session
        // ended. Clearing the store here would sign out someone whose
        // connection dropped for a second and whose refresh cookie is still
        // perfectly valid, so the persisted marker is left alone and the next
        // load retries. Nothing is treated as signed in meanwhile: ProtectedRoute
        // gates on a live in-memory access token, which this path never sets.
        if (import.meta.env.DEV) {
          console.error('[AuthSessionBootstrap] session restore failed', error?.message ?? error);
        }
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrapAuth();
  }, [hasHydrated]);

  return null;
}
