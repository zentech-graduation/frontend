import { useEffect, useMemo, useRef, useState } from 'react';
import { v } from '../luvax/constants/tokens';
import { THREADS } from './data/mockThreads';
import { ConversationListPanel } from './components/ConversationListPanel';
import { ChatCenterPanel } from './components/ChatCenterPanel';
import { ConversationInfoPanel } from './components/ConversationInfoPanel';
import { MediaPlaceholder } from './components/MediaPlaceholder';

export function MessagesScreen({ navigate, viewport }) {
  const [threads, setThreads] = useState(THREADS);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState('priya');
  const [threadOpen, setThreadOpen] = useState(viewport !== 'mobile');
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [composerSeed, setComposerSeed] = useState(0);
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

  const activeThread = threads.find((thread) => thread.id === activeThreadId) || filteredThreads[0] || threads[0];

  useEffect(() => {
    if (!activeThreadId && filteredThreads[0]) {
      if (viewport !== 'mobile') {
        setActiveThreadId(filteredThreads[0].id);
      }
    } else if (activeThreadId && !threads.some((thread) => thread.id === activeThreadId)) {
      setActiveThreadId(threads[0]?.id || null);
    }
  }, [activeThreadId, filteredThreads, threads, viewport]);

  useEffect(() => {
    if (viewport !== 'mobile' && !activeThreadId && threads[0]) {
      setActiveThreadId(threads[0].id);
    }
  }, [viewport, activeThreadId, threads]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [activeThreadId, threads]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    window.MessagesScreen = MessagesScreen;
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
  }, [composerSeed, threadOpen, viewport]);

  useEffect(() => {
    if (viewport !== 'mobile') {
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
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? { ...thread, unread: 0 }
          : thread
      )
    );
  };

  const handleCompose = () => {
    const newThreadId = `new-${composerSeed + 1}`;
    const newThread = {
      id: newThreadId,
      idx: 6,
      initials: 'N',
      name: 'new conversation',
      username: 'draft',
      preview: 'start writing...',
      time: 'now',
      unread: 0,
      accent: 'rgba(200, 169, 126, 0.16)',
      mediaLabel: 'shared files',
      media: [],
      messages: [],
    };

    setComposerSeed((seed) => seed + 1);
    setThreads((current) => [newThread, ...current]);
    setActiveThreadId(newThreadId);
    setDraft('');
    setReplyingTo(null);
  };

  const handleSend = () => {
    const value = draft.trim();
    if (!value || !activeThread) return;

    setThreads((current) =>
      current.map((thread) => {
        if (thread.id !== activeThread.id) return thread;
        return {
          ...thread,
          preview: value,
          time: 'now',
          messages: [
            ...thread.messages,
            replyingTo
              ? {
                  id: `${thread.id}-${Date.now()}`,
                  from: 'me',
                  kind: 'reply',
                  replyTo: replyingTo.from === 'me' ? 'you' : activeThread.name,
                  replyText: replyingTo.text,
                  text: value,
                  time: 'now',
                }
              : {
                  id: `${thread.id}-${Date.now()}`,
                  from: 'me',
                  kind: 'text',
                  text: value,
                  time: 'now',
                },
          ],
        };
      })
    );
    setDraft('');
    setReplyingTo(null);
  };

  const handleDeleteToggle = (messageId) => {
    if (!activeThread) return;
    setThreads((current) =>
      current.map((thread) => {
        if (thread.id !== activeThread.id) return thread;
        return {
          ...thread,
          preview: 'message was deleted',
          messages: thread.messages.map((message) =>
            message.id === messageId
              ? { ...message, kind: 'deleted', text: 'this message was deleted' }
              : message
          ),
        };
      })
    );
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
          navigate={navigate}
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
              navigate={navigate}
              setPreviewItem={setPreviewItem}
              mobileOverlay
              onClose={() => setMobileInfoOpen(false)}
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
            <div style={{ fontFamily: v.fontBody, fontSize: 15, color: v.ink }}>{previewItem.title || previewItem.label}</div>
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
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.MessagesScreen = MessagesScreen;
}
