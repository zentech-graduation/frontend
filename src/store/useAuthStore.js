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

/**
 * Legacy-blob migration: strips `accessToken`/`refreshToken` from the raw
 * `luvax-auth-session` blob in localStorage. Earlier versions of this store
 * persisted both tokens to disk; this scrubs any such leftover blob without
 * forcing a logout — by the time this runs, `persist` has already merged the
 * blob into the live in-memory state, so the current tab keeps a working
 * session while the on-disk copy is cleaned. Runs on every hydration but is
 * idempotent (no-op once nothing is left to strip).
 */
const migrateLegacyPersistedTokens = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const raw = window.localStorage.getItem('luvax-auth-session');
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.state || (!('accessToken' in parsed.state) && !('refreshToken' in parsed.state))) {
      return;
    }

    delete parsed.state.accessToken;
    delete parsed.state.refreshToken;
    window.localStorage.setItem('luvax-auth-session', JSON.stringify(parsed));
  } catch {
    // Malformed persisted blob — leave it for the persist middleware to overwrite normally.
  }
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
       * Persist only `user` and `isAuthenticated` to localStorage so the UI
       * can render an optimistic "logged-in" shell immediately on reload.
       * `accessToken` and `refreshToken` are intentionally excluded — they
       * live in memory only. A full page reload will clear both tokens from
       * memory, so a live session does NOT survive a reload; the user must
       * sign in again. ProtectedRoute checks both flags (isAuthenticated + a
       * live accessToken) together because one persisted flag is not enough
       * to guarantee a working session.
       */
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),

      /**
       * onRehydrateStorage is called by persist middleware when hydration
       * completes (or fails). This is the single authoritative place that
       * sets hasHydrated to true, replacing the previous broken pattern of
       * initializing it to `true` before hydration ever ran. It also runs
       * the one-time legacy-token migration (see migrateLegacyPersistedTokens).
       */
      onRehydrateStorage: () => (state) => {
        migrateLegacyPersistedTokens();
        if (state) {
          state.markHydrated();
        }
      },
    }
  )
);
