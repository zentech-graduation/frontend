import { v } from '@/config/tokens';
import { LxIcon } from '@/components/ui/lx-icon';

/**
 * A message attachment.
 *
 * Renders the real image or video when the server resolved one (`item.cdnUrl`). Shared posts and
 * stories carry no direct media of their own here, so those fall back to a labelled placeholder
 * rather than an empty box.
 */
export function MediaPlaceholder({ item, large = false, onClick }) {
  const isVideo = (item?.mediaType || '').toUpperCase() === 'VIDEO';

  if (item?.cdnUrl) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          width: '100%',
          minHeight: large ? 138 : 82,
          maxHeight: large ? 360 : 82,
          borderRadius: large ? 14 : 10,
          border: `1px solid ${v.border}`,
          background: v.surface,
          overflow: 'hidden',
          cursor: 'pointer',
          padding: 0,
          display: 'block',
          position: 'relative',
        }}
      >
        {isVideo ? (
          <video
            src={item.cdnUrl}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
            muted
            playsInline
          />
        ) : (
          <img
            src={item.cdnUrl}
            alt=""
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
          />
        )}
        {isVideo ? (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.18)',
            }}
          >
            <LxIcon name="play" filled size={large ? 26 : 18} color="#fff" />
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: large ? 138 : 82,
        borderRadius: large ? 14 : 10,
        border: `1px solid ${v.border}`,
        background: v.surface,
        color: v.ink3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <LxIcon name="image" size={large ? 22 : 18} color={v.ink3} />
        {large ? (
          <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>{item.label}</span>
        ) : null}
      </div>
    </button>
  );
}
