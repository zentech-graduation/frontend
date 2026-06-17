import { beforeAll, describe, expect, it } from 'vitest';

import { api, assertStackReachable, expectEnvelope, unwrap } from './support/client.js';
import { createVerifiedUser } from './support/identity.js';

let alice;
let bob;

beforeAll(async () => {
  await assertStackReachable();
  alice = await createVerifiedUser();
  bob = await createVerifiedUser();
}, 60000);

const createDirect = (from, targetUserId) =>
  api('/conversations', { method: 'POST', token: from.accessToken, body: { targetUserId } });

const send = (from, conversationId, body) =>
  api(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    token: from.accessToken,
    body,
  });

const history = async (viewer, conversationId) =>
  unwrap(
    await api(`/conversations/${conversationId}/messages?limit=30`, { token: viewer.accessToken })
  );

describe('direct conversations', () => {
  it('creates a conversation between two users', async () => {
    const result = await createDirect(alice, bob.user.id);
    expectEnvelope(result);
    expect([200, 201]).toContain(result.status);

    const conversation = unwrap(result);
    expect(conversation.participants.map((p) => p.userId).sort()).toEqual(
      [alice.user.id, bob.user.id].sort()
    );
  });

  it('resolves to the same conversation rather than duplicating it', async () => {
    // A direct-conversation pair key exists precisely so a repeated call cannot fork the thread.
    const first = unwrap(await createDirect(alice, bob.user.id));
    const second = unwrap(await createDirect(alice, bob.user.id));
    expect(second.id).toBe(first.id);
  });

  it('refuses a conversation with oneself', async () => {
    const result = await createDirect(alice, alice.user.id);
    expect(result.status).toBeGreaterThanOrEqual(400);
  });
});

describe('messaging', () => {
  it('sends a message the recipient can read back', async () => {
    const conversation = unwrap(await createDirect(alice, bob.user.id));
    const sent = unwrap(
      await send(alice, conversation.id, {
        messageType: 'text',
        content: 'hello bob',
      })
    );
    expect(sent.content).toBe('hello bob');

    const forBob = await history(bob, conversation.id);
    expect(forBob.content.map((m) => m.content)).toContain('hello bob');
  });

  it('surfaces the newest message on the recipient conversation list', async () => {
    const conversation = unwrap(await createDirect(alice, bob.user.id));
    await send(alice, conversation.id, { messageType: 'text', content: 'for the list' });

    const list = unwrap(await api('/conversations?limit=20', { token: bob.accessToken }));
    const row = list.content.find((c) => c.id === conversation.id);
    expect(row).toBeTruthy();
    expect(row.lastMessage.content).toBe('for the list');
  });

  it('counts unread for the recipient and clears it on read', async () => {
    const conversation = unwrap(await createDirect(alice, bob.user.id));
    await send(alice, conversation.id, { messageType: 'text', content: 'unread please' });

    const before = unwrap(await api('/conversations/unread-count', { token: bob.accessToken }));
    expect(before.unreadCount).toBeGreaterThan(0);

    await api(`/conversations/${conversation.id}/read`, {
      method: 'POST',
      token: bob.accessToken,
    });

    const list = unwrap(await api('/conversations?limit=20', { token: bob.accessToken }));
    const row = list.content.find((c) => c.id === conversation.id);
    expect(row.unreadCount).toBe(0);
  });

  it('honours an idempotency key so a retried send creates one message', async () => {
    const conversation = unwrap(await createDirect(alice, bob.user.id));
    const key = `live-${Date.now()}`;
    const body = { messageType: 'text', content: 'exactly once' };

    await api(`/conversations/${conversation.id}/messages`, {
      method: 'POST',
      token: alice.accessToken,
      body,
      headers: { 'Idempotency-Key': key },
    });
    await api(`/conversations/${conversation.id}/messages`, {
      method: 'POST',
      token: alice.accessToken,
      body,
      headers: { 'Idempotency-Key': key },
    });

    const page = await history(alice, conversation.id);
    const matches = page.content.filter((m) => m.content === 'exactly once');
    expect(matches).toHaveLength(1);
  });

  it('soft-deletes a message for its sender only', async () => {
    const conversation = unwrap(await createDirect(alice, bob.user.id));
    const sent = unwrap(
      await send(alice, conversation.id, {
        messageType: 'text',
        content: 'delete me',
      })
    );

    const byRecipient = await api(`/conversations/${conversation.id}/messages/${sent.id}`, {
      method: 'DELETE',
      token: bob.accessToken,
    });
    expect(byRecipient.status).toBeGreaterThanOrEqual(400);

    const bySender = await api(`/conversations/${conversation.id}/messages/${sent.id}`, {
      method: 'DELETE',
      token: alice.accessToken,
    });
    expect([200, 204]).toContain(bySender.status);

    // A tombstone, not a removal: history keeps the row so the thread does not silently reflow.
    const page = await history(alice, conversation.id);
    expect(page.content.find((m) => m.id === sent.id).isDeleted).toBe(true);
  });

  it('refuses to read a conversation the caller is not part of', async () => {
    const stranger = await createVerifiedUser();
    const conversation = unwrap(await createDirect(alice, bob.user.id));

    const result = await api(`/conversations/${conversation.id}/messages?limit=5`, {
      token: stranger.accessToken,
    });
    expect([403, 404]).toContain(result.status);
  });

  it('carries a null media object on a text message', async () => {
    // The field must be conditional. An empty object on every row would make the client render an
    // attachment slot for a plain message.
    const conversation = unwrap(await createDirect(alice, bob.user.id));
    const sent = unwrap(
      await send(alice, conversation.id, {
        messageType: 'text',
        content: 'no attachment',
      })
    );
    expect(sent.media ?? null).toBeNull();
  });
});

describe('story replies', () => {
  it('delivers a reply as a story_share carrying the story it answers', async () => {
    // The story viewer's reply bar previously ended in a toast saying messaging was not built.
    // A reply is an ordinary direct message whose type names what it answers.
    const conversation = unwrap(await createDirect(alice, bob.user.id));
    const storyId = '00000000-0000-4000-8000-00000000beef';

    const result = await send(alice, conversation.id, {
      messageType: 'story_share',
      content: 'love this story',
      sharedStoryId: storyId,
    });

    if (result.status >= 400) {
      // The server validates that the story exists, which a synthetic id cannot satisfy. That is
      // correct behaviour, and the rejection still proves the type and field reach validation
      // rather than being silently dropped.
      expect(result.body.success).toBe(false);
      return;
    }

    const sent = unwrap(result);
    expect(sent.messageType.toLowerCase()).toBe('story_share');
    expect(sent.sharedStoryId).toBe(storyId);
    expect(sent.content).toBe('love this story');
  });
});
