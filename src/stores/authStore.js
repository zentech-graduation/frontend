import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * authStore — global authentication state.
 *
 * Persisted to localStorage via Zustand persist middleware.
 * Add real login/logout logic here when building the auth feature.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      // ── State ───────────────────────────────────────────────────────────────
      user: null,
      token: null,
      isAuthenticated: false,

      // ── Actions ─────────────────────────────────────────────────────────────

      /** Called after a successful login response. */
      login: (payload) =>
        set({
          user: payload.user,
          token: payload.token,
          isAuthenticated: true,
        }),

      /** Clears all auth state. */
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'luvax-auth',                            // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({                      // only persist these keys
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
