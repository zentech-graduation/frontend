# Contributing

## Ways to contribute

- Report bugs with the GitHub bug report template.
- Propose features or UX improvements with the feature request template.
- Open pull requests for code, documentation, or tooling changes.

## Project setup

**Prerequisites**

- Current Node.js LTS
- npm

**Install dependencies**

```bash
npm install
```

**Start the development server**

```bash
npm run dev
```

The app runs through Vite. By default it expects the API at `VITE_API_URL`, falling back to `http://localhost:8080/api/v1`.

## Branch naming

Use:

```text
<type>/<scope>/<short-description>
```

Examples:

```text
feat/auth/add-login-validation
fix/routes/redirect-after-logout
chore/build/update-vite-config
```

Recommended scopes for this repository:

- `app`
- `auth`
- `dashboard`
- `routes`
- `layouts`
- `pages`
- `ui`
- `hooks`
- `services`
- `stores`
- `config`
- `assets`
- `build`
- `deps`
- `docs`
- `ci`

## Commit and PR titles

Follow Conventional Commits:

```text
<type>(<scope>): <description>
```

Allowed types:

- `feat`
- `fix`
- `refactor`
- `test`
- `chore`
- `docs`
- `perf`
- `ci`

PR titles are linted by `.github/workflows/pr-lint.yml`, so use the same format there.

Examples:

```text
feat(auth): add persisted login session
fix(ui): prevent button overflow in auth form
chore(deps): update react-query packages
```

## Before opening a pull request

Run the project checks locally:

```bash
npm run lint
npm run build
```

If your change affects API integration, verify the relevant flow against the configured backend as well.

## Pull request process

1. Create a branch that follows the naming convention above.
2. Keep the PR focused enough to review comfortably.
3. Run `npm run lint` and `npm run build`.
4. Fill out the pull request template.
5. Open the PR against `main` using a Conventional Commit title.
6. Wait for CI and required review approval before merging.

## Code expectations

- Follow the existing feature-based structure under `src/`.
- Reuse shared UI primitives from `src/components/ui/` before adding new component patterns.
- Keep route definitions centralized in `src/routes/index.jsx` unless the routing structure is intentionally refactored.
- Put API calls behind service modules instead of scattering `axios` calls in components.
- Keep environment-specific values behind `import.meta.env`.

## Testing

There is currently no dedicated automated test suite configured in this repository. Until one is added, `npm run lint` and `npm run build` are the required baseline checks for every PR.

## Security issues

Do not open public issues for vulnerabilities. Use the process in [SECURITY.md](SECURITY.md).
