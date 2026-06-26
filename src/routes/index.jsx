import { Outlet, createBrowserRouter } from 'react-router-dom';

import AuthSessionBootstrap from '@/components/common/AuthSessionBootstrap';
import GuestRoute from '@/components/common/GuestRoute';
import NotFoundPage from '@/components/common/NotFoundPage';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import RouterErrorPage from '@/components/common/RouterErrorPage';
import EmailVerificationPage from '@/pages/auth/EmailVerificationPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import VerifyEmailNoticePage from '@/pages/auth/VerifyEmailNoticePage';
import LoginPage from '@/features/auth/components/LoginPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import HomePage from '@/pages/HomePage';
import LuvaxPage from '@/pages/LuvaxPage';

function RootLayout() {
  return (
    <>
      <AuthSessionBootstrap />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        path: '/',
        element: <HomePage />,
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
        element: <GuestRoute />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/register',
            element: <RegisterPage />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
          },
        ],
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
