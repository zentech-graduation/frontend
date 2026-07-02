import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/post.service';

export const useFeed = (params = {}) => {
  return useQuery({
    queryKey: ['feed', params],
    queryFn: () => postService.getFeed(params),
  });
};

export const usePostDetail = (postId) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.getPostById(postId),
    enabled: !!postId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => postService.createPost(data),
    onSuccess: () => {
      // Invalidate feed so the new post appears
      queryClient.invalidateQueries({ queryKey: ['feed'] });
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
    },
  });
};
