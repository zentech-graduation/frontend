import axiosInstance from './axiosInstance';

const POST_API_PATH = '/posts';

/**
 * Creates a new post.
 * @param {Object} data - The post data (e.g., content, mediaUrls).
 * @returns {Promise<Object>} The created post.
 */
export const createPost = async (data) => {
  const response = await axiosInstance.post(POST_API_PATH, data);
  return response.data;
};

/**
 * Retrieves a paginated list of feed posts.
 * @param {Object} params - Query parameters (e.g., cursor, limit) plus an optional AbortSignal.
 * @returns {Promise<Object>} The paginated posts response.
 */
export const getFeed = async ({ signal, ...params } = {}) => {
  const response = await axiosInstance.get(`${POST_API_PATH}/feed`, { params, signal });
  return response.data;
};

/**
 * Retrieves a paginated list of explore posts via search.
 */
export const getExplorePosts = async ({ signal, ...params } = {}) => {
  // Backend requires 'q', fallback to a space or wildcard if empty to avoid 400
  if (!params.q) params.q = 'a';
  const response = await axiosInstance.get(`${POST_API_PATH}/search`, { params, signal });
  return response.data;
};

/**
 * Retrieves a paginated list of a user's published posts.
 * @param {string|number} userId - The ID of the user.
 * @param {Object} params - Query parameters (e.g., cursor, limit) plus an optional AbortSignal.
 * @returns {Promise<Object>} The paginated posts response.
 */
/**
 * Retrieves the posts the authenticated user has liked.
 * @param {Object} params - Query parameters (cursor, limit) plus an optional AbortSignal.
 * @returns {Promise<Object>} The paginated posts response.
 */
export const getLikedPosts = async ({ signal, ...params } = {}) => {
  const response = await axiosInstance.get(`${POST_API_PATH}/liked`, { params, signal });
  return response.data;
};

export const getUserPosts = async (userId, { signal, ...params } = {}) => {
  const response = await axiosInstance.get(`${POST_API_PATH}/user/${userId}`, { params, signal });
  return response.data;
};

/**
 * Retrieves a single post by ID.
 * @param {string|number} postId - The ID of the post.
 * @returns {Promise<Object>} The post details.
 */
export const getPostById = async (postId) => {
  const response = await axiosInstance.get(`${POST_API_PATH}/${postId}`);
  return response.data;
};

/**
 * Updates an existing post.
 * @param {string|number} postId - The ID of the post.
 * @param {Object} data - The updated post data.
 * @returns {Promise<Object>} The updated post.
 */
export const updatePost = async (postId, data) => {
  const response = await axiosInstance.patch(`${POST_API_PATH}/${postId}`, data);
  return response.data;
};

/**
 * Deletes a post.
 * @param {string|number} postId - The ID of the post.
 * @returns {Promise<Object>} A success message or empty response.
 */
export const deletePost = async (postId) => {
  const response = await axiosInstance.delete(`${POST_API_PATH}/${postId}`);
  return response.data;
};

/**
 * Transitions the status of a post.
 * @param {string|number} postId - The ID of the post.
 * @param {string} status - The target status: 'draft', 'published', 'archived' or 'removed'.
 * @returns {Promise<Object>} The updated post.
 */
export const updatePostStatus = async (postId, status) => {
  const response = await axiosInstance.patch(`${POST_API_PATH}/${postId}/status`, {
    targetStatus: status,
  });
  return response.data;
};

/**
 * Likes a post for the current user; returns the fresh like count.
 * @param {string} postId - The ID of the post.
 * @returns {Promise<Object>} ApiResponse<{ postId, liked, likeCount }>.
 */
export const likePost = async (postId) => {
  const response = await axiosInstance.post(`${POST_API_PATH}/${postId}/like`);
  return response.data;
};

/**
 * Removes the current user's like from a post; returns the fresh like count.
 * @param {string} postId - The ID of the post.
 * @returns {Promise<Object>} ApiResponse<{ postId, liked, likeCount }>.
 */
export const unlikePost = async (postId) => {
  const response = await axiosInstance.delete(`${POST_API_PATH}/${postId}/like`);
  return response.data;
};

/**
 * Saves (bookmarks) a post for the current user.
 * @param {string} postId - The ID of the post.
 * @returns {Promise<Object>} ApiResponse<Void>.
 */
export const savePost = async (postId) => {
  const response = await axiosInstance.post(`${POST_API_PATH}/${postId}/save`);
  return response.data;
};

/**
 * Removes the current user's saved bookmark from a post.
 * @param {string} postId - The ID of the post.
 * @returns {Promise<Object>} No content.
 */
export const unsavePost = async (postId) => {
  const response = await axiosInstance.delete(`${POST_API_PATH}/${postId}/save`);
  return response.data;
};

/**
 * Retrieves a paginated list of top-level comments for a post.
 * @param {string} postId - The ID of the post.
 * @param {Object} params - Query parameters (e.g., cursor, limit).
 * @returns {Promise<Object>} ApiResponse<CursorPageResponse<Comment>>.
 */
export const getComments = async (postId, params = {}) => {
  const response = await axiosInstance.get(`${POST_API_PATH}/${postId}/comments`, { params });
  return response.data;
};

/**
 * Retrieves a paginated list of direct replies to a comment.
 * @param {string} commentId - The ID of the parent comment.
 * @param {Object} params - Query parameters (e.g., cursor, limit).
 * @returns {Promise<Object>} ApiResponse<CursorPageResponse<Comment>>.
 */
export const getCommentReplies = async (commentId, params = {}) => {
  const response = await axiosInstance.get(`/comments/${commentId}/replies`, { params });
  return response.data;
};

/**
 * Creates a comment or reply on a post.
 *
 * When an idempotency key is supplied it travels as the `Idempotency-Key`
 * header, which the backend honours by returning the original comment on a
 * replay instead of creating a second one.
 * @param {string} postId - The ID of the post.
 * @param {{ parentId?: string|null, content: string, idempotencyKey?: string }} data - Comment payload.
 * @returns {Promise<Object>} ApiResponse<Comment>.
 */
export const createComment = async (postId, data) => {
  const response = await axiosInstance.post(
    `${POST_API_PATH}/${postId}/comments`,
    {
      postId,
      parentId: data.parentId ?? null,
      content: data.content,
    },
    data.idempotencyKey ? { headers: { 'Idempotency-Key': data.idempotencyKey } } : undefined
  );
  return response.data;
};

/**
 * Likes a comment.
 *
 * The response carries no body beyond the envelope, so the caller is
 * responsible for reflecting the new count.
 * @param {string} commentId - The ID of the comment.
 * @returns {Promise<Object>} ApiResponse<void>.
 */
export const likeComment = async (commentId) => {
  const response = await axiosInstance.post(`/comments/${commentId}/like`);
  return response.data;
};

/**
 * Removes the viewer's like from a comment.
 * @param {string} commentId - The ID of the comment.
 * @returns {Promise<Object>} ApiResponse<void>.
 */
export const unlikeComment = async (commentId) => {
  const response = await axiosInstance.delete(`/comments/${commentId}/like`);
  return response.data;
};

/**
 * Replaces the body of a comment the viewer authored.
 * @param {string} commentId - The ID of the comment.
 * @param {string} content - The new body; the backend requires it non-blank and at most 2200 characters.
 * @returns {Promise<Object>} ApiResponse<Comment>.
 */
export const editComment = async (commentId, content) => {
  const response = await axiosInstance.patch(`/comments/${commentId}`, { content });
  return response.data;
};

/**
 * Reports how many comments deleting this one would remove.
 *
 * The count covers the comment itself plus every descendant at any depth, so it
 * is not replyCount, which counts direct replies only. This is an estimate: a
 * reply arriving between this call and the delete makes the delete remove more.
 * Owner-only; the backend answers 404 for anyone else.
 *
 * @param {string} commentId - The ID of the comment.
 * @returns {Promise<Object>} ApiResponse<CommentDeletionScopeResponse>.
 */
export const getCommentDeletionScope = async (commentId) => {
  const response = await axiosInstance.get(`/comments/${commentId}/deletion-scope`);
  return response.data;
};

/**
 * Soft-deletes a comment the viewer authored, together with every descendant.
 * @param {string} commentId - The ID of the comment.
 * @returns {Promise<Object>} ApiResponse<CommentDeletionScopeResponse>, carrying
 *   the authoritative number of comments removed.
 */
export const deleteComment = async (commentId) => {
  const response = await axiosInstance.delete(`/comments/${commentId}`);
  return response.data;
};

export const postService = {
  createPost,
  getFeed,
  getUserPosts,
  getLikedPosts,
  getPostById,
  updatePost,
  deletePost,
  updatePostStatus,
  getExplorePosts,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  getComments,
  getCommentReplies,
  createComment,
  likeComment,
  unlikeComment,
  editComment,
  getCommentDeletionScope,
  deleteComment,
};

export default postService;
