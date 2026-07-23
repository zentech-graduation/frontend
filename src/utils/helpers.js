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
