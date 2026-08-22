import { Link } from 'react-router-dom';

import { v } from '@/config/tokens';
import { routeTo } from '@/config/constants';
import { LxIcon } from '@/components/ui/lx-icon';
import { LxBtn } from '@/features/luvax/components/primitives';

import { RecordTable } from './RecordTable';
import { LocalTime } from './LocalTime';
import { StatusBadge } from './StatusBadge';
import { shortId } from '../hooks/useResolveUsername';

/**
 * The live sessions of an account, and the reports filed against it.
 *
 * Both arrive inside the account detail payload rather than from an endpoint of
 * their own, so both are bounded sets with no cursor behind them. That is stated
 * rather than implied, because a list that looks paginated and is not invites a
 * reviewer to believe they have seen everything.
 *
 * **A session record is rendered as exactly what it carries.** The payload holds
 * a refresh-token row id, an optional opaque device id, the user agent string
 * recorded when the session was issued, the client address recorded at the same
 * moment, and two timestamps. It does not hold a location, a city, a resolved
 * device name, or a marker for which session is the reader's own. An address
 * shown as a place, or a user agent shown as "iPhone 15", would be the interface
 * inventing a fact from a string — and an address in particular is the kind of
 * invented fact a reviewer would then act on.
 *
 * **There is no per-session revocation.** The whole backend surface was searched
 * for one; the only revocation that exists ends every session of the account at
 * once. So no per-row revoke control is rendered — a control that cannot exist
 * is not drawn and then disabled — and the account-wide action is offered
 * instead, named for what it actually does.
 */

export function SessionList({ sessions, isSelf, onRevokeAll }) {
  const rows = sessions ?? [];

  const columns = [
    {
      key: 'createdAt',
      header: 'signed in',
      width: '20%',
      nowrap: true,
      render: (row) => <LocalTime value={row.createdAt} showZone={false} />,
    },
    {
      key: 'expiresAt',
      header: 'expires',
      width: '20%',
      nowrap: true,
      render: (row) => <LocalTime value={row.expiresAt} showZone={false} />,
    },
    {
      key: 'userAgent',
      header: 'user agent, as recorded',
      render: (row) =>
        row.userAgent ? (
          <span
            style={{
              fontFamily: v.fontMono,
              fontSize: 12,
              color: v.ink2,
              wordBreak: 'break-word',
            }}
          >
            {row.userAgent}
          </span>
        ) : (
          <Muted>none recorded</Muted>
        ),
    },
    {
      key: 'ipAddress',
      header: 'address, as recorded',
      width: '18%',
      render: (row) =>
        row.ipAddress ? (
          <span style={{ fontFamily: v.fontMono, fontSize: 12, color: v.ink2 }}>
            {row.ipAddress}
          </span>
        ) : (
          <Muted>none recorded</Muted>
        ),
    },
    {
      key: 'deviceId',
      header: 'device id',
      width: '14%',
      nowrap: true,
      render: (row) =>
        row.deviceId ? (
          <span style={{ fontFamily: v.fontMono, fontSize: 12, color: v.ink2 }}>
            {shortId(row.deviceId)}
          </span>
        ) : (
          <Muted>not supplied</Muted>
        ),
    },
  ];

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SubHeading
        icon="lock"
        title={`live sessions — ${rows.length}`}
        note="a session is live while its refresh token is neither revoked nor expired. the token itself is never exposed."
      />

      <RecordTable
        columns={columns}
        rows={rows}
        emptyIcon="lock"
        emptyTitle="no live sessions"
        emptyHint="this account is not signed in anywhere. either it has never signed in, or every session has been revoked or has expired."
      />

      <p style={{ margin: 0, fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>
        the address and the user agent are the strings recorded when each session was issued. they
        are shown as they are: the record does not say where the person was or what device they
        held, and this panel does not guess.
      </p>

      {rows.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: isSelf ? v.warningDim : v.surface,
          }}
        >
          <LxIcon
            name="alert"
            size={14}
            color={isSelf ? v.warningText : v.ink3}
          />
          <span
            style={{
              fontFamily: v.fontBody,
              fontSize: 12,
              color: isSelf ? v.warningText : v.ink3,
              flex: '1 1 260px',
              minWidth: 0,
            }}
          >
            {isSelf
              ? 'these are your own sessions, and one of them is the session you are reading this in. the record does not say which, so ending them ends that one too and signs you out immediately.'
              : 'sessions cannot be ended one at a time — the only revocation available ends every session this account holds at once.'}
          </span>
          {onRevokeAll ? (
            <LxBtn variant="secondary" size="sm" onClick={onRevokeAll}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <LxIcon name="logout" size={13} color={v.ink2} />
                {isSelf ? 'sign out all my sessions' : 'end all sessions'}
              </span>
            </LxBtn>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/**
 * The reports filed against this account.
 *
 * The payload calls this "the most recent reports filed against this account",
 * and there is no cursor and no total behind it, so it is a bounded recent set
 * and the panel says so instead of implying completeness. Each entry carries a
 * report id, so each row opens the report it names.
 */
export function ReportsAgainstList({ reports }) {
  const rows = reports ?? [];

  const columns = [
    {
      key: 'createdAt',
      header: 'filed',
      width: '24%',
      nowrap: true,
      render: (row) => <LocalTime value={row.createdAt} showZone={false} />,
    },
    {
      key: 'reportReason',
      header: 'reason',
      width: '24%',
      nowrap: true,
      render: (row) => (
        <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2 }}>
          {String(row.reportReason ?? '').replace(/_/g, ' ') || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'status',
      width: '20%',
      nowrap: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'id',
      header: 'report',
      render: (row) => (
        <Link
          to={routeTo.adminReportDetail(row.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: v.accentText,
            textDecoration: 'none',
            fontFamily: v.fontMono,
            fontSize: 12,
          }}
        >
          {shortId(row.id)}
          <LxIcon name="chevronRight" size={12} color={v.accentText} />
        </Link>
      ),
    },
  ];

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SubHeading
        icon="flag"
        title={`reports against this account — ${rows.length}`}
        note="the most recent reports naming this account as the target."
      />

      <RecordTable
        columns={columns}
        rows={rows}
        emptyIcon="check"
        emptyTitle="no reports against this account"
        emptyHint="nobody has reported this account. this is the healthy case."
      />

      {rows.length > 0 ? (
        <p style={{ margin: 0, fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>
          this is the recent set the account detail carries, not a full history — there is no
          paginated list of reports against one account, so an older report may exist without
          appearing here.
        </p>
      ) : null}
    </section>
  );
}

function SubHeading({ icon, title, note }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: v.fontMono,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: v.ink3,
        }}
      >
        <LxIcon name={icon} size={12} color={v.ink3} />
        {title}
      </span>
      <span style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>{note}</span>
    </div>
  );
}

const Muted = ({ children }) => (
  <span style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>{children}</span>
);
