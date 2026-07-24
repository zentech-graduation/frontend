import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { v } from '@/config/tokens';
import { extractPageContent } from '@/utils/helpers';
import { LxIcon } from './primitives';
import { useAuthStore } from '@/store/useAuthStore';
import { useFollowers } from '../hooks/useSocial';
import { UserCard } from './UserCard';

export function FollowersScreen({ navigate, params = {} }) {
  const currentUser = useAuthStore(state => state.user);
  const userId = params.userId || currentUser?.id;
  const username = params.username || currentUser?.username || 'user';
  const isSelf = userId === currentUser?.id;

  const { ref, inView } = useInView();
  const { 
    data: followersResponse, 
    isLoading, 
    isError,
    error,
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useFollowers(userId);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle privacy/visibility errors (e.g. 403 Forbidden)
  if (isError && error?.response?.status === 403) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
        <LxIcon name="lock" size={48} color={v.ink3} />
        <div style={{ fontFamily: v.fontDisplay, fontSize: 20, fontWeight: 700, color: v.ink, marginTop: 16 }}>
          Private Account
        </div>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink3, marginTop: 8 }}>
          Follow this account to see their followers.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.ink3 }}>
        loading followers...
      </div>
    );
  }

  const followers = followersResponse?.pages?.flatMap(page => extractPageContent(page)) || [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: v.base }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: `1px solid ${v.border}`,
        display: 'flex', 
        alignItems: 'center',
        background: v.surface,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 16, fontWeight: 600, color: v.ink }}>
          {isSelf ? 'Your Followers' : `${username}'s Followers`}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {followers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: v.ink3, fontFamily: v.fontBody, fontSize: 14 }}>
            No followers yet.
          </div>
        ) : (
          followers.map(user => (
            <UserCard 
              key={user.id} 
              user={user} 
              onAvatarClick={(u) => navigate('profile', { user: { id: u.id, username: u.username } })}
            />
          ))
        )}
        
        {/* Infinite Scroll Trigger */}
        <div ref={ref} style={{ height: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isFetchingNextPage && <span style={{ color: v.ink3, fontSize: 12 }}>loading more...</span>}
        </div>
      </div>
    </div>
  );
}
