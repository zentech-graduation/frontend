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
  onMarkRead,
  onMarkUnread,
  onDeleteThread,
  onReportThread,
  onBlockThread,
  onPinThread,
  onUnpinThread,
  onMuteThread,
  onUnmuteThread,
  onRenameThread,
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
          height: viewport === 'mobile' ? 0 : 52,
          borderBottom: viewport === 'mobile' ? 'none' : `1px solid ${v.border}`,
          display: viewport === 'mobile' ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: viewport === 'mobile' ? '0' : '0 16px 0 18px',
        }}
      >
        {viewport !== 'mobile' ? (
          <div
            style={{
              fontFamily: v.fontDisplay,
              fontSize: 14.5,
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
              width: 32,
              height: 32,
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
            <LxIcon name="edit" size={12} color={v.ink3} />
          </button>
        ) : null}
      </div>

      <div
        style={{
          padding: viewport === 'mobile' ? '8px 14px 9px' : '9px 14px 10px',
          borderBottom: `1px solid ${v.borderSubtle}`,
        }}
      >
        <div
          style={{
            height: viewport === 'mobile' ? 30 : 31,
            borderRadius: 999,
            background: v.surfaceSunken,
            border: `1px solid ${v.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 10px',
          }}
        >
          <LxIcon name="explore" size={12} color={v.ink3} />
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
              fontSize: 12,
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
              onMarkRead={() => onMarkRead?.(thread.id)}
              onMarkUnread={() => onMarkUnread?.(thread.id)}
              onDelete={() => onDeleteThread?.(thread)}
              onReport={thread.counterpartId ? () => onReportThread?.(thread) : null}
              onBlock={thread.counterpartId ? () => onBlockThread?.(thread) : null}
              onPin={() => onPinThread?.(thread.id)}
              onUnpin={() => onUnpinThread?.(thread.id)}
              onMute={() => onMuteThread?.(thread.id)}
              onUnmute={() => onUnmuteThread?.(thread.id)}
              onRename={thread.counterpartId ? () => onRenameThread?.(thread) : null}
            />
          );
        })}
      </div>
    </aside>
  );
}
