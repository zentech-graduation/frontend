import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v } from '@/config/tokens';
import { useAuthStore } from '@/store/useAuthStore';
import { toThread, toThreadSummary } from './utils/messageViewModel';
import {
  conversationsKey,
  useConversations,
  useMarkRead,
  useMarkUnread,
  useLeaveConversation,
  usePinConversation,
  useUnpinConversation,
  useMuteConversation,
  useUnmuteConversation,
  useSetNickname,
} from './hooks/useConversations';
import { useMessages, useDeleteMessage, useSendMessage } from './hooks/useMessages';
import { useLiveMessages } from './hooks/useLiveMessages';
import { ConversationListPanel } from './components/ConversationListPanel';
import { ChatCenterPanel } from './components/ChatCenterPanel';
import { ConversationInfoPanel } from './components/ConversationInfoPanel';
import { MediaPlaceholder } from './components/MediaPlaceholder';
import { PersonPicker } from './components/PersonPicker';
import { messageService } from '@/services/message.service';
import { REPORT_TYPES } from '@/services/report.service';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useLuvaxTweaks } from '@/features/luvax/LuvaxTweaksContext';
import { toast } from '@/features/luvax/components/Toast';
import { useMediaUpload } from '@/features/luvax/hooks/useMediaUpload';
import { useBlock } from '@/features/luvax/hooks/useSocial';
import { ReportModal } from '@/features/luvax/components/ReportModal';
import { BlockConfirmDialog } from '@/features/luvax/components/BlockConfirmDialog';

export function MessagesScreen() {
  const { viewport } = useLuvaxTweaks();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { conversations, isLoading: conversationsLoading } = useConversations();
  // The adapter owns every mapping from the API shape onto what these panels render.
  const threads = useMemo(
    () => conversations.map((conversation) => toThreadSummary(conversation, currentUserId)),
    [conversations, currentUserId]
  );
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [threadOpen, setThreadOpen] = useState(viewport !== 'mobile');
  const [infoOpen, setInfoOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState(null);
  const [deleteThreadTarget, setDeleteThreadTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [nicknameTarget, setNicknameTarget] = useState(null);
  const [nicknameValue, setNicknameValue] = useState('');
  const [composing, setComposing] = useState(false);
  const queryClient = useQueryClient();
  const listOnlyMobile = viewport === 'mobile' && !threadOpen;
  const scrollerRef = useRef(null);

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter(
      (thread) =>
        thread.name.toLowerCase().includes(query) ||
        thread.username.toLowerCase().includes(query) ||
        thread.preview.toLowerCase().includes(query)
    );
  }, [search, threads]);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeThreadId) || null;
  const { messages: activeMessages } = useMessages(activeConversation?.id);
  const activeThread = activeConversation
    ? toThread(activeConversation, activeMessages, currentUserId)
    : null;

  useLiveMessages(activeConversation?.id);

  const markRead = useMarkRead();
  const markUnread = useMarkUnread();
  const leaveConversation = useLeaveConversation();
  const pinConversation = usePinConversation();
  const unpinConversation = useUnpinConversation();
  const muteConversation = useMuteConversation();
  const unmuteConversation = useUnmuteConversation();
  const setNickname = useSetNickname();
  const block = useBlock();
  const sendMessage = useSendMessage(activeConversation?.id);
  const deleteMessage = useDeleteMessage(activeConversation?.id);
  const { uploadMedia } = useMediaUpload();

  useEffect(() => {
    if (activeConversation?.id) {
      markRead.mutate(activeConversation.id);
    }
    // markRead is recreated each render; depending on it would re-fire the mutation continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id]);

  useEffect(() => {
    if (!activeThreadId && filteredThreads[0]) {
      if (viewport !== 'mobile') {
        // Reconciles the selected thread with the thread list after it changes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveThreadId(filteredThreads[0].id);
      }
    } else if (activeThreadId && !threads.some((thread) => thread.id === activeThreadId)) {
      setActiveThreadId(threads[0]?.id || null);
    }
  }, [activeThreadId, filteredThreads, threads, viewport]);

  useEffect(() => {
    if (viewport !== 'mobile' && !activeThreadId && threads[0]) {
      // Selects a default thread once the viewport is wide enough to show one.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveThreadId(threads[0].id);
    }
  }, [viewport, activeThreadId, threads]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [activeThreadId, threads]);

  // Declared above the effect that calls it. The effect body referenced it before its
  // declaration, which is safe only because effects run after the component body has
  // finished evaluating - an ordering the reader should not have to reconstruct.
  // Auto-provisioning covers people who already follow each other back. This covers everyone else,
  // including the first message to someone who has not followed back.
  const startConversation = useMutation({
    mutationFn: (targetUserId) => messageService.createDirect(targetUserId),
    onSuccess: async (response) => {
      const conversation = response?.data;
      setComposing(false);
      // Awaited, not fired and forgotten: an effect above resets the active thread whenever its id
      // is absent from the loaded list, so selecting the new conversation before the refetch lands
      // snaps the panel straight back to the previous thread.
      await queryClient.invalidateQueries({ queryKey: conversationsKey });
      if (conversation?.id) {
        setActiveThreadId(conversation.id);
        setThreadOpen(true);
      }
    },
    onError: (error) => toast(error?.message || 'could not start that conversation'),
  });

  // A profile's "message" button lands here carrying the target in route state rather than a URL
  // param, so a stale bookmark can never re-trigger it. The state is cleared right after firing, so
  // navigating back into the thread later - or a browser back/forward - does not replay it.
  useEffect(() => {
    const targetUserId = location.state?.openWithUserId;
    if (!targetUserId) return;
    startConversation.mutate(targetUserId);
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleCompose = () => setComposing(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    window.__lxMessagesCompose = () => {
      handleCompose();
      return true;
    };
    window.__lxMessagesBack = () => {
      if (viewport === 'mobile' && threadOpen) {
        setThreadOpen(false);
        return true;
      }
      return false;
    };

    return () => {
      if (window.__lxMessagesCompose) {
        delete window.__lxMessagesCompose;
      }
      if (window.__lxMessagesBack) {
        delete window.__lxMessagesBack;
      }
    };
  }, [threadOpen, viewport]);

  useEffect(() => {
    if (viewport !== 'mobile') {
      // Bridges the shell compose and back actions onto window for the mobile pane.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThreadOpen(true);
      setInfoOpen(false);
    }
  }, [viewport]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('lx_messages_thread_open', {
        detail: { open: viewport === 'mobile' && threadOpen },
      })
    );
  }, [threadOpen, viewport]);

  const selectThread = (threadId) => {
    setActiveThreadId(threadId);
    if (viewport === 'mobile') {
      setThreadOpen(true);
      setInfoOpen(false);
    }
    // Unread is database-owned. Opening the conversation marks it read server-side through the
    // effect above, and the list is re-read from the response.
  };

  const nextIdempotencyKey = () =>
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const sendTextMessage = (value) => {
    const idempotencyKey = nextIdempotencyKey();
    sendMessage.mutate({
      idempotencyKey,
      body: {
        messageType: 'text',
        content: value,
        replyToId: replyingTo?.id || null,
      },
      // Shaped like a MessageResponse so the adapter renders it with no special case, and so a
      // rollback simply removes it again.
      optimisticMessage: {
        id: `pending-${idempotencyKey}`,
        conversationId: activeConversation.id,
        senderId: currentUserId,
        messageType: 'text',
        content: value,
        mediaAssetId: null,
        media: null,
        sharedPostId: null,
        sharedStoryId: null,
        replyToId: replyingTo?.id || null,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      },
    });
  };

  /**
   * Uploads one staged file through the same pre-signed R2 flow the post composer uses, then sends
   * it as a media message. The optimistic bubble renders from the staged preview URL so the
   * attachment appears immediately, before the CDN URL comes back on the real response.
   */
  const sendAttachmentMessage = async (item) => {
    const asset = await uploadMedia(item.file);
    const idempotencyKey = nextIdempotencyKey();

    sendMessage.mutate({
      idempotencyKey,
      body: {
        messageType: item.isVideo ? 'video' : 'image',
        mediaAssetId: asset.id,
        replyToId: replyingTo?.id || null,
      },
      optimisticMessage: {
        id: `pending-${idempotencyKey}`,
        conversationId: activeConversation.id,
        senderId: currentUserId,
        messageType: item.isVideo ? 'video' : 'image',
        content: null,
        mediaAssetId: asset.id,
        media: {
          mediaAssetId: asset.id,
          mediaType: item.isVideo ? 'VIDEO' : 'IMAGE',
          cdnUrl: asset.cdnUrl || item.previewUrl,
        },
        sharedPostId: null,
        sharedStoryId: null,
        replyToId: replyingTo?.id || null,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      },
    });
  };

  const handleStageAttachments = (files) => {
    const staged = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
    }));
    setPendingAttachments((current) => [...current, ...staged]);
  };

  const handleRemovePendingAttachment = (id) => {
    setPendingAttachments((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  };

  /**
   * Sends every staged attachment, in the order they were picked, followed by the typed caption as
   * its own trailing message. Each is a separate message rather than one album message - the
   * bubble grouping already collapses a same-sender burst sent seconds apart into one visual
   * cluster, so the reader sees one exchange either way.
   */
  const handleSend = async () => {
    const value = draft.trim();
    if (!activeConversation || (!value && !pendingAttachments.length)) return;

    setIsSending(true);
    try {
      for (const item of pendingAttachments) {
        // Sequential, not parallel: message order in the thread must match send order.
        await sendAttachmentMessage(item);
      }
      pendingAttachments.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setPendingAttachments([]);

      if (value) sendTextMessage(value);

      setDraft('');
      setReplyingTo(null);
    } catch (error) {
      toast(error?.uploadMessage || error?.message || "couldn't send that. try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteToggle = (messageId) => {
    setPendingDeleteMessageId(messageId);
  };

  const handleDeleteConfirm = () => {
    if (!activeConversation || !pendingDeleteMessageId) return;
    deleteMessage.mutate(pendingDeleteMessageId);
    setPendingDeleteMessageId(null);
  };

  const handleDeleteThreadConfirm = () => {
    if (!deleteThreadTarget) return;
    leaveConversation.mutate(deleteThreadTarget.id, {
      onError: (error) => toast(error?.message || "couldn't delete that chat. try again."),
    });
    setDeleteThreadTarget(null);
  };

  const handleReportThread = (thread) => {
    setReportTarget({
      entityType: REPORT_TYPES.USER,
      entityId: thread.counterpartId,
      author: thread.name,
      avatarUrl: thread.avatarUrl,
    });
  };

  const handleBlockConfirm = () => {
    if (!blockTarget) return;
    block.mutate(blockTarget.counterpartId, {
      onError: (error) => toast(error?.message || "couldn't block that account. try again."),
    });
    setBlockTarget(null);
  };

  const handleRenameThread = (thread) => {
    setNicknameTarget(thread);
    setNicknameValue(thread.nickname || '');
  };

  const handleSaveNickname = () => {
    if (!nicknameTarget) return;
    setNickname.mutate(
      { conversationId: nicknameTarget.id, nickname: nicknameValue.trim() },
      { onError: (error) => toast(error?.message || "couldn't save that nickname. try again.") }
    );
    setNicknameTarget(null);
  };

  const showDetail = viewport !== 'mobile' || threadOpen;
  const showSidebar = viewport !== 'mobile' || listOnlyMobile;
  const isDesktop = viewport === 'desktop';
  const isTablet = viewport === 'tablet';
  const desktopSidebar = 320;
  const tabletSidebar = 316;

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        background: v.base,
        color: v.ink,
        display: 'grid',
        // No third column for the info panel: it is hidden by default on every viewport now and
        // opens as an overlay from the header's info button, so it never reserves screen width it
        // isn't using.
        gridTemplateColumns: isDesktop
          ? `${desktopSidebar}px minmax(520px, 1fr)`
          : isTablet
            ? `${tabletSidebar}px minmax(40px, 1fr)`
            : '1fr',
        paddingTop: viewport === 'mobile' ? (threadOpen ? 0 : 56) : 0,
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        overflow: 'hidden',
        alignItems: 'stretch',
        borderLeft: viewport !== 'mobile' ? `1px solid ${v.border}` : 'none',
        borderRight: viewport !== 'mobile' ? `1px solid ${v.border}` : 'none',
      }}
    >
      {showSidebar ? (
        <ConversationListPanel
          search={search}
          setSearch={setSearch}
          filteredThreads={filteredThreads}
          activeThreadId={activeThreadId}
          selectThread={selectThread}
          handleCompose={handleCompose}
          viewport={viewport}
          onMarkRead={(threadId) => markRead.mutate(threadId)}
          onMarkUnread={(threadId) => markUnread.mutate(threadId)}
          onDeleteThread={setDeleteThreadTarget}
          onReportThread={handleReportThread}
          onBlockThread={setBlockTarget}
          onPinThread={(threadId) => pinConversation.mutate(threadId)}
          onUnpinThread={(threadId) => unpinConversation.mutate(threadId)}
          onMuteThread={(threadId) => muteConversation.mutate(threadId)}
          onUnmuteThread={(threadId) => unmuteConversation.mutate(threadId)}
          onRenameThread={handleRenameThread}
        />
      ) : null}

      {showDetail ? (
        <ChatCenterPanel
          viewport={viewport}
          activeThread={activeThread}
          setActiveThreadId={setActiveThreadId}
          closeThread={() => setThreadOpen(false)}
          openInfo={() => setInfoOpen(true)}
          isDesktop={isDesktop}
          isTablet={isTablet}
          scrollerRef={scrollerRef}
          setPreviewItem={setPreviewItem}
          handleDeleteToggle={handleDeleteToggle}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          draft={draft}
          setDraft={setDraft}
          handleSend={handleSend}
          pendingAttachments={pendingAttachments}
          onStageAttachments={handleStageAttachments}
          onRemovePendingAttachment={handleRemovePendingAttachment}
          isSending={isSending}
        />
      ) : null}

      {infoOpen && activeThread ? (
        <div
          onClick={() => setInfoOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: v.scrim,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'flex-end',
            zIndex: 130,
            padding: viewport === 'mobile' ? '0 0 0 38px' : 0,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: viewport === 'mobile' ? 'min(78vw, 340px)' : 320,
              background: v.base,
              border: `1px solid ${v.border}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <ConversationInfoPanel
              activeThread={activeThread}
              currentUserId={currentUserId}
              setPreviewItem={setPreviewItem}
              mobileOverlay
              onClose={() => setInfoOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {composing ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="new message"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={() => setComposing(false)}
            style={{ position: 'absolute', inset: 0, background: v.scrim }}
          />
          <div
            style={{
              position: 'relative',
              width: 340,
              maxWidth: '100%',
              background: v.base,
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 20px 60px rgba(26,24,22,0.26)',
            }}
          >
            <div
              style={{
                fontFamily: v.fontDisplay,
                fontWeight: 700,
                fontSize: 16,
                color: v.ink,
                marginBottom: 12,
              }}
            >
              new message
            </div>
            <PersonPicker
              excludeIds={threads.map((thread) => thread.counterpartId).filter(Boolean)}
              pending={startConversation.isPending}
              onPick={(userId) => startConversation.mutate(userId)}
            />
          </div>
        </div>
      ) : null}

      {previewItem ? (
        // Clicking the scrim closes the viewer; clicking the media itself must not, so the media
        // element stops the click from reaching this handler. No card, no rounded corners, no
        // close button - the raw image or video at its own scale is the whole interface.
        <div
          onClick={() => setPreviewItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,9,8,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: 24,
          }}
        >
          {previewItem.cdnUrl ? (
            (previewItem.mediaType || '').toUpperCase() === 'VIDEO' ? (
              <video
                src={previewItem.cdnUrl}
                controls
                autoPlay
                onClick={(event) => event.stopPropagation()}
                style={{ maxWidth: '92vw', maxHeight: '92vh', display: 'block' }}
              />
            ) : (
              <img
                src={previewItem.cdnUrl}
                alt=""
                onClick={(event) => event.stopPropagation()}
                style={{ maxWidth: '92vw', maxHeight: '92vh', display: 'block' }}
              />
            )
          ) : (
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width: 'min(420px, 100%)',
                background: v.base,
                border: `1px solid ${v.border}`,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <MediaPlaceholder item={previewItem} large />
              <div style={{ fontFamily: v.fontBody, fontSize: 15, color: v.ink }}>
                {previewItem.title || previewItem.label}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {pendingDeleteMessageId ? (
        <>
          <div
            onClick={() => setPendingDeleteMessageId(null)}
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
              width: 'calc(100% - 56px)',
              maxWidth: 348,
              background: v.base,
              borderRadius: 18,
              boxShadow: `0 20px 60px ${v.shadow25}, 0 4px 16px ${v.shadow12}`,
              zIndex: 1001,
              padding: '22px 24px 20px',
            }}
          >
            <div
              style={{
                fontFamily: v.fontDisplay,
                fontSize: 18,
                fontWeight: 700,
                color: v.ink,
                letterSpacing: '-0.03em',
              }}
            >
              delete message?
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: v.fontBody,
                fontSize: 14,
                lineHeight: 1.45,
                color: v.ink3,
              }}
            >
              this can't be undone.
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setPendingDeleteMessageId(null)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 999,
                  border: 'none',
                  background: '#2c2621',
                  color: '#c4b9a8',
                  fontFamily: v.fontBody,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--lx-error)',
                  color: '#fff5f2',
                  fontFamily: v.fontBody,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                delete
              </button>
            </div>
          </div>
        </>
      ) : null}

      {nicknameTarget ? (
        <>
          <div
            onClick={() => setNicknameTarget(null)}
            style={{ position: 'fixed', inset: 0, background: v.scrim, zIndex: 1000 }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 56px)',
              maxWidth: 348,
              background: v.base,
              borderRadius: 18,
              boxShadow: `0 20px 60px ${v.shadow25}, 0 4px 16px ${v.shadow12}`,
              zIndex: 1001,
              padding: '22px 24px 20px',
            }}
          >
            <div
              style={{
                fontFamily: v.fontDisplay,
                fontSize: 18,
                fontWeight: 700,
                color: v.ink,
                letterSpacing: '-0.03em',
              }}
            >
              nickname for {nicknameTarget.name}
            </div>
            <div style={{ marginTop: 14 }}>
              <input
                autoFocus
                value={nicknameValue}
                onChange={(event) => setNicknameValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSaveNickname();
                }}
                placeholder="only you see this"
                maxLength={50}
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 999,
                  background: v.surfaceSunken,
                  border: `1px solid ${v.borderSubtle}`,
                  padding: '0 14px',
                  color: v.ink,
                  fontFamily: v.fontBody,
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setNicknameTarget(null)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 999,
                  border: 'none',
                  background: '#2c2621',
                  color: '#c4b9a8',
                  fontFamily: v.fontBody,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNickname}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 999,
                  border: 'none',
                  background: v.accent,
                  color: v.ink,
                  fontFamily: v.fontBody,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                save
              </button>
            </div>
          </div>
        </>
      ) : null}

      <ConfirmModal
        config={
          deleteThreadTarget
            ? {
                title: `delete chat with ${deleteThreadTarget.name}?`,
                message:
                  'this removes it from your inbox only. it comes back if they message you again.',
                onConfirm: handleDeleteThreadConfirm,
              }
            : null
        }
        onClose={() => setDeleteThreadTarget(null)}
      />

      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />

      <BlockConfirmDialog
        open={Boolean(blockTarget)}
        handle={blockTarget?.username}
        pending={block.isPending}
        onCancel={() => setBlockTarget(null)}
        onConfirm={handleBlockConfirm}
      />
    </div>
  );
}
