import axiosInstance from './axiosInstance';

const NOTIF_API_PATH = '/notifications';

export const getNotifications = async (params = {}) => {
  const response = await axiosInstance.get(NOTIF_API_PATH, { params });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await axiosInstance.get(`${NOTIF_API_PATH}/unread-count`);
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await axiosInstance.patch(`${NOTIF_API_PATH}/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await axiosInstance.patch(`${NOTIF_API_PATH}/read-all`);
  return response.data;
};
