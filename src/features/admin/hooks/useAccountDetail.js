import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/config/constants';

import { adminApi } from '../api/adminApi';
import { panelQueryRetry } from '../lib/pagination';

/** The query key for one account's detail, so a mutation can refetch it by id. */
export const accountDetailKey = (userId) => ['admin', 'userDetail', userId];

/**
 * A single account's detail, including its `capabilities`. Administrator only;
 * a moderator receives 403, which the panel treats as capabilities being
 * unavailable, so no lifecycle control renders. Because capabilities are a field
 * of this payload and no action response carries them, this is what a mutation
 * refetches after acting — the controls re-render only once the fresh
 * capabilities arrive.
 *
 * @param {string} userId
 */
export function useAccountDetail(userId) {
  const query = useQuery({
    queryKey: accountDetailKey(userId),
    queryFn: () => adminApi.getUserDetail(userId),
    enabled: Boolean(userId),
    staleTime: STALE_TIME.SHORT,
    retry: panelQueryRetry,
  });

  return {
    detail: query.data ?? null,
    // Only a successfully loaded detail yields capabilities. An error or a
    // still-loading state yields null, and null capabilities render no control:
    // an unavailable answer is not permission.
    capabilities: query.isSuccess ? (query.data?.capabilities ?? null) : null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
