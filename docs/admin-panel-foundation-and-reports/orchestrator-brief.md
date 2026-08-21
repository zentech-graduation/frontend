# Orchestrator Brief

For the planner, who knows the product but has not seen this code.

## What was built

The moderation panel now exists as a real, role-aware surface.
A moderator signs in and lands on the panel, sees the reports awaiting review, opens one, sees the reported post, comment, or account, and closes it by resolving, dismissing, or escalating, or by removing the offending post or comment.
An administrator gets all of that plus an escalated queue, with a live badge, that a moderator cannot reach.
Under it sits the shared foundation every later phase will build on: role in the session, two role-gated route trees, a strict request contract, cursor pagination, error classification, the vocabulary cache, id-to-username resolution, the panel shell, and six derived UI patterns.
It was verified in a browser end to end, including the two-session and failure-branch cases.

## Architectural decisions, and the option rejected

- Role lives as a dedicated in-memory field on the existing auth store, set only from login and refresh, normalised to lowercase once, and never written to browser storage (it is even stripped from the persisted user object).
Rejected: deriving the routing role from the persisted user, which would have made a stored value the authorization source, against the settled position.
- The panel is one lazily loaded route subtree registered in the central router, gated inside the existing authentication guard by a panel-role guard, with a second guard for administrator-only screens.
Rejected: one tree with hidden controls, which the settled position forbids because a moderator typing an administrator URL must not reach a screen that then 403s.
- The reason-carrying confirmation is a dedicated component that deliberately quotes the shared confirm modal's arming delay and button vocabulary.
Rejected: extending the shared modal, which has no reason concept and no way to return a value, so extending it would have forked its behaviour without avoiding a new component.
- One status-badge vocabulary serves all four domains by lifecycle position; escalated and dismissed are given different tones (attention versus neutral) rather than a shared "negative" tone.
- The escalated-count poll and the whole administrator tree are gated on role so a moderator issues zero requests to administrator endpoints.

## Contract divergences found

Verified against the running backend and recorded in `report-contract-verification.md`.

- The report list is role-scoped: a moderator sees only pending and reviewing reports; an administrator sees all five statuses.
The handoff did not document this.
It is why the queue query key includes the role and why the escalated queue is administrator-only at the data layer, not only by guard.
- A moderator gets 404 on a resolved or dismissed report; an administrator reads it.
It is why the detail screen renders a 404 as a calm not-found and why the two-window conflict resolves calmly.
- A bare token-epoch increment invalidates the access token only; the client refreshes and stays signed in.
The redirect-to-login the handoff expected requires the refresh token to also be revoked.
The no-loop and single-refresh guarantees hold either way.

## Controls deferred, and why

- Warn the owner, on the report detail screen: needs the owner's role, which needs an administrator-only endpoint a moderator cannot call.
Deferred to the account phase, where the role is available. Nothing is rendered rather than a guess.
- The owner's violation history panel, on the report detail screen: depends on the violations screen, built next.
- A vocabulary-driven reason selector: the first surface that needs it is the warning form, next phase.

## Open questions for a human before the next phase

1. Story and message reports can be read but not actioned, because no remove or restore endpoint exists for them; the backend team owns whether to add one.
Options: (a) leave the panel read-only for these with its on-screen note, accepting that a reviewer cannot take down a reported story or message; (b) request a backend endpoint so the panel can remove them.
Recommendation: (a) for now, since the backend is frozen for the frontend phases, and raise (b) as a backend ticket.
2. Whether a moderator's report queue should hide the status filters it can never populate (resolved, dismissed, escalated all return empty for a moderator).
Options: (a) keep the full status set and let the empty state cover it; (b) scope the moderator's status filter to pending and reviewing.
Recommendation: (a), because the empty state is honest and the fixed schema set is simpler, but it is a product call.
3. Whether `escalated` and `dismissed` should share a badge tone.
This phase separated them (attention versus neutral); confirm that reads correctly to a moderator before four more status systems inherit it.
Recommendation: keep them separate.

## What could not be verified

The reduced-motion state could not be toggled through the available browser tooling; the mechanism was verified by inspection instead, and the panel adds no motion that bypasses the global reduced-motion rule.
A message-target report was not created (it needs conversation fixtures the panel does not build); a story target verified the same read-only branch.
