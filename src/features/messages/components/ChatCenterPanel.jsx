import { useEffect, useRef } from 'react';
import { v } from '@/config/tokens';
import { CHAR_LIMITS } from '@/config/constants';
import { LxIcon } from '@/components/ui/lx-icon';
import { AvatarVisual } from './AvatarVisual';
import { ConversationGreeting } from './ConversationGreeting';
import { MessageBubble } from './MessageBubble';

const DRAFT_MAX_HEIGHT = 108;

const autoResizeDraft = (element) => {
  if (!element) return;
  element.style.height = '0px';
  element.style.height = `${Math.min(element.scrollHeight, DRAFT_MAX_HEIGHT)}px`;
};

const ACCEPTED_ATTACHMENT_TYPES = 'image/*,video/*';

export function ChatCenterPanel({
  viewport,
  activeThread,
  setActiveThreadId,
  closeThread,
  openInfo,
  isDesktop,
  isTablet,
  showRightRail,
  scrollerRef,
  setPreviewItem,
  handleDeleteToggle,
  replyingTo,
  setReplyingTo,
  draft,
  setDraft,
  handleSend,
  onSendAttachment,
  isSendingAttachment,
}) {
  const draftInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onSendAttachment?.(file);
  };

  useEffect(() => {
    autoResizeDraft(draftInputRef.current);
  }, [draft, replyingTo]);

  // Hooks above this line. Both previously sat below it, so opening or closing a thread changed the
  // hook count between renders, which React resolves by binding state to the wrong slot.
  if (!activeThread) return null;

  const mobileHeaderIconButton = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: `1px solid ${v.borderSubtle}`,
    background: v.surface,
    cursor: 'pointer',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: 'none',
  };

  return (
    <section
      style={{
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateRows: '52px minmax(0, 1fr) auto',
        minWidth: 0,
        borderLeft: isDesktop || isTablet ? `1px solid ${v.borderSubtle}` : 'none',
        borderRight: showRightRail ? `1px solid ${v.border}` : 'none',
        background: v.base,
      }}
    >
      <div
        style={{
          borderBottom: `1px solid ${v.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: 'space-between',
          padding: viewport === 'mobile' ? '0 20px' : '0 18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: viewport === 'mobile' ? 10 : 12,
            minWidth: 0,
          }}
        >
          {viewport !== 'desktop' && viewport !== 'tablet' ? (
            <button type="button" onClick={() => closeThread()} style={mobileHeaderIconButton}>
              <LxIcon name="chevronLeft" size={15} color={v.ink2} />
            </button>
          ) : null}
          <AvatarVisual thread={activeThread} size={32} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <div style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 700, color: v.ink }}>
              {activeThread.name}
            </div>
            <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>
              @{activeThread.username}
            </div>
          </div>
        </div>
        {viewport === 'mobile' ? (
          <button
            type="button"
            onClick={() => openInfo?.()}
            aria-label="open chat info"
            style={mobileHeaderIconButton}
          >
            <LxIcon name="alert" size={17} color={v.ink2} />
          </button>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        style={{
          overflowY: 'auto',
          padding: viewport === 'mobile' ? '14px 20px' : '16px 18px 10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            minHeight: '100%',
            justifyContent: activeThread.messages.length <= 1 ? 'space-between' : 'flex-start',
          }}
        >
          <ConversationGreeting messageCount={activeThread.messages.length} />
          {activeThread.rows.map((row, index) =>
            row.rowType === 'separator' ? (
              <div
                key={row.id}
                role="separator"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '4px 0',
                }}
              >
                <span
                  style={{
                    fontFamily: v.fontMono,
                    fontSize: 10,
                    color: v.ink3,
                    letterSpacing: '0.02em',
                  }}
                >
                  {row.label}
                </span>
              </div>
            ) : (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  justifyContent: row.from === 'me' ? 'flex-end' : 'flex-start',
                  minHeight:
                    activeThread.messages.length <= 1 && index === 0 && isDesktop ? 360 : 'auto',
                  alignItems:
                    activeThread.messages.length <= 1 && index === 0 && isDesktop
                      ? 'flex-start'
                      : 'stretch',
                }}
              >
                <MessageBubble
                  message={row}
                  viewport={viewport}
                  activeThread={activeThread}
                  onPreviewMedia={setPreviewItem}
                  onDeleteToggle={handleDeleteToggle}
                  onReplyMessage={setReplyingTo}
                  canDelete={
                    row.from === 'me' &&
                    row.kind !== 'deleted' &&
                    activeThread.messages.findIndex((message) => message.id === row.id) >=
                      activeThread.messages.length - 2
                  }
                />
              </div>
            )
          )}
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${v.border}`,
          padding: '10px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {replyingTo ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '0 2px',
              fontFamily: v.fontMono,
              fontSize: 10.5,
              color: v.accentText,
            }}
          >
            <div
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: 6 }}>
                ↩ replying to {replyingTo.from === 'me' ? 'you' : activeThread.name}
              </span>
              <span style={{ color: v.ink2 }}>{replyingTo.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.14)',
                border: 'none',
                color: v.ink3,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 10,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ) : null}

        {/* `flex-end` keeps the attach/send buttons pinned to the bottom of the pill as it grows
            with the draft, next to the last line of text. Centering them against the row - the
            previous approach - looked fine for one line and left them stranded in the middle of
            empty space once the draft wrapped to several. */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <input
            ref={attachmentInputRef}
            type="file"
            accept={ACCEPTED_ATTACHMENT_TYPES}
            onChange={handleAttachmentChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            disabled={isSendingAttachment}
            aria-label="attach a photo, video, or gif"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: `1px solid ${v.borderSubtle}`,
              background: v.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSendingAttachment ? 'wait' : 'pointer',
              opacity: isSendingAttachment ? 0.6 : 1,
              flexShrink: 0,
            }}
          >
            <LxIcon name="image" size={14} color={v.ink3} />
          </button>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 32,
              borderRadius: 18,
              background: v.surfaceSunken,
              border: `1px solid ${v.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              padding: '7px 13px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <textarea
              ref={draftInputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={CHAR_LIMITS.message}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder={replyingTo ? 'write a reply...' : 'say something real...'}
              rows={1}
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 16,
                maxHeight: DRAFT_MAX_HEIGHT,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: v.ink,
                fontFamily: v.fontBody,
                fontSize: 13.5,
                lineHeight: 1.4,
                resize: 'none',
                overflowY: 'auto',
                padding: 0,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label="send message"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: v.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: draft.trim() ? 'pointer' : 'default',
              opacity: draft.trim() ? 1 : 0.5,
              flexShrink: 0,
            }}
          >
            <LxIcon name="send" size={14} color={v.ink} />
          </button>
        </div>
      </div>
    </section>
  );
}
