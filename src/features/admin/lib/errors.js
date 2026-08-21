/**
 * Error handling for the panel.
 *
 * The rule is to branch on the response envelope's `code`, never on `message`.
 * The shared Axios interceptor rewrites `error.message` to a safe string but
 * leaves `error.response.data.code` intact, so the code is read from there.
 *
 * Every error is classified into one of four kinds:
 * - `field`  a validation failure carrying a field-name-to-message map
 * - `toast`  a transient message shown and dismissed
 * - `page`   a full-page state such as not-found or a role refusal
 * - `silent` handled without any user-facing message, such as a stale cursor
 *
 * A separate `isConflict` flag marks the two "another reviewer acted first"
 * codes, which are shown as a calm toast and followed by a refetch rather than
 * an alarming dialogue.
 */

/** Reads the backend error code from the envelope the interceptor preserves. */
export const getErrorCode = (error) => error?.response?.data?.code ?? null;

/** The field-name-to-message map carried only by VALIDATION_ERROR. */
export const getFieldErrors = (error) => {
  const data = error?.response?.data?.data;
  return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
};

/**
 * Reads `Retry-After` (seconds) from a 429 response. The header is exposed to
 * the browser through the API's CORS configuration, so it is readable here.
 */
export const getRetryAfterSeconds = (error) => {
  const raw = error?.response?.headers?.['retry-after'];
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const PAGE_CODES = new Set([
  'FORBIDDEN',
  'USER_NOT_FOUND',
  'REPORT_NOT_FOUND',
  'ADMIN_ACTION_NOT_FOUND',
  'POST_NOT_FOUND',
  'COMMENT_NOT_FOUND',
]);

// "Another reviewer acted first" and "the entity is already in that state".
// Both are shown calmly and followed by a refetch, never a raw error.
const CONFLICT_CODES = new Set(['REPORT_INVALID_TRANSITION', 'ADMIN_INVALID_TRANSITION']);

/**
 * Classifies an Axios error into a kind the caller can act on.
 *
 * @param {unknown} error an Axios error whose message the interceptor normalised
 * @returns {{kind: 'field'|'toast'|'page'|'silent', code: string|null,
 *   message: string, fields: Object|null, retryAfterSeconds: number|null,
 *   isConflict: boolean}}
 */
export const describeError = (error) => {
  const code = getErrorCode(error);
  const message = error?.message || 'Something went wrong.';

  if (code === 'VALIDATION_ERROR') {
    return {
      kind: 'field',
      code,
      message,
      fields: getFieldErrors(error) ?? {},
      retryAfterSeconds: null,
      isConflict: false,
    };
  }

  if (code === 'INVALID_CURSOR') {
    return { kind: 'silent', code, message: '', fields: null, retryAfterSeconds: null, isConflict: false };
  }

  if (code === 'TOO_MANY_REQUESTS') {
    return {
      kind: 'toast',
      code,
      message,
      fields: null,
      retryAfterSeconds: getRetryAfterSeconds(error),
      isConflict: false,
    };
  }

  if (PAGE_CODES.has(code)) {
    return { kind: 'page', code, message, fields: null, retryAfterSeconds: null, isConflict: false };
  }

  if (CONFLICT_CODES.has(code)) {
    return { kind: 'toast', code, message, fields: null, retryAfterSeconds: null, isConflict: true };
  }

  return { kind: 'toast', code, message, fields: null, retryAfterSeconds: null, isConflict: false };
};

/** True for the codes that mean another reviewer or a double submit won the race. */
export const isConflictError = (error) => CONFLICT_CODES.has(getErrorCode(error));

/** True for a 429, which the caller must never auto-retry. */
export const isRateLimited = (error) =>
  getErrorCode(error) === 'TOO_MANY_REQUESTS' || error?.response?.status === 429;
