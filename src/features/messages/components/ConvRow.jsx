import { v } from '@/config/tokens';
import { AvatarVisual } from './AvatarVisual';

export function ConvRow({ thread, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        background: isActive ? v.accentDim : 'transparent',
        border: 'none',
        borderLeft: isActive ? `3px solid ${v.accent}` : '3px solid transparent',
        borderBottom: `1px solid ${v.borderSubtle}`,
        padding: '9px 14px 9px 14px',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '34px minmax(0, 1fr) auto',
        gap: 10,
        alignItems: 'center',
        textAlign: 'left',
        color: v.ink,
      }}
    >
      <AvatarVisual thread={thread} size={34} />
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 12.5, fontWeight: 700, color: v.ink }}>
          {thread.name}
        </div>
        <div
          style={{
            fontFamily: v.fontBody,
            fontSize: 11,
            color: thread.muted ? v.ink3 : v.ink2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {[thread.preview, thread.time].filter(Boolean).join(' · ')}
        </div>
      </div>
      {thread.unread ? (
        <span
          style={{
            minWidth: 16,
            height: 16,
            padding: '0 5px',
            borderRadius: 999,
            background: v.accent,
            color: v.ink,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: v.fontMono,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {thread.unread}
        </span>
      ) : null}
    </button>
  );
}
