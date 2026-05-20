import { create } from 'zustand';

const AUTH_STORAGE_KEY = 'luvax-auth';
const GOOGLE_OAUTH_STATE_KEY = 'luvax-google-oauth-state';
const GOOGLE_OAUTH_NONCE_KEY = 'luvax-google-oauth-nonce';

export const clearLegacyAuthStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
  window.sessionStorage.removeItem(GOOGLE_OAUTH_NONCE_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  hasHydrated: true,
};

export const useAuthStore = create((set) => ({
  ...initialState,

  setAuth: ({ accessToken, refreshToken, user }) =>
    set({
      accessToken: typeof accessToken === 'string' && accessToken.trim() ? accessToken : null,
      refreshToken: typeof refreshToken === 'string' && refreshToken.trim() ? refreshToken : null,
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
      accessToken: typeof accessToken === 'string' && accessToken.trim() ? accessToken : null,
      isAuthenticated: Boolean(accessToken),
    }),

  setRefreshToken: (refreshToken) =>
    set({
      refreshToken: typeof refreshToken === 'string' && refreshToken.trim() ? refreshToken : null,
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
      hasHydrated: true,
    });
  },
}));
