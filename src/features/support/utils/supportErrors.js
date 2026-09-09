/**
 * Support error codes, and the sentences the interface shows for them.
 *
 * The rule the panel already follows applies here: branch on the response
 * envelope's `code`, never on `message`. The Axios interceptor rewrites
 * `error.message` to a safe string but leaves `error.response.data.code`
 * intact.
 *
 * Several of these exist precisely so a refusal can be explained rather than
 * shown as a generic 403, and using the server's own prose would throw that
 * away.
 */

/** Reads the backend error code from the envelope the interceptor preserves. */
export const getSupportErrorCode = (error) => error?.response?.data?.code ?? null;

const MESSAGES = {
  // The viewer took the decision this ticket is appealing. Distinct from a
  // plain permission refusal, and the reason is the point.
  SUPPORT_CONFLICT_OF_INTEREST:
    'you took the action this ticket is appealing, so you cannot act on it. hand it to another reviewer.',
  // A moderator on an appeal. They may read it and escalate it, and that is the
  // route the message names rather than leaving them at a dead end.
  SUPPORT_APPEAL_REQUIRES_ADMIN:
    'only an administrator can answer an appeal. escalate it and an administrator will pick it up.',
  SUPPORT_TICKET_ALREADY_CLAIMED: 'another reviewer claimed this first.',
  SUPPORT_TICKET_NOT_CLAIMED: 'claim this ticket before acting on it.',
  SUPPORT_TICKET_INVALID_TRANSITION: 'this ticket has already been answered.',
  SUPPORT_TICKET_ALREADY_OPEN: 'you already have an open request.',
  SUPPORT_TICKET_NOT_FOUND: 'that request no longer exists.',
  SUPPORT_TOKEN_INVALID: 'this link is invalid or has already been used.',
  SUPPORT_CAPTCHA_FAILED: 'the challenge was not accepted. try it again.',
  SUPPORT_DAILY_LIMIT_REACHED: 'too many requests from here. try again later.',
  SUPPORT_CATEGORY_NOT_PUBLIC: 'that category cannot be used on this form.',
  VERIFICATION_INSUFFICIENT_EVIDENCE: 'fill at least three evidence fields.',
  VERIFICATION_ALREADY_VERIFIED: 'this account already holds a badge.',
  TOO_MANY_REQUESTS: 'too many requests. wait a moment and try again.',
};

/**
 * A sentence for a support failure.
 *
 * @param {unknown} error an Axios error
 * @param {string} fallback what to say when the code is not one of ours
 * @returns {string} lowercase, human copy for the interface
 */
export const describeSupportError = (error, fallback = 'that did not work. try again.') => {
  const code = getSupportErrorCode(error);
  return MESSAGES[code] ?? fallback;
};

/** True when the refusal is the conflict-of-interest rule rather than a role rule. */
export const isConflictOfInterest = (error) =>
  getSupportErrorCode(error) === 'SUPPORT_CONFLICT_OF_INTEREST';

/** True when a moderator was refused an appeal decision and should escalate instead. */
export const isAppealRequiresAdmin = (error) =>
  getSupportErrorCode(error) === 'SUPPORT_APPEAL_REQUIRES_ADMIN';

/** True when another reviewer won the claim race; the caller refetches. */
export const isClaimCollision = (error) =>
  getSupportErrorCode(error) === 'SUPPORT_TICKET_ALREADY_CLAIMED';

/** True when the one-open-ticket rule refused a second request. */
export const isAlreadyOpen = (error) =>
  getSupportErrorCode(error) === 'SUPPORT_TICKET_ALREADY_OPEN';

/** True when a single-use link was already redeemed, or never valid. */
export const isTokenInvalid = (error) => getSupportErrorCode(error) === 'SUPPORT_TOKEN_INVALID';

/** True when Turnstile refused. A distinct state from a validation failure. */
export const isCaptchaFailure = (error) => getSupportErrorCode(error) === 'SUPPORT_CAPTCHA_FAILED';

/** True when the public path's rate limit refused. */
export const isRateLimited = (error) =>
  getSupportErrorCode(error) === 'SUPPORT_DAILY_LIMIT_REACHED' ||
  getSupportErrorCode(error) === 'TOO_MANY_REQUESTS' ||
  error?.response?.status === 429;
