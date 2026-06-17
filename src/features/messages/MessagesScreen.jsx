import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v } from '@/config/tokens';
import { useAuthStore } from '@/store/useAuthStore';
import { toThread, toThreadSummary } from './utils/messageViewModel';
import { conversationsKey, useConversations, useMarkRead } from './hooks/useConversations';
import { useMessages, useDeleteMessage, useSendMessage } from './hooks/useMessages';
import { useLiveMessages } from './hooks/useLiveMessages';
import { ConversationListPanel } from './components/ConversationListPanel';
import { ChatCenterPanel } from './components/ChatCenterPanel';
import { ConversationInfoPanel } from './components/ConversationInfoPanel';
import { MediaPlaceholder } from './components/MediaPlaceholder';
import { PersonPicker } from './components/PersonPicker';
import { messageService } from '@/services/message.service';
import { useLuvaxTweaks } from '@/features/luvax/LuvaxTweaksContext';
import { toast } from '@/features/luvax/components/Toast';

export function MessagesScreen() {
  const { viewport } = useLuvaxTweaks();
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
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState(null);
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
  const sendMessage = useSendMessage(activeConversation?.id);
  const deleteMessage = useDeleteMessage(activeConversation?.id);

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
    onSuccess: (response) => {
      const conversation = response?.data;
      setComposing(false);
      queryClient.invalidateQueries({ queryKey: conversationsKey });
      if (conversation?.id) {
        setActiveThreadId(conversation.id);
        setThreadOpen(true);
      }
    },
    onError: (error) => toast(error?.message || 'could not start that conversation'),
  });

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
      setMobileInfoOpen(false);
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
      setMobileInfoOpen(false);
    }
    // Unread is database-owned. Opening the conversation marks it read server-side through the
    // effect above, and the list is re-read from the response.
  };

  const handleSend = () => {
    const value = draft.trim();
    if (!value || !activeConversation) return;

    const idempotencyKey =
      globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

    setDraft('');
    setReplyingTo(null);
  };

  const handleDeleteToggle = (messageId) => {
    setPendingDeleteMessageId(messageId);
  };

  const handleDeleteConfirm = () => {
    if (!activeConversation || !pendingDeleteMessageId) return;
    deleteMessage.mutate(pendingDeleteMessageId);
    setPendingDeleteMessageId(null);
  };

  const showDetail = viewport !== 'mobile' || threadOpen;
  const showSidebar = viewport !== 'mobile' || listOnlyMobile;
  const showRightRail = (viewport === 'desktop' || viewport === 'tablet') && Boolean(activeThread);
  const isDesktop = viewport === 'desktop';
  const isTablet = viewport === 'tablet';
  const desktopSidebar = 320;
  const desktopRail = 300;
  const tabletSidebar = 316;
  const tabletRail = 304;

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        background: v.base,
        color: v.ink,
        display: 'grid',
        gridTemplateColumns: isDesktop
          ? `${desktopSidebar}px minmax(520px, 1fr) ${desktopRail}px`
          : isTablet
            ? `${tabletSidebar}px minmax(40px, 1fr) ${tabletRail}px`
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
        />
      ) : null}

      {showDetail ? (
        <ChatCenterPanel
          viewport={viewport}
          activeThread={activeThread}
          setActiveThreadId={setActiveThreadId}
          closeThread={() => setThreadOpen(false)}
          openInfo={() => setMobileInfoOpen(true)}
          isDesktop={isDesktop}
          isTablet={isTablet}
          showRightRail={showRightRail}
          scrollerRef={scrollerRef}
          setPreviewItem={setPreviewItem}
          handleDeleteToggle={handleDeleteToggle}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          draft={draft}
          setDraft={setDraft}
          handleSend={handleSend}
        />
      ) : null}

      {showRightRail ? (
        <ConversationInfoPanel
          activeThread={activeThread}
          currentUserId={currentUserId}
          setPreviewItem={setPreviewItem}
          compact={isTablet}
        />
      ) : null}

      {viewport === 'mobile' && mobileInfoOpen && activeThread ? (
        <div
          onClick={() => setMobileInfoOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: v.scrim,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'flex-end',
            zIndex: 130,
            padding: '0 0 0 38px',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(78vw, 340px)',
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
              onClose={() => setMobileInfoOpen(false)}
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
        <div
          onClick={() => setPreviewItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: v.scrim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: 24,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
              borderRadius: 18,
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
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              style={{
                alignSelf: 'flex-end',
                height: 34,
                padding: '0 16px',
                borderRadius: 999,
                border: 'none',
                background: v.accent,
                color: v.ink,
                fontFamily: v.fontBody,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              close
            </button>
          </div>
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
    </div>
  );
}
