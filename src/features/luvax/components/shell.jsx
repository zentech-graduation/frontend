import { useState, useEffect } from 'react';
import { v } from '@/config/tokens';
import { extractPageContent } from '@/utils/helpers';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar, LxBtn } from './primitives';
import { useAuthStore } from '@/store/useAuthStore';
import { usePendingFollowRequests, useSuggestedUsers, useFollowing } from '../hooks/useSocial';
import { useUnreadCount } from '../hooks/useNotifications';
import { UserCard } from './UserCard';
import { LxHeaderSearch } from '@/features/search/components/LxHeaderSearch';

// ─── Top Tab Strip ─────────────────────────────────────────────────────────
export function LxTopTabs({ active, navigate, compact = false }) {
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
    <div style={{ display: 'flex', alignItems: 'stretch', height: compact ? 52 : 56, gap: compact ? 38 : 74, flex: '0 0 auto', justifyContent: 'center', width: '100%', maxWidth: compact ? 300 : 596, margin: compact ? '0 0 0 130px' : '0 auto' }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => navigate(t.id)} className="lx-tab-btn" style={{
            flex: '0 0 auto', width: compact ? 40 : 44, minWidth: compact ? 40 : 44,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            paddingTop: compact ? 11 : 16,
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
                size={compact ? 21 : 23}
                filled={isActive}
                color={isActive ? v.accent : v.ink3}
                stroke={isActive ? 1.8 : 1.5}
              />
            </span>
            <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: compact ? 10 : 12, height: 1.5, borderRadius: 999, background: isActive ? 'rgba(200, 169, 126, 0.78)' : 'transparent', opacity: isActive ? 0.45 : 0 }} />
            {t.id === 'notifications' && hasNotifications && (
              <span style={{ position: 'absolute', top: compact ? 12 : 11, right: compact ? 5 : 9, width: 6, height: 6, borderRadius: '50%', background: v.accent }} />
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
  const mobileMsgBack = screen === 'messages' && viewport === 'mobile' && false;
  const showBackHeader = isSubpage || mobileMsgBack;

  const isDesktop = viewport === 'desktop';
  const isTablet = viewport === 'tablet';
  const isWide = isDesktop || isTablet;
  const innerMaxWidth = isDesktop ? 1260 : isTablet ? 948 : '100%';
  const sideWidth = isDesktop ? 280 : isTablet ? 244 : 'auto';

  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = requestsResponse?.data || requestsResponse || [];
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.count || 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;
  const isMobile = viewport === 'mobile';

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: isTablet ? 52 : 56, flexShrink: 0,
      display: 'flex', justifyContent: 'center',
      background: 'var(--lx-glass-bg)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${v.border}`,
    }}>
      <div style={{
        width: '100%', maxWidth: innerMaxWidth,
        display: 'grid',
        gridTemplateColumns: isDesktop ? '244px minmax(596px, 1fr) 276px' : isTablet ? '82px minmax(0, 1fr) 244px' : 'auto 1fr auto',
        alignItems: 'stretch',
        padding: isMobile ? '0 12px' : isTablet ? '0 6px' : '0 28px',
        gap: isMobile ? 0 : isTablet ? 10 : 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isWide ? (showBackHeader ? 'center' : 'flex-start') : 'flex-start', gap: 12, flexShrink: 0, width: isWide ? '100%' : sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 82 : undefined), paddingLeft: isDesktop && !showBackHeader ? 4 : 0 }}>
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
            screen === 'messages' ? <div style={{ width: 24, height: 24 }} /> : (
              <button
                type="button"
                onClick={() => navigate('compose')}
                aria-label="open composer"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center' }}
              >
                <LxIcon name="plus" size={22} color={v.ink} />
              </button>
            )
          ) : (
            <button onClick={() => navigate('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: isTablet ? -10 : 0, fontFamily: v.fontDisplay, fontSize: isTablet ? 21 : 24, fontWeight: 700, color: v.ink, letterSpacing: '-0.045em', lineHeight: 1 }}>
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
          {isWide && isMainTab ? <LxTopTabs active={screen} navigate={navigate} compact={isTablet} /> : null}
          {isMobile && !showBackHeader ? (
            <button
              type="button"
              onClick={() => navigate(screen === 'messages' ? 'messages' : 'feed')}
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
              {screen === 'messages' ? 'messages' : 'luvax'}
            </button>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : isTablet ? 4 : 14, flexShrink: 0, width: isWide ? '100%' : sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 244 : undefined), justifyContent: 'flex-end', paddingRight: isDesktop ? 52 : isTablet ? 0 : 0 }}>
          {isWide && !showBackHeader ? <LxHeaderSearch navigate={navigate} viewport={viewport} screen={screen} params={params} /> : null}
          {screen === 'messages' && isMobile ? (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && typeof window.__lxMessagesCompose === 'function') {
                  window.__lxMessagesCompose();
                }
              }}
              aria-label="new message"
              className="lx-header-icon-btn"
              style={{ background: 'transparent', border: `1px solid ${v.border}`, borderRadius: '999px', width: 32, minWidth: 32, height: 32, aspectRatio: '1 / 1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: 'none', padding: 0, flexShrink: 0, marginRight: 2 }}
            >
              <LxIcon name="edit" size={13} color={v.ink2} />
            </button>
          ) : (screen !== 'messages' || isTablet || isDesktop) ? (
            <button onClick={() => navigate('notifications')} className="lx-header-icon-btn" style={{ background: 'none', border: `1px solid ${v.border}`, borderRadius: '999px', width: isTablet ? 34 : 32, minWidth: isTablet ? 34 : 32, height: isTablet ? 34 : 32, aspectRatio: '1 / 1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: 'none', padding: 0, flexShrink: 0, marginRight: isMobile ? 2 : 0 }}>
              <LxIcon name="bell" size={isTablet ? 20 : 19} color={v.ink2} />
              {hasNotifications && <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: v.accent }} />}
            </button>
          ) : isMobile ? <div style={{ width: 24, height: 24 }} /> : null}
          {!isMobile && (screen !== 'messages' || isTablet || isDesktop) ? (
            <button onClick={() => navigate('profile')} className="lx-avatar-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <LxAvatar size={isTablet ? 30 : 32} idx={0} ring={screen === 'profile'} />
            </button>
          ) : null}
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
export function LxRightRail({ navigate, compact = false }) {
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
  const followingList = myFollowingData?.pages?.flatMap(page => extractPageContent(page)) || [];
  const followingIds = new Set(followingList.map(u => u.id));

  const { data: suggestedResponse } = useSuggestedUsers();
  const suggestedRaw = suggestedResponse?.data || suggestedResponse || [];
  
  // Filter out blocked users AND users we are already following
  const suggested = suggestedRaw
    .filter(u => !blocks.includes(u.id) && !followingIds.has(u.id))
    .slice(0, 5);

  return (
    <aside style={{
      width: compact ? 196 : 280, flexShrink: 0,
      padding: compact ? '12px 10px 12px 12px' : '20px 20px',
      display: 'flex', flexDirection: 'column', gap: 24,
      position: 'sticky', top: 56, alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 56px)', overflowY: 'auto',
    }}>
      <div>
        <div style={{ fontFamily: v.fontMono, fontSize: compact ? 9 : 10, color: v.ink3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: compact ? 10 : 14 }}>trending</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 9 : 12 }}>
          {trending.map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'baseline', gap: 8, cursor: 'pointer' }}>
              <span style={{ fontFamily: v.fontMono, fontSize: compact ? 10 : 11, color: v.ink3, width: compact ? 15 : 18 }}>{String(i+1).padStart(2,'0')}</span>
              <span style={{ fontFamily: v.fontBody, fontSize: compact ? 13 : 15, color: v.ink, fontWeight: 600 }}>#{t}</span>
            </div>
          ))}
        </div>
      </div>

      {suggested.length > 0 ? (
        <div>
          <div style={{ fontFamily: v.fontMono, fontSize: compact ? 9 : 10, color: v.ink3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: compact ? 10 : 14 }}>suggested</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 6 }}>
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
      ) : null}
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
    const LEFT_W = 82;
    const isWideSettingsPane = ['settings', 'edit-profile', 'change-password', 'blocked'].includes(screen);
    const tabletMainWidth = screen === 'compose' ? 784 : isWideSettingsPane ? 704 : 604;
    const tabletShellWidth = screen === 'compose' ? 1090 : isWideSettingsPane ? 1010 : 910;
    const tabletRightSpacer = isWideSettingsPane ? LEFT_W : 206;
    return (
      <div style={{ minHeight: '100vh', background: v.base, display: 'flex', flexDirection: 'column' }}>
        <LxAppBar screen={screen} navigate={navigate} params={params} viewport={vp} />
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: tabletShellWidth, margin: '0 auto' }}>
          <div style={{ width: LEFT_W, flexShrink: 0 }} aria-hidden="true" />
          <main style={{
            width: tabletMainWidth, flexShrink: 0, minWidth: 0,
            borderLeft: screen === 'compose' ? 'none' : `1px solid ${v.border}`,
            borderRight: `1px solid ${v.border}`,
            minHeight: 'calc(100vh - 56px)',
            display: 'flex', flexDirection: 'column',
            background: v.base,
          }}>
            {children}
          </main>
          {showRightRail ? <LxRightRail navigate={navigate} compact /> : <div style={{ width: tabletRightSpacer, flexShrink: 0 }} aria-hidden="true" />}
        </div>
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
