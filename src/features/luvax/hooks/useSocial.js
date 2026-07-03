import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as socialService from '../../services/social.service';

export const socialKeys = {
  all: ['social'],
  followers: (userId) => [...socialKeys.all, 'followers', userId],
  following: (userId) => [...socialKeys.all, 'following', userId],
  requests: () => [...socialKeys.all, 'follow-requests'],
  suggestions: () => [...socialKeys.all, 'suggestions'],
};

// --- Queries ---

export const useFollowers = (userId) => {
  return useInfiniteQuery({
    queryKey: socialKeys.followers(userId),
    queryFn: ({ pageParam = null }) => socialService.getFollowers(userId, pageParam),
    getNextPageParam: (lastPage) => lastPage?.data?.hasNextPage ? lastPage.data.endCursor : undefined,
    enabled: !!userId,
  });
};

export const useFollowing = (userId) => {
  return useInfiniteQuery({
    queryKey: socialKeys.following(userId),
    queryFn: ({ pageParam = null }) => socialService.getFollowing(userId, pageParam),
    getNextPageParam: (lastPage) => lastPage?.data?.hasNextPage ? lastPage.data.endCursor : undefined,
    enabled: !!userId,
  });
};

export const usePendingFollowRequests = () => {
  return useQuery({
    queryKey: socialKeys.requests(),
    queryFn: socialService.getPendingFollowRequests,
  });
};

export const useSuggestedUsers = () => {
  return useQuery({
    queryKey: socialKeys.suggestions(),
    queryFn: socialService.getSuggestedUsers,
  });
};

// --- Mutations ---

export const useFollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) => socialService.followUser(targetUserId),
    onSuccess: (data, variables) => {
      // Refresh profile data, user posts, following lists
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: socialKeys.following() });
      queryClient.invalidateQueries({ queryKey: socialKeys.followers() });
    },
  });
};

export const useUnfollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) => socialService.unfollowUser(targetUserId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: socialKeys.following() });
      queryClient.invalidateQueries({ queryKey: socialKeys.followers() });
    },
  });
};

export const useBlock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) => socialService.blockUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: socialKeys.following() });
      queryClient.invalidateQueries({ queryKey: socialKeys.followers() });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useUnblock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) => socialService.unblockUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useApproveFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requesterId) => socialService.approveFollowRequest(requesterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.requests() });
      queryClient.invalidateQueries({ queryKey: socialKeys.followers() });
    },
  });
};

export const useRejectFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requesterId) => socialService.rejectFollowRequest(requesterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.requests() });
    },
  });
};
