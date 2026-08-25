import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { routeTo } from '@/config/constants';

import { PageHeader } from '../components/PanelPage';
import { RecordTable } from '../components/RecordTable';
import { LoadMore } from '../components/LoadMore';
import { buildReportColumns } from '../components/reportColumns';
import { useReportQueue } from '../hooks/useReportQueue';
import { useVocabularies } from '../hooks/useVocabularies';

/**
 * The escalated queue: reports a moderator handed up, which only an
 * administrator can close. It is the report list filtered to the escalated
 * status; there is no separate endpoint. The route is administrator-only and
 * unreachable for a moderator, and the navigation badge count comes from the
 * shell rather than from this screen.
 */
export function EscalatedQueueScreen() {
  const navigate = useNavigate();
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
  } = useReportQueue({ status: 'escalated' });

  const columns = useMemo(() => buildReportColumns(reasonLabel), [reasonLabel]);

  return (
    <div>
      <PageHeader title="escalated" />

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
          emptyTitle="no escalated reports"
          emptyHint="nothing has been escalated for an administrator decision."
          footer={
            <LoadMore
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={fetchNextPage}
            />
          }
        />
      </div>
    </div>
  );
}
