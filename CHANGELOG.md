# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- An administrator-only mail campaign composer with read-only samples, a Markdown editor, and a preview rendered by the backend so it cannot drift from the mail that is actually sent.

### Added
- A staff support queue in the panel, where a request can be claimed, answered, closed or escalated, and where a moderator is shown plainly that only an administrator can decide an appeal.

### Added
- A help centre where an account can raise a support request and read the reply, with the one-open-request state shown as a first-class screen rather than as a rejected submit.
- An appeal page reached from the link in a moderation email, which works while signed out and banned and never asks for a session.
- A public support form for anyone who cannot sign in, gated by a verification challenge and an email confirmation step, so nothing reaches staff until the address is proved.

### Fixed
- Removing content from the account view now says plainly that it closes no report about that content, which was already true but silent, so a moderator no longer believes the queue has been cleared when it has not.

### Added
- Posts on Home, Explore, and Search's pre-query grid are now reported as read once they have been at least half visible for a second, so the recommendation feed stops repeating what a viewer has already seen.
- Home now offers a for-you tab backed by the personalized recommendation feed, alongside the existing following tab, defaulting to for-you so a new account with no follows still sees content.
- Settings is now a list of groups beside the setting you are changing: choosing one swaps only the region next to it, so settings can be browsed instead of opened one at a time and backed out of.
- Every settings category has its own address, so one can be linked and reloaded, and the back button moves between categories rather than out of settings.
- Settings now shows the account's own standing: whether it is verified, whether it is private, when it was created, and any warning a moderator has issued against it, with the reason and the moderator's own note.
- Settings now lists the people waiting to follow you, with approve and decline, on the same screen as the rest of your audience settings.
- The profile link field can now be edited; it is accepted by the server and was previously not offered anywhere.
- Changing a password is now offered where it belongs, as a reset link sent to the account's own address, which is the only way the server supports it.
- Moderators and administrators can now reach the panel at phone width, from a control beside the settings control on their own profile, where previously the only entry point was the desktop navigation rail.
- Each distinct way a Google sign-in can fail now has its own page saying what happened in ordinary language and offering a way onward, instead of one page printing the raw reason with nothing to press.

### Changed
- Explore now shows real personalized, follow-excluded recommendations instead of a placeholder message.
- Search shows the same recommended content as Explore before a query is typed, instead of a generic prompt.
- Each setting in the list now carries an icon, and the list can be searched by name.
- The setting you have open is centred in the space beside the list instead of sitting against its left edge, so a wide screen no longer leaves all the empty space on one side.
- The settings list sits directly beside the navigation rail, so hovering the rail opens it over the list rather than over empty space.
- The open setting is marked by a lighter row and a heavier name instead of a coloured rule down its edge, and hovering lifts a row slightly.
- What a setting is for is now written at the top of that setting rather than under its name in the list, so the list reads as a list of names.
- Cancelling a Google sign-in reads as a choice rather than an error, with no warning treatment and no error code.
- Sign-in, sign-up, email verification and password reset now say what went wrong in the application's own words instead of repeating the server's message; a suspended account and a wrong password are each named specifically.
- An expired email verification link now says that links expire and can only be used once, with the resend button beneath it, instead of stating an error under a heading still telling you to check your inbox.
- Profile fields are edited where they are shown, and a save that the server refuses keeps what was typed and says why against the field that caused it.
- The navigation rail opens on keyboard focus as well as on hover, so the labels naming its destinations are no longer reachable only with a mouse.
- Switches now report themselves as switches, with their state and a name, and carry a visible outline so they can be seen against the page in the dark theme.

### Removed
- The settings screen no longer offers account deletion, story-view notifications, a help centre, terms, or an about page: none of them did anything, and the server has nothing behind any of them.
- The verified mark beside the email address is gone; it appeared whether or not anything was verified. The account's verified state is now stated plainly.
- The theme control has moved off the settings screen, which is otherwise entirely backed by stored settings; the theme remains a per-device preference and still works where it already did.

### Fixed
- Home's inactive tab no longer fetches on page load; it now fetches only once selected, and keeps its result cached after that.
- Switches are centred in their track again; the knob sat a pixel out of true on whichever side it had travelled to.
- The rule between the settings list and the setting itself now runs the full height of the screen instead of stopping where the shorter column's content ended.
- Opening the profile editor no longer shows an empty biography to someone who has one.
- A settings screen at a narrow width no longer shows its title twice.
- Moderators and administrators reach the panel from a navigation entry in the application, directly above settings, and return to the application from the panel header; ordinary accounts never see it.
- The panel has a theme control of its own, so dark and light can be chosen without leaving it.
- Media in the panel opens into a full viewer with forward and back navigation across the media attached to that record, closed with Escape and moved through with the arrow keys.
- A reported story or message can now be taken down and put back, with the same recorded-reason confirmation used for posts and comments, available to moderators as well as administrators.
- Moderators and administrators get a "my escalations" screen listing the reports they escalated together with what became of each one, including reports an administrator has since closed.
- An account's sessions can now be ended one at a time, leaving every other session signed in, and the row for the session the reader is currently using is marked.
- The violations list can now include revoked warnings and strikes, off by default, each marked as revoked with who revoked it and when.
- The moderation action log can now be filtered by the account that was acted on and by a time window, both of which narrow what the caller can already see rather than widening it.
- An account can now be suspended indefinitely, with no end date, as an explicit choice alongside a dated suspension.
- Post rows now show the media attached to them.
- The warning form now shows how many warnings an account already carries and, when the warning being issued is the third, states that it issues a strike and what that strike does to the account.
- Administrators get a statistics screen showing the platform's stored snapshot, labelled as of the time it was collected rather than as live, and a chart of any of the fourteen metrics over a date range they choose.
- The statistics screen tells apart three things a chart usually blurs: a period in which nothing was ever collected, a period that was measured and counted zero, and a missing measurement inside an otherwise complete series, which is drawn as a marked break rather than a line through it.
- Administrators get an activity log showing what one account, or every account, has been doing, over a required date window of up to thirty days, filterable to the three kinds of activity the application records.
- An account now lists the sessions it is signed in on, showing the device description and network address exactly as they were recorded, with the account-wide sign-out beside them because sessions cannot be ended individually.
- An account now lists the reports filed against it, each opening the report it names, where previously only a count was shown.
- Administrators can find any account from a new accounts screen, filtering by status and role and searching by name, and open an account to see its state and act on it.
- From an account, administrators can ban, unban, suspend for a set number of days, lift a suspension, change role, and force every session to sign out, with each control shown only when the server permits it for that account and a mandatory recorded reason; suspending shows the resulting end time in local time before confirming.
- Promoting an account to administrator is marked as a one-way action that cannot be undone, with its own confirmation wording, and an administrator can never act on their own account except to sign their own sessions out.
- Administrators can manage the hashtag vocabulary from a new registry screen: list and search hashtags, create one, ban or unban it, and delete it, with the ban and delete confirmations stating what happens to posts that carry the tag.
- The moderation action log can now be filtered by which administrator or moderator took the action, chosen through account search.
- The panel now shows an account's discipline history — its warnings, and strikes for an administrator — reached from an account view and shown on the report detail, so a reviewer can see whether an account has been actioned before.
- Moderators and administrators can issue a formal warning against an account, choosing a reason from the report-reason list and recording a note; administrators can also revoke a warning or strike.
- The panel now lists everything an account has posted or commented, as posts and comments tabs on one screen, with removed items visibly marked and the same remove/restore controls used elsewhere.
- A moderation action log reads back what was done, by whom, and why: a moderator sees its own actions and an administrator sees all, and opening an action shows its full detail, including a link back to the report it came from where one exists.
- An administrative and moderation panel at /admin where moderators and administrators review reported content, with a filterable report queue, a report detail that shows the reported post, comment, or account, and actions to mark a report reviewing, escalate, resolve, dismiss, or remove and restore content, each behind a confirmation that records a reason.
- Administrators get an escalated-report queue with a live count that moderators cannot reach.

### Changed
- The reports and accounts screens show the list and the selected record side by side, so moving between records no longer means navigating back to the list; the record keeps its own address, every address that worked before still works, and at a narrow width the two collapse to one screen at a time.
- Panel screens use the full width of the window instead of stopping short of it.
- Every select and date control in the panel now matches the buttons beside it in height, shape, border, focus and disabled treatment.
- Filter conditions are each shown in their own labelled group with real separation, wrapping onto the next line rather than compressing, with a clear control set apart from them.
- Muted text throughout the panel moved to the readable secondary ink and small labels moved up one step on the type scale, bringing every text role above the accessible contrast threshold in both themes.
- Status badges carry their colour in the fill and border with the label in ordinary ink, which makes every status readable in the light theme.
- Account names throughout the panel are now resolved in a single request per page instead of one request per person, cutting a page of twenty action-log rows from five identifier requests to one.
- The message shown after restoring a post now describes the post's present state — the banned hashtags its caption still carries — so restoring the same post twice reads as correct rather than as a repeated action.
- Restoring a story or a message now states what the action does and does not do before it is confirmed: a story past its expiry stays out of every feed, and a message the sender also deleted stays hidden from both participants.
- The activity log's event-type filter now offers what the current environment actually records: seven kinds in development, three in production, because four of them depend on a service no production deployment runs.
- The date-range control now states that the start of a window is included and the end is not.
- Issuing a warning that triggers an automatic strike now names what happened to the account, not just that a strike was applied.
- Revoking a warning or strike from a suspended or banned account now states in the confirmation that the account's status is unchanged, so a reviewer cannot mistake it for a restoration.
- Banning a hashtag now says first that no existing post is taken down, so a reviewer does not ban a tag believing the content it appears on has gone.
- The report queue's status filter now offers moderators only "pending" and "reviewing", since a moderator's queue never contains a report in any other status.
- After signing in, moderators and administrators now land on the panel while everyone else lands on the application.
- Extracted the username and display-name validation rules shared by registration and profile editing into a common module, so both stay in sync with the backend by construction instead of by convention.

### Added
- The chat info panel now has a "set nickname / report / block / delete chat" action list at the bottom, matching what was already available from the conversation list's "..." menu.
- The conversation list's "..." menu now shows a dividing line between everyday actions and destructive ones (report, block, delete).
- The message lightbox now crossfades between photos and videos when stepping through a multi-item album instead of cutting to the next one instantly.
- Settings now shows a dividing line between your normal preferences and the sign-out/delete-account actions below them.

### Removed
- The descriptive subtitle line under a panel screen's title is gone; where it named which record was open (an account, a report), that identity now sits in the title itself instead of a separate line.

### Fixed
- The reports and accounts split screens no longer carry a doubled gap along their outer top and left edges. The list and detail panes already inset themselves; the surrounding content wrapper was adding its own padding on top of that instead of stepping aside for them.
- The audit log's date-range controls (from, to, apply, window length) are inset from the card edge to match the filter rows above them and the same control on the statistics screen, instead of sitting nearly flush against the border.
- A chosen dark or light theme is applied correctly on load. The stored choice was read as though the flag recording that a choice existed were the choice itself, so every manual selection resolved to light: the application briefly showed the wrong theme before correcting itself, and the panel, which has nothing to correct it, stayed light permanently.
- Primary buttons no longer render a near-white label on the light accent fill, which was unreadable in the light theme.
- Selecting an option in the panel's action-type filter shows a focus outline again when reached from the keyboard.
- Filter options are no longer clipped out of reach at narrow widths.
- The empty right region on a split screen with nothing selected is now framed like every other panel surface instead of floating as bare, unbordered space beside the list.
- A loaded marker message in an open conversation no longer disappears when the other participant
  sends enough new messages to push it out of the newest history page during a live refresh.
- Message threads now clear the blocked-user composer hint after an unblock from another surface,
  so mutual block/unblock flows no longer leave one side seeing a stale chat block state.
- Message threads now re-check a stored "messaging unavailable" hint when the conversation becomes
  active again, clearing stale blocked-by hints after the other person unblocks the viewer.
- Follow request actions now use the request's requester id, so private-account owners can accept
  or decline pending requests even when the embedded follower summary is incomplete.
- Follow-request notifications now only show accept and decline actions while the request is still
  pending, preventing old notifications from submitting stale request ids.
- Live follow-request notifications now refresh the pending request cache too, so accept and
  decline actions appear without reloading the notifications screen.
- User follow buttons now sync back to refreshed relationship state, so a pending private-account
  request changes to following after the request owner approves it.
- Story captions, post comments, message replies, bios, and long direct-message text now wrap inside their containers instead of overflowing the UI.
- Direct-message reply and draft state now stays scoped to the active conversation, so switching threads clears the old reply target while preserving each thread's unsent text.
- Direct messages now support pasted image attachments and expose the same hover actions for media messages as text messages, including delete and copy-image actions where available.
- Blocked users now show the correct blocked/unblock state and hint from profiles and messages, even after navigating away and returning.
- Search now returns matching people as well as posts from the shared search bar.
- Moderation notifications now explain removed, restored, and dismissed report outcomes with distinct text instead of showing the same removal wording for every decision.
- A date-range preset no longer leaves behind a message asking for a start and an end while a range is applied and results are showing.
- An account suspended without an end date now reads as "suspended indefinitely" in the panel, where the suspension previously showed nothing at all and the account appeared not to be suspended.
- The panel no longer offers a warning against an account that cannot receive one, such as a moderator or an administrator, explaining instead why the action is unavailable.
- Date ranges in the panel are now held to the limit of the screen they belong to rather than a single shared limit, and a range that has to be shortened to fit says so instead of changing silently.
- The bio field on the edit-profile screen now allows the full 500 characters the server accepts, instead of cutting off at 160.
- The message nickname prompt and a post's comment length limit now read from the same shared constant the rest of the app uses, instead of separate hardcoded numbers that happened to match it.
- A conversation row's content no longer sits shifted toward the top of the row with empty space below it.
- Hovering the side rail and moving down to click a lower tab no longer occasionally collapses the rail out from under the cursor before the click lands.
- Photos and videos opened from a chat no longer render larger than the screen and get cut off. The app's UI-scale setting was inflating anything sized in viewport units past the visible screen.
- A multi-photo album you send now lines up on your own side of the conversation instead of always sitting flush against the left edge.
- Pages other than messages no longer become spuriously scrollable, which was also the root cause of the side rail seeming to glitch or get pushed down after hovering it and moving toward a lower tab.

### Changed
- Editing your profile now validates the display name, username, and bio against the same rules the server enforces before saving, and points out which field needs fixing instead of only reporting a server error after the fact.
- The chat info panel's header now reads "Mute notification" with a toggle switch instead of a plain "chat info" title, and the divider between the avatar and the shared-media section is gone for a more seamless look. Scrolling the panel now only scrolls the shared-media list; the header and action list stay in place.
- Side rail icons are slightly larger and now sit centered in the collapsed rail instead of a little left of center.
- Consecutive messages from the same person now read as one continuous shape: the outer end of a run of bubbles stays rounded while the corners facing a neighboring message in the run flatten, instead of every bubble having identical rounded corners.
- The "pin chat" icon is now a thumbtack instead of a map-marker shape.

### Security
- Patched high-severity advisories in the routing, HTTP client, and build tooling dependencies. The routing advisories included an open redirect reachable from ordinary link and navigation handling.
- The real-time connection now authenticates with a single-use ticket instead of carrying the access token in the address, which kept a valid credential in server access logs long after it expired.

### Fixed
- Sending several photos or videos with a caption in one go now sends them in the order they were picked, with the caption always landing last. The upload for each attachment was awaited but the send itself was not, so the requests raced each other over the network and could land in any order, including the caption arriving in the middle of the photos.
- The messages screen no longer shows two independent vertical scrollbars. The app's root zoom scale was inflating a `100vh`-based height past the real viewport, which grew the whole page under the screen's own internally-scrolling panel.
- "Report" in a conversation's menu is now shown in red like "Delete" and "Block", instead of reading as a neutral action.
- "Mark as unread" now has a visible effect even when you sent the conversation's own newest messages, and a chat you marked unread now correctly offers "Mark as read" the next time you open its menu.
- The message composer's attach and send buttons now stay pinned to the bottom of the input as it grows with a longer draft, instead of drifting toward the middle of the pill.
- Hovering a chat bubble to reveal reply/copy/delete now responds to a hover anywhere near the message, not only a precise hover on the bubble's own pixels.
- The options menu on someone else's profile now opens where its button is instead of off-screen. A `transform` on the button row broke the menu's fixed-position math once the app's root zoom multiplied the offset a second time.
- Opening a conversation's info panel no longer fails. The shared-media grid now shows the real attachments from the history loaded so far, and says so when there are none.
- A group conversation's header no longer renders its member count as though it were a username handle.
- Screens no longer call viewport and message-draft hooks conditionally. React identifies hooks by call order, so the previous arrangement could bind state to the wrong value once a screen was rendered both with and without a viewport prop, or once a message thread was opened and closed.
- The search field and the explore search field now settle on the address bar's terms in a single render instead of showing the previous terms briefly first.
- Lint no longer scans the build dependency cache, so it reports only real findings and finishes in seconds rather than minutes.
- Corrected the session store's documentation, which stated that reloading the page ends the session. It does not: the session is restored from the refresh cookie on load.

### Removed
- The copy telling reviewers that a reported story or message could not be taken down from the panel, which is no longer true.
- The static "three active warnings issue a strike" statement, replaced by the account's real count wherever it can be read.
- Group conversations. Messaging is one to one.
- The floating "message" button on desktop and tablet, now redundant with the always-visible side rail's own message icon.
- The separate "compose" flow (the messages list's pencil button and its person-search picker) and the top bar's mobile "new message" button. Starting a conversation now happens from a person's profile only; nothing is created until you actually send something.
- The top bar on desktop and tablet. It fully duplicated the side rail's own navigation, search, and profile links.

### Changed
- The chat info panel (participant details, shared media) is now hidden by default on every viewport and opens as an overlay from the info button, instead of permanently occupying a column of the messages screen.
- Photo and video messages render as a plain thumbnail with no card border or rounding around it, and open in a borderless full-screen viewer that closes on a click outside the media instead of a close button.
- Chat timestamps are now separator rows between clusters of messages instead of text under every bubble, matching how Instagram groups a burst of messages by time.
- The messaging screen (bubbles, avatars, icons, and list rows) is noticeably smaller and denser; it no longer reads as oversized on a wide display.
- The side rail is the only navigation on desktop and tablet now, and stays on screen at all times; mobile keeps a minimal top bar for back navigation, the page title, and notifications. Side rail and bottom nav icons highlight on hover.
- The message composer's attachment, text field, and send buttons are now the same height and vertically aligned, and the send button dims until there is a message to send. Its placeholder reads "Message..." instead of "say something real...".
- New messages now appear below older ones instead of above them, so a conversation reads top to bottom.
- Vertical spacing between message bubbles is tighter.
- Two or more photos or videos sent close together by the same person now group into one album tile - up to four visible, a "+N" overlay for more - instead of a stack of separate bubbles. Opening any tile steps through the rest of the album with next/previous, the same way the post viewer does.
- A single photo or video message keeps its own aspect ratio inside a capped box instead of being cropped to a fixed square. Video and GIF messages show a duration badge and a play icon rather than playing inline in the thread.
- Application screens and the signed-in shell are now downloaded on demand. A visitor on the sign-in page no longer downloads the composer, story viewer, and message pane before the form is usable; the initial download is roughly a third smaller.

### Tests
- The panel's record selection is covered by unit tests, including a link naming a record the list no longer contains.
- Continuous integration now runs lint and unit tests in addition to the build.

### Added
- A conversation can now be pinned to the top of your list, muted, or given a private nickname that only you see, all from the same "..." menu.
- Every conversation now has a "..." menu: mark as read or unread, delete the chat from your own inbox, report the other person, or block them.
- Chat now stages picked images and videos as a removable preview strip before sending, and lets you attach several files plus a caption in one send.
- A "message" button now sits next to "follow" on everyone else's profile, opening a direct conversation with them.
- Chat now supports sending images, videos, and GIFs from the attachment button, and shows the real image or video inline instead of a generic file icon.
- Chat bubbles now show the other person's avatar and collapse the timestamp across a run of messages sent within ten minutes of each other, instead of stamping every single bubble.
- Messages now opens with the people you and they follow each other with, each one ready to write to and greeted by "You're now friends. Say hi!" until somebody says something.
- Direct messages are real. The conversation list, message history, sending, and deleting now read and write actual conversations instead of a fixed demo set.
- A message can hold up to 10 attachments; picking more, or a file the server would reject, is stopped before upload with an explanation instead of failing later.
- Unread counts per conversation and on the shell's message badge, cleared when you open the conversation.
- Group conversations: see who is in a group, rename it, add people by searching for them, remove a member, and leave. Renaming, adding, and removing are offered only to group admins, matching what the server allows.
- New messages appear while a conversation is open, without a refresh.
- Attachments on a message are shown with the message rather than as a generic "sent an attachment" line.
- Unit test coverage for the session store, the token refresh queue, and the route guards.
- A live API test suite that verifies the backend contract against a running stack, including the real sign-up and email verification path.
- A development-only warning when real-time updates fail to connect repeatedly, so a misconfigured endpoint is visible during integration instead of failing silently.
- On desktop and tablet, scrolling down reveals a slim icon rail on the left for quick navigation - home, message, new post, search, notifications, and your profile (shown as your own avatar) - with a settings shortcut at the bottom, mirroring when the top bar hides itself. Hovering the rail expands it and reveals a text label next to each icon.
- On desktop and tablet, a subtle "message" button with a send icon sits fixed in the bottom-right corner and stays in place regardless of scroll direction, taking you straight to your messages; it's hidden while you're already there.

### Changed
- The privacy and notifications settings are now real: private account, activity status, story replies, message requests, and each notification type save to your account instead of being fixed "coming soon" toggles. "Notify me about story views" has no setting to bind to yet and stays a placeholder.
- Stories are now real: the home rail, "your story," and the story viewer read and write actual story data instead of a fixed demo set. Creating a story uploads a real photo or video and an optional caption, exactly like a post; there is no text-only story, since the platform doesn't support one.
- The story viewer now has visible previous/next buttons, alongside the existing tap zones, so you can move through a person's stories - and straight into the next person's - without closing and reopening the viewer.
- On desktop, the story viewer shows the previous and next story as dimmed previews beside the main one, so its neighbours are visible without stepping through them.
- You can like a story from the heart in the viewer, which bumps the same way a post's like does; on mobile, double-tapping the story also likes it and pops a heart over the media, matching double-tap on a post.
- You can reply to a story from the viewer. The reply is delivered as a direct message to the story's author, carrying the story it answers, the way Instagram does it.
- Clicking outside the story card - anywhere on the dimmed backdrop - closes the story viewer, the same as the close button.
- Clicking a notification about a comment now opens the post it belongs to and scrolls to that comment, flashing it briefly, instead of opening the notifier's profile.
- You can set a profile banner (cover image) from the edit screen, uploaded from your device or pasted as a URL and cleared the same way as the avatar; it shows across the top of your profile.
- You can upload a profile avatar from your device, not only paste an image URL.
- Clicking a hashtag opens the tag search and searches for it immediately.
- On mobile, double-tapping a post's media likes it.
- A video now autoplays, muted, when it scrolls into view and pauses when it leaves; you unmute it yourself and that choice is kept.

### Changed
- The order of the main navigation icons is now home, message, new post, search, and notifications on every screen size.
- Moving between stories now crossfades the media instead of cutting straight to the next photo or frame.
- The "new post" screen has a more inviting, less utilitarian layout: a larger add-media area, your real name and avatar, and a single hashtag indicator instead of two that said almost the same thing. What you can upload and how captions and hashtags work has not changed.
- The post popup is a contained, responsive size: its media fills the pane to every edge with no letterbox in any orientation, sits centred in its column, and the popup reads as a long panel short of full screen so comments have room to read even under a wide landscape image.
- The post popup's author and caption area is more compact with its divider lines removed, so more comments are visible while the comment box keeps its size.
- The comment box grows with your text up to three lines and then scrolls, and long comments wrap instead of running off the edge.
- The story rail is wider than the post column, its avatars are slightly smaller, and the row is centred.
- A post now leads with the uploader's avatar, name, and time, followed by the media, then the caption and actions.
- Post media fills its frame with no side gaps, keeping the whole image without cropping.
- The interface and the post popup now scale up on 2K and larger screens instead of feeling small.
- The story rail has larger avatars and more height.
- Followers and following open in a pop-up on the profile instead of a separate page, and rapid follow taps no longer desync.
- The profile tabs now read photos, posts, liked.
- Comments use spacing instead of lines to separate threads: wider space between top-level comments, replies kept tight.
- On mobile, posts sit closer together, a single tap does nothing, and the comment control opens the post.
- The navigation bar stays visible on the messages screen.

### Fixed
- Opening a post no longer snaps the top bar back into view when it was already tucked away from scrolling.
- Scrolling quickly no longer makes the top bar and its side rail flicker back and forth.
- The story viewer's next/previous buttons and side previews now line up with the card itself, instead of sitting visibly off-centre against it.
- Your own avatar now shows consistently in the top bar and the comment box, matching your profile, instead of appearing as a blank placeholder in some places.
- The profile "liked" tab now updates immediately when you like or unlike a post, instead of only after a page reload.
- Carousel navigation controls are lighter and clearly legible over dark images, and moving between carousel images now slides smoothly instead of switching abruptly.
- In the post popup, clicking any avatar or username - the poster, a commenter, a replier, or a nested replier - now opens that person's profile.
- Text inputs now stop at the server's maximum length - comments, captions, display name, username, bio, report details, messages, and search - instead of accepting unlimited input.
- A banded, curved smear no longer appears at the bottom of the feed and post screens; each post no longer leaves a hidden bottom sheet mounted, so dozens of stacked panel shadows can no longer bleed into the viewport.
- A long, unbroken comment now wraps inside the comment column instead of overflowing past its edge.
- Clicking a notification no longer errors: it opens the post for a post notification and the person's profile otherwise.
- Unfollowing now asks for confirmation, with the action shown in red.
- A signed-in user who opens an unknown address stays in the app with the nav bar and a notice, then returns to their feed, instead of being sent to the login page.

### Added
- The story rail is back at the top of the feed, with its viewer, restored as an interface.
- The messaging section is back, restored as an interface with its conversation list, thread, and info panel.
- Replying to a reply now prepends an editable @mention of the person answered, who is notified.

### Changed
- A post opened as a portrait image now shapes its popup to the image's aspect ratio instead of sitting in a wide dark pane; a landscape image keeps the roomier frame.
- The comment field now shows your own avatar while you type.
- The header search now opens the explore search, so the navigation bar no longer disappears on a results page, and the bar stays visible across the list and results subpages.
- Nested replies are now two levels, like Instagram, marked by a single vertical line rather than a diagonal staircase.

### Removed
- The notification bell beside the profile avatar, which duplicated the navigation's own activity tab.

### Fixed
- The three-dot options menu on a post or comment now opens on its button instead of drifting away from it.
- Clickable elements show the hand cursor again as a signal that they can be clicked.
- Posting a single reply no longer sometimes registers as two.

### Changed
- The feed is now one centred column instead of two posts side by side, with no dividing lines, no card behind each post, and no border down the column; posts are told apart by the space between them alone.
- The whole app is larger and easier to read, grown at the root so every proportion holds, and post captions are larger again on top of that.
- Opening a post now darkens the feed behind it more strongly, so the post holds attention without hiding its surroundings entirely.
- Notifications are now grouped by date and each row shows the icon and colour for its own type, instead of collapsing every type into two.
- Search now shows every matching person rather than only the first, and pressing Enter in the explore search commits the query so it can be shared and survives a reload.
- Two parallel lines of development were reconciled into develop, bringing search and saved posts, social states and profile tabs, and the realtime client together with the design conformance and composer work, and every capability from both lines was re-verified in the running application afterward.

### Added
- A media post opened on a wide screen now shows the media on the left and the comments on the right, with the media staying put while the comments scroll; a text post stays one column and a narrow screen stacks them.
- Motion was added across overlays, menus, the carousel, toasts, likes, content loading, and screen changes, sharing one set of durations and easings, and all of it turns off when the reader asks for reduced motion.
- A toast now confirms actions whose result is not otherwise on screen: copying a link, deleting a post, and blocking someone from a post's menu.
- Explore now shows a search empty state, and a deliberate placeholder for trending while its ranking is still being built, rather than blank space.

### Fixed
- A pending follow request to a private account now reads "requested" in search results, instead of still offering "follow".
- The post detail overlay now closes when you press Escape.
- The report modal's completion step now animates in with a confirmation mark, and its character counter warns as the limit approaches instead of never.
- Empty-state lines and the post overflow menu now follow the design's capitalisation consistently.

### Fixed
- Liking or saving a post now updates every place that post is showing. Opening a post from the feed leaves the feed card behind it, and liking in one of them used to leave the other showing the old count until something refetched.
- Post detail now shows whether you have already liked or saved a post. It previously started both as "no" every time the screen opened and only changed if you clicked, so the heart could contradict the count printed beside it.
- Blocking someone from a post's menu now asks for confirmation first. It used to take effect the moment you clicked, while the same action from a profile asked first.
- A video now stops when you scroll past it, instead of continuing to play and make noise from a card you can no longer see.
- The profile tabs now show different things. Posts, photos and liked all showed the same list and only moved an underline; photos now shows the posts carrying pictures, and liked shows the posts you have liked.

### Added
- Destructive confirmations now share one dialogue whose confirm button stays inert for a moment after it appears, so a second click aimed at the control you just pressed cannot land on the irreversible action.
- Modals, sheets and overlays now close when you press Escape.
- Images further down a long feed are no longer all fetched at once, while the space they will occupy is still reserved so nothing jumps.

### Added
- You can now create a post carrying several pictures or videos. Attach as many as ten in one post, mix pictures and video freely, remove any one of them, and change their order, which is the order a viewer will swipe through.
- Each attached file uploads on its own and shows its own progress, so one failure among several is identifiable. The others and your caption are kept, and the failed file can be retried or removed without starting the post again.
- A file that is the wrong format or too large is now refused before any of it is sent, and the refusal names the actual limit rather than leaving you to guess.
- Animated GIF images and QuickTime video are now accepted, matching what the server accepts.

### Changed
- The composer no longer asks you to choose a kind of post before making one. The three type tabs are gone. Write first or attach first, in either order, and the kind of post is worked out from what you attached. The post button says which kind it is about to create.
- Removing the last attachment turns the post back into a text post on its own, with nothing to switch.
- The composer's guidance on accepted formats, maximum size and maximum video length is now read from the server instead of being written into the application. It previously claimed only mp4 was accepted, with a sixty second and fifty megabyte limit, and all three were wrong.

### Added
- A post carrying more than one image or video now shows every one of them, a single item at a time, with a count and a marker for which item you are on. Previously only the first was shown and nothing indicated the rest existed, so a video sitting behind an image could not be reached from anywhere in the application.
- You can move through a multi-item post by swiping on a touch screen, by the arrows on a pointer device, and by the left and right arrow keys once the media has focus.
- The profile grid, the photos tab, the explore grid and search results each mark a post that carries more than one item with the number of items it holds.
- Search results now show the picture or video a post carries. They previously showed none at all, so a photograph was indistinguishable from a note.
- An account that follows nobody now sees a short message on its feed instead of an empty column.
- A picture or video that fails to load now says so in the space it was going to occupy, rather than leaving a gap or a blank tile.
- A design conformance audit measuring the implemented interface against the committed design export, covering the screen inventory, per-screen differences, the token layer, every primitive, the icon set, and the derived loading, empty, error and disabled treatments. It records findings only and changes no behaviour.
- A second measurement pass covering the report modal, post detail and the composer, and the first record of how posts carrying images, video and carousels actually behave on every screen that renders them. It records findings only and changes no behaviour.
- Something you have already reported now says "Reported" in its menu, so a prior report is visible without having to submit another one to find out.
- An edited comment is now marked as edited, and a comment that was only liked or replied to is not.
- The delete confirmation for a comment now states how many comments will be removed in total, including every reply beneath it, instead of only counting direct replies.
- You can report someone else's post, comment, or account from the overflow menu, choosing from the same eight reasons the server accepts and optionally adding your own description.
- The report action does not appear on your own post, comment, or profile, where the server refuses it and the action could never succeed.
- Reporting something you have already reported now says so calmly instead of failing, and states that a different reason will not make a second report possible.
- A profile you are viewing now has an overflow menu, which previously did not exist.
- Opening a post now offers the same report action the feed does, which it previously did not.

### Fixed
- A portrait photograph is no longer cut off in the feed. About a tenth of a tall image was being trimmed away to fit a fixed height limit, which has been replaced by a rule based on the picture's own shape.
- Pictures and video now hold their space before they arrive, so a post no longer grows and pushes everything below it down the moment an image finishes loading.
- A video on someone's profile grid is now visibly a video showing its opening frame. It was previously a blank square with nothing in it.
- The follow button on a profile now reads "following" when you already follow that account, and changes appearance to match. It always read "follow", whoever you were looking at.
- The caption on a text post is now the larger size the design specifies. The check that chose the size never matched, so every text post was rendered at the smaller size meant for posts with pictures.
- The whole of a post in the feed is now a link to open it, while the like, save, share, menu and author controls inside it continue to do their own job.
- The feed post card and the profile screen now match the design's measurements, including the card's corner, border and avatar, and the profile's avatar, heading, statistics and grid tiles.
- The icons for the active navigation tab are the right shape. Every filled icon was previously the outline drawing with a fill poured in and the outline still switched on, which made each one about a stroke wider than intended, and the bell's open clapper became a solid wedge. All seven now use the artwork the design draws for them.
- Unfollow and block in a post's menu show icons that mean what the rows do. Unfollow showed a plain person and block showed a close cross.
- Primary buttons use light text on the accent fill rather than dark. This covers follow, continue, submit and the composer's post button, which had its own copy of the colours.
- The app bar, the top tabs and the bottom navigation match the design's measurements, and three decorations that were never in the design are gone: the underline beneath the active top tab, and the bar above the active bottom tab.
- The top navigation tabs are easier to hit. They were a fixed 44 pixels wide and now expand to roughly 109.
- The app bar hides when you scroll down and returns when you scroll up.
- Video no longer plays with sound by default. Two of the four places video appears were unmuted, and because opening a post over the feed loads the same video twice, one copy could play audio while the other ran silently. All four start muted and audio is one click away where controls are shown.
- Video no longer takes over the whole screen on iOS when it starts playing. Untested, since it needs an iOS device.
- You can like your own comment again. The control was removed because the server refused it, and the server no longer does.
- The sign-up form now enforces exactly the password rules the server enforces, so a password it accepts is not rejected on submit, and a rejected password says which rule it broke instead of only that something was wrong.
- A failed media upload now says what went wrong and keeps your chosen file, so it can be retried without picking the file again.
- The "Report" item in the post menu and the comment menu now does something; both were previously inert.
- Comments on a post you have open now arrive as they are written, without a reload, along with edits, deletions, and changes to comment and post like counts.
- A new comment arrives below what you are already reading, so nothing moves under you, and the top comments stay where the server put them.

### Fixed
- The explore screen no longer leaves a band of empty space where its topic shortcuts used to be, and the composer no longer reserves room for tag suggestions that are no longer offered.

- The photos tab on a profile now works, showing the account's photo and carousel posts, filtered by the server rather than approximated.
- The liked tab now works on your own profile, listing the posts you have liked, most recent first.
- A private account now looks private to someone who does not follow it, and following one shows that your request is waiting rather than pretending it was accepted.
- Blocking and unblocking someone can now be done from their profile, without having to find one of their posts first.
- Blocking now asks first and says what it will do, including that unblocking will not restore the follows it removes.
- Looking at the profile of someone you have blocked now says so, instead of reporting a connection error.

- A search results screen reachable from the search field, covering posts, people, and hashtags, each paging on its own and each with its own empty and failure state.
- A search now lives in the address, so it can be shared, bookmarked, and reloaded, and typing waits for a pause before searching rather than searching on every keystroke.
- A follow control on a person in the search results shows whether you already follow them instead of always offering to follow.
- A saved posts screen, reachable from the account section of settings, listing the posts you have bookmarked.
- Removing a post from the saved list no longer needs a reload, and a post saved anywhere else in the application appears there straight away.
- Comments can be liked and unliked, and a comment you have already liked now shows as liked instead of appearing untouched.
- You can edit your own comment in place, with the same length limit the server enforces.
- You can delete your own comment after a confirmation that warns you when replies will go with it, which they always do.
- Comments promoted for having the most likes are now labelled, so the order of the first few comments is explicable rather than arbitrary.
- Every screen in the signed-in application now has its own address, so any of them can be linked, bookmarked, shared, and reloaded.
- The browser back and forward buttons now move between screens instead of leaving the application.
- An unrecognised address inside the application now shows a "this page doesn't exist" panel with a way back to the feed, keeping the navigation in place.

### Changed
- The post half of search now says whether there were genuinely no matches or whether search itself was unavailable, instead of one message covering both.
- The tabs on someone else's profile no longer offer a liked list, because only your own likes can be read.

### Fixed
- A saved or liked list no longer stops loading when a page comes back empty, and no longer claims you have saved nothing while there are still pages to fetch.

### Removed
- The invented conversations, people, stories, trending tags, topic chips, tag suggestions and onboarding interests that were shown as though they were real, along with the links that led from them to profiles and stories that do not exist.
- The story rail on the feed, which was built entirely from invented people.
- Messages remains in the navigation but is now disabled, making clear it is not part of this build.

### Changed
- The profile tabs now show different things: "posts" lists the account's posts, while "photos" and "liked" say they are not available yet rather than silently repeating the posts grid.
- Reloading the page no longer signs you out; the session is restored from the refresh cookie, and no token is ever written to browser storage.
- A screen now reads what it needs from the address, so opening a link to a profile, a post, a follower list, or a search shows the same thing it showed the person who sent it.
- Moving to a new screen starts at the top of the page, and going back returns to where you were.

### Security
- Credentials are now always sent on the authentication requests that carry the refresh cookie, rather than depending on an environment variable that was never set; without this a cross-origin deployment would drop the cookie and sign users out on every reload.

### Fixed
- Selecting "photos" on a profile no longer shows text-only posts; the tab selection now reaches the grid instead of only moving the underline.
- The like count on a comment is no longer raised locally without anything being recorded; it now reflects what the server holds and is restored if a like fails.
- The like control no longer appears on your own comments, where the server refuses it and the action could never succeed.
- Submitting a comment twice in quick succession now creates one comment rather than two.
- Opening a comment author's profile from the comment menu no longer throws.
- Signing out now actually ends the session; the request was being sent unauthenticated, so the server rejected it and the session stayed valid.
- Sessions no longer end on a brief network failure during startup, which previously cleared a perfectly valid session.
- Removed a duplicate second address for the Google sign-in callback page.
- The feed and explore screens no longer fail with "Something went wrong" as soon as a post exists; posts now show the author's real name, avatar, and handle.
- Following, blocking, and opening the author's profile from a post now act on the intended account instead of failing silently, and the edit and delete options appear on your own posts again.
- Likes and saves you have already made now show as such when a post loads, instead of always appearing untouched.
- A post with no comments no longer displays an invented comment count.
- Comments and notifications now show who they are from, instead of "unknown" and "Someone", and no longer make a redundant request for each row.
- Notifications describe what happened, such as "liked your comment" or "replied to your comment", instead of "interacted with you".
- The unread notification badge now appears when there are unread notifications.
- Pending follow requests now appear in the requests tab and count towards the notification badge.
- Follower and following lists now show each person's name, handle, and avatar, are clickable, and show whether you already follow them.
- Followers, following, and notifications now continue loading past the first page as you scroll.
- A private account you do not follow now shows a dash for its hidden post and follower counts, instead of claiming they are zero.
- Videos attached to posts now play instead of being rendered as still images.
- Signing in works again; the login request previously used a field name the server does not accept and failed for every account, and the form now accepts either an email address or a username.
- Accounts whose email address is not yet verified are now shown the "check your inbox" screen with their address prefilled and a working resend button, instead of a generic sign-in failure.
- Password reset now sends only the fields the server accepts; the extra field it previously included made the request unprocessable, so a reset could never complete.
- Registration no longer rejects usernames containing a dot or passwords without an uppercase letter and a digit, all of which the server accepts, and now enforces the 128-character password maximum it previously ignored.
- The blocked users list is now read from the server, so it is the same in every browser, survives clearing site data, and shows each blocked account's name and handle.
- Blocking someone now reports failure when the server rejects it, instead of appearing to succeed.
- The post status transition request now uses the field name the server expects.

### Added
- Added a development-only warning that reports when an API response does not carry a field the interface expects, so a contract change is visible immediately rather than surfacing as a blank name or a stalled list.
- Added `docs/response-shape-and-session/` recording the field-by-field response audit, the verified token lifecycle, the lint baseline, and the findings deliberately deferred.
- Added the Claude Design export at `docs/design/Luvax.html` as the committed pixel-perfect interface reference, with a README covering its structure and how to extract its bundled chunks.
- Added `docs/backend-contract-alignment/` recording the verified field-level contract for every authentication endpoint, the changes applied, the browser and `curl` verification evidence, and the findings deliberately deferred.
- Added a full-stack reconnaissance audit under `docs/reconnaissance/`, recording the observed backend API contract, the data model, the frontend inventory, the design system reference, per-screen design conformance gaps, a feature gap matrix, demo readiness, defects, open decisions, and a local environment runbook.
- Added a demo data seed script at `tools/seed/` that creates accounts, a two-way follow graph, posts with and without media, a maximum-depth comment tree, uneven likes, saved posts, and a report, entirely through the public HTTP API and safe to run repeatedly.

### Removed
- Removed the suggested-accounts panel from the right rail; it called an endpoint that does not exist and failed on every feed and explore render, and the feature backing it is not built.
- Removed the `lucide-react` dependency and a pair of unused mock data exports, none of which were referenced anywhere.
- Removed a dead standalone HTML prototype and a duplicate, unused media upload service that were never referenced by the running app.
- Removed unused email/password auth hooks (login, logout, registration, password reset, email verification, OAuth code exchange) that had no callers; the app performs these actions through the auth service directly.

### Changed
- Line endings are now declared by the repository itself, so a fresh checkout no longer reports thousands of spurious formatting errors on Windows.
- Infinite-scroll feed, explore, user posts, followers, and following lists now cancel their in-flight network request when the query is aborted or refetched, instead of letting it complete unused.
- Consolidated the repeated pagination content-extraction logic used across feed, profile, explore, followers/following, notifications, and post/comment screens into one shared helper, with no visible or behavioral change.
- Consolidated duplicated post share/copy-link logic and message text-copy logic into shared clipboard helpers, with no visible or behavioral change.
- The messages screen and header search now load through standard module imports instead of a global window registration, with no visible change to either.
- Moved shared design tokens and icon/avatar/dropdown-menu primitives out of the main app shell feature into shared locations so the messages feature no longer reaches into another feature's internals; no visual or behavioral change.

### Security
- Removed access token and refresh token from localStorage persistence; tokens are now in-memory only, with a one-time silent migration that scrubs any previously persisted tokens from existing sessions.
- Added a route guard to the main application shell; unauthenticated access to the app now redirects to sign-in, and signing in while already authenticated now redirects away from the sign-in page.

### Fixed
- Settings now shows the signed-in user's actual email address instead of a placeholder example email.
- Edit profile now saves changes to the server; the profile screen reflects the confirmed saved values after a reload.
- Post like, save, and comment actions now call the backend with immediate visual feedback that reverts if the request fails.
- The comment thread on a post now loads and updates from the server instead of showing placeholder text.
- The suggested-people list no longer shows placeholder accounts when it fails to load; it now shows nothing instead.
- Follow-request accept and decline buttons in the notifications list are now functional everywhere they appear.
- Removed technical error text (server/network implementation details) from user-facing messages across the app.
- Replaced browser pop-up confirmations and alerts with the app's own in-page confirmation and error messages.
- The profile screen now shows an inline error message when the profile fails to load and no identifiable name is available to fall back on (previously a thin placeholder, such as when arriving from a notification, could render a blank-looking header instead), and an inline error message instead of a silently blank post grid when posts fail to load.

### Known Limitations
- Changing your password from account settings is temporarily disabled while the corresponding backend capability is being built.
- Privacy and notification toggles in account settings are now visibly disabled and labeled "coming soon" instead of silently resetting on navigation, while the corresponding backend capability is being built.

### Changed
- The auth entry point's brand panel now shows the luvax logo image instead of a text wordmark, matching the browser tab favicon.
- The login identifier field now accepts a username or an email address without triggering an email-format validation error.

### Removed
- Removed the password strength indicator and the "request another reset email" link from the reset-password page.

### Added
- Extracted the auth field component to `AuthField` so the email verification, verification-notice, and reset-password pages can share it with the unified auth entry point.

### Changed
- Email verification, verification-notice, and reset-password pages now render with the same design system as the unified auth entry point instead of the old auth UI layer.
- Theme (light/dark) is now applied synchronously before the app renders, eliminating a flash of the wrong theme on cold page loads for users with a dark OS preference.

### Fixed
- Fixed the auth entry point's hero image not loading due to a wrong file extension.
- Fixed a duplicated focus ring appearing around auth form fields on keyboard focus.

### Removed
- Removed the legacy auth UI component layer (`AuthPageLayout`, `AuthShell`, `AuthPrimitives`, `AuthBrandPanel`) and its dedicated CSS now that all auth pages use the unified design system.

### Added
- Added a single `AuthPage` component that replaces the old landing page and the separate login, register, and forgot-password pages with one unified entry point at `/`, ported from the approved auth design.
- Added `authPageRegisterSchema`, a trimmed registration schema (username, display name, email, password) used by the new unified registration form.

### Changed
- `/` now renders the unified `AuthPage` instead of the old landing page; `/login`, `/register`, and `/forgot-password` now redirect into `AuthPage`'s in-place view state instead of rendering separate pages.

### Removed
- Removed the old landing page and the separate `LoginPage`, `RegisterPage`, and `ForgotPasswordPage` components, superseded by the unified `AuthPage`.

### Fixed
- Email verification token consumed twice in development due to React StrictMode double-invoke; replaced AbortController cancellation approach with a useRef idempotency guard that prevents the single-use token from being called more than once per page visit.

### Added
- Added `ROUTES.VERIFY_EMAIL_NOTICE` constant (`/verify-email-notice`) to the central route path registry.
- Added placeholder `VerifyEmailNoticePage` at `src/pages/auth/VerifyEmailNoticePage.jsx` so the route compiles before the full implementation lands.
- Added `verifyEmail`, `resendVerification`, `forgotPassword`, `resetPassword`, and `exchangeOAuthCode` methods to `authService` so all auth API calls are exposed through the service layer.
- Frontend support for backend-managed Google OAuth2 login, including the `/oauth2/callback` route and exchange-code handling.
- Luvax social network UI ported from `src/index.html` into the React/Vite project under `src/features/luvax/`, accessible at `/app`.
- Full Luvax design token set (light + dark themes, glass, density, semantic colors, scrollbar overrides) merged into `src/index.css`.
- All Luvax screens as isolated JSX components: Feed, Explore, Composer, PostDetail, Profile, Notifications, Settings, Onboarding, StoryView, StoryComposer.
- Shared UI primitives (LxIcon, LxAvatar, LxTag, LxBtn, LxDivider, LxBottomSheet) in `src/features/luvax/components/primitives.jsx`.
- Responsive shell (LxShell, LxAppBar, LxTopTabs, LxBottomNav, LxRightRail) in `src/features/luvax/components/shell.jsx`.
- `useViewport` hook for desktop/tablet/mobile breakpoint detection.
- `/app` route wired into the central router for the Luvax UI.
- Added `GlobalErrorBoundary` class component wrapping the entire app in `main.jsx`; render-phase crashes now show a recoverable fallback instead of a blank screen.
- Added `RouterErrorPage` component as `errorElement` on the root route; route-level loader/action errors are caught and display user-safe copy with Go back / Home recovery actions.
- Added global `QueryCache` and `MutationCache` `onError` handlers to `QueryClient`; all TanStack Query failures flow through a single logging point (401s excluded — owned by the Axios interceptor).
- Added `normalizeAxiosError` to `axiosClient.js`; all Axios errors on both `publicClient` and `axiosClient` are normalized before reaching any consumer — raw database constraints, Hibernate/Spring class names, SQL fragments, internal status enum values (INACTIVE, BANNED), and stack trace strings are redacted and replaced with safe user-facing copy.
- Added GitHub governance files including issue templates, pull request template, CODEOWNERS, and CI-related workflows.

### Changed
- `GuestRoute` now redirects authenticated users to `ROUTES.APP` (`/app`) instead of `ROUTES.DASHBOARD`.
- `/verify-email` route moved from inside `GuestRoute` to a top-level child under `RootLayout` so authenticated users arriving via an email link are not bounced away.
- `/verify-email-notice` route added as a top-level child under `RootLayout` (outside `GuestRoute`) so newly registered users can reach it regardless of session state.
- `registerSchema` now includes a required `username` field (3–30 chars, alphanumeric + underscores) and makes the `name` (display name) field optional with a 100-character maximum.
- `resetPasswordSchema` no longer includes a `token` field; the token is extracted from the URL programmatically and is not a form input.
- Removed "Already have a reset token?" link from `ForgotPasswordPage` and "This email may already be waiting for verification" link from `RegisterPage` to streamline the user flow.
- Updated repository ignore rules to keep local `.env` files out of version control.
- Added agent instructions, local agent rules, and a project structure reference for future coding sessions.

### Fixed
- `useRegister` hook now passes `state: { email }` when navigating to `VerifyEmailNoticePage` so the resend form is pre-populated.
- `/reset-password` route moved out of `GuestRoute` to a top-level route so authenticated users clicking a reset link are not bounced to `/app`.
- `EMAIL_NOT_VERIFIED` navigation in `LoginPage` now uses `replace: true` for consistent history behavior.
- Removed Vietnamese-language subtitle text from `EmailVerificationPage` and replaced it with English copy.
- `EmailVerificationPage` now calls `setAuth` and navigates to `/app` when the backend returns a session on successful verification; falls back to `/login` with a success message when no session is returned.
- `OAuthCallbackPage` now redirects to `ROUTES.APP` (`/app`) on successful OAuth exchange instead of the deprecated `/dashboard`.
- `LoginPage` now detects `EMAIL_NOT_VERIFIED` error code from the backend and navigates to `VerifyEmailNoticePage` with the email pre-filled instead of showing a generic error.
- `LoginPage` fallback redirect after login now uses `ROUTES.APP` instead of the hardcoded string `/dashboard`.
- `RegisterPage` no longer auto-generates a username; users now provide their own username via a dedicated form field before the email input.
- `RegisterPage` navigates directly to `ROUTES.VERIFY_EMAIL_NOTICE` on successful registration (no delay timer) and no longer uses the deprecated `ROUTES.VERIFY_EMAIL` redirect.
- `ResetPasswordPage` no longer renders the token as an editable input; the token is extracted from the URL and passed directly to the API call.
- `ResetPasswordPage` shows an "invalid or expired link" error state immediately when no token is present in the URL, with a link to request a new reset email.
- Replaced the `VerifyEmailNoticePage` placeholder with a full implementation: shows a "check your inbox" notice and a resend-verification form pre-populated from router state.
- Realigned Google sign-in with the backend OAuth2 contract by starting auth at `/api/v1/auth/oauth2/authorize/google` and exchanging the returned short-lived `code` instead of a browser token.
- Corrected the default Google OAuth2 start endpoint to `/api/v1/auth/oauth2/authorize/google` so the frontend targets the backend-mounted authorization route.
- Updated `.env` and `.env.example` so local Google login uses the backend OAuth2 authorization route and the `/oauth2/callback` frontend return path.
- Reverted the frontend Google OAuth2 start endpoint to Spring Security's default `/oauth2/authorization/google` to match the backend's current `application.yml` configuration.
- Re-applied the frontend Google OAuth2 start endpoint `/api/v1/auth/oauth2/authorize/google` so the login flow follows the backend `oauth2` module contract exactly.
- Added `AbortController` cleanup to the async `verifyEmail` effect in `EmailVerificationPage`; `navigate` and `setTokenError` are now no-ops if the component unmounts before the request resolves.
- Added `AbortController` cleanup to the async `clearSession` effect in `HomePage`; `logout()` is guarded against post-unmount invocation.
- Replaced `href="#"` anchor elements in `AuthBrandPanel` footer with `<button type="button">` elements; eliminates the false navigation affordance, spurious history entries, and scroll-to-top side effect.
- Documented the intentional `window.location.assign` usage in `axiosClient.js` as an audited exception; the Axios interceptor runs outside the React tree and cannot use `useNavigate`.
- Scrubbed `?token=` from the URL in `EmailVerificationPage` via `history.replaceState` before the async verification call, preventing the token from persisting in browser history.
- Scrubbed `?token=` from the URL in `ResetPasswordPage` via `useLayoutEffect`+`history.replaceState` synchronously before first paint; the token is retained in RHF `defaultValues` (in-memory only).
- `ProtectedRoute` now passes only `{ pathname }` in `location.state.from` — `search` and `hash` are stripped, closing the leak where `?token=` query params could survive in navigation state across history traversal.
- `ProtectedRoute` now requires both `isAuthenticated` (persisted) and a live `accessToken` (in-memory) before granting access, closing the race between persist rehydration and `AuthSessionBootstrap` token refresh on cold page loads.
- Consolidated duplicate `LoginPage` implementations; `src/features/auth/components/LoginPage.jsx` is now the single canonical entry point wired into the router.
- Merged conflicting Zod schema files into `src/features/auth/utils/authSchemas.js`; the `src/components/auth/authSchemas.js` copy has been deleted.
- Retargeted all schema consumers (`ForgotPasswordPage`, `RegisterPage`, `ResetPasswordPage`) to import from the canonical feature-slice location.
- Removed literal `nom` syntax token from `cn.js` that caused a parse error breaking all shadcn/ui primitives.
- Wrapped auth store in Zustand `persist` middleware; `accessToken` and `refreshToken` are now in-memory only and excluded from `localStorage` via `partialize`.
- Fixed `hasHydrated` initialization — it now starts `false` and is set `true` exclusively via `onRehydrateStorage`, eliminating the race where consumers read a stale hydration flag.
- Removed implicit OAuth flow (response_type `token id_token`) from the Google OAuth URL builder; only the authorization-code flow (`code`) is now issued.
- Removed client-side JWT parsing via `window.atob` (`decodeJwt`, `buildUserFromGoogleClaims`) — user identity is now established exclusively by the backend.
- Enforced strict CSRF state check in `OAuthCallbackPage`: both stored and returned `state` values must be present and equal; missing either side is now a hard failure.
- URL hash and query tokens are scrubbed via `history.replaceState` before any async exchange begins in `OAuthCallbackPage`.
- Added `useRef` guard to `OAuthCallbackPage` to prevent double-invocation under React Strict Mode.

### Removed
- Deleted unused `AuthLayout.jsx` and `MainLayout.jsx` scaffold files; neither was imported anywhere in the application.
- Deleted `src/pages/auth/LoginPage.jsx` (superseded by feature-slice canonical).
- Deleted `src/features/auth/components/LoginForm.jsx` (shadcn scaffold stub, replaced by the full LoginPage).
- Deleted `src/components/auth/authSchemas.js` (merged into feature-slice utils).
