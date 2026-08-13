import { useEffect } from 'react';
import { v } from '@/config/tokens';
import { LxIcon } from '@/components/ui/lx-icon';
import { LxAvatar } from '@/components/ui/lx-avatar';
import { LxDropdownMenu } from '@/components/ui/lx-dropdown-menu';

export { LxIcon, LxAvatar, LxDropdownMenu };

export function LxTag({ children, active = false, onClick, size = 'md' }) {
  const sizes = {
    sm: { fontSize: 11, padding: '3px 9px' },
    md: { fontSize: 12, padding: '5px 12px' },
  };

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontFamily: v.fontBody,
        fontWeight: 500,
        borderRadius: 999,
        background: active ? v.accentDim : v.surface,
        color: active ? v.accentText : v.ink2,
        border: `1px solid ${active ? 'transparent' : v.border}`,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        transition: 'background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out',
        ...sizes[size],
      }}
    >
      {children}
    </span>
  );
}

export function LxBtn({ children, variant = 'primary', size = 'md', onClick, disabled = false, style = {} }) {
  const sizes = {
    sm: { fontSize: 12, padding: '5px 14px' },
    md: { fontSize: 14, padding: '9px 20px' },
    lg: { fontSize: 16, padding: '12px 28px' },
  };
  const variants = {
    primary: { background: v.accent, color: v.inkInverse, border: 'none' },
    secondary: { background: v.surface, color: v.ink, border: `1px solid ${v.border}` },
    ghost: { background: 'transparent', color: v.ink, border: `1px solid ${v.border}` },
    danger: { background: 'transparent', color: v.error, border: `1px solid ${v.error}` },
  };
  if (disabled) {
    variants.primary = { background: v.surfaceRaised, color: v.ink3, border: 'none' };
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: v.fontBody,
        fontWeight: 500,
        borderRadius: 999,
        cursor: disabled ? 'default' : 'pointer',
        letterSpacing: '-0.01em',
        textTransform: 'lowercase',
        transition: 'all 150ms ease-out',
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function LxDivider({ mx = 0 }) {
  return <div style={{ height: 1, background: v.border, margin: `0 ${mx}px` }} />;
}

export function LxBottomSheet({ open, onClose, children, height = '70vh' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: v.scrim,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms ease-out',
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 640,
          margin: '0 auto',
          background: v.base,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: `0 -20px 60px ${v.shadow18}`,
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1000,
          height,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: v.border }} />
        </div>
        {children}
      </div>
    </>
  );
}

export function LxModal({ open, onClose, title, children, actions }) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: v.scrim,
          zIndex: 1000,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: v.base,
          borderRadius: 12,
          width: 'calc(100% - 32px)',
          maxWidth: 320,
          boxShadow: `0 20px 60px ${v.shadow25}, 0 4px 16px ${v.shadow12}`,
          overflow: 'hidden',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {title ? (
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${v.border}`, fontFamily: v.fontDisplay, fontSize: 16, fontWeight: 600, color: v.ink }}>
            {title}
          </div>
        ) : null}
        <div style={{ padding: '20px', fontFamily: v.fontBody, fontSize: 14, color: v.ink2, lineHeight: 1.5 }}>
          {children}
        </div>
        {actions ? (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${v.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: v.surfaceRaised }}>
            {actions}
          </div>
        ) : null}
      </div>
    </>
  );
}
