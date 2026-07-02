import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '../constants/tokens';
import { LxBtn } from './primitives';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserPosts } from '../hooks/usePosts';

export function ProfileScreen({ navigate, params = {}, viewport }) {
  const [tab, setTab] = useState('posts');
  const [following, setFollowing] = useState(false);
  const currentUser = useAuthStore(state => state.user);
  
  // Use passed user or default to current logged-in user
  const user = params.user || currentUser;
  const isSelf = !params.user || params.user.id === currentUser?.id;
  
  const { ref, inView } = useInView();
  const { 
    data: postsResponse, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useUserPosts(user?.id);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten the infinite paginated response
  const posts = postsResponse?.pages?.flatMap(page => page?.data?.content || page?.content || []) || [];

  const cols = viewport === 'desktop' ? 3 : viewport === 'tablet' ? 3 : 3;

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Cover band */}
        <div style={{ height: 88, background: v.surfaceRaised }} />

        {/* Avatar + follow */}
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#C8A97E',
            border: `3px solid var(--lx-base)`,
            flexShrink: 0,
          }} />
          {!isSelf && (
            <LxBtn
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setFollowing(f => !f)}
              style={{ marginBottom: 8 }}>
              {following ? 'following' : 'follow'}
            </LxBtn>
          )}
          {isSelf && (
            <LxBtn variant="secondary" size="sm" style={{ marginBottom: 8 }} onClick={() => navigate('settings')}>
              edit profile
            </LxBtn>
          )}
        </div>

        {/* Name + bio */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: v.fontDisplay, fontSize: 22, fontWeight: 700, color: v.ink, letterSpacing: '-0.02em' }}>{user?.displayName || user?.firstName || 'Unknown'}</div>
          </div>
          <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 2 }}>@{user?.username}</div>
          <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, lineHeight: 1.5, marginTop: 10, maxWidth: 480 }}>{user?.bio || ''}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 28, padding: '16px 16px 16px', borderBottom: `1px solid ${v.border}` }}>
          {[['posts', user?.postsCount || 0], ['following', user?.followingCount || 0], ['followers', user?.followersCount || 0]].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: v.fontMono, fontSize: 16, fontWeight: 500, color: v.ink }}>{val}</span>
              <span style={{ fontFamily: v.fontMono, fontSize: 9, color: v.ink3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${v.border}` }}>
          {['posts', 'photos', 'liked'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, fontFamily: v.fontBody, fontSize: 13, fontWeight: 500,
              color: tab === t ? v.ink : v.ink3,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 0',
              borderBottom: tab === t ? `2px solid var(--lx-ink)` : '2px solid transparent',
              marginBottom: -1, letterSpacing: '0.01em',
            }}>{t}</button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, padding: 2 }}>
          {posts.map(p => {
            const mediaUrl = p.media && p.media.length > 0 ? p.media[0].cdnUrl : null;
            return (
              <div key={p.id} onClick={() => navigate('post', { postId: p.id })} style={{
                background: mediaUrl ? `url(${mediaUrl}) center/cover no-repeat` : v.surfaceRaised,
                aspectRatio: '1/1',
                borderRadius: 4, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 10,
                boxSizing: 'border-box'
              }}>
                {!mediaUrl && p.caption && (
                  <span style={{ fontSize: 11, fontFamily: v.fontBody, color: v.ink3, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.caption}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {hasNextPage && (
          <div ref={ref} style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
            {isFetchingNextPage ? 'loading more...' : 'scroll for more'}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
