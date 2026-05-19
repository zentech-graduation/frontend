import { createBrowserRouter } from 'react-router-dom';

// ── Layout stubs ────────────────────────────────────────────────────────────
import MainLayout from '@/layouts/MainLayout.jsx';

// ── Page stubs ──────────────────────────────────────────────────────────────
import HomePage from '@/pages/HomePage.jsx';
import NotFoundPage from '@/pages/NotFoundPage.jsx';

/**
 * React Router v7 — Data Router configuration.
 * Uses createBrowserRouter (enables loader/action API).
 *
 * Add feature routes inside the children[] of the main layout.
 */
const router = createBrowserRouter([
  {
    // Root layout shell wrapping all app pages
    element: <MainLayout />,
    children: [
      {
        index: true,       // matches "/"
        element: <HomePage />,
      },
    ],
  },

  // 404 fallback
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
