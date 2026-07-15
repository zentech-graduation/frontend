import { useEffect, useMemo, useRef, useState } from 'react';
import { v } from '../constants/tokens';
import { LxAvatar, LxIcon } from './primitives';

const THREADS = [
  {
    id: 'priya',
    idx: 0,
    name: 'priya',
    username: 'priya_m',
    preview: 'sent you the files!',
    time: '2m',
    unread: 2,
    accent: 'rgba(200, 169, 126, 0.16)',
    mediaLabel: 'shared photos & files',
    media: [
      { id: 'm1', type: 'file', label: 'mockup-v2.png' },
      { id: 'm2', type: 'post', label: '@designthoughts', title: 'Why spacing matters in UI design', meta: 'shared post' },
      { id: 'm3', type: 'image', label: 'color-study.jpg' },
      { id: 'm4', type: 'image', label: 'wireframe-notes.png' },
      { id: 'm5', type: 'image', label: 'grid-system.png' },
      { id: 'm6', type: 'image', label: 'reference-board.jpg' },
    ],
    messages: [
      { id: 'p1', from: 'them', kind: 'file', text: 'mockup-v2.png', time: '10:15' },
      {
        id: 'p2',
        from: 'them',
        kind: 'post',
        handle: '@designthoughts',
        title: 'Why spacing matters in UI design — a visual breakdown',
        meta: 'shared post',
        time: '10:15',
      },
      {
        id: 'p3',
        from: 'me',
        kind: 'reply',
        replyTo: 'priya',
        replyText: 'hey, just finished the mockups',
        text: 'these look really solid btw',
        time: '10:16',
      },
      { id: 'p4', from: 'them', kind: 'text', text: 'thank you :)', time: '10:17' },
      { id: 'p5', from: 'me', kind: 'text', text: 'no rush! sent you the files too', time: '10:20' },
      { id: 'p6', from: 'me', kind: 'text', text: 'sent you the files!', time: '10:20' },
      { id: 'p7', from: 'me', kind: 'deleted', text: 'this message was deleted', time: '10:18' },
    ],
  },
  {
    id: 'design-team',
    idx: 1,
    initials: 'DT',
    name: 'design team',
    username: '4 members',
    preview: 'when are we syncing?',
    time: '15m',
    unread: 5,
    accent: 'rgba(122, 158, 122, 0.2)',
    mediaLabel: 'shared boards',
    media: [
      { id: 'dt1', type: 'image', label: 'sprint-board' },
      { id: 'dt2', type: 'image', label: 'v3-moodboard' },
      { id: 'dt3', type: 'file', label: 'retro-notes.pdf' },
      { id: 'dt4', type: 'image', label: 'token-map' },
    ],
    messages: [
      { id: 'd1', from: 'them', kind: 'text', text: 'when are we syncing?', time: '14:10' },
      { id: 'd2', from: 'me', kind: 'text', text: 'after lunch works for me', time: '14:13' },
    ],
  },
  {
    id: 'jake',
    idx: 2,
    name: 'jake',
    username: 'jake_w',
    preview: 'message was deleted',
    time: '1h',
    unread: 0,
    muted: true,
    accent: 'rgba(196, 132, 122, 0.12)',
    mediaLabel: 'shared links',
    media: [],
    messages: [
      { id: 'j1', from: 'them', kind: 'deleted', text: 'message was deleted', time: '09:24' },
    ],
  },
  {
    id: 'weekend-plans',
    idx: 3,
    initials: 'WP',
    name: 'weekend plans',
    username: '3 members',
    preview: 'anyone up for hiking?',
    time: '3h',
    unread: 1,
    accent: 'rgba(200, 169, 126, 0.22)',
    mediaLabel: 'shared places',
    media: [],
    messages: [
      { id: 'w1', from: 'them', kind: 'text', text: 'anyone up for hiking?', time: '08:02' },
      { id: 'w2', from: 'me', kind: 'text', text: 'if the weather holds, yes', time: '08:04' },
    ],
  },
  {
    id: 'tom',
    idx: 4,
    name: 'tom',
    username: 'tom_n',
    preview: "you: let's catch up soon",
    time: '1d',
    unread: 0,
    accent: 'rgba(168, 136, 90, 0.16)',
    mediaLabel: 'shared files',
    media: [],
    messages: [
      { id: 't1', from: 'me', kind: 'text', text: "let's catch up soon", time: 'yesterday' },
    ],
  },
  {
    id: 'sara',
    idx: 5,
    name: 'sara',
    username: 'sara_o',
    preview: 'see you then!',
    time: '2d',
    unread: 0,
    accent: 'rgba(122, 158, 122, 0.12)',
    mediaLabel: 'shared memories',
    media: [],
    messages: [
      { id: 's1', from: 'them', kind: 'text', text: 'see you then!', time: '2d' },
    ],
  },
];

function AvatarVisual({ thread, size = 42 }) {
  if (thread.initials) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: thread.accent || v.surfaceRaised,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: v.inkInverse,
          fontFamily: v.fontBody,
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {thread.initials}
      </div>
    );
  }

  return <LxAvatar size={size} idx={thread.idx} />;
}

function MediaPlaceholder({ item, large = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: large ? 138 : 82,
        borderRadius: large ? 14 : 10,
        border: `1px solid ${v.border}`,
        background: v.surface,
        color: v.ink3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <LxIcon name="image" size={large ? 22 : 18} color={v.ink3} />
        {large ? (
          <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>{item.label}</span>
        ) : null}
      </div>
    </button>
  );
}

function MessageBubble({ message, activeThread, onPreviewMedia, onDeleteToggle, canDelete }) {
  const isMine = message.from === 'me';
  const bubbleBase = {
    maxWidth: message.kind === 'post' || message.kind === 'file' ? 292 : 220,
    borderRadius: 18,
    padding: message.kind === 'deleted' ? '12px 16px' : '14px 16px',
    fontFamily: v.fontBody,
    fontSize: 15,
    lineHeight: 1.45,
    position: 'relative',
  };

  if (message.kind === 'deleted') {
    return (
      <div style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            ...bubbleBase,
            background: v.surface,
            border: `1px solid ${v.border}`,
            padding: 12,
          }}
        >
          <MediaPlaceholder item={{ label: message.text }} large onClick={() => onPreviewMedia({ label: message.text })} />
        </div>
        <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
      </div>
    );
  }

  if (message.kind === 'post') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            ...bubbleBase,
            background: v.surface,
            border: `1px solid ${v.border}`,
            padding: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MediaPlaceholder item={{ label: message.handle }} onClick={() => onPreviewMedia({ label: message.title })} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.accent }}>{message.handle}</div>
              <div style={{ color: v.ink, fontSize: 14 }}>{message.title}</div>
              <div style={{ display: 'flex', gap: 8, fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
                <span>{message.meta}</span>
                <button
                  type="button"
                  onClick={() => onPreviewMedia({ label: message.title })}
                  style={{ background: 'none', border: 'none', color: v.ink3, cursor: 'pointer', padding: 0 }}
                >
                  view
                </button>
              </div>
            </div>
          </div>
        </div>
        <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
        gap: 4,
      }}
    >
      <div
        style={{
          ...bubbleBase,
          background: isMine ? v.accentDim : v.surface,
          color: v.ink,
          border: `1px solid ${isMine ? v.accentDim : v.border}`,
          minWidth: 94,
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
        {canDelete ? (
          <button
            type="button"
            onClick={() => onDeleteToggle(message.id)}
            aria-label="delete message"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: `1px solid ${v.borderSubtle}`,
              background: v.surfaceRaised,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0.72,
            }}
          >
            <LxIcon name="more" size={12} color={v.ink3} />
          </button>
        ) : null}
      </div>
      <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{message.time}</span>
    </div>
  );
}

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
        <aside
          style={{
            borderRight: `1px solid ${v.border}`,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            background: v.base,
          }}
        >
          <div
            style={{
              height: 60,
              borderBottom: `1px solid ${v.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
            }}
          >
            <h2 style={{ margin: 0, fontFamily: v.fontDisplay, fontSize: 17, fontWeight: 700, color: v.ink, letterSpacing: '-0.03em' }}>
              messages
            </h2>
            <button
              type="button"
              onClick={handleCompose}
              aria-label="new message"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `1px solid ${v.border}`,
                background: v.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <LxIcon name="edit" size={16} color={v.ink3} />
            </button>
          </div>

          <div style={{ padding: 16, borderBottom: `1px solid ${v.borderSubtle}` }}>
            <div
              style={{
                height: 40,
                borderRadius: 999,
                background: v.surfaceSunken,
                border: `1px solid ${v.borderSubtle}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 12px',
              }}
            >
              <LxIcon name="explore" size={14} color={v.ink3} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="search"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: v.ink,
                  fontFamily: v.fontBody,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => selectThread(thread.id)}
                  style={{
                    width: '100%',
                    background: isActive ? v.accentDim : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? `3px solid ${v.accent}` : '3px solid transparent',
                    borderBottom: `1px solid ${v.borderSubtle}`,
                    padding: '13px 18px 13px 16px',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '42px minmax(0, 1fr) auto',
                    gap: 12,
                    alignItems: 'center',
                    textAlign: 'left',
                    color: v.ink,
                  }}
                >
                  <AvatarVisual thread={thread} />
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 700, color: v.ink }}>
                      {thread.name}
                    </div>
                    <div style={{ fontFamily: v.fontBody, fontSize: 12, color: thread.muted ? v.ink3 : v.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {thread.preview} · {thread.time}
                    </div>
                  </div>
                  {thread.unread ? (
                    <span
                      style={{
                        minWidth: 18,
                        height: 18,
                        padding: '0 6px',
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
                </button>
              );
            })}
          </div>
        </aside>
      ) : null}

      {showDetail && activeThread ? (
        <section
          style={{
            display: 'grid',
            gridTemplateRows: '60px minmax(0, 1fr) 60px',
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
              padding: '0 18px',
            }}
          >
            {viewport !== 'desktop' && viewport !== 'tablet' ? (
              <button
                type="button"
                onClick={() => setActiveThreadId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <LxIcon name="back" size={18} color={v.ink3} />
              </button>
            ) : null}
            <AvatarVisual thread={activeThread} size={40} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 700, color: v.ink }}>{activeThread.name}</div>
              <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>@{activeThread.username}</div>
            </div>
          </div>

          <div ref={scrollerRef} style={{ overflowY: 'auto', padding: viewport === 'mobile' ? '18px 16px' : '20px 22px 12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minHeight: '100%', justifyContent: activeThread.messages.length <= 1 ? 'space-between' : 'flex-start' }}>
              {activeThread.messages.map((message, index) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.from === 'me' ? 'flex-end' : 'flex-start',
                    minHeight: activeThread.messages.length <= 1 && index === 0 && isDesktop ? 420 : 'auto',
                    alignItems: activeThread.messages.length <= 1 && index === 0 && isDesktop ? 'flex-start' : 'stretch',
                  }}
                >
                  <MessageBubble
                    message={message}
                    activeThread={activeThread}
                    onPreviewMedia={setPreviewItem}
                    onDeleteToggle={handleDeleteToggle}
                    canDelete={message.from === 'me' && message.kind !== 'deleted' && index >= activeThread.messages.length - 2}
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderTop: `1px solid ${v.border}`,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setDraft((current) => `${current}${current ? ' ' : ''}[attachment]`)}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 'none',
                background: v.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <LxIcon name="more" size={15} color={v.ink3} />
            </button>
            <div
              style={{
                flex: 1,
                height: 38,
                borderRadius: 999,
                background: v.surfaceSunken,
                border: `1px solid ${v.borderSubtle}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="say something real..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: v.ink,
                  fontFamily: v.fontBody,
                  fontSize: 15,
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleSend}
              aria-label="send message"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: v.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <LxIcon name="send" size={16} color={v.ink} />
            </button>
          </div>
        </section>
      ) : null}

      {showRightRail && activeThread ? (
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: v.base,
            borderLeft: `1px solid ${v.borderSubtle}`,
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${v.border}`,
              padding: '28px 22px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <AvatarVisual thread={activeThread} size={66} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: v.fontDisplay, fontSize: 18, fontWeight: 700, color: v.ink }}>{activeThread.name}</div>
              <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 4 }}>@{activeThread.username}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate('profile', { user: { id: activeThread.id, username: activeThread.username, displayName: activeThread.name } })}
              style={{
                height: 32,
                padding: '0 18px',
                borderRadius: 999,
                border: 'none',
                background: v.surface,
                color: v.ink,
                fontFamily: v.fontBody,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              view profile
            </button>
          </div>

          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              shared media
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {activeThread.media.map((item) => (
                <MediaPlaceholder key={item.id} item={item} onClick={() => setPreviewItem(item)} />
              ))}
            </div>
            <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, textAlign: 'center' }}>
              {activeThread.mediaLabel}
            </div>
          </div>
        </aside>
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
