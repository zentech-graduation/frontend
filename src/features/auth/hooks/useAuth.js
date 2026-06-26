import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from '@/config/constants';
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
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
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
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(refreshToken),
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
  const isAuthenticated = Boolean(useAuthStore((state) => state.accessToken));

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authService.getMe(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ─── useRegister ──────────────────────────────────────────────────────────────
/**
 * Mutation hook for user registration.
 * On success, navigates to email verification notice page.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data) => authService.register(data),
    onSuccess: () => {
      navigate(ROUTES.VERIFY_EMAIL_NOTICE, { replace: true });
    },
  });
}

// ─── useForgotPassword ────────────────────────────────────────────────────────
/**
 * Mutation hook for initiating a password reset flow.
 * Sends a password reset email to the provided email address.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data) => authService.forgotPassword(data),
  });
}

// ─── useResetPassword ──────────────────────────────────────────────────────────
/**
 * Mutation hook for resetting a password with a reset token.
 * On success, navigates to login page with a success message.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data) => authService.resetPassword(data),
    onSuccess: () => {
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { resetSuccess: 'Your password has been reset. Sign in with your new password.' },
      });
    },
  });
}

// ─── useResendVerification ────────────────────────────────────────────────────
/**
 * Mutation hook for resending an email verification token.
 * Used when the initial token expires or is lost.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useResendVerification() {
  return useMutation({
    mutationFn: (data) => authService.resendVerification(data),
  });
}

// ─── useVerifyEmail ───────────────────────────────────────────────────────────
/**
 * Mutation hook for verifying an email address with a verification token.
 * On success with tokens, logs in the user and navigates to the app.
 * If no tokens are returned, navigates to login with a success message.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useVerifyEmail() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: (token) => authService.verifyEmail({ token }),
    onSuccess: (data) => {
      if (data?.accessToken) {
        setAuth({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          user: data.user ?? null,
        });
        navigate(ROUTES.APP, { replace: true });
      } else {
        navigate(ROUTES.LOGIN, {
          replace: true,
          state: { verificationSuccess: 'Your email has been verified. Sign in to continue.' },
        });
      }
    },
  });
}

// ─── useExchangeOAuth2Code ────────────────────────────────────────────────────
/**
 * Mutation hook for exchanging an OAuth2 authorization code for an access token.
 * On success, saves the session to the Zustand auth store and navigates to the app.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useExchangeOAuth2Code() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: (code) => authService.exchangeOAuthCode(code),
    onSuccess: (data) => {
      if (data?.accessToken) {
        setAuth({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          user: data.user ?? null,
        });
        navigate(ROUTES.APP, { replace: true });
      }
    },
  });
}
