import { useEffect, useMemo, useRef, useState } from 'react';
import { v } from '@/config/tokens';
import { LxDropdownMenu } from '@/components/ui/lx-dropdown-menu';
import { LxIcon } from '@/components/ui/lx-icon';
import { copyToClipboard } from '@/utils/helpers';
import { MediaPlaceholder } from './MediaPlaceholder';

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
          ? 228
          : 292
        : isMine
          ? isMobile
            ? 'min(100%, 286px)'
            : 520
          : isMobile
            ? 'min(100%, 244px)'
            : 340,
    borderRadius: 18,
    padding: message.kind === 'deleted' ? '12px 16px' : '14px 16px',
    fontFamily: v.fontBody,
    fontSize: 15,
    lineHeight: 1.45,
    position: 'relative',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  };

  if (message.kind === 'deleted') {
    return (
      <div
        style={{
          alignSelf: 'flex-end',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
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
        <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
      </div>
    );
  }

  if (message.kind === 'file') {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
        onPointerEnter={handleHoverStart}
        onPointerLeave={handleHoverEnd}
      >
        <div
          ref={bubbleRowRef}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onMouseMove={handleHoverStart}
          onPointerMove={handleHoverStart}
          onPointerDown={handleBubbleInteraction}
        >
          <div
            style={{
              ...bubbleBase,
              background: v.surface,
              border: `1px solid ${v.border}`,
              padding: 12,
            }}
          >
            <MediaPlaceholder
              item={{ label: message.text }}
              large
              onClick={() => onPreviewMedia({ label: message.text })}
            />
          </div>
          {showActions ? (
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="message actions"
              style={{
                width: 22,
                height: 22,
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
              }}
            >
              <LxIcon name="more" size={11} color={v.ink3} />
            </button>
          ) : null}
        </div>
        <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
        <LxDropdownMenu
          anchorRef={menuButtonRef}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
          width={182}
        />
      </div>
    );
  }

  if (message.kind === 'post') {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
        onPointerEnter={handleHoverStart}
        onPointerLeave={handleHoverEnd}
      >
        <div
          ref={bubbleRowRef}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onMouseMove={handleHoverStart}
          onPointerMove={handleHoverStart}
          onPointerDown={handleBubbleInteraction}
        >
          <div
            style={{
              ...bubbleBase,
              background: v.surface,
              border: `1px solid ${v.border}`,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MediaPlaceholder
                item={{ label: message.handle }}
                onClick={() => onPreviewMedia({ label: message.title })}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.accent }}>
                  {message.handle}
                </div>
                <div style={{ color: v.ink, fontSize: 14 }}>{message.title}</div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    fontFamily: v.fontMono,
                    fontSize: 11,
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
          {showActions ? (
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="message actions"
              style={{
                width: 22,
                height: 22,
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
              }}
            >
              <LxIcon name="more" size={11} color={v.ink3} />
            </button>
          ) : null}
        </div>
        <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
        <LxDropdownMenu
          anchorRef={menuButtonRef}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
          width={182}
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
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
        gap: 4,
      }}
    >
      <div
        ref={bubbleRowRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexDirection: isMine ? 'row-reverse' : 'row',
        }}
        onMouseMove={handleHoverStart}
        onPointerMove={handleHoverStart}
        onPointerDown={handleBubbleInteraction}
        onClick={handleTouchMenuToggle}
      >
        <div
          style={{
            ...bubbleBase,
            background: isMine ? activeThread.accent || v.accentDim : v.surface,
            color: v.ink,
            border: isMine ? 'none' : `1px solid ${v.border}`,
            minWidth: isMobile ? 0 : 94,
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {message.kind === 'reply' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, color: v.ink2 }}>
                <span style={{ fontFamily: v.fontMono, fontSize: 11 }}>↳ {message.replyTo}</span>
                <span style={{ fontSize: 13 }}>{message.replyText}</span>
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
            style={{
              width: 22,
              height: 22,
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
            }}
          >
            <LxIcon name="more" size={11} color={isMine ? v.ink2 : v.ink3} />
          </button>
        ) : null}
      </div>
      <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
      <LxDropdownMenu
        anchorRef={menuButtonRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
        width={182}
      />
    </div>
  );
}
