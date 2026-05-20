import { Navigate, Outlet } from 'react-router-dom';

import PageLoader from '@/components/common/PageLoader';
import { useAuthStore } from '@/store/useAuthStore';

export default function GuestRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  if (isBootstrapping) {
    return <PageLoader label="Preparing authentication..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
