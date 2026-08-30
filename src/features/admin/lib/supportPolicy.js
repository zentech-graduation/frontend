import { isAdminRole } from '@/config/roles';

/**
 * The client-side mirror of the backend's support and campaign rules.
 *
 * These are a mirror, never the enforcement. The backend refuses each of them
 * independently, so hiding a control here only spares a round trip. They live in
 * one testable module rather than inline in the screens precisely so the rules
 * can be asserted directly against the backend's documented behaviour.
 */

/** The four restricted categories. */
export const isAppealCategory = (category) =>
  typeof category === 'string' && category.startsWith('appeal_');

/**
 * Whether the viewer may answer or close this ticket.
 *
 * A moderator may not decide an appeal. Unban, unsuspend, revoke-warning and
 * revoke-strike are all administrator-only actions, so a moderator closing an
 * appeal would record a verdict they have no capability to carry out. The
 * backend refuses it with SUPPORT_APPEAL_REQUIRES_ADMIN.
 */
export const canDecideTicket = (ticket, role) =>
  !isAppealCategory(ticket?.category) || isAdminRole(role);

/**
 * Whether the ticket can still be escalated.
 *
 * Both staff roles may escalate, including on an appeal: escalation is how an
 * appeal reaches an administrator, so removing it would strand the queue.
 */
export const canEscalateTicket = (ticket) =>
  ticket?.status !== 'answered' && ticket?.status !== 'rejected' && ticket?.status !== 'escalated';

/** Whether the viewer holds the claim, which deciding and escalating both require. */
export const holdsClaim = (ticket, viewerId) =>
  Boolean(ticket?.assignedTo) && ticket.assignedTo === viewerId;

/** The backend's recipient cap. */
export const MAX_RECIPIENTS = 10;

/** The only two personalisation tokens the backend accepts. */
export const ALLOWED_VARIABLES = ['username', 'fullName'];

const VARIABLE_PATTERN = /\{\{\s*([^}]*?)\s*\}\}/g;

/**
 * Returns the variable tokens in a body that the backend would refuse.
 *
 * Checked at save time rather than at send time, matching the backend: a
 * campaign that saved must never fail later with the mail half-sent.
 *
 * @param {string} body the Markdown body
 * @returns {string[]} the offending token names, each once, in order
 */
export const findUnknownVariables = (body) => {
  if (typeof body !== 'string') {
    return [];
  }
  const found = [];
  for (const match of body.matchAll(VARIABLE_PATTERN)) {
    const token = match[1];
    if (!ALLOWED_VARIABLES.includes(token) && !found.includes(token)) {
      found.push(token);
    }
  }
  return found;
};

/**
 * Whether another recipient may be added.
 *
 * Deduplicated before the cap is applied, matching the backend, so re-adding
 * somebody already on the list is a no-op rather than a refusal that blames the
 * cap for the wrong reason.
 */
export const canAddRecipient = (recipients, candidateId) => {
  const ids = new Set((recipients ?? []).map((item) => item.id));
  if (ids.has(candidateId)) {
    return false;
  }
  return ids.size < MAX_RECIPIENTS;
};
