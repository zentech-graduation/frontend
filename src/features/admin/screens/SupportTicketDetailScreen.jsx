import { useState } from 'react';
import { v } from '@/config/tokens';
import { useAuthStore } from '@/store/useAuthStore';
import { LocalTime } from '../components/LocalTime';
import { StatusBadge } from '../components/StatusBadge';
import {
  useSupportTicket,
  useSupportTicketActions,
  useVerificationRequest,
} from '../hooks/useSupportQueue';
import * as styles from './supportDetailStyles';
import { blockedReasonLabel, ticketCapabilities } from '../lib/supportTicketSchema';

const VERIFICATION_CATEGORY = 'VERIFICATION_REQUEST';

const EVIDENCE_ROWS = [
  ['evidenceWebsite', 'official website'],
  ['evidenceOtherProfile', 'verified profile elsewhere'],
  ['evidenceEmailDomain', 'organisational email domain'],
  ['evidencePublishedWork', 'published work'],
  ['evidencePress', 'press coverage'],
  ['evidenceAward', 'award or honour'],
  ['evidenceOther', 'anything else'],
];

/**
 * One support ticket, and whatever this reviewer is actually allowed to do with
 * it.
 *
 * The controls mirror the server's rules rather than merely hiding what looks
 * inapplicable. Two refusals are only knowable from the server and are
 * therefore surfaced from the failure rather than predicted: the
 * conflict-of-interest rule, which depends on `admin_actions.admin_id` that the
 * ticket does not carry, and the claim race, which is decided in an update
 * predicate. Both get their own sentence; neither is shown as a generic 403.
 */
export function SupportTicketDetailScreen({ ticketId, onClaimed }) {
  const viewerId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.role);
  const { data: ticket, isLoading, isError, refetch } = useSupportTicket(ticketId);
  const isVerification = ticket?.category === VERIFICATION_CATEGORY;
  const { data: verificationRequest } = useVerificationRequest(ticketId, isVerification);
  const actions = useSupportTicketActions(ticketId);

  const [staffResponse, setStaffResponse] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [refusal, setRefusal] = useState('');

  if (isLoading) {
    return <div className="lx-admin-panel-card">loading the ticket.</div>;
  }
  if (isError || !ticket) {
    return (
      <div className="lx-admin-panel-card">
        <p>that ticket could not be loaded.</p>
        <button type="button" className="lx-admin-control" onClick={() => refetch()}>
          try again
        </button>
      </div>
    );
  }

  const caps = ticketCapabilities(ticket, { id: viewerId, role });
  const blocked = blockedReasonLabel(caps.blockedReason, ticket);

  const handleFailure = (error) => {
    const code = error?.response?.data?.code;
    if (code === 'SUPPORT_CONFLICT_OF_INTEREST') {
      setRefusal(
        'you took the action this ticket is appealing, so you cannot act on it. hand it to another reviewer.'
      );
      return;
    }
    if (code === 'SUPPORT_APPEAL_REQUIRES_ADMIN') {
      setRefusal(
        'only an administrator can answer an appeal. escalate it and an administrator will pick it up.'
      );
      return;
    }
    if (code === 'SUPPORT_TICKET_ALREADY_CLAIMED') {
      setRefusal('another reviewer claimed this first. the ticket has been reloaded.');
      refetch();
      return;
    }
    if (code === 'SUPPORT_TICKET_NOT_CLAIMED') {
      setRefusal('claim this ticket before acting on it.');
      refetch();
      return;
    }
    if (code === 'SUPPORT_TICKET_INVALID_TRANSITION') {
      setRefusal('this ticket has already been decided. the ticket has been reloaded.');
      refetch();
      return;
    }
    setRefusal(error?.message || 'that did not work.');
  };

  const runAction = (mutation, payload, onDone) => {
    setRefusal('');
    mutation.mutate(payload, {
      onError: handleFailure,
      onSuccess: (result) => {
        setStaffResponse('');
        setInternalNote('');
        setEscalationReason('');
        onDone?.(result);
      },
    });
  };

  const respondDisabled = !caps.canRespond || !staffResponse.trim() || actions.respond.isPending;

  // The appeal rule and the blocked reason would otherwise both say the same
  // thing in two sentences directly above each other. The blocked reason is the
  // more specific of the two, so it is the one that survives.
  const showAppealNotice = caps.isAppeal && caps.blockedReason !== 'appeal-requires-admin';

  return (
    <div className="lx-admin-panel-card">
      <header style={{ marginBottom: 18 }}>
        <h2
          tabIndex={-1}
          style={{
            fontFamily: v.fontDisplay,
            fontSize: 20,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            color: v.ink,
            margin: 0,
            fontWeight: 600,
            outline: 'none',
          }}
        >
          {ticket.subject}
        </h2>
        <div style={styles.metaRow}>
          <StatusBadge status={(ticket.status ?? '').toLowerCase()} />
          <span>{(ticket.category ?? '').toLowerCase().replace(/_/g, ' ')}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{(ticket.source ?? '').toLowerCase().replace(/_/g, ' ')}</span>
          <span aria-hidden="true">&middot;</span>
          <LocalTime value={ticket.createdAt} />
        </div>
      </header>

      {refusal ? (
        <p style={styles.notice('bad')} role="alert">
          {refusal}
        </p>
      ) : null}

      {caps.claimedBySomeoneElse ? (
        <p style={styles.notice('warn')} role="status">
          another reviewer holds this ticket. you can read it, but not act on it.
        </p>
      ) : null}

      {showAppealNotice ? (
        <p style={styles.notice()} role="status">
          this is an appeal. only an administrator can answer or close it.
        </p>
      ) : null}

      <section style={styles.section}>
        <h3 style={styles.sectionLabel}>what they wrote</h3>
        <p style={styles.bodyText}>{ticket.body}</p>
        {ticket.contactEmail ? (
          <p style={{ ...styles.mutedText, fontSize: 12, marginTop: 8 }}>
            reply address: {ticket.contactEmail}
          </p>
        ) : null}
      </section>

      {isVerification && verificationRequest ? (
        <section style={styles.section}>
          <h3 style={styles.sectionLabel}>the claim</h3>
          <p style={styles.mutedText}>
            {verificationRequest.claimedName} in{' '}
            {(verificationRequest.categoryKey ?? '').replace(/_/g, ' ')}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
            {EVIDENCE_ROWS.map(([field, label]) =>
              verificationRequest[field] ? (
                <li key={field} style={{ marginBottom: 10 }}>
                  <div style={{ ...styles.sectionLabel, fontSize: 10, margin: '0 0 2px' }}>
                    {label}
                  </div>
                  <div style={{ ...styles.bodyText, fontSize: 13 }}>
                    {verificationRequest[field]}
                  </div>
                </li>
              ) : null
            )}
          </ul>
        </section>
      ) : null}

      {ticket.staffResponse ? (
        <section style={styles.section}>
          <h3 style={styles.sectionLabel}>the reply that was sent</h3>
          <p style={styles.bodyText}>{ticket.staffResponse}</p>
        </section>
      ) : null}

      {ticket.internalNote ? (
        <section style={styles.section}>
          {/* Staff-only. Absent from the owner-facing DTO and from the mail
              metadata map, so it cannot reach the requester from anywhere. */}
          <h3 style={styles.sectionLabel}>internal note (never sent)</h3>
          <p style={{ ...styles.bodyText, color: v.ink2 }}>{ticket.internalNote}</p>
        </section>
      ) : null}

      {blocked ? (
        <p style={styles.notice()} role="status">
          {blocked}
        </p>
      ) : null}

      {caps.canClaim ? (
        <button
          type="button"
          className="lx-admin-control"
          disabled={actions.claim.isPending}
          // Claiming moves the ticket to in_progress, which is a different
          // status than the queue was almost certainly filtered by. The parent
          // follows it rather than letting it vanish from under the reviewer
          // who claimed it precisely in order to decide it.
          onClick={() => runAction(actions.claim, undefined, () => onClaimed?.())}
        >
          {actions.claim.isPending ? 'claiming' : 'claim to review'}
        </button>
      ) : null}

      {caps.canRespond ? (
        <section style={{ ...styles.section, marginTop: 22 }}>
          <h3 style={styles.sectionLabel}>
            {isVerification ? 'decide this request' : 'answer this ticket'}
          </h3>
          <label
            style={{ ...styles.sectionLabel, display: 'block' }}
            htmlFor="support-staff-response"
          >
            {isVerification ? 'reason, which reaches the requester' : 'your reply'}
          </label>
          <textarea
            id="support-staff-response"
            style={styles.textarea()}
            rows={5}
            value={staffResponse}
            onChange={(event) => setStaffResponse(event.target.value)}
          />

          <label
            style={{ ...styles.sectionLabel, display: 'block' }}
            htmlFor="support-internal-note"
          >
            internal note, never sent
          </label>
          <textarea
            id="support-internal-note"
            style={styles.textarea()}
            rows={3}
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
          />

          <div style={styles.actionRow}>
            {isVerification ? (
              <>
                <button
                  type="button"
                  className="lx-admin-control"
                  disabled={respondDisabled}
                  onClick={() =>
                    runAction(actions.approveVerification, {
                      reason: staffResponse,
                      internalNote: internalNote || undefined,
                    })
                  }
                >
                  approve
                </button>
                <button
                  type="button"
                  className="lx-admin-control"
                  disabled={respondDisabled}
                  onClick={() =>
                    runAction(actions.rejectVerification, {
                      reason: staffResponse,
                      internalNote: internalNote || undefined,
                    })
                  }
                >
                  reject
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="lx-admin-control"
                  disabled={respondDisabled}
                  onClick={() =>
                    runAction(actions.respond, {
                      staffResponse,
                      internalNote: internalNote || undefined,
                      reject: false,
                    })
                  }
                >
                  answer and close
                </button>
                <button
                  type="button"
                  className="lx-admin-control"
                  disabled={respondDisabled}
                  onClick={() =>
                    runAction(actions.respond, {
                      staffResponse,
                      internalNote: internalNote || undefined,
                      reject: true,
                    })
                  }
                >
                  close as rejected
                </button>
              </>
            )}
          </div>
        </section>
      ) : null}

      {caps.canEscalate ? (
        <section style={{ ...styles.section, marginTop: 22 }}>
          <label
            style={{ ...styles.sectionLabel, display: 'block' }}
            htmlFor="support-escalation-reason"
          >
            escalate: why this needs an administrator
          </label>
          <textarea
            id="support-escalation-reason"
            style={styles.textarea()}
            rows={3}
            value={escalationReason}
            onChange={(event) => setEscalationReason(event.target.value)}
          />
          <button
            type="button"
            className="lx-admin-control"
            disabled={!escalationReason.trim() || actions.escalate.isPending}
            onClick={() => runAction(actions.escalate, { reason: escalationReason })}
            style={{ marginTop: 12 }}
          >
            {actions.escalate.isPending ? 'escalating' : 'escalate'}
          </button>
        </section>
      ) : null}
    </div>
  );
}

export default SupportTicketDetailScreen;
