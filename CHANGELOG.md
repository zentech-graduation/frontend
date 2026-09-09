# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
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
- A hashtag result in search and explore now opens that hashtag's page instead of running a caption text search for its name, which returned unrelated posts or nothing at all.
- The preview server proxies the API, so a production build can be exercised against a local backend.

### Fixed
- Signing in from a production build now works regardless of the API host's CORS configuration, and a deployed session can refresh itself: every request is sent to a same-origin path instead of an absolute cross-origin address, which previously meant the sign-in request could be refused by the server's CORS filter before authentication ran, and the refresh cookie was withheld by the browser wherever the API is a different site from the application.
- The settings sub-navigation is no longer covered by the expanded navigation rail, which had made the left half of every entry unclickable from the moment settings was opened, because opening it from the rail is what expands the rail.
- The share control on a post now has an accessible name, so it can be reached by assistive technology and announced as something other than an unlabelled button.
- The tablet shell no longer overflows the viewport at 768 pixels wide, where the reading column previously started off-screen and the right rail extended past the right edge.
- The tablet right spacer now matches the left one, so the reading column is centred rather than sitting left of centre.
- Layout decisions that depend on the viewport width now update when the window is resized within one breakpoint.
