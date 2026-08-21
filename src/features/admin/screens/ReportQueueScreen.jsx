import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { routeTo } from '@/config/constants';

import { PageHeader } from '../components/PanelPage';
import { FilterBar } from '../components/FilterBar';
import { RecordTable } from '../components/RecordTable';
import { LoadMore } from '../components/LoadMore';
import { buildReportColumns } from '../components/reportColumns';
import { useReportQueue } from '../hooks/useReportQueue';
import { useVocabularies } from '../hooks/useVocabularies';
import { REPORT_STATUSES, REPORT_STATUS_LABELS, REPORT_TYPES, REPORT_TYPE_LABELS } from '../lib/reportSchema';

/**
 * The report queue. Both roles reach it with identical access, though the
 * backend returns a moderator only the pending and reviewing reports.
 *
 * First paint is the pending queue at a limit of twenty. Filter state lives in
 * the URL rather than in component state, so a filtered view can be linked and
 * survives a reload. Changing a filter resets pagination, because the query key
 * includes the filter values.
 */
const DEFAULT_STATUS = 'pending';

export function ReportQueueScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { reasonLabel } = useVocabularies();

  // A null status param means the screen has not been filtered yet, so it
  // defaults to pending; an explicit empty string is the "all" selection.
  const statusParam = searchParams.get('status');
  const status = statusParam === null ? DEFAULT_STATUS : statusParam;
  const reportType = searchParams.get('reportType') ?? '';

  const { rows, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useReportQueue({ status, reportType });

  const columns = useMemo(() => buildReportColumns(reasonLabel), [reasonLabel]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      // An explicit empty value is meaningful for status ("all") but not for
      // reportType, so status keeps the empty key and reportType drops it.
      if (key === 'status') {
        next.set(key, '');
      } else {
        next.delete(key);
      }
    }
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });
  const isDirty = status !== DEFAULT_STATUS || reportType !== '';

  const groups = [
    {
      key: 'status',
      label: 'status',
      value: status,
      options: REPORT_STATUSES.map((value) => ({ value, label: REPORT_STATUS_LABELS[value] })),
    },
    {
      key: 'reportType',
      label: 'type',
      value: reportType,
      options: REPORT_TYPES.map((value) => ({ value, label: REPORT_TYPE_LABELS[value] })),
    },
  ];

  return (
    <div>
      <PageHeader
        title="reports"
        subtitle="reports awaiting review. pick one up to see the reported content."
      />

      <div className="lx-admin-panel-card">
        <FilterBar groups={groups} onChange={setFilter} onClear={clearFilters} isDirty={isDirty} />
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
          emptyTitle="the queue is clear"
          emptyHint="no reports match this view. nothing is waiting for review."
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
