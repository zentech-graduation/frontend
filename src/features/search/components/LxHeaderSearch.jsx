import { v } from '@/features/luvax/constants/tokens';
import { LxIcon } from '@/features/luvax/components/primitives';

export function LxHeaderSearch({ navigate, viewport }) {
  return (
    <button
      type="button"
      onClick={() => navigate('explore')}
      aria-label="open search"
      className="lx-search-btn"
      style={{
        width: viewport === 'tablet' ? 184 : 206,
        minWidth: 0,
        flexShrink: 0,
        height: viewport === 'tablet' ? 32 : 36,
        padding: '0 14px',
        border: `1px solid ${v.borderSubtle}`,
        borderRadius: 999,
        background: v.surface,
        color: v.ink3,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transform: 'translateY(0px)',
        cursor: 'pointer',
        fontFamily: v.fontBody,
        fontSize: 13,
        letterSpacing: '-0.01em',
        transition: 'background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out',
      }}
    >
      <LxIcon name="explore" size={15} color={v.ink3} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        search
      </span>
    </button>
  );
}

if (typeof window !== 'undefined') {
  window.LxHeaderSearch = LxHeaderSearch;
}
