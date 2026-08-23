# Develop Stabilisation

## Outcome in one line

The realtime work was found intact on an unmerged, local-only branch.
It was pushed so it no longer lives on one machine.
**It was not merged into `develop`, because the merge conflicts, and this task forbids resolving a conflict by editing source.**

## 1. The state before

### Checked out

`feat/common/design-conformance-stage-3`.

### `git status`

```
On branch feat/common/design-conformance-stage-3
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/video-test/

nothing added to commit but untracked files present
```

No uncommitted modification.
No stash (`git stash list` was empty).
One untracked directory, `docs/video-test/`, which holds sample video files used by earlier verification work.

### Local branches

| Branch | HEAD | Date | Subject |
|--------|------|------|---------|
| `feat/common/design-conformance-stage-3` | `1fd49e8` | 2026-08-14 | docs(common): record the third conformance stage |
| `feat/post/composer-rework` | `2462fd9` | 2026-08-14 | docs(common): record the composer rework and its verification |
| `feat/post/design-conformance-feed-profile` | `92ef781` | 2026-08-13 | docs(common): record the stage 2 conformance work |
| `develop` | `c04cdd6` | 2026-08-13 | chore(common): merge stage 1 design conformance |
| `feat/common/design-conformance-shell` | `3753720` | 2026-08-13 | docs(common): record the tablet underline correction |
| `feat/comment/realtime-and-verification-gaps` | `c2b99c7` | 2026-08-13 | docs(common): record the realtime client work |
| `feat/social/profile-tabs-and-social-states` | `fbce7e0` | 2026-08-13 | docs(common): record the profile tabs and social states work |
| `feat/post/search-saved-and-profile-tabs` | `e639d12` | 2026-08-12 | docs(common): record the search saved and profile tab work |
| `feat/common/adopt-backend-capabilities` | `bb54dab` | 2026-08-12 | docs(common): record the backend capability adoption |
| `feat/report/report-content-and-accounts` | `8caf2e2` | 2026-08-12 | docs(common): record the reporting work |
| `main` | `e806363` | 2026-07-10 | Merge branch 'develop' |

Older branches (`fix/ci/...`, `refactor/common/url-routing`, `fix/common/response-shape-and-session`, `feat/comment/comment-interactions`, `fix/common/backend-contract-alignment`, `chore/common/full-stack-reconnaissance`, `refactor/common/structural-cleanup`, `fix/common/security-hardening-and-bug-fixes`, `feat/auth/unified-auth-page`, `feat/messages-nav-ui`) are all already merged into `develop`.

### Local `develop` was ahead of the remote

`develop` was 8 commits ahead of `origin/develop` and 0 behind.

### Branches not merged into `develop`

| Branch | merge-base | Commits it has that develop lacks | Commits develop has that it lacks |
|--------|-----------|-----------------------------------|-----------------------------------|
| `feat/comment/realtime-and-verification-gaps` | `4d551ad` (2026-08-09) | 20 | 21 |
| `feat/social/profile-tabs-and-social-states` | `4d551ad` | 13 | 21 |
| `feat/post/search-saved-and-profile-tabs` | `4d551ad` | 6 | 21 |
| `feat/common/design-conformance-stage-3` | `c04cdd6` | 22 | 0 |
| `feat/post/composer-rework` | `c04cdd6` | 17 | 0 |
| `feat/post/design-conformance-feed-profile` | `c04cdd6` | 10 | 0 |
| `main` | `393084c` (2026-07-03) | 1 | 94 |

`main` is the production branch and is not a candidate for merging into `develop`.

### The two lineages

Confirmed with `git merge-base --is-ancestor`.
Each lineage is a straight chain in which the tip contains everything before it.

**Lineage A**, cut from `4d551ad`:

```
search-saved-and-profile-tabs (6)
  -> profile-tabs-and-social-states (13, contains search-saved)
    -> realtime-and-verification-gaps (20, contains social-states)
```

**Lineage B**, cut from `c04cdd6`, the current `develop` tip:

```
design-conformance-feed-profile (10)
  -> composer-rework (17, contains feed-profile)
    -> design-conformance-stage-3 (22, contains composer-rework)
```

Merging each lineage's tip therefore brings the whole chain.

## 2. The direct answer

**Case 1: the work exists on a branch that was never merged into `develop`.**

It was never removed.
`git log --all --diff-filter=D` over `src/services/realtime/`, `src/features/luvax/hooks/useLivePostUpdates.js`, and `docs/realtime/` returns nothing.
There is no revert and no bad merge resolution, because there was no merge.

The work is on `feat/comment/realtime-and-verification-gaps`, and before this task it existed on **no remote branch at all**.

### Supporting commits

Found by content with `git log --all -S`, not by filename.

| Commit | Date | Files |
|--------|------|-------|
| `9ab4911` chore(common): add stomp and sockjs client dependencies | 2026-08-13 | `package.json`, `package-lock.json`, `vite.config.js` |
| `45cee47` feat(comment): add a shared stomp connection | 2026-08-13 | `src/services/realtime/stompConnection.js`, 264 lines added |
| `51ee74f` feat(comment): apply live events to the open post | 2026-08-13 | `src/features/luvax/hooks/useLivePostUpdates.js` 354 lines, `PostDetailScreen.jsx`, `usePosts.js` |
| `be1a42b` docs(common): record the verified realtime contract | 2026-08-13 | `docs/realtime/realtime-contract.md`, 222 lines |
| `c2b99c7` docs(common): record the realtime client work | 2026-08-13 | five `docs/realtime/` documents plus `CHANGELOG.md` |

Every one of these reports `in develop? NO` and `contained in remote branches: (none)`.

At the branch tip the tree contains:

```
docs/realtime/README.md
docs/realtime/changes-applied.md
docs/realtime/deferred-findings.md
docs/realtime/design-decisions.md
docs/realtime/realtime-contract.md
docs/realtime/verification-evidence.md
docs/realtime/verification-gaps-closed.md
src/features/luvax/hooks/useLivePostUpdates.js
src/services/realtime/stompConnection.js
```

### Why the earlier search found nothing

The stage 3 search ran `grep -rn "WebSocket\|SockJS\|stomp\|EventSource" src/` while standing on `feat/common/design-conformance-stage-3`.

That branch belongs to Lineage B, which was cut from `develop` at `c04cdd6`.
The realtime work is in Lineage A and has never been an ancestor of `develop`, so it could not appear in that working tree.

The grep result was correct for the tree it ran in.
The conclusion drawn from it, that no realtime code existed in the frontend, was wrong, because the search was never widened past one branch.
The accurate statement would have been "not on this branch".

Both claims in the mission are therefore true of different trees, which is exactly what the contradiction was.

## 3. A second finding: duplicated work

Lineage A already contains the profile tab work that stage 3 built again from scratch.

| Lineage A commit | Stage 3 commit |
|------------------|----------------|
| `f56bcaf` feat(post): add liked posts and a profile post type filter | `1351e71` feat(post): filter the profile grid by the selected tab |
| `1b77be9` feat(social): add photos and liked tabs, private states and profile block | same |

Both implement a liked-posts list and a server-side profile type filter, and both touch `ProfileScreen.jsx`, `usePosts.js`, and `post.service.js`.

Stage 3 recorded the photos tab as not filtering.
That was true of its own branch and false of the repository, for the same reason as the realtime finding.

This duplication is a direct cause of the merge conflict below.

## 4. What was merged or restored

**Nothing was merged.**

The merge of Lineage A into `develop` was attempted and conflicts.

```
$ git merge --no-ff feat/comment/realtime-and-verification-gaps
Auto-merging CHANGELOG.md
CONFLICT (content): Merge conflict in CHANGELOG.md
Auto-merging src/features/luvax/components/PostDetailScreen.jsx
CONFLICT (content): Merge conflict in src/features/luvax/components/PostDetailScreen.jsx
Auto-merging src/features/luvax/components/ProfileScreen.jsx
CONFLICT (content): Merge conflict in src/features/luvax/components/ProfileScreen.jsx
Auto-merging src/features/luvax/components/shell.jsx
CONFLICT (content): Merge conflict in src/features/luvax/components/shell.jsx
Automatic merge failed; fix conflicts and then commit the result.
```

| File | Conflict hunks |
|------|----------------|
| `src/features/luvax/components/ProfileScreen.jsx` | 5 |
| `src/features/luvax/components/shell.jsx` | 2 |
| `src/features/luvax/components/PostDetailScreen.jsx` | 1 |
| `CHANGELOG.md` | 1 |

These are genuine semantic conflicts, not whitespace.
Two examples:

`PostDetailScreen.jsx` - both sides edited the same import line.
`develop` added `useCommentDeletionScope`; the branch added `useLivePostUpdates`.
The correct resolution needs both, and choosing either side alone silently drops a feature.

`shell.jsx` - `develop` has the stage 1 conformance treatment of the tab button, while the branch has a disabled-state treatment for out-of-scope modules plus the removal of the fabricated trending rail.
These are different designs for the same element.

**The task forbids resolving a conflict by editing source, and requires stopping and reporting instead.**
The merge was therefore aborted with `git merge --abort`, which cancels an in-progress merge without rewriting history or discarding any commit.
`develop` is back at `c04cdd6` with a clean tree.

Had it merged, the order would have been Lineage A first and Lineage B second, because Lineage A is older, larger, and had no remote copy, so it carried the most risk.

## 5. Verification of the restoration

**Not performed, because nothing was restored into `develop`.**

Section 4.3 asks for the build to succeed, the realtime source to be present in the working tree, both applications to be started, the client to be seen connecting, and a comment created elsewhere to arrive without a refresh.

None of that was done, and none of it should be reported as done.

What is established is narrower and is stated exactly:

- The realtime source files exist at the tip of `feat/comment/realtime-and-verification-gaps`, confirmed with `git ls-tree`.
- `docs/realtime/` exists there, with seven documents.
- **Whether the realtime client actually connects and delivers a live comment was not tested in this task.**

The distinction the mission draws, between a file existing and a feature working, is preserved here rather than glossed.
The branch's own `docs/realtime/verification-evidence.md` claims a verified connection and a recovery through a backend restart, but that claim was made by the phase that wrote it and has not been re-checked by this task.

## 6. Sweep for anything else stranded

Every documentation set was checked against `develop`.

### Doc sets present in `develop`, with a code spot check

| Doc set | Claim checked | Result |
|---------|---------------|--------|
| `reporting/` | `ReportModal` reason list | present |
| `reporting/` | report service entity types | present |
| `comment-interactions/` | comment idempotency key | present |
| `comment-interactions/` | comment deletion scope query | present |
| `url-routing/` | route helpers | present |
| `response-shape-and-session/` | `extractPageContent` | present |
| `backend-capability-adoption/` | `hasReported` on the post card | present |
| `design-conformance-stage-1/` | display font token | present |

Also present in `develop`: `reconnaissance/`, `backend-contract-alignment/`, `design-conformance/`, `design/`.

**No doc set in `develop` describes code that is missing from `develop`.**

### Doc sets not in `develop` at all

| Doc set | Where it lives |
|---------|----------------|
| `realtime/` | `feat/comment/realtime-and-verification-gaps` |
| `search-saved-and-tabs/` | same branch |
| `social-states-and-tabs/` | same branch |
| `design-conformance-stage-2/` | `feat/common/design-conformance-stage-3` |
| `composer-rework/` | same branch |
| `design-conformance-stage-3/` | same branch |

Six phases of documented work sit outside `develop`, together with the code they describe.
Nothing is half-present: in every case the documents and their code are stranded together on the same branch, which is consistent with a merge that never happened rather than with a bad merge.

## 7. Final state

### Pushed

All nine local-only branches were pushed to `origin`, each creating a new remote branch.

```
feat/comment/realtime-and-verification-gaps
feat/common/adopt-backend-capabilities
feat/common/design-conformance-shell
feat/common/design-conformance-stage-3
feat/post/composer-rework
feat/post/design-conformance-feed-profile
feat/post/search-saved-and-profile-tabs
feat/report/report-content-and-accounts
feat/social/profile-tabs-and-social-states
```

The realtime work no longer exists on a single machine, which was the most urgent risk in the situation as found.

`develop` was pushed as a fast-forward:

```
bb4996c..c04cdd6  develop -> develop
```

No force push was used at any point, no history was rewritten, and no branch was deleted.

### Local and remote agree

```
$ git rev-parse develop origin/develop
c04cdd64107215d0025c3549fe3e2ef3058554af
c04cdd64107215d0025c3549fe3e2ef3058554af

$ git rev-list --left-right --count develop...origin/develop
0	0
```

### `git status`, frontend

```
On branch develop
Your branch is up to date with 'origin/develop'.

Untracked files:
	docs/video-test/

nothing added to commit but untracked files present
```

### `git status`, backend

The backend was not modified.
The only command run against it was `git status`, which is the read-only inspection this task permits.

```
$ git status
On branch develop
Your branch is up to date with 'origin/develop'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   Makefile
```

The staged `Makefile` predates this work and every phase before it.

## 8. What still needs a decision

`develop` does not yet contain the realtime client, and cannot until the conflict is resolved.

The conflict is not incidental.
It exists because two lineages independently implemented overlapping features, most visibly the profile tabs, and because both edited the same shell and post detail code from a common ancestor 21 commits back.

Resolving it requires deciding, per hunk, which of two deliberate implementations survives.
That is a judgement about the product, not a mechanical merge, and this task explicitly reserves it.

The large piece of work queued behind this should not start until that decision is made, because `develop` currently lacks the realtime client, the saved and search screens, the social states, the composer rework, and two conformance stages.
