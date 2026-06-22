/** Global app constants */

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MyApp';

const ENV_API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const API_URL = import.meta.env.DEV ? '/api/v1' : ENV_API_URL || 'http://localhost:8080/api/v1';

/** Route paths — single source of truth for navigation */
export const ROUTES = {
  HOME: '/',
  APP: '/app',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  OAUTH_CALLBACK: '/oauth2/callback',
  OAUTH_CALLBACK_ALT: '/oauth/callback',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  NOT_FOUND: '*',
};

/** Query cache stale times (ms) */
export const STALE_TIME = {
  SHORT: 30_000,      // 30 seconds
  MEDIUM: 5 * 60_000, // 5 minutes
  LONG: 30 * 60_000,  // 30 minutes
};

/** HTTP status codes */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};
