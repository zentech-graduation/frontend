import { v } from '../../luvax/constants/tokens';
import { AvatarVisual } from './AvatarVisual';

export function ConvRow({ thread, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        background: isActive ? '#4a4331' : 'transparent',
        border: 'none',
        borderLeft: isActive ? `3px solid ${v.accent}` : '3px solid transparent',
        borderBottom: `1px solid ${v.borderSubtle}`,
        padding: '13px 18px 13px 16px',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '42px minmax(0, 1fr) auto',
        gap: 12,
        alignItems: 'center',
        textAlign: 'left',
        color: v.inkInverse,
      }}
    >
      <AvatarVisual thread={thread} />
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 700, color: v.inkInverse }}>
          {thread.name}
        </div>
        <div style={{ fontFamily: v.fontBody, fontSize: 12, color: thread.muted ? v.ink3 : '#d7c39d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
