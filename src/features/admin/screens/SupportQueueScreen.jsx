import { useState } from 'react';

/**
 * The staff support queue.
 *
 * Wireframe stage: stubbed rows, real layout. Phase two replaces the fixtures
 * with the panel's declared-key request contract and swaps this markup for
 * RecordTable, LoadMore and SplitView, matching ReportQueueScreen.
 *
 * The role difference shown here is the one that matters and is not cosmetic. A
 * moderator on an appeal_* ticket sees the ticket and the escalate control, and
 * does not see respond or close, because unban, unsuspend, revoke-warning and
 * revoke-strike are all administrator-only actions: a moderator closing an
 * appeal would be recording a verdict they cannot carry out. The backend refuses
 * it with SUPPORT_APPEAL_REQUIRES_ADMIN, and this mirrors that rule rather than
 * merely hiding a button.
 */

const WIRE_TICKETS = [
  {
    id: 'a1',
    subject: 'I was banned for something I did not post',
    category: 'appeal_ban',
    status: 'open',
    source: 'signed_link',
    assignedTo: null,
    createdAt: '2026-08-28T08:40:00Z',
  },
  {
    id: 'a2',
    subject: 'Cannot upload a second image',
    category: 'bug_report',
    status: 'in_progress',
    source: 'authenticated',
    assignedTo: 'you',
    createdAt: '2026-08-27T16:05:00Z',
  },
  {
    id: 'a3',
    subject: 'My story was removed by mistake',
    category: 'appeal_content_removal',
    status: 'escalated',
    source: 'signed_link',
    assignedTo: 'mira',
    createdAt: '2026-08-26T11:22:00Z',
  },
];

const isAppeal = (category) => category.startsWith('appeal_');

export function SupportQueueScreen() {
  const [role, setRole] = useState('moderator');
  const [selected, setSelected] = useState(WIRE_TICKETS[0]);
  const [refusal, setRefusal] = useState(null);

  // Mirrors the backend rule rather than restating a permission list, the way
  // ReportDetailScreen derives canResolveDismiss from a real backend rule.
  const canDecide = !isAppeal(selected.category) || role === 'admin';
  const claimedByOther = selected.assignedTo && selected.assignedTo !== 'you';

  return (
    <div className="lx-admin-screen">
      <header className="lx-admin-screen__head">
        <h1 className="lx-admin-screen__title">support</h1>
        <p className="lx-admin-screen__subtitle">
          One request, one response. Appeals can only be decided by an administrator.
        </p>
      </header>

      <div className="lx-support__wire" style={{ marginBottom: '16px' }}>
        <strong>Wireframe.</strong> Rows are stubbed and the role switch stands in for the signed-in
        account, so the moderator and administrator differences can be reviewed side by side.{' '}
        <button
          type="button"
          className="lx-support__button"
          onClick={() => setRole((r) => (r === 'moderator' ? 'admin' : 'moderator'))}
        >
          Viewing as {role} - switch
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 22rem', gap: '16px' }}>
        <div className="lx-support__card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--lx-ink-2)' }}>
                <th scope="col" style={{ padding: '10px 12px' }}>
                  subject
                </th>
                <th scope="col" style={{ padding: '10px 12px' }}>
                  category
                </th>
                <th scope="col" style={{ padding: '10px 12px' }}>
                  status
                </th>
                <th scope="col" style={{ padding: '10px 12px' }}>
                  claimed
                </th>
              </tr>
            </thead>
            <tbody>
              {WIRE_TICKETS.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => {
                    setSelected(ticket);
                    setRefusal(null);
                  }}
                  style={{
                    borderTop: '1px solid var(--lx-border)',
                    cursor: 'pointer',
                    background:
                      selected.id === ticket.id ? 'var(--lx-surface-sunken)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '10px 12px' }}>{ticket.subject}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--lx-ink-2)' }}>
                    {ticket.category}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--lx-ink-2)' }}>
                    {ticket.status}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--lx-ink-2)' }}>
                    {ticket.assignedTo ?? 'unclaimed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="lx-support__card">
          <p className="lx-support__label">{selected.subject}</p>
          <div className="lx-support__meta" style={{ marginTop: '8px' }}>
            <span className="lx-support__status">{selected.status}</span>
            <span>{selected.category}</span>
          </div>

          {isAppeal(selected.category) && role === 'moderator' ? (
            <div className="lx-support__notice" style={{ marginBottom: '12px' }}>
              This is an appeal. Only an administrator can answer or close it, because reversing the
              decision is an administrator-only action. You can still escalate it.
            </div>
          ) : null}

          {refusal ? (
            <div
              className="lx-support__notice lx-support__notice--error"
              style={{ marginBottom: '12px' }}
            >
              {refusal}
            </div>
          ) : null}

          <div className="lx-support__field">
            <label className="lx-support__label" htmlFor="staff-response">
              Reply to the user
            </label>
            <textarea
              id="staff-response"
              className="lx-support__control lx-support__textarea"
              disabled={!canDecide}
              style={{ minHeight: '6rem' }}
            />
          </div>
          <div className="lx-support__field">
            <label className="lx-support__label" htmlFor="internal-note">
              Internal note
            </label>
            <textarea
              id="internal-note"
              className="lx-support__control lx-support__textarea"
              style={{ minHeight: '4rem' }}
            />
            <p className="lx-support__hint">Staff only. Never sent to the user.</p>
          </div>

          <div className="lx-support__actions" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className="lx-support__button"
              onClick={() =>
                setRefusal(
                  claimedByOther
                    ? `${selected.assignedTo} already claimed this ticket. Refreshing the queue.`
                    : null
                )
              }
            >
              Claim
            </button>
            {canDecide ? (
              <>
                <button type="button" className="lx-support__button lx-support__button--primary">
                  Answer and close
                </button>
                <button type="button" className="lx-support__button">
                  Close as rejected
                </button>
              </>
            ) : null}
            <button type="button" className="lx-support__button">
              Escalate
            </button>
          </div>

          <div className="lx-support__wire" style={{ marginTop: '16px' }}>
            <strong>Conflict of interest.</strong> When the ticket appeals an action the viewer
            took, every control above is refused with SUPPORT_CONFLICT_OF_INTEREST and this panel
            explains that specifically rather than showing a generic permission error.{' '}
            <button
              type="button"
              className="lx-support__button"
              onClick={() =>
                setRefusal(
                  'You cannot act on this ticket. It appeals a decision you made, so another staff member has to review it.'
                )
              }
            >
              Show that refusal
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SupportQueueScreen;
