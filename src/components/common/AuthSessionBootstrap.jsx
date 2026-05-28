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
  '/oauth/callback',
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

        if (!accessToken && !refreshToken) {
          if (isGuestPath) {
            logout();
            return;
          }

          throw new Error('No session available.');
        }

        if (!accessToken && refreshToken) {
          const refreshedSession = await authApi.refreshSession(refreshToken);

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
      } catch {
        logout();
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrapAuth();
  }, [hasHydrated]);

  return null;
}
