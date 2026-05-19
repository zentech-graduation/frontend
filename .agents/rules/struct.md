---
trigger: always_on
description: Load when working on app-fe (social network). Contains the authoritative project map.
---

# Project Structure

## Overview

This project is a React single-page application built with Vite.

Core stack:
- React 19
- React Router 7 data router
- TanStack Query for server state and async caching
- Zustand with `persist` middleware for auth/session state
- Axios for HTTP requests
- Tailwind CSS v4
- shadcn/ui component scaffolding with Radix primitives
- React Hook Form + Zod for forms and validation

Current architecture direction:
- Feature-based organization under `src/features`
- Shared app shell, routes, services, stores, hooks, and utilities under `src/*`
- Shared UI primitives under `src/components/ui`
- Layout-driven routing with route guards available through common components

Current maturity:
- The repository is still a scaffold/starter state
- `auth` is the most developed feature slice
- `dashboard` and several shared folders exist as extension points
- Some folders currently contain placeholders only

## Root Map

```text
.
├── .agents/                 # Project-specific agent rules and local skills
├── .github/                 # GitHub workflows and repo automation
├── public/                  # Static assets served as-is by Vite
├── src/                     # Application source code
├── AGENTS.md                # Entry instruction telling agents to read .agents/
├── package.json             # Dependencies, scripts, and toolchain definition
├── vite.config.js           # Vite config with React, Tailwind v4, and @ alias
├── components.json          # shadcn/ui configuration and path aliases
└── struct.md                # This architecture and folder reference
```

## Source Map

```text
src/
├── assets/                  # Static assets imported from application code
├── components/              # Shared presentational and routing-support components
│   ├── common/              # App-level reusable pieces such as route guards / shared pages
│   └── ui/                  # shadcn/ui primitive components
├── config/                  # Global constants and app-wide configuration values
├── context/                 # Reserved for React context providers when needed
├── features/                # Feature-first modules; business logic should grow here
│   ├── auth/                # Authentication feature slice
│   │   ├── components/      # Auth-specific UI such as login page/form
│   │   ├── hooks/           # Auth TanStack Query hooks and feature orchestration
│   │   ├── services/        # Auth API calls built on the shared Axios client
│   │   ├── store/           # Reserved for auth-local state if global store becomes too broad
│   │   └── utils/           # Auth validation schemas and feature helpers
│   └── dashboard/           # Dashboard feature slice
│       └── components/      # Dashboard page-level UI
├── hooks/                   # Shared reusable hooks not tied to one feature
├── layouts/                 # Route layout shells such as app shell and auth shell
├── pages/                   # Route-level pages not yet moved into a feature module
├── routes/                  # Central React Router configuration
├── services/                # Shared API infrastructure and cross-feature service utilities
├── stores/                  # Global Zustand stores
└── utils/                   # Generic helpers such as class merging and common utilities
```

## Important Files

These files matter disproportionately for orientation and should be checked first in a new session:

```text
src/
├── main.jsx                 # App bootstrap; mounts RouterProvider and QueryClientProvider
├── index.css                # Tailwind v4 import plus design tokens/theme variables
├── routes/
│   └── index.jsx            # Central route tree built with createBrowserRouter
├── layouts/
│   ├── MainLayout.jsx       # Primary app shell wrapping routed content
│   └── AuthLayout.jsx       # Centered auth shell for login/register flows
├── services/
│   └── axiosInstance.js     # Shared Axios client and interceptor entrypoint
├── stores/
│   └── authStore.js         # Persisted global auth/session store
├── config/
│   └── constants.js         # Route constants, API URL, and shared app constants
└── features/
    └── auth/
        ├── hooks/useAuth.js         # Login/logout/current-user query hooks
        ├── services/authService.js  # Auth endpoints
        ├── utils/authSchemas.js     # Zod validation schemas
        └── components/LoginForm.jsx # Best current example of app form patterns
```

## Architecture Notes

### Routing
- Routing is centralized in `src/routes/index.jsx`
- `MainLayout` is the root layout shell
- `AuthLayout` exists for auth routes but is not yet wired into the router
- `ProtectedRoute` exists in `src/components/common` for guarding authenticated routes

### State Management
- Server state uses TanStack Query, initialized in `src/main.jsx`
- Global client state uses Zustand
- Auth state is persisted to `localStorage` through `src/stores/authStore.js`

### API Layer
- All HTTP calls should flow through `src/services/axiosInstance.js`
- Feature-specific API wrappers belong in `src/features/<feature>/services`
- Auth interceptor and global error handling are scaffolded but not fully implemented yet

### UI System
- Tailwind CSS v4 is configured through `@tailwindcss/vite`
- `src/index.css` defines CSS variable-based design tokens
- shadcn/ui is configured through `components.json`
- Shared primitives live in `src/components/ui`

### Feature Strategy
- Business features should prefer `src/features/<feature>` as the default home
- Shared cross-feature logic belongs in `components`, `hooks`, `services`, `stores`, or `utils`
- `src/pages` currently contains generic route pages/stubs and may shrink as features mature

## Folder Intent By Area

### `src/features/auth`
Most complete slice in the project. Demonstrates the intended vertical pattern:
- page/form components
- feature hooks wrapping TanStack Query
- feature service layer wrapping Axios
- feature-local validation schemas
- optional local store space if the slice outgrows pure shared/global state

### `src/features/dashboard`
Currently a simple page slice. It indicates that authenticated product areas are expected to become independent feature modules over time.

### `src/components`
Reserved for reusable building blocks that should not belong to exactly one feature:
- `ui/` for low-level design-system primitives
- `common/` for route guards and reusable shared pages/components

### `src/services` and `src/stores`
These are app-wide integration layers:
- `services/` for shared API clients and cross-feature infrastructure
- `stores/` for global Zustand stores that multiple features consume

### `src/config`, `src/hooks`, `src/utils`
These support the rest of the app:
- `config/` for constants and environment-driven values
- `hooks/` for reusable hooks
- `utils/` for framework-agnostic helpers

## Current Gaps

These are useful to know before extending the project:
- Router currently exposes only the home page and 404 fallback
- Auth screens/components exist, but auth routes are not yet connected
- `context/` is empty and reserved for future provider-based state
- Some pages/components are duplicated in scaffold form and may need consolidation later
- The app uses plain JavaScript, not TypeScript
