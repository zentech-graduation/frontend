import { Outlet, createBrowserRouter } from 'react-router-dom';

import AuthSessionBootstrap from '@/components/common/AuthSessionBootstrap';
import GuestRoute from '@/components/common/GuestRoute';
import NotFoundPage from '@/components/common/NotFoundPage';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import EmailVerificationPage from '@/pages/auth/EmailVerificationPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import LoginPage from '@/pages/auth/LoginPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import HomePage from '@/pages/HomePage';

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
    children: [
      {
        path: '/',
        element: <HomePage />,
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
            path: '/verify-email',
            element: <EmailVerificationPage />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
          },
          {
            path: '/reset-password',
            element: <ResetPasswordPage />,
          },
        ],
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
