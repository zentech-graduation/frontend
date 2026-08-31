import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as socialService from '../../../services/social.service';
import { getNextCursor } from '@/utils/helpers';
import { notifKeys } from './useNotifications';
import { patchCachedAuthorRelationship } from './usePostLikeState';

export const socialKeys = {
  all: ['social'],
  followers: (userId) =>
    userId ? [...socialKeys.all, 'followers', userId] : [...socialKeys.all, 'followers'],
  following: (userId) =>
    userId ? [...socialKeys.all, 'following', userId] : [...socialKeys.all, 'following'],
  requests: () => [...socialKeys.all, 'follow-requests'],
  blocked: () => [...socialKeys.all, 'blocked'],
};

// --- Queries ---

export const useFollowers = (userId, enabled = true) => {
  return useInfiniteQuery({
    queryKey: socialKeys.followers(userId),
    queryFn: ({ pageParam = null, signal }) =>
      socialService.getFollowers(userId, pageParam, undefined, signal),
    getNextPageParam: getNextCursor,
    enabled: !!userId && enabled,
  });
};

export const useFollowing = (userId, enabled = true) => {
  return useInfiniteQuery({
    queryKey: socialKeys.following(userId),
    queryFn: ({ pageParam = null, signal }) =>
      socialService.getFollowing(userId, pageParam, undefined, signal),
    getNextPageParam: getNextCursor,
    enabled: !!userId && enabled,
  });
};

export const usePendingFollowRequests = () => {
  return useQuery({
    queryKey: socialKeys.requests(),
    queryFn: socialService.getPendingFollowRequests,
  });
};

export const useBlockedUsers = () => {
  return useQuery({
    queryKey: socialKeys.blocked(),
    // Wrapped rather than passed by reference: TanStack calls queryFn with a
    // context object, which would otherwise be received as the cursor.
    queryFn: ({ signal }) => socialService.getBlockedUsers(undefined, undefined, signal),
  });
};

// --- Mutations ---

export const useFollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) => socialService.followUser(targetUserId),
    onMutate: (targetUserId) => {
      const restore = patchCachedAuthorRelationship(queryClient, targetUserId, {
        isFollowing: true,
        isFollowedByViewer: true,
        isFollowRequested: false,
      });
      return { restore };
    },
    onSuccess: () => {
      // Refresh profile data, user posts, following lists
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: socialKeys.following() });
      queryClient.invalidateQueries({ queryKey: socialKeys.followers() });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.resetQueries({ queryKey: ['feed'] });
      queryClient.resetQueries({ queryKey: ['recommendedFeed'] });
      queryClient.resetQueries({ queryKey: ['explore'] });
      queryClient.resetQueries({ queryKey: ['userPosts'] });
    },
    onError: (_error, _variables, context) => {
      context?.restore?.();
    },
  });
};

export const useUnfollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) => socialService.unfollowUser(targetUserId),
    onMutate: (targetUserId) => {
      const restore = patchCachedAuthorRelationship(queryClient, targetUserId, {
        isFollowing: false,
        isFollowedByViewer: false,
        isFollowRequested: false,
      });
      return { restore };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: socialKeys.following() });
      queryClient.invalidateQueries({ queryKey: socialKeys.followers() });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.resetQueries({ queryKey: ['feed'] });
      queryClient.resetQueries({ queryKey: ['recommendedFeed'] });
      queryClient.resetQueries({ queryKey: ['explore'] });
      queryClient.resetQueries({ queryKey: ['userPosts'] });
    },
    onError: (err, _variables, context) => {
      context?.restore?.();
      if (import.meta.env.DEV) {
        console.error('[useUnfollow]', err);
      }
    },
  });
};

// The blocked list is server state. It is read back from GET /social/blocked
// rather than mirrored into client storage, so a rejected mutation must reach
// the caller instead of being reported as a success.
export const useBlock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) => socialService.blockUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.blocked() });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: socialKeys.following() });
      queryClient.invalidateQueries({ queryKey: socialKeys.followers() });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.resetQueries({ queryKey: ['feed'] });
      queryClient.resetQueries({ queryKey: ['recommendedFeed'] });
      queryClient.resetQueries({ queryKey: ['explore'] });
      queryClient.resetQueries({ queryKey: ['userPosts'] });
    },
  });
};

export const useUnblock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) => socialService.unblockUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.blocked() });
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
      queryClient.invalidateQueries({ queryKey: notifKeys.all });
    },
  });
};

export const useRejectFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requesterId) => socialService.rejectFollowRequest(requesterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.requests() });
      queryClient.invalidateQueries({ queryKey: notifKeys.all });
    },
  });
};
