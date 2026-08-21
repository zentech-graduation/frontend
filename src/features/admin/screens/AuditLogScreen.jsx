import { useSearchParams } from 'react-router-dom';

import { v } from '@/config/tokens';
import { isAdminRole } from '@/config/roles';
import { useAuthStore } from '@/store/useAuthStore';
import { LxIcon } from '@/components/ui/lx-icon';

import { PageHeader, PanelCard } from '../components/PanelPage';
import { RecordTable } from '../components/RecordTable';
import { LoadMore } from '../components/LoadMore';
import { LocalTime } from '../components/LocalTime';
import { ReporterName } from '../components/ReporterName';
import { ActionDetailDrawer } from '../components/ActionDetailDrawer';
import { useActions } from '../hooks/useActions';
import { useVocabularies } from '../hooks/useVocabularies';

/**
 * The moderation action log. One implementation serves two views: a moderator
 * sees only its own actions, an administrator sees all. The result set is
 * role-scoped at the backend, so the two are the same screen with different
 * copy, not two screens.
 *
 * The only filter is `actionType`, because that is the only filter the endpoint
 * declares besides `adminId` (which needs an account picker this phase does not
 * build); no filter is offered that the endpoint does not support, and nothing
 * is filtered client-side. Rows never show `metadata` — it exists only on the
 * per-action fetch, which opens in the drawer. The open action is held in the
 * `action` query parameter so a specific action is a shareable link.
 */
function ActionTypeFilter({ actions, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${v.border}`, flexWrap: 'wrap' }}>
      <LxIcon name="filter" size={14} color={v.ink3} />
      <span style={{ fontFamily: v.fontMono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: v.ink3 }}>
        action type
      </span>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            fontFamily: v.fontBody,
            fontSize: 13,
            color: value ? v.ink : v.ink2,
            background: v.surfaceSunken,
            border: `1px solid ${v.border}`,
            borderRadius: 999,
            padding: '6px 30px 6px 14px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">all actions</option>
          {actions.map((action) => (
            <option key={action.key} value={action.key}>
              {action.displayName}
            </option>
          ))}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <LxIcon name="chevronDown" size={14} color={v.ink3} />
        </span>
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: v.fontBody, fontSize: 12, color: v.ink3 }}
        >
          <LxIcon name="close" size={12} color={v.ink3} />
          clear
        </button>
      ) : null}
    </div>
  );
}

export function AuditLogScreen() {
  const role = useAuthStore((state) => state.role);
  const isAdmin = isAdminRole(role);
  const [searchParams, setSearchParams] = useSearchParams();

  const actionType = searchParams.get('type') || '';
  const openActionId = searchParams.get('action') || null;

  const { moderationActions, actionLabel, actionKnown } = useVocabularies();
  const { rows, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useActions({ actionType: actionType || undefined });

  const setParam = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      },
      { replace: false }
    );
  };

  const openAction = (row) => setParam('action', row.id);
  const closeDrawer = () => setParam('action', '');

  const columns = [
    {
      key: 'action',
      header: 'action',
      nowrap: true,
      render: (row) => {
        const known = actionKnown(row.actionType);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink, fontWeight: 500 }}>
              {known ? actionLabel(row.actionType) : row.actionType}
            </span>
            {!known ? (
              <span
                title="not in the moderation-action vocabulary"
                style={{ fontFamily: v.fontMono, fontSize: 9, textTransform: 'uppercase', color: v.warningText, background: v.warningDim, borderRadius: 999, padding: '1px 6px' }}
              >
                unknown
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      key: 'actor',
      header: 'by',
      nowrap: true,
      // An auto-issued strike carries no acting administrator; show it as system
      // rather than a blank cell.
      render: (row) =>
        row.adminId ? (
          <ReporterName userId={row.adminId} prefix="@" />
        ) : (
          <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink3, fontStyle: 'italic' }}>system</span>
        ),
    },
    {
      key: 'target',
      header: 'target',
      nowrap: true,
      render: (row) =>
        row.targetUserId ? (
          <ReporterName userId={row.targetUserId} prefix="@" />
        ) : (
          <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2 }}>
            {row.targetEntityType}
            {row.targetEntityId ? (
              <span style={{ fontFamily: v.fontMono, fontSize: 11, color: v.ink3, marginLeft: 6 }}>
                {row.targetEntityId.slice(0, 8)}
              </span>
            ) : null}
          </span>
        ),
    },
    {
      key: 'report',
      header: 'report',
      nowrap: true,
      render: (row) =>
        row.reportId ? (
          <LxIcon name="flag" size={13} color={v.ink3} />
        ) : (
          <span style={{ color: v.ink3 }}>—</span>
        ),
    },
    { key: 'when', header: 'when', nowrap: true, render: (row) => <LocalTime value={row.createdAt} showZone={false} /> },
    { key: 'chevron', header: '', align: 'right', width: 40, render: () => <LxIcon name="chevronRight" size={14} color={v.ink3} /> },
  ];

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'action log' : 'my actions'}
        subtitle={
          isAdmin
            ? 'every moderation action taken, by whom, and why.'
            : 'the moderation actions you have taken.'
        }
      />
      <PanelCard padded={false}>
        <ActionTypeFilter
          actions={moderationActions}
          value={actionType}
          onChange={(value) => setParam('type', value)}
        />
        <RecordTable
          columns={columns}
          rows={rows}
          onRowClick={openAction}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          onRetry={refetch}
          emptyIcon="clock"
          emptyTitle={isAdmin ? 'no actions yet' : 'no actions yet'}
          emptyHint={
            isAdmin
              ? 'no moderation actions have been recorded for this filter.'
              : 'you have taken no moderation actions for this filter.'
          }
          footer={
            <LoadMore hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} onLoadMore={() => fetchNextPage()} />
          }
        />
      </PanelCard>

      <ActionDetailDrawer actionId={openActionId} onClose={closeDrawer} />
    </div>
  );
}
