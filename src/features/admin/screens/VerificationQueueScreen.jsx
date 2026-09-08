import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { v } from '@/config/tokens';
import { LxVerifiedBadge } from '@/components/ui/lx-verified-badge';
import { PageHeader, PanelCard } from '../components/PanelPage';
import { EmptyState, FailedState, LoadingState } from '../components/ListStates';
import * as verificationService from '@/services/verification.service';

const queueKeys = {
  all: ['admin', 'verification'],
  queue: (status) => [...queueKeys.all, 'queue', status ?? 'all'],
};

const EVIDENCE_ROWS = [
  ['official website', 'evidenceWebsite'],
  ['profile elsewhere', 'evidenceOtherProfile'],
  ['organisational email domain', 'evidenceEmailDomain'],
  ['published work', 'evidencePublishedWork'],
  ['press coverage', 'evidencePress'],
  ['official listing', 'evidenceOfficialListing'],
  ['note to the moderator', 'evidenceNote'],
];

const STATUS_FILTERS = [
  ['open', 'OPEN'],
  ['in progress', 'IN_PROGRESS'],
  ['answered', 'ANSWERED'],
  ['rejected', 'REJECTED'],
  ['all', ''],
];

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid ${v.border}`,
  background: v.surface,
  color: v.ink,
  fontFamily: v.fontBody,
  fontSize: 13,
};

const buttonStyle = (kind) => ({
  padding: '7px 14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontFamily: v.fontBody,
  fontSize: 13,
  fontWeight: 600,
  color: v.white,
  background: kind === 'approve' ? v.success || '#2E7D32' : v.error,
});

/**
 * The verification review queue.
 *
 * Reachable by a moderator as well as an administrator. Verification is a discretionary grant
 * rather than an enforcement action, so it is deliberately outside the administrator-only section
 * of this panel, unlike the account list and the escalated report queue.
 */
export function VerificationQueueScreen() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('OPEN');
  const [drafts, setDrafts] = useState({});
  const [failure, setFailure] = useState('');

  const queue = useQuery({
    queryKey: queueKeys.queue(status),
    queryFn: ({ signal }) =>
      verificationService.getVerificationQueue(status || undefined, 20, signal),
    select: (payload) => payload?.data ?? [],
  });

  const claim = useMutation({
    mutationFn: (ticketId) => verificationService.claimVerificationTicket(ticketId),
    onSuccess: () => {
      setFailure('');
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
    onError: (error) => setFailure(error?.message || 'that did not work. try again.'),
  });

  const decide = useMutation({
    mutationFn: ({ ticketId, approve, reason, internalNote }) =>
      approve
        ? verificationService.approveVerification(ticketId, { reason, internalNote })
        : verificationService.rejectVerification(ticketId, { reason, internalNote }),
    onSuccess: () => {
      setFailure('');
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
    onError: (error) => setFailure(error?.message || 'that did not work. try again.'),
  });

  const draftFor = (ticketId) => drafts[ticketId] ?? { reason: '', internalNote: '' };
  const setDraft = (ticketId, patch) =>
    setDrafts((current) => ({ ...current, [ticketId]: { ...draftFor(ticketId), ...patch } }));

  const rows = queue.data ?? [];

  return (
    <div>
      <PageHeader
        title="verification"
        right={
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(([label, value]) => (
              <button
                key={label}
                type="button"
                onClick={() => setStatus(value)}
                aria-pressed={status === value}
                style={{
                  padding: '6px 11px',
                  borderRadius: 999,
                  border: `1px solid ${status === value ? v.ink : v.border}`,
                  background: status === value ? v.ink : 'transparent',
                  color: status === value ? v.base : v.ink2,
                  cursor: 'pointer',
                  fontFamily: v.fontMono,
                  fontSize: 11,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {failure ? (
        <div style={{ fontFamily: v.fontBody, fontSize: 13, color: v.error, marginBottom: 12 }}>
          {failure}
        </div>
      ) : null}

      {queue.isLoading ? <LoadingState rows={3} /> : null}
      {queue.isError ? (
        <FailedState message="the queue did not load." onRetry={() => queue.refetch()} />
      ) : null}
      {!queue.isLoading && !queue.isError && rows.length === 0 ? (
        <EmptyState title="nothing to review" hint="no verification requests in this state." />
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rows.map((row) => {
          const draft = draftFor(row.ticketId);
          // Deciding requires holding the claim. Without a claim control the queue would offer two
          // buttons that always refuse, so the row shows the claim first and the decision after it.
          const claimed = Boolean(row.assignedTo);
          const canDecide = claimed && draft.reason.trim().length > 0 && !decide.isPending;
          const terminal = row.status === 'answered' || row.status === 'rejected';
          return (
            <PanelCard
              key={row.ticketId}
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {row.requester?.displayName || row.requester?.username || 'unknown'}
                  <LxVerifiedBadge
                    verified={row.requester?.isVerified}
                    category={row.requester?.verifiedCategory}
                    size={13}
                  />
                </span>
              }
              right={
                <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
                  {row.status} · {row.categoryKey} · {row.evidenceFieldCount}/7 evidence
                </span>
              }
            >
              <div
                style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2, marginBottom: 10 }}
              >
                claims the name <strong style={{ color: v.ink }}>{row.claimedName}</strong>
              </div>

              <dl style={{ margin: '0 0 12px', display: 'grid', gap: 6 }}>
                {EVIDENCE_ROWS.filter(([, key]) => row[key]).map(([label, key]) => (
                  <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <dt
                      style={{
                        fontFamily: v.fontMono,
                        fontSize: 10,
                        color: v.ink3,
                        minWidth: 168,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {label}
                    </dt>
                    <dd
                      style={{
                        margin: 0,
                        fontFamily: v.fontBody,
                        fontSize: 13,
                        color: v.ink,
                        wordBreak: 'break-word',
                      }}
                    >
                      {row[key]}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Reviewing a resubmission blind is how the same bad grant gets made twice, so every
                  previous grant is shown with who withdrew it. A badge lost to a suspension carries
                  no judgement about the claim; one a moderator withdrew does. */}
              {row.previousGrants?.length ? (
                <div
                  style={{
                    borderTop: `1px solid ${v.border}`,
                    paddingTop: 10,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>
                    PREVIOUS GRANTS
                  </div>
                  {row.previousGrants.map((grant) => (
                    <div
                      key={grant.id}
                      style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink2, marginTop: 4 }}
                    >
                      {grant.categoryKey}
                      {grant.revokedAt
                        ? ` · withdrawn by ${grant.revocationActor}${
                            grant.revocationReason ? `: ${grant.revocationReason}` : ''
                          }`
                        : ' · still held'}
                    </div>
                  ))}
                </div>
              ) : null}

              {terminal ? (
                <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>
                  already decided.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {claimed ? null : (
                    <button
                      type="button"
                      aria-label={`Claim the request from ${row.claimedName}`}
                      disabled={claim.isPending}
                      onClick={() => claim.mutate(row.ticketId)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: `1px solid ${v.border}`,
                        background: 'transparent',
                        color: v.ink,
                        cursor: 'pointer',
                        fontFamily: v.fontBody,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {claim.isPending ? 'claiming...' : 'claim to review'}
                    </button>
                  )}
                  <input
                    aria-label={`decision reason for ${row.claimedName}`}
                    disabled={!claimed}
                    placeholder="reason (sent to the requester)"
                    value={draft.reason}
                    onChange={(event) => setDraft(row.ticketId, { reason: event.target.value })}
                    style={inputStyle}
                  />
                  <input
                    aria-label={`internal note for ${row.claimedName}`}
                    disabled={!claimed}
                    placeholder="internal note (never sent)"
                    value={draft.internalNote}
                    onChange={(event) =>
                      setDraft(row.ticketId, { internalNote: event.target.value })
                    }
                    style={inputStyle}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      disabled={!canDecide}
                      style={{ ...buttonStyle('approve'), opacity: canDecide ? 1 : 0.5 }}
                      onClick={() =>
                        decide.mutate({ ticketId: row.ticketId, approve: true, ...draft })
                      }
                    >
                      approve
                    </button>
                    <button
                      type="button"
                      disabled={!canDecide}
                      style={{ ...buttonStyle('reject'), opacity: canDecide ? 1 : 0.5 }}
                      onClick={() =>
                        decide.mutate({ ticketId: row.ticketId, approve: false, ...draft })
                      }
                    >
                      reject
                    </button>
                  </div>
                </div>
              )}
            </PanelCard>
          );
        })}
      </div>
    </div>
  );
}
