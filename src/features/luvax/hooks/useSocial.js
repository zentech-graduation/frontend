import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as socialService from '../../../services/social.service';
import { useAuthStore } from '@/store/useAuthStore';

export const socialKeys = {
  all: ['social'],
  followers: (userId) => userId ? [...socialKeys.all, 'followers', userId] : [...socialKeys.all, 'followers'],
  following: (userId) => userId ? [...socialKeys.all, 'following', userId] : [...socialKeys.all, 'following'],
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
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.resetQueries({ queryKey: ['feed'] });
      queryClient.resetQueries({ queryKey: ['explore'] });
      queryClient.resetQueries({ queryKey: ['userPosts'] });
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
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.resetQueries({ queryKey: ['feed'] });
      queryClient.resetQueries({ queryKey: ['explore'] });
      queryClient.resetQueries({ queryKey: ['userPosts'] });
    },
    onError: (err) => {
      alert(`Unfollow error: ${err.response?.data?.message || err.message}`);
    }
  });
};

export const useBlock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId) => {
      try {
        const res = await socialService.blockUser(targetUserId);
        return res;
      } catch (err) {
        // Ignore error if already blocked (e.g. 409, 400)
        console.warn('Block user API error, ignoring:', err);
      }
    },
    onSuccess: (data, targetUserId) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return;
      const key = `lx_blocks_${userId}`;
      const blocks = JSON.parse(localStorage.getItem(key) || '[]');
      if (!blocks.includes(targetUserId)) {
        blocks.push(targetUserId);
        localStorage.setItem(key, JSON.stringify(blocks));
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: socialKeys.following() });
      queryClient.invalidateQueries({ queryKey: socialKeys.followers() });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.resetQueries({ queryKey: ['feed'] });
      queryClient.resetQueries({ queryKey: ['explore'] });
      queryClient.resetQueries({ queryKey: ['userPosts'] });
      window.dispatchEvent(new Event('lx_blocks_changed'));
    },
  });
};

export const useUnblock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId) => {
      try {
        const res = await socialService.unblockUser(targetUserId);
        return res;
      } catch (err) {
        console.warn('Unblock user API error, ignoring:', err);
      }
    },
    onSuccess: (data, targetUserId) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return;
      const key = `lx_blocks_${userId}`;
      let blocks = JSON.parse(localStorage.getItem(key) || '[]');
      blocks = blocks.filter(id => id !== targetUserId);
      localStorage.setItem(key, JSON.stringify(blocks));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      window.dispatchEvent(new Event('lx_blocks_changed'));
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
