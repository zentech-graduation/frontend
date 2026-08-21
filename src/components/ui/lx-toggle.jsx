import { v } from '@/config/tokens';

export function LxToggle({ on, onChange, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={
        disabled
          ? undefined
          : (event) => {
              event.stopPropagation();
              onChange(!on);
            }
      }
      style={{
        width: 38,
        height: 22,
        borderRadius: 999,
        background: on ? v.accent : v.surfaceRaised,
        border: 'none',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 150ms ease-out',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 18 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: v.white,
          transition: 'left 150ms ease-out',
          boxShadow: `0 1px 3px ${v.shadow18}`,
        }}
      />
    </button>
  );
}
