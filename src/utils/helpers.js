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
