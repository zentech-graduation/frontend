import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminApi } from '../api/adminApi';

/**
 * The mutations a reviewer performs from the report detail screen.
 *
 * Every mutation invalidates the queries whose result it changed, so the report
 * and its target refetch after an action rather than showing stale state. A
 * conflict (another reviewer acted first, or a double submit) is surfaced by the
 * screen as a calm message; the refetch that follows comes from these
 * invalidations.
 *
 * Mutations do not auto-retry, so a 429 or a conflict never turns into a burst.
 */
export function useReportActions(reportId) {
  const queryClient = useQueryClient();

  const invalidateReport = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'report', reportId] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'report-target', reportId] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
  };

  const invalidateEscalation = () => {
    invalidateReport();
    queryClient.invalidateQueries({ queryKey: ['admin', 'escalated-count'] });
  };

  const markReviewing = useMutation({
    mutationFn: () => adminApi.markReviewing(reportId),
    onSuccess: invalidateReport,
  });

  const escalate = useMutation({
    mutationFn: (reason) => adminApi.escalateReport(reportId, reason),
    onSuccess: invalidateEscalation,
  });

  const resolve = useMutation({
    mutationFn: (reason) => adminApi.resolveReport(reportId, reason),
    onSuccess: invalidateEscalation,
  });

  const dismiss = useMutation({
    mutationFn: (reason) => adminApi.dismissReport(reportId, reason),
    onSuccess: invalidateEscalation,
  });

  const removeContent = useMutation({
    mutationFn: ({ targetType, entityId, reason }) =>
      targetType === 'post'
        ? adminApi.removePost(entityId, reason, reportId)
        : adminApi.removeComment(entityId, reason, reportId),
    onSuccess: invalidateReport,
  });

  const restoreContent = useMutation({
    mutationFn: ({ targetType, entityId, reason }) =>
      targetType === 'post'
        ? adminApi.restorePost(entityId, reason, reportId)
        : adminApi.restoreComment(entityId, reason, reportId),
    onSuccess: invalidateReport,
  });

  return { markReviewing, escalate, resolve, dismiss, removeContent, restoreContent };
}
