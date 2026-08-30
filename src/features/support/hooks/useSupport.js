import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE_TIME } from '@/config/constants';
import { supportApi } from '../services/supportApi';

/**
 * The help centre's server state.
 *
 * The retry policy mirrors the panel's: a rate-limited response is never
 * retried, because retrying a 429 is what turns one refusal into a burst.
 * Mutations set no retry at all, deliberately, for the same reason.
 */
const isRateLimited = (error) => error?.status === 429 || error?.code === 'TOO_MANY_REQUESTS';

const supportQueryRetry = (failureCount, error) => {
  if (isRateLimited(error)) {
    return false;
  }
  return failureCount < 1;
};

/** The caller's own tickets. */
export function useOwnTickets(limit = 20) {
  return useQuery({
    queryKey: ['support', 'tickets', { limit }],
    queryFn: () => supportApi.listOwnTickets({ limit }),
    retry: supportQueryRetry,
    staleTime: STALE_TIME?.SHORT ?? 30_000,
  });
}

/** One of the caller's own tickets. */
export function useOwnTicket(ticketId) {
  return useQuery({
    queryKey: ['support', 'ticket', ticketId],
    queryFn: () => supportApi.getOwnTicket(ticketId),
    enabled: Boolean(ticketId),
    retry: supportQueryRetry,
  });
}

/**
 * The support categories, read from the shared vocabulary endpoint.
 *
 * Not hardcoded. The backend publishes them from support_category_configs, and
 * that row set is what decides which categories the public form may offer, so a
 * category disabled there disappears from the client without a deploy.
 */
export function useSupportCategories() {
  return useQuery({
    queryKey: ['support', 'categories'],
    queryFn: async () => {
      const vocabularies = await supportApi.listVocabularies();
      return vocabularies?.supportCategories ?? [];
    },
    retry: supportQueryRetry,
    staleTime: STALE_TIME?.LONG ?? 5 * 60_000,
  });
}

/** Opens a ticket for the authenticated account. */
export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.createTicket,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] }),
  });
}

/** Redeems the appeal link. Mints no session, so nothing here touches the auth store. */
export function useCreateAppeal() {
  return useMutation({ mutationFn: supportApi.createAppeal, retry: false });
}

/** Submits the public form. */
export function useCreatePublicTicket() {
  return useMutation({ mutationFn: supportApi.createPublicTicket, retry: false });
}

/** Confirms a public submission. */
export function useConfirmPublicTicket() {
  return useMutation({ mutationFn: supportApi.confirmPublicTicket, retry: false });
}

/** Opts out of campaign mail. */
export function useUnsubscribe() {
  return useMutation({ mutationFn: supportApi.unsubscribe, retry: false });
}
