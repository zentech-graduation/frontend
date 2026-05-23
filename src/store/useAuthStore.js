import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Keys used for Google OAuth PKCE-style state and nonce — kept in sessionStorage
// (tab-scoped, never written to the persisted store).
export const GOOGLE_OAUTH_STATE_KEY = 'luvax-google-oauth-state';
export const GOOGLE_OAUTH_NONCE_KEY = 'luvax-google-oauth-nonce';

/**
 * Removes any leftover auth artifacts from a previous storage strategy.
 * Call during logout or session reset to ensure a clean slate.
 */
export const clearLegacyAuthStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
  window.sessionStorage.removeItem(GOOGLE_OAUTH_NONCE_KEY);
  // Belt-and-suspenders: wipe any legacy full-session blobs that older
  // versions may have written under these keys.
  window.localStorage.removeItem('luvax-auth');
  window.sessionStorage.removeItem('luvax-auth');
};

const initialState = {
  // Access token is in-memory only — never persisted to localStorage.
  accessToken: null,
  // Refresh token is in-memory only — ready to be migrated to HttpOnly cookie
  // flow; it is stripped from the persist partialize function below.
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  // Starts false; set to true only after persist middleware rehydrates.
  hasHydrated: false,
};

export const useAuthStore = create(
  persist(
    (set) => ({
      ...initialState,

      setAuth: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken: typeof accessToken === 'string' && accessToken.trim() ? accessToken : null,
          // refreshToken stays in memory; not persisted (see partialize below).
          refreshToken:
            typeof refreshToken === 'string' && refreshToken.trim() ? refreshToken : null,
          user: user ?? null,
          isAuthenticated: Boolean(accessToken),
        }),

      setTokens: ({ accessToken, refreshToken }) =>
        set((state) => {
          const nextAccessToken =
            typeof accessToken === 'string' && accessToken.trim() ? accessToken : null;
          const nextRefreshToken =
            typeof refreshToken === 'string' && refreshToken.trim()
              ? refreshToken
              : state.refreshToken ?? null;

          return {
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken,
            isAuthenticated: Boolean(nextAccessToken),
          };
        }),

      setAccessToken: (accessToken) =>
        set({
          accessToken:
            typeof accessToken === 'string' && accessToken.trim() ? accessToken : null,
          isAuthenticated: Boolean(accessToken),
        }),

      setRefreshToken: (refreshToken) =>
        set({
          refreshToken:
            typeof refreshToken === 'string' && refreshToken.trim() ? refreshToken : null,
        }),

      setUser: (user) =>
        set({
          user: user ?? null,
        }),

      setBootstrapping: (isBootstrapping) =>
        set({
          isBootstrapping,
        }),

      markHydrated: () =>
        set({
          hasHydrated: true,
        }),

      logout: () => {
        clearLegacyAuthStorage();

        set({
          ...initialState,
          isBootstrapping: false,
          // Hydration already happened before logout was possible.
          hasHydrated: true,
        });
      },
    }),
    {
      name: 'luvax-auth-session',
      storage: createJSONStorage(() => localStorage),

      /**
       * Only persist the fields that are safe to store in localStorage.
       * Access token and refresh token are intentionally excluded:
       * - accessToken: short-lived; should survive only the current tab session.
       * - refreshToken: must eventually move to an HttpOnly cookie set by the server.
       */
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),

      /**
       * onRehydrateStorage is called by persist middleware when hydration
       * completes (or fails). This is the single authoritative place that
       * sets hasHydrated to true, replacing the previous broken pattern of
       * initializing it to `true` before hydration ever ran.
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.markHydrated();
        }
      },
    }
  )
);
