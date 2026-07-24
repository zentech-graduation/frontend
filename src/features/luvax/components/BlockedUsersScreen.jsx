import { useState, useEffect } from 'react';
import { v } from '@/config/tokens';
import { LxBtn, LxAvatar } from './primitives';
import { useUnblock } from '../hooks/useSocial';
import { useUserProfile } from '../hooks/useUsers';
import { useAuthStore } from '@/store/useAuthStore';

function BlockedUserRow({ userId }) {
  const { data: profileResponse, isLoading } = useUserProfile(userId);
  const unblock = useUnblock();
  
  if (isLoading) return <div style={{ padding: '12px 16px', color: v.ink3, fontFamily: v.fontBody, fontSize: 13 }}>Loading...</div>;
  if (!profileResponse) return null;

  const user = profileResponse.data || profileResponse;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${v.border}` }}>
      <LxAvatar size={40} src={user?.avatarUrl} idx={0} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, color: v.ink }}>{user?.displayName || user?.username || 'Unknown'}</div>
        <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>@{user?.username || 'unknown'}</div>
      </div>
      <LxBtn variant="secondary" size="sm" onClick={() => unblock.mutate(userId)} disabled={unblock.isPending}>
        unblock
      </LxBtn>
    </div>
  );
}

export function BlockedUsersScreen() {
  const currentUser = useAuthStore(state => state.user);
  const key = currentUser ? `lx_blocks_${currentUser.id}` : 'lx_blocks';

  const [blocks, setBlocks] = useState(() => JSON.parse(localStorage.getItem(key) || '[]'));

  useEffect(() => {
    const handleBlocksChanged = () => setBlocks(JSON.parse(localStorage.getItem(key) || '[]'));
    window.addEventListener('lx_blocks_changed', handleBlocksChanged);
    return () => window.removeEventListener('lx_blocks_changed', handleBlocksChanged);
  }, [key]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: v.base }}>
      <div style={{ padding: '24px 16px 8px', fontFamily: v.fontMono, fontSize: 11, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {blocks.length === 0 ? 'No blocked users' : `${blocks.length} blocked user${blocks.length !== 1 ? 's' : ''}`}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {blocks.map(id => (
          <BlockedUserRow key={id} userId={id} />
        ))}
      </div>
    </div>
  );
}
