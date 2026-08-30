import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { v } from '@/config/tokens';
import { isAdminRole } from '@/config/roles';
import { useAuthStore } from '@/store/useAuthStore';

import { FilterBar } from '../components/FilterBar';
import { PageHeader } from '../components/PanelPage';
import { RecordTable } from '../components/RecordTable';
import { SplitView } from '../components/SplitView';
import { getSplitSelection, withSelection } from '../lib/splitSelection';
import {
  canDecideTicket,
  canEscalateTicket,
  holdsClaim as viewerHoldsClaim,
  isAppealCategory,
} from '../lib/supportPolicy';
import {
  useSupportTicket,
  useSupportTicketActions,
  useSupportTickets,
} from '../hooks/useSupportTickets';

const STATUSES = ['open', 'in_progress', 'escalated', 'answered', 'rejected'];

const COLUMNS = [
  { key: 'subject', header: 'subject', render: (row) => row.subject },
  { key: 'category', header: 'category', render: (row) => row.category },
  { key: 'status', header: 'status', render: (row) => row.status },
  { key: 'source', header: 'source', render: (row) => row.source },
  { key: 'assignedTo', header: 'claimed', render: (row) => (row.assignedTo ? 'yes' : 'no') },
];

/**
 * The staff support queue.
 *
 * The role gate mirrors a real backend rule rather than merely hiding a control,
 * following the precedent `canResolveDismiss` sets in ReportDetailScreen. A
 * moderator on an appeal_* ticket sees the ticket and the escalate control and
 * does not see respond or close, because unban, unsuspend, revoke-warning and
 * revoke-strike are all administrator-only: closing an appeal would record a
 * verdict the moderator cannot carry out. The backend refuses it with
 * SUPPORT_APPEAL_REQUIRES_ADMIN, so hiding the control only spares a round trip.
 *
 * Filter and selection state live in the URL, matching ReportQueueScreen, so a
 * queue view is shareable.
 */
export function SupportQueueScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAuthStore((state) => state.role);
  const status = searchParams.get('status') ?? '';
  const { selectedId, hasSelection } = getSplitSelection(searchParams);

  const queue = useSupportTickets({ status: status || undefined, limit: 50 });

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const openRecord = (id) => setSearchParams(withSelection(searchParams, id), { replace: false });
  const closeRecord = () => setSearchParams(withSelection(searchParams, null), { replace: true });

  const groups = [
    {
      key: 'status',
      label: 'status',
      value: status,
      options: STATUSES.map((value) => ({ value, label: value.replace('_', ' ') })),
    },
  ];

  const list = (
    <>
      <PageHeader title="support" />
      <div className="lx-admin-panel-card">
        <FilterBar
          groups={groups}
          onChange={setFilter}
          onClear={() => setFilter('status', '')}
          isDirty={Boolean(status)}
        />
        <RecordTable
          columns={COLUMNS}
          rows={queue.data ?? []}
          keyField="id"
          onRowClick={(row) => openRecord(row.id)}
          selectedKey={selectedId}
          isLoading={queue.isLoading}
          isError={queue.isError}
          errorMessage={queue.error?.message}
          onRetry={queue.refetch}
          emptyIcon="check"
          emptyTitle="no requests"
          emptyHint="nothing is waiting on staff right now."
        />
      </div>
    </>
  );

  return (
    <SplitView
      list={list}
      hasSelection={hasSelection}
      onClose={closeRecord}
      backLabel="back to the queue"
      emptyIcon="chat"
      emptyTitle="no request open"
      emptyHint="pick a request from the queue to read it and reply."
      detail={
        selectedId ? <TicketDetail key={selectedId} ticketId={selectedId} role={role} /> : null
      }
    />
  );
}

function TicketDetail({ ticketId, role }) {
  const ticket = useSupportTicket(ticketId);
  const actions = useSupportTicketActions(ticketId);
  const viewerId = useAuthStore((state) => state.user?.id);
  const [staffResponse, setStaffResponse] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [escalationReason, setEscalationReason] = useState('');

  if (ticket.isLoading) {
    return <p style={{ color: v.ink2 }}>loading.</p>;
  }
  if (ticket.isError || !ticket.data) {
    return <p style={{ color: v.ink2 }}>{ticket.error?.message ?? 'not found.'}</p>;
  }

  const row = ticket.data;
  const canDecide = canDecideTicket(row, role);
  const holdsClaim = viewerHoldsClaim(row, viewerId);
  const failure = actions.claim.error ?? actions.respond.error ?? actions.escalate.error;
  const message = describeFailure(failure, row);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{row.subject}</h2>
        <p style={{ color: v.ink2, fontSize: 12, margin: '4px 0 0' }}>
          {row.category} · {row.status} · {row.source}
        </p>
      </div>

      {message ? <Callout tone="error">{message}</Callout> : null}

      {isAppealCategory(row.category) && !isAdminRole(role) ? (
        <Callout>
          this is an appeal. only an administrator can answer or close it, because reversing the
          decision is an administrator-only action. you can still escalate it.
        </Callout>
      ) : null}

      <p style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>{row.body}</p>

      {row.internalNote ? <Callout>internal note: {row.internalNote}</Callout> : null}

      {!row.assignedTo ? (
        <button
          type="button"
          className="lx-admin-control"
          disabled={actions.claim.isPending}
          onClick={() => actions.claim.mutate()}
        >
          {actions.claim.isPending ? 'claiming' : 'claim'}
        </button>
      ) : null}

      {canDecide && holdsClaim ? (
        <>
          <Field id="ticket-response" label="reply to the user">
            <textarea
              id="ticket-response"
              className="lx-admin-control"
              rows={5}
              value={staffResponse}
              onChange={(event) => setStaffResponse(event.target.value)}
            />
          </Field>
          <Field id="ticket-note" label="internal note" hint="staff only. never sent to the user.">
            <textarea
              id="ticket-note"
              className="lx-admin-control"
              rows={3}
              value={internalNote}
              onChange={(event) => setInternalNote(event.target.value)}
            />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="lx-admin-control"
              disabled={actions.respond.isPending || !staffResponse.trim()}
              onClick={() => actions.respond.mutate({ staffResponse, internalNote, reject: false })}
            >
              answer and close
            </button>
            <button
              type="button"
              className="lx-admin-control"
              disabled={actions.respond.isPending || !staffResponse.trim()}
              onClick={() => actions.respond.mutate({ staffResponse, internalNote, reject: true })}
            >
              close as rejected
            </button>
          </div>
        </>
      ) : null}

      {holdsClaim &&
      row.status !== 'escalated' &&
      row.status !== 'answered' &&
      row.status !== 'rejected' ? (
        <Field id="ticket-escalate" label="escalate to an administrator">
          <textarea
            id="ticket-escalate"
            className="lx-admin-control"
            rows={2}
            value={escalationReason}
            onChange={(event) => setEscalationReason(event.target.value)}
          />
          <button
            type="button"
            className="lx-admin-control"
            style={{ marginTop: 8 }}
            disabled={actions.escalate.isPending || !escalationReason.trim()}
            onClick={() => actions.escalate.mutate(escalationReason)}
          >
            escalate
          </button>
        </Field>
      ) : null}
    </div>
  );
}

function Field({ id, label, hint, children }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: v.fontMono,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: v.ink2,
        }}
      >
        {label}
      </label>
      {children}
      {hint ? <span style={{ fontSize: 11, color: v.ink2 }}>{hint}</span> : null}
    </div>
  );
}

function Callout({ children, tone }) {
  return (
    <div
      style={{
        border: `1px solid ${v.border}`,
        borderLeft: `3px solid ${tone === 'error' ? v.error : v.ink2}`,
        borderRadius: 8,
        background: v.surfaceSunken,
        padding: 12,
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Turns a refusal into the sentence that explains it.
 *
 * Two of these are not generic permission errors and must not read as one. A
 * conflict of interest is a fact about this ticket, not about the viewer's role.
 * A claim collision means somebody else got there first and the queue behind it
 * is already stale, which is why the hook invalidates on failure as well.
 */
function describeFailure(error, ticket) {
  if (!error) {
    return null;
  }
  switch (error.code) {
    case 'SUPPORT_CONFLICT_OF_INTEREST':
      return 'you cannot act on this request. it appeals a decision you made, so another staff member has to review it.';
    case 'SUPPORT_TICKET_ALREADY_CLAIMED':
      return 'another staff member claimed this first. the queue has been refreshed.';
    case 'SUPPORT_APPEAL_REQUIRES_ADMIN':
      return 'only an administrator can decide an appeal. escalate it instead.';
    case 'SUPPORT_TICKET_NOT_CLAIMED':
      return 'claim this request before acting on it.';
    case 'SUPPORT_TICKET_INVALID_TRANSITION':
      return `this request is already ${ticket.status} and cannot change again.`;
    default:
      return error.message ?? 'that did not work. try again.';
  }
}

export default SupportQueueScreen;
