import { useState, useEffect } from 'react';
import { TWEAK_DEFAULTS, ACCENT_PALETTES, FONT_MAP } from './constants/data';
import { useViewport } from './hooks/useViewport';
import { LxShell, LxAppBar, LxBottomNav } from './components/shell';
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
import '@/features/search/components/LxHeaderSearch';
import '@/features/messages/components/MessagesScreen';
import { v } from './constants/tokens';

// ─── Luvax App Root ────────────────────────────────────────────────────────
export function LuvaxApp() {
  const [tweaks, setTweakState] = useState(TWEAK_DEFAULTS);
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
  const viewport = useViewport();

  const setTweak = (keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setTweakState(prev => ({ ...prev, ...edits }));
  };

  const navigate = (to, p = {}) => {
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

  const screenProps = { navigate, params, tweaks, viewport };
  const GlobalMessagesScreen = typeof window !== 'undefined' ? window.MessagesScreen : null;

  if (screen === 'onboarding') {
    return <OnboardingScreen {...screenProps} />;
  }

  if (screen === 'messages') {
    const msgTop = viewport === 'mobile' ? 0 : 56;
    const msgBottom = viewport === 'desktop' ? 0 : 56;
    const isDesktop = viewport === 'desktop';

    return (
      <div style={{ minHeight: '100vh', background: '#1d1915', display: 'flex', flexDirection: 'column' }}>
        {viewport !== 'mobile' && <LxAppBar screen={screen} navigate={navigate} params={params} viewport={viewport} />}
        <div
          style={{
            position: 'fixed',
            top: msgTop,
            bottom: msgBottom,
            left: 0,
            right: 0,
            width: '100%',
            transform: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            background: '#1d1915',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          {GlobalMessagesScreen ? <GlobalMessagesScreen {...screenProps} /> : null}
        </div>
        {viewport !== 'desktop' && <LxBottomNav active={screen} navigate={navigate} />}
      </div>
    );
  }

  const screens = {
    feed:          <FeedScreen          {...screenProps} />,
    explore:       <ExploreScreen       {...screenProps} />,
    compose:       <ComposerScreen      {...screenProps} />,
    post:          <PostDetailScreen    {...screenProps} />,
    profile:       <ProfileScreen       {...screenProps} />,
    notifications: <NotificationsScreen {...screenProps} />,
    settings:      <SettingsScreen      {...screenProps} />,
    blocked:       <BlockedUsersScreen  {...screenProps} />,
    followers:     <FollowersScreen     {...screenProps} />,
    following:     <FollowingScreen     {...screenProps} />,
  };

  const isStory = screen === 'story-view' || screen === 'story-compose';
  if (isStory) {
    const baseScreen = [...history].reverse().find(
      s => s !== 'story-view' && s !== 'story-compose' && s !== 'onboarding'
    ) || 'feed';
    const baseShowRail = (baseScreen === 'feed' || baseScreen === 'explore') && viewport === 'desktop';
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

  const showRail = (screen === 'feed' || screen === 'explore') && viewport === 'desktop';

  return (
    <LxShell screen={screen} navigate={navigate} params={params} showRightRail={showRail}>
      {screens[screen] || screens.feed}
    </LxShell>
  );
}
