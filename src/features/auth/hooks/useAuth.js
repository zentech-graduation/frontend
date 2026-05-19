import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import authService from '../services/authService';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const authKeys = {
  all: ['auth'],
  me: () => [...authKeys.all, 'me'],
};

// ─── useLogin ─────────────────────────────────────────────────────────────────
/**
 * Mutation hook for logging in.
 * On success, saves the session to the Zustand auth store.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useLogin() {
  const login = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      // Persist token + user in Zustand (+ localStorage via persist middleware)
      login({ user: data.user, token: data.token });
      // Pre-populate the "me" cache so the first render doesn't refetch
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

// ─── useLogout ────────────────────────────────────────────────────────────────
/**
 * Mutation hook for logging out.
 * Clears Zustand state and invalidates all auth cache.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

// ─── useCurrentUser ───────────────────────────────────────────────────────────
/**
 * Query hook for fetching the current authenticated user profile.
 * Only runs when the user is authenticated.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authService.getMe(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
