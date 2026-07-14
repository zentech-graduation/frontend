import { v } from '../../luvax/constants/tokens';
import { LxIcon } from '../../luvax/components/primitives';
import { AvatarVisual } from './AvatarVisual';
import { MessageBubble } from './MessageBubble';

export function ChatCenterPanel({
  viewport,
  activeThread,
  setActiveThreadId,
  isDesktop,
  isTablet,
  showRightRail,
  scrollerRef,
  setPreviewItem,
  handleDeleteToggle,
  draft,
  setDraft,
  handleSend,
}) {
  if (!activeThread) return null;

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateRows: '60px minmax(0, 1fr) 60px',
        minWidth: 0,
        borderLeft: isDesktop || isTablet ? `1px solid ${v.borderSubtle}` : 'none',
        borderRight: showRightRail ? `1px solid ${v.border}` : 'none',
        background: v.base,
      }}
    >
      <div
        style={{
          borderBottom: `1px solid ${v.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 18px',
        }}
      >
        {viewport !== 'desktop' && viewport !== 'tablet' ? (
          <button
            type="button"
            onClick={() => setActiveThreadId(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <LxIcon name="back" size={18} color={v.ink3} />
          </button>
        ) : null}
        <AvatarVisual thread={activeThread} size={40} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 700, color: v.inkInverse }}>{activeThread.name}</div>
          <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>@{activeThread.username}</div>
        </div>
      </div>

      <div ref={scrollerRef} style={{ overflowY: 'auto', padding: viewport === 'mobile' ? '18px 16px' : '20px 22px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minHeight: '100%', justifyContent: activeThread.messages.length <= 1 ? 'space-between' : 'flex-start' }}>
          {activeThread.messages.map((message, index) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.from === 'me' ? 'flex-end' : 'flex-start',
                minHeight: activeThread.messages.length <= 1 && index === 0 && isDesktop ? 420 : 'auto',
                alignItems: activeThread.messages.length <= 1 && index === 0 && isDesktop ? 'flex-start' : 'stretch',
              }}
            >
              <MessageBubble
                message={message}
                activeThread={activeThread}
                onPreviewMedia={setPreviewItem}
                onDeleteToggle={handleDeleteToggle}
                canDelete={message.from === 'me' && message.kind !== 'deleted' && index >= activeThread.messages.length - 2}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${v.border}`,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setDraft((current) => `${current}${current ? ' ' : ''}[attachment]`)}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: v.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <LxIcon name="more" size={15} color={v.ink3} />
        </button>
        <div
          style={{
            flex: 1,
            height: 38,
            borderRadius: 999,
            background: v.surfaceSunken,
            border: `1px solid ${v.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="say something real..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: v.inkInverse,
              fontFamily: v.fontBody,
              fontSize: 15,
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          aria-label="send message"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: v.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <LxIcon name="send" size={16} color="#f7f3eb" />
        </button>
      </div>
    </section>
  );
}
