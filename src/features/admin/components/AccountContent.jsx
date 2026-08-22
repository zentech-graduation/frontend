import { useState } from 'react';

import { v } from '@/config/tokens';
import { LxTag, LxBtn } from '@/features/luvax/components/primitives';
import { toast } from '@/features/luvax/components/Toast';

import { useUserContent, useContentModeration } from '../hooks/useUserContent';
import { describeError } from '../lib/errors';
import { restoreSuccessMessage } from '../lib/contentModeration';
import { EmptyState, FailedState, LoadingState } from './ListStates';
import { LoadMore } from './LoadMore';
import { LocalTime } from './LocalTime';
import { StatusBadge } from './StatusBadge';
import { ReasonConfirmDialog } from './ReasonConfirmDialog';

/**
 * Everything an account has posted or commented, so a reviewer can judge a
 * pattern rather than a single incident. Posts and comments are two views of the
 * same screen, switched by a tab, not two screens.
 *
 * Removed content is included by the endpoint and kept visible, distinguished
 * from live content by a dimmed row and a "removed" badge, since a reviewer
 * scanning for a pattern needs to see what was already acted on. Remove and
 * restore reuse the same `adminApi` calls the report detail uses; only the cache
 * invalidation differs. Post restore and comment restore are handled separately
 * because their response shapes differ — post restore names any dropped hashtags.
 *
 * The content row carries no media field, so no media is rendered; its absence
 * is the row simply not carrying it (recorded in the contract verification).
 *
 * @param {string} userId the account whose content to show
 */
function ContentRow({ row, kind, onRemove, onRestore, busy }) {
  const text = kind === 'posts' ? row.caption : row.content;
  const isRemoved = row.removed === true;
  const status = kind === 'posts' ? row.status : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        border: `1px solid ${v.border}`,
        borderRadius: 12,
        background: isRemoved ? v.surface : v.surfaceSunken,
        opacity: isRemoved ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {status ? <StatusBadge status={status} size="sm" /> : null}
          {isRemoved && status !== 'removed' ? <StatusBadge status="removed" size="sm" /> : null}
        </div>
        <div
          style={{
            fontFamily: v.fontBody,
            fontSize: 14,
            color: isRemoved ? v.ink3 : v.ink,
            textDecoration: isRemoved ? 'line-through' : 'none',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            overflowWrap: 'anywhere',
          }}
        >
          {text || <span style={{ fontStyle: 'italic', color: v.ink3 }}>no text</span>}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: v.fontMono,
            fontSize: 11,
            color: v.ink3,
            flexWrap: 'wrap',
          }}
        >
          <LocalTime value={row.createdAt} showZone={false} />
          <span aria-hidden="true">·</span>
          <span>{row.likeCount ?? 0} likes</span>
          {kind === 'posts' ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{row.commentCount ?? 0} comments</span>
            </>
          ) : null}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        {isRemoved ? (
          <LxBtn variant="secondary" size="sm" disabled={busy} onClick={() => onRestore(row)}>
            restore
          </LxBtn>
        ) : (
          <LxBtn variant="ghost" size="sm" disabled={busy} onClick={() => onRemove(row)}>
            remove
          </LxBtn>
        )}
      </div>
    </div>
  );
}

function ContentList({ userId, kind }) {
  const singular = kind === 'posts' ? 'post' : 'comment';
  const {
    rows,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useUserContent(userId, kind);
  const moderation = useContentModeration(userId);

  const [active, setActive] = useState(null);
  const [serverError, setServerError] = useState(null);

  const close = () => {
    setActive(null);
    setServerError(null);
  };

  const busy =
    moderation.removePost.isPending ||
    moderation.restorePost.isPending ||
    moderation.removeComment.isPending ||
    moderation.restoreComment.isPending;

  const handleError = (err) => {
    const described = describeError(err);
    if (described.kind === 'field') {
      setServerError(described.fields?.reason || described.message);
      return;
    }
    if (described.isConflict) {
      toast('this content was already changed. refreshing.');
      refetch();
      close();
      return;
    }
    if (described.kind !== 'silent') {
      toast(described.message);
    }
    close();
  };

  const runRemove = (reason) => {
    const mutation = kind === 'posts' ? moderation.removePost : moderation.removeComment;
    mutation.mutate(
      { entityId: active.row.id, reason },
      {
        onSuccess: () => {
          toast(`${singular} removed`);
          close();
        },
        onError: handleError,
      }
    );
  };

  const runRestore = (reason) => {
    const mutation = kind === 'posts' ? moderation.restorePost : moderation.restoreComment;
    mutation.mutate(
      { entityId: active.row.id, reason },
      {
        onSuccess: (data) => {
          toast(restoreSuccessMessage(singular, data));
          close();
        },
        onError: handleError,
      }
    );
  };

  if (isLoading && rows.length === 0) {
    return <LoadingState rows={4} />;
  }
  if (isError && rows.length === 0) {
    return <FailedState message={error?.message} onRetry={refetch} />;
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={kind === 'posts' ? 'image' : 'chat'}
        title={`no ${kind}`}
        hint={`this account has not ${kind === 'posts' ? 'posted anything' : 'left any comments'}.`}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row) => (
        <ContentRow
          key={row.id}
          row={row}
          kind={kind}
          busy={busy}
          onRemove={(r) => {
            setServerError(null);
            setActive({ row: r, mode: 'remove' });
          }}
          onRestore={(r) => {
            setServerError(null);
            setActive({ row: r, mode: 'restore' });
          }}
        />
      ))}

      <LoadMore
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />

      <ReasonConfirmDialog
        open={Boolean(active)}
        title={active ? `${active.mode} ${singular}` : ''}
        description={
          active
            ? active.mode === 'remove'
              ? `take down this ${singular}. the reason is recorded.`
              : `put this ${singular} back. the reason is recorded.`
            : ''
        }
        confirmLabel={active?.mode ?? 'confirm'}
        tone={active?.mode === 'remove' ? 'danger' : 'primary'}
        busy={busy}
        serverError={serverError}
        onConfirm={active?.mode === 'remove' ? runRemove : runRestore}
        onClose={close}
      />
    </div>
  );
}

export function AccountContent({ userId }) {
  const [tab, setTab] = useState('posts');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <LxTag size="sm" active={tab === 'posts'} onClick={() => setTab('posts')}>
          posts
        </LxTag>
        <LxTag size="sm" active={tab === 'comments'} onClick={() => setTab('comments')}>
          comments
        </LxTag>
      </div>
      {/* Only the active tab's list is mounted, so the inactive endpoint is not
          fetched until its tab is opened. */}
      <ContentList key={tab} userId={userId} kind={tab} />
    </div>
  );
}
