import { v } from '@/config/tokens';
import { AvatarVisual } from './AvatarVisual';

/**
 * The notice shown in a conversation nobody has written in yet.
 *
 * Deliberately not a `MessageBubble`. It states something about the relationship rather than
 * something either person said, and there is no message row behind it: a mutual-follow
 * conversation is created by the follow itself, so an empty thread is the normal starting state
 * rather than an error. Rendering the greeting from that emptiness costs nothing and adds no
 * schema.
 *
 * `pending` is the other empty case: a profile's "message" button, before a conversation exists
 * at all. "You're now friends" would be false there - the two may not even follow each other -
 * so this shows who the message will go to instead of asserting a relationship.
 */
export function ConversationGreeting({ messageCount, pending, name, avatarUrl }) {
  if (messageCount > 0) return null;

  if (pending) {
    return (
      <div
        style={{
          alignSelf: 'center',
          margin: 'auto 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <AvatarVisual thread={{ avatarUrl, name }} size={56} />
        <div style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 700, color: v.ink }}>
          {name}
        </div>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: v.surface,
            color: v.ink3,
            fontFamily: v.fontBody,
            fontSize: 12,
          }}
        >
          say hi to start the conversation
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        alignSelf: 'center',
        margin: 'auto 0',
        padding: '6px 14px',
        borderRadius: 999,
        background: v.surface,
        color: v.ink3,
        fontFamily: v.fontBody,
        fontSize: 12,
      }}
    >
      You&apos;re now friends. Say hi!
    </div>
  );
}
