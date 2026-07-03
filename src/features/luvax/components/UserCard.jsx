import React, { useState } from 'react';
import { v } from '../constants/tokens';
import { LxAvatar, LxBtn, LxIcon } from './primitives';
import { useFollow, useUnfollow } from '../hooks/useSocial';

export function UserCard({ user, onAvatarClick, onFollowToggle, initiallyFollowing = false, rightElement }) {
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  
  const follow = useFollow();
  const unfollow = useUnfollow();

  const handleFollowClick = () => {
    if (isFollowing) {
      unfollow.mutate(user.id);
      setIsFollowing(false);
    } else {
      follow.mutate(user.id);
      setIsFollowing(true);
    }
    if (onFollowToggle) onFollowToggle(!isFollowing);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      borderBottom: `1px solid ${v.border}`
    }}>
      <div 
        onClick={() => onAvatarClick && onAvatarClick(user)}
        style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
        ) : (
          <LxAvatar size={44} idx={user.id ? user.id.charCodeAt(0) : 0} />
        )}
      </div>
      
      <div 
        style={{ flex: 1, cursor: onAvatarClick ? 'pointer' : 'default' }}
        onClick={() => onAvatarClick && onAvatarClick(user)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, color: v.ink }}>
            {user.displayName || user.username || 'Unknown'}
          </span>
          {user.isVerified && <LxIcon name="check" size={14} color={v.accent} />}
        </div>
        <div style={{ fontFamily: v.fontMono, fontSize: 12, color: v.ink3, marginTop: 2 }}>
          @{user.username || 'unknown'}
        </div>
      </div>

      {rightElement ? rightElement : (
        <LxBtn 
          variant={isFollowing ? 'secondary' : 'primary'} 
          size="sm" 
          onClick={handleFollowClick}
          disabled={follow.isPending || unfollow.isPending}
        >
          {isFollowing ? 'following' : 'follow'}
        </LxBtn>
      )}
    </div>
  );
}
