import { v } from '../../luvax/constants/tokens';
import { LxIcon } from '../../luvax/components/primitives';
import { MediaPlaceholder } from './MediaPlaceholder';

export function MessageBubble({ message, activeThread, onPreviewMedia, onDeleteToggle, canDelete }) {
  const isMine = message.from === 'me';
  const bubbleBase = {
    maxWidth: message.kind === 'post' || message.kind === 'file' ? 292 : 220,
    borderRadius: 18,
    padding: message.kind === 'deleted' ? '12px 16px' : '14px 16px',
    fontFamily: v.fontBody,
    fontSize: 15,
    lineHeight: 1.45,
    position: 'relative',
  };

  if (message.kind === 'deleted') {
    return (
      <div style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div
          style={{
            ...bubbleBase,
            background: 'transparent',
            color: v.ink3,
            border: `1px dashed ${v.borderStrong}`,
            fontStyle: 'italic',
          }}
        >
          {message.text}
        </div>
        <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
      </div>
    );
  }

  if (message.kind === 'file') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            ...bubbleBase,
            background: v.surface,
            border: `1px solid ${v.border}`,
            padding: 12,
          }}
        >
          <MediaPlaceholder item={{ label: message.text }} large onClick={() => onPreviewMedia({ label: message.text })} />
        </div>
        <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
      </div>
    );
  }

  if (message.kind === 'post') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            ...bubbleBase,
            background: v.surface,
            border: `1px solid ${v.border}`,
            padding: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MediaPlaceholder item={{ label: message.handle }} onClick={() => onPreviewMedia({ label: message.title })} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.accent }}>{message.handle}</div>
              <div style={{ color: v.ink, fontSize: 14 }}>{message.title}</div>
              <div style={{ display: 'flex', gap: 8, fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
                <span>{message.meta}</span>
                <button
                  type="button"
                  onClick={() => onPreviewMedia({ label: message.title })}
                  style={{ background: 'none', border: 'none', color: v.ink3, cursor: 'pointer', padding: 0 }}
                >
                  view
                </button>
              </div>
            </div>
          </div>
        </div>
        <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
        gap: 4,
      }}
    >
      <div
        style={{
          ...bubbleBase,
          background: isMine ? activeThread.accent || v.accentDim : v.surface,
          color: isMine ? v.inkInverse : v.ink,
          border: isMine ? 'none' : `1px solid ${v.border}`,
          minWidth: 94,
        }}
      >
        {message.kind === 'reply' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, color: 'rgba(249,247,244,0.76)' }}>
              <span style={{ fontFamily: v.fontMono, fontSize: 11 }}>↳ {message.replyTo}</span>
              <span style={{ fontSize: 13 }}>{message.replyText}</span>
            </div>
            <strong style={{ fontWeight: 600 }}>{message.text}</strong>
          </div>
        ) : (
          message.text
        )}
        {canDelete ? (
          <button
            type="button"
            onClick={() => onDeleteToggle(message.id)}
            aria-label="delete message"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: `1px solid ${v.borderSubtle}`,
              background: v.surfaceRaised,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0.72,
            }}
          >
            <LxIcon name="more" size={12} color={isMine ? v.inkInverse : v.ink3} />
          </button>
        ) : null}
      </div>
      <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
    </div>
  );
}
