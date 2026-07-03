import { useState, useEffect } from 'react';
import { v } from '../constants/tokens';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar, LxBtn } from './primitives';
import { useAuthStore } from '@/store/useAuthStore';
import { usePendingFollowRequests } from '../hooks/useSocial';
import { useUnreadCount } from '../hooks/useNotifications';

// ─── Top Tab Strip ─────────────────────────────────────────────────────────
export function LxTopTabs({ active, navigate }) {
  const tabs = [
    { id: 'feed', icon: 'home', label: 'home' },
    { id: 'explore', icon: 'explore', label: 'explore' },
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
            <LxIcon name={t.icon} size={22} color={isActive ? v.accent : v.ink3} stroke={isActive ? 1.8 : 1.5} />
            {t.id === 'notifications' && hasNotifications && (
              <span style={{ position: 'absolute', top: 6, right: '20%', width: 8, height: 8, borderRadius: '50%', background: v.error }} />
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: '20%', right: '20%',
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
    blocked: 'blocked users',
  };
  const isSubpage = subpages[screen];

  const innerMaxWidth = viewport === 'desktop' ? 1280 : viewport === 'tablet' ? 640 : '100%';
  const sideWidth     = viewport === 'desktop' ? 300  : viewport === 'tablet' ? 'auto' : 'auto';

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
        padding: '0 16px', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, width: sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 120 : undefined) }}>
          {isSubpage ? (
            <>
              <button onClick={() => navigate('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center' }}>
                <LxIcon name="back" size={20} color={v.ink} />
              </button>
              <span style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 600, color: v.ink }}>{isSubpage}</span>
            </>
          ) : (
            <button onClick={() => navigate('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: v.fontDisplay, fontSize: 22, fontWeight: 700, color: v.ink, letterSpacing: '-0.03em' }}>
              luvax
            </button>
          )}
        </div>

        {isMainTab && viewport !== 'mobile' && (
          <LxTopTabs active={screen} navigate={navigate} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, width: sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 120 : undefined), justifyContent: 'flex-end' }}>
          {viewport !== 'mobile' && (
            <button onClick={() => navigate('explore')} style={{
              background: v.surface, border: 'none', borderRadius: 999,
              padding: '8px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              color: v.ink3, fontFamily: v.fontBody, fontSize: 13,
            }}>
              <LxIcon name="explore" size={15} color={v.ink3} />
              <span>search</span>
            </button>
          )}
          <button onClick={() => navigate('notifications')} style={{ background: v.surface, border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
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
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
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
              <span style={{ position: 'absolute', top: 6, right: '25%', width: 8, height: 8, borderRadius: '50%', background: v.error }} />
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
  const suggestedRaw = [
    { idx: 1, id: '00000000-0000-0000-0000-000000000002', name: 'seed_author1', bio: 'Seed Author 1' },
    { idx: 2, id: '00000000-0000-0000-0000-000000000003', name: 'seed_author2', bio: 'Seed Author 2' },
    { idx: 3, id: '00000000-0000-0000-0000-000000000005', name: 'seed_vblocks', bio: 'Seed VBlocks' },
  ];
  
  const suggested = suggestedRaw.filter(u => !blocks.includes(u.id));
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {suggested.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                 onClick={() => navigate ? navigate('profile', { user: { id: u.id, username: u.name } }) : window.location.href = `/profile?user={"id":"${u.id}","username":"${u.name}"}`}>
              <LxAvatar size={36} idx={u.idx} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink }}>{u.name}</div>
                <div style={{ fontFamily: v.fontBody, fontSize: 11, color: v.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>
              </div>
              <LxBtn variant="ghost" size="sm">view</LxBtn>
            </div>
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
