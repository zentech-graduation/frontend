import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE_TIME } from '@/config/constants';

import { adminApi } from '../api/adminApi';
import { panelQueryRetry } from '../lib/pagination';

/** The read-only campaign samples. Long stale time: they are seeded and do not move. */
export function useMailTemplates() {
  return useQuery({
    queryKey: ['admin', 'mail', 'templates'],
    queryFn: adminApi.listMailTemplates,
    retry: panelQueryRetry,
    staleTime: STALE_TIME.LONG,
  });
}

/** Campaign history. */
export function useCampaigns(limit = 30) {
  return useQuery({
    queryKey: ['admin', 'mail', 'campaigns', { limit }],
    queryFn: () => adminApi.listCampaigns({ limit }),
    retry: panelQueryRetry,
  });
}

/** One campaign with its recipients and their outcomes. */
export function useCampaign(campaignId) {
  return useQuery({
    queryKey: ['admin', 'mail', 'campaign', campaignId],
    queryFn: () => adminApi.getCampaign(campaignId),
    enabled: Boolean(campaignId),
    retry: panelQueryRetry,
  });
}

/**
 * The server-rendered preview.
 *
 * Keyed on the body, so an unchanged body is served from cache rather than
 * re-requested, and debouncing is the caller's job. Never retried: a failed
 * preview is not worth a second request while the author is still typing, and
 * the endpoint carries its own rate limit.
 */
export function useCampaignPreview(body, { enabled }) {
  return useQuery({
    queryKey: ['admin', 'mail', 'preview', body],
    queryFn: () => adminApi.previewCampaign(body),
    enabled: Boolean(enabled) && typeof body === 'string' && body.trim().length > 0,
    retry: false,
    staleTime: STALE_TIME.MEDIUM,
  });
}

/** Create, update and schedule. No retry, matching every other panel mutation. */
export function useCampaignActions(campaignId) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'mail', 'campaigns'] });
    if (campaignId) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mail', 'campaign', campaignId] });
    }
  };

  const create = useMutation({
    mutationFn: adminApi.createCampaign,
    retry: false,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: (payload) => adminApi.updateCampaign(campaignId, payload),
    retry: false,
    onSuccess: invalidate,
  });

  const schedule = useMutation({
    mutationFn: (id) => adminApi.scheduleCampaign(id),
    retry: false,
    onSuccess: invalidate,
  });

  return { create, update, schedule };
}
