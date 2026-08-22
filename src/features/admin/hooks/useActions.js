import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/store/useAuthStore';
import { STALE_TIME } from '@/config/constants';

import { adminApi } from '../api/adminApi';
import { getNextPageParam, listQueryKey, panelQueryRetry } from '../lib/pagination';

const PAGE_LIMIT = 20;

/**
 * The moderation action log as an infinite cursor list. A moderator sees only
 * its own actions and an administrator sees all; the result set is role-scoped,
 * so the role is part of the query key. The only declared filter is
 * `actionType`; no date range and no target filter exist on this endpoint, so
 * none is offered. Rows never carry `metadata` — it exists only on the
 * per-action fetch, opened from the drawer.
 *
 * The `adminId` filter narrows the log to one actor; it is meaningful only for an
 * administrator, since a moderator already sees only its own actions. The actor
 * is chosen through the account search built for this phase.
 *
 * @param {{actionType?: string, adminId?: string}} filters
 */
export function useActions(filters = {}) {
  const role = useAuthStore((state) => state.role);
  const actionType = filters.actionType || undefined;
  const adminId = filters.adminId || undefined;

  const query = useInfiniteQuery({
    queryKey: listQueryKey('actions', role, {
      actionType: actionType ?? null,
      adminId: adminId ?? null,
    }),
    queryFn: ({ pageParam }) =>
      adminApi.getActions({ actionType, adminId, cursor: pageParam, limit: PAGE_LIMIT }),
    initialPageParam: undefined,
    getNextPageParam,
    retry: panelQueryRetry,
    staleTime: STALE_TIME.SHORT,
  });

  const rows = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page?.content ?? []),
    [query.data]
  );

  return {
    rows,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

/**
 * A single action's detail, the only place `metadata` exists. Fetched only when
 * a row is opened, keyed by action id. A moderator receives 404
 * (ADMIN_ACTION_NOT_FOUND) for an action it did not perform; the retry policy
 * does not retry that, and the drawer renders it as a calm not-found.
 *
 * @param {string|null} actionId the open action, or null when the drawer is shut
 */
export function useActionDetail(actionId) {
  const query = useQuery({
    queryKey: ['admin', 'action', actionId],
    queryFn: () => adminApi.getAction(actionId),
    enabled: Boolean(actionId),
    staleTime: STALE_TIME.SHORT,
    retry: panelQueryRetry,
  });

  return {
    action: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
