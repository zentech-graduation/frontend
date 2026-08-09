import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import { getNextCursor } from '@/utils/helpers';

export const useFeed = (params = {}) => {
  return useInfiniteQuery({
    queryKey: ['feed', params],
    queryFn: ({ pageParam = null, signal }) => postService.getFeed({ ...params, cursor: pageParam, limit: 10, signal }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    getNextPageParam: getNextCursor,
    initialPageParam: null,
  });
};

export const useExplore = (params = {}) => {
  return useInfiniteQuery({
    queryKey: ['explore', params],
    queryFn: ({ pageParam = null, signal }) => postService.getExplorePosts({ ...params, cursor: pageParam, limit: 10, signal }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    getNextPageParam: getNextCursor,
    initialPageParam: null,
  });
};

export const useUserPosts = (userId, params = {}) => {
  return useInfiniteQuery({
    queryKey: ['userPosts', userId, params],
    queryFn: ({ pageParam = null, signal }) => postService.getUserPosts(userId, { ...params, cursor: pageParam, limit: 10, signal }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    getNextPageParam: getNextCursor,
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

export const useLikePost = () => {
  return useMutation({
    mutationFn: ({ postId, liked }) =>
      liked ? postService.unlikePost(postId) : postService.likePost(postId),
  });
};

export const useSavePost = () => {
  return useMutation({
    mutationFn: ({ postId, saved }) =>
      saved ? postService.unsavePost(postId) : postService.savePost(postId),
  });
};

export const useTopLevelComments = (postId) => {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam = null }) => postService.getComments(postId, { cursor: pageParam, limit: 20 }),
    getNextPageParam: getNextCursor,
    initialPageParam: null,
    enabled: !!postId,
  });
};

export const useCommentReplies = (commentId, enabled) => {
  return useQuery({
    queryKey: ['commentReplies', commentId],
    queryFn: () => postService.getCommentReplies(commentId, { limit: 50 }),
    enabled: !!commentId && enabled,
  });
};

/**
 * The cache entry that holds a given comment.
 *
 * Top-level comments live in the post's infinite list; a reply lives in its
 * parent's replies query. Targeting the exact entry is what keeps liking a deep
 * reply from refetching the whole tree.
 */
const commentListKey = (postId, parentId) =>
  parentId ? ['commentReplies', parentId] : ['comments', postId];

/**
 * Applies a mapper to every comment held in a cache entry.
 *
 * The two comment queries have different shapes: the top-level list is an
 * infinite query with a `pages` array, the replies query is a single payload.
 * Both wrap the rows in the `ApiResponse` envelope under `data.content`.
 */
const mapCachedComments = (mapper) => (cached) => {
  if (!cached) {
    return cached;
  }

  const mapPayload = (payload) => {
    const rows = payload?.data?.content;
    if (!Array.isArray(rows)) {
      return payload;
    }
    return { ...payload, data: { ...payload.data, content: rows.map(mapper) } };
  };

  if (Array.isArray(cached.pages)) {
    return { ...cached, pages: cached.pages.map(mapPayload) };
  }

  return mapPayload(cached);
};

export const useCreateComment = (postId) => {
  const queryClient = useQueryClient();
  // Held across attempts so a retry of the same submission replays the same key
  // and the backend returns the original comment instead of creating a second.
  // Cleared once a submission succeeds, so the next comment gets a fresh key.
  const pendingKeyRef = useRef(null);

  return useMutation({
    mutationFn: ({ parentId, content }) => {
      if (!pendingKeyRef.current) {
        pendingKeyRef.current = crypto.randomUUID();
      }

      return postService.createComment(postId, {
        parentId,
        content,
        idempotencyKey: pendingKeyRef.current,
      });
    },
    onSuccess: (_, variables) => {
      pendingKeyRef.current = null;

      if (variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', variables.parentId] });
      }
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};

/**
 * Likes or unlikes a comment.
 *
 * The like endpoints answer with no body, so the count cannot be read back from
 * the response. It is adjusted in the cache instead and rolled back if the
 * request fails, which keeps a wrong number from surviving on screen. Nothing is
 * invalidated on success: the trigger moves the counter by exactly the amount
 * applied here, and refetching the first page would re-run the pinned selection
 * and could reorder comments under the reader mid-interaction.
 */
export const useToggleCommentLike = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, isLiked }) =>
      isLiked ? postService.unlikeComment(commentId) : postService.likeComment(commentId),
    onMutate: async ({ commentId, isLiked, parentId }) => {
      const queryKey = commentListKey(postId, parentId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(
        queryKey,
        mapCachedComments((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                isLiked: !isLiked,
                likeCount: Math.max(0, (comment.likeCount ?? 0) + (isLiked ? -1 : 1)),
              }
            : comment
        )
      );

      return { queryKey, previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
  });
};

/**
 * Replaces the body of a comment the viewer authored.
 *
 * Only the body and its timestamp are copied out of the response. A
 * single-comment response always reports `pinned` as false, so spreading the
 * whole object would silently strip the pinned marker from a comment that is in
 * the pinned block.
 */
export const useEditComment = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }) => postService.editComment(commentId, content),
    onSuccess: (response, { parentId }) => {
      const updated = response?.data;
      if (!updated?.id) {
        return;
      }

      queryClient.setQueryData(
        commentListKey(postId, parentId),
        mapCachedComments((comment) =>
          comment.id === updated.id
            ? { ...comment, content: updated.content, updatedAt: updated.updatedAt }
            : comment
        )
      );
    },
  });
};

/**
 * Soft-deletes a comment and every descendant.
 *
 * The number of descendants removed is not known to the client, so the affected
 * lists are refetched rather than patched. The post is refetched too because its
 * comment count drops by the size of the whole subtree.
 */
export const useDeleteComment = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }) => postService.deleteComment(commentId),
    onSuccess: (_response, { parentId }) => {
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', parentId] });
      }
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};
