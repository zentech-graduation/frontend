import { useEffect, useRef, useState } from 'react';
import { v } from '@/config/tokens';
import { ROUTES } from '@/config/constants';
import { extractPageContent } from '@/utils/helpers';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar, LxBtn } from './primitives';
import { usePendingFollowRequests } from '../hooks/useSocial';
import { useUnreadCount } from '../hooks/useNotifications';
import { LxHeaderSearch } from '@/features/search/components/LxHeaderSearch';
import { useAuthStore } from '@/store/useAuthStore';

// `id` still identifies the active tab for the shell's own styling; `path` is
// where the tab actually goes.
const PRIMARY_TABS = [
  { id: 'feed', path: ROUTES.FEED, icon: 'home', label: 'home' },
  // The messages interface is restored. It runs on its own presentation without
  // live data wiring yet, so the tab is enabled and reachable again.
  { id: 'messages', path: ROUTES.MESSAGES, icon: 'message', label: 'message' },
  { id: 'compose', path: ROUTES.COMPOSE, icon: 'plus', label: 'post' },
  { id: 'explore', path: ROUTES.EXPLORE, icon: 'explore', label: 'search' },
  { id: 'notifications', path: ROUTES.NOTIFICATIONS, icon: 'bell', label: 'notification' },
];

const BOTTOM_TABS = [
  ...PRIMARY_TABS,
  { id: 'profile', path: ROUTES.PROFILE, icon: 'profile', label: 'profile' },
];

// Hide-on-scroll for the persistent app bar.
//
// The design ships the CSS and gives the header the lx-bar hook, but never adds lx-bar-hidden, so
// the trigger is a derivation rather than a port. It hides once the page is scrolled past the bar's
// own height and the direction is downward, and reveals on any upward movement, so the bar is always
// one small scroll-up away. The 6px delta ignores sub-pixel jitter that would otherwise flicker the
// bar; the 56px floor is the bar height, so the bar never hides while still overlapping the content
// it belongs to.
//
// Two more sources of flicker needed guarding against once the side rail and messages fab started
// consuming this same signal:
//
// - A post/modal overlay locks body scroll by setting `document.body.style.overflow = 'hidden'`.
//   That lock itself can shift `window.scrollY` (the scrollbar disappearing reflows layout), which
//   the naive handler read as a real user scroll and used to flip the bar back in mid-overlay-open.
//   While the lock is active, scroll deltas are only used to resync `lastY`, never to toggle
//   visibility - so opening a post never moves the nav.
// - Fast/flicked scrolling fires bursts of alternating-direction scroll events as momentum settles.
//   A per-toggle cooldown means a flip only takes effect if the bar has been in its current state
//   for at least COOLDOWN_MS, so a single flick reads as one clean transition instead of a stutter.
const TOGGLE_COOLDOWN_MS = 220;

function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const lastToggleAt = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (typeof document !== 'undefined' && document.body.style.overflow === 'hidden') {
        lastY.current = y;
        return;
      }

      if (Math.abs(delta) < 6) return;
      lastY.current = y;

      const wantHidden = y > 56 && delta > 0;
      setHidden((current) => {
        if (wantHidden === current) return current;
        const now = performance.now();
        if (now - lastToggleAt.current < TOGGLE_COOLDOWN_MS) return current;
        lastToggleAt.current = now;
        return wantHidden;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return hidden;
}

// ─── Top Tab Strip ─────────────────────────────────────────────────────────
export function LxTopTabs({ active, navigate, compact = false }) {
  const tabs = PRIMARY_TABS;

  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = extractPageContent(requestsResponse);
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.unreadCount ?? 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height: compact ? 52 : 56, gap: compact ? 38 : 4, flex: compact ? '0 0 auto' : 1, justifyContent: 'center', width: compact ? '100%' : undefined, maxWidth: compact ? 300 : 560, margin: compact ? '0 0 0 130px' : undefined }}>
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
            flex: compact ? '0 0 auto' : 1,
            width: compact ? 40 : undefined, minWidth: compact ? 40 : undefined, maxWidth: compact ? undefined : 110,
            background: 'none', border: 'none',
            cursor: t.disabled ? 'not-allowed' : 'pointer',
            opacity: t.disabled ? 0.4 : 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: compact ? 'flex-start' : 'center',
            gap: compact ? undefined : 2,
            paddingTop: compact ? 11 : undefined,
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
                size={compact ? 21 : 22}
                filled={isActive}
                color={isActive ? v.accent : v.ink3}
                stroke={isActive ? 1.8 : 1.5}
              />
            </span>
            {/* The design draws no active underline, so desktop no longer has one. Tablet keeps it:
                the tablet layout is the frontend's own and is deliberately left as it was. */}
            {compact ? (
              <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 10, height: 1.5, borderRadius: 999, background: isActive ? 'rgba(200, 169, 126, 0.78)' : 'transparent', opacity: isActive ? 0.45 : 0 }} />
            ) : null}
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
export function LxAppBar({ screen, navigate, viewport, hidden = false }) {
  const currentUser = useAuthStore((state) => state.user);
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
  const barHidden = hidden;

  return (
    <header data-lx-bar="1" className={barHidden ? 'lx-bar lx-bar-hidden' : 'lx-bar'} style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: isTablet ? 52 : 56, flexShrink: 0,
      display: 'flex', justifyContent: 'center',
      background: 'var(--lx-glass-bg)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${v.border}`,
    }}>
      <div style={{
        width: '100%', maxWidth: innerMaxWidth,
        display: 'grid',
        gridTemplateColumns: isDesktop ? '244px minmax(596px, 1fr) 276px' : isTablet ? '82px minmax(0, 1fr) 244px' : 'auto 1fr auto',
        alignItems: 'stretch',
        padding: isMobile ? '0 12px' : isTablet ? '0 6px' : '0 16px',
        gap: isMobile ? 0 : isTablet ? 10 : 12,
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
            <button onClick={() => navigate(ROUTES.FEED)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: isTablet ? -10 : 0, fontFamily: v.fontDisplay, fontSize: isTablet ? 21 : 22, fontWeight: 700, color: v.ink, letterSpacing: isTablet ? '-0.045em' : '-0.03em', lineHeight: 1 }}>
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
          {/* The nav stays visible on every wide screen except the settings-area
              subpages, which keep their back header. Messages shows it too, so the
              bar never vanishes when moving into chats. */}
          {isWide && !showBackHeader ? <LxTopTabs active={screen} navigate={navigate} compact={isTablet} /> : null}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : isTablet ? 4 : 10, flexShrink: 0, width: isWide ? '100%' : sideWidth, minWidth: viewport === 'mobile' ? 'auto' : (viewport === 'tablet' ? 244 : undefined), justifyContent: 'flex-end', paddingRight: isDesktop ? 52 : isTablet ? 0 : 0 }}>
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
          ) : isMobile && screen !== 'messages' ? (
            // The header bell is kept only on mobile, where the top bar carries no
            // nav tabs. On a wide viewport it duplicated the nav's activity tab
            // sitting right beside it, so it is removed there.
            <button onClick={() => navigate(ROUTES.NOTIFICATIONS)} className="lx-header-icon-btn" style={{ background: v.surface, border: 'none', borderRadius: '50%', width: 36, minWidth: 36, height: 36, aspectRatio: '1 / 1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: 'none', padding: 0, flexShrink: 0, marginRight: 2 }}>
              <LxIcon name="bell" size={18} color={v.ink2} />
              {hasNotifications && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: v.accent }} />}
            </button>
          ) : isMobile ? <div style={{ width: 24, height: 24 }} /> : null}
          {!isMobile && (screen !== 'messages' || isTablet || isDesktop) ? (
            <button onClick={() => navigate(ROUTES.PROFILE)} className="lx-avatar-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <LxAvatar size={isTablet ? 30 : 32} idx={0} src={currentUser?.avatarUrl} ring={screen === 'profile'} />
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
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
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
              size={22}
              filled={isActive}
              color={isActive ? v.accent : v.ink3}
              stroke={isActive ? 1.8 : 1.5}
            />
            {t.id === 'notifications' && hasNotifications && (
              <span style={{ position: 'absolute', top: 6, right: '25%', width: 8, height: 8, borderRadius: '50%', background: v.accent }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Suggested accounts (composition only) ─────────────────────────────────
// The design's rail carries a suggested block of three user rows. Its version is hardcoded to
// three invented people, and there is no suggestions endpoint to drive a real one: the
// recommendation module has no read surface yet.
//
// This is the composition, driven entirely by the caller's data. It is deliberately not mounted in
// the rail. Rendering it with placeholder accounts would put invented people back into the
// interface, which this project has already removed once. It renders nothing when handed nothing,
// so the day a suggestions endpoint exists this needs a data hook and a single line in the rail.
export function LxSuggestedList({ users = [] }) {
  if (users.length === 0) return null;

  return (
    <div>
      <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>suggested</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {users.map((u) => (
          <div key={u.id ?? u.username} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LxAvatar size={36} src={u.avatarUrl} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink }}>{u.username}</div>
              <div style={{ fontFamily: v.fontBody, fontSize: 11, color: v.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>
            </div>
            <LxBtn variant="ghost" size="sm" onClick={u.onFollow}>follow</LxBtn>
          </div>
        ))}
      </div>
    </div>
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

// ─── Mark (icon-only) ───────────────────────────────────────────────────────
// The favicon PNG is the only icon-only Luvax mark in the project - the app
// otherwise only ever renders the "luvax" wordmark - so the rail reuses that
// same asset rather than a typographic stand-in.
function LxMark({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="luvax home"
      style={{
        width: 30, height: 30, borderRadius: 9,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img src="/luvax-mark.png" alt="" width={22} height={22} style={{ display: 'block', borderRadius: 6 }} />
    </button>
  );
}

// The icon column sits at a fixed offset from the rail's left edge in both
// states, so it never shifts horizontally when the rail expands - only the
// label beside it grows in.
const RAIL_COLLAPSED_W = 60;
const RAIL_EXPANDED_W = 196;
const RAIL_ICON_INSET = 13;

// ─── Left Sub-Nav Rail (desktop/tablet) ────────────────────────────────────
// A subordinate stand-in for the main bar, not a second main nav: smaller
// icons than the top bar's own, no divider against the content it floats
// over, and the tab list vertically centered in the available height rather
// than pinned under the mark. It appears exactly when useHideOnScroll has
// hidden the top bar, so navigation is never more than a glance to the left
// away. Hovering it expands the rail and reveals a text label per icon, the
// same disclosure Instagram's own collapsed sidebar uses.
export function LxSideRail({ active, navigate, visible }) {
  const currentUser = useAuthStore((state) => state.user);
  const [expanded, setExpanded] = useState(false);
  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = extractPageContent(requestsResponse);
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.unreadCount ?? 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;

  const rowStyle = (disabled) => ({
    width: '100%', height: 34, borderRadius: 9,
    background: 'none', border: 'none', paddingLeft: RAIL_ICON_INSET,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex', alignItems: 'center', gap: 12,
    position: 'relative', flexShrink: 0,
  });

  // maxWidth (not just opacity) has to collapse to 0 too: a nowrap label's
  // intrinsic text width otherwise still competes for space in the flex row
  // even while invisible, and the row is narrower than most labels, so the
  // icon next to it gets squeezed down to zero width by the flex algorithm.
  const labelStyle = (isActive) => ({
    fontFamily: v.fontBody, fontSize: 13, fontWeight: 600,
    color: isActive ? v.accent : v.ink3,
    textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden',
    maxWidth: expanded ? 120 : 0,
    opacity: expanded ? 1 : 0,
    transition: 'opacity 120ms ease-out, max-width 180ms var(--ease-out)',
  });

  const iconWrapStyle = { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <nav
      aria-hidden={!visible}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: expanded ? RAIL_EXPANDED_W : RAIL_COLLAPSED_W,
        zIndex: 100, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'stretch',
        padding: '16px 0',
        background: 'var(--lx-glass-bg)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        transform: visible ? 'translateX(0)' : 'translateX(-100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'transform var(--duration-normal) var(--ease-out), opacity var(--duration-normal) var(--ease-out), width 180ms var(--ease-out)',
      }}
    >
      <div style={{ paddingLeft: RAIL_ICON_INSET, flexShrink: 0 }}>
        <LxMark onClick={() => navigate(ROUTES.FEED)} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        {BOTTOM_TABS.map((t) => {
          const isActive = active === t.id;
          const isProfile = t.id === 'profile';
          return (
            <button
              key={t.id}
              onClick={() => !t.disabled && navigate(t.path)}
              disabled={t.disabled}
              aria-label={t.label}
              className="lx-tab-btn"
              style={rowStyle(t.disabled)}
            >
              <span style={iconWrapStyle}>
                {isProfile ? (
                  <LxAvatar size={20} src={currentUser?.avatarUrl} ring={isActive} />
                ) : (
                  <LxIcon
                    name={t.icon}
                    size={18}
                    filled={isActive}
                    color={isActive ? v.accent : v.ink3}
                    stroke={isActive ? 1.7 : 1.5}
                  />
                )}
              </span>
              <span style={labelStyle(isActive)}>{t.label}</span>
              {t.id === 'notifications' && hasNotifications && (
                <span style={{ position: 'absolute', top: 6, left: RAIL_ICON_INSET + 12, width: 6, height: 6, borderRadius: '50%', background: v.accent }} />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate(ROUTES.SETTINGS)}
        aria-label="profile settings"
        className="lx-tab-btn"
        style={rowStyle(false)}
      >
        <span style={iconWrapStyle}>
          <LxIcon name="settings" size={18} color={v.ink3} stroke={1.5} />
        </span>
        <span style={labelStyle(false)}>settings</span>
      </button>
    </nav>
  );
}

// ─── Floating Messages Button (desktop/tablet) ─────────────────────────────
// A quiet, slim rectangle - a border, not a filled pill - that stays put
// regardless of scroll direction rather than tracking the top bar's own
// hide/show, so it never itself becomes a second thing jumping around the
// screen. Pairs a label with a send affordance rather than a chat-bubble
// glyph, matching Instagram's own floating message entry point.
export function LxMessagesFab({ active, navigate }) {
  if (active === 'messages') return null;
  return (
    <button
      onClick={() => navigate(ROUTES.MESSAGES)}
      aria-label="open messages"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 100,
        height: 34, padding: '0 14px', borderRadius: 8,
        background: 'var(--lx-glass-bg)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${v.border}`,
        display: 'flex', alignItems: 'center', gap: 7,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontFamily: v.fontBody, fontSize: 12.5, fontWeight: 600, color: v.ink2 }}>message</span>
      <LxIcon name="send" size={13} color={v.ink2} stroke={2} />
    </button>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────────
export function LxShell({ screen, navigate, children, showRightRail = true }) {
  const vp = useViewport();
  // Shared with LxAppBar (which hides on the same signal) so the rail and
  // the floating messages button appear at exactly the moment the top bar
  // disappears, rather than each tracking scroll independently.
  const barHidden = useHideOnScroll();

  if (vp === 'desktop') {
    const LEFT_W = 280;
    return (
      <div style={{ minHeight: '100vh', background: v.base, display: 'flex', flexDirection: 'column' }}>
        <LxAppBar screen={screen} navigate={navigate} viewport={vp} hidden={barHidden} />
        <LxSideRail active={screen} navigate={navigate} visible={barHidden} />
        <LxMessagesFab active={screen} navigate={navigate} />
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: 1260, margin: '0 auto' }}>
          <div style={{ width: LEFT_W, flexShrink: 0 }} aria-hidden="true" />
          {/* Keyed by screen so a screen change fades in rather than cutting. */}
          <main key={screen} className="lx-fade-in" style={{
            width: 680, flexShrink: 0, minWidth: 0,
            // No column rules. The feed is one continuous surface on the page
            // background, so the borders that boxed the centre column are gone.
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
        <LxAppBar screen={screen} navigate={navigate} viewport={vp} hidden={barHidden} />
        <LxSideRail active={screen} navigate={navigate} visible={barHidden} />
        <LxMessagesFab active={screen} navigate={navigate} />
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: tabletShellWidth, margin: '0 auto' }}>
          <div style={{ width: LEFT_W, flexShrink: 0 }} aria-hidden="true" />
          <main key={screen} className="lx-fade-in" style={{
            width: tabletMainWidth, flexShrink: 0, minWidth: 0,
            // Column rules removed to match the desktop feed's continuous surface.
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
      <LxAppBar screen={screen} navigate={navigate} viewport={vp} hidden={barHidden} />
      <main key={screen} className="lx-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 72 }}>
        {children}
      </main>
      <LxBottomNav active={screen} navigate={navigate} />
    </div>
  );
}
