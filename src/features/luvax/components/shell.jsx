import { useState } from 'react';
import { v } from '@/config/tokens';
import { ROUTES } from '@/config/constants';
import { extractPageContent } from '@/utils/helpers';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar, LxBtn } from './primitives';
import { usePendingFollowRequests } from '../hooks/useSocial';
import { useUnreadCount } from '../hooks/useNotifications';
import { useAuthStore } from '@/store/useAuthStore';
import { isPanelRole } from '@/config/roles';
import { useConversations } from '@/features/messages/hooks/useConversations';
import { toThreadSummary } from '@/features/messages/utils/messageViewModel';

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

const MESSAGE_PREVIEW_LIMIT = 3;

// ─── Persistent App Bar (mobile only) ──────────────────────────────────────
// Desktop and tablet render no top bar at all: the side rail already carries every
// destination this bar used to duplicate (nav tabs, search, profile), so a second copy of
// the same nav only cost vertical space without adding a route. Mobile keeps this bar
// because it has no side rail - it is the only place carrying the back button for a
// subpage, the current page's title, and the notification bell.
export function LxAppBar({ screen, navigate }) {
  // Every settings category is the same screen with a category in the path, so
  // one entry covers what used to be four separate screen ids. The category's
  // own name is carried by the region's heading rather than by this bar.
  const subpages = {
    post: 'post',
    settings: 'settings',
  };
  const isSubpage = Boolean(subpages[screen]);
  const subpageLabel = subpages[screen];

  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = extractPageContent(requestsResponse);
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.unreadCount ?? 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;

  return (
    <header
      data-lx-bar="1"
      className="lx-bar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 56,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--lx-glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${v.border}`,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'stretch',
          padding: '0 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {isSubpage ? (
            <>
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  marginLeft: -4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LxIcon name="back" size={20} color={v.ink} />
              </button>
              <span style={{ fontFamily: v.fontBody, fontSize: 15, fontWeight: 600, color: v.ink }}>
                {subpageLabel}
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate(ROUTES.COMPOSE)}
              aria-label="open composer"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                marginLeft: -4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LxIcon name="plus" size={22} color={v.ink} />
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: isSubpage ? 'auto' : 'none',
            minWidth: 0,
          }}
        >
          {!isSubpage ? (
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            justifyContent: 'flex-end',
          }}
        >
          {isSubpage ? (
            <div style={{ width: 24, height: 24 }} />
          ) : (
            <button
              onClick={() => navigate(ROUTES.NOTIFICATIONS)}
              className="lx-header-icon-btn"
              style={{
                background: v.surface,
                border: 'none',
                borderRadius: '50%',
                width: 36,
                minWidth: 36,
                height: 36,
                aspectRatio: '1 / 1',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: 'none',
                padding: 0,
                flexShrink: 0,
                marginRight: 2,
              }}
            >
              <LxIcon name="bell" size={18} color={v.ink2} />
              {hasNotifications && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: v.error,
                  }}
                />
              )}
            </button>
          )}
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
    <nav
      style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-around',
        padding: '0',
        background: 'var(--lx-glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${v.border}`,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {tabs.map((t) => {
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
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              height: 56,
              border: 'none',
              cursor: t.disabled ? 'not-allowed' : 'pointer',
              opacity: t.disabled ? 0.4 : 1,
              position: 'relative',
              transition: 'color 150ms ease-out',
            }}
          >
            <LxIcon
              name={t.icon}
              size={22}
              filled={isActive}
              color={isActive ? v.accent : v.ink3}
              stroke={isActive ? 1.8 : 1.5}
            />
            {t.id === 'notifications' && hasNotifications && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: '25%',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: v.error,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Suggested accounts (composition only) ─────────────────────────────────
// The design's rail carries a suggested block of three user rows. Its version is hardcoded to
// three invented people, and there is no suggested-accounts endpoint to drive a real one: the
// recommendation module now serves a post feed (GET /recommendations/feed), but nothing
// recommends accounts to follow.
//
// This is the composition, driven entirely by the caller's data. It is deliberately not mounted in
// the rail. Rendering it with placeholder accounts would put invented people back into the
// interface, which this project has already removed once. It renders nothing when handed nothing,
// so the day a suggested-accounts endpoint exists this needs a data hook and a single line in the
// rail.
export function LxSuggestedList({ users = [] }) {
  if (users.length === 0) return null;

  return (
    <div>
      <div
        style={{
          fontFamily: v.fontMono,
          fontSize: 10,
          color: v.ink3,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        suggested
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {users.map((u) => (
          <div key={u.id ?? u.username} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LxAvatar size={36} src={u.avatarUrl} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink }}>
                {u.username}
              </div>
              <div
                style={{
                  fontFamily: v.fontBody,
                  fontSize: 11,
                  color: v.ink3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {u.bio}
              </div>
            </div>
            <LxBtn variant="ghost" size="sm" onClick={u.onFollow}>
              follow
            </LxBtn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Right Rail (desktop) ──────────────────────────────────────────────────
export function LxRightRail({ compact = false }) {
  return (
    <aside
      style={{
        width: compact ? 196 : 280,
        flexShrink: 0,
        padding: compact ? '12px 10px 12px 12px' : '20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        // vh is computed against the true viewport, unadjusted for the root's zoom scale, so a
        // raw 100vh here rendered taller than the real viewport and could push part of the rail
        // out of view. Dividing by --lx-scale cancels the zoom multiplication back out.
        maxHeight: 'calc(100vh / var(--lx-scale))',
        overflowY: 'auto',
      }}
    >
      {/* The trending rail was a hardcoded list of invented tags, numbered as
          though it were a ranking and clickable as though it filtered. There is
          a real trending endpoint, but wiring it is not part of this phase, and
          a fabricated ranking is worse than an empty rail. */}
    </aside>
  );
}

function LxFloatingMessagePreview({ navigate, currentUserId, hidden = false }) {
  const { conversations } = useConversations();
  const recentMessageThreads = conversations
    .slice(0, MESSAGE_PREVIEW_LIMIT)
    .map((conversation) => toThreadSummary(conversation, currentUserId));

  if (hidden) return null;

  const compact = recentMessageThreads.length === 0;

  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.MESSAGES)}
      aria-label="open messages"
      style={{
        position: 'fixed',
        right: 32,
        bottom: 30,
        zIndex: 90,
        minWidth: compact ? 106 : 142,
        height: 38,
        borderRadius: 999,
        border: `1px solid ${v.border}`,
        background: v.surface,
        color: v.ink,
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 7 : 9,
        padding: compact ? '0 11px' : '0 12px',
        cursor: 'pointer',
        boxShadow: `0 10px 28px ${v.shadow12}`,
        fontFamily: v.fontBody,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <LxIcon name="message" size={14} color={v.ink2} />
      <span>Message</span>
      {recentMessageThreads.length ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2 }}>
          {recentMessageThreads.map((thread, index) => (
            <span
              key={thread.id}
              style={{
                marginLeft: index === 0 ? 0 : -6,
                border: `1px solid ${v.surface}`,
                borderRadius: '50%',
                display: 'inline-flex',
              }}
            >
              <LxAvatar size={18} src={thread.avatarUrl} />
            </span>
          ))}
        </span>
      ) : null}
    </button>
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
        width: 30,
        height: 30,
        borderRadius: 9,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src="/luvax-mark.png"
        alt=""
        width={22}
        height={22}
        style={{ display: 'block', borderRadius: 6 }}
      />
    </button>
  );
}

// The icon column sits at a fixed offset from the rail's left edge in both
// states, so it never shifts horizontally when the rail expands - only the
// label beside it grows in. The inset centers a 20px icon in the collapsed
// rail's 60px width.
export const RAIL_COLLAPSED_W = 60;
const RAIL_EXPANDED_W = 196;
const RAIL_ICON_INSET = 20;
const RAIL_ICON_SIZE = 20;

// ─── Left Sub-Nav Rail (desktop/tablet) ────────────────────────────────────
// The primary nav on desktop and tablet: it is always on screen rather than a
// stand-in that appears only when something else disappears, matching the
// smaller icon-only sidebar Instagram itself keeps visible at all times.
// `position: fixed` keeps it out of the page's own flex flow, so hovering it
// open overlays the interface instead of shifting the app's layout. Hovering
// expands the rail and reveals a text label per icon, the same disclosure
// Instagram's own collapsed sidebar uses.
export function LxSideRail({ active, navigate, visible = true }) {
  const currentUser = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const [expanded, setExpanded] = useState(false);
  // The role is held in memory only and is absent until the session is
  // established, so this reads false first and turns true once the role
  // arrives. The entry appears late for a privileged account rather than
  // appearing for an ordinary one and then vanishing.
  const canReachPanel = isPanelRole(role);
  const { data: requestsResponse } = usePendingFollowRequests();
  const requests = extractPageContent(requestsResponse);
  const { data: unreadResponse } = useUnreadCount();
  const unreadCount = unreadResponse?.data?.unreadCount ?? 0;
  const hasNotifications = requests.length > 0 || unreadCount > 0;

  const rowStyle = (disabled) => ({
    width: '100%',
    height: 34,
    borderRadius: 9,
    border: 'none',
    paddingLeft: RAIL_ICON_INSET,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    flexShrink: 0,
  });

  // maxWidth (not just opacity) has to collapse to 0 too: a nowrap label's
  // intrinsic text width otherwise still competes for space in the flex row
  // even while invisible, and the row is narrower than most labels, so the
  // icon next to it gets squeezed down to zero width by the flex algorithm.
  const labelStyle = (isActive) => ({
    fontFamily: v.fontBody,
    fontSize: 13,
    fontWeight: 600,
    // --lx-ink-3 measures below 4.5:1 on this surface in both themes, and these
    // labels are the rail's only readable naming of its destinations rather
    // than a decorative mark. --lx-ink-2 is the same role above the threshold.
    color: isActive ? v.accent : v.ink2,
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    maxWidth: expanded ? 120 : 0,
    opacity: expanded ? 1 : 0,
    transition: 'opacity 120ms ease-out, max-width 180ms var(--ease-out)',
  });

  const iconWrapStyle = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <nav
      aria-hidden={!visible}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      // The labels are the rail's only way of naming its destinations, so
      // revealing them cannot be a mouse-only affordance. Focus entering the
      // rail opens it exactly as hover does and focus leaving closes it, which
      // makes tabbing through the nav show the same labels a pointer does.
      // React's focus events bubble, so this covers every button inside.
      onFocus={() => setExpanded(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: expanded ? RAIL_EXPANDED_W : RAIL_COLLAPSED_W,
        zIndex: 100,
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '16px 0',
        background: 'var(--lx-glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transform: visible ? 'translateX(0)' : 'translateX(-100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        // width is deliberately not transitioned: it is also this element's own hover hit-test
        // box, and animating it let a real mouse's path cross a not-yet-grown edge mid-transition,
        // firing a spurious mouseleave that collapsed the rail out from under the cursor. Snapping
        // it instantly removes that race; the label still reveals smoothly via its own transition.
        transition:
          'transform var(--duration-normal) var(--ease-out), opacity var(--duration-normal) var(--ease-out)',
      }}
    >
      <div style={{ paddingLeft: RAIL_ICON_INSET, flexShrink: 0 }}>
        <LxMark onClick={() => navigate(ROUTES.FEED)} />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
        }}
      >
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
                  <LxAvatar size={RAIL_ICON_SIZE} src={currentUser?.avatarUrl} ring={isActive} />
                ) : (
                  <LxIcon
                    name={t.icon}
                    size={RAIL_ICON_SIZE}
                    filled={isActive}
                    color={isActive ? v.accent : v.ink3}
                    stroke={isActive ? 1.7 : 1.5}
                  />
                )}
              </span>
              <span style={labelStyle(isActive)}>{t.label}</span>
              {t.id === 'notifications' && hasNotifications && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: RAIL_ICON_INSET + 12,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: v.error,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {canReachPanel ? (
        <button
          onClick={() => navigate(ROUTES.ADMIN)}
          aria-label="panel"
          className="lx-tab-btn"
          style={rowStyle(false)}
        >
          <span style={iconWrapStyle}>
            <LxIcon name="shield" size={RAIL_ICON_SIZE} color={v.ink3} stroke={1.5} />
          </span>
          <span style={labelStyle(false)}>panel</span>
        </button>
      ) : null}

      <button
        onClick={() => navigate(ROUTES.SETTINGS)}
        aria-label="profile settings"
        className="lx-tab-btn"
        style={rowStyle(false)}
      >
        <span style={iconWrapStyle}>
          <LxIcon name="settings" size={RAIL_ICON_SIZE} color={v.ink3} stroke={1.5} />
        </span>
        <span style={labelStyle(false)}>settings</span>
      </button>
    </nav>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────────
export function LxShell({ screen, navigate, children, showRightRail = true }) {
  const vp = useViewport();
  const currentUserId = useAuthStore((state) => state.user?.id);

  // Settings is the one screen that is not a reading column. It is a list of
  // groups beside the category that is open, and the list belongs immediately
  // against the navigation rail: that is what lets the rail expand over it
  // rather than over the content the person came to read. So it takes the full
  // width from the rail's collapsed edge instead of sitting in the centred
  // column the rest of the application uses.
  if (vp !== 'mobile' && screen === 'settings') {
    return (
      <div style={{ background: v.base }}>
        <LxSideRail active={screen} navigate={navigate} />
        <LxFloatingMessagePreview
          navigate={navigate}
          currentUserId={currentUserId}
          hidden={screen === 'messages'}
        />
        <main
          key={screen}
          className="lx-fade-in"
          style={{
            marginLeft: RAIL_COLLAPSED_W,
            minHeight: 'calc(100vh / var(--lx-scale))',
            display: 'flex',
            flexDirection: 'column',
            background: v.base,
          }}
        >
          {children}
        </main>
      </div>
    );
  }

  if (vp === 'desktop') {
    const LEFT_W = 280;
    const isWideScreen = screen === 'search' || screen === 'explore';
    const mainWidth = isWideScreen ? 960 : 680;
    const shellMaxWidth = isWideScreen ? 1540 : 1260;
    return (
      // No min-height: 100vh here - it would carry the same zoom-vs-vh mismatch <main> below
      // has to correct for, and nothing in this row needs it: the rail is fixed-positioned and
      // <main> establishes the page's real height on its own.
      <div style={{ background: v.base, display: 'flex', flexDirection: 'column' }}>
        <LxSideRail active={screen} navigate={navigate} />
        <LxFloatingMessagePreview
          navigate={navigate}
          currentUserId={currentUserId}
          hidden={screen === 'messages'}
        />
        <div
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: shellMaxWidth,
            margin: '0 auto',
          }}
        >
          <div style={{ width: LEFT_W, flexShrink: 0 }} aria-hidden="true" />
          {/* Keyed by screen so a screen change fades in rather than cutting. */}
          <main
            key={screen}
            className="lx-fade-in"
            style={{
              width: mainWidth,
              flexShrink: 0,
              minWidth: 0,
              // No column rules. The feed is one continuous surface on the page
              // background, so the borders that boxed the centre column are gone.
              minHeight: 'calc(100vh / var(--lx-scale))',
              display: 'flex',
              flexDirection: 'column',
              background: v.base,
            }}
          >
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
    // Settings never reaches here: it is handled above, against the rail.
    const tabletMainWidth =
      screen === 'compose' ? 784 : screen === 'search' || screen === 'explore' ? 760 : 604;
    const tabletShellWidth =
      screen === 'compose' ? 1090 : screen === 'search' || screen === 'explore' ? 1060 : 910;
    const tabletRightSpacer = 206;
    return (
      // No min-height: 100vh here - see the desktop branch above for why.
      <div style={{ background: v.base, display: 'flex', flexDirection: 'column' }}>
        <LxSideRail active={screen} navigate={navigate} />
        <LxFloatingMessagePreview
          navigate={navigate}
          currentUserId={currentUserId}
          hidden={screen === 'messages'}
        />
        <div
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: tabletShellWidth,
            margin: '0 auto',
          }}
        >
          <div style={{ width: LEFT_W, flexShrink: 0 }} aria-hidden="true" />
          <main
            key={screen}
            className="lx-fade-in"
            style={{
              width: tabletMainWidth,
              flexShrink: 0,
              minWidth: 0,
              // Column rules removed to match the desktop feed's continuous surface.
              minHeight: 'calc(100vh / var(--lx-scale))',
              display: 'flex',
              flexDirection: 'column',
              background: v.base,
            }}
          >
            {children}
          </main>
          {showRightRail ? (
            <LxRightRail navigate={navigate} compact />
          ) : (
            <div style={{ width: tabletRightSpacer, flexShrink: 0 }} aria-hidden="true" />
          )}
        </div>
      </div>
    );
  }

  // mobile
  return (
    // <main> below is flex: 1, which needs a definite parent height to distribute against, so
    // (unlike the desktop/tablet branches) this wrapper keeps a real min-height - zoom-corrected.
    <div
      style={{
        minHeight: 'calc(100vh / var(--lx-scale))',
        background: v.base,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LxAppBar screen={screen} navigate={navigate} />
      <main
        key={screen}
        className="lx-fade-in"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 72 }}
      >
        {children}
      </main>
      <LxBottomNav active={screen} navigate={navigate} />
    </div>
  );
}
