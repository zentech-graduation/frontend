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
 * The fallback the anonymous public form falls back to.
 *
 * GET /api/v1/config/vocabularies requires authentication, and the public form
 * has no session by definition, so an anonymous caller cannot read the category
 * list from it. These five mirror the non-appeal rows V92 seeds into
 * support_category_configs.
 *
 * This is a fallback, not the source. An authenticated caller always reads the
 * live list, and the backend validates the submitted category on every path
 * regardless, so a category disabled server-side is refused even if this stale
 * copy still offers it. Permitting the vocabulary endpoint anonymously would be
 * the better fix and would delete this constant; it is an authorization change
 * and belongs to whoever owns that decision.
 */
const PUBLIC_CATEGORY_FALLBACK = [
  {
    categoryKey: 'account_access',
    displayName: 'Account access',
    isAppeal: false,
    allowsPublicForm: true,
    isEnabled: true,
  },
  {
    categoryKey: 'account_data',
    displayName: 'Account data',
    isAppeal: false,
    allowsPublicForm: true,
    isEnabled: true,
  },
  {
    categoryKey: 'bug_report',
    displayName: 'Report a bug',
    isAppeal: false,
    allowsPublicForm: true,
    isEnabled: true,
  },
  {
    categoryKey: 'safety_concern',
    displayName: 'Safety concern',
    isAppeal: false,
    allowsPublicForm: true,
    isEnabled: true,
  },
  {
    categoryKey: 'other',
    displayName: 'Something else',
    isAppeal: false,
    allowsPublicForm: true,
    isEnabled: true,
  },
];

/**
 * The support categories, read from the shared vocabulary endpoint.
 *
 * Not hardcoded for an authenticated caller: the backend publishes them from
 * support_category_configs, so a category disabled there disappears from the
 * client without a deploy. An anonymous caller cannot reach that endpoint and
 * falls back to the constant above.
 *
 * @param {{ anonymous?: boolean }} options anonymous callers skip the request
 */
export function useSupportCategories({ anonymous = false } = {}) {
  return useQuery({
    queryKey: ['support', 'categories', { anonymous }],
    queryFn: async () => {
      if (anonymous) {
        return PUBLIC_CATEGORY_FALLBACK;
      }
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
