import { v } from '../../luvax/constants/tokens';
import { LxIcon } from '../../luvax/components/primitives';
import { ConvRow } from './ConvRow';

export function ConversationListPanel({
  search,
  setSearch,
  filteredThreads,
  activeThreadId,
  selectThread,
  handleCompose,
}) {
  return (
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
        <h2 style={{ margin: 0, fontFamily: v.fontDisplay, fontSize: 17, fontWeight: 700, color: '#f7f3eb', letterSpacing: '-0.03em' }}>
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
              color: v.inkInverse,
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
            <ConvRow
              key={thread.id}
              thread={thread}
              isActive={isActive}
              onSelect={() => selectThread(thread.id)}
            />
          );
        })}
      </div>
    </aside>
  );
}
