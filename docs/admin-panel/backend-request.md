# Backend Request — From the Admin and Moderator Panel

Every item the four panel phases deferred to the backend, collected in one place. They were
previously scattered across four `deferred-findings.md` files and nobody had gathered them.

Each item states **what the panel observed** and **what the frontend needs**. Nothing here proposes
an implementation, a schema, or a name for anything inside the server. Where a need has an obvious
workaround the panel already applies, that is said, so the priority is visible.

Written at the end of the panel effort. The panel ships complete and usable without any of these;
each one closes a gap a reviewer will eventually notice.

---

## 1. A reported story or message cannot be acted on

**Observed.** A report may name a story or a message as its target. The panel can read that target
and show it. There is no way to take it down or put it back — the only content actions that exist
apply to posts and comments. The panel therefore renders such a report read-only and tells the
reviewer plainly that the content cannot be taken down from the panel, so they stop hunting for a
button that is not there.

**Needed.** A way to remove and restore a reported story, and a reported message, equivalent in
shape to what already exists for posts and comments — including whatever the response carries for a
post, so the reviewer gets the same confirmation of what actually happened.

**Priority.** Highest of these items. A reviewer can currently close a report about a story or a
message only by resolving it, which records a decision while leaving the content up. That is the one
place in the panel where the record and the reality can disagree.

---

## 2. A revoked warning or strike disappears instead of staying visible and marked

**Observed.** Revoking a warning or a strike removes the record from the account's violation list
entirely. The list has no parameter that would include revoked records, so after a revocation the
account looks as though the discipline never happened. The decision survives only in the moderation
action log, as a separate row, in a different place, without the record it acted on.

**Needed.** A way to read an account's discipline history **including** records that have been
revoked, distinguishable from live ones, and carrying when and by whom each was revoked. The panel
would then show the full record in one place and mark the revoked entries, so the discipline history
can be audited where it is read rather than reconstructed from two screens.

---

## 3. An account's active warning count cannot be read before issuing a warning

**Observed.** Three active warnings automatically issue a strike, which suspends the account. A
reviewer about to issue a warning has no way to know whether this will be the third. No read exposes
the count: the violations list is a cursor page with no total and no count field, the account detail
does not carry it, and the reader's own warnings list is likewise a page with no total. The count
exists only on the **response** to issuing a warning, once it is too late to be a warning to the
reviewer.

The panel deliberately does not compute it from a partial page — that would fabricate a number — so
it states the static rule before the action and the honest count afterwards.

**Needed.** An account's current active warning count, readable before a warning is issued. It would
let the reviewer be told that the warning they are about to issue will suspend the account, before
they issue it.

---

## 4. Suspension with no end date cannot be offered

**Observed.** The suspension request treats the duration as optional, but the behaviour when it is
omitted has never been observed: the one attempt made during verification hit an already-suspended
target and returned a transition conflict, so the path is unsettled. Separately, an account **can**
end up suspended with no end date — the panel reads that state and renders it as "suspended
indefinitely" — so the state exists even though the panel cannot produce it.

Because the behaviour is unsettled, the panel treats the duration as required and bounded, which is
the safe reading and lets it show the resulting end time before the reviewer confirms.

**Needed.** A settled, documented answer for what an omitted duration does. If it means an
indefinite suspension, saying so lets the panel offer indefinite suspension as a deliberate choice
alongside a dated one. If it means something else, saying so lets the panel stop treating the field
as optional.

---

## 5. Sessions can only be ended all at once

**Observed.** An account's live sessions are readable — one entry per session, each carrying an
identifier, an optional device identifier, the user agent and client address recorded when the
session was issued, and its start and expiry. The panel lists them.

There is no way to end **one** of them. The only revocation that exists ends every session the
account holds; verified live, an account went from three live sessions to zero in a single action.
So the panel draws no per-session control — a control that cannot work is not worth drawing — and
offers only the account-wide action, named for what it actually does.

**Needed.** A way to end a single named session. The list already gives a reviewer everything needed
to decide that one session looks wrong and the others look fine; today the only available response
to that is to sign the person out everywhere.

**Also needed, smaller.** A session record cannot say which session belongs to the reviewer reading
it. On the reviewer's own account the panel has to warn that ending all sessions ends the current
one, without being able to point at which row that is. A marker for the calling session would let
the panel say which one.

---

## 6. A settings page returns not-found for accounts created by the seed script

**Observed and diagnosed this phase.** Signing in as any seed account and opening the user-facing
settings page produces two not-found responses on the settings read, plus a console error. The page
still renders, but it renders defaults rather than the account's real preferences, which is worse
than failing outright: a reader cannot tell that what they are looking at is not their settings.

**The cause is not in the frontend.** The frontend requests exactly the path the backend publishes,
with the right method and prefix. The read answers not-found when the account has no settings record,
and exactly the five seed accounts have none — 165 of 170 accounts have one, and the five that do
not are precisely those the seed script creates. The seed script creates accounts without one.

**Needed.** Either every account has a settings record from the moment it exists, or the read answers
with defaults instead of not-found. Which of the two is a backend decision; the frontend needs only
that opening the settings page on a valid account stops being an error.

**Note.** The backend repository carries an unmerged branch whose name suggests this is already
known. This item is recorded so it is not lost if that branch is not the fix.

---

## 7. The activity log's second writer never lands a row in a complete deployment

**Observed.** The behavioural event enumeration declares twenty types. The contract states three are
ever written, and the panel offers exactly those three as filters. But a **second** writer exists in
the source for four further engagement types, enabled in both the development and production
configurations.

Tested rather than assumed: an engagement event was produced, published, and consumed; the message
then dead-lettered without writing a row, because the consumer depends on a recommendation service
that is not part of this deployment. Across the life of this database only two of the twenty types
have ever produced a row.

**Needed.** A settled answer to whether those four engagement types are meant to reach the activity
log. If they are, the panel should widen the filter to seven and the consumer's dependency needs to
be part of the deployment. If they are not, the contract should say so, since it currently says three
while the source has a writer for seven. Either answer is fine; the panel needs to know which,
because offering a filter that can never match is the specific failure this project has already
settled once.

---

## 8. A repeated restore keeps reporting the same dropped hashtag

**Observed.** Restoring a post reports which of its hashtags stayed banned and were dropped. On the
first restore this was correct. On a second and a third restore of the same post, the same tag was
reported as dropped again, although the association had already been removed and the post no longer
carried it.

The panel reports exactly what it is given, so the message is not wrong so much as repetitive — the
tag is still refused, so naming it is arguably still useful.

**Needed.** Only clarity on which of the two this is: the set of tags dropped *by this action*, or
the set of tags in the post's text that remain banned. The panel words the message differently
depending on the answer. No change is needed if the current behaviour is intended.

---

## 9. Read surfaces the panel wanted and could not use

Grouped because each is small and none blocks anything.

- **No batch lookup from account identifier to name.** Queues, audit rows, violation rows, and
  activity rows all carry bare identifiers. The panel resolves them one at a time through a
  per-account read and caches the result, which is correct but costs one request per distinct
  account on a page. **Needed:** a way to resolve several identifiers to names in one request.
- **The moderation action log cannot be filtered by date or by target.** It accepts an actor and an
  action type only. An investigation that starts with "what happened last Tuesday" or "everything
  done to this account" cannot be expressed. **Needed:** a time bound and a target filter on that
  log.
- **A moderator has no list that surfaces a report it escalated.** After escalating, the report
  leaves every queue the moderator can read, though it stays readable by its address. The panel
  works around this by linking from the moderator's own action rows back to the report, which is
  possible only because those rows happen to carry the report's identifier. **Needed:** a way for a
  moderator to list the reports it has escalated.
- **Per-account content rows carry no media.** A post row carries its caption and a comment row its
  text; neither carries the images or video attached. A reviewer judging a reported post from the
  account content screen sees the words and not the picture. **Needed:** the attached media on those
  rows, or confirmation that judging content is meant to happen only on the report detail.
- **No count exists anywhere except escalated reports.** No list returns a total, so the panel
  cannot say how many accounts match a filter, how many warnings an account has, or how large a
  queue is. This is understood to be deliberate and the panel is built for it. Recorded only so the
  cost is visible: every "how many" question in the panel is currently unanswerable.

---

## 10. Contract and documentation divergences

Not defects, and not blocking. Recorded because each cost a phase time to discover, and because the
handoff is the document the next team will read.

- **The two statistics limits are different things and the handoff conflates them.** The window a
  series may span is **one year**. The **thirty-day** figure is the horizon beyond which fine
  buckets no longer exist, applied to the window's start against the present moment — so a
  one-hour window starting thirty-one days ago is refused at fine granularity while a year-long
  window starting today is accepted. The handoff reads as though thirty days is the window limit.
- **The stated rate limits do not match the configured ones.** The handoff and the phase prompts
  describe the statistics series and the activity log as allowing thirty requests a minute. The
  production configuration allows **twenty**. The panel is built to twenty. Development is looser
  than both, so a limit met in production would not be met while building.
- **The time to a first statistics bucket is longer than stated.** The handoff asks the empty state
  to say the first snapshot appears within thirty minutes of the server starting. The collection
  interval is thirty minutes *and* the partial bucket the process starts inside is discarded, so the
  worst case is just under an hour. The panel says within an hour.
- **A granularity is refused, not forced.** The handoff says an out-of-range window forces daily
  granularity. Requesting fine granularity over such a window is **refused**; the server resolves to
  daily only when no granularity was asked for. The panel prevents the refused combination in its
  controls, so the difference never reaches a reviewer.
- **The report queue is scoped by role, undocumented.** A moderator sees only pending and reviewing
  reports; an administrator sees all five statuses. The handoff's description of the escalated queue
  is true only for an administrator.
- **A closed report answers not-found to a moderator.** Once resolved or dismissed, a report the
  moderator could read becomes unreadable to it while remaining readable to an administrator. The
  panel treats it as a calm not-found.
- **Advancing an account's token epoch alone does not end its session.** The refresh path is not
  epoch-gated, so a client refreshes and the session heals itself. Ending a session requires the
  refresh tokens to be revoked as well, which the force-logout action does. Section 15's fourth
  check reads as though the epoch bump alone is sufficient.
- **Creating a hashtag answers 201 while the role matrix says 200.** The endpoint's own
  documentation is right; the summary table is not.
- **The strict-parameter rule is not applied to the report endpoints.** It applies to the
  administrative tree only. The panel sends only declared keys everywhere regardless.
- **Four report reasons carry an empty applies-to list while the others enumerate entity types.**
  Whether empty means "all" or "none" is unsettled, so the panel does not filter the reason list by
  entity type. **Needed:** an answer, if that filtering is ever wanted.
