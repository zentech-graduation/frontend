import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import { getNextCursor } from '@/utils/helpers';
import { patchCachedPost } from './usePostLikeState';

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

/**
 * Likes or unlikes a post.
 *
 * The optimistic update is applied to every cache entry holding the post rather
 * than to the component that fired it, because the feed card and post detail can
 * be on screen at the same time and must agree. A failure restores every entry
 * to the value it held before.
 */
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, liked }) =>
      liked ? postService.unlikePost(postId) : postService.likePost(postId),
    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const nextLiked = !liked;

      const restore = patchCachedPost(queryClient, postId, (post) => ({
        isLiked: nextLiked,
        likeCount: Math.max(0, (post.likeCount ?? 0) + (nextLiked ? 1 : -1)),
      }));

      return { restore };
    },
    onSuccess: (data, { postId }) => {
      // The endpoint may answer with the authoritative count. Applying it
      // through the same patch reaches both renderings, which is what the
      // per-component reconciliation could not do.
      const result = data?.data || data;
      if (typeof result?.likeCount === 'number') {
        patchCachedPost(queryClient, postId, { likeCount: result.likeCount });
      }
    },
    onError: (_error, _variables, context) => {
      context?.restore?.();
    },
  });
};

/**
 * Saves or unsaves a post.
 *
 * Carries no counter of its own, so the patch is a single flag, but it spans the
 * same set of cache entries for the same reason.
 */
export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, saved }) =>
      saved ? postService.unsavePost(postId) : postService.savePost(postId),
    onMutate: async ({ postId, saved }) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const restore = patchCachedPost(queryClient, postId, { isSaved: !saved });
      return { restore };
    },
    onError: (_error, _variables, context) => {
      context?.restore?.();
    },
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
 * How many comments deleting this one would remove, for the confirmation copy.
 *
 * Fetched only while the dialogue is open. It is not retried: the dialogue has
 * wording that works without a number, so a second attempt would keep the user
 * waiting for something the screen does not need.
 */
export const useCommentDeletionScope = (commentId, enabled) => {
  return useQuery({
    queryKey: ['commentDeletionScope', commentId],
    queryFn: () => postService.getCommentDeletionScope(commentId),
    enabled: !!commentId && enabled,
    retry: false,
    gcTime: 0,
    staleTime: 0,
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
 * Only the body and its timestamps are copied out of the response. A
 * single-comment response always reports `pinned` as false, so spreading the
 * whole object would silently strip the pinned marker from a comment that is in
 * the pinned block.
 *
 * `editedAt` is among them because it is what the edited marker reads. Copying
 * only the body would leave the marker absent until the list happened to be
 * refetched.
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
            ? {
                ...comment,
                content: updated.content,
                updatedAt: updated.updatedAt,
                editedAt: updated.editedAt,
              }
            : comment
        )
      );
    },
  });
};

/**
 * Soft-deletes a comment and every descendant.
 *
 * The response now reports how many comments were removed, but the affected
 * lists are still refetched rather than patched. The count says how many rows
 * went, not which ones, and the descendants are spread across nested replies
 * entries the client never enumerated. Patching the post's comment count from
 * the number would also mean computing a denormalised counter client-side,
 * which the workspace counter policy reserves to the database.
 *
 * The count is used to drop the deleted subtree's own replies entry, which can
 * no longer be fetched and would otherwise sit in the cache until collected.
 */
export const useDeleteComment = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }) => postService.deleteComment(commentId),
    onSuccess: (response, { commentId, parentId }) => {
      const removedCount = response?.data?.deletedCommentCount ?? 0;

      if (removedCount > 1) {
        queryClient.removeQueries({ queryKey: ['commentReplies', commentId] });
      }
      queryClient.removeQueries({ queryKey: ['commentDeletionScope', commentId] });

      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', parentId] });
      }
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};
