import axiosInstance from './axiosInstance';

const USERS_API_PATH = '/users';

// Get a user's public profile
export const getUserProfile = async (userId) => {
  const response = await axiosInstance.get(`${USERS_API_PATH}/${userId}`);
  return response.data;
};

// Update my profile
export const updateMyProfile = async (data) => {
  const response = await axiosInstance.patch(`${USERS_API_PATH}/me`, data);
  return response.data;
};
