import { useEffect } from 'react';

import { authApi } from '@/api/authApi';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import { useAuthStore } from '@/store/useAuthStore';

export default function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const controller = new AbortController();

    const clearSession = async () => {
      try {
        await authApi.logout();
      } catch {
        // If the backend session is already gone, we still clear local auth state.
      } finally {
        if (!controller.signal.aborted) {
          logout();
        }
      }
    };

    clearSession();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, logout]);

  return (
    <main className="home-page">
      <AuthBrandPanel />
    </main>
  );
}
