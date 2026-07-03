import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notifService from '../../../services/notification.service';

export const notifKeys = {
  all: ['notifications'],
  unreadCount: () => [...notifKeys.all, 'unreadCount'],
};

export const useNotifications = (params = {}) => {
  return useInfiniteQuery({
    queryKey: [...notifKeys.all, params],
    queryFn: ({ pageParam = null }) => notifService.getNotifications({ ...params, cursor: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => lastPage?.data?.hasNextPage ? lastPage.data.endCursor : undefined,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: notifKeys.unreadCount(),
    queryFn: notifService.getUnreadCount,
    refetchInterval: 30000, // poll every 30s
  });
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
