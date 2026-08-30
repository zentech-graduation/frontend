const STATUS_LABEL = {
  pending_confirmation: 'awaiting confirmation',
  open: 'open',
  in_progress: 'being looked at',
  escalated: 'escalated',
  answered: 'answered',
  rejected: 'closed',
};

/**
 * A ticket as its author sees it.
 *
 * There is no internal note here and no component for one. The backend's
 * author-facing response record has no such field, and this shape mirrors it, so
 * a staff-only note cannot reach this screen even if one were ever added to the
 * payload by mistake.
 */
export function OpenTicketPanel({ ticket }) {
  return (
    <div className="lx-support__card">
      <div className="lx-support__meta">
        <span className="lx-support__status">{STATUS_LABEL[ticket.status] ?? ticket.status}</span>
        <span>Opened {new Date(ticket.createdAt).toLocaleDateString()}</span>
      </div>
      <h2 className="lx-support__title" style={{ fontSize: '16px' }}>
        {ticket.subject}
      </h2>
      <p className="lx-support__response">{ticket.body}</p>
      {ticket.staffResponse ? (
        <>
          <hr style={{ border: 0, borderTop: '1px solid var(--lx-border)', margin: '20px 0' }} />
          <p className="lx-support__hint">
            Our reply, {new Date(ticket.respondedAt).toLocaleDateString()}
          </p>
          <p className="lx-support__response">{ticket.staffResponse}</p>
        </>
      ) : (
        <p className="lx-support__hint" style={{ marginTop: '16px' }}>
          No reply yet. We will email you when there is one.
        </p>
      )}
    </div>
  );
}

export default OpenTicketPanel;
