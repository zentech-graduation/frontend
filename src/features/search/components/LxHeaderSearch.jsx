import { v } from '@/features/luvax/constants/tokens';
import { LxIcon } from '@/features/luvax/components/primitives';

export function LxHeaderSearch({ onClick, viewport = 'desktop' }) {
  const isTablet = viewport === 'tablet';

  return (
    <button
      type="button"
      aria-label="search"
      onClick={onClick}
      style={{
        width: isTablet ? '100%' : 220,
        minWidth: isTablet ? 0 : 180,
        height: 36,
        padding: '0 12px',
        borderRadius: 999,
        border: `1px solid ${v.border}`,
        background: v.surface,
        color: v.ink3,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isTablet ? 'flex-start' : 'center',
        gap: 8,
        fontFamily: v.fontBody,
        fontSize: 13,
      }}
    >
      <LxIcon name="explore" size={15} color={v.ink3} />
      <span>search</span>
    </button>
  );
}

if (typeof window !== 'undefined') {
  window.LxHeaderSearch = LxHeaderSearch;
}
