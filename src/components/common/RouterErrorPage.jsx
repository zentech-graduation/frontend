import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

import { ROUTES } from '@/config/constants';

/**
 * RouterErrorPage
 *
 * Used as the `errorElement` in the React Router config.
 * React Router calls this component when a loader, action, or child route
 * throws an error during rendering.
 *
 * Security notes:
 * - Raw error messages and stack traces are suppressed in production.
 * - `isRouteErrorResponse` distinguishes intentional HTTP-style responses
 *   (throw new Response(...)) from unexpected JS errors — only the status
 *   and a safe description are shown for the former.
 * - For unexpected errors only the generic message is shown to the user;
 *   the full error is logged for developer inspection.
 */
export default function RouterErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;

  let title = 'Something went wrong';
  let description = 'An unexpected error occurred. Please try again or return to the home page.';
  let statusCode = null;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;

    if (error.status === 404) {
      title = 'Page not found';
      description = "The page you're looking for doesn't exist.";
    } else if (error.status === 401 || error.status === 403) {
      title = 'Access denied';
      description = 'You do not have permission to view this page.';
    } else if (error.status >= 500) {
      title = 'Server error';
      description = 'Something went wrong on our end. Please try again shortly.';
    }
  }

  // Log for developer inspection — never rendered to the user in production.
  if (import.meta.env.DEV) {
    console.error('[RouterErrorPage]', error);
  }

  return (
    <main className="router-error-page">
      {statusCode ? (
        <p className="router-error-page__code">{statusCode}</p>
      ) : null}
      <h1>{title}</h1>
      <p className="router-error-page__description">{description}</p>

      {isDev && error?.message ? (
        <pre className="router-error-page__dev-detail">{error.message}</pre>
      ) : null}

      <div className="router-error-page__actions">
        <button className="router-error-page__btn" onClick={() => navigate(-1)}>
          Go back
        </button>
        <button className="router-error-page__btn router-error-page__btn--primary" onClick={() => navigate(ROUTES.HOME, { replace: true })}>
          Home
        </button>
      </div>
    </main>
  );
}
