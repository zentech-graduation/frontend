import {
  Navigate,
  Outlet,
  ScrollRestoration,
  createBrowserRouter,
  useLocation,
} from 'react-router-dom';

import { Suspense, lazy } from 'react';

import AuthSessionBootstrap from '@/components/common/AuthSessionBootstrap';
import GuestRoute from '@/components/common/GuestRoute';
import NotFoundPage from '@/components/common/NotFoundPage';
import PageLoader from '@/components/common/PageLoader';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import RouterErrorPage from '@/components/common/RouterErrorPage';
import { ROUTES } from '@/config/constants';
import EmailVerificationPage from '@/pages/auth/EmailVerificationPage';
import VerifyEmailNoticePage from '@/pages/auth/VerifyEmailNoticePage';
import AuthPage from '@/features/auth/components/AuthPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import { adminRoute } from '@/features/admin';
import { APP_NOT_FOUND_SCREEN, APP_OVERLAY_SCREENS, APP_SCREENS } from './appScreens';

// The authenticated shell and everything under it load on demand. An anonymous visitor on the
// sign-in page has no use for either, and the shell was the largest single contributor to the
// entry chunk.
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const LuvaxPage = lazy(() => import('@/pages/LuvaxPage'));

function RootLayout() {
  return (
    <>
      <AuthSessionBootstrap />
      {/* Sends every navigation to the top of the page and returns the browser
          to its previous offset on back, replacing the manual scroll reset the
          screen switch used to perform. */}
      <ScrollRestoration />
      {/* Screens under the authenticated shell are code-split, so a first visit to one suspends
          while its chunk downloads. One boundary here covers every route rather than each screen
          having to remember its own. */}
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </>
  );
}

function LoginRedirect() {
  const location = useLocation();
  return <Navigate to={`/${location.search}`} state={location.state} replace />;
}

// Each screen carries its identity on the route rather than in component state.
// The layout reads it back through useMatches to pick the chrome, so adding a
// screen means adding one row to APP_SCREENS and nothing else.
const toRouteObject = ({ screen, index, path, element, chrome, rightRail }) => ({
  ...(index ? { index: true } : { path }),
  element,
  handle: { screen, chrome, rightRail },
});

const toOverlayRouteObject = ({ screen, path, element }) => ({
  path,
  element,
  handle: { screen, chrome: 'overlay' },
});

// The help centre. Lazily loaded so the user-facing application does not carry
// its weight, and split from the panel entirely because three of these screens
// are anonymous.
const SupportHomeScreen = lazy(() =>
  import('@/features/support/screens/SupportHomeScreen').then((m) => ({
    default: m.SupportHomeScreen,
  }))
);
const SupportTicketScreen = lazy(() =>
  import('@/features/support/screens/SupportAnonymousScreens').then((m) => ({
    default: m.SupportTicketScreen,
  }))
);
const SupportAppealScreen = lazy(() =>
  import('@/features/support/screens/SupportAnonymousScreens').then((m) => ({
    default: m.SupportAppealScreen,
  }))
);
const SupportPublicScreen = lazy(() =>
  import('@/features/support/screens/SupportAnonymousScreens').then((m) => ({
    default: m.SupportPublicScreen,
  }))
);
const SupportConfirmScreen = lazy(() =>
  import('@/features/support/screens/SupportAnonymousScreens').then((m) => ({
    default: m.SupportConfirmScreen,
  }))
);
const SupportUnsubscribeScreen = lazy(() =>
  import('@/features/support/screens/SupportAnonymousScreens').then((m) => ({
    default: m.SupportUnsubscribeScreen,
  }))
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          {
            path: ROUTES.HOME,
            element: <AuthPage />,
          },
        ],
      },
      {
        path: ROUTES.VERIFY_EMAIL,
        element: <EmailVerificationPage />,
      },
      {
        path: ROUTES.VERIFY_EMAIL_NOTICE,
        element: <VerifyEmailNoticePage />,
      },
      {
        path: ROUTES.LOGIN,
        element: <LoginRedirect />,
      },
      {
        path: ROUTES.REGISTER,
        element: <Navigate to={`${ROUTES.HOME}?view=register`} replace />,
      },
      {
        path: ROUTES.FORGOT_PASSWORD,
        element: <Navigate to={`${ROUTES.HOME}?view=forgot`} replace />,
      },
      {
        path: ROUTES.RESET_PASSWORD,
        element: <ResetPasswordPage />,
      },
      {
        path: ROUTES.OAUTH_CALLBACK,
        element: <OAuthCallbackPage />,
      },
      // The four anonymous help centre routes, deliberately outside
      // ProtectedRoute. The accounts these exist for are banned or suspended and
      // cannot authenticate at all, so a guard here would lock out exactly the
      // people the surface is for. The backend permits these paths anonymously
      // for the same reason.
      {
        path: ROUTES.SUPPORT_APPEAL,
        element: <SupportAppealScreen />,
      },
      {
        path: ROUTES.SUPPORT_PUBLIC,
        element: <SupportPublicScreen />,
      },
      {
        path: ROUTES.SUPPORT_CONFIRM,
        element: <SupportConfirmScreen />,
      },
      {
        path: ROUTES.SUPPORT_UNSUBSCRIBE,
        element: <SupportUnsubscribeScreen />,
      },
      {
        // One guard for the whole authenticated area, and one shell rendered
        // around every screen in it.
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.APP,
            element: <LuvaxPage />,
            children: [
              ...APP_SCREENS.map(toRouteObject),
              ...APP_OVERLAY_SCREENS.map(toOverlayRouteObject),
              {
                path: '*',
                element: APP_NOT_FOUND_SCREEN.element,
                handle: {
                  screen: APP_NOT_FOUND_SCREEN.screen,
                  chrome: APP_NOT_FOUND_SCREEN.chrome,
                },
              },
            ],
          },
          {
            path: ROUTES.DASHBOARD,
            element: <DashboardPage />,
          },
          // The authenticated half of the help centre.
          {
            path: ROUTES.SUPPORT,
            element: <SupportHomeScreen />,
          },
          {
            path: ROUTES.SUPPORT_TICKET,
            element: <SupportTicketScreen />,
          },
          // The administrative and moderation panel. A separate route tree under
          // /admin, gated on role inside the shared authentication guard.
          adminRoute,
        ],
      },
    ],
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFoundPage />,
  },
]);

export default router;
