import { v } from '@/config/tokens';
import { extractPageContent } from '@/utils/helpers';
import { LxBtn, LxAvatar } from './primitives';
import { useBlockedUsers, useUnblock } from '../hooks/useSocial';

function BlockedUserRow({ user }) {
  const unblock = useUnblock();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${v.border}` }}>
      <LxAvatar size={40} src={user?.avatarUrl} idx={0} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, color: v.ink }}>{user?.displayName || user?.username || 'Unknown'}</div>
        <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>@{user?.username || 'unknown'}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <LxBtn variant="secondary" size="sm" onClick={() => unblock.mutate(user.id)} disabled={unblock.isPending}>
          unblock
        </LxBtn>
        {unblock.isError ? (
          <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.errorText }}>couldn&apos;t unblock. try again.</span>
        ) : null}
      </div>
    </div>
  );
}

export function BlockedUsersScreen() {
  const { data, isLoading, isError } = useBlockedUsers();
  const blocked = extractPageContent(data);

  const heading = () => {
    if (isLoading) return 'Loading blocked users';
    if (isError) return "Couldn't load blocked users";
    if (blocked.length === 0) return 'No blocked users';
    return `${blocked.length} blocked user${blocked.length !== 1 ? 's' : ''}`;
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: v.base }}>
      <div style={{ padding: '24px 16px 8px', fontFamily: v.fontMono, fontSize: 11, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {heading()}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {blocked.map(row => (
          <BlockedUserRow key={row.user.id} user={row.user} />
        ))}
      </div>
    </div>
  );
}
