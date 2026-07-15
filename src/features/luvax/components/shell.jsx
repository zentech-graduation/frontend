import { useState, useEffect } from 'react';
import { v } from '../constants/tokens';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar, LxBtn } from './primitives';
import { useAuthStore } from '@/store/useAuthStore';
import { usePendingFollowRequests, useSuggestedUsers, useFollowing } from '../hooks/useSocial';
import { useUnreadCount } from '../hooks/useNotifications';
import { UserCard } from './UserCard';
import '@/features/search/components/LxHeaderSearch';

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
    <div style={{ display: 'flex', alignItems: 'stretch', height: 56, gap: 58, flex: '0 1 auto', justifyContent: 'center', width: '100%', maxWidth: 520 }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => navigate(t.id)} className="lx-tab-btn" style={{
            flex: '0 0 auto', width: 44, minWidth: 44,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            paddingTop: 14,
            position: 'relative',
            color: isActive ? v.accent : v.ink3,
            transition: 'color 150ms ease-out',
          }}>
            <span
              style={{
                display: 'inline-flex',
                filter: 'none',
              }}
            >
              <LxIcon
                name={t.icon}
                size={21}
                filled={isActive}
                color={isActive ? v.accent : v.ink3}
                stroke={isActive ? 1.8 : 1.5}
              />
            </span>
            <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 12, height: 1.5, borderRadius: 999, background: isActive ? 'rgba(200, 169, 126, 0.78)' : 'transparent', opacity: isActive ? 0.45 : 0 }} />
            {t.id === 'notifications' && hasNotifications && (
              <span style={{ position: 'absolute', top: 11, right: 9, width: 6, height: 6, borderRadius: '50%', background: v.accent }} />
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
    'edit-profile': 'edit profile',
    'change-password': 'change password',
    blocked: 'blocked users',
  };
  const isSubpage = Boolean(subpages[screen]);
  const subpageLabel = subpages[screen];
  const mobileMsgBack = screen === 'messages' && viewport === 'mobile';
  const showBackHeader = isSubpage || mobileMsgBack;

  const innerMaxWidth = viewport === 'desktop' ? 1260 : viewport === 'tablet' ? 680 : '100%';
  const sideWidth     = viewport === 'desktop' ? 280  : viewport === 'tablet' ? 'auto' : 'auto';

  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = requestsResponse?.data || requestsResponse || [];
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.count || 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;
  const isDesktop = viewport === 'desktop';
  const HeaderSearch = typeof window !== 'undefined' ? window.LxHeaderSearch : null;
  const isMobile = viewport === 'mobile';
  const isTablet = viewport === 'tablet';

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
        gridTemplateColumns: isDesktop ? '260px minmax(420px, 1fr) 320px' : 'auto 1fr auto',
        alignItems: 'stretch',
        padding: isMobile ? '0 12px' : '0 28px',
        gap: isMobile ? 0 : 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isDesktop ? (showBackHeader ? 'center' : 'flex-start') : 'flex-start', gap: 12, flexShrink: 0, width: isDesktop ? '100%' : sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 120 : undefined), paddingLeft: isDesktop && !showBackHeader ? 0 : 0 }}>
          {showBackHeader ? (
            <>
              <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center' }}>
                <LxIcon name="back" size={20} color={v.ink} />
              </button>
              <span style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 600, color: v.ink }}>
                {mobileMsgBack ? 'chats' : subpageLabel}
              </span>
            </>
          ) : isMobile ? (
            <button
              type="button"
              onClick={() => navigate('compose')}
              aria-label="open composer"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center' }}
            >
              <LxIcon name="plus" size={20} color={v.ink} />
            </button>
          ) : (
            <button onClick={() => navigate('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: v.fontDisplay, fontSize: 24, fontWeight: 700, color: v.ink, letterSpacing: '-0.045em', lineHeight: 1 }}>
              luvax
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            pointerEvents: isMobile && !showBackHeader ? 'none' : 'auto',
            minWidth: 0,
          }}
        >
          {isDesktop && isMainTab ? <LxTopTabs active={screen} navigate={navigate} /> : null}
          {isTablet && !showBackHeader && HeaderSearch ? <HeaderSearch navigate={navigate} viewport={viewport} /> : null}
          {isMobile && !showBackHeader ? (
            <button
              type="button"
              onClick={() => navigate('feed')}
              style={{
                pointerEvents: 'all',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: v.fontDisplay,
                fontSize: 20,
                fontWeight: 700,
                color: v.ink,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              luvax
            </button>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, width: isDesktop ? '100%' : sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 120 : undefined), justifyContent: isDesktop ? 'flex-end' : 'flex-end', paddingRight: isDesktop ? 8 : 0 }}>
          {isDesktop && !showBackHeader && HeaderSearch ? <HeaderSearch navigate={navigate} viewport={viewport} /> : null}
          <button onClick={() => navigate('notifications')} className="lx-header-icon-btn" style={{ background: 'transparent', border: `1px solid ${v.borderSubtle}`, borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <LxIcon name="bell" size={19} color={v.ink2} />
            {hasNotifications && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: v.accent }} />}
          </button>
          <button onClick={() => navigate('profile')} className="lx-avatar-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      borderTop: `1px solid ${v.border}`,
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      flexShrink: 0,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => navigate(t.id)} className="lx-tab-btn" style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, height: 56,
            background: 'none', border: 'none', cursor: 'pointer',
            position: 'relative',
            transition: 'color 150ms ease-out',
          }}>
            <LxIcon
              name={t.icon}
              size={20}
              filled={isActive}
              color={isActive ? v.accent : v.ink3}
              stroke={isActive ? 1.8 : 1.5}
            />
            <span style={{ position: 'absolute', top: 0, left: '28%', right: '28%', height: 2, borderRadius: 999, background: isActive ? v.accent : 'transparent' }} />
            {t.id === 'notifications' && hasNotifications && (
              <span style={{ position: 'absolute', top: 6, right: '25%', width: 8, height: 8, borderRadius: '50%', background: v.accent }} />
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
