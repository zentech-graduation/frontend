import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userService from '../../../services/user.service';

export const userKeys = {
  all: ['users'],
  profile: (userId) => [...userKeys.all, 'profile', userId],
};

export const useUserProfile = (userId, enabled = true) => {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: () => userService.getUserProfile(userId),
    enabled: !!userId && enabled,
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => userService.updateMyProfile(data),
    onSuccess: () => {
      // Typically, auth context might need an update, or we invalidate all users cache
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
