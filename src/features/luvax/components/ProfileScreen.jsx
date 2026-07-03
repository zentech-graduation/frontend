import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '../constants/tokens';
import { LxBtn, LxIcon, LxModal } from './primitives';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserPosts } from '../hooks/usePosts';
import { useUserProfile } from '../hooks/useUsers';
import { useFollow, useUnfollow, useBlock, useUnblock, useFollowing } from '../hooks/useSocial';

export function ProfileScreen({ navigate, params = {}, viewport }) {
  const [tab, setTab] = useState('posts');
  const [following, setFollowing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const currentUser = useAuthStore(state => state.user);
  
  const key = currentUser ? `lx_blocks_${currentUser.id}` : 'lx_blocks';
  const [blocks, setBlocks] = useState(() => JSON.parse(localStorage.getItem(key) || '[]'));

  useEffect(() => {
    const handleBlocksChanged = () => setBlocks(JSON.parse(localStorage.getItem(key) || '[]'));
    window.addEventListener('lx_blocks_changed', handleBlocksChanged);
    return () => window.removeEventListener('lx_blocks_changed', handleBlocksChanged);
  }, [key]);
  
  const targetUserId = params.user?.id;
  const isSelf = !targetUserId || targetUserId === currentUser?.id;
  
  const queryUserId = targetUserId || currentUser?.id;
  const { data: profileResponse } = useUserProfile(queryUserId);
  const fetchedUser = profileResponse?.data || profileResponse;
  
  const user = fetchedUser || (isSelf ? currentUser : params.user);

  const follow = useFollow();
  const unfollow = useUnfollow();
  const block = useBlock();
  const unblock = useUnblock();
  
  const isBlocked = blocks.includes(user?.id);
  
  const { data: myFollowingData } = useFollowing(currentUser?.id);

  useEffect(() => {
    if (myFollowingData && !isSelf) {
      const list = myFollowingData.pages?.flatMap(page => page?.data?.content || page?.content || []) || [];
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

  const handleBlock = () => {
    setMenuOpen(false);
    setBlockModalOpen(true);
  };

  const confirmBlock = () => {
    setBlockModalOpen(false);
    block.mutate(user.id);
    navigate('feed');
  };
  
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
            background: user?.avatarUrl ? `url(${user.avatarUrl}) center/cover no-repeat` : '#C8A97E',
            border: `3px solid var(--lx-base)`,
            flexShrink: 0,
          }} />
          {!isSelf && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <LxBtn
                variant={following ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleFollowToggle}
                disabled={follow.isPending || unfollow.isPending}>
                {following ? 'following' : 'follow'}
              </LxBtn>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: v.surfaceRaised, border: `1px solid ${v.border}`, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <LxIcon name="more" size={16} color={v.ink} />
                </button>
                {menuOpen && (
                  <div style={{
                    position: 'absolute', top: 36, right: 0, background: v.surfaceRaised, border: `1px solid ${v.border}`,
                    borderRadius: 8, padding: 4, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120, zIndex: 10
                  }}>
                    {isBlocked ? (
                      <button onClick={() => { setMenuOpen(false); unblock.mutate(user.id); }} disabled={unblock.isPending} style={{ background: 'none', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontFamily: v.fontBody, fontSize: 13, color: v.ink }}>Unblock User</button>
                    ) : (
                      <button onClick={handleBlock} style={{ background: 'none', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontFamily: v.fontBody, fontSize: 13, color: v.error }}>Block User</button>
                    )}
                  </div>
                )}
              </div>
            </div>
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
            <div style={{ fontFamily: v.fontDisplay, fontSize: 22, fontWeight: 700, color: v.ink, letterSpacing: '-0.02em' }}>{user?.displayName || user?.firstName || user?.username || 'Unknown'}</div>
            {user?.isVerified && <LxIcon name="check" size={18} color={v.accent} />}
          </div>
          <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 2 }}>@{user?.username || 'unknown'}</div>
          <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink2, lineHeight: 1.5, marginTop: 10, maxWidth: 480 }}>{user?.bio || ''}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 28, padding: '16px 16px 16px', borderBottom: `1px solid ${v.border}` }}>
          {[['posts', user?.postCount || user?.postsCount || 0], ['following', user?.followingCount || 0], ['followers', user?.followerCount || user?.followersCount || 0]].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1, cursor: label !== 'posts' ? 'pointer' : 'default' }}
                 onClick={() => {
                   if (label === 'followers') navigate('followers', { userId: user?.id, username: user?.username });
                   if (label === 'following') navigate('following', { userId: user?.id, username: user?.username });
                 }}>
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

      <LxModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title="Block User"
        actions={
          <>
            <LxBtn variant="ghost" onClick={() => setBlockModalOpen(false)}>cancel</LxBtn>
            <LxBtn variant="danger" onClick={confirmBlock}>block</LxBtn>
          </>
        }
      >
        Are you sure you want to block <strong>{user?.displayName || user?.username}</strong>? They won't be able to find your profile, posts or story on Luvax.
      </LxModal>
    </>
  );
}
