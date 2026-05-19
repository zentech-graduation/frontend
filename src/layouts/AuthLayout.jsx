import { Outlet } from 'react-router-dom';

/**
 * AuthLayout — centered card wrapper for login/register pages.
 */
function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
