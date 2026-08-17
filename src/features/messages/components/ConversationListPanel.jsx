import { v } from '@/config/tokens';
import { LxIcon } from '@/components/ui/lx-icon';
import { ConvRow } from './ConvRow';

export function ConversationListPanel({
  search,
  setSearch,
  filteredThreads,
  activeThreadId,
  selectThread,
  handleCompose,
  viewport,
}) {
  return (
    <aside
      style={{
        height: '100%',
        minHeight: 0,
        borderRight: viewport === 'mobile' ? 'none' : `1px solid ${v.border}`,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: v.base,
      }}
    >
      <div
        style={{
          height: viewport === 'mobile' ? 0 : 56,
          borderBottom: viewport === 'mobile' ? 'none' : `1px solid ${v.border}`,
          display: viewport === 'mobile' ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: viewport === 'mobile' ? '0' : '0 18px 0 20px',
        }}
      >
        {viewport !== 'mobile' ? (
          <div
            style={{
              fontFamily: v.fontDisplay,
              fontSize: 16,
              fontWeight: 700,
              color: v.ink,
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            messages
          </div>
        ) : null}
        {viewport !== 'mobile' ? (
          <button
            type="button"
            onClick={handleCompose}
            aria-label="new message"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `1px solid ${v.border}`,
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'none',
            }}
          >
            <LxIcon name="edit" size={13} color={v.ink3} />
          </button>
        ) : null}
      </div>

      <div
        style={{
          padding: viewport === 'mobile' ? '9px 14px 10px' : '10px 16px 12px',
          borderBottom: `1px solid ${v.borderSubtle}`,
        }}
      >
        <div
          style={{
            height: viewport === 'mobile' ? 32 : 34,
            borderRadius: 999,
            background: v.surfaceSunken,
            border: `1px solid ${v.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 11px',
          }}
        >
          <LxIcon name="explore" size={13} color={v.ink3} />
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
              fontSize: 13,
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
