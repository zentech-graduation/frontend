import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminApi } from '../api/adminApi';
import { panelQueryRetry } from '../lib/pagination';

/**
 * The staff support queue's server state.
 *
 * Mutations set no retry, matching every other panel mutation hook: retrying a
 * refusal turns one 429 into a burst, and a claim collision must surface once
 * rather than be silently re-attempted.
 */

/** The queue, filtered by status. */
export function useSupportTickets(filters) {
  return useQuery({
    queryKey: ['admin', 'support', 'tickets', filters],
    queryFn: () => adminApi.listSupportTickets(filters),
    retry: panelQueryRetry,
  });
}

/** One ticket as staff. */
export function useSupportTicket(ticketId) {
  return useQuery({
    queryKey: ['admin', 'support', 'ticket', ticketId],
    queryFn: () => adminApi.getSupportTicket(ticketId),
    enabled: Boolean(ticketId),
    retry: panelQueryRetry,
  });
}

/**
 * Claim, respond and escalate.
 *
 * Every success invalidates both the queue and the ticket. A claim collision in
 * particular must refetch, because the interface has just been told the row it
 * is showing is stale.
 */
export function useSupportTicketActions(ticketId) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'ticket', ticketId] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'actions'] });
  };

  const claim = useMutation({
    mutationFn: () => adminApi.claimSupportTicket(ticketId),
    retry: false,
    // Invalidated on failure too: a claim collision means another staff member
    // holds it, so the row on screen is already out of date.
    onSettled: invalidate,
  });

  const respond = useMutation({
    mutationFn: (payload) => adminApi.respondSupportTicket(ticketId, payload),
    retry: false,
    onSuccess: invalidate,
  });

  const escalate = useMutation({
    mutationFn: (reason) => adminApi.escalateSupportTicket(ticketId, reason),
    retry: false,
    onSuccess: invalidate,
  });

  return { claim, respond, escalate };
}
