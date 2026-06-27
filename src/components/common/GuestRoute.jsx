import { Navigate, Outlet, useLocation } from 'react-router-dom';

import PageLoader from '@/components/common/PageLoader';
import { ROUTES } from '@/config/constants';
import { useAuthStore } from '@/store/useAuthStore';

export default function GuestRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const isReauthRequest = new URLSearchParams(location.search).get('reauth') === '1';

  if (isBootstrapping) {
    return <PageLoader label="Preparing authentication..." />;
  }

  if (isAuthenticated && !isReauthRequest) {
    return <Navigate to={ROUTES.APP} replace />;
  }

  return <Outlet />;
}
