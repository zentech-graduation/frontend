# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- Email verification token consumed twice in development due to React StrictMode double-invoke; replaced AbortController cancellation approach with a useRef idempotency guard that prevents the single-use token from being called more than once per page visit.

### Added
- Added `ROUTES.VERIFY_EMAIL_NOTICE` constant (`/verify-email-notice`) to the central route path registry.
- Added placeholder `VerifyEmailNoticePage` at `src/pages/auth/VerifyEmailNoticePage.jsx` so the route compiles before the full implementation lands.
- Added `verifyEmail`, `resendVerification`, `forgotPassword`, `resetPassword`, and `exchangeOAuthCode` methods to `authService` so all auth API calls are exposed through the service layer.
- Frontend support for backend-managed Google OAuth2 login, including the `/oauth2/callback` route and exchange-code handling.
- Luvax social network UI ported from `src/index.html` into the React/Vite project under `src/features/luvax/`, accessible at `/app`.
- Full Luvax design token set (light + dark themes, glass, density, semantic colors, scrollbar overrides) merged into `src/index.css`.
- All Luvax screens as isolated JSX components: Feed, Explore, Composer, PostDetail, Profile, Notifications, Settings, Onboarding, StoryView, StoryComposer.
- Shared UI primitives (LxIcon, LxAvatar, LxTag, LxBtn, LxDivider, LxBottomSheet) in `src/features/luvax/components/primitives.jsx`.
- Responsive shell (LxShell, LxAppBar, LxTopTabs, LxBottomNav, LxRightRail) in `src/features/luvax/components/shell.jsx`.
- `useViewport` hook for desktop/tablet/mobile breakpoint detection.
- `/app` route wired into the central router for the Luvax UI.
- Added `GlobalErrorBoundary` class component wrapping the entire app in `main.jsx`; render-phase crashes now show a recoverable fallback instead of a blank screen.
- Added `RouterErrorPage` component as `errorElement` on the root route; route-level loader/action errors are caught and display user-safe copy with Go back / Home recovery actions.
- Added global `QueryCache` and `MutationCache` `onError` handlers to `QueryClient`; all TanStack Query failures flow through a single logging point (401s excluded — owned by the Axios interceptor).
- Added `normalizeAxiosError` to `axiosClient.js`; all Axios errors on both `publicClient` and `axiosClient` are normalized before reaching any consumer — raw database constraints, Hibernate/Spring class names, SQL fragments, internal status enum values (INACTIVE, BANNED), and stack trace strings are redacted and replaced with safe user-facing copy.
- Added GitHub governance files including issue templates, pull request template, CODEOWNERS, and CI-related workflows.

### Changed
- `GuestRoute` now redirects authenticated users to `ROUTES.APP` (`/app`) instead of `ROUTES.DASHBOARD`.
- `/verify-email` route moved from inside `GuestRoute` to a top-level child under `RootLayout` so authenticated users arriving via an email link are not bounced away.
- `/verify-email-notice` route added as a top-level child under `RootLayout` (outside `GuestRoute`) so newly registered users can reach it regardless of session state.
- `registerSchema` now includes a required `username` field (3–30 chars, alphanumeric + underscores) and makes the `name` (display name) field optional with a 100-character maximum.
- `resetPasswordSchema` no longer includes a `token` field; the token is extracted from the URL programmatically and is not a form input.
- Removed "Already have a reset token?" link from `ForgotPasswordPage` and "This email may already be waiting for verification" link from `RegisterPage` to streamline the user flow.
- Updated repository ignore rules to keep local `.env` files out of version control.
- Added agent instructions, local agent rules, and a project structure reference for future coding sessions.

### Fixed
- `useRegister` hook now passes `state: { email }` when navigating to `VerifyEmailNoticePage` so the resend form is pre-populated.
- `/reset-password` route moved out of `GuestRoute` to a top-level route so authenticated users clicking a reset link are not bounced to `/app`.
- `EMAIL_NOT_VERIFIED` navigation in `LoginPage` now uses `replace: true` for consistent history behavior.
- Removed Vietnamese-language subtitle text from `EmailVerificationPage` and replaced it with English copy.
- `EmailVerificationPage` now calls `setAuth` and navigates to `/app` when the backend returns a session on successful verification; falls back to `/login` with a success message when no session is returned.
- `OAuthCallbackPage` now redirects to `ROUTES.APP` (`/app`) on successful OAuth exchange instead of the deprecated `/dashboard`.
- `LoginPage` now detects `EMAIL_NOT_VERIFIED` error code from the backend and navigates to `VerifyEmailNoticePage` with the email pre-filled instead of showing a generic error.
- `LoginPage` fallback redirect after login now uses `ROUTES.APP` instead of the hardcoded string `/dashboard`.
- `RegisterPage` no longer auto-generates a username; users now provide their own username via a dedicated form field before the email input.
- `RegisterPage` navigates directly to `ROUTES.VERIFY_EMAIL_NOTICE` on successful registration (no delay timer) and no longer uses the deprecated `ROUTES.VERIFY_EMAIL` redirect.
- `ResetPasswordPage` no longer renders the token as an editable input; the token is extracted from the URL and passed directly to the API call.
- `ResetPasswordPage` shows an "invalid or expired link" error state immediately when no token is present in the URL, with a link to request a new reset email.
- Replaced the `VerifyEmailNoticePage` placeholder with a full implementation: shows a "check your inbox" notice and a resend-verification form pre-populated from router state.
- Realigned Google sign-in with the backend OAuth2 contract by starting auth at `/api/v1/auth/oauth2/authorize/google` and exchanging the returned short-lived `code` instead of a browser token.
- Corrected the default Google OAuth2 start endpoint to `/api/v1/auth/oauth2/authorize/google` so the frontend targets the backend-mounted authorization route.
- Updated `.env` and `.env.example` so local Google login uses the backend OAuth2 authorization route and the `/oauth2/callback` frontend return path.
- Reverted the frontend Google OAuth2 start endpoint to Spring Security's default `/oauth2/authorization/google` to match the backend's current `application.yml` configuration.
- Re-applied the frontend Google OAuth2 start endpoint `/api/v1/auth/oauth2/authorize/google` so the login flow follows the backend `oauth2` module contract exactly.
- Added `AbortController` cleanup to the async `verifyEmail` effect in `EmailVerificationPage`; `navigate` and `setTokenError` are now no-ops if the component unmounts before the request resolves.
- Added `AbortController` cleanup to the async `clearSession` effect in `HomePage`; `logout()` is guarded against post-unmount invocation.
- Replaced `href="#"` anchor elements in `AuthBrandPanel` footer with `<button type="button">` elements; eliminates the false navigation affordance, spurious history entries, and scroll-to-top side effect.
- Documented the intentional `window.location.assign` usage in `axiosClient.js` as an audited exception; the Axios interceptor runs outside the React tree and cannot use `useNavigate`.
- Scrubbed `?token=` from the URL in `EmailVerificationPage` via `history.replaceState` before the async verification call, preventing the token from persisting in browser history.
- Scrubbed `?token=` from the URL in `ResetPasswordPage` via `useLayoutEffect`+`history.replaceState` synchronously before first paint; the token is retained in RHF `defaultValues` (in-memory only).
- `ProtectedRoute` now passes only `{ pathname }` in `location.state.from` — `search` and `hash` are stripped, closing the leak where `?token=` query params could survive in navigation state across history traversal.
- `ProtectedRoute` now requires both `isAuthenticated` (persisted) and a live `accessToken` (in-memory) before granting access, closing the race between persist rehydration and `AuthSessionBootstrap` token refresh on cold page loads.
- Consolidated duplicate `LoginPage` implementations; `src/features/auth/components/LoginPage.jsx` is now the single canonical entry point wired into the router.
- Merged conflicting Zod schema files into `src/features/auth/utils/authSchemas.js`; the `src/components/auth/authSchemas.js` copy has been deleted.
- Retargeted all schema consumers (`ForgotPasswordPage`, `RegisterPage`, `ResetPasswordPage`) to import from the canonical feature-slice location.
- Removed literal `nom` syntax token from `cn.js` that caused a parse error breaking all shadcn/ui primitives.
- Wrapped auth store in Zustand `persist` middleware; `accessToken` and `refreshToken` are now in-memory only and excluded from `localStorage` via `partialize`.
- Fixed `hasHydrated` initialization — it now starts `false` and is set `true` exclusively via `onRehydrateStorage`, eliminating the race where consumers read a stale hydration flag.
- Removed implicit OAuth flow (response_type `token id_token`) from the Google OAuth URL builder; only the authorization-code flow (`code`) is now issued.
- Removed client-side JWT parsing via `window.atob` (`decodeJwt`, `buildUserFromGoogleClaims`) — user identity is now established exclusively by the backend.
- Enforced strict CSRF state check in `OAuthCallbackPage`: both stored and returned `state` values must be present and equal; missing either side is now a hard failure.
- URL hash and query tokens are scrubbed via `history.replaceState` before any async exchange begins in `OAuthCallbackPage`.
- Added `useRef` guard to `OAuthCallbackPage` to prevent double-invocation under React Strict Mode.

### Removed
- Deleted unused `AuthLayout.jsx` and `MainLayout.jsx` scaffold files; neither was imported anywhere in the application.
- Deleted `src/pages/auth/LoginPage.jsx` (superseded by feature-slice canonical).
- Deleted `src/features/auth/components/LoginForm.jsx` (shadcn scaffold stub, replaced by the full LoginPage).
- Deleted `src/components/auth/authSchemas.js` (merged into feature-slice utils).
