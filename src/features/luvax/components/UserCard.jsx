import React, { useState } from 'react';
import { v } from '../constants/tokens';
import { LxAvatar, LxBtn, LxIcon } from './primitives';
import { useFollow, useUnfollow } from '../hooks/useSocial';

export function UserCard({ user, onAvatarClick, onFollowToggle, initiallyFollowing = false, rightElement, compact = false }) {
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

  const avatarSize = compact ? 36 : 44;
  const buttonVariant = compact ? 'ghost' : (isFollowing ? 'secondary' : 'primary');

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: compact ? 10 : 12, padding: compact ? '4px 0' : '8px 0',
    }}>
      <div 
        onClick={() => onAvatarClick && onAvatarClick(user)}
        style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
        ) : (
          <LxAvatar size={avatarSize} idx={user.id ? user.id.charCodeAt(0) : 0} />
        )}
      </div>
      
      <div 
        style={{ flex: 1, cursor: onAvatarClick ? 'pointer' : 'default' }}
        onClick={() => onAvatarClick && onAvatarClick(user)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: v.fontBody, fontSize: compact ? 13 : 14, fontWeight: 600, color: v.ink }}>
            {user.displayName || user.username || 'Unknown'}
          </span>
          {user.isVerified && <LxIcon name="check" size={14} color={v.accent} />}
        </div>
        <div style={{ fontFamily: v.fontBody, fontSize: compact ? 11 : 12, color: v.ink3, marginTop: 2, whiteSpace: compact ? 'nowrap' : 'normal', overflow: compact ? 'hidden' : 'visible', textOverflow: compact ? 'ellipsis' : 'clip' }}>
          {user.bio || user.headline || `@${user.username || 'unknown'}`}
        </div>
      </div>

      {rightElement ? rightElement : (
        <LxBtn 
          variant={buttonVariant} 
          size="sm" 
          onClick={handleFollowClick}
          disabled={follow.isPending || unfollow.isPending}
          style={compact ? { minWidth: 64, padding: '6px 14px', fontSize: 13, color: v.ink, borderColor: v.borderStrong } : {}}
        >
          {compact ? 'follow' : (isFollowing ? 'following' : 'follow')}
        </LxBtn>
      )}
    </div>
  );
}
