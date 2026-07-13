import { useState, useEffect } from 'react';
import { v } from '../constants/tokens';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar, LxBtn } from './primitives';
import { useAuthStore } from '@/store/useAuthStore';
import { usePendingFollowRequests, useSuggestedUsers, useFollowing } from '../hooks/useSocial';
import { useUnreadCount } from '../hooks/useNotifications';
import { UserCard } from './UserCard';

// ─── Top Tab Strip ─────────────────────────────────────────────────────────
export function LxTopTabs({ active, navigate }) {
  const tabs = [
    { id: 'feed', icon: 'home', label: 'home' },
    { id: 'explore', icon: 'explore', label: 'explore' },
    { id: 'messages', icon: 'message', label: 'messages' },
    { id: 'compose', icon: 'plus', label: 'post' },
    { id: 'notifications', icon: 'bell', label: 'activity' },
  ];
  
  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = requestsResponse?.data || requestsResponse || [];
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.count || 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height: 56, gap: 96, flex: 1, justifyContent: 'center', maxWidth: 1080 }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => t.id !== 'messages' && navigate(t.id)} style={{
            flex: '0 0 auto', width: 34,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2,
            position: 'relative',
            color: isActive ? v.accent : v.ink3,
            transition: 'color 150ms ease-out',
          }}>
            <LxIcon name={t.icon} size={22} color={isActive ? v.accent : v.ink3} stroke={isActive ? 1.8 : 1.5} />
            {t.id === 'notifications' && hasNotifications && (
              <span style={{ position: 'absolute', top: 10, right: 12, width: 7, height: 7, borderRadius: '50%', background: v.accent }} />
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: 10, right: 10,
              height: 2.5, borderRadius: 2,
              background: isActive ? v.accent : 'transparent',
              transition: 'background 150ms ease-out',
            }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Persistent App Bar ────────────────────────────────────────────────────
export function LxAppBar({ screen, navigate, params, viewport }) {
  const isMainTab = ['feed', 'explore', 'compose', 'notifications', 'profile'].includes(screen);

  const subpages = {
    post: 'post',
    settings: 'settings',
    'edit-profile': 'edit profile',
    'change-password': 'change password',
    blocked: 'blocked users',
  };
  const isSubpage = subpages[screen];

  const innerMaxWidth = viewport === 'desktop' ? 1260 : viewport === 'tablet' ? 680 : '100%';
  const sideWidth     = viewport === 'desktop' ? 280  : viewport === 'tablet' ? 'auto' : 'auto';

  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = requestsResponse?.data || requestsResponse || [];
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.count || 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;
  const isDesktop = viewport === 'desktop';

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 56, flexShrink: 0,
      display: 'flex', justifyContent: 'center',
      background: 'var(--lx-glass-bg)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${v.border}`,
    }}>
      <div style={{
        width: '100%', maxWidth: innerMaxWidth,
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : 'auto 1fr auto',
        alignItems: 'stretch',
        padding: '0 22px', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isDesktop ? (isSubpage ? 'center' : 'flex-start') : 'flex-start', gap: 12, flexShrink: 0, width: isDesktop ? '100%' : sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 120 : undefined), paddingLeft: isDesktop && !isSubpage ? 18 : 0 }}>
          {isSubpage ? (
            <>
              <button onClick={() => navigate('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center' }}>
                <LxIcon name="back" size={20} color={v.ink} />
              </button>
              <span style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 600, color: v.ink }}>{isSubpage}</span>
            </>
          ) : (
            <button onClick={() => navigate('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: v.fontDisplay, fontSize: 26, fontWeight: 700, color: v.ink, letterSpacing: '-0.05em' }}>
              luvax
            </button>
          )}
        </div>

        {viewport !== 'mobile' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
            {isMainTab ? <LxTopTabs active={screen} navigate={navigate} /> : null}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, width: isDesktop ? '100%' : sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 120 : undefined), justifyContent: isDesktop ? 'flex-end' : 'flex-end', paddingRight: isDesktop ? 18 : 0 }}>
          {viewport !== 'mobile' && (
            <button onClick={() => navigate('explore')} style={{
              background: v.surface, border: `1px solid ${v.borderSubtle}`, borderRadius: 999,
              padding: '9px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              color: v.ink3, fontFamily: v.fontBody, fontSize: 13,
              minWidth: 172,
            }}>
              <LxIcon name="explore" size={15} color={v.ink3} />
              <span>search</span>
            </button>
          )}
          <button onClick={() => navigate('notifications')} style={{ background: 'transparent', border: `1px solid ${v.borderSubtle}`, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <LxIcon name="bell" size={18} color={v.ink2} />
            {hasNotifications && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: v.error }} />}
          </button>
          <button onClick={() => navigate('profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <LxAvatar size={32} idx={0} ring={screen === 'profile'} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Bottom Nav (mobile only) ──────────────────────────────────────────────
export function LxBottomNav({ active, navigate }) {
  const tabs = [
    { id: 'feed', icon: 'home', label: 'home' },
    { id: 'explore', icon: 'explore', label: 'explore' },
    { id: 'compose', icon: 'plus', label: 'post' },
    { id: 'notifications', icon: 'bell', label: 'activity' },
    { id: 'profile', icon: 'profile', label: 'you' },
  ];
  
  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = requestsResponse?.data || requestsResponse || [];
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.count || 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;
  return (
    <nav style={{
      display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
      padding: '0',
      background: 'var(--lx-glass-bg)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      borderTop: `1px solid ${v.border}`,
      position: 'sticky', bottom: 0, zIndex: 100,
      flexShrink: 0,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => navigate(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, height: 56,
            background: 'none', border: 'none', cursor: 'pointer',
            position: 'relative',
            transition: 'color 150ms ease-out',
          }}>
            <LxIcon name={t.icon} size={22} color={isActive ? v.accent : v.ink3} stroke={isActive ? 1.8 : 1.5} />
            {t.id === 'notifications' && hasNotifications && (
              <span style={{ position: 'absolute', top: 6, right: '25%', width: 8, height: 8, borderRadius: '50%', background: v.accent }} />
            )}
            <div style={{
              position: 'absolute', top: 0, left: '25%', right: '25%',
              height: 2.5, borderRadius: 2,
              background: isActive ? v.accent : 'transparent',
            }} />
          </button>
        );
      })}
    </nav>
  );
}

// ─── Right Rail (desktop) ──────────────────────────────────────────────────
export function LxRightRail({ navigate }) {
  const currentUser = useAuthStore(state => state.user);
  const key = currentUser ? `lx_blocks_${currentUser.id}` : 'lx_blocks';

  const [blocks, setBlocks] = useState(() => JSON.parse(localStorage.getItem(key) || '[]'));
  useEffect(() => {
    const handleBlocksChanged = () => setBlocks(JSON.parse(localStorage.getItem(key) || '[]'));
    window.addEventListener('lx_blocks_changed', handleBlocksChanged);
    return () => window.removeEventListener('lx_blocks_changed', handleBlocksChanged);
  }, [key]);

  const trending = ['light', 'analog', 'morning', 'silence', 'film', 'observation'];
  
  const { data: myFollowingData } = useFollowing(currentUser?.id);
  const followingList = myFollowingData?.pages?.flatMap(page => page?.data?.content || page?.content || []) || [];
  const followingIds = new Set(followingList.map(u => u.id));

  const { data: suggestedResponse } = useSuggestedUsers();
  const suggestedRaw = suggestedResponse?.data || suggestedResponse || [];
  
  // Filter out blocked users AND users we are already following
  const suggested = suggestedRaw
    .filter(u => !blocks.includes(u.id) && !followingIds.has(u.id))
    .slice(0, 5);

  if (suggested.length === 0) {
    return <aside style={{ width: 280, flexShrink: 0, padding: '20px 20px', position: 'sticky', top: 56, alignSelf: 'flex-start' }} />;
  }

  return (
    <aside style={{
      width: 280, flexShrink: 0,
      padding: '20px 20px',
      display: 'flex', flexDirection: 'column', gap: 24,
      position: 'sticky', top: 56, alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 56px)', overflowY: 'auto',
    }}>
      <div>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>trending</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trending.map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'baseline', gap: 8, cursor: 'pointer' }}>
              <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, width: 18 }}>{String(i+1).padStart(2,'0')}</span>
              <span style={{ fontFamily: v.fontBody, fontSize: 15, color: v.ink, fontWeight: 600 }}>#{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>suggested</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {suggested.map(u => (
            <UserCard 
              key={u.id} 
              user={u} 
              compact={true} 
              onAvatarClick={() => navigate ? navigate('profile', { user: { id: u.id, username: u.username } }) : null}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────────
export function LxShell({ screen, navigate, params, children, showRightRail = true }) {
  const vp = useViewport();

  if (vp === 'desktop') {
    const LEFT_W = 280;
    return (
      <div style={{ minHeight: '100vh', background: v.base, display: 'flex', flexDirection: 'column' }}>
        <LxAppBar screen={screen} navigate={navigate} params={params} viewport={vp} />
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: 1260, margin: '0 auto' }}>
          <div style={{ width: LEFT_W, flexShrink: 0 }} aria-hidden="true" />
          <main style={{
            width: 680, flexShrink: 0, minWidth: 0,
            borderLeft: `1px solid ${v.border}`,
            borderRight: `1px solid ${v.border}`,
            minHeight: 'calc(100vh - 56px)',
            display: 'flex', flexDirection: 'column',
            background: v.base,
          }}>
            {children}
          </main>
          {showRightRail && <LxRightRail navigate={navigate} />}
          {!showRightRail && <div style={{ width: 280, flexShrink: 0 }} aria-hidden="true" />}
        </div>
      </div>
    );
  }

  if (vp === 'tablet') {
    return (
      <div style={{ minHeight: '100vh', background: v.base, display: 'flex', flexDirection: 'column', maxWidth: 680, margin: '0 auto', borderLeft: `1px solid ${v.border}`, borderRight: `1px solid ${v.border}` }}>
        <LxAppBar screen={screen} navigate={navigate} params={params} viewport={vp} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <LxBottomNav active={screen} navigate={navigate} />
      </div>
    );
  }

  // mobile
  return (
    <div style={{ minHeight: '100vh', background: v.base, display: 'flex', flexDirection: 'column' }}>
      <LxAppBar screen={screen} navigate={navigate} params={params} viewport={vp} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <LxBottomNav active={screen} navigate={navigate} />
    </div>
  );
}
