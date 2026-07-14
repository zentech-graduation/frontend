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
  const [activeThreadId, setActiveThreadId] = useState('jake');
  const [previewItem, setPreviewItem] = useState(null);
  const [composerSeed, setComposerSeed] = useState(0);
  const listOnlyMobile = viewport === 'mobile' && !activeThreadId;
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
    window.__lxMessagesBack = () => {
      if (viewport === 'mobile' && activeThreadId) {
        setActiveThreadId(null);
        return true;
      }
      return false;
    };

    return () => {
      if (window.__lxMessagesBack) {
        delete window.__lxMessagesBack;
      }
    };
  }, [activeThreadId, viewport]);

  const selectThread = (threadId) => {
    setActiveThreadId(threadId);
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
            {
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

  const showDetail = viewport !== 'mobile' || Boolean(activeThreadId);
  const showSidebar = viewport !== 'mobile' || listOnlyMobile;
  const showRightRail = viewport === 'desktop' && Boolean(activeThread);
  const isDesktop = viewport === 'desktop';
  const isTablet = viewport === 'tablet';
  const desktopSidebar = 320;
  const desktopRail = 300;

  return (
    <div
      style={{
        height: '100%',
        background: v.base,
        color: v.ink,
        display: 'grid',
        gridTemplateColumns: isDesktop
          ? `${desktopSidebar}px minmax(520px, 1fr) ${desktopRail}px`
          : isTablet
            ? '320px minmax(0, 1fr)'
            : '1fr',
        paddingTop: viewport === 'mobile' ? 56 : 0,
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
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
        />
      ) : null}

      {showDetail ? (
        <ChatCenterPanel
          viewport={viewport}
          activeThread={activeThread}
          setActiveThreadId={setActiveThreadId}
          isDesktop={isDesktop}
          isTablet={isTablet}
          showRightRail={showRightRail}
          scrollerRef={scrollerRef}
          setPreviewItem={setPreviewItem}
          handleDeleteToggle={handleDeleteToggle}
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
        />
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
            <div style={{ fontFamily: v.fontBody, fontSize: 15, color: v.inkInverse }}>{previewItem.title || previewItem.label}</div>
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
                color: v.inkInverse,
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
