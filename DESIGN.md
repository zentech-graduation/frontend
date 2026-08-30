# Design System

This file describes the design system as it exists in the code.
Every value below was read from `src/index.css`, `src/config/tokens.js` or `src/features/admin/components/panelStyles.js` rather than from an earlier draft of this document.
Where the implementation diverges from an ideal, the divergence is recorded as a divergence.

---

## 1. Token System

Tokens are CSS custom properties on `:root` in `src/index.css`.
They are mirrored as a plain JavaScript object, `v`, in `src/config/tokens.js`, because large parts of the panel and the application shell style with inline objects rather than classes and need the same values in JavaScript.

The mirror is maintained by hand.
A token added to `index.css` and not to `tokens.js` is invisible to every inline style, which is the failure mode to watch for.

### Colour

Colour tokens are the only tokens that change between themes.
Spacing, radius, typography and motion are theme-independent.

| Group | Tokens |
|-------|--------|
| Surface | `--lx-base`, `--lx-surface`, `--lx-surface-raised`, `--lx-surface-sunken` |
| Ink | `--lx-ink`, `--lx-ink-2`, `--lx-ink-3`, `--lx-ink-inverse` |
| Border | `--lx-border`, `--lx-border-strong`, `--lx-border-subtle` |
| Accent | `--lx-accent`, `--lx-accent-dark`, `--lx-accent-dim`, `--lx-accent-text` |
| Semantic | `--lx-error`, `--lx-success`, `--lx-warning`, each with a `-dim` fill and a `-text` foreground |
| Utility | `--lx-white-*` and `--lx-black-*` alpha ramps, `--lx-glass-*`, `--lx-scrim` |

### Light palette

| Token | Value |
|-------|-------|
| `--lx-base` | `#F9F7F4` |
| `--lx-surface` | `#F0EDE8` |
| `--lx-surface-raised` | `#E8E3DC` |
| `--lx-surface-sunken` | `#EAE6E0` |
| `--lx-ink` | `#1A1816` |
| `--lx-ink-2` | `#574F47` |
| `--lx-ink-3` | `#9B9088` |
| `--lx-border` | `#DDD7CF` |
| `--lx-border-strong` | `#C4BCB2` |
| `--lx-accent` | `#C8A97E` |
| `--lx-accent-text` | `#7A5C34` |
| `--lx-error` | `#C47168` |
| `--lx-success` | `#7A9E7A` |
| `--lx-warning` | `#C4A85A` |

### Dark palette

Dark mode is driven by `html[data-theme="dark"]`, set by an explicit toggle.
It deliberately does **not** follow `prefers-color-scheme`: the theme is a choice the user makes and it persists, rather than changing under them when the operating system does.

| Token | Value |
|-------|-------|
| `--lx-base` | `#1A1816` |
| `--lx-surface` | `#25211D` |
| `--lx-surface-raised` | `#2F2A25` |
| `--lx-surface-sunken` | `#1F1C19` |
| `--lx-ink` | `#F0EDE8` |
| `--lx-ink-2` | `#B5ACA3` |
| `--lx-ink-3` | `#7A7268` |
| `--lx-border` | `#3A342E` |
| `--lx-border-strong` | `#4A433B` |

The dark palette is a warm inversion rather than a neutral grey ramp: the base is the light theme's ink, and the ink is the light theme's surface.
That is what keeps the accent legible without a second accent value.

---

## 2. Typography

Four families are loaded from Google Fonts in a single `@import` at the top of `index.css`.

| Token | Family | Used for |
|-------|--------|----------|
| `--font-display` | Syne | Headings and the brand mark |
| `--font-body` | DM Sans | Body text, controls, everything by default |
| `--font-mono` | DM Mono | Panel labels, identifiers, timestamps, code |
| (unnamed) | Instrument Serif, Inter | Loaded but not bound to a token |

There is **no type scale token set**.
Font sizes are literal pixel values at the point of use.
The panel converges on a small vocabulary in practice - 11px for uppercase mono labels, 12px for body and controls, 13px for reading text, 16px for a detail heading, 22px for a page title - but nothing enforces it.

Uppercase mono labels carry `letter-spacing: 0.06em`.
This is the panel's most recognisable typographic signature and is applied by hand at each site.

---

## 3. Spacing, Radius, Shadow and Motion

| Scale | Values |
|-------|--------|
| Spacing | `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-6` 24px, `--space-8` 32px, `--space-12` 48px, `--space-16` 64px |
| Radius | `--radius-sm` 4px, `--radius-md` 8px, `--radius-lg` 12px, `--radius-xl` 16px, `--radius-pill` 999px |
| Shadow | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, all warm-tinted from the ink colour rather than pure black |

The scale skips 5, 7, 9, 10 and 11 on purpose: a gap you have to reach for is a gap you have to justify.

### Motion

| Token | Value |
|-------|-------|
| `--duration-fast` | taps and hovers |
| `--duration-normal` | overlays, menus, toasts, the carousel |
| `--duration-slow` | the bottom sheet |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)`, decelerating, for entry |
| `--ease-in` | accelerating, for exit |

One vocabulary for the whole application, so every surface enters and leaves with the same feel.
A global `prefers-reduced-motion` rule in `index.css` neutralises transitions that use these tokens, which is why a hand-rolled duration is a bug rather than a style: it escapes that rule.

---

## 4. Primitive Inventory

Everything is hand-rolled. There is no table library, no chart library, no rich-text editor, no date library, no icon package and no virtualisation.

### Shared primitives, `src/components/ui/`

| Primitive | Notes |
|-----------|-------|
| `button.jsx` | shadcn-style variants |
| `card.jsx`, `input.jsx`, `label.jsx` | shadcn scaffolds |
| `lx-avatar.jsx` | Deterministic colour from one of seven `--lx-avatar-*` tokens |
| `lx-icon.jsx` | Inline SVG sprite, no icon package |
| `lx-dropdown-menu.jsx` | Radix primitive |
| `lx-toggle.jsx` | The switch used throughout settings |

Two Radix packages are the only component dependencies.

### Panel components, `src/features/admin/components/`

| Component | Notes |
|-----------|-------|
| `RecordTable` | Hand-rolled table with keyboard-operable rows |
| `LoadMore` | Keyset only. No list endpoint returns a total, so numbered pagination cannot exist |
| `ListStates` | `EmptyState`, `LoadingState`, `FailedState` |
| `SplitView` | List beside detail; moves focus to the detail region on selection |
| `FilterBar` | Tag-style filter groups |
| `AccountSearchPicker` | Debounced account lookup with a cooldown |
| `DateRangeControl`, `LocalTime` | Native inputs; `LocalTime` names the timezone |
| `ReasonConfirmDialog` | The reason-capturing confirm used by every moderation action |

### Help centre, `src/features/support/components/`

`SupportLayout` frames the six help centre screens and carries `SUPPORT_CSS` inline, the same way the panel carries `panelStyles`.
It is deliberately independent of both the panel shell and the authenticated chrome, because three of its screens are anonymous and are reached by an account that cannot sign in.

---

## 5. Layout Systems

### The panel

`panelStyles.js` is a single exported template string, injected by `AdminShell`.
No `lx-admin` selector exists in `index.css`; the panel's CSS lives entirely in that file.

The shell is a fixed 232px navigation rail beside a content column.
Two vocabularies are held there deliberately:

- **Controls.** One shape for anything clickable: a pill at `--radius-pill`, a 1px `--lx-border`, 12px/500 body type, and a control height around 28-30px. Native selects, native date inputs and the panel's own buttons are all brought onto that shape, so a control never looks foreign beside the one next to it.
- **Muted text.** `--lx-ink-3` measures about 2.8:1 on the light base and 3.6:1 on the dark one, below the 4.5:1 this surface is held to. Every label the panel treats as readable content uses `--lx-ink-2` instead. This is a recorded divergence from the design export, not an oversight; `--lx-ink-3` remains in use for genuinely decorative marks.

### Breakpoints

Three, all in `panelStyles.js`:

| Width | Change |
|-------|--------|
| 1100px | Split view collapses to a single column |
| 860px | Navigation rail becomes a horizontal bar at the top |
| 560px | Densest layout |

The panel is desktop-first. Below 860px the rail becomes a top bar rather than adopting the user-facing application's bottom navigation, so the two surfaces stay visibly distinct.

The help centre and the two new panel screens are **desktop only** by decision. They do not regress the three breakpoints above, but they were not designed for them.

---

## 6. Tables and Charts

**Tables** are `RecordTable`, hand-rolled. Columns are declared as `{ key, header, render }`. Rows are keyboard-operable and clicking one opens the detail region.

**Pagination** is keyset only, through `LoadMore`. No list endpoint returns a total count, so numbered pagination is not merely absent - it is not expressible.

**Charts** are hand-rolled inline SVG in the statistics screen. There is no chart library. `platform_stats` is never seeded, so that screen has no series until the collection job has run; an empty statistics screen in development is expected and is not a defect.

---

## 7. Accessibility - conventions in use, and the gaps

In use:

- Every interactive element has a visible focus ring, at `2px` in `--lx-accent` with `1px` offset.
- `SplitView` moves focus to the detail region when a record opens and scrolls it to its own top, so opening a second record does not leave focus on the row.
- Filter groups are wrapped in `role="group"` with `aria-labelledby` pointing at their label.
- Form controls are associated with their labels by `htmlFor` and `id` throughout.
- `prefers-reduced-motion` is honoured globally for any transition using the motion tokens.
- The theme toggle is explicit rather than following the system, so a user's choice is not overridden.

### Known gaps

These are gaps, recorded as gaps. None is fixed by this document.

- **`<th>` carries no `scope`.** `RecordTable` renders header cells without `scope="col"`, so a screen reader cannot reliably associate a data cell with its column.
- **`RecordTable` sets `role="button"` on `<tr>`.** That overrides the native row semantics entirely: the row stops being announced as a table row, and the table stops being navigable as a table. It buys keyboard operability at the cost of the structure that made the table worth using.
- **No `<caption>` and no table label.** Nothing names what a given table contains.
- **Exactly one live region in the whole panel.** Almost every asynchronous outcome - a claim collision, a save failure, a rate-limited refusal - changes the screen without announcing anything.

The first three are all in `RecordTable`, so a single component carries most of the table accessibility debt.

---

## 8. Conventions

- **Plain JavaScript.** No TypeScript. Data shapes are validated at runtime with Zod; `src/features/auth/utils/authSchemas.js` is the canonical example and `src/features/support/utils/supportSchemas.js` follows it.
- **Feature-first.** A feature never imports from another feature. Shared code moves to `src/components/`, `src/hooks/`, `src/utils/` or `src/services/` first. `src/utils/requestContract.js` was extracted for exactly this reason when the help centre needed the panel's declared-key helpers.
- **Colour only through tokens.** No raw hex in feature code. Spacing and radius use the scale variables; literal pixel values appear only for typography and for one-off geometry.
- **Routes are central.** Every route is declared in `src/routes/index.jsx` using a constant from `src/config/constants.js`.
- **Server state is TanStack Query.** Zustand holds the auth session and cross-feature client state only. Tokens are never persisted.
