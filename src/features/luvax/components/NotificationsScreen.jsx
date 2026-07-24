import { useState, useEffect } from 'react';
import { v } from '@/config/tokens';
import { LxIcon, LxAvatar, LxBtn } from './primitives';
import { usePendingFollowRequests, useApproveFollowRequest, useRejectFollowRequest } from '../hooks/useSocial';
import { useNotifications, useMarkAllAsRead } from '../hooks/useNotifications';
import { useUserProfile } from '../hooks/useUsers';
import { useRelativeTime } from '../hooks/useRelativeTime';

const TYPE_ICON = {
  like: 'heart', follow: 'profile', follow_request: 'profile',
  comment: 'reply', mention: 'hash', story: 'eye',
};

const TYPE_COLOR = {
  like: v.error, follow: v.success, follow_request: v.success,
  comment: v.accent, mention: v.avatar2, story: v.avatar3,
};

function NotifRow({ n, navigate, onAccept, onDecline }) {
  const { data: userProfileData } = useUserProfile(n.actorId);
  const actorProfile = userProfileData?.data || userProfileData;
  const timeStr = useRelativeTime(n.createdAt);

  const isFollow = n.type === 'follow' || n.type === 'follow_request';
  const text = isFollow ? 'started following you' : n.type === 'like' ? 'liked your post' : 'interacted with you';
  const icon = isFollow ? 'profile' : 'heart';
  const color = isFollow ? v.success : v.error;

  const actorName = actorProfile?.username || actorProfile?.displayName || 'Someone';
  const avatarSrc = actorProfile?.avatarUrl;

  return (
    <div onClick={() => n.entityId && navigate('post', { post: { id: n.entityId } })} style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px',
      background: !n.isRead ? 'var(--lx-accent-dim)' : 'transparent',
      cursor: n.entityId ? 'pointer' : 'default',
      borderBottom: `1px solid ${v.borderSubtle}`,
      position: 'relative',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <LxAvatar size={40} idx={n.actorProfile?.idx || 0} src={avatarSrc} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: '50%',
          background: color,
          border: `2px solid var(--lx-base)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LxIcon name={icon} size={10} color={v.white} stroke={2} filled={!isFollow} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink, lineHeight: 1.4 }}>
          <strong style={{ fontWeight: 600, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate('profile', { user: { id: n.actorId } }); }}>{actorName}</strong> <span style={{ color: v.ink2 }}>{text}</span>
        </div>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, marginTop: 4 }}>{timeStr}</div>
      </div>

      {n.type === 'follow_request' && (
        <div style={{ display: 'flex', gap: 6, alignSelf: 'center', flexShrink: 0 }}>
          <LxBtn
            variant="primary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onAccept?.(n.actorId);
            }}
          >
            accept
          </LxBtn>
          <LxBtn
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onDecline?.(n.actorId);
            }}
          >
            decline
          </LxBtn>
        </div>
      )}
    </div>
  );
}

function RequestRow({ req, navigate, onAccept, onDecline }) {
  const user = req.requester || {};
  const timeStr = useRelativeTime(req.createdAt);
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px',
      borderBottom: `1px solid ${v.borderSubtle}`,
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <LxAvatar size={40} src={user.avatarUrl} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: '50%',
          background: TYPE_COLOR['follow_request'],
          border: `2px solid var(--lx-base)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LxIcon name={TYPE_ICON['follow_request']} size={10} color={v.white} stroke={2} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink, lineHeight: 1.4 }}>
          <strong onClick={() => navigate('profile', { user: { id: user.id } })} style={{ fontWeight: 600, cursor: 'pointer' }}>{user.username}</strong> <span style={{ color: v.ink2 }}>requested to follow you</span>
        </div>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, marginTop: 4 }}>{timeStr}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, alignSelf: 'center', flexShrink: 0 }}>
        <LxBtn variant="primary" size="sm" onClick={() => onAccept(req.requesterId || user.id)}>accept</LxBtn>
        <LxBtn variant="ghost" size="sm" onClick={() => onDecline(req.requesterId || user.id)}>decline</LxBtn>
      </div>
    </div>
  );
}

export function NotificationsScreen({ navigate }) {
  const [tab, setTab] = useState('all');
  
  const { data: requestsResponse, isLoading: isLoadingRequests } = usePendingFollowRequests();
  const approveReq = useApproveFollowRequest();
  const rejectReq = useRejectFollowRequest();
  
  const { data: notifsData, isLoading: isLoadingNotifs } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();

  const requests = requestsResponse?.data || requestsResponse || [];
  
  let notifs = notifsData?.pages?.flatMap(page => page?.data?.content || page?.content || []) || [];

  useEffect(() => {
    if (tab === 'all') {
      markAllAsRead.mutate();
    }
  }, [tab]);

  return (
    <>
      <div style={{ display: 'flex', borderBottom: `1px solid ${v.border}`, position: 'sticky', top: 0, background: v.base, zIndex: 5 }}>
        {['all', 'mentions', 'requests'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, fontFamily: v.fontBody, fontSize: 13, fontWeight: 500,
            color: tab === t ? v.ink : v.ink3,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 0',
            borderBottom: tab === t ? `2px solid var(--lx-ink)` : '2px solid transparent',
            marginBottom: -1,
            position: 'relative',
          }}>
            {t}
            {t === 'requests' && requests.length > 0 && (
              <span style={{ position: 'absolute', top: 12, right: '20%', width: 6, height: 6, borderRadius: '50%', background: v.accent }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        {tab === 'requests' ? (
          isLoadingRequests ? (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>loading requests...</div>
          ) : requests.length > 0 ? (
            requests.map((r, i) => (
              <RequestRow 
                key={i} 
                req={r} 
                navigate={navigate} 
                onAccept={(id) => approveReq.mutate(id)} 
                onDecline={(id) => rejectReq.mutate(id)} 
              />
            ))
          ) : (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>No pending requests</div>
          )
        ) : (
          isLoadingNotifs ? (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>loading notifications...</div>
          ) : notifs.length > 0 ? (
            notifs.map((n, i) => (
              <NotifRow
                key={n.id || i}
                n={n}
                navigate={navigate}
                onAccept={(id) => approveReq.mutate(id)}
                onDecline={(id) => rejectReq.mutate(id)}
              />
            ))
          ) : (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>No notifications yet</div>
          )
        )}
      </div>
    </>
  );
}
