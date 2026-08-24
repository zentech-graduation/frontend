import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import { v } from '@/config/tokens';
import { routeTo } from '@/config/constants';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { LxIcon } from '@/components/ui/lx-icon';

import { useActionDetail } from '../hooks/useActions';
import { useVocabularies } from '../hooks/useVocabularies';
import { getErrorCode } from '../lib/errors';
import { LocalTime } from './LocalTime';
import { ReporterName } from './ReporterName';
import { FailedState } from './ListStates';
import { NotAvailable } from './NotAvailable';

/**
 * The action detail drawer. Opening a row is the only thing that fetches an
 * action's detail; the list never carries `metadata`. The drawer is portalled so
 * a scrolling ancestor cannot clip it, closes on Escape, and its open state
 * lives in the URL (the `action` query parameter) so a specific action is a
 * shareable link.
 *
 * The metadata object's shape depends on the action type. Each shape enumerated
 * in the contract verification is rendered deliberately by recognising its keys;
 * any key not recognised falls through to a readable generic key/value line, so
 * an unenumerated shape renders legibly rather than blank or broken. A null
 * metadata renders as an explicit "no additional detail" rather than an empty
 * region.
 */
const FIELD_LABEL = {
  reasonKey: 'reason',
  strikeNumber: 'strike number',
  resultingStatus: 'resulting status',
  consequenceApplied: 'consequence applied',
  // Renamed from `strippedHashtags`, and the label changed with it because the
  // meaning did: it is the banned tags the caption still carries after the
  // restore — the post's state — not what that call removed.
  remainingBannedHashtags: 'banned hashtags still in the caption',
  warningIds: 'warnings rolled up',
  triggeredByModeratorId: 'triggered by',
};

const humanize = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

function MetaLabel({ children }) {
  return (
    <span
      style={{
        fontFamily: v.fontMono,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: v.ink2,
      }}
    >
      {children}
    </span>
  );
}

function MetaRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <MetaLabel>{label}</MetaLabel>
      <span
        style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink, overflowWrap: 'anywhere' }}
      >
        {children}
      </span>
    </div>
  );
}

/** Renders one metadata value, recognising the enumerated shapes' keys. */
function MetaValue({ fieldKey, value, reasonLabel }) {
  if (fieldKey === 'reasonKey') {
    return <>{reasonLabel(value)}</>;
  }
  if (fieldKey === 'consequenceApplied') {
    return <>{value ? 'yes' : 'no'}</>;
  }
  if (fieldKey === 'triggeredByModeratorId') {
    return <ReporterName userId={value} prefix="@" />;
  }
  if (fieldKey === 'remainingBannedHashtags' || fieldKey === 'warningIds') {
    if (!Array.isArray(value) || value.length === 0) {
      return <span style={{ color: v.ink2 }}>none</span>;
    }
    if (fieldKey === 'remainingBannedHashtags') {
      return <>{value.map((tag) => `#${tag}`).join(', ')}</>;
    }
    return (
      <>
        {value.length} warning{value.length === 1 ? '' : 's'}
      </>
    );
  }
  if (value === null || value === undefined) {
    return <span style={{ color: v.ink2 }}>none</span>;
  }
  if (typeof value === 'object') {
    return (
      <code style={{ fontFamily: v.fontMono, fontSize: 12, color: v.ink2, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(value, null, 2)}
      </code>
    );
  }
  return <>{String(value)}</>;
}

function ActionMetadata({ metadata, reasonLabel }) {
  if (
    metadata === null ||
    metadata === undefined ||
    (typeof metadata === 'object' && Object.keys(metadata).length === 0)
  ) {
    return (
      <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2 }}>
        no additional detail recorded.
      </span>
    );
  }
  if (typeof metadata !== 'object') {
    return (
      <span style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink }}>{String(metadata)}</span>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Object.entries(metadata).map(([key, value]) => (
        <MetaRow key={key} label={FIELD_LABEL[key] ?? humanize(key)}>
          <MetaValue fieldKey={key} value={value} reasonLabel={reasonLabel} />
        </MetaRow>
      ))}
    </div>
  );
}

export function ActionDetailDrawer({ actionId, onClose }) {
  const open = Boolean(actionId);
  const { action, isLoading, isError, error } = useActionDetail(actionId);
  const { actionLabel, actionKnown, reasonLabel } = useVocabularies();

  useEscapeKey(open, onClose);

  if (!open) {
    return null;
  }

  const notFound = isError && getErrorCode(error) === 'ADMIN_ACTION_NOT_FOUND';
  const known = action ? actionKnown(action.actionType) : true;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483300,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: v.scrim }} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="action detail"
        style={{
          position: 'relative',
          width: 460,
          maxWidth: '100%',
          height: '100%',
          background: v.base,
          borderLeft: `1px solid ${v.border}`,
          boxShadow: `-20px 0 60px ${v.shadow25}`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '18px 20px',
            borderBottom: `1px solid ${v.border}`,
            position: 'sticky',
            top: 0,
            background: v.base,
          }}
        >
          <span
            style={{
              fontFamily: v.fontDisplay,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '-0.02em',
              color: v.ink,
            }}
          >
            action detail
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            style={{
              display: 'inline-flex',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 8,
            }}
          >
            <LxIcon name="close" size={18} color={v.ink2} />
          </button>
        </header>

        <div style={{ padding: 20 }}>
          {isLoading ? (
            <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2 }}>
              loading action...
            </div>
          ) : notFound ? (
            <NotAvailable
              title="action not available"
              message="this action was not found, or it was performed by someone else and is not visible to you."
            />
          ) : isError || !action ? (
            <FailedState message={error?.message} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{ fontFamily: v.fontBody, fontSize: 16, fontWeight: 600, color: v.ink }}
                >
                  {actionLabel(action.actionType)}
                </span>
                {!known ? (
                  <span
                    title="this action type is not in the moderation-action vocabulary"
                    style={{
                      fontFamily: v.fontMono,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: v.warningText,
                      background: v.warningDim,
                      borderRadius: 999,
                      padding: '2px 8px',
                    }}
                  >
                    unknown type
                  </span>
                ) : null}
              </div>

              <MetaRow label="performed by">
                {action.adminId ? (
                  <ReporterName userId={action.adminId} prefix="@" />
                ) : (
                  <span style={{ color: v.ink2, fontStyle: 'italic' }}>system</span>
                )}
              </MetaRow>

              {action.targetUserId ? (
                <MetaRow label="target account">
                  <Link
                    to={routeTo.adminUser(action.targetUserId)}
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: v.accentText,
                    }}
                  >
                    <ReporterName userId={action.targetUserId} prefix="@" />
                    <LxIcon name="chevronRight" size={13} color={v.accentText} />
                  </Link>
                </MetaRow>
              ) : (
                <MetaRow label="target">
                  {action.targetEntityType}
                  {action.targetEntityId ? (
                    <span
                      style={{ fontFamily: v.fontMono, fontSize: 12, color: v.ink2, marginLeft: 8 }}
                    >
                      {action.targetEntityId.slice(0, 8)}
                    </span>
                  ) : null}
                </MetaRow>
              )}

              <MetaRow label="reason">
                {action.reason ? action.reason : <span style={{ color: v.ink2 }}>none</span>}
              </MetaRow>

              <MetaRow label="when">
                <LocalTime value={action.createdAt} />
              </MetaRow>

              {/* The originating report is shown for every action that has one,
                  but an `escalate_report` row deliberately does not link.
                  Following your own escalations was the job this link was doing
                  before a dedicated endpoint existed, and "my escalations" does
                  it now — with the outcome, which a link to one report at a time
                  never gave. Two routes to one job is the defect this phase is
                  removing, so the id stays as the record and the route is the
                  screen. */}
              {action.reportId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <MetaLabel>originating report</MetaLabel>
                  {action.actionType === 'escalate_report' ? (
                    <span style={{ fontFamily: v.fontMono, fontSize: 13, color: v.ink2 }}>
                      {action.reportId.slice(0, 8)} — listed under “my escalations”, with what
                      became of it
                    </span>
                  ) : (
                    <Link
                      to={routeTo.adminReportDetail(action.reportId)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: v.fontBody,
                        fontSize: 14,
                        color: v.accentText,
                        textDecoration: 'none',
                      }}
                    >
                      <LxIcon name="external" size={14} color={v.accentText} />
                      open report {action.reportId.slice(0, 8)}
                    </Link>
                  )}
                </div>
              ) : null}

              <div
                style={{
                  borderTop: `1px solid ${v.border}`,
                  paddingTop: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <MetaLabel>metadata</MetaLabel>
                <ActionMetadata metadata={action.metadata} reasonLabel={reasonLabel} />
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}
