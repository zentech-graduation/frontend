import { v } from '@/config/tokens';
import { LxAvatar } from '@/components/ui/lx-avatar';

export function AvatarVisual({ thread, size = 42 }) {
  if (thread.initials) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: thread.accent || v.surfaceRaised,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: v.ink,
          fontFamily: v.fontBody,
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {thread.initials}
      </div>
    );
  }

  return <LxAvatar size={size} idx={thread.idx} />;
}
