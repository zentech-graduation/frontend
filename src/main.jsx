import React from 'react';
import ReactDOM from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import GlobalErrorBoundary from '@/components/common/ErrorBoundary';
import router from './routes/index.jsx';
import './index.css';

/**
 * normalizeQueryError
 *
 * Centralized error handler for all TanStack Query cache events.
 * Runs for every failed query and mutation before the error reaches
 * individual hooks — the single place to:
 *  - Log to an error reporter (Sentry, DataDog, etc.)
 *  - Emit global UI notifications (toast system, etc.)
 *  - Suppress known/expected errors (401s are handled by the Axios interceptor)
 *
 * Security: raw backend messages are logged only to the console here.
 * UI-facing messages are the responsibility of each hook/component.
 */
const handleQueryError = (error) => {
  const status = error?.response?.status;

  // 401s are handled by the Axios refresh interceptor and clearAuthAndRedirect.
  // Do not double-handle them here.
  if (status === 401) {
    return;
  }

  // Replace with your error-reporting SDK call (e.g. Sentry.captureException(error))
  console.error('[QueryClient]', error?.message ?? error);
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleQueryError,
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
