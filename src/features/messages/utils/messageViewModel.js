/**
 * Maps conversation API shapes onto the props the message components consume.
 *
 * This is the only module that knows the previous mock fixture existed. The API deliberately
 * carries no per-viewer or presentational data: whether a message is "mine", what time to show it
 * at, and what a conversation is called all depend on who is looking, so they are computed here
 * rather than requested.
 *
 * The fixture also carried `accent`, `idx`, and `mediaLabel`, which had no server source at all.
 * Those are dropped rather than synthesized. Inventing a value here is how fixture data survives a
 * migration disguised as real data.
 *
 * Pure by design: API shapes in, view props out, no network and no React, so the whole mapping is
 * testable without a server or a DOM.
 */

const DELETED_PLACEHOLDER = 'this message was deleted';
const UNKNOWN_PARTICIPANT = 'unknown';

const participantOf = (participants, userId) =>
  (participants || []).find((participant) => participant.userId === userId) || null;

const nameOf = (participant) =>
  participant
    ? participant.displayName || participant.username || UNKNOWN_PARTICIPANT
    : UNKNOWN_PARTICIPANT;

/** Short local time. The server sends UTC; a reader wants their own clock. */
export const formatMessageTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const isSameCalendarDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * The label a separator row shows between two clusters of messages: "Today, 3:34 PM", "Yesterday,
 * ...", or a full date once it is neither. Mirrors the day-boundary language most chat apps use
 * rather than a bare timestamp, which reads as a log entry instead of a point in a conversation.
 */
export const formatSeparatorLabel = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isSameCalendarDay(date, now)) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameCalendarDay(date, yesterday)) return `Yesterday, ${time}`;

  const datePart = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
  return `${datePart}, ${time}`;
};

/** The other party in the conversation. */
export const counterpartOf = (conversation, currentUserId) => {
  const others = (conversation?.participants || []).filter(
    (participant) => participant.userId !== currentUserId
  );
  return others[0] || null;
};

/** What a conversation row shows under the name when the message itself has no text. */
const previewTextOf = (message) => {
  if (!message) return '';
  if (message.isDeleted) return DELETED_PLACEHOLDER;
  if (message.content) return message.content;
  if (message.sharedStoryId) return 'shared a story';
  if (message.sharedPostId) return 'shared a post';
  if (message.mediaAssetId) return 'sent an attachment';
  return '';
};

/**
 * Which bubble treatment a message gets.
 *
 * Keyed on `replyToId` rather than on whether the quote resolved: a reply is still a reply when the
 * message it answers sits outside the loaded page.
 */
const kindOf = (message) => {
  if (message.isDeleted) return 'deleted';
  if (message.replyToId) return 'reply';
  if (message.sharedPostId || message.sharedStoryId) return 'post';
  if (message.mediaAssetId) return 'file';
  return 'text';
};

/** One row in the conversation list. */
export const toThreadSummary = (conversation, currentUserId) => {
  const counterpart = counterpartOf(conversation, currentUserId);

  return {
    id: conversation.id,
    name: nameOf(counterpart),
    username: counterpart?.username || '',
    avatarUrl: counterpart?.avatarUrl || null,
    preview: previewTextOf(conversation.lastMessage),
    time: formatMessageTime(conversation.lastMessageAt),
    unread: conversation.unreadCount || 0,
    // Carried so the compose picker can exclude people the viewer already has a thread with.
    counterpartId: counterpart?.userId || null,
  };
};

/** One bubble in the thread. */
export const toMessageView = (message, { participants, currentUserId, loadedMessages = [] }) => {
  const sender = participantOf(participants, message.senderId);
  // Resolved from the loaded page only. Fetching the referenced message per bubble would issue one
  // request per reply while scrolling.
  const repliedTo = message.replyToId
    ? loadedMessages.find((candidate) => candidate.id === message.replyToId) || null
    : null;

  return {
    id: message.id,
    from: message.senderId === currentUserId ? 'me' : 'them',
    kind: kindOf(message),
    text: message.isDeleted ? DELETED_PLACEHOLDER : message.content || '',
    time: formatMessageTime(message.createdAt),
    senderName: nameOf(sender),
    senderAvatarUrl: sender?.avatarUrl || null,
    media: message.media || null,
    sharedPostId: message.sharedPostId || null,
    sharedStoryId: message.sharedStoryId || null,
    replyTo: repliedTo ? nameOf(participantOf(participants, repliedTo.senderId)) : null,
    replyText: repliedTo ? previewTextOf(repliedTo) : null,
    handle: sender?.username ? `@${sender.username}` : null,
    title: null,
    meta: message.sharedStoryId ? 'shared story' : message.sharedPostId ? 'shared post' : null,
    // Carried only to group consecutive bubbles and label separators below; neither is rendered
    // directly on the bubble itself.
    atMs: message.createdAt ? new Date(message.createdAt).getTime() : null,
    createdAtIso: message.createdAt || null,
  };
};

/** A run of consecutive bubbles collapses its avatar this close together reads as one exchange, not a log. */
const GROUP_GAP_MS = 10 * 60 * 1000;

/**
 * Turns the flat message list into thread rows: a separator before the first message of each
 * cluster, and every message marked with whether it closes its run of consecutive same-sender
 * bubbles.
 *
 * A cluster breaks - and gets a new separator - when the sender changes or the gap since the
 * previous message exceeds ten minutes. A run breaks on the same rule; only a "them" bubble that
 * closes a run shows an avatar, the same collapsing Instagram's own thread view uses. Showing the
 * time as a row between clusters rather than text under every bubble is what lets a long burst of
 * short messages read as one exchange instead of a timestamped log.
 */
const toRows = (messages) => {
  const rows = [];

  messages.forEach((current, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];

    const startsCluster =
      !previous ||
      previous.from !== current.from ||
      previous.atMs === null ||
      current.atMs === null ||
      current.atMs - previous.atMs > GROUP_GAP_MS;

    if (startsCluster) {
      rows.push({
        rowType: 'separator',
        id: `sep-${current.id}`,
        label: formatSeparatorLabel(current.createdAtIso),
      });
    }

    const endsRun =
      !next ||
      next.from !== current.from ||
      current.atMs === null ||
      next.atMs === null ||
      next.atMs - current.atMs > GROUP_GAP_MS;

    rows.push({ rowType: 'message', ...current, showAvatar: endsRun && current.from === 'them' });
  });

  return rows;
};

/**
 * Attachments from the loaded history, newest first.
 *
 * There is no endpoint that lists a conversation's media, so this is what the info panel's grid can
 * honestly show: the attachments on the pages already fetched. It grows as the reader scrolls back.
 * The alternative considered was leaving the grid on fixture data, which would have shown every
 * conversation the same invented six images.
 */
const mediaOf = (messages) =>
  (messages || [])
    .filter((message) => !message.isDeleted && message.media)
    .map((message) => ({ id: message.id, ...message.media }));

/** A conversation plus its loaded history, oldest first, in the shape the thread panel renders. */
export const toThread = (conversation, messages, currentUserId) => {
  const loaded = messages || [];
  // The API returns newest first because that is what paging backwards through history needs.
  // Reading wants the opposite, so the flip happens once here rather than in every component that
  // renders a thread. Quote resolution above still sees the whole unreversed set.
  const messageViews = loaded
    .map((message) =>
      toMessageView(message, {
        participants: conversation.participants,
        currentUserId,
        loadedMessages: loaded,
      })
    )
    .reverse();

  return {
    ...toThreadSummary(conversation, currentUserId),
    participants: conversation.participants || [],
    media: mediaOf(loaded),
    // The plain per-bubble list, for callers that count or index messages (deletability, the
    // empty-thread layout). `rows` interleaves it with separators for rendering and must never be
    // counted or indexed as if it were the message list.
    messages: messageViews,
    rows: toRows(messageViews),
  };
};
