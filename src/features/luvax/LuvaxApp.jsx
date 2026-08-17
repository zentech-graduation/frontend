import { useState, useEffect } from 'react';
import { Outlet, matchPath, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { TWEAK_DEFAULTS, FONT_MAP } from './constants/data';
import { useViewport } from './hooks/useViewport';
import { LxShell, LxAppBar, LxBottomNav } from './components/shell';
import { v } from '@/config/tokens';
import { APP_SCREENS, DEFAULT_BASE_SCREEN } from '@/routes/appScreens';
import { LuvaxTweaksProvider } from './LuvaxTweaksContext';
import { ToastHost } from './components/Toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserProfile } from './hooks/useUsers';

/**
 * Resolves the screen an overlay was opened from.
 *
 * Overlays record the address underneath them in history state, so going back,
 * forward, or reloading all reproduce the same backdrop. Opening an overlay
 * address cold carries no such state, and the feed stands in, which is what the
 * screen-state implementation did whenever its history stack was empty.
 */
function resolveBaseScreen(backgroundPath) {
  if (!backgroundPath) {
    return DEFAULT_BASE_SCREEN;
  }

  const match = APP_SCREENS.find((entry) =>
    matchPath({ path: entry.path, end: true }, backgroundPath)
  );
  return match ?? DEFAULT_BASE_SCREEN;
}

// Root scale for the authenticated app. The owner asked for everything larger
// and more readable. The luvax screens express type and spacing as inline pixel
// literals, so there is no token multiplier a component could read; a single
// root zoom is the one instrument that grows type, spacing, media, avatars, the
// logo and buttons together with their proportions intact and nothing pinned per
// component. It is scoped to the app by this component's lifecycle, so the frozen
// auth and landing routes are never scaled.
//
// The scale is fluid, not fixed. HD screens and below keep the comfortable base;
// 2K and larger screens grow it, so the interface and the post popup do not read
// as small on a wide display. It is clamped at both ends so it never shrinks the
// HD experience and never runs away on a very large screen.
const APP_SCALE_BASE = 1.14;
const APP_SCALE_REFERENCE_WIDTH = 1920;
const APP_SCALE_MAX = 1.6;

function computeAppScale(width) {
  if (!width) return APP_SCALE_BASE;
  const scaled = APP_SCALE_BASE * (width / APP_SCALE_REFERENCE_WIDTH);
  return Math.min(APP_SCALE_MAX, Math.max(APP_SCALE_BASE, scaled));
}

// ─── Luvax App Layout ──────────────────────────────────────────────────────
export function LuvaxApp() {
  const [tweaks, setTweakState] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return TWEAK_DEFAULTS;
    }

    if (localStorage.getItem('lxDarkManual') !== null) {
      return TWEAK_DEFAULTS;
    }

    return {
      ...TWEAK_DEFAULTS,
      dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    };
  });
  const [messagesThreadOpen, setMessagesThreadOpen] = useState(false);
  const viewport = useViewport();
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();

  // The login/refresh session carries a lean user without avatarUrl, so the
  // shell and comment composer would show a blank avatar while profile pages
  // (which fetch the full record) show the real one. Hydrate the store user
  // from the profile once, so the viewer's avatar is consistent everywhere.
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { data: myProfileResponse } = useUserProfile(currentUser?.id, Boolean(currentUser?.id));
  useEffect(() => {
    if (!currentUser?.id) return;
    const profile = myProfileResponse?.data || myProfileResponse;
    if (!profile?.id) return;
    if (
      currentUser.avatarUrl !== profile.avatarUrl ||
      currentUser.bannerUrl !== profile.bannerUrl
    ) {
      setUser({ ...currentUser, avatarUrl: profile.avatarUrl, bannerUrl: profile.bannerUrl });
    }
  }, [myProfileResponse, currentUser, setUser]);

  const handle = matches[matches.length - 1]?.handle ?? {};
  const screen = handle.screen ?? DEFAULT_BASE_SCREEN.screen;
  const chrome = handle.chrome ?? 'shell';
  const isOverlay = chrome === 'overlay';

  const setTweak = (keyOrEdits, val) => {
    const edits =
      typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : { [keyOrEdits]: val };
    setTweakState((prev) => ({ ...prev, ...edits }));
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    if (localStorage.getItem('lxDarkManual') === null) {
      setTweak('dark', media.matches);
    }

    const handleChange = (event) => {
      if (localStorage.getItem('lxDarkManual') === null) {
        setTweak('dark', event.matches);
      }
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', tweaks.dark ? 'dark' : 'light');
    root.setAttribute('data-density', tweaks.density);
    root.style.setProperty('--lx-accent', tweaks.accent);
    root.style.setProperty(
      '--lx-accent-dim',
      `color-mix(in srgb, ${tweaks.accent} ${tweaks.dark ? '22%' : '28%'}, var(--lx-base))`
    );
    root.style.setProperty('--lx-accent-dark', `color-mix(in srgb, ${tweaks.accent} 78%, #000)`);
    root.style.setProperty(
      '--lx-accent-text',
      tweaks.dark
        ? `color-mix(in srgb, ${tweaks.accent} 60%, #fff)`
        : `color-mix(in srgb, ${tweaks.accent} 60%, #000)`
    );
    root.style.setProperty('--font-display', FONT_MAP[tweaks.font] || FONT_MAP.syne);
  }, [tweaks.dark, tweaks.accent, tweaks.font, tweaks.density]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const scale = computeAppScale(window.innerWidth);
      root.style.setProperty('--lx-scale', String(scale));
      root.style.zoom = String(scale);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      root.style.zoom = '';
      root.style.removeProperty('--lx-scale');
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // The visible screen and its parameters used to be mirrored here so a reload
    // could restore them. The address bar holds that now, and a browser carrying
    // the old keys would otherwise keep a second, stale copy of navigation state
    // forever.
    window.sessionStorage.removeItem('lx_screen');
    window.sessionStorage.removeItem('lx_params');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleMessagesThreadOpen = (event) => {
      setMessagesThreadOpen(Boolean(event.detail?.open));
    };

    window.addEventListener('lx_messages_thread_open', handleMessagesThreadOpen);
    return () => {
      window.removeEventListener('lx_messages_thread_open', handleMessagesThreadOpen);
    };
  }, []);

  const tweakContext = { tweaks, setTweak, viewport };

  if (chrome === 'bare') {
    return (
      <LuvaxTweaksProvider value={tweakContext}>
        <Outlet />
      </LuvaxTweaksProvider>
    );
  }

  if (chrome === 'messages') {
    const msgTop = viewport === 'mobile' ? 0 : 56;
    const msgBottom = viewport === 'mobile' ? 56 : 0;

    return (
      <LuvaxTweaksProvider value={tweakContext}>
        <div style={{ minHeight: '100vh', background: v.base }}>
          {viewport !== 'mobile' || !messagesThreadOpen ? (
            <LxAppBar screen={screen} navigate={navigate} viewport={viewport} />
          ) : null}
          <div
            style={{
              position: 'fixed',
              top: msgTop,
              bottom: msgBottom,
              left: 0,
              right: 0,
              background: v.base,
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '100%',
                height: '100%',
                margin: '0 auto',
                background: v.base,
                overflow: 'hidden',
              }}
            >
              <Outlet />
            </div>
          </div>
          {viewport === 'mobile' ? <LxBottomNav active={screen} navigate={navigate} /> : null}
        </div>
      </LuvaxTweaksProvider>
    );
  }

  if (isOverlay) {
    const base = resolveBaseScreen(location.state?.background);
    const baseShowRail =
      Boolean(base.rightRail) && (viewport === 'desktop' || viewport === 'tablet');

    return (
      <LuvaxTweaksProvider value={tweakContext}>
        <LxShell screen={base.screen} navigate={navigate} showRightRail={baseShowRail}>
          {base.element}
        </LxShell>
        <Outlet />
        <ToastHost />
      </LuvaxTweaksProvider>
    );
  }

  const showRail = Boolean(handle.rightRail) && (viewport === 'desktop' || viewport === 'tablet');

  return (
    <LuvaxTweaksProvider value={tweakContext}>
      <LxShell screen={screen} navigate={navigate} showRightRail={showRail}>
        <Outlet />
      </LxShell>
      <ToastHost />
    </LuvaxTweaksProvider>
  );
}
