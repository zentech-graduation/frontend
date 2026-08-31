import axiosInstance from './axiosInstance';

const USERS_API_PATH = '/users';

// Get a user's public profile
export const getUserProfile = async (userId) => {
  const response = await axiosInstance.get(`${USERS_API_PATH}/${userId}`);
  return response.data;
};

// Get my own full profile (includes fields, like isPrivate, that the public
// profile view omits or restricts).
export const getMyProfile = async () => {
  const response = await axiosInstance.get(`${USERS_API_PATH}/me`);
  return response.data;
};

// Update my profile
export const updateMyProfile = async (data) => {
  const response = await axiosInstance.patch(`${USERS_API_PATH}/me`, data);
  return response.data;
};

// Get my notification and privacy settings
export const getMySettings = async () => {
  const response = await axiosInstance.get(`${USERS_API_PATH}/me/settings`);
  return response.data;
};

// Update my notification and privacy settings (partial - omit fields to leave unchanged)
export const updateMySettings = async (data) => {
  const response = await axiosInstance.patch(`${USERS_API_PATH}/me/settings`, data);
  return response.data;
};

// The warnings a moderator has issued against my own account, newest first.
// Read-only: nothing a person can do removes one. `cursor` and `limit` are the
// only query parameters this endpoint declares.
export const getMyWarnings = async (cursor, limit = 20, signal) => {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  const response = await axiosInstance.get(`${USERS_API_PATH}/me/warnings`, { params, signal });
  return response.data;
};
