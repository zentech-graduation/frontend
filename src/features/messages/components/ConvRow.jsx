import { v } from '../../luvax/constants/tokens';
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
        padding: '11px 14px 11px 14px',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '40px minmax(0, 1fr) auto',
        gap: 11,
        alignItems: 'center',
        textAlign: 'left',
        color: v.ink,
      }}
    >
      <AvatarVisual thread={thread} />
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 13.5, fontWeight: 700, color: v.ink }}>
          {thread.name}
        </div>
        <div style={{ fontFamily: v.fontBody, fontSize: 11.5, color: thread.muted ? v.ink3 : v.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {thread.preview} · {thread.time}
        </div>
      </div>
      {thread.unread ? (
        <span
          style={{
            minWidth: 18,
            height: 18,
            padding: '0 6px',
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
