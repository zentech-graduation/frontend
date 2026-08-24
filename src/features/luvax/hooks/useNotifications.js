import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notifService from '../../../services/notification.service';
import { NOTIFICATION_ENDPOINT, subscribeTopic } from '@/services/realtime/stompConnection';
import { useAuthStore } from '@/store/useAuthStore';
import { getNextCursor } from '@/utils/helpers';

export const notifKeys = {
  all: ['notifications'],
  unreadCount: () => [...notifKeys.all, 'unreadCount'],
};

export const useNotifications = (params = {}) => {
  return useInfiniteQuery({
    queryKey: [...notifKeys.all, params],
    queryFn: ({ pageParam = null }) =>
      notifService.getNotifications({ ...params, cursor: pageParam, limit: 20 }),
    getNextPageParam: getNextCursor,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: notifKeys.unreadCount(),
    queryFn: notifService.getUnreadCount,
    refetchInterval: 30000, // poll every 30s
  });
};

export const useLiveNotifications = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    return subscribeTopic(
      `/topic/notifications.${userId}`,
      () => {
        queryClient.invalidateQueries({ queryKey: notifKeys.all });
        queryClient.invalidateQueries({ queryKey: ['social', 'follow-requests'] });
        queryClient.invalidateQueries({ queryKey: ['social', 'followers'] });
        queryClient.invalidateQueries({ queryKey: ['social', 'following'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
      { endpoint: NOTIFICATION_ENDPOINT }
    );
  }, [queryClient, userId]);
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notifService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifKeys.all });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notifService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifKeys.all });
    },
  });
};
