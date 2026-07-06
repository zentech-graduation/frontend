import { useEffect, useMemo, useRef, useState } from 'react';
import { v } from '@/config/tokens';
import { LxDropdownMenu } from '@/components/ui/lx-dropdown-menu';
import { LxIcon } from '@/components/ui/lx-icon';
import { copyToClipboard } from '@/utils/helpers';
import { AvatarVisual } from './AvatarVisual';
import { MediaPlaceholder } from './MediaPlaceholder';

const AVATAR_SIZE = 21;
// Extends the hover/click target a few pixels past the bubble itself in every direction, so the
// actions button appears from a hover anywhere near the message rather than only on the bubble's
// exact pixels. The padding is cancelled by an equal negative margin, so neighbouring rows and the
// list's own gap do not move.
const HIT_PADDING = 7;

export function MessageBubble({
  message,
  activeThread,
  onPreviewMedia,
  onDeleteToggle,
  onReplyMessage,
  canDelete,
  viewport,
}) {
  const isMine = message.from === 'me';
  const isMobile = viewport === 'mobile';
  const isTouchLayout = viewport === 'mobile' || viewport === 'tablet';
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touchRevealed, setTouchRevealed] = useState(false);
  const menuButtonRef = useRef(null);
  const bubbleRowRef = useRef(null);
  const textForCopy =
    message.kind === 'reply'
      ? `${message.replyText}\n${message.text}`
      : message.kind === 'post'
        ? [message.handle, message.title, message.meta].filter(Boolean).join('\n')
        : message.kind === 'file'
          ? message.text
          : message.text;
  const canCopyText = Boolean(textForCopy);
  const menuItems = useMemo(
    () =>
      [
        message.kind !== 'deleted'
          ? {
              id: 'reply',
              icon: 'reply',
              label: 'Reply',
              onClick: () => onReplyMessage?.(message),
            }
          : null,
        canCopyText
          ? {
              id: 'copy',
              icon: 'link',
              label: 'Copy text',
              onClick: () => copyToClipboard(textForCopy),
            }
          : null,
        isMine && message.kind !== 'deleted'
          ? {
              id: 'delete',
              icon: 'trash',
              label: 'Delete',
              tone: 'danger',
              onClick: () => onDeleteToggle(message.id),
            }
          : null,
      ].filter(Boolean),
    [canDelete, message, onDeleteToggle, onReplyMessage, textForCopy]
  );
  const supportsHover =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const showActions = menuOpen || (!isTouchLayout && hovered) || (isTouchLayout && touchRevealed);

  const handleHoverStart = () => {
    setHovered(true);
  };

  const handleHoverEnd = () => {
    setHovered(false);
    if (!menuOpen) {
      setTouchRevealed(false);
    }
  };

  useEffect(() => {
    if (supportsHover || (!touchRevealed && !menuOpen)) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const bubbleRow = bubbleRowRef.current;
      const menuButton = menuButtonRef.current;
      if (bubbleRow?.contains(event.target) || menuButton?.contains(event.target)) {
        return;
      }
      setTouchRevealed(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen, supportsHover, touchRevealed]);

  const handleBubbleInteraction = () => {
    if (isTouchLayout || !supportsHover) {
      setTouchRevealed(true);
    }
  };

  const handleTouchMenuToggle = () => {
    if (!isTouchLayout) {
      return;
    }
    setTouchRevealed(false);
    setMenuOpen((open) => !open);
  };

  const bubbleBase = {
    maxWidth:
      message.kind === 'post' || message.kind === 'file'
        ? isMobile
          ? 196
          : 248
        : isMine
          ? isMobile
            ? 'min(100%, 264px)'
            : 440
          : isMobile
            ? 'min(100%, 224px)'
            : 300,
    borderRadius: 15,
    padding: message.kind === 'deleted' ? '9px 13px' : '9px 13px',
    fontFamily: v.fontBody,
    fontSize: 13.5,
    lineHeight: 1.42,
    position: 'relative',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  };

  // The other party's avatar sits at the bottom of their last bubble in a run, echoing how most
  // chat UIs collapse a burst of consecutive messages down to one identity marker. The viewer's
  // own messages never carry one - the reader already knows who those are. Mobile drops the column
  // entirely per the design brief, rather than just hiding the image inside it.
  const avatarSlot =
    isMobile || isMine ? null : message.showAvatar ? (
      <AvatarVisual
        thread={{ avatarUrl: message.senderAvatarUrl, name: message.senderName }}
        size={AVATAR_SIZE}
      />
    ) : (
      <div style={{ width: AVATAR_SIZE, flexShrink: 0 }} aria-hidden="true" />
    );

  const menuButtonStyle = {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 0.82,
    padding: 0,
    flexShrink: 0,
  };

  // The padding/negative-margin pair widens the hover and tap target past the bubble's own edges
  // without shifting this row's siblings apart - hovering "near" a message reveals its actions, not
  // only a precise hover on the bubble pixels themselves.
  const hitAreaStyle = {
    padding: HIT_PADDING,
    margin: -HIT_PADDING,
  };

  if (message.kind === 'deleted') {
    return (
      <div
        style={{
          alignSelf: 'flex-end',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
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
      </div>
    );
  }

  if (message.kind === 'file' || message.kind === 'post') {
    const isFile = message.kind === 'file';
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          flexDirection: isMine ? 'row-reverse' : 'row',
          ...hitAreaStyle,
        }}
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
        onPointerEnter={handleHoverStart}
        onPointerLeave={handleHoverEnd}
      >
        {avatarSlot}
        <div
          ref={bubbleRowRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexDirection: isMine ? 'row-reverse' : 'row',
          }}
          onPointerDown={handleBubbleInteraction}
          onClick={handleTouchMenuToggle}
        >
          {isFile ? (
            // A real photo or video is the bubble - no surrounding card, border, or padding
            // framing it. Chrome around a thumbnail read as over-designed next to a plain photo.
            <MediaPlaceholder
              item={
                message.media ? { ...message.media, label: message.text } : { label: message.text }
              }
              large
              onClick={() => onPreviewMedia(message.media || { label: message.text })}
            />
          ) : (
            <div
              style={{
                ...bubbleBase,
                background: isMine ? activeThread.accent || v.accentDim : v.surface,
                border: isMine ? 'none' : `1px solid ${v.border}`,
                padding: 9,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <MediaPlaceholder
                  item={{ label: message.handle }}
                  onClick={() => onPreviewMedia({ label: message.title })}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.accent }}>
                    {message.handle}
                  </div>
                  <div style={{ color: v.ink, fontSize: 12.5 }}>{message.title}</div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 7,
                      fontFamily: v.fontMono,
                      fontSize: 10,
                      color: v.ink3,
                    }}
                  >
                    <span>{message.meta}</span>
                    <button
                      type="button"
                      onClick={() => onPreviewMedia({ label: message.title })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: v.ink3,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      view
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showActions ? (
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="message actions"
              style={menuButtonStyle}
            >
              <LxIcon name="more" size={10} color={v.ink3} />
            </button>
          ) : null}
        </div>
        <LxDropdownMenu
          anchorRef={menuButtonRef}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
          width={172}
        />
      </div>
    );
  }

  return (
    <div
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      onPointerEnter={handleHoverStart}
      onPointerLeave={handleHoverEnd}
      style={{
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        flexDirection: isMine ? 'row-reverse' : 'row',
        ...hitAreaStyle,
      }}
    >
      {avatarSlot}
      <div
        ref={bubbleRowRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexDirection: isMine ? 'row-reverse' : 'row',
        }}
        onPointerDown={handleBubbleInteraction}
        onClick={handleTouchMenuToggle}
      >
        <div
          style={{
            ...bubbleBase,
            background: isMine ? activeThread.accent || v.accentDim : v.surface,
            color: v.ink,
            border: isMine ? 'none' : `1px solid ${v.border}`,
            minWidth: isMobile ? 0 : 76,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {message.kind === 'reply' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, color: v.ink2 }}>
                <span style={{ fontFamily: v.fontMono, fontSize: 10 }}>↳ {message.replyTo}</span>
                <span style={{ fontSize: 11.5 }}>{message.replyText}</span>
              </div>
              <strong style={{ fontWeight: 600 }}>{message.text}</strong>
            </div>
          ) : (
            message.text
          )}
        </div>
        {showActions ? (
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="message actions"
            style={menuButtonStyle}
          >
            <LxIcon name="more" size={10} color={isMine ? v.ink2 : v.ink3} />
          </button>
        ) : null}
      </div>
      <LxDropdownMenu
        anchorRef={menuButtonRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
        width={172}
      />
    </div>
  );
}
