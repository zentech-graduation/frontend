import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v } from '@/config/tokens';
import { extractPageContent, getDisplayName, getUserSummary } from '@/utils/helpers';
import { LxIcon, LxAvatar, LxBtn } from './primitives';
import {
  usePendingFollowRequests,
  useApproveFollowRequest,
  useRejectFollowRequest,
} from '../hooks/useSocial';
import { useNotifications, useMarkAllAsRead } from '../hooks/useNotifications';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { useOverlayNavigate } from '../hooks/useOverlayNavigate';
import { routeTo } from '@/config/constants';

// Keyed on the notification_type enum values the backend actually sends.
// The previous mapping tested for 'like' and 'comment', which are not members
// of that enum, so every row fell through to the generic wording.
const NOTIFICATION_TEXT = {
  like_post: 'liked your post',
  like_comment: 'liked your comment',
  comment_post: 'commented on your post',
  reply_comment: 'replied to your comment',
  follow: 'started following you',
  follow_request: 'requested to follow you',
  mention_post: 'mentioned you in a post',
  mention_comment: 'mentioned you in a comment',
  story_view: 'viewed your story',
  message: 'sent you a message',
  post_removed: 'removed your post',
  report_post_removed: 'removed a post you reported',
  post_restored: 'restored your post',
  report_dismissed: 'dismissed your report',
};

const TYPE_ICON = {
  like: 'heart',
  follow: 'profile',
  follow_request: 'profile',
  comment: 'reply',
  mention: 'hash',
  story: 'eye',
  moderation: 'flag',
};

const TYPE_COLOR = {
  like: v.error,
  follow: v.success,
  follow_request: v.success,
  comment: v.accent,
  mention: v.avatar2,
  story: v.avatar3,
  moderation: v.warningText,
};

// The maps above are keyed by category, but the backend sends full enum values
// (like_post, comment_post, reply_comment, ...). This collapses a value to its
// category so the row can use the per-type icon and colour it was ignoring.
function notifCategory(type) {
  if (!type) return 'like';
  if (type === 'follow_request') return 'follow_request';
  if (type.startsWith('follow')) return 'follow';
  if (type.startsWith('like')) return 'like';
  if (type.startsWith('comment') || type.startsWith('reply')) return 'comment';
  if (type.startsWith('mention')) return 'mention';
  if (type.startsWith('story')) return 'story';
  if (
    type === 'post_removed' ||
    type === 'report_post_removed' ||
    type === 'post_restored' ||
    type === 'report_dismissed' ||
    type === 'warning'
  ) {
    return 'moderation';
  }
  return 'comment';
}

// Groups notifications by recency for the date-grouped view the design uses.
function notifBucket(createdAt) {
  const then = new Date(createdAt);
  if (Number.isNaN(then.getTime())) return 'earlier';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = then.getTime();
  if (t >= startOfToday) return 'today';
  if (t >= startOfToday - 6 * 24 * 60 * 60 * 1000) return 'this week';
  return 'earlier';
}

const BUCKET_ORDER = ['today', 'this week', 'earlier'];

function GroupHeading({ label }) {
  return (
    <div
      style={{
        fontFamily: v.fontMono,
        fontSize: 10,
        color: v.ink3,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '16px 16px 8px',
      }}
    >
      {label}
    </div>
  );
}

function NotifRow({ n, onAccept, onDecline }) {
  const navigate = useNavigate();
  const openOverlay = useOverlayNavigate();
  // NotificationResponse embeds the actor as a UserSummaryResponse. There is
  // no `n.actorId`, so no per-row profile fetch is needed.
  const actor = getUserSummary(n, 'actor');
  const timeStr = useRelativeTime(n.createdAt);

  const isFollow = n.type === 'follow' || n.type === 'follow_request';
  const text = NOTIFICATION_TEXT[n.type] ?? 'interacted with you';
  // Use the per-type icon and colour maps rather than collapsing every type to
  // two. A like is a filled heart in the error hue, a comment the accent reply
  // glyph, a mention the hash, a story the eye, a follow the profile mark.
  const category = notifCategory(n.type);
  const icon = TYPE_ICON[category] ?? 'heart';
  const color = TYPE_COLOR[category] ?? v.error;
  const filledBadge = category === 'like';

  const actorName = getDisplayName(actor, 'Someone');
  const isSystemModeration =
    n.type === 'post_removed' ||
    n.type === 'report_post_removed' ||
    n.type === 'post_restored' ||
    n.type === 'report_dismissed';
  const displayName = isSystemModeration ? 'Luvax' : actorName;
  const avatarSrc = actor.avatarUrl;
  const canOpenTarget = !isSystemModeration;

  // Route by what the notification points at. A content notification now carries
  // postId, the post it concerns, so it opens that post directly. When the
  // notification is about a comment (entityType 'comment', entityId the comment),
  // the post detail is told to focus and briefly highlight that comment. Older
  // like-post notifications carried the post id in entityId with no postId, so
  // that path is kept. A follow or a content notification predating postId carries
  // no post to open and falls back to the actor's profile.
  const openTarget = () => {
    if (!canOpenTarget) {
      return;
    }
    if (n.postId) {
      const highlightComment = n.entityType === 'comment' ? n.entityId : null;
      openOverlay(
        routeTo.postDetail(n.postId),
        highlightComment ? { highlightComment } : undefined
      );
      return;
    }
    if (n.entityType === 'post' && n.entityId) {
      openOverlay(routeTo.postDetail(n.entityId));
      return;
    }
    if (actor?.id) {
      navigate(routeTo.userProfile(actor.id));
    }
  };
  const isClickable =
    canOpenTarget &&
    (Boolean(n.postId) || (n.entityType === 'post' && Boolean(n.entityId)) || Boolean(actor?.id));

  return (
    <div
      onClick={openTarget}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        background: !n.isRead ? 'var(--lx-accent-dim)' : 'transparent',
        cursor: isClickable ? 'pointer' : 'default',
        borderBottom: `1px solid ${v.borderSubtle}`,
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <LxAvatar size={40} src={avatarSrc} />
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: color,
            border: `2px solid var(--lx-base)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LxIcon name={icon} size={10} color={v.white} stroke={2} filled={filledBadge} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink, lineHeight: 1.4 }}>
          <strong
            style={{ fontWeight: 600, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (actor?.id) navigate(routeTo.userProfile(actor.id));
            }}
          >
            {displayName}
          </strong>{' '}
          <span style={{ color: v.ink2 }}>{text}</span>
        </div>
        {n.message ? (
          <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink2, marginTop: 4 }}>
            reason: {n.message}
          </div>
        ) : null}
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, marginTop: 4 }}>
          {timeStr}
        </div>
      </div>

      {n.type === 'follow_request' && (
        <div style={{ display: 'flex', gap: 6, alignSelf: 'center', flexShrink: 0 }}>
          <LxBtn
            variant="primary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onAccept?.(actor.id);
            }}
          >
            accept
          </LxBtn>
          <LxBtn
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onDecline?.(actor.id);
            }}
          >
            decline
          </LxBtn>
        </div>
      )}
    </div>
  );
}

function RequestRow({ req, onAccept, onDecline }) {
  const navigate = useNavigate();
  // FollowRequestResponse names the requesting user `follower`.
  const user = getUserSummary(req, 'follower');
  const timeStr = useRelativeTime(req.createdAt);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        borderBottom: `1px solid ${v.borderSubtle}`,
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <LxAvatar size={40} src={user.avatarUrl} />
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: TYPE_COLOR['follow_request'],
            border: `2px solid var(--lx-base)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LxIcon name={TYPE_ICON['follow_request']} size={10} color={v.white} stroke={2} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink, lineHeight: 1.4 }}>
          <strong
            onClick={() => user?.id && navigate(routeTo.userProfile(user.id))}
            style={{ fontWeight: 600, cursor: 'pointer' }}
          >
            {getDisplayName(user)}
          </strong>{' '}
          <span style={{ color: v.ink2 }}>requested to follow you</span>
        </div>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, marginTop: 4 }}>
          {timeStr}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, alignSelf: 'center', flexShrink: 0 }}>
        <LxBtn variant="primary" size="sm" onClick={() => onAccept(user.id)}>
          accept
        </LxBtn>
        <LxBtn variant="ghost" size="sm" onClick={() => onDecline(user.id)}>
          decline
        </LxBtn>
      </div>
    </div>
  );
}

export function NotificationsScreen() {
  const [tab, setTab] = useState('all');

  const { data: requestsResponse, isLoading: isLoadingRequests } = usePendingFollowRequests();
  const approveReq = useApproveFollowRequest();
  const rejectReq = useRejectFollowRequest();

  const { data: notifsData, isLoading: isLoadingNotifs } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();

  const requests = extractPageContent(requestsResponse);

  const notifs = notifsData?.pages?.flatMap((page) => extractPageContent(page)) || [];

  useEffect(() => {
    if (tab === 'all') {
      markAllAsRead.mutate();
    }
  }, [tab]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${v.border}`,
          position: 'sticky',
          top: 0,
          background: v.base,
          zIndex: 5,
        }}
      >
        {['all', 'mentions', 'requests'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              fontFamily: v.fontBody,
              fontSize: 13,
              fontWeight: 500,
              color: tab === t ? v.ink : v.ink3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '12px 0',
              borderBottom: tab === t ? `2px solid var(--lx-ink)` : '2px solid transparent',
              marginBottom: -1,
              position: 'relative',
            }}
          >
            {t}
            {t === 'requests' && requests.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 12,
                  right: '20%',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: v.accent,
                }}
              />
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        {tab === 'requests' ? (
          isLoadingRequests ? (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                fontFamily: v.fontMono,
                fontSize: 12,
                color: v.ink3,
              }}
            >
              loading requests...
            </div>
          ) : requests.length > 0 ? (
            requests.map((r, i) => (
              <RequestRow
                key={i}
                req={r}
                onAccept={(id) => approveReq.mutate(id)}
                onDecline={(id) => rejectReq.mutate(id)}
              />
            ))
          ) : (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                fontFamily: v.fontMono,
                fontSize: 12,
                color: v.ink3,
              }}
            >
              no pending requests
            </div>
          )
        ) : isLoadingNotifs ? (
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              fontFamily: v.fontMono,
              fontSize: 12,
              color: v.ink3,
            }}
          >
            loading notifications...
          </div>
        ) : notifs.length > 0 ? (
          BUCKET_ORDER.map((bucket) => {
            const rows = notifs.filter((n) => notifBucket(n.createdAt) === bucket);
            if (rows.length === 0) return null;
            return (
              <div key={bucket}>
                <GroupHeading label={bucket} />
                {rows.map((n, i) => (
                  <NotifRow
                    key={n.id || `${bucket}-${i}`}
                    n={n}
                    onAccept={(id) => approveReq.mutate(id)}
                    onDecline={(id) => rejectReq.mutate(id)}
                  />
                ))}
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: v.fontMono,
              fontSize: 12,
              color: v.ink3,
            }}
          >
            no notifications yet
          </div>
        )}
      </div>
    </>
  );
}
