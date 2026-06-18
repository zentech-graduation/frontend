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
│   ├── axiosClient.js         # Axios instances + request/response interceptors; exports axiosClient, publicClient
│   └── authApi.js             # Auth-specific API calls using publicClient
├── assets/                    # Static assets imported from application code
│   └── hero.png
├── components/
│   ├── common/                # App-level reusable pieces
│   │   ├── AuthSessionBootstrap.jsx   # Bootstraps auth state on app mount
│   │   ├── ErrorBoundary.jsx          # React error boundary
│   │   ├── GuestRoute.jsx             # Redirects authenticated users away from guest-only routes
│   │   ├── NotFoundPage.jsx           # 404 page
│   │   ├── PageLoader.jsx             # Full-page loading spinner
│   │   ├── ProtectedRoute.jsx         # Redirects unauthenticated users to /login
│   │   └── RouterErrorPage.jsx        # Error fallback for router-level errors
│   └── ui/                    # shadcn/ui primitive components
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       └── label.jsx
├── config/
│   └── constants.js           # ROUTES, API_URL, STALE_TIME, HTTP_STATUS, APP_NAME
├── context/                   # Reserved — empty; use for React context providers when needed
├── features/
│   ├── auth/                  # Most complete feature slice
│   │   ├── components/
│   │   │   └── LoginPage.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js     # TanStack Query hooks: useLogin, useLogout, useCurrentUser
│   │   ├── index.js           # Public exports for the auth feature
│   │   ├── services/
│   │   │   └── authService.js # Auth endpoints using axiosClient / publicClient
│   │   ├── store/             # Reserved — use if auth state outgrows global store
│   │   └── utils/
│   │       └── authSchemas.js # Zod validation schemas for auth forms
│   ├── dashboard/
│   │   ├── components/
│   │   │   └── DashboardPage.jsx
│   │   └── index.js
│   └── luvax/                 # Main app shell feature (authenticated screens)
│       ├── components/        # Screen-level components: Feed, Explore, Profile, Story, etc.
│       ├── constants/         # Feature-local data and design tokens
│       ├── hooks/
│       │   └── useViewport.js
│       └── LuvaxApp.jsx       # Feature root — renders the main app shell
├── hooks/                     # Shared reusable hooks not tied to one feature
│   ├── useCommon.js
│   └── useCountdown.js
├── pages/                     # Route-level pages not yet moved into a feature module
│   ├── auth/
│   │   ├── EmailVerificationPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── OAuthCallbackPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── ResetPasswordPage.jsx
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   ├── HomePage.jsx
│   └── LuvaxPage.jsx
├── routes/
│   └── index.jsx              # createBrowserRouter — central route tree
├── services/
│   └── axiosInstance.js       # Re-exports axiosClient from src/api/axiosClient.js
├── store/
│   └── useAuthStore.js        # Persisted Zustand store: accessToken (in-memory), user, isAuthenticated
├── utils/
│   ├── cn.js                  # Tailwind class merge utility (clsx + tailwind-merge)
│   └── helpers.js
├── App.jsx
├── App.css
├── index.css                  # Tailwind v4 import + CSS variable design tokens
└── main.jsx                   # App bootstrap: RouterProvider + QueryClientProvider
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
- Auth routes handled at the `pages/auth/` layer; not yet fully wired in the router (scaffold state)

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

Reference: `app-fe/.env.example`

---

## Key Scripts

```bash
npm run dev          # Vite dev server with proxy (scripts/dev-server.mjs)
npm run dev:reset    # Dev server with state reset
npm run build        # Vite production build
npm run lint         # ESLint
npm run preview      # Preview production build locally
```
