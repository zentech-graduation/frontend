import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { LocalTime } from '../components/LocalTime';
import { StatusBadge } from '../components/StatusBadge';
import {
  useSupportTicket,
  useSupportTicketActions,
  useVerificationRequest,
} from '../hooks/useSupportQueue';
import {
  blockedReasonLabel,
  ticketCapabilities,
  TICKET_STATUS_LABELS,
} from '../lib/supportTicketSchema';

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
        <button type="button" className="lx-admin-btn" onClick={() => refetch()}>
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

  return (
    <div className="lx-admin-panel-card">
      <header style={{ marginBottom: 16 }}>
        <h2 className="lx-admin-detail-title" tabIndex={-1}>
          {ticket.subject}
        </h2>
        <div className="lx-admin-detail-meta">
          <StatusBadge label={TICKET_STATUS_LABELS[ticket.status] ?? ticket.status} />
          <span>{(ticket.category ?? '').toLowerCase().replace(/_/g, ' ')}</span>
          <span>{(ticket.source ?? '').toLowerCase().replace(/_/g, ' ')}</span>
          <LocalTime value={ticket.createdAt} />
        </div>
      </header>

      {refusal ? (
        <p className="lx-admin-inline-error" role="alert">
          {refusal}
        </p>
      ) : null}

      {caps.claimedBySomeoneElse ? (
        <p className="lx-admin-note" role="status">
          another reviewer holds this ticket. you can read it, but not act on it.
        </p>
      ) : null}

      {caps.isAppeal && role !== 'admin' ? (
        <p className="lx-admin-note" role="status">
          this is an appeal. only an administrator can answer or close it; you can read it and
          escalate it.
        </p>
      ) : null}

      <section style={{ marginBottom: 18 }}>
        <h3 className="lx-admin-section-heading">what they wrote</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{ticket.body}</p>
        {ticket.contactEmail ? (
          <p className="lx-admin-detail-meta">reply address: {ticket.contactEmail}</p>
        ) : null}
      </section>

      {isVerification && verificationRequest ? (
        <section style={{ marginBottom: 18 }}>
          <h3 className="lx-admin-section-heading">the claim</h3>
          <p>
            {verificationRequest.claimedName} in{' '}
            {(verificationRequest.categoryKey ?? '').replace(/_/g, ' ')}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
            {EVIDENCE_ROWS.map(([field, label]) =>
              verificationRequest[field] ? (
                <li key={field} style={{ marginBottom: 6 }}>
                  <span className="lx-admin-detail-meta">{label}</span>
                  <div style={{ wordBreak: 'break-word' }}>{verificationRequest[field]}</div>
                </li>
              ) : null
            )}
          </ul>
        </section>
      ) : null}

      {ticket.staffResponse ? (
        <section style={{ marginBottom: 18 }}>
          <h3 className="lx-admin-section-heading">the reply that was sent</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{ticket.staffResponse}</p>
        </section>
      ) : null}

      {ticket.internalNote ? (
        <section style={{ marginBottom: 18 }}>
          {/* Staff-only. Absent from the owner-facing DTO and from the mail
              metadata map, so it cannot reach the requester from anywhere. */}
          <h3 className="lx-admin-section-heading">internal note (never sent)</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{ticket.internalNote}</p>
        </section>
      ) : null}

      {blocked ? (
        <p className="lx-admin-note" role="status">
          {blocked}
        </p>
      ) : null}

      {caps.canClaim ? (
        <button
          type="button"
          className="lx-admin-btn lx-admin-btn-primary"
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
        <section style={{ marginTop: 18 }}>
          <h3 className="lx-admin-section-heading">
            {isVerification ? 'decide this request' : 'answer this ticket'}
          </h3>
          <label className="lx-admin-label" htmlFor="support-staff-response">
            {isVerification ? 'reason, which reaches the requester' : 'your reply'}
          </label>
          <textarea
            id="support-staff-response"
            className="lx-admin-textarea"
            rows={5}
            value={staffResponse}
            onChange={(event) => setStaffResponse(event.target.value)}
          />

          <label className="lx-admin-label" htmlFor="support-internal-note">
            internal note, never sent
          </label>
          <textarea
            id="support-internal-note"
            className="lx-admin-textarea"
            rows={3}
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {isVerification ? (
              <>
                <button
                  type="button"
                  className="lx-admin-btn lx-admin-btn-primary"
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
                  className="lx-admin-btn"
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
                  className="lx-admin-btn lx-admin-btn-primary"
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
                  className="lx-admin-btn"
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
        <section style={{ marginTop: 18 }}>
          <h3 className="lx-admin-section-heading">escalate</h3>
          <label className="lx-admin-label" htmlFor="support-escalation-reason">
            why this needs an administrator
          </label>
          <textarea
            id="support-escalation-reason"
            className="lx-admin-textarea"
            rows={3}
            value={escalationReason}
            onChange={(event) => setEscalationReason(event.target.value)}
          />
          <button
            type="button"
            className="lx-admin-btn"
            disabled={!escalationReason.trim() || actions.escalate.isPending}
            onClick={() => runAction(actions.escalate, { reason: escalationReason })}
            style={{ marginTop: 10 }}
          >
            {actions.escalate.isPending ? 'escalating' : 'escalate'}
          </button>
        </section>
      ) : null}
    </div>
  );
}

export default SupportTicketDetailScreen;
