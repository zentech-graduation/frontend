import { ROLES } from '@/config/roles';

/**
 * The support ticket vocabulary and the console's role gating.
 *
 * The gating here mirrors real backend rules from `support/DATA_RULES.md`
 * section 4 rather than merely hiding controls. A control this file disables is
 * one the server would refuse, and the refusal codes exist precisely so the
 * refusal can be explained.
 */

/** Statuses staff can filter the queue by. `pending_confirmation` is never shown. */
export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'ANSWERED', 'REJECTED'];

export const TICKET_STATUS_LABELS = {
  OPEN: 'open',
  IN_PROGRESS: 'in progress',
  ESCALATED: 'escalated',
  ANSWERED: 'answered',
  REJECTED: 'rejected',
};

/** Statuses a ticket can still be acted on from. */
const ACTIVE_STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'ESCALATED']);

/** The four appeal categories, which only an administrator may decide. */
const APPEAL_CATEGORIES = new Set([
  'APPEAL_BAN',
  'APPEAL_SUSPENSION',
  'APPEAL_WARNING_STRIKE',
  'APPEAL_CONTENT_REMOVAL',
]);

/** Whether a ticket contests a moderation decision. */
export const isAppealTicket = (ticket) => APPEAL_CATEGORIES.has(ticket?.category);

/** Whether a ticket has been decided and can no longer move. */
export const isTerminalTicket = (ticket) => !ACTIVE_STATUSES.has(ticket?.status);

/**
 * What a given staff member may do with a given ticket.
 *
 * Three rules, in the order the server evaluates them:
 *
 * 1. Conflict of interest. A staff member may not act on a ticket appealing an
 *    audit row they wrote. Evaluated first, so an administrator who made the
 *    original decision is refused for the conflict - the accurate reason -
 *    rather than admitted because their role would otherwise be sufficient.
 *    Reading is exempt: reading is not a decision.
 * 2. Appeals require an administrator. A moderator may read an appeal and
 *    escalate it, but not answer or close it, because unban, unsuspend,
 *    revoke-warning and revoke-strike are all administrator-only actions and a
 *    moderator closing one would record a verdict they cannot execute.
 * 3. Deciding and escalating require holding the claim, and holding it
 *    personally. A ticket claimed by somebody else is not actionable by this
 *    viewer, which is the state the previous screen was missing: it tested
 *    whether a ticket was claimed rather than who had claimed it, and so
 *    offered a complete decision form whose every outcome was a 409.
 *
 * @param {Object} ticket the staff-facing ticket
 * @param {Object} viewer `{ id, role }` for the signed-in staff member
 * @returns {Object} what the interface may offer, and why it may not
 */
export const ticketCapabilities = (ticket, viewer) => {
  const none = {
    canClaim: false,
    canRespond: false,
    canEscalate: false,
    canNote: false,
    claimedByMe: false,
    claimedBySomeoneElse: false,
    isAppeal: false,
    blockedReason: null,
  };

  if (!ticket || !viewer?.id) {
    return none;
  }

  const isAppeal = isAppealTicket(ticket);
  const terminal = isTerminalTicket(ticket);
  const claimedByMe = Boolean(ticket.assignedTo) && ticket.assignedTo === viewer.id;
  const claimedBySomeoneElse = Boolean(ticket.assignedTo) && ticket.assignedTo !== viewer.id;
  const isAdmin = viewer.role === ROLES.ADMIN;

  // Not derivable client-side: the conflict depends on admin_actions.admin_id,
  // which the ticket does not carry. The server is the only place that knows,
  // so the console discovers it from the refusal and says so specifically
  // rather than showing a generic permission error.
  const base = {
    ...none,
    isAppeal,
    claimedByMe,
    claimedBySomeoneElse,
  };

  if (terminal) {
    return { ...base, blockedReason: 'decided' };
  }

  if (claimedBySomeoneElse) {
    return { ...base, blockedReason: 'claimed-by-other' };
  }

  if (!ticket.assignedTo) {
    // Unclaimed. Claiming is the only thing on offer, which is what stops the
    // console presenting a decision form that would answer 409.
    return { ...base, canClaim: true, blockedReason: 'unclaimed' };
  }

  // Claimed by this viewer.
  const canDecideAppeal = !isAppeal || isAdmin;
  return {
    ...base,
    canRespond: canDecideAppeal,
    canEscalate: true,
    canNote: canDecideAppeal,
    blockedReason: canDecideAppeal ? null : 'appeal-requires-admin',
  };
};

/** Lowercase, human wording for why a control is not offered. */
export const blockedReasonLabel = (reason) =>
  ({
    decided: 'this ticket has been decided and cannot be changed.',
    'claimed-by-other': 'another reviewer holds this ticket.',
    // Naming what is actually gated. Reading a ticket before claiming it is
    // intended - a moderator can already see the body and the reply address -
    // and the previous wording implied the whole ticket was behind the claim.
    unclaimed: 'you can read this ticket. claim it to reply, reject or escalate.',
    'appeal-requires-admin':
      'only an administrator can answer an appeal. you can read it and escalate it.',
  })[reason] ?? null;
