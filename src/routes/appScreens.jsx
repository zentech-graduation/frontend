import { ROUTES } from '@/config/constants';
import { BlockedUsersScreen } from '@/features/luvax/components/BlockedUsersScreen';
import { ChangePasswordScreen } from '@/features/luvax/components/ChangePasswordScreen';
import { ComposerScreen } from '@/features/luvax/components/ComposerScreen';
import { EditProfileScreen } from '@/features/luvax/components/EditProfileScreen';
import { ExploreScreen } from '@/features/luvax/components/ExploreScreen';
import { FeedScreen } from '@/features/luvax/components/FeedScreen';
import { FollowersScreen } from '@/features/luvax/components/FollowersScreen';
import { FollowingScreen } from '@/features/luvax/components/FollowingScreen';
import { NotificationsScreen } from '@/features/luvax/components/NotificationsScreen';
import { OnboardingScreen } from '@/features/luvax/components/OnboardingScreen';
import { PostDetailScreen } from '@/features/luvax/components/PostDetailScreen';
import { ProfileScreen } from '@/features/luvax/components/ProfileScreen';
import { SavedPostsScreen } from '@/features/luvax/components/SavedPostsScreen';
import { SearchScreen } from '@/features/search/components/SearchScreen';
import { ScreenNotFound } from '@/features/luvax/components/ScreenNotFound';
import { SettingsScreen } from '@/features/luvax/components/SettingsScreen';
import { StoryComposerScreen, StoryViewScreen } from '@/features/luvax/components/StoryScreens';
import { MessagesScreen } from '@/features/messages/MessagesScreen';

/**
 * Every screen reachable inside the authenticated shell.
 *
 * The router builds its child routes from this list and the app layout reads the
 * same list back to work out which screen sits behind an overlay, so the two can
 * never disagree about which address renders which screen.
 *
 * `screen` is the identifier the shell already keys its chrome off: which tab
 * reads as active, whether a back header replaces the logo, and how wide the
 * tablet pane is. Keeping the existing identifiers is what makes this refactor
 * invisible.
 *
 * `chrome` selects the frame:
 * - `shell`    the standard app bar, rails, and bottom nav
 * - `messages` the fixed full-height pane messages has always rendered in
 * - `bare`     no frame at all
 *
 * `rightRail` reproduces the existing rule that only the feed and explore show
 * the trending rail.
 */
export const APP_SCREENS = [
  {
    screen: 'feed',
    index: true,
    path: ROUTES.FEED,
    element: <FeedScreen />,
    chrome: 'shell',
    rightRail: true,
  },
  {
    screen: 'explore',
    path: ROUTES.EXPLORE,
    element: <ExploreScreen />,
    chrome: 'shell',
    rightRail: true,
  },
  { screen: 'search', path: ROUTES.SEARCH, element: <SearchScreen />, chrome: 'shell' },
  { screen: 'compose', path: ROUTES.COMPOSE, element: <ComposerScreen />, chrome: 'shell' },
  {
    screen: 'notifications',
    path: ROUTES.NOTIFICATIONS,
    element: <NotificationsScreen />,
    chrome: 'shell',
  },
  { screen: 'messages', path: ROUTES.MESSAGES, element: <MessagesScreen />, chrome: 'messages' },
  { screen: 'settings', path: ROUTES.SETTINGS, element: <SettingsScreen />, chrome: 'shell' },
  {
    screen: 'edit-profile',
    path: ROUTES.EDIT_PROFILE,
    element: <EditProfileScreen />,
    chrome: 'shell',
  },
  {
    screen: 'change-password',
    path: ROUTES.CHANGE_PASSWORD,
    element: <ChangePasswordScreen />,
    chrome: 'shell',
  },
  {
    screen: 'blocked',
    path: ROUTES.BLOCKED_USERS,
    element: <BlockedUsersScreen />,
    chrome: 'shell',
  },
  { screen: 'saved', path: ROUTES.SAVED, element: <SavedPostsScreen />, chrome: 'shell' },
  { screen: 'profile', path: ROUTES.PROFILE, element: <ProfileScreen />, chrome: 'shell' },
  { screen: 'profile', path: ROUTES.USER_PROFILE, element: <ProfileScreen />, chrome: 'shell' },
  {
    screen: 'followers',
    path: ROUTES.USER_FOLLOWERS,
    element: <FollowersScreen />,
    chrome: 'shell',
  },
  {
    screen: 'following',
    path: ROUTES.USER_FOLLOWING,
    element: <FollowingScreen />,
    chrome: 'shell',
  },
  { screen: 'onboarding', path: ROUTES.ONBOARDING, element: <OnboardingScreen />, chrome: 'bare' },
];

/**
 * Screens that render on top of another screen rather than replacing it.
 *
 * Each one is a real address that can be shared and opened cold, and each one
 * renders over whichever screen it was opened from. The layout owns that
 * composition, so whether a post detail stays an overlay or becomes a full page
 * is a change in one place and does not touch this table.
 */
export const APP_OVERLAY_SCREENS = [
  { screen: 'post', path: ROUTES.POST_DETAIL, element: <PostDetailScreen overlay /> },
  { screen: 'story-compose', path: ROUTES.STORY_COMPOSE, element: <StoryComposerScreen /> },
  { screen: 'story-view', path: ROUTES.STORY_VIEW, element: <StoryViewScreen /> },
];

/**
 * Rendered for any address under /app that matches nothing above, so a mistyped
 * or stale link keeps the user inside the application instead of dropping them
 * on the global 404 with no way back.
 */
export const APP_NOT_FOUND_SCREEN = {
  screen: 'not-found',
  element: <ScreenNotFound />,
  chrome: 'shell',
};

/** The screen an overlay falls back to when it is opened cold. */
export const DEFAULT_BASE_SCREEN = APP_SCREENS[0];
