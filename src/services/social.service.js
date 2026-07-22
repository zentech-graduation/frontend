import axiosInstance from './axiosInstance';

const SOCIAL_API_PATH = '/social';
const USERS_API_PATH = '/users'; // for suggestions

// Follow a user
export const followUser = async (targetUserId) => {
  const response = await axiosInstance.post(`${SOCIAL_API_PATH}/follow/${targetUserId}`);
  return response.data;
};

// Unfollow a user
export const unfollowUser = async (targetUserId) => {
  const response = await axiosInstance.delete(`${SOCIAL_API_PATH}/follow/${targetUserId}`);
  return response.data;
};

// Block a user
export const blockUser = async (targetUserId) => {
  const response = await axiosInstance.post(`${SOCIAL_API_PATH}/block/${targetUserId}`);
  return response.data;
};

// Unblock a user
export const unblockUser = async (targetUserId) => {
  const response = await axiosInstance.delete(`${SOCIAL_API_PATH}/block/${targetUserId}`);
  return response.data;
};

// Get followers
export const getFollowers = async (userId, cursor, limit = 20) => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  if (limit) params.append('limit', limit.toString());
  
  const response = await axiosInstance.get(`${SOCIAL_API_PATH}/users/${userId}/followers?${params.toString()}`);
  return response.data;
};

// Get following
export const getFollowing = async (userId, cursor, limit = 20) => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  if (limit) params.append('limit', limit.toString());
  
  const response = await axiosInstance.get(`${SOCIAL_API_PATH}/users/${userId}/following?${params.toString()}`);
  return response.data;
};

// Get pending follow requests
export const getPendingFollowRequests = async () => {
  const response = await axiosInstance.get(`${SOCIAL_API_PATH}/follow-requests`);
  return response.data;
};

// Approve follow request
export const approveFollowRequest = async (requesterId) => {
  const response = await axiosInstance.patch(`${SOCIAL_API_PATH}/follow-requests/${requesterId}/approve`);
  return response.data;
};

// Reject follow request
export const rejectFollowRequest = async (requesterId) => {
  const response = await axiosInstance.patch(`${SOCIAL_API_PATH}/follow-requests/${requesterId}/reject`);
  return response.data;
};

// Get suggested users
export const getSuggestedUsers = async () => {
  const response = await axiosInstance.get(`${USERS_API_PATH}/suggestions`);
  return response.data;
};
