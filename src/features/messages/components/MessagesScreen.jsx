import { v } from '@/features/luvax/constants/tokens';
import { LxAvatar, LxIcon } from '@/features/luvax/components/primitives';

const THREADS = [
  { id: 1, name: 'nora', snippet: 'saved that film lab for saturday', time: '2m', unread: true, idx: 1 },
  { id: 2, name: 'mina', snippet: 'the light in your last post was unreal', time: '18m', unread: true, idx: 4 },
  { id: 3, name: 'tuan', snippet: 'sending over the notes now', time: '1h', unread: false, idx: 2 },
  { id: 4, name: 'claire', snippet: 'let us keep this one quiet and small', time: 'yesterday', unread: false, idx: 5 },
];

export function MessagesScreen() {
  return (
    <div style={{ height: '100%', background: v.base, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${v.border}` }}>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          inbox
        </div>
        <div style={{ fontFamily: v.fontDisplay, fontSize: 24, lineHeight: 1.1, fontWeight: 700, color: v.ink }}>
          messages
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {THREADS.map((thread) => (
          <button
            key={thread.id}
            type="button"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: 'none',
              borderBottom: `1px solid ${v.borderSubtle}`,
              background: thread.unread ? v.accentDim : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <LxAvatar size={44} idx={thread.idx} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 600, color: v.ink }}>{thread.name}</span>
                <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{thread.time}</span>
              </div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {thread.snippet}
                </span>
                {thread.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: v.accent, flexShrink: 0 }} />}
              </div>
            </div>
            <LxIcon name="chevronRight" size={16} color={v.ink3} />
          </button>
        ))}
      </div>
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.MessagesScreen = MessagesScreen;
}
