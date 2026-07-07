import { useMemo, useRef, useState } from 'react';
import { v } from '@/config/tokens';
import { LxIcon } from '@/components/ui/lx-icon';
import { LxDropdownMenu } from '@/components/ui/lx-dropdown-menu';
import { AvatarVisual } from './AvatarVisual';

/**
 * One row in the conversation list.
 *
 * The row itself is a plain `div`, not a `button`: it needs to contain the options trigger as its
 * own interactive child, and a button cannot nest another button. `onSelect` fires from a click
 * anywhere on the row except that child, which stops the click reaching here.
 */
export function ConvRow({
  thread,
  isActive,
  onSelect,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onReport,
  onBlock,
  onPin,
  onUnpin,
  onMute,
  onUnmute,
  onRename,
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const showOptions = hovered || menuOpen;

  const menuItems = useMemo(
    () =>
      [
        thread.unread
          ? { id: 'read', icon: 'check', label: 'Mark as read', onClick: () => onMarkRead?.() }
          : {
              id: 'unread',
              icon: 'chat',
              label: 'Mark as unread',
              onClick: () => onMarkUnread?.(),
            },
        thread.pinned
          ? { id: 'unpin', icon: 'pin', label: 'Unpin chat', onClick: () => onUnpin?.() }
          : { id: 'pin', icon: 'pin', label: 'Pin chat', onClick: () => onPin?.() },
        thread.muted
          ? { id: 'unmute', icon: 'bell', label: 'Unmute', onClick: () => onUnmute?.() }
          : { id: 'mute', icon: 'bellOff', label: 'Mute', onClick: () => onMute?.() },
        onRename
          ? { id: 'rename', icon: 'edit', label: 'Set nickname', onClick: () => onRename?.() }
          : null,
        {
          id: 'delete',
          icon: 'trash',
          label: 'Delete chat',
          tone: 'danger',
          onClick: () => onDelete?.(),
        },
        onReport
          ? { id: 'report', icon: 'flag', label: 'Report', onClick: () => onReport?.() }
          : null,
        onBlock
          ? { id: 'block', icon: 'ban', label: 'Block', tone: 'danger', onClick: () => onBlock?.() }
          : null,
      ].filter(Boolean),
    [
      thread.unread,
      thread.pinned,
      thread.muted,
      onMarkRead,
      onMarkUnread,
      onPin,
      onUnpin,
      onMute,
      onUnmute,
      onRename,
      onDelete,
      onReport,
      onBlock,
    ]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect?.();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        background: isActive ? v.accentDim : 'transparent',
        borderLeft: isActive ? `3px solid ${v.accent}` : '3px solid transparent',
        borderBottom: `1px solid ${v.borderSubtle}`,
        padding: '9px 14px 9px 14px',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '34px minmax(0, 1fr) auto',
        gap: 10,
        alignItems: 'center',
        textAlign: 'left',
        color: v.ink,
      }}
    >
      <AvatarVisual thread={thread} size={34} />
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: v.fontBody,
            fontSize: 12.5,
            fontWeight: 700,
            color: v.ink,
          }}
        >
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {thread.name}
          </span>
          {thread.pinned ? <LxIcon name="pin" size={10} filled color={v.ink3} /> : null}
          {thread.muted ? <LxIcon name="bellOff" size={11} color={v.ink3} /> : null}
        </div>
        <div
          style={{
            fontFamily: v.fontBody,
            fontSize: 11,
            color: thread.muted ? v.ink3 : v.ink2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {[thread.preview, thread.time].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {!showOptions && thread.unread ? (
          <span
            style={{
              minWidth: 16,
              height: 16,
              padding: '0 5px',
              borderRadius: 999,
              background: v.accent,
              color: v.ink,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: v.fontMono,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {thread.unread}
          </span>
        ) : null}
        {showOptions ? (
          <button
            type="button"
            ref={menuButtonRef}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            aria-label={`options for ${thread.name}`}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <LxIcon name="more" size={13} color={v.ink3} />
          </button>
        ) : null}
      </div>
      <div onClick={(event) => event.stopPropagation()}>
        <LxDropdownMenu
          anchorRef={menuButtonRef}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
          align="right"
        />
      </div>
    </div>
  );
}
