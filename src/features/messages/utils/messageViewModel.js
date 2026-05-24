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

/** The other party in a direct conversation, or null for a group. */
export const counterpartOf = (conversation, currentUserId) => {
  if (!conversation || conversation.isGroup) return null;
  const others = (conversation.participants || []).filter(
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
  const isGroup = Boolean(conversation.isGroup);
  const memberCount = (conversation.participants || []).length;

  return {
    id: conversation.id,
    isGroup,
    name: isGroup ? conversation.groupName || 'group' : nameOf(counterpart),
    username: isGroup ? `${memberCount} members` : counterpart?.username || '',
    avatarUrl: isGroup ? conversation.groupAvatarUrl || null : counterpart?.avatarUrl || null,
    preview: previewTextOf(conversation.lastMessage),
    time: formatMessageTime(conversation.lastMessageAt),
    unread: conversation.unreadCount || 0,
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
  };
};

/** A conversation plus its loaded history, in the shape the thread panel renders. */
export const toThread = (conversation, messages, currentUserId) => {
  const loaded = messages || [];
  return {
    ...toThreadSummary(conversation, currentUserId),
    participants: conversation.participants || [],
    messages: loaded.map((message) =>
      toMessageView(message, {
        participants: conversation.participants,
        currentUserId,
        loadedMessages: loaded,
      })
    ),
  };
};
