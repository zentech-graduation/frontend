# Verification Evidence

Every check below was driven against the running application at `http://localhost:5173`
(backend `http://localhost:8080`), in a real browser through the Playwright plugin. Reasoning
is never counted as verification. Two browser contexts hold a moderator and an administrator
session where a check needs both.

Screenshots are under `screens/` and linked from the check they evidence.

---

## Section A — Carry-over corrections (Work Item 3)

### A.1 Reduced motion, exercised through Playwright media emulation

The previous phase listed reduced motion under "what could not be verified", stating the browser
tooling could not toggle it. That is false: Playwright emulates it directly.

**What was driven.** Signed in as the administrator, emulated the preference with
`page.emulateMedia({ reducedMotion: 'reduce' })`, then confirmed
`window.matchMedia('(prefers-reduced-motion: reduce)').matches === true`. Loaded the report
queue and a report detail under the preference.

**What was observed.**
- `matchMedia('(prefers-reduced-motion: reduce)').matches` → `true` (the emulation took).
- Computed `transition-duration` on `.lx-admin-navlink` → `1e-06s` (the global reduced-motion
  rule in `src/index.css` collapsed it; a `!important` stylesheet rule overrides even the
  inline-style transitions the panel uses).
- `document.querySelectorAll('*')` running animations under the preference → **0**.
- The report queue and the report detail both rendered correctly (no broken layout, no residual
  motion).
- Console during the checks: **0 errors, 0 warnings**.

**Conclusion.** The application already honours the preference through the universal
reduced-motion block at `src/index.css:594`, which neutralises every animation and transition,
inline styles included. The panel adds no motion that bypasses it. Nothing animated; nothing
needed fixing. The claim was removed from the previous phase's `orchestrator-brief.md`.

Evidence: `screens/reduced-motion-report-queue-desktop.png`,
`screens/reduced-motion-report-detail-desktop.png`.

### A.2 Other previously skipped-for-tooling checks

The only other limitation the previous phase's `deferred-findings.md` recorded under
"Verification limitations" is the message-target report, which was **not** skipped for lack of
tooling: it needs conversation and message fixtures the panel does not build, a data-fixture
limitation rather than a browser-tooling one. Playwright cannot conjure the fixtures either, so
this remains a data limitation, re-examined and left as-is. No previously tooling-blocked check
was found that the tooling could in fact have run, other than reduced motion (A.1).

---

## Section B — Violation history

_(added as the feature is built and driven; see below)_

---

## Section C — Warning issuance

_(added as the feature is built and driven)_

---

## Section D — Per-account content

_(added as the feature is built and driven)_

---

## Section E — Audit log and the detail drawer

_(added as the feature is built and driven)_

---

## Section F — Regression, craft, and failure branches

_(added as the feature is built and driven)_

---

## Section G — What could not be verified

_(populated at close-out; nothing appears here that the tooling could in fact have verified)_
