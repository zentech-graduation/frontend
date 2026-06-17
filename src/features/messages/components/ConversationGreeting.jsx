import { v } from '@/config/tokens';

/**
 * The notice shown in a conversation nobody has written in yet.
 *
 * Deliberately not a `MessageBubble`. It states something about the relationship rather than
 * something either person said, and there is no message row behind it: the conversation is created
 * by the mutual follow itself, so an empty thread is the normal starting state rather than an
 * error. Rendering the greeting from that emptiness costs nothing and adds no schema.
 */
export function ConversationGreeting({ messageCount }) {
  if (messageCount > 0) return null;

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
