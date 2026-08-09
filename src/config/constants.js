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
  VERIFY_EMAIL_NOTICE: '/verify-email-notice',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  OAUTH_CALLBACK: '/oauth2/callback',
  DASHBOARD: '/dashboard',

  // Authenticated area. Every screen inside /app has its own address, so any of
  // them can be linked, bookmarked, and reloaded.
  FEED: '/app',
  EXPLORE: '/app/explore',
  COMPOSE: '/app/compose',
  NOTIFICATIONS: '/app/notifications',
  MESSAGES: '/app/messages',
  SETTINGS: '/app/settings',
  EDIT_PROFILE: '/app/settings/profile',
  CHANGE_PASSWORD: '/app/settings/password',
  BLOCKED_USERS: '/app/settings/blocked',
  ONBOARDING: '/app/onboarding',
  STORY_COMPOSE: '/app/stories/new',

  // The viewer's own profile needs an address that can be built without knowing
  // an id, because the header avatar and the bottom-nav tab link to it while the
  // user object may still be loading.
  PROFILE: '/app/profile',

  // Parameterised paths. Build them with `routeTo` rather than interpolating
  // here, so no call site assembles a path by hand.
  USER_PROFILE: '/app/u/:userId',
  USER_FOLLOWERS: '/app/u/:userId/followers',
  USER_FOLLOWING: '/app/u/:userId/following',
  POST_DETAIL: '/app/p/:postId',
  STORY_VIEW: '/app/stories/:storyId',

  // Reserved for the search results screen. The screen does not exist yet, so no
  // route is registered and this address currently falls to the in-shell
  // not-found. Declared here so building the screen is a one-line router change
  // rather than another pass over the route table.
  SEARCH: '/app/search',

  NOT_FOUND: '*',
};

const withParams = (pattern, params) =>
  Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodeURIComponent(value ?? '')),
    pattern
  );

/** Builders for the parameterised routes above. */
export const routeTo = {
  userProfile: (userId) => withParams(ROUTES.USER_PROFILE, { userId }),
  userFollowers: (userId) => withParams(ROUTES.USER_FOLLOWERS, { userId }),
  userFollowing: (userId) => withParams(ROUTES.USER_FOLLOWING, { userId }),
  postDetail: (postId) => withParams(ROUTES.POST_DETAIL, { postId }),
  storyView: (storyId) => withParams(ROUTES.STORY_VIEW, { storyId }),
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
