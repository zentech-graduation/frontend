import { useEffect, useMemo, useRef, useState } from 'react';
import { LxIcon } from '@/features/luvax/components/primitives';

const INITIAL_THREADS = [
  {
    id: 1,
    name: 'priya',
    handle: '@priya_m',
    preview: 'sent you the files!',
    time: '2m',
    avatar: 'linear-gradient(180deg, #d9edf9 0%, #9ac3df 100%)',
    messages: [
      { id: 'm1', type: 'attachment', label: 'mockup-v2.png', time: '10:14' },
      { id: 'm2', type: 'shared-post', author: '@designthoughts', title: 'Why spacing matters in UI design -', subtitle: 'a visual breakdown', meta: 'shared post · view', time: '10:15' },
      { id: 'm3', type: 'text', align: 'left', text: 'thank you :)', time: '10:17' },
      { id: 'm4', type: 'reply', align: 'right', replyTo: 'priya', replyText: 'hey, just finished the mockups', text: 'these look really solid btw', time: '10:16' },
      { id: 'm5', type: 'text', align: 'left', text: 'no rush! sent you the files too', time: '10:19' },
      { id: 'm6', type: 'text', align: 'left', text: 'sent you the files!', time: '10:20' },
      { id: 'm7', type: 'deleted', align: 'right', text: 'this message was deleted', time: '10:18' },
    ],
    media: new Array(6).fill(null),
  },
  {
    id: 2,
    name: 'design team',
    handle: '@design_team',
    preview: 'when are we syncing?',
    time: '15m',
    initials: 'DT',
    avatar: '#67c88a',
    unread: 0,
    messages: [
      { id: 'dt1', type: 'text', align: 'left', text: 'we should sync after lunch', time: '09:30' },
      { id: 'dt2', type: 'text', align: 'right', text: 'works for me', time: '09:34' },
      { id: 'dt3', type: 'text', align: 'left', text: 'when are we syncing?', time: '09:41' },
    ],
    media: new Array(3).fill(null),
  },
  {
    id: 3,
    name: 'jake',
    handle: '@jake',
    preview: 'message was deleted',
    time: '1h',
    avatar: 'linear-gradient(180deg, #d5d9df 0%, #8194b0 100%)',
    italic: true,
    unread: 0,
    messages: [
      { id: 'jk1', type: 'text', align: 'left', text: 'are you around later?', time: '08:10' },
      { id: 'jk2', type: 'deleted', align: 'left', text: 'this message was deleted', time: '08:12' },
    ],
    media: [],
  },
  {
    id: 4,
    name: 'weekend plans',
    handle: '@weekend_plans',
    preview: 'anyone up for hiking?',
    time: '3h',
    initials: 'WP',
    avatar: '#d3d300',
    unread: 1,
    messages: [
      { id: 'wp1', type: 'text', align: 'left', text: 'anyone up for hiking?', time: '07:10' },
    ],
    media: [],
  },
  {
    id: 5,
    name: 'tom',
    handle: '@tom',
    preview: "you: let's catch up soon",
    time: '1d',
    avatar: 'linear-gradient(180deg, #dcb84b 0%, #dce7f9 100%)',
    unread: 0,
    messages: [
      { id: 'tm1', type: 'text', align: 'right', text: "let's catch up soon", time: 'yesterday' },
      { id: 'tm2', type: 'text', align: 'left', text: 'sounds good', time: 'yesterday' },
    ],
    media: [],
  },
  {
    id: 6,
    name: 'sara',
    handle: '@sara',
    preview: 'see you then!',
    time: '2d',
    avatar: 'linear-gradient(180deg, #ad66ff 0%, #3f0076 100%)',
    unread: 0,
    messages: [
      { id: 'sr1', type: 'text', align: 'left', text: 'see you then!', time: '2d' },
    ],
    media: [],
  },
];

function useScreenWidth() {
  const getWidth = () => (typeof window === 'undefined' ? 1440 : window.innerWidth);
  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    const onResize = () => setWidth(getWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}

function CircleAvatar({ size = 40, background, initials }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f6efe4',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {initials || null}
    </div>
  );
}

function ImagePlaceholder({ height = 120, rounded = 14, label = '', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        height,
        borderRadius: rounded,
        background: '#3a3528',
        border: '1px solid rgba(255,255,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 10,
        color: '#7d7366',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 11,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <LxIcon name="image" size={18} color="#8a7f6f" />
      {label ? <div>{label}</div> : null}
    </button>
  );
}

function ThreadList({ width = 320, compact = false, threads, activeThreadId, onSelectThread, searchValue, onSearchChange, onCompose }) {
  return (
    <aside
      style={{
        width,
        minWidth: 0,
        minHeight: 0,
        borderRight: '1px solid #3a342c',
        display: 'flex',
        flexDirection: 'column',
        background: '#201b16',
      }}
    >
      <div style={{ padding: compact ? '16px 14px 12px' : '18px 18px 14px', borderBottom: '1px solid #3a342c' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: compact ? 17 : 18, fontWeight: 700, color: '#fff7ec' }}>messages</div>
          <button
            type="button"
            onClick={onCompose}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.06)',
              background: '#2b251f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LxIcon name="type" size={14} color="#bcae97" />
          </button>
        </div>
        <div
          style={{
            height: 36,
            borderRadius: 999,
            background: '#2a241e',
            color: '#8f8475',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: 10,
          }}
        >
          <LxIcon name="explore" size={14} color="#8f8475" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="search"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: '#f6efe4',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
            }}
          />
        </div>
      </div>

      <div style={{ overflowY: 'auto', minHeight: 0 }}>
        {threads.map((thread) => {
          const isActive = thread.id === activeThreadId;
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectThread(thread.id)}
              style={{
                width: '100%',
                padding: compact ? '12px 14px' : '12px 18px',
                border: 'none',
                background: isActive ? '#545030' : 'transparent',
                borderLeft: isActive ? '3px solid #c8a97e' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#f6efe4',
              }}
            >
              <CircleAvatar size={compact ? 36 : 40} background={thread.avatar} initials={thread.initials} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff7ec', marginBottom: 4 }}>
                  {thread.name}
                </div>
                <div
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 12,
                    color: '#9a8c78',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontStyle: thread.italic ? 'italic' : 'normal',
                  }}
                >
                  {thread.preview} · {thread.time}
                </div>
              </div>
              {thread.unread ? (
                <div
                  style={{
                    minWidth: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#d5b45c',
                    color: '#1d1915',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '0 4px',
                    flexShrink: 0,
                  }}
                >
                  {thread.unread}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function MessageBubble({ align = 'left', children, meta, accent = false, deleted = false }) {
  const isRight = align === 'right';
  return (
    <div style={{ display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: 'min(100%, 320px)' }}>
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 16,
            background: deleted ? 'transparent' : accent ? '#6a6231' : '#2b251f',
            border: deleted ? '1px dashed #655a4a' : '1px solid rgba(255,255,255,0.03)',
            color: deleted ? '#8f8475' : '#fff7ec',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            lineHeight: 1.45,
            fontStyle: deleted ? 'italic' : 'normal',
          }}
        >
          {children}
        </div>
        {meta ? (
          <div style={{ marginTop: 4, textAlign: isRight ? 'right' : 'left', fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#7f7467' }}>
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatMessageTime(dateLike) {
  if (typeof dateLike === 'string') return dateLike;
  const date = new Date(dateLike);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/^0/, '');
}

function renderMessage(message, compact, onMediaOpen) {
  if (message.type === 'attachment') {
    return (
      <div style={{ maxWidth: 'min(100%, 300px)' }}>
        <div style={{ padding: 12, borderRadius: 16, background: '#2b251f', border: '1px solid rgba(255,255,255,0.03)' }}>
          <ImagePlaceholder height={compact ? 116 : 136} rounded={10} label={message.label} onClick={() => onMediaOpen(message.label)} />
        </div>
        <div style={{ marginTop: 6, fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#7f7467' }}>{message.time}</div>
      </div>
    );
  }

  if (message.type === 'shared-post') {
    return (
      <div style={{ maxWidth: 'min(100%, 340px)' }}>
        <div style={{ padding: 12, borderRadius: 16, background: '#2b251f', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ padding: compact ? 16 : 22, background: '#342f27' }}>
              <ImagePlaceholder height={34} rounded={8} onClick={() => onMediaOpen(message.title)} />
            </div>
            <div style={{ padding: '12px 14px 10px', background: '#312b24' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#d6b977', marginBottom: 8 }}>{message.author}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, lineHeight: 1.45, color: '#e5d6bf', marginBottom: 8 }}>
                {message.title}
                <br />
                {message.subtitle}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#8f8475' }}>{message.meta}</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 6, fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#7f7467' }}>{message.time}</div>
      </div>
    );
  }

  if (message.type === 'reply') {
    return (
      <MessageBubble align={message.align} accent meta={message.time}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#e5d6bf', marginBottom: 8 }}>
          ↩ {message.replyTo}
          <br />
          {message.replyText}
        </div>
        <div style={{ fontWeight: 700 }}>{message.text}</div>
      </MessageBubble>
    );
  }

  if (message.type === 'deleted') {
    return (
      <MessageBubble align={message.align} deleted meta={message.time}>
        {message.text}
      </MessageBubble>
    );
  }

  return (
    <MessageBubble align={message.align} meta={message.time}>
      {message.text}
    </MessageBubble>
  );
}

function ConversationPane({ compact = false, thread, composerValue, onComposerChange, onSend, onMediaOpen }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [thread?.messages?.length, thread?.id]);

  return (
    <section style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#201b16' }}>
      <div
        style={{
          height: 60,
          padding: compact ? '0 16px' : '0 22px',
          borderBottom: '1px solid #3a342c',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexShrink: 0,
        }}
      >
        <CircleAvatar size={40} background={thread.avatar} initials={thread.initials} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff7ec' }}>{thread.name}</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#8f8475' }}>{thread.handle}</div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: compact ? '16px 16px 104px' : '18px 24px 112px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {thread.messages.map((message, index) => (
            <div key={message.id || index}>{renderMessage(message, compact, onMediaOpen)}</div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
        style={{
          padding: compact ? '12px 14px' : '12px 18px',
          borderTop: '1px solid #3a342c',
          background: '#201b16',
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: 42,
            borderRadius: 999,
            border: '1px solid #4a4338',
            background: '#2a241e',
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px 0 10px',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => onMediaOpen('new attachment')}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: '#312b24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LxIcon name="image" size={14} color="#9c8f7d" />
          </button>
          <input
            value={composerValue}
            onChange={(event) => onComposerChange(event.target.value)}
            placeholder="say something real..."
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: '#f6efe4',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
            }}
          />
          <button
            type="submit"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: composerValue.trim() ? '#7a6b44' : '#4b4336',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: composerValue.trim() ? 'pointer' : 'default',
            }}
          >
            <LxIcon name="send" size={14} color="#f6efe4" filled />
          </button>
        </div>
      </form>
    </section>
  );
}

function ProfileRail({ width = 280, thread, onOpenProfile, onMediaOpen }) {
  return (
    <aside style={{ width, minWidth: 0, minHeight: 0, borderLeft: '1px solid #3a342c', background: '#201b16', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '28px 20px 30px', borderBottom: '1px solid #3a342c', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <CircleAvatar size={66} background={thread.avatar} initials={thread.initials} />
        </div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff7ec', marginBottom: 6 }}>{thread.name}</div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#8f8475', marginBottom: 16 }}>{thread.handle}</div>
        <button
          type="button"
          onClick={onOpenProfile}
          style={{
            height: 34,
            padding: '0 16px',
            borderRadius: 999,
            border: 'none',
            background: '#2a241e',
            color: '#e5d6bf',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          view profile
        </button>
      </div>

      <div style={{ padding: '18px 20px', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em', color: '#7f7467', marginBottom: 16 }}>
          SHARED MEDIA
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {(thread.media.length ? thread.media : SHARED_MEDIA).map((_, index) => (
            <ImagePlaceholder key={index} height={72} rounded={8} onClick={() => onMediaOpen(`media ${index + 1}`)} />
          ))}
        </div>
        <div style={{ textAlign: 'center', fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#8f8475' }}>shared photos & files</div>
      </div>
    </aside>
  );
}

function MobileConversation({ threads, activeThreadId, onSelectThread, composerValue, onComposerChange, onSend, onMediaOpen, searchValue, onSearchChange, onCompose }) {
  const thread = threads.find((item) => item.id === activeThreadId) || threads[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#201b16' }}>
      <ThreadList
        width="100%"
        compact
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={onSelectThread}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onCompose={onCompose}
      />
      <ConversationPane compact thread={thread} composerValue={composerValue} onComposerChange={onComposerChange} onSend={onSend} onMediaOpen={onMediaOpen} />
    </div>
  );
}

export function MessagesScreen({ viewport = 'desktop' }) {
  const width = useScreenWidth();
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState(INITIAL_THREADS[0].id);
  const [searchValue, setSearchValue] = useState('');
  const [composerValue, setComposerValue] = useState('');

  const filteredThreads = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((thread) => [thread.name, thread.handle, thread.preview].filter(Boolean).some((value) => value.toLowerCase().includes(query)));
  }, [searchValue, threads]);

  const activeThread = filteredThreads.find((thread) => thread.id === activeThreadId) || threads.find((thread) => thread.id === activeThreadId) || threads[0];

  const selectThread = (threadId) => {
    setActiveThreadId(threadId);
    setThreads((currentThreads) =>
      currentThreads.map((thread) => (thread.id === threadId ? { ...thread, unread: 0 } : thread))
    );
  };

  const sendMessage = () => {
    const text = composerValue.trim();
    if (!text || !activeThread) return;

    const now = new Date();
    const newMessage = {
      id: `msg-${now.getTime()}`,
      type: 'text',
      align: 'right',
      text,
      time: formatMessageTime(now),
    };

    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              preview: text,
              time: 'now',
              messages: [...thread.messages, newMessage],
            }
          : thread
      )
    );
    setComposerValue('');
  };

  const openProfile = () => {
    window.alert(`mock profile for ${activeThread.name}`);
  };

  const openMedia = (label) => {
    window.alert(`mock action: ${label}`);
  };

  const composeMessage = () => {
    const draftId = `draft-${Date.now()}`;
    const draftThread = {
      id: Date.now(),
      name: 'new conversation',
      handle: '@draft',
      preview: 'start typing...',
      time: 'draft',
      initials: 'N',
      avatar: '#9c8f7d',
      unread: 0,
      messages: [{ id: draftId, type: 'text', align: 'left', text: 'new draft opened', time: 'now' }],
      media: [],
    };
    setThreads((currentThreads) => [draftThread, ...currentThreads]);
    setActiveThreadId(draftThread.id);
  };

  if (viewport === 'mobile' || width < 768) {
    return (
      <MobileConversation
        threads={filteredThreads.length ? filteredThreads : threads}
        activeThreadId={activeThreadId}
        onSelectThread={selectThread}
        composerValue={composerValue}
        onComposerChange={setComposerValue}
        onSend={sendMessage}
        onMediaOpen={openMedia}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onCompose={composeMessage}
      />
    );
  }

  if (viewport === 'tablet' || width < 1180) {
    return (
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', background: '#201b16' }}>
        <ThreadList
          width={280}
          compact
          threads={filteredThreads.length ? filteredThreads : threads}
          activeThreadId={activeThreadId}
          onSelectThread={selectThread}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onCompose={composeMessage}
        />
        <ConversationPane compact thread={activeThread} composerValue={composerValue} onComposerChange={setComposerValue} onSend={sendMessage} onMediaOpen={openMedia} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr) 280px', background: '#201b16' }}>
      <ThreadList
        width={320}
        threads={filteredThreads.length ? filteredThreads : threads}
        activeThreadId={activeThreadId}
        onSelectThread={selectThread}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onCompose={composeMessage}
      />
      <ConversationPane compact={width < 1360} thread={activeThread} composerValue={composerValue} onComposerChange={setComposerValue} onSend={sendMessage} onMediaOpen={openMedia} />
      <ProfileRail width={280} thread={activeThread} onOpenProfile={openProfile} onMediaOpen={openMedia} />
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.MessagesScreen = MessagesScreen;
}
