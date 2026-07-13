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
    { id: 'messages', icon: 'chat', label: 'chats' },
    { id: 'compose', icon: 'plus', label: 'post' },
    { id: 'notifications', icon: 'bell', label: 'activity' },
  ];
  
  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = requestsResponse?.data || requestsResponse || [];
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.count || 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height: 56, gap: 4, flex: 1, justifyContent: 'center', maxWidth: 560 }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => navigate(t.id)} style={{
            flex: 1, maxWidth: 110,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2,
            position: 'relative',
            color: isActive ? v.accent : v.ink3,
            transition: 'color 150ms ease-out',
          }}>
            <LxIcon name={t.icon} size={22} color={isActive ? v.accent : v.ink3} stroke={isActive ? 1.8 : 1.5} filled={isActive} />
            {t.id === 'notifications' && hasNotifications && (
              <span style={{ position: 'absolute', top: 6, right: '20%', width: 8, height: 8, borderRadius: '50%', background: v.error }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Persistent App Bar ────────────────────────────────────────────────────
export function LxAppBar({ screen, navigate, params, viewport }) {
  const isMainTab = ['feed', 'explore', 'messages', 'compose', 'notifications', 'profile'].includes(screen);

  const subpages = {
    post: 'post',
    settings: 'settings',
    blocked: 'blocked users',
  };
  const isSubpage = subpages[screen];
  const mobileMsgBack = screen === 'messages' && viewport === 'mobile';
  const showBackHeader = Boolean(isSubpage || mobileMsgBack);

  const innerMaxWidth = viewport === 'desktop' ? 1280 : viewport === 'tablet' ? 640 : '100%';
  const sideWidth     = viewport === 'desktop' ? 300  : viewport === 'tablet' ? 'auto' : 'auto';
  const SearchComponent = typeof window !== 'undefined' ? window.LxHeaderSearch : null;

  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = requestsResponse?.data || requestsResponse || [];
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.count || 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 56, flexShrink: 0,
      display: 'flex', justifyContent: 'center',
      background: 'var(--lx-glass-bg)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${v.border}`,
    }}>
      <div style={{
        width: '100%', maxWidth: innerMaxWidth,
        display: 'flex', alignItems: 'stretch',
        padding: viewport === 'mobile' ? '0 12px' : '0 16px', gap: viewport === 'mobile' ? 0 : 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, width: sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 120 : undefined), justifyContent: viewport === 'mobile' && !showBackHeader ? 'flex-start' : undefined }}>
          {showBackHeader ? (
            <>
              <button onClick={() => navigate('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center' }}>
                <LxIcon name="back" size={20} color={v.ink} />
              </button>
              <span style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 600, color: v.ink }}>{mobileMsgBack ? 'messages' : isSubpage}</span>
            </>
          ) : viewport === 'mobile' ? (
            <button onClick={() => navigate('compose')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center' }}>
              <LxIcon name="plus" size={20} color={v.ink} />
            </button>
          ) : (
            <button onClick={() => navigate('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: v.fontDisplay, fontSize: 22, fontWeight: 700, color: v.ink, letterSpacing: '-0.03em' }}>
              luvax
            </button>
          )}
        </div>

        {viewport === 'mobile' && !showBackHeader ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <button onClick={() => navigate('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: v.fontDisplay, fontSize: 22, fontWeight: 700, color: v.ink, letterSpacing: '-0.03em', pointerEvents: 'all' }}>
              luvax
            </button>
          </div>
        ) : isMainTab && viewport === 'desktop' ? (
          <LxTopTabs active={screen} navigate={navigate} />
        ) : viewport === 'tablet' && !showBackHeader && SearchComponent ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
            <SearchComponent onClick={() => navigate('explore')} viewport={viewport} />
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, width: sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 120 : undefined), justifyContent: 'flex-end' }}>
          {viewport === 'desktop' && !showBackHeader && SearchComponent && (
            <SearchComponent onClick={() => navigate('explore')} viewport={viewport} />
          )}
          <button onClick={() => navigate('notifications')} style={{ background: v.surface, border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <LxIcon name="bell" size={18} color={v.ink2} />
            {hasNotifications && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: v.accent }} />}
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
    { id: 'messages', icon: 'chat', label: 'chats' },
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
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderTop: `1px solid ${v.border}`,
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
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
            <LxIcon name={t.icon} size={22} color={isActive ? v.accent : v.ink3} stroke={isActive ? 1.8 : 1.5} filled={isActive} />
            {t.id === 'notifications' && hasNotifications && (
              <span style={{ position: 'absolute', top: 6, right: '25%', width: 8, height: 8, borderRadius: '50%', background: v.error }} />
            )}
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
    return (
      <aside style={{ width: 300, flexShrink: 0, padding: '20px 20px', position: 'sticky', top: 56, alignSelf: 'flex-start' }} />
    );
  }

  return (
    <aside style={{
      width: 300, flexShrink: 0,
      padding: '20px 20px',
      display: 'flex', flexDirection: 'column', gap: 24,
      position: 'sticky', top: 56, alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 56px)', overflowY: 'auto',
    }}>
      <div>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>trending</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {trending.map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'baseline', gap: 8, cursor: 'pointer' }}>
              <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, width: 18 }}>{String(i+1).padStart(2,'0')}</span>
              <span style={{ fontFamily: v.fontBody, fontSize: 14, color: v.ink, fontWeight: 500 }}>#{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>suggested</div>
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
    const RAIL_W = 300;
    return (
      <div style={{ minHeight: '100vh', background: v.base, display: 'flex', flexDirection: 'column' }}>
        <LxAppBar screen={screen} navigate={navigate} params={params} viewport={vp} />
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
          {showRightRail && <div style={{ width: RAIL_W, flexShrink: 0 }} aria-hidden="true" />}
          <main style={{
            width: 680, flexShrink: 0, minWidth: 0,
            borderLeft: `1px solid ${v.border}`,
            borderRight: `1px solid ${v.border}`,
            minHeight: 'calc(100vh - 56px)',
            display: 'flex', flexDirection: 'column',
          }}>
            {children}
          </main>
          {showRightRail && <LxRightRail navigate={navigate} />}
        </div>
      </div>
    );
  }

  if (vp === 'tablet') {
    return (
      <div style={{ minHeight: '100vh', background: v.base, display: 'flex', flexDirection: 'column', maxWidth: 640, margin: '0 auto', borderLeft: `1px solid ${v.border}`, borderRight: `1px solid ${v.border}` }}>
        <LxAppBar screen={screen} navigate={navigate} params={params} viewport={vp} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 72 }}>
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 72 }}>
        {children}
      </main>
      <LxBottomNav active={screen} navigate={navigate} />
    </div>
  );
}
