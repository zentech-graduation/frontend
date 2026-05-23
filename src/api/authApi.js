import {
  AUTH_WITH_CREDENTIALS,
  axiosClient,
  getRefreshTokenFromResponse,
  getTokenFromResponse,
  publicClient,
} from '@/api/axiosClient';
import { useAuthStore } from '@/store/useAuthStore';

const GOOGLE_OAUTH_STATE_KEY = 'luvax-google-oauth-state';
const GOOGLE_OAUTH_NONCE_KEY = 'luvax-google-oauth-nonce';
const DEFAULT_GOOGLE_REDIRECT_PATH = '/oauth/callback';

const getPayload = (response) => response?.data?.data ?? response?.data ?? {};

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : email);

const normalizeUser = (payload) => {
  const rawUser = payload?.user ?? payload?.data?.user ?? payload?.profile ?? payload ?? null;

  if (!rawUser || typeof rawUser !== 'object') {
    return rawUser;
  }

  return {
    ...rawUser,
    name: rawUser.name ?? rawUser.displayName ?? null,
    displayName: rawUser.displayName ?? rawUser.name ?? null,
  };
};

const normalizeMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

const buildRequestBody = (payload = {}) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }

      if (typeof value === 'string') {
        return value.trim().length > 0;
      }

      return true;
    })
  );

const extractAuthSession = (response) => {
  const payload = getPayload(response);

  return {
    accessToken: getTokenFromResponse(response?.data),
    refreshToken: getRefreshTokenFromResponse(response?.data),
    user: normalizeUser(payload),
    message: payload?.message ?? response?.data?.message ?? null,
  };
};

const normalizeVerificationPayload = (values = {}) => {
  const token = values?.token?.trim?.() || values?.otp?.trim?.() || values?.code?.trim?.() || '';

  return {
    token,
    email: normalizeEmail(values?.email),
  };
};

export const authApi = {
  async login(values) {
    const response = await publicClient.post(
      '/auth/login',
      buildRequestBody({
        email: normalizeEmail(values?.email),
        password: values?.password,
      })
    );

    return extractAuthSession(response);
  },

  async register(values) {
    const response = await publicClient.post(
      '/auth/register',
      buildRequestBody({
        displayName: values?.name,
        username: values?.username,
        email: normalizeEmail(values?.email),
        password: values?.password,
      })
    );

    return extractAuthSession(response);
  },

  async logout(refreshToken = useAuthStore.getState().refreshToken) {
    await publicClient.post(
      '/auth/logout',
      buildRequestBody({
        refreshToken: refreshToken ?? undefined,
      }),
      {
        withCredentials: AUTH_WITH_CREDENTIALS,
      }
    );
  },

  async refreshSession(refreshToken = useAuthStore.getState().refreshToken) {
    const response = await publicClient.post(
      '/auth/refresh',
      buildRequestBody({
        refreshToken: refreshToken ?? undefined,
      }),
      {
        withCredentials: AUTH_WITH_CREDENTIALS,
        skipAuthRefresh: true,
      }
    );

    return extractAuthSession(response);
  },

  async getCurrentUser() {
    const response = await axiosClient.get('/users/me');
    return normalizeUser(getPayload(response));
  },

  async verifyEmail(values) {
    const verification = normalizeVerificationPayload(values);

    if (!verification.token) {
      throw new Error('Verification token is required.');
    }

    const response = await publicClient.get('/auth/verify-email', {
      params: {
        token: verification.token,
      },
    });

    return getPayload(response);
  },

  async resendVerification(values) {
    const response = await publicClient.post(
      '/auth/verify-email/resend',
      buildRequestBody({
        email: normalizeEmail(values?.email),
      })
    );

    return getPayload(response);
  },

  async forgotPassword(values) {
    const response = await publicClient.post(
      '/auth/forgot-password',
      buildRequestBody({
        email: normalizeEmail(values?.email),
      })
    );

    return getPayload(response);
  },

  async resetPassword(values) {
    const verification = normalizeVerificationPayload(values);
    const nextPassword = values?.newPassword ?? values?.password ?? '';

    const response = await publicClient.post(
      '/auth/reset-password',
      buildRequestBody({
        token: verification.token || undefined,
        email: verification.email || undefined,
        newPassword: nextPassword,
      })
    );

    return getPayload(response);
  },

  async exchangeOAuthToken(accessToken) {
    const response = await publicClient.post(
      '/auth/oauth2/exchange',
      buildRequestBody({
        token: accessToken,
      })
    );

    return extractAuthSession(response);
  },

  createGoogleOAuthState() {
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
    sessionStorage.setItem(GOOGLE_OAUTH_NONCE_KEY, nonce);

    return { state, nonce };
  },

  consumeGoogleOAuthState() {
    const state = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
    const nonce = sessionStorage.getItem(GOOGLE_OAUTH_NONCE_KEY);

    sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
    sessionStorage.removeItem(GOOGLE_OAUTH_NONCE_KEY);

    return { state, nonce };
  },

  buildGoogleRedirectUri() {
    const redirectPath = import.meta.env.VITE_GOOGLE_REDIRECT_PATH || DEFAULT_GOOGLE_REDIRECT_PATH;
    return `${window.location.origin}${redirectPath}`;
  },

  getGoogleOAuthUrl() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error('Missing VITE_GOOGLE_CLIENT_ID for Google OAuth.');
    }

    const { state, nonce } = this.createGoogleOAuthState();
    const redirectUri = this.buildGoogleRedirectUri();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      // Authorization-code flow only. The implicit flow (token id_token) is
      // retired — tokens must never be delivered via the URL fragment.
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      include_granted_scopes: 'true',
      state,
      nonce,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  getGoogleLoginUrl() {
    const envGoogleAuthUrl = import.meta.env.VITE_GOOGLE_AUTH_URL;

    if (envGoogleAuthUrl) {
      return envGoogleAuthUrl;
    }

    if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      return this.getGoogleOAuthUrl();
    }

    throw new Error(
      'Google OAuth is not configured. Add VITE_GOOGLE_CLIENT_ID for frontend-only OAuth or VITE_GOOGLE_AUTH_URL for a backend redirect endpoint.'
    );
  },

  // decodeJwt and buildUserFromGoogleClaims have been intentionally removed.
  // Parsing JWTs client-side via window.atob provides no integrity guarantee —
  // an attacker can forge any claims in the base64 payload. User identity must
  // be established exclusively by the backend after verifying the token
  // signature. Profile data is fetched from /users/me post-exchange.

  normalizeMessage,
};
