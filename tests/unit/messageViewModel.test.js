import { describe, expect, it } from 'vitest';

import {
  toMessageView,
  toThread,
  toThreadSummary,
} from '@/features/messages/utils/messageViewModel';

const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

const participants = [
  { userId: ME, username: 'me', displayName: 'Me', avatarUrl: null },
  { userId: OTHER, username: 'priya_m', displayName: 'Priya', avatarUrl: 'https://cdn/p.jpg' },
];

const message = (overrides) => ({
  id: 'm1',
  senderId: OTHER,
  messageType: 'text',
  content: 'hello',
  mediaAssetId: null,
  media: null,
  sharedPostId: null,
  sharedStoryId: null,
  replyToId: null,
  isDeleted: false,
  createdAt: '2026-08-18T10:15:00Z',
  ...overrides,
});

describe('toThreadSummary', () => {
  it('names a direct conversation after the other participant, never the viewer', () => {
    const view = toThreadSummary(
      { id: 'c1', participants, unreadCount: 2, lastMessage: message({}) },
      ME
    );
    expect(view.name).toBe('Priya');
    expect(view.username).toBe('priya_m');
    expect(view.unread).toBe(2);
  });

  it('previews the last message, and stays blank when there is none', () => {
    const withLast = toThreadSummary(
      { id: 'c1', participants, unreadCount: 0, lastMessage: message({}) },
      ME
    );
    expect(withLast.preview).toBe('hello');

    const empty = toThreadSummary(
      { id: 'c3', participants, unreadCount: 0, lastMessage: null },
      ME
    );
    expect(empty.preview).toBe('');
  });

  it('describes an attachment preview rather than showing an empty row', () => {
    const view = toThreadSummary(
      {
        id: 'c4',
        participants,
        unreadCount: 0,
        lastMessage: message({ content: null, mediaAssetId: 'a1' }),
      },
      ME
    );
    expect(view.preview).not.toBe('');
  });
});

describe('toMessageView', () => {
  const ctx = { participants, currentUserId: ME, loadedMessages: [] };

  it('marks the viewer as me and everyone else as them', () => {
    expect(toMessageView(message({ senderId: ME }), ctx).from).toBe('me');
    expect(toMessageView(message({ senderId: OTHER }), ctx).from).toBe('them');
  });

  it('renders a deleted message as a placeholder, not its old content', () => {
    const view = toMessageView(message({ isDeleted: true, content: 'secret' }), ctx);
    expect(view.kind).toBe('deleted');
    expect(view.text).not.toContain('secret');
  });

  it('quotes a reply when the referenced message is loaded', () => {
    const target = message({ id: 'm0', content: 'original', senderId: OTHER });
    const view = toMessageView(message({ id: 'm2', replyToId: 'm0' }), {
      ...ctx,
      loadedMessages: [target],
    });
    expect(view.kind).toBe('reply');
    expect(view.replyText).toBe('original');
    expect(view.replyTo).toBe('Priya');
  });

  it('still renders a reply when the referenced message is outside the loaded page', () => {
    // Fetching the referenced message per bubble would be an N+1 while scrolling, so the quote is
    // dropped rather than fetched. The bubble must still read as a reply.
    const view = toMessageView(message({ id: 'm2', replyToId: 'gone' }), ctx);
    expect(view.kind).toBe('reply');
    expect(view.replyText).toBeNull();
  });

  it('exposes resolved media so a recipient can render an image', () => {
    const view = toMessageView(
      message({
        messageType: 'image',
        content: null,
        mediaAssetId: 'a1',
        media: { mediaAssetId: 'a1', mediaType: 'IMAGE', cdnUrl: 'https://cdn/i.jpg' },
      }),
      ctx
    );
    expect(view.kind).toBe('file');
    expect(view.media.cdnUrl).toBe('https://cdn/i.jpg');
  });

  it('marks a shared story so the bubble can label it', () => {
    const view = toMessageView(
      message({ messageType: 'story_share', content: 'love this', sharedStoryId: 's1' }),
      ctx
    );
    expect(view.kind).toBe('post');
    expect(view.sharedStoryId).toBe('s1');
    expect(view.meta).toContain('story');
  });

  it('resolves the sender from the participant list rather than the message', () => {
    // MessageResponse carries only senderId; the profile lives on the conversation.
    const view = toMessageView(message({ senderId: OTHER }), ctx);
    expect(view.senderName).toBe('Priya');
    expect(view.senderAvatarUrl).toBe('https://cdn/p.jpg');
  });

  it('formats the timestamp as a short local time', () => {
    const view = toMessageView(message({ createdAt: '2026-08-18T10:15:00Z' }), ctx);
    expect(view.time).toMatch(/\d{1,2}:\d{2}/);
  });

  it('survives a sender who is no longer a participant', () => {
    const view = toMessageView(message({ senderId: 'ghost' }), ctx);
    expect(view.from).toBe('them');
    expect(view.senderName).toBeTruthy();
  });
});

describe('toThread', () => {
  it('combines the summary with mapped messages', () => {
    const conversation = {
      id: 'c1',
      participants,
      unreadCount: 0,
      lastMessage: null,
    };
    const thread = toThread(conversation, [message({ id: 'a' }), message({ id: 'b' })], ME);
    expect(thread.name).toBe('Priya');
    expect(thread.messages).toHaveLength(2);
    expect(thread.participants).toHaveLength(2);
  });

  it('returns messages oldest first so the newest sits at the bottom', () => {
    // The API answers newest first because that is what paginating backwards through history
    // needs. Rendering that order directly puts new messages above old ones, which reads as a log
    // rather than a conversation.
    const conversation = { id: 'c1', participants, unreadCount: 0 };
    const older = message({ id: 'm1', content: 'first', createdAt: '2026-08-18T10:00:00Z' });
    const newer = message({ id: 'm2', content: 'second', createdAt: '2026-08-18T10:05:00Z' });

    const thread = toThread(conversation, [newer, older], ME);

    expect(thread.messages.map((m) => m.text)).toEqual(['first', 'second']);
  });

  it('resolves replies across the whole loaded set, not just earlier pages', () => {
    // Reversing for display must not break quote resolution, which scans the whole loaded set.
    // After the flip the reply is last, not first.
    const conversation = { id: 'c1', participants, unreadCount: 0 };
    const first = message({ id: 'm0', content: 'first' });
    const reply = message({ id: 'm1', replyToId: 'm0' });
    const thread = toThread(conversation, [reply, first], ME);
    expect(thread.messages[1].replyText).toBe('first');
  });

  it('leaves preview and time empty for a conversation nobody has written in', () => {
    // An auto-provisioned conversation has no last message and no activity timestamp. The row must
    // not render a bare separator between two empty strings.
    const summary = toThreadSummary(
      { id: 'c1', participants, unreadCount: 0, lastMessage: null, lastMessageAt: null },
      ME
    );
    expect(summary.preview).toBe('');
    expect(summary.time).toBe('');
  });

  it('carries the counterpart id so compose can exclude existing conversations', () => {
    const summary = toThreadSummary({ id: 'c1', participants, unreadCount: 0 }, ME);
    expect(summary.counterpartId).toBe(OTHER);
  });

  it('derives shared media from the loaded messages', () => {
    // The info panel read `activeThread.media`, which toThread never produced, so opening the panel
    // threw. The grid now shows real attachments from the pages already fetched.
    const conversation = { id: 'c1', participants, unreadCount: 0 };
    const withMedia = message({
      id: 'm1',
      mediaAssetId: 'asset-1',
      media: { mediaAssetId: 'asset-1', mediaType: 'image', cdnUrl: 'https://cdn/x.jpg' },
    });
    const thread = toThread(conversation, [withMedia, message({ id: 'm2' })], ME);

    expect(Array.isArray(thread.media)).toBe(true);
    expect(thread.media).toHaveLength(1);
    expect(thread.media[0].id).toBe('m1');
    expect(thread.media[0].cdnUrl).toBe('https://cdn/x.jpg');
  });

  it('always produces a media array, even with no history', () => {
    const conversation = { id: 'c1', participants, unreadCount: 0 };
    expect(toThread(conversation, [], ME).media).toEqual([]);
    expect(toThread(conversation, null, ME).media).toEqual([]);
  });

  it('omits attachments on deleted messages', () => {
    const conversation = { id: 'c1', participants, unreadCount: 0 };
    const removed = message({
      id: 'm1',
      isDeleted: true,
      media: { mediaAssetId: 'a', mediaType: 'image', cdnUrl: 'https://cdn/gone.jpg' },
    });
    expect(toThread(conversation, [removed], ME).media).toEqual([]);
  });

  describe('bubble grouping', () => {
    it('collapses timestamp and avatar across a same-sender run under ten minutes apart', () => {
      const conversation = { id: 'c1', participants, unreadCount: 0 };
      const messages = [
        message({ id: 'm3', senderId: OTHER, createdAt: '2026-08-18T10:08:00Z' }),
        message({ id: 'm2', senderId: OTHER, createdAt: '2026-08-18T10:04:00Z' }),
        message({ id: 'm1', senderId: OTHER, createdAt: '2026-08-18T10:00:00Z' }),
      ];
      const thread = toThread(conversation, messages, ME);

      expect(thread.messages.map((m) => [m.id, m.showTimestamp, m.showAvatar])).toEqual([
        ['m1', false, false],
        ['m2', false, false],
        ['m3', true, true],
      ]);
    });

    it('breaks the run and re-shows both once the gap passes ten minutes', () => {
      const conversation = { id: 'c1', participants, unreadCount: 0 };
      const messages = [
        message({ id: 'm2', senderId: OTHER, createdAt: '2026-08-18T10:15:00Z' }),
        message({ id: 'm1', senderId: OTHER, createdAt: '2026-08-18T10:00:00Z' }),
      ];
      const thread = toThread(conversation, messages, ME);

      expect(thread.messages.map((m) => m.showTimestamp)).toEqual([true, true]);
    });

    it('breaks the run on a sender change even within the ten-minute window', () => {
      const conversation = { id: 'c1', participants, unreadCount: 0 };
      const messages = [
        message({ id: 'm2', senderId: ME, createdAt: '2026-08-18T10:01:00Z' }),
        message({ id: 'm1', senderId: OTHER, createdAt: '2026-08-18T10:00:00Z' }),
      ];
      const thread = toThread(conversation, messages, ME);

      expect(thread.messages.map((m) => m.showTimestamp)).toEqual([true, true]);
    });

    it('never shows an avatar on the viewer own messages, even at the end of a run', () => {
      const conversation = { id: 'c1', participants, unreadCount: 0 };
      const messages = [message({ id: 'm1', senderId: ME })];
      const thread = toThread(conversation, messages, ME);

      expect(thread.messages[0].showAvatar).toBe(false);
    });
  });
});
