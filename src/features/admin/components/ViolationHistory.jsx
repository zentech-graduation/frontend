import { useState } from 'react';

import { v } from '@/config/tokens';
import { isAdminRole } from '@/config/roles';
import { useAuthStore } from '@/store/useAuthStore';
import { LxIcon } from '@/components/ui/lx-icon';
import { LxBtn } from '@/features/luvax/components/primitives';
import { toast } from '@/features/luvax/components/Toast';

import { useViolations } from '../hooks/useViolations';
import { useDisciplineActions } from '../hooks/useDisciplineActions';
import { useVocabularies } from '../hooks/useVocabularies';
import { describeError } from '../lib/errors';
import { EmptyState, FailedState, LoadingState } from './ListStates';
import { LoadMore } from './LoadMore';
import { LocalTime } from './LocalTime';
import { ReporterName } from './ReporterName';
import { ReasonConfirmDialog } from './ReasonConfirmDialog';

/**
 * An account's violation history: its warnings, and for an administrator its
 * strikes too. Rendering branches on the union discriminator `kind`, never on
 * the presence of a field, so a strike and a warning are drawn from their own
 * branch and a future record type does not silently mis-render.
 *
 * A moderator sees warnings only; that view is complete for a moderator, so the
 * empty and populated states are worded without implying a strike is hidden.
 * Revocation is administrator-only and sits behind the shared reason-carrying
 * confirmation. The backend removes a revoked record from this list rather than
 * marking it, so a revoke refetches and the record leaves; the revocation is
 * preserved in the action log (recorded in discipline-contract-verification.md).
 *
 * @param {string} userId the account whose history to render
 */
const KIND_TONES = {
  warning: { bg: v.warningDim, color: v.warningText, icon: 'alert', label: 'warning' },
  strike: { bg: v.errorDim, color: v.errorText, icon: 'ban', label: 'strike' },
};

function KindBadge({ kind }) {
  const tone = KIND_TONES[kind] ?? { bg: v.surface, color: v.ink3, icon: 'flag', label: kind };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: v.fontMono,
        fontSize: 10,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderRadius: 999,
        padding: '3px 9px',
        background: tone.bg,
        color: tone.color,
        whiteSpace: 'nowrap',
      }}
    >
      <LxIcon name={tone.icon} size={12} color={tone.color} />
      {tone.label}
    </span>
  );
}

export function ViolationHistory({ userId }) {
  const role = useAuthStore((state) => state.role);
  const isAdmin = isAdminRole(role);
  const { reasonLabel } = useVocabularies();
  const { rows, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useViolations(userId);
  const discipline = useDisciplineActions(userId);

  const [revoking, setRevoking] = useState(null);
  const [serverError, setServerError] = useState(null);

  const closeRevoke = () => {
    setRevoking(null);
    setServerError(null);
  };

  const runRevoke = (reason) => {
    if (!revoking) {
      return;
    }
    const mutation = revoking.kind === 'strike' ? discipline.revokeStrike : discipline.revokeWarning;
    const payload =
      revoking.kind === 'strike' ? { strikeId: revoking.id, reason } : { warningId: revoking.id, reason };
    mutation.mutate(payload, {
      onSuccess: () => {
        toast(`${revoking.kind} revoked`);
        closeRevoke();
      },
      onError: (err) => {
        const described = describeError(err);
        if (described.kind === 'field') {
          setServerError(described.fields?.reason || described.message);
          return;
        }
        if (described.kind !== 'silent') {
          toast(described.message);
        }
        closeRevoke();
      },
    });
  };

  if (isLoading && rows.length === 0) {
    return <LoadingState rows={3} />;
  }
  if (isError && rows.length === 0) {
    return <FailedState message={error?.message} onRetry={refetch} />;
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon="check"
        title="clean record"
        hint={
          isAdmin
            ? 'no warnings or strikes on file for this account.'
            : 'no warnings on file for this account.'
        }
      />
    );
  }

  const revokeBusy = discipline.revokeWarning.isPending || discipline.revokeStrike.isPending;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((record) => (
        <div
          key={record.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 14px',
            border: `1px solid ${v.border}`,
            borderRadius: 12,
            background: v.surfaceSunken,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <KindBadge kind={record.kind} />
              {record.kind === 'warning' ? (
                <span style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 500, color: v.ink }}>
                  {reasonLabel(record.reasonKey)}
                </span>
              ) : null}
              {record.kind === 'strike' ? (
                <span style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 500, color: v.ink }}>
                  strike #{record.strikeNumber}
                </span>
              ) : null}
            </div>

            {record.kind === 'warning' && record.note ? (
              <div style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {record.note}
              </div>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: v.fontBody, fontSize: 12, color: v.ink3, flexWrap: 'wrap' }}>
              <span>by</span>
              <ReporterName userId={record.actorId} prefix="@" />
              <span aria-hidden="true">·</span>
              <LocalTime value={record.createdAt} showZone={false} />
            </div>
          </div>

          {isAdmin ? (
            <LxBtn
              variant="ghost"
              size="sm"
              disabled={revokeBusy}
              onClick={() => {
                setServerError(null);
                setRevoking({ id: record.id, kind: record.kind });
              }}
            >
              revoke
            </LxBtn>
          ) : null}
        </div>
      ))}

      <LoadMore hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} onLoadMore={() => fetchNextPage()} />

      <ReasonConfirmDialog
        open={Boolean(revoking)}
        title={revoking ? `revoke ${revoking.kind}` : 'revoke'}
        description={
          revoking
            ? `this ${revoking.kind} will be revoked and removed from the account's history. the reason is recorded in the action log.`
            : ''
        }
        confirmLabel="revoke"
        tone="danger"
        busy={revokeBusy}
        serverError={serverError}
        onConfirm={runRevoke}
        onClose={closeRevoke}
      />
    </div>
  );
}
