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
 * @param {Object} params - Query parameters (e.g., cursor, limit).
 * @returns {Promise<Object>} The paginated posts response.
 */
export const getFeed = async (params = {}) => {
  const response = await axiosInstance.get(`${POST_API_PATH}/feed`, { params });
  return response.data;
};

/**
 * Retrieves a paginated list of explore posts via search.
 */
export const getExplorePosts = async (params = {}) => {
  // Backend requires 'q', fallback to a space or wildcard if empty to avoid 400
  if (!params.q) params.q = 'a'; 
  const response = await axiosInstance.get(`${POST_API_PATH}/search`, { params });
  return response.data;
};

/**
 * Retrieves a paginated list of a user's published posts.
 * @param {string|number} userId - The ID of the user.
 * @param {Object} params - Query parameters (e.g., cursor, limit).
 * @returns {Promise<Object>} The paginated posts response.
 */
export const getUserPosts = async (userId, params = {}) => {
  const response = await axiosInstance.get(`${POST_API_PATH}/user/${userId}`, { params });
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
 * @param {string} status - The new status (e.g., 'PUBLISHED', 'ARCHIVED').
 * @returns {Promise<Object>} The updated post.
 */
export const updatePostStatus = async (postId, status) => {
  const response = await axiosInstance.patch(`${POST_API_PATH}/${postId}/status`, { status });
  return response.data;
};

export const postService = {
  createPost,
  getFeed,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  updatePostStatus,
  getExplorePosts,
};

export default postService;
