import { v } from '@/config/tokens';
import { LxIcon } from '@/components/ui/lx-icon';

export function MediaPlaceholder({ item, large = false, onClick }) {
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
