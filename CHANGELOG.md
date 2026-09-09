# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- A help centre at `/app/support` where an account can open a support request, appeal a decision, or request a verified badge, and read the reply to any of them.
- Three anonymous support routes: the appeal form reached from a moderation notice, the email confirmation landing, and a public form behind a Turnstile challenge.
- A staff support console under moderation, with the queue, ticket detail, claiming, responding, escalating and internal notes.
- A verified badge beside a username on every surface that shows one: post headers, comments and replies, profile headers, profile list rows, search results, suggestions, direct messages, story headers and notifications.
- Eight verification categories, each with its own glyph inside the badge, so the mark says what an account is verified for and not only that it is.
- A verification request form in settings, with its submitted and decided states, that counts the evidence fields as they are filled and states the three-field minimum before submission rather than refusing afterwards.
- A verification review queue in the moderation panel, reachable by moderators as well as administrators, showing every evidence field and every badge the account previously held.
- People you may know in the right rail, with follow, a keyboard-reachable dismiss control, pending state for a private account, and skeleton loading.
- A settings toggle to stop the account being offered in other people's suggestions.
- Hashtag detail page at `/app/tags/:name`, with a shareable `/tags/:name` deep link that redirects to it.
- Trending hashtags in the right rail, with a personalised tab and a platform tab and a marker on pinned hashtags.
- Hashtag suggestions in the composer before any text is typed, replaced by live search results as soon as a `#` token is being written.
- Hashtag tokens inside post captions are now links to that hashtag's page.

### Changed
- Verification is requested and reviewed through the help centre and the support console rather than on screens of their own.
- Trending hashtags and people you may know are shown on explore below the width where the right rail is dropped, so neither feature is absent on a phone.
- A hashtag result in search and explore now opens that hashtag's page instead of running a caption text search for its name, which returned unrelated posts or nothing at all.
- The preview server proxies the API, so a production build can be exercised against a local backend.

### Fixed
- The right rail no longer renders its last row underneath the fixed messages launcher, which made that row's controls unclickable at some viewport heights.
- Explore no longer scrolls sideways at desktop widths where its wider centre column did not fit beside the rail.
- Signing in from a production build now works regardless of the API host's CORS configuration, and a deployed session can refresh itself: every request is sent to a same-origin path instead of an absolute cross-origin address, which previously meant the sign-in request could be refused by the server's CORS filter before authentication ran, and the refresh cookie was withheld by the browser wherever the API is a different site from the application.
- The settings sub-navigation is no longer covered by the expanded navigation rail, which had made the left half of every entry unclickable from the moment settings was opened, because opening it from the rail is what expands the rail.
- The share control on a post now has an accessible name, so it can be reached by assistive technology and announced as something other than an unlabelled button.
- The tablet shell no longer overflows the viewport at 768 pixels wide, where the reading column previously started off-screen and the right rail extended past the right edge.
- The tablet right spacer now matches the left one, so the reading column is centred rather than sitting left of centre.
- Layout decisions that depend on the viewport width now update when the window is resized within one breakpoint.

### Removed
- The standalone verification queue screen, whose function moved into the support console.

### Tests
- Unit coverage for the support request schemas, the declared-key request contracts, the ticket lifecycle helpers, and the console's role gating.
