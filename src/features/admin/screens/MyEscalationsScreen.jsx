import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { v } from '@/config/tokens';
import { routeTo } from '@/config/constants';
import { isAdminRole } from '@/config/roles';
import { useAuthStore } from '@/store/useAuthStore';

import { PageHeader } from '../components/PanelPage';
import { RecordTable } from '../components/RecordTable';
import { LoadMore } from '../components/LoadMore';
import { buildReportColumns } from '../components/reportColumns';
import { useMyEscalations } from '../hooks/useMyEscalations';
import { useVocabularies } from '../hooks/useVocabularies';

/**
 * The reports this reviewer escalated, and what became of them.
 *
 * Escalating hands a report to an administrator, and before this endpoint
 * existed that was where a moderator's view of it ended: the report leaves the
 * moderator's queue, which shows `pending` and `reviewing` only, and a closed
 * report answers 404. The panel worked around it by leaning on the moderator's
 * own audit rows, which carry the report id of every `escalate_report` action.
 * That workaround is gone — this is the route now.
 *
 * **A closed report still appears here**, with the status it ended up in. That
 * is not an oversight in the endpoint, it is the reason to open this screen: the
 * outcome is what the escalation was for. So no status filter is offered, and
 * none is applied to the rows.
 *
 * Not administrator-only. An administrator calling it receives its own
 * escalations rather than everyone's, which is a different and smaller list than
 * the escalated queue — that one is every open escalation awaiting a decision,
 * this one is what this account handed up.
 */
export function MyEscalationsScreen() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const isAdmin = isAdminRole(role);
  const { reasonLabel } = useVocabularies();
  const {
    rows,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useMyEscalations();

  const columns = useMemo(() => buildReportColumns(reasonLabel), [reasonLabel]);

  return (
    <div>
      <PageHeader
        title="my escalations"
        subtitle="reports you handed up to an administrator, and where each one ended."
      />

      <div className="lx-admin-panel-card">
        <RecordTable
          columns={columns}
          rows={rows}
          keyField="id"
          onRowClick={(row) => navigate(routeTo.adminReportDetail(row.id))}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          onRetry={refetch}
          emptyIcon="check"
          emptyTitle="you have escalated nothing"
          emptyHint={
            isAdmin
              ? 'this lists the reports you escalated yourself. escalations handed up by a moderator are in the escalated queue.'
              : 'when you escalate a report it appears here, and stays here after an administrator closes it.'
          }
          footer={
            <LoadMore
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={fetchNextPage}
            />
          }
        />
      </div>

      {rows.length > 0 ? (
        <p
          style={{
            margin: '10px 2px 0',
            fontFamily: v.fontBody,
            fontSize: 12,
            color: v.ink2,
          }}
        >
          a report stays on this list after it is closed, with the status it ended in. that is
          deliberate: the decision an administrator reached is the thing an escalation was for.
        </p>
      ) : null}
    </div>
  );
}
