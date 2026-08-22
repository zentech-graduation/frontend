import { useQuery } from '@tanstack/react-query';

import { adminApi } from '../api/adminApi';
import { panelQueryRetry } from '../lib/pagination';

/**
 * Resolves a single user id to a username through the content endpoint, cached
 * by id for the session. Because the cache key is the user id, a list of twenty
 * rows referencing five distinct people costs five requests once and none
 * afterwards, and React Query deduplicates concurrent requests for the same id.
 * A username does not change within a session, so the entry never goes stale.
 *
 * While the name is unresolved the caller renders a shortened id, which is
 * honest and stable, never a placeholder name.
 */
export function useResolveUsername(userId) {
  const query = useQuery({
    queryKey: ['admin', 'username', userId],
    queryFn: () => adminApi.getUserContent(userId),
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: panelQueryRetry,
    select: (data) => data?.ownerUsername ?? null,
  });

  return {
    username: query.data ?? null,
    isResolved: query.isSuccess && Boolean(query.data),
    isLoading: query.isLoading,
  };
}

/** A stable, honest short form of an id for use before a name resolves. */
export const shortId = (id) =>
  typeof id === 'string' && id.length >= 8 ? id.slice(0, 8) : (id ?? '');
