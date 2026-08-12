/**
 * Global utility helpers
 */

/**
 * Formats a number as currency.
 * @param {number} value
 * @param {string} [locale='en-US']
 * @param {string} [currency='USD']
 * @returns {string}
 */
export function formatCurrency(value, locale = 'en-US', currency = 'USD') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

/**
 * Formats a Date object or ISO string to a localized date string.
 * @param {Date|string} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDate(date, options = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
}

/**
 * Truncates a string to maxLength and appends an ellipsis.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength)}…`;
}

/**
 * Creates a sleep/delay promise.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely parses a JSON string, returning a fallback on failure.
 * @template T
 * @param {string} jsonString
 * @param {T} fallback
 * @returns {T}
 */
export function safeJsonParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Extracts the content array from a paginated API response page,
 * falling back through the shapes callers commonly receive.
 * @param {{data?: {content?: Array}, content?: Array}} page
 * @returns {Array}
 */
export function extractPageContent(page) {
  return page?.data?.content ?? page?.content ?? [];
}

/**
 * Extracts the pagination cursor block from a paginated API response page.
 *
 * The backend nests these under `pageInfo` (CursorPageResponse.PageInfo).
 * Reading `hasNextPage` or `endCursor` off the page root yields undefined,
 * which silently stops infinite scroll after the first page.
 * @param {{data?: {pageInfo?: object}, pageInfo?: object}} page
 * @returns {{hasNextPage?: boolean, hasPreviousPage?: boolean, startCursor?: string, endCursor?: string}}
 */
export function extractPageInfo(page) {
  return page?.data?.pageInfo ?? page?.pageInfo ?? {};
}

/**
 * Reports whether a cursor page told us its results may be incomplete.
 *
 * The flag sits on the page itself, beside `content` and `pageInfo`, not
 * inside `pageInfo`. Verified against the running server.
 *
 * It rides on every cursor-paginated response because they share one envelope,
 * and it is false everywhere except post search with its search backend down.
 * It is not a general health signal and must not be read as one on any other
 * endpoint. Hashtag search deliberately never sets it: its fallback answers
 * from the primary database, so those results are complete and only the
 * ranking differs.
 * @param {{data?: {degraded?: boolean}, degraded?: boolean}} page
 * @returns {boolean}
 */
export function isPageDegraded(page) {
  return Boolean(page?.data?.degraded ?? page?.degraded);
}

/**
 * Returns the next cursor for an infinite query, or undefined when the
 * server reports no further page.
 * @param {object} page a raw ApiResponse page wrapping a CursorPageResponse
 * @returns {string|undefined}
 */
export function getNextCursor(page) {
  const pageInfo = extractPageInfo(page);

  // A page that carries content but no pageInfo means pagination silently
  // stops after the first page, which is invisible without this warning.
  if (!('hasNextPage' in pageInfo)) {
    warnOnShapeDrift(page?.data ?? page, 'pageInfo', 'pagination cursor block');
  }

  return pageInfo.hasNextPage ? pageInfo.endCursor : undefined;
}

/**
 * Reports a response that does not carry the field an accessor expected.
 *
 * This is the guard against the defect class these accessors exist to prevent:
 * the frontend reading a path the backend does not serve. Without it the read
 * yields undefined, the interface renders a placeholder, and nothing indicates
 * the contract drifted.
 *
 * Development only. It never throws and never runs in a production build,
 * because a shape the client did not expect is still a shape the user should
 * be shown whatever we can render of.
 *
 * An empty or absent source is not drift: lists render before their first
 * response arrives, and an absent object legitimately has no fields.
 * @param {object} source the response object that was read
 * @param {string} key the field expected on it
 * @param {string} label what the field was expected to contain
 */
function warnOnShapeDrift(source, key, label) {
  if (!import.meta.env.DEV) return;
  if (!source || typeof source !== 'object' || Object.keys(source).length === 0) return;

  console.error(
    `[response shape] expected a ${label} at "${key}" but the response did not carry one. ` +
      `Keys present: ${Object.keys(source).join(', ')}.`
  );
}

/**
 * A user summary with every field defined, used when a response carries no
 * author. Frozen so callers cannot mutate the shared instance.
 */
const ABSENT_USER_SUMMARY = Object.freeze({
  id: null,
  username: null,
  displayName: null,
  avatarUrl: null,
  isVerified: false,
});

/**
 * Reads the embedded `UserSummaryResponse` from a post, comment, or
 * notification.
 *
 * The backend embeds the author as an object under `author` (posts and
 * comments) or `actor` (notifications). There is no flattened `username`,
 * `userId`, or `userAvatarUrl` on any of those responses, so reading those
 * names yields undefined and, for `author`, hands the raw object to whatever
 * consumes it.
 * @param {object} source the post, comment, or notification
 * @param {'author'|'actor'} [key] which embedded summary to read
 * @returns {{id: ?string, username: ?string, displayName: ?string, avatarUrl: ?string, isVerified: boolean}}
 */
export function getUserSummary(source, key = 'author') {
  const summary = source?.[key];

  if (summary && typeof summary === 'object') {
    return summary;
  }

  warnOnShapeDrift(source, key, 'user summary');
  return ABSENT_USER_SUMMARY;
}

/**
 * Resolves the name to show for a user summary, preferring the display name
 * and falling back to the handle.
 * @param {object} summary a UserSummaryResponse
 * @param {string} [fallback] rendered when the summary carries neither
 * @returns {string}
 */
export function getDisplayName(summary, fallback = 'unknown') {
  return summary?.displayName || summary?.username || fallback;
}

/**
 * Formats a denormalised counter for display.
 *
 * `PublicUserProfileResponse` returns `followerCount`, `followingCount`, and
 * `postCount` as null when the viewer may not see them: an anonymous caller,
 * or a non-follower of a private account. Rendering the raw null produces a
 * blank where a number belongs, so hidden counts render as an en dash.
 * @param {?number} count
 * @returns {string}
 */
export function formatCount(count) {
  return typeof count === 'number' ? String(count) : '–';
}

/**
 * Copies arbitrary text to the clipboard, falling back to a prompt dialog
 * when the Clipboard API is unavailable.
 * @param {string} text
 * @param {string} [promptMessage='copy text']
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text, promptMessage = 'copy text') {
  if (!text) return;
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  window.prompt(promptMessage, text);
}

/**
 * Builds a shareable link for a post, falling back to a deep-link scheme
 * when `window` is unavailable (e.g. server-side rendering).
 * @param {string} postId
 * @returns {string}
 */
export function buildPostLink(postId) {
  if (typeof window === 'undefined') return `luvax://post/${postId}`;
  return `${window.location.origin}${window.location.pathname}#post-${postId}`;
}

/**
 * Copies a post's shareable link to the clipboard.
 * @param {string} postId
 * @returns {Promise<void>}
 */
export async function copyPostLink(postId) {
  const link = buildPostLink(postId);
  await copyToClipboard(link, 'copy link');
}

/**
 * Shares a post via the native Web Share API, falling back to copying
 * the post's link to the clipboard when sharing is unavailable.
 * @param {string} postId
 * @param {string} [title]
 * @returns {Promise<void>}
 */
export async function sharePost(postId, title) {
  const link = buildPostLink(postId);
  if (navigator?.share) {
    await navigator.share({ title: title || 'luvax post', url: link });
    return;
  }
  await copyPostLink(postId);
}

/**
 * Whether a post media entry is a video.
 *
 * The backend serialises the MediaType enum in lower case ("image" / "video"),
 * matching the PostgreSQL enum. Comparing against "VIDEO" never matches and
 * silently routes every video through the image branch.
 * @param {{mediaType?: string}} media
 * @returns {boolean}
 */
export function isVideoMedia(media) {
  return media?.mediaType === 'video';
}
