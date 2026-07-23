import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent } from '@/utils/helpers';
import { LxBtn, LxIcon } from './primitives';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserPosts } from '../hooks/usePosts';
import { useUserProfile } from '../hooks/useUsers';
import { useFollow, useUnfollow, useFollowing } from '../hooks/useSocial';

export function ProfileScreen({ navigate, params = {}, viewport }) {
  const [tab, setTab] = useState('posts');
  const [following, setFollowing] = useState(false);
  const currentUser = useAuthStore(state => state.user);
  
  const targetUserId = params.user?.id;
  const isSelf = !targetUserId || targetUserId === currentUser?.id;
  
  const queryUserId = targetUserId || currentUser?.id;
  const { data: profileResponse, isError: isProfileError } = useUserProfile(queryUserId);
  const fetchedUser = profileResponse?.data || profileResponse;
  
  const user = fetchedUser || (isSelf ? currentUser : params.user);

  const follow = useFollow();
  const unfollow = useUnfollow();
  const { data: myFollowingData } = useFollowing(currentUser?.id);

  useEffect(() => {
    if (myFollowingData && !isSelf) {
      const list = myFollowingData.pages?.flatMap(page => extractPageContent(page)) || [];
      setFollowing(list.some(u => u.id === targetUserId));
    }
  }, [myFollowingData, targetUserId, isSelf]);

  const handleFollowToggle = () => {
    if (following) {
      unfollow.mutate(user.id);
      setFollowing(false);
    } else {
      follow.mutate(user.id);
      setFollowing(true);
    }
  };

  const { ref, inView } = useInView();
  const {
    data: postsResponse,
    isLoading,
    isError: isPostsError,
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
  const posts = postsResponse?.pages?.flatMap(page => extractPageContent(page)) || [];

  if (isProfileError && !user) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: v.fontBody, fontSize: 14, color: v.error }}>
        we couldn't load this profile. check your connection and try again.
      </div>
    );
  }

  const cols = viewport === 'desktop' ? 3 : viewport === 'tablet' ? 3 : 3;
  const title = user?.displayName || user?.firstName || user?.username || 'Unknown';
  const handle = user?.username || 'unknown';
  const showHandle = Boolean(user?.username) && user?.displayName && user.displayName.toLowerCase() !== handle.toLowerCase();
  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Cover band */}
        <div style={{ height: 88, background: 'color-mix(in srgb, var(--lx-surface-raised) 82%, var(--lx-base))' }} />

        {/* Avatar + follow */}
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -38 }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: user?.avatarUrl ? `url(${user.avatarUrl}) center/cover no-repeat` : v.avatar0,
            border: `4px solid var(--lx-base)`,
            boxShadow: `0 0 0 1px ${v.base}`,
            flexShrink: 0,
          }} />
          {!isSelf && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2, transform: 'translateY(6px)' }}>
              <LxBtn
                variant="primary"
                size="sm"
                style={{
                  minWidth: 62,
                  height: 30,
                  padding: '0 14px',
                  fontSize: 13,
                  borderRadius: 999,
                }}
                onClick={handleFollowToggle}
                disabled={follow.isPending || unfollow.isPending}>
                follow
              </LxBtn>
            </div>
          )}
          {isSelf && (
            <LxBtn variant="secondary" size="sm" style={{ marginBottom: 2, transform: 'translateY(6px)' }} onClick={() => navigate('settings')}>
              edit profile
            </LxBtn>
          )}
        </div>

        {/* Name + bio */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: v.fontDisplay, fontSize: 24, fontWeight: 700, color: v.ink, letterSpacing: '-0.03em' }}>{title}</div>
            {user?.isVerified && <LxIcon name="check" size={18} color={v.accent} />}
          </div>
          {showHandle ? <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 4 }}>@{handle}</div> : null}
          <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, lineHeight: 1.5, marginTop: user?.bio ? 10 : 0, maxWidth: 480 }}>{user?.bio || ''}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 30, padding: '20px 16px 14px', borderBottom: `1px solid ${v.border}` }}>
          {[['posts', user?.postCount || user?.postsCount || 0], ['following', user?.followingCount || 0], ['followers', user?.followerCount || user?.followersCount || 0]].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1, cursor: label !== 'posts' ? 'pointer' : 'default' }}
                 onClick={() => {
                   if (label === 'followers') navigate('followers', { userId: user?.id, username: user?.username });
                   if (label === 'following') navigate('following', { userId: user?.id, username: user?.username });
                 }}>
              <span style={{ fontFamily: v.fontMono, fontSize: 14, fontWeight: 500, color: v.ink }}>{val}</span>
              <span style={{ fontFamily: v.fontMono, fontSize: 9, color: v.ink3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{label}</span>
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
              padding: '13px 0 14px',
              borderBottom: tab === t ? `2px solid var(--lx-ink)` : '2px solid transparent',
              marginBottom: -1, letterSpacing: '0.01em',
            }}>{t}</button>
          ))}
        </div>

        {/* Grid */}
        {isPostsError ? (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: v.fontBody, fontSize: 14, color: v.error }}>
            we couldn't load these posts. check your connection and try again.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, padding: '2px 0 0' }}>
            {posts.map(p => {
              const mediaUrl = p.media && p.media.length > 0 ? p.media[0].cdnUrl : null;
              return (
                <div key={p.id} onClick={() => navigate('post', { postId: p.id })} style={{
                  background: mediaUrl ? `url(${mediaUrl}) center/cover no-repeat` : 'color-mix(in srgb, var(--lx-surface-raised) 82%, #d8d1c4 18%)',
                  aspectRatio: '1/1',
                  borderRadius: 0, cursor: 'pointer',
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
        )}

        {hasNextPage && !isPostsError && (
          <div ref={ref} style={{ padding: 20, textAlign: 'center', fontFamily: v.fontMono, fontSize: 12, color: v.ink3 }}>
            {isFetchingNextPage ? 'loading more...' : 'scroll for more'}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
