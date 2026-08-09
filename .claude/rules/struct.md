# Frontend Project Structure

## Overview

React 19 single-page application (SPA) for an Instagram-style social network, built with Vite 8.

### Core Stack

| Component | Value |
|-----------|-------|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Package Manager | npm |
| Node.js Requirement | LTS (see `.nvmrc` if present; Vite 8 requires Node 20+) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| UI Components | shadcn/ui + Radix primitives (`components.json` configures aliases and paths) |
| Server State | TanStack Query v5 (`QueryClientProvider` in `src/main.jsx`) |
| Global Client State | Zustand v5 (with `persist` middleware for auth session) |
| HTTP Client | Axios v1 — `src/api/axiosClient.js` exports `axiosClient` (auth) and `publicClient` (no-auth) |
| Routing | React Router DOM v7 — config router (`createBrowserRouter`) |
| Forms | React Hook Form v7 + Zod v4 |
| Language | JavaScript (no TypeScript; `jsconfig.json` provides IDE path resolution) |

---

## Full `src/` Tree

```text
src/
├── api/
│   ├── authApi.js             # Auth endpoints; uses publicClient. Login sends `identifier`
│   ├── axiosClient.js         # Axios instances + interceptors; exports axiosClient, publicClient
│   └── media.service.js       # Pre-signed upload URL flow
├── assets/                    # Static assets imported from application code
├── components/
│   ├── common/                # App-level reusable pieces
│   │   ├── AuthSessionBootstrap.jsx   # Bootstraps auth state on app mount
│   │   ├── ErrorBoundary.jsx          # React error boundary
│   │   ├── GuestRoute.jsx             # Redirects authenticated users away from guest-only routes
│   │   ├── NotFoundPage.jsx           # 404 page
│   │   ├── PageLoader.jsx             # Full-page loading spinner
│   │   ├── ProtectedRoute.jsx         # Redirects unauthenticated users to /login
│   │   └── RouterErrorPage.jsx        # Error fallback for router-level errors
│   └── ui/                    # shadcn/ui primitives plus Luvax-specific shared UI
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       ├── label.jsx
│       ├── lx-avatar.jsx
│       ├── lx-dropdown-menu.jsx
│       └── lx-icon.jsx
├── config/
│   ├── constants.js           # ROUTES, API_URL, STALE_TIME, HTTP_STATUS, APP_NAME
│   └── tokens.js              # `v` design-token object consumed by the luvax screens
├── context/                   # Reserved - empty
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── AuthField.jsx  # Floating-label input used by every auth form
│   │   │   ├── AuthPage.css
│   │   │   └── AuthPage.jsx   # Unified login / register / forgot-password page
│   │   ├── index.js
│   │   ├── services/
│   │   │   └── authService.js
│   │   ├── store/             # Reserved - empty
│   │   └── utils/
│   │       └── authSchemas.js # Zod schemas mirroring the backend validation annotations
│   ├── luvax/                 # Authenticated application shell and screens
│   │   ├── components/        # 18 files: shell.jsx, primitives.jsx, and one file per screen
│   │   ├── constants/
│   │   │   └── data.js        # Static mock data still used by story and profile screens
│   │   ├── hooks/             # useMediaUpload, useNotifications, usePosts, useRelativeTime,
│   │   │                      # useSocial, useUsers, useViewport
│   │   └── LuvaxApp.jsx       # Feature root; holds screen state for the single /app route
│   ├── messages/
│   │   ├── components/        # 7 files: panels, ConvRow, MessageBubble, AvatarVisual
│   │   └── data/
│   └── search/
│       └── components/
│           └── LxHeaderSearch.jsx
├── hooks/                     # Shared hooks: useCommon, useCountdown
├── pages/
│   ├── auth/
│   │   ├── EmailVerificationPage.jsx
│   │   ├── OAuthCallbackPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   └── VerifyEmailNoticePage.jsx
│   ├── dashboard/
│   ├── HomePage.jsx
│   └── LuvaxPage.jsx
├── routes/
│   └── index.jsx              # createBrowserRouter - central route tree
├── services/                  # Shared API modules used by the luvax feature
│   ├── axiosInstance.js       # Re-exports axiosClient
│   ├── notification.service.js
│   ├── post.service.js
│   ├── social.service.js
│   └── user.service.js
├── store/
│   └── useAuthStore.js        # Zustand; persists user + isAuthenticated only, never tokens
├── utils/
│   ├── cn.js
│   └── helpers.js             # extractPageContent, sharePost, copyPostLink, copyToClipboard
├── App.jsx
├── App.css
├── index.css                  # Tailwind v4 import + CSS custom properties
└── main.jsx                   # RouterProvider + QueryClientProvider + global error handling
```

---

## Module / Feature Organization Pattern

Feature-based ("vertical slice") under `src/features/`. Each feature owns its components,
hooks, services, and utilities. Shared cross-feature concerns live at the `src/` top-level
layers (`components/`, `hooks/`, `services/`, `store/`, `utils/`).

### Pattern for a feature slice:

```text
src/features/<feature>/
├── components/      # Page/form/UI components for this feature
├── hooks/           # TanStack Query hooks and feature orchestration
├── services/        # API calls; must use axiosClient or publicClient — no direct fetch/axios
├── store/           # Optional: local Zustand slice if feature outgrows global store
└── utils/           # Zod schemas, helpers specific to this feature
```

---

## Routing Setup

- Config-based routing using `createBrowserRouter` in `src/routes/index.jsx`
- `ProtectedRoute` (in `src/components/common/`) guards authenticated routes
- `GuestRoute` (in `src/components/common/`) redirects authenticated users away from login/register

Declared routes:

| Path | Guard | Notes |
|------|-------|-------|
| `/` | guest | Landing plus the unified auth page |
| `/login`, `/register`, `/forgot-password` | guest | All three render `AuthPage` in a different view |
| `/verify-email`, `/verify-email-notice`, `/reset-password` | none | Token-driven pages |
| `/oauth2/callback`, `/oauth/callback` | none | Google OAuth return |
| `/app` | protected | The entire authenticated application |
| `/dashboard` | protected | Stub |
| `*` | none | Not found |

**The whole authenticated application lives at the single `/app` route.**
`LuvaxApp` holds the current screen in component state and swaps screens internally, so moving
between feed, explore, profile, settings, and messages does not change the URL. No authenticated
screen can be linked to, bookmarked, or reloaded. Treat this as a known constraint rather than a
bug to fix incidentally.

---

## State Management

| Layer | Library | What lives here |
|-------|---------|-----------------|
| Server state | TanStack Query | API data, pagination, caching, mutations |
| Global client state | Zustand | Auth session (`useAuthStore`), cross-feature state |
| Feature-local state | React `useState` / `useReducer` | UI state local to one component/feature |

`useAuthStore` persistence:
- Persisted to `localStorage` under key `luvax-auth-session`
- Only `user` and `isAuthenticated` are persisted; `accessToken` and `refreshToken` are in-memory only

---

## API Client Setup

All BE API calls must go through `src/api/axiosClient.js`. Never call `fetch` or `axios.create`
directly in components or hooks.

| Client | When to use |
|--------|-------------|
| `axiosClient` | Authenticated requests; auto-injects `Authorization: Bearer <token>`, auto-refreshes on 401 |
| `publicClient` | Unauthenticated requests (login, register, forgot-password, OAuth exchange) |

Base URL: `VITE_API_URL` env var (falls back to `http://localhost:8080/api/v1`).
In dev mode (`import.meta.env.DEV`), Vite proxies `/api/v1` to the BE; `axiosClient` uses `/api/v1`.

---

## Environment Variable Prefix Convention

All FE environment variables must use the `VITE_` prefix (required by Vite for client-side access).

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | BE base URL (e.g., `http://localhost:8080/api/v1`) |
| `VITE_GOOGLE_AUTH_URL` | Google OAuth initiation endpoint on BE |
| `VITE_GOOGLE_REDIRECT_PATH` | FE route BE redirects back to after OAuth |
| `VITE_APP_NAME` | Application name displayed in UI |
| `VITE_APP_ENV` | Environment tag (development / production) |

Reference: `.env.example` at the repository root

---

## Key Scripts

```bash
npm run dev          # Vite dev server with proxy (scripts/dev-server.mjs)
npm run dev:reset    # Dev server with state reset
npm run build        # Vite production build
npm run lint         # ESLint
npm run preview      # Preview production build locally
```
