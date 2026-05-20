import axios from 'axios';

import { useAuthStore } from '@/store/useAuthStore';

const ENV_API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const API_BASE_URL = import.meta.env.DEV ? '/api/v1' : ENV_API_URL || 'http://localhost:8080/api/v1';
const AUTH_WITH_CREDENTIALS = import.meta.env.VITE_AUTH_WITH_CREDENTIALS === 'true';
const REFRESH_PATH = '/auth/refresh';

const createClient = (config = {}) =>
  axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

export const publicClient = createClient();
export const axiosClient = createClient();

let isRefreshing = false;
let isRedirecting = false;
let refreshQueue = [];

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/verify-email/resend',
  '/auth/oauth2/exchange',
];

export const getTokenFromResponse = (payload) =>
  payload?.accessToken ??
  payload?.token ??
  payload?.data?.accessToken ??
  payload?.data?.token ??
  payload?.data?.access_token ??
  payload?.access_token ??
  null;

export const getRefreshTokenFromResponse = (payload) =>
  payload?.refreshToken ??
  payload?.data?.refreshToken ??
  payload?.data?.refresh_token ??
  payload?.refresh_token ??
  null;

const isSkippableRequest = (config = {}) => {
  const url = config.url || '';
  return (
    config.skipAuthRefresh ||
    url.includes(REFRESH_PATH) ||
    PUBLIC_AUTH_PATHS.some((path) => url.includes(path))
  );
};

const flushRefreshQueue = (error, nextAuth = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(nextAuth);
  });

  refreshQueue = [];
};

export const clearAuthAndRedirect = () => {
  useAuthStore.getState().logout();

  if (typeof window === 'undefined' || isRedirecting) {
    return;
  }

  isRedirecting = true;

  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
    return;
  }

  isRedirecting = false;
};

const persistAuthSession = ({ accessToken, refreshToken, user }) => {
  const { setAuth, setTokens } = useAuthStore.getState();

  if (user !== undefined) {
    setAuth({ accessToken, refreshToken, user });
    return;
  }

  setTokens({ accessToken, refreshToken });
};

const refreshAccessToken = async () => {
  const { refreshToken } = useAuthStore.getState();

  if (!refreshToken) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await publicClient.post(
    REFRESH_PATH,
    { refreshToken },
    {
      skipAuthRefresh: true,
      withCredentials: AUTH_WITH_CREDENTIALS,
    }
  );

  const payload = response?.data;
  const nextAccessToken = getTokenFromResponse(payload);
  const nextRefreshToken = getRefreshTokenFromResponse(payload) || refreshToken;

  if (!nextAccessToken) {
    throw new Error('Refresh response did not include an access token.');
  }

  persistAuthSession({
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
  });

  return {
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
  };
};

axiosClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || isSkippableRequest(originalRequest)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: ({ accessToken }) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            resolve(axiosClient(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const nextAuth = await refreshAccessToken();

      flushRefreshQueue(null, nextAuth);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${nextAuth.accessToken}`;

      return axiosClient(originalRequest);
    } catch (refreshError) {
      flushRefreshQueue(refreshError);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { API_BASE_URL, AUTH_WITH_CREDENTIALS, REFRESH_PATH };
