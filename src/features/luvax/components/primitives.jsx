import { v } from '../constants/tokens';

// ─── Icons (Lucide style) ──────────────────────────────────────────────────
const ICONS = {
  home:     <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  explore:  <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></>,
  plus:     <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  message:  <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  chat:     <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  profile:  <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  bell:     <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  back:     <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
  edit:     <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></>,
  close:    <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  heart:    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  reply:    <><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></>,
  share:    <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>,
  image:    <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  video:    <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>,
  type:     <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>,
  hash:     <><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></>,
  bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  chevronRight: <polyline points="9 18 15 12 9 6"/>,
  send:     <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  more:     <><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></>,
  check:    <polyline points="20 6 9 17 4 12"/>,
  eye:      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
};

export function LxIcon({ name, size = 20, color, filled = false, stroke = 1.5 }) {
  const node = ICONS[name];
  if (!node) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
         fill={filled ? (color || v.ink) : 'none'}
         stroke={color || v.ink}
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {node}
    </svg>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────
export const AVATAR_COLORS = [v.avatar0, v.avatar1, v.avatar2, v.avatar3, v.avatar4, v.avatar5, v.avatar6];

export function LxAvatar({ size = 36, idx = 0, ring = false, hasStory = false, viewed = false }) {
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  if (hasStory) {
    return (
      <div style={{
        width: size + 6, height: size + 6,
        borderRadius: '50%',
        padding: 2,
        background: viewed ? v.border : v.accent,
        flexShrink: 0,
      }}>
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: color, border: `2px solid ${v.base}`,
        }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      flexShrink: 0,
      outline: ring ? `2px solid ${v.accent}` : 'none',
      outlineOffset: ring ? 2 : 0,
    }} />
  );
}

// ─── Tag / chip ────────────────────────────────────────────────────────────
export function LxTag({ children, active = false, onClick, size = 'md' }) {
  const sizes = {
    sm: { fontSize: 11, padding: '3px 9px' },
    md: { fontSize: 12, padding: '5px 12px' },
  };
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontFamily: v.fontBody, fontWeight: 500,
      borderRadius: 999,
      background: active ? v.accentDim : v.surface,
      color: active ? v.accentText : v.ink2,
      border: `1px solid ${active ? v.accentDim : v.border}`,
      cursor: onClick ? 'pointer' : 'default',
      whiteSpace: 'nowrap',
      transition: 'background 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out',
      ...sizes[size],
    }}>{children}</span>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────
export function LxBtn({ children, variant = 'primary', size = 'md', onClick, disabled = false, style = {} }) {
  const sizes = {
    sm: { fontSize: 12, padding: '5px 14px' },
    md: { fontSize: 14, padding: '9px 20px' },
    lg: { fontSize: 16, padding: '12px 28px' },
  };
  const variants = {
    primary:   { background: v.accent, color: v.inkInverse, border: 'none' },
    secondary: { background: v.surface, color: v.ink, border: `1px solid ${v.border}` },
    ghost:     { background: 'transparent', color: v.ink, border: `1px solid ${v.border}` },
    danger:    { background: 'transparent', color: v.error, border: `1px solid ${v.error}` },
  };
  if (disabled) {
    variants.primary = { background: v.surfaceRaised, color: v.ink3, border: 'none' };
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: v.fontBody, fontWeight: 500, borderRadius: 999,
      cursor: disabled ? 'default' : 'pointer', letterSpacing: '-0.01em',
      textTransform: 'lowercase',
      transition: 'all 150ms ease-out',
      ...sizes[size], ...variants[variant], ...style,
    }}>{children}</button>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────
export function LxDivider({ mx = 0 }) {
  return <div style={{ height: 1, background: v.border, margin: `0 ${mx}px` }} />;
}

// ─── Bottom Sheet ──────────────────────────────────────────────────────────
import { useEffect } from 'react';

export function LxBottomSheet({ open, onClose, children, height = '70vh' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: v.scrim,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 200ms ease-out',
        zIndex: 999,
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 640, margin: '0 auto',
        background: v.base,
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        boxShadow: `0 -20px 60px ${v.shadow18}`,
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 1000, height,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: v.border }} />
        </div>
        {children}
      </div>
    </>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────
export function LxModal({ open, onClose, title, children, actions }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: v.scrim,
        zIndex: 1000,
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: v.base, borderRadius: 12, width: 'calc(100% - 32px)', maxWidth: 320,
        boxShadow: `0 20px 60px ${v.shadow25}, 0 4px 16px ${v.shadow12}`, overflow: 'hidden',
        zIndex: 1001, display: 'flex', flexDirection: 'column'
      }}>
        {title && (
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${v.border}`, fontFamily: v.fontDisplay, fontSize: 16, fontWeight: 600, color: v.ink }}>
            {title}
          </div>
        )}
        <div style={{ padding: '20px', fontFamily: v.fontBody, fontSize: 14, color: v.ink2, lineHeight: 1.5 }}>
          {children}
        </div>
        {actions && (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${v.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: v.surfaceRaised }}>
            {actions}
          </div>
        )}
      </div>
    </>
  );
}

