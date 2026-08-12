import { v } from '@/config/tokens';
import { ROUTES } from '@/config/constants';
import { extractPageContent } from '@/utils/helpers';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar } from './primitives';
import { usePendingFollowRequests } from '../hooks/useSocial';
import { useUnreadCount } from '../hooks/useNotifications';
import { LxHeaderSearch } from '@/features/search/components/LxHeaderSearch';

// `id` still identifies the active tab for the shell's own styling; `path` is
// where the tab actually goes.
const PRIMARY_TABS = [
  { id: 'feed', path: ROUTES.FEED, icon: 'home', label: 'home' },
  { id: 'explore', path: ROUTES.EXPLORE, icon: 'explore', label: 'explore' },
  // Messages is implemented on the backend but is not part of this build.
  // The tab stays visible so the shape of the product is honest, and is
  // disabled so it cannot present a feature that is not there.
  { id: 'messages', path: ROUTES.MESSAGES, icon: 'chat', label: 'chats', disabled: true },
  { id: 'compose', path: ROUTES.COMPOSE, icon: 'plus', label: 'post' },
  { id: 'notifications', path: ROUTES.NOTIFICATIONS, icon: 'bell', label: 'activity' },
];

const BOTTOM_TABS = [
  ...PRIMARY_TABS,
  { id: 'profile', path: ROUTES.PROFILE, icon: 'profile', label: 'you' },
];

// ─── Top Tab Strip ─────────────────────────────────────────────────────────
export function LxTopTabs({ active, navigate, compact = false }) {
  const tabs = PRIMARY_TABS;

  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = extractPageContent(requestsResponse);
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.unreadCount ?? 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height: compact ? 52 : 56, gap: compact ? 38 : 74, flex: '0 0 auto', justifyContent: 'center', width: '100%', maxWidth: compact ? 300 : 596, margin: compact ? '0 0 0 130px' : '0 auto' }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => !t.disabled && navigate(t.path)}
            disabled={t.disabled}
            aria-disabled={t.disabled || undefined}
            title={t.disabled ? `${t.label} are not part of this build` : undefined}
            className="lx-tab-btn"
            style={{
            flex: '0 0 auto', width: compact ? 40 : 44, minWidth: compact ? 40 : 44,
            background: 'none', border: 'none',
            cursor: t.disabled ? 'not-allowed' : 'pointer',
            opacity: t.disabled ? 0.4 : 1,
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
export function LxAppBar({ screen, navigate, viewport }) {
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
  const requests = extractPageContent(requestsResponse);
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.unreadCount ?? 0;
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
                onClick={() => navigate(ROUTES.COMPOSE)}
                aria-label="open composer"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: -4, display: 'flex', alignItems: 'center' }}
              >
                <LxIcon name="plus" size={22} color={v.ink} />
              </button>
            )
          ) : (
            <button onClick={() => navigate(ROUTES.FEED)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: isTablet ? -10 : 0, fontFamily: v.fontDisplay, fontSize: isTablet ? 21 : 24, fontWeight: 700, color: v.ink, letterSpacing: '-0.045em', lineHeight: 1 }}>
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
              onClick={() => navigate(screen === 'messages' ? ROUTES.MESSAGES : ROUTES.FEED)}
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
          {isWide && !showBackHeader ? <LxHeaderSearch navigate={navigate} viewport={viewport} screen={screen} /> : null}
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
            <button onClick={() => navigate(ROUTES.NOTIFICATIONS)} className="lx-header-icon-btn" style={{ background: 'none', border: `1px solid ${v.border}`, borderRadius: '999px', width: isTablet ? 34 : 32, minWidth: isTablet ? 34 : 32, height: isTablet ? 34 : 32, aspectRatio: '1 / 1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: 'none', padding: 0, flexShrink: 0, marginRight: isMobile ? 2 : 0 }}>
              <LxIcon name="bell" size={isTablet ? 20 : 19} color={v.ink2} />
              {hasNotifications && <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: v.accent }} />}
            </button>
          ) : isMobile ? <div style={{ width: 24, height: 24 }} /> : null}
          {!isMobile && (screen !== 'messages' || isTablet || isDesktop) ? (
            <button onClick={() => navigate(ROUTES.PROFILE)} className="lx-avatar-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
  const tabs = BOTTOM_TABS;

  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = extractPageContent(requestsResponse);
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.unreadCount ?? 0;
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
          <button
            key={t.id}
            onClick={() => !t.disabled && navigate(t.path)}
            disabled={t.disabled}
            aria-disabled={t.disabled || undefined}
            title={t.disabled ? `${t.label} are not part of this build` : undefined}
            className="lx-tab-btn"
            style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, height: 56,
            background: 'none', border: 'none',
            cursor: t.disabled ? 'not-allowed' : 'pointer',
            opacity: t.disabled ? 0.4 : 1,
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
export function LxRightRail({ compact = false }) {
  return (
    <aside style={{
      width: compact ? 196 : 280, flexShrink: 0,
      padding: compact ? '12px 10px 12px 12px' : '20px 20px',
      display: 'flex', flexDirection: 'column', gap: 24,
      position: 'sticky', top: 56, alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 56px)', overflowY: 'auto',
    }}>
      {/* The trending rail was a hardcoded list of invented tags, numbered as
          though it were a ranking and clickable as though it filtered. There is
          a real trending endpoint, but wiring it is not part of this phase, and
          a fabricated ranking is worse than an empty rail. */}
    </aside>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────────
export function LxShell({ screen, navigate, children, showRightRail = true }) {
  const vp = useViewport();

  if (vp === 'desktop') {
    const LEFT_W = 280;
    return (
      <div style={{ minHeight: '100vh', background: v.base, display: 'flex', flexDirection: 'column' }}>
        <LxAppBar screen={screen} navigate={navigate} viewport={vp} />
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
        <LxAppBar screen={screen} navigate={navigate} viewport={vp} />
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
      <LxAppBar screen={screen} navigate={navigate} viewport={vp} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 72 }}>
        {children}
      </main>
      <LxBottomNav active={screen} navigate={navigate} />
    </div>
  );
}
