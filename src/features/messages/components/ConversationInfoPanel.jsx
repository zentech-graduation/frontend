import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v } from '@/config/tokens';
import { routeTo } from '@/config/constants';
import { LxIcon } from '@/components/ui/lx-icon';
import { LxAvatar } from '@/components/ui/lx-avatar';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useGroupMutations } from '../hooks/useGroupMutations';
import { AddParticipants } from './AddParticipants';
import { AvatarVisual } from './AvatarVisual';
import { MediaPlaceholder } from './MediaPlaceholder';

const SECTION_LABEL = {
  fontFamily: v.fontMono,
  fontSize: 10,
  color: v.ink3,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

const pillButton = (tone = 'neutral') => ({
  height: 30,
  padding: '0 14px',
  borderRadius: 999,
  border: 'none',
  background: v.surface,
  color: tone === 'danger' ? v.error : v.ink,
  fontFamily: v.fontBody,
  fontSize: 13,
  cursor: 'pointer',
});

/**
 * One member row. Mirrors ConvRow's spacing so the panel reads as one surface.
 *
 * A member with a `leftAt` is a former member: shown dimmed and never offered a remove control,
 * because they are already gone and removing them again would fail.
 */
function ParticipantRow({ participant, canRemove, onRemove }) {
  const gone = Boolean(participant.leftAt);
  const name = participant.displayName || participant.username || 'unknown';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 0',
        opacity: gone ? 0.45 : 1,
      }}
    >
      <LxAvatar size={30} src={participant.avatarUrl || undefined} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: v.fontBody,
            fontSize: 13,
            color: v.ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
          {participant.isAdmin ? (
            <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3, marginLeft: 6 }}>
              {' '}
              admin
            </span>
          ) : null}
        </div>
        <div style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>
          {gone ? 'left the group' : participant.username ? `@${participant.username}` : ''}
        </div>
      </div>
      {canRemove && !gone ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`remove ${name}`}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: 'none',
            background: v.surface,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <LxIcon name="close" size={11} color={v.ink3} />
        </button>
      ) : null}
    </div>
  );
}

export function ConversationInfoPanel({
  activeThread,
  setPreviewItem,
  currentUserId,
  compact = false,
  mobileOverlay = false,
  onClose,
}) {
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [adding, setAdding] = useState(false);
  const { rename, addParticipants, removeParticipant, leave } = useGroupMutations(activeThread?.id);

  if (!activeThread) return null;

  const isGroup = Boolean(activeThread.isGroup);
  const participants = activeThread.participants || [];
  const media = activeThread.media || [];
  const me = participants.find((participant) => participant.userId === currentUserId) || null;
  // Removal is an admin power on the server, so a non-admin is never shown the control rather than
  // being shown one that fails on press.
  const iAmAdmin = Boolean(me?.isAdmin);

  const submitRename = () => {
    const next = draftName.trim();
    setRenaming(false);
    if (!next || next === activeThread.name) return;
    rename.mutate({ groupName: next });
  };

  const padding = mobileOverlay ? '16px 20px 22px' : compact ? '16px 14px' : '20px 22px';

  const panel = (
    <aside
      style={{
        height: mobileOverlay ? 'min(804px, calc(100vh - 52px))' : '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: v.base,
        borderLeft: mobileOverlay ? 'none' : `1px solid ${v.borderSubtle}`,
        overflowY: 'auto',
      }}
    >
      {mobileOverlay ? (
        <div
          style={{
            height: 60,
            borderBottom: `1px solid ${v.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px 0 20px',
            flexShrink: 0,
          }}
        >
          <div style={{ fontFamily: v.fontBody, fontSize: 14, fontWeight: 700, color: v.ink }}>
            chat info
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="close chat info"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: v.surface,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <LxIcon name="close" size={14} color={v.ink3} />
          </button>
        </div>
      ) : null}

      <div
        style={{
          borderBottom: `1px solid ${v.border}`,
          padding: mobileOverlay ? '24px 22px 22px' : compact ? '22px 14px 18px' : '28px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: mobileOverlay ? 12 : compact ? 10 : 12,
          flexShrink: 0,
        }}
      >
        <AvatarVisual thread={activeThread} size={mobileOverlay ? 74 : compact ? 54 : 66} />
        <div style={{ textAlign: 'center', width: '100%' }}>
          {renaming ? (
            <input
              autoFocus
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={submitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitRename();
                if (event.key === 'Escape') setRenaming(false);
              }}
              aria-label="group name"
              style={{
                width: '100%',
                textAlign: 'center',
                fontFamily: v.fontDisplay,
                fontSize: 17,
                fontWeight: 700,
                color: v.ink,
                background: v.surface,
                border: 'none',
                borderRadius: 8,
                padding: '6px 10px',
                outline: 'none',
              }}
            />
          ) : (
            <div
              style={{
                fontFamily: v.fontDisplay,
                fontSize: mobileOverlay ? 18 : compact ? 15 : 18,
                fontWeight: 700,
                color: v.ink,
              }}
            >
              {activeThread.name}
            </div>
          )}
          <div style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginTop: 4 }}>
            {isGroup ? activeThread.username : `@${activeThread.username}`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {isGroup ? (
            <>
              {iAmAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(activeThread.name || '');
                    setRenaming(true);
                  }}
                  style={pillButton()}
                >
                  rename
                </button>
              ) : null}
              {iAmAdmin ? (
                <button
                  type="button"
                  onClick={() => setAdding((open) => !open)}
                  style={pillButton()}
                >
                  {adding ? 'done' : 'add people'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  setConfirm({
                    title: 'leave group',
                    message: `Leave "${activeThread.name}"? You will stop receiving its messages.`,
                    confirmLabel: 'leave',
                    onConfirm: () => leave.mutate(),
                  })
                }
                style={pillButton('danger')}
              >
                leave
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                const other = participants.find(
                  (participant) => participant.userId !== currentUserId
                );
                if (other?.userId) navigate(routeTo.userProfile(other.userId));
              }}
              style={pillButton()}
            >
              view profile
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          padding,
          display: 'flex',
          flexDirection: 'column',
          gap: mobileOverlay ? 14 : compact ? 12 : 16,
        }}
      >
        {isGroup ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={SECTION_LABEL}>
              members ({participants.filter((p) => !p.leftAt).length})
            </div>
            {adding ? (
              <AddParticipants
                existingIds={participants.filter((p) => !p.leftAt).map((p) => p.userId)}
                pending={addParticipants.isPending}
                onAdd={(userId) => addParticipants.mutate([userId])}
              />
            ) : null}
            {participants.map((participant) => (
              <ParticipantRow
                key={participant.userId}
                participant={participant}
                canRemove={iAmAdmin && participant.userId !== currentUserId}
                onRemove={() =>
                  setConfirm({
                    title: 'remove member',
                    message: `Remove ${participant.displayName || participant.username} from this group?`,
                    confirmLabel: 'remove',
                    onConfirm: () => removeParticipant.mutate(participant.userId),
                  })
                }
              />
            ))}
          </div>
        ) : null}

        <div style={SECTION_LABEL}>shared media</div>
        {media.length ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: mobileOverlay ? 8 : compact ? 5 : 6,
            }}
          >
            {media.map((item) => (
              <MediaPlaceholder key={item.id} item={item} onClick={() => setPreviewItem(item)} />
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}>
            no attachments in the messages loaded so far
          </div>
        )}
      </div>

      <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
    </aside>
  );

  return panel;
}
