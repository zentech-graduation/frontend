import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageHeader } from '../components/PanelPage';
import { FilterBar } from '../components/FilterBar';
import { RecordTable } from '../components/RecordTable';
import { LoadMore } from '../components/LoadMore';
import { SplitView } from '../components/SplitView';
import { LocalTime } from '../components/LocalTime';
import { StatusBadge } from '../components/StatusBadge';
import { getSplitSelection, withSelection } from '../lib/splitSelection';
import { useSupportQueue } from '../hooks/useSupportQueue';
import { SupportTicketDetailScreen } from './SupportTicketDetailScreen';
import { TICKET_STATUSES, TICKET_STATUS_LABELS } from '../lib/supportTicketSchema';

/**
 * The staff support queue.
 *
 * Filter state lives in the URL, so a filtered view can be linked and survives
 * a reload, matching the report queue and the audit log.
 *
 * First paint is `open`, which is what a reviewer looking for work wants.
 * Claiming a ticket moves it to `in_progress`, so the ticket the reviewer just
 * committed to would drop straight out of the list they were reading. The
 * screen follows it instead: the filter moves with the claim, the row stays
 * selected, and the change is visible in the filter chips rather than hidden.
 */
const DEFAULT_STATUS = 'OPEN';

const columns = [
  {
    key: 'subject',
    header: 'subject',
    render: (row) => row.subject,
  },
  {
    key: 'category',
    header: 'category',
    render: (row) => (row.category ?? '').toLowerCase().replace(/_/g, ' '),
  },
  {
    key: 'status',
    header: 'status',
    render: (row) => <StatusBadge status={(row.status ?? '').toLowerCase()} />,
  },
  {
    key: 'assignedTo',
    header: 'claimed',
    render: (row) => (row.assignedTo ? 'yes' : 'no'),
  },
  {
    key: 'createdAt',
    header: 'opened',
    render: (row) => <LocalTime value={row.createdAt} />,
  },
];

export function SupportTicketQueueScreen() {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get('status');
  const status = statusParam === null ? DEFAULT_STATUS : statusParam;

  const {
    rows,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useSupportQueue({ status });

  const { selectedId, hasSelection } = getSplitSelection(searchParams, rows);
  const openRecord = (id) => setSearchParams(withSelection(searchParams, id));
  const closeRecord = () => setSearchParams(withSelection(searchParams, null));

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value ?? '');
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });
  const isDirty = status !== DEFAULT_STATUS;

  /**
   * Moves the queue to the status a claim just produced, keeping the ticket
   * open in the detail pane.
   *
   * Without this the reviewer claims a ticket in order to decide it and the
   * list they are looking at goes empty, with nothing saying where the ticket
   * went. Following it is the smaller surprise, and the filter chips show what
   * changed.
   */
  const followClaimedTicket = () => {
    if (status === 'IN_PROGRESS' || !selectedId) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('status', 'IN_PROGRESS');
    next.set('selected', selectedId);
    setSearchParams(next, { replace: true });
  };

  const groups = useMemo(
    () => [
      {
        key: 'status',
        label: 'status',
        value: status,
        options: TICKET_STATUSES.map((value) => ({
          value,
          label: TICKET_STATUS_LABELS[value],
        })),
      },
    ],
    [status]
  );

  const list = (
    <div>
      <PageHeader title="support" />

      <div className="lx-admin-panel-card">
        <FilterBar groups={groups} onChange={setFilter} onClear={clearFilters} isDirty={isDirty} />
        <RecordTable
          columns={columns}
          rows={rows}
          keyField="id"
          onRowClick={(row) => openRecord(row.id)}
          selectedKey={selectedId}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          onRetry={refetch}
          emptyIcon="check"
          emptyTitle="nothing waiting"
          emptyHint="no support tickets match this view."
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

  return (
    <SplitView
      list={list}
      hasSelection={hasSelection}
      onClose={closeRecord}
      backLabel="back to the queue"
      emptyIcon="flag"
      emptyTitle="no ticket open"
      emptyHint="pick a ticket from the queue to read it and decide what happens next."
      detail={
        selectedId ? (
          <SupportTicketDetailScreen
            key={selectedId}
            ticketId={selectedId}
            onClaimed={followClaimedTicket}
          />
        ) : null
      }
    />
  );
}

export default SupportTicketQueueScreen;
