import { useState, useEffect } from 'react';
import { TWEAK_DEFAULTS, ACCENT_PALETTES, FONT_MAP } from './constants/data';
import { useViewport } from './hooks/useViewport';
import { LxShell, LxAppBar, LxBottomNav } from './components/shell';
import { v } from '@/config/tokens';
import { FeedScreen } from './components/FeedScreen';
import { ExploreScreen } from './components/ExploreScreen';
import { ComposerScreen } from './components/ComposerScreen';
import { PostDetailScreen } from './components/PostDetailScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { BlockedUsersScreen } from './components/BlockedUsersScreen';
import { FollowersScreen } from './components/FollowersScreen';
import { FollowingScreen } from './components/FollowingScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { StoryViewScreen, StoryComposerScreen } from './components/StoryScreens';
import { EditProfileScreen } from './components/EditProfileScreen';
import { ChangePasswordScreen } from './components/ChangePasswordScreen';
import { MessagesScreen } from '../messages/MessagesScreen';

// ─── Luvax App Root ────────────────────────────────────────────────────────
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
  const [screen, setScreen] = useState(() => {
    try {
      const saved = sessionStorage.getItem('lx_screen');
      return saved ? JSON.parse(saved) : 'feed';
    } catch { return 'feed'; }
  });
  const [params, setParams] = useState(() => {
    try {
      const saved = sessionStorage.getItem('lx_params');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [history, setHistory] = useState([]);
  const [messagesThreadOpen, setMessagesThreadOpen] = useState(false);
  const viewport = useViewport();

  const setTweak = (keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setTweakState(prev => ({ ...prev, ...edits }));
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

  const navigate = (to, p = {}) => {
    if (typeof to === 'number') {
      if (
        to === -1 &&
        screen === 'messages' &&
        typeof window !== 'undefined' &&
        typeof window.__lxMessagesBack === 'function' &&
        window.__lxMessagesBack()
      ) {
        return;
      }

      if (to !== -1) {
        return;
      }

      setHistory(prevHistory => {
        const nextHistory = [...prevHistory];
        const previousScreen = nextHistory.pop() || 'feed';
        setScreen(previousScreen);
        setParams({});

        try {
          sessionStorage.setItem('lx_screen', JSON.stringify(previousScreen));
          sessionStorage.setItem('lx_params', JSON.stringify({}));
        } catch (e) { /* ignore */ }

        window.scrollTo(0, 0);
        return nextHistory;
      });
      return;
    }

    setHistory(h => screen !== to ? [...h, screen] : h);
    setScreen(to);
    setParams(p);
    try {
      sessionStorage.setItem('lx_screen', JSON.stringify(to));
      sessionStorage.setItem('lx_params', JSON.stringify(p));
    } catch (e) { /* ignore */ }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', tweaks.dark ? 'dark' : 'light');
    root.setAttribute('data-density', tweaks.density);
    root.style.setProperty('--lx-accent', tweaks.accent);
    root.style.setProperty('--lx-accent-dim',
      `color-mix(in srgb, ${tweaks.accent} ${tweaks.dark ? '22%' : '28%'}, var(--lx-base))`);
    root.style.setProperty('--lx-accent-dark',
      `color-mix(in srgb, ${tweaks.accent} 78%, #000)`);
    root.style.setProperty('--lx-accent-text',
      tweaks.dark
        ? `color-mix(in srgb, ${tweaks.accent} 60%, #fff)`
        : `color-mix(in srgb, ${tweaks.accent} 60%, #000)`);
    root.style.setProperty('--font-display', FONT_MAP[tweaks.font] || FONT_MAP.syne);
  }, [tweaks.dark, tweaks.accent, tweaks.font, tweaks.density]);

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

  const screenProps = { navigate, params, tweaks, setTweak, viewport };
  const screens = {
    feed:          <FeedScreen          {...screenProps} />,
    explore:       <ExploreScreen       {...screenProps} />,
    compose:       <ComposerScreen      {...screenProps} />,
    profile:       <ProfileScreen       {...screenProps} />,
    notifications: <NotificationsScreen {...screenProps} />,
    settings:      <SettingsScreen      {...screenProps} />,
    'edit-profile': <EditProfileScreen  {...screenProps} />,
    'change-password': <ChangePasswordScreen {...screenProps} />,
    blocked:       <BlockedUsersScreen  {...screenProps} />,
    followers:     <FollowersScreen     {...screenProps} />,
    following:     <FollowingScreen     {...screenProps} />,
  };

  if (screen === 'onboarding') {
    return <OnboardingScreen {...screenProps} />;
  }

  if (screen === 'messages') {
    const msgTop = viewport === 'mobile' ? 0 : 56;
    const msgBottom = viewport === 'mobile' ? 56 : 0;

    return (
      <div style={{ minHeight: '100vh', background: v.base }}>
        {viewport !== 'mobile' || (screen === 'messages' && !messagesThreadOpen) ? (
          <LxAppBar screen={screen} navigate={navigate} params={params} viewport={viewport} />
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
            <MessagesScreen {...screenProps} />
          </div>
        </div>
        {viewport === 'mobile' ? <LxBottomNav active={screen} navigate={navigate} /> : null}
      </div>
    );
  }

  if (screen === 'post') {
    const baseScreen = [...history].reverse().find(
      (s) => s !== 'post' && s !== 'story-view' && s !== 'story-compose' && s !== 'onboarding'
    ) || 'feed';
    const baseShowRail = (baseScreen === 'feed' || baseScreen === 'explore') && (viewport === 'desktop' || viewport === 'tablet');

    const baseScreenParams = baseScreen === 'profile' && params?.user
      ? { user: params.user }
      : {};

    return (
      <>
        <LxShell screen={baseScreen} navigate={navigate} params={baseScreenParams} showRightRail={baseShowRail}>
          {baseScreen === 'profile'
            ? <ProfileScreen {...screenProps} params={baseScreenParams} />
            : screens[baseScreen] || screens.feed}
        </LxShell>
        <PostDetailScreen {...screenProps} overlay />
      </>
    );
  }

  const isStory = screen === 'story-view' || screen === 'story-compose';
  if (isStory) {
    const baseScreen = [...history].reverse().find(
      s => s !== 'story-view' && s !== 'story-compose' && s !== 'onboarding'
    ) || 'feed';
    const baseShowRail = (baseScreen === 'feed' || baseScreen === 'explore') && (viewport === 'desktop' || viewport === 'tablet');
    const Overlay = screen === 'story-view' ? StoryViewScreen : StoryComposerScreen;
    return (
      <>
        <LxShell screen={baseScreen} navigate={navigate} params={{}} showRightRail={baseShowRail}>
          {screens[baseScreen] || screens.feed}
        </LxShell>
        <Overlay {...screenProps} />
      </>
    );
  }

  const showRail = (screen === 'feed' || screen === 'explore') && (viewport === 'desktop' || viewport === 'tablet');

  return (
    <LxShell screen={screen} navigate={navigate} params={params} showRightRail={showRail}>
      {screens[screen] || screens.feed}
    </LxShell>
  );
}
