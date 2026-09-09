import { axiosClient, publicClient } from '@/api/axiosClient';
import { buildBody, pickParams } from '@/utils/requestContract';

/**
 * The support module's wire layer.
 *
 * Two clients, deliberately. The three anonymous paths use `publicClient`: an
 * appeal link is followed by an account that is banned, so it holds no session
 * and `axiosClient` would try to refresh one it never had. Everything else uses
 * `axiosClient`.
 *
 * Every request body is assembled field by field through `buildBody`, and every
 * query string through `pickParams`, because the backend rejects an undeclared
 * body field or query parameter with 400. Spreading form state into a request
 * fails here.
 */

/**
 * The wire form of a support category.
 *
 * The vocabulary endpoint returns lowercase keys (`appeal_ban`) while the
 * request DTOs bind a Java enum, which Jackson reads by its uppercase constant
 * name and rejects case-insensitively. Sending the key as it arrives answers
 * `MALFORMED_REQUEST_BODY`, so the seam is crossed here rather than at each
 * call site.
 *
 * @param {string} categoryKey a key from the vocabulary endpoint
 * @returns {string} the enum constant name the API binds
 */
export const toCategoryEnum = (categoryKey) => String(categoryKey ?? '').toUpperCase();

/** The inverse, for matching a response's enum back to a vocabulary row. */
export const toCategoryKey = (categoryEnum) => String(categoryEnum ?? '').toLowerCase();

const unwrap = (response) => response?.data?.data;

/** Creates a ticket as the signed-in account. */
export const createTicket = async ({ category, subject, body }) =>
  unwrap(
    await axiosClient.post(
      '/support/tickets',
      buildBody({
        category: toCategoryEnum(category),
        subject,
        body,
      })
    )
  );

/** The caller's own tickets, newest first. */
export const listOwnTickets = async ({ limit = 20 } = {}) =>
  unwrap(await axiosClient.get('/support/tickets', { params: pickParams({ limit }, ['limit']) }));

/** One of the caller's own tickets. Never carries an internal note. */
export const getOwnTicket = async (ticketId) =>
  unwrap(await axiosClient.get(`/support/tickets/${ticketId}`));

/**
 * Redeems the single-use token from a moderation notice.
 *
 * Anonymous by design. The account this is submitted for is banned or
 * suspended, so it cannot reach an authenticated endpoint at all, and the
 * backend mints no session in return: this call authorises exactly one write
 * and hands back nothing that could be used as a credential.
 *
 * The category is taken from the token server-side, never from here, so a
 * submitter cannot appeal something the token did not authorise.
 */
export const createAppeal = async ({ token, subject, body }) =>
  unwrap(await publicClient.post('/support/appeal', buildBody({ token, subject, body })));

/** Submits the anonymous public form. Turnstile is verified before anything is written. */
export const createPublicTicket = async ({
  contactEmail,
  category,
  subject,
  body,
  turnstileToken,
}) =>
  unwrap(
    await publicClient.post(
      '/support/public/tickets',
      buildBody({
        contactEmail,
        category: toCategoryEnum(category),
        subject,
        body,
        turnstileToken,
      })
    )
  );

/**
 * Confirms the address a public submission named, making the ticket visible to
 * staff.
 *
 * The token goes in the query string, not the body: this endpoint declares
 * `@RequestParam("token")` while the appeal endpoint next to it takes a body.
 * Sending a body here answers `MISSING_REQUIRED_PARAMETER`.
 */
export const confirmPublicTicket = async (token) =>
  unwrap(
    await publicClient.post('/support/public/confirm', null, {
      params: pickParams({ token }, ['token']),
    })
  );

/** The eight verification categories, with the icon key a client maps to a glyph. */
export const listVerificationCategories = async () =>
  unwrap(await axiosClient.get('/support/verification/categories'));

/** The caller's own verification state: an active grant, an open request, or neither. */
export const getVerificationState = async () =>
  unwrap(await axiosClient.get('/support/verification/me'));

/**
 * Submits a verification request.
 *
 * Written out field by field rather than spread, so an evidence field renamed
 * on the form cannot silently reach the wire under the wrong name.
 */
export const createVerificationRequest = async (values) =>
  unwrap(
    await axiosClient.post(
      '/support/verification/requests',
      buildBody({
        categoryKey: values.categoryKey,
        claimedName: values.claimedName,
        evidenceWebsite: values.evidenceWebsite,
        evidenceOtherProfile: values.evidenceOtherProfile,
        evidenceEmailDomain: values.evidenceEmailDomain,
        evidencePublishedWork: values.evidencePublishedWork,
        evidencePress: values.evidencePress,
        evidenceAward: values.evidenceAward,
        evidenceOther: values.evidenceOther,
      })
    )
  );

/**
 * The support category vocabulary.
 *
 * Read from the shared config endpoint rather than hardcoded, so adding a
 * category is a backend change and the selector follows. Carries `isAppeal`,
 * `allowsPublicForm` and `isEnabled`, which decide which categories each of the
 * three entry paths may offer.
 */
export const listSupportCategories = async () => {
  const vocabularies = unwrap(await axiosClient.get('/config/vocabularies'));
  return vocabularies?.supportCategories ?? [];
};
