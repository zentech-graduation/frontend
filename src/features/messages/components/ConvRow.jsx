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
  viewport,
  revealedOptions = false,
  onRevealOptions,
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const dragStartRef = useRef(null);
  const swipedRef = useRef(false);
  const isMobile = viewport === 'mobile';
  const showOptions = (isMobile && revealedOptions) || hovered || menuOpen;

  // Combines the counted unread total with the caller's independent manual flag: clearing the
  // read marker alone has no effect when the viewer sent the conversation's own newest messages,
  // so the toggle (and the badge below) must reflect both, not the count on its own.
  const isUnread = thread.unread > 0 || thread.manuallyUnread;

  const menuItems = useMemo(
    () =>
      [
        isUnread
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
          separator: true,
          onClick: () => onDelete?.(),
        },
        onReport
          ? {
              id: 'report',
              icon: 'flag',
              label: 'Report',
              tone: 'danger',
              onClick: () => onReport?.(),
            }
          : null,
        onBlock
          ? { id: 'block', icon: 'ban', label: 'Block', tone: 'danger', onClick: () => onBlock?.() }
          : null,
      ].filter(Boolean),
    [
      isUnread,
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
  const mobileQuickActions = useMemo(
    () =>
      [
        onBlock
          ? { id: 'block', icon: 'ban', label: 'block', tone: 'danger', onClick: () => onBlock?.() }
          : null,
        onReport
          ? {
              id: 'report',
              icon: 'flag',
              label: 'report',
              tone: 'danger',
              onClick: () => onReport?.(),
            }
          : null,
      ].filter(Boolean),
    [onBlock, onReport]
  );
  const dropdownItems =
    isMobile && revealedOptions
      ? menuItems.filter((item) => item.id !== 'block' && item.id !== 'report')
      : menuItems;

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
      onPointerDown={(event) => {
        if (isMobile) {
          dragStartRef.current = { x: event.clientX, y: event.clientY };
          swipedRef.current = false;
        }
      }}
      onPointerMove={(event) => {
        if (!isMobile || !dragStartRef.current) return;
        const dx = event.clientX - dragStartRef.current.x;
        const dy = Math.abs(event.clientY - dragStartRef.current.y);
        if (Math.abs(dx) > 18 && dy < 22) {
          swipedRef.current = true;
          onRevealOptions?.();
          dragStartRef.current = null;
        }
      }}
      onPointerUp={() => {
        if (isMobile && !swipedRef.current && !revealedOptions) onRevealOptions?.();
        dragStartRef.current = null;
      }}
      style={{
        width: '100%',
        background: isActive ? v.accentDim : 'transparent',
        borderLeft: isActive ? `3px solid ${v.accent}` : '3px solid transparent',
        borderBottom: `1px solid ${v.borderSubtle}`,
        padding: '9px 14px 9px 14px',
        cursor: 'pointer',
        touchAction: 'pan-y',
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
        {!showOptions && thread.unread > 0 ? (
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
        ) : !showOptions && thread.manuallyUnread ? (
          // No count to show - manually flagged with nothing new to number - so a plain dot
          // signals "unread" the same way the number does, without inventing a fake count.
          <span
            aria-label="unread"
            style={{ width: 8, height: 8, borderRadius: '50%', background: v.accent }}
          />
        ) : null}
        {showOptions && isMobile && revealedOptions
          ? mobileQuickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  action.onClick();
                }}
                aria-label={`${action.label} ${thread.name}`}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: 'none',
                  background: action.tone === 'danger' ? v.errorDim : v.surfaceRaised,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <LxIcon
                  name={action.icon}
                  size={13}
                  color={action.tone === 'danger' ? v.error : v.ink3}
                />
              </button>
            ))
          : null}
        {showOptions ? (
          <button
            type="button"
            ref={menuButtonRef}
            onClick={(event) => {
              event.stopPropagation();
              onRevealOptions?.();
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
      {/* display: contents keeps this wrapper out of the row's own grid layout - otherwise it
          becomes an unaccounted-for 4th item against a 3-column grid, auto-flowing into an
          implicit second row that adds a full row-gap of dead space below the row's content. */}
      <div style={{ display: 'contents' }} onClick={(event) => event.stopPropagation()}>
        <LxDropdownMenu
          anchorRef={menuButtonRef}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={dropdownItems}
          align="right"
        />
      </div>
    </div>
  );
}
