import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/store/useAuthStore';
import { STALE_TIME } from '@/config/constants';

import { adminApi } from '../api/adminApi';
import { getNextPageParam, listQueryKey, panelQueryRetry } from '../lib/pagination';
import { toIso } from '../lib/statistics';

const PAGE_LIMIT = 20;

/**
 * The three event types the application actually writes.
 *
 * Read from the backend source, not from the OpenAPI enumeration. The
 * `event_type` database enum declares twenty values; `UserEventRecorder` writes
 * exactly these three, and the endpoint's own contract states that the other
 * seventeen "exist in the schema and have no writer". Generating this list from
 * the enumeration would offer seventeen filters that can never return a row, and
 * an administrator who tried one would conclude the log was broken.
 *
 * The derivation and the one complication in it — a second, conditional writer
 * whose events do not reach the table in any observed deployment — are recorded
 * in `design-decisions.md` and `observability-contract-verification.md` 2.3.
 */
export const WRITTEN_EVENT_TYPES = [
  {
    key: 'session_start',
    label: 'session start',
    hint: 'written when a sign-in issues a session',
  },
  {
    key: 'search',
    label: 'search',
    hint: 'written on either search surface; carries the term and the surface',
  },
  {
    key: 'profile_view',
    label: 'profile view',
    hint: "written when one account views another's profile; viewing one's own records nothing",
  },
];

/**
 * One account's behavioural events, or every account's when `userId` is omitted.
 *
 * The query is disabled until a range has been committed, which is what makes
 * the screen's "no request until both bounds are set" rule true at the network
 * level rather than only in the interface: both bounds are mandatory and the
 * server answers a request missing either with 400, so the panel does not
 * compose one.
 *
 * The query key carries the range and the filters, so applying a new range or
 * changing the event type starts a fresh cursor sequence rather than replaying
 * one scoped to the previous query.
 */
export function useUserEvents({ userId, range, eventType }) {
  const role = useAuthStore((state) => state.role);
  const enabled = Boolean(range?.fromMs && range?.toMs);

  const from = enabled ? toIso(range.fromMs) : undefined;
  const to = enabled ? toIso(range.toMs) : undefined;

  const query = useInfiniteQuery({
    queryKey: listQueryKey('user-events', role, {
      userId: userId ?? null,
      from: from ?? null,
      to: to ?? null,
      eventType: eventType || null,
    }),
    queryFn: ({ pageParam }) =>
      adminApi.getUserEvents({
        userId: userId || undefined,
        from,
        to,
        eventType: eventType || undefined,
        cursor: pageParam,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: undefined,
    getNextPageParam,
    enabled,
    retry: panelQueryRetry,
    staleTime: STALE_TIME.SHORT,
  });

  const rows = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page?.content ?? []),
    [query.data]
  );

  return {
    rows,
    enabled,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
