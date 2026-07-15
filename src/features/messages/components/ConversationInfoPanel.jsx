import { v } from '../../luvax/constants/tokens';
import { AvatarVisual } from './AvatarVisual';
import { MediaPlaceholder } from './MediaPlaceholder';

export function ConversationInfoPanel({ activeThread, navigate, setPreviewItem }) {
  if (!activeThread) return null;

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: v.base,
        borderLeft: `1px solid ${v.borderSubtle}`,
      }}
    >
      <div
        style={{
          borderBottom: `1px solid ${v.border}`,
          padding: '28px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <AvatarVisual thread={activeThread} size={66} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: v.fontDisplay, fontSize: 18, fontWeight: 700, color: v.inkInverse }}>{activeThread.name}</div>
          <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 4 }}>@{activeThread.username}</div>
        </div>
        <button
          type="button"
          onClick={() => navigate('profile', { user: { id: activeThread.id, username: activeThread.username, displayName: activeThread.name } })}
          style={{
            height: 32,
            padding: '0 18px',
            borderRadius: 999,
            border: 'none',
            background: v.surface,
            color: v.inkInverse,
            fontFamily: v.fontBody,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          view profile
        </button>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          shared media
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {activeThread.media.map((item) => (
            <MediaPlaceholder key={item.id} item={item} onClick={() => setPreviewItem(item)} />
          ))}
        </div>
        <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, textAlign: 'center' }}>
          {activeThread.mediaLabel}
        </div>
      </div>
    </aside>
  );
}
