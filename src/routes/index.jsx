import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom';

import AuthSessionBootstrap from '@/components/common/AuthSessionBootstrap';
import NotFoundPage from '@/components/common/NotFoundPage';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import RouterErrorPage from '@/components/common/RouterErrorPage';
import EmailVerificationPage from '@/pages/auth/EmailVerificationPage';
import VerifyEmailNoticePage from '@/pages/auth/VerifyEmailNoticePage';
import AuthPage from '@/features/auth/components/AuthPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import LuvaxPage from '@/pages/LuvaxPage';

function RootLayout() {
  return (
    <>
      <AuthSessionBootstrap />
      <Outlet />
    </>
  );
}

function LoginRedirect() {
  const location = useLocation();
  return <Navigate to={`/${location.search}`} state={location.state} replace />;
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        path: '/',
        element: <AuthPage />,
      },
      {
        path: '/app',
        element: <LuvaxPage />,
      },
      {
        path: '/verify-email',
        element: <EmailVerificationPage />,
      },
      {
        path: '/verify-email-notice',
        element: <VerifyEmailNoticePage />,
      },
      {
        path: '/login',
        element: <LoginRedirect />,
      },
      {
        path: '/register',
        element: <Navigate to="/?view=register" replace />,
      },
      {
        path: '/forgot-password',
        element: <Navigate to="/?view=forgot" replace />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: '/oauth2/callback',
        element: <OAuthCallbackPage />,
      },
      {
        path: '/oauth/callback',
        element: <OAuthCallbackPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
