import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postService } from '@/services/post.service';

export const useFeed = (params = {}) => {
  return useInfiniteQuery({
    queryKey: ['feed', params],
    queryFn: ({ pageParam = null }) => postService.getFeed({ ...params, cursor: pageParam, limit: 10 }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    getNextPageParam: (lastPage) => {
      // Extract from ApiResponse -> CursorPageResponse
      const pageInfo = lastPage?.data?.pageInfo || lastPage?.pageInfo;
      return pageInfo?.hasNextPage ? pageInfo?.endCursor : undefined;
    },
    initialPageParam: null,
  });
};

export const useExplore = (params = {}) => {
  return useInfiniteQuery({
    queryKey: ['explore', params],
    queryFn: ({ pageParam = null }) => postService.getExplorePosts({ ...params, cursor: pageParam, limit: 10 }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    getNextPageParam: (lastPage) => {
      const pageInfo = lastPage?.data?.pageInfo || lastPage?.pageInfo;
      return pageInfo?.hasNextPage ? pageInfo?.endCursor : undefined;
    },
    initialPageParam: null,
  });
};

export const useUserPosts = (userId, params = {}) => {
  return useInfiniteQuery({
    queryKey: ['userPosts', userId, params],
    queryFn: ({ pageParam = null }) => postService.getUserPosts(userId, { ...params, cursor: pageParam, limit: 10 }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    getNextPageParam: (lastPage) => {
      const pageInfo = lastPage?.data?.pageInfo || lastPage?.pageInfo;
      return pageInfo?.hasNextPage ? pageInfo?.endCursor : undefined;
    },
    initialPageParam: null,
    enabled: !!userId,
  });
};

export const usePostDetail = (postId) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.getPostById(postId),
    enabled: !!postId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => postService.createPost(data),
    onSuccess: () => {
      // Invalidate feed and userPosts so the new post appears everywhere
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
};

export const useUpdatePostStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, status }) => postService.updatePostStatus(postId, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }) => postService.updatePost(postId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => postService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
};
