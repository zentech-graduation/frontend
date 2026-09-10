import { useNavigate, useParams } from 'react-router-dom';
import { v } from '@/config/tokens';
import { ROUTES } from '@/config/constants';
import { useOwnTicket } from '../hooks/useSupport';
import { staffResponseHeading, statusLabel } from '../utils/ticketStatus';
import { Eyebrow, Notice, StatusChip } from './SupportPrimitives';

/**
 * One of the caller's own requests, and the reply if there is one.
 *
 * Renders exactly three things: what the user wrote, where the request has got
 * to, and the staff response once it exists.
 *
 * It never renders an internal note. The owner-facing DTO has no component for
 * one, so the field cannot arrive, but this reads named fields rather than
 * iterating the payload so that a note added to that DTO by mistake still would
 * not appear here. The guarantee is meant to be structural at both ends.
 */
export function TicketDetailScreen() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { data: ticket, isLoading, isError } = useOwnTicket(ticketId);

  return (
    <div style={{ padding: '20px 16px 40px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <button
        type="button"
        onClick={() => navigate(ROUTES.SUPPORT)}
        style={{
          fontFamily: v.fontBody,
          fontSize: 14,
          color: v.ink2,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          marginBottom: 18,
        }}
      >
        back to help
      </button>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="lx-skeleton" style={{ height: 22, width: '55%', borderRadius: 4 }} />
          <div className="lx-skeleton" style={{ height: 120, borderRadius: 12 }} />
        </div>
      ) : null}

      {isError ? (
        <Notice tone="bad" role="alert">
          we could not find that request. it may have been removed.
        </Notice>
      ) : null}

      {ticket ? (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 6,
            }}
          >
            <h1
              style={{
                fontFamily: v.fontDisplay,
                fontSize: 24,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: v.ink,
                margin: 0,
                fontWeight: 700,
              }}
            >
              {ticket.subject}
            </h1>
            <StatusChip label={statusLabel(ticket.status)} />
          </div>

          <div
            style={{
              fontFamily: v.fontMono,
              fontSize: 11,
              color: v.ink2,
              marginBottom: 22,
            }}
          >
            {(ticket.category ?? '').toLowerCase().replace(/_/g, ' ')}
          </div>

          <section style={{ marginBottom: 26 }}>
            <Eyebrow>what you sent</Eyebrow>
            <div
              style={{
                fontFamily: v.fontBody,
                fontSize: 15,
                lineHeight: 1.6,
                color: v.ink,
                whiteSpace: 'pre-wrap',
              }}
            >
              {ticket.body}
            </div>
          </section>

          {ticket.staffResponse ? (
            <section>
              <Eyebrow>{staffResponseHeading(ticket.status)}</Eyebrow>
              <div
                style={{
                  background: v.surface,
                  border: `1px solid ${v.border}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  fontFamily: v.fontBody,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: v.ink,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {ticket.staffResponse}
              </div>
            </section>
          ) : (
            <Notice>
              nobody has replied yet. we will email you at the address on your account when somebody
              does.
            </Notice>
          )}
        </>
      ) : null}
    </div>
  );
}

export default TicketDetailScreen;
