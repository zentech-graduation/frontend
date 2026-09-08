import axiosInstance from './axiosInstance';

const SUPPORT_API_PATH = '/support';
const ADMIN_API_PATH = '/admin';

export const getVerificationCategories = async (signal) => {
  const response = await axiosInstance.get(`${SUPPORT_API_PATH}/verification/categories`, {
    signal,
  });
  return response.data;
};

export const getMyVerification = async (signal) => {
  const response = await axiosInstance.get(`${SUPPORT_API_PATH}/verification/me`, { signal });
  return response.data;
};

export const submitVerificationRequest = async (payload) => {
  const response = await axiosInstance.post(`${SUPPORT_API_PATH}/verification/requests`, payload);
  return response.data;
};

// Staff surface. Both moderator and admin reach these; verification is a discretionary grant
// rather than an enforcement action, so it is not narrowed to administrators the way an appeal is.
export const getVerificationQueue = async (status, limit = 20, signal) => {
  const response = await axiosInstance.get(`${ADMIN_API_PATH}/verification/requests`, {
    params: status ? { status, limit } : { limit },
    signal,
  });
  return response.data;
};

export const approveVerification = async (ticketId, payload) => {
  const response = await axiosInstance.post(
    `${ADMIN_API_PATH}/verification/requests/${ticketId}/approve`,
    payload
  );
  return response.data;
};

export const rejectVerification = async (ticketId, payload) => {
  const response = await axiosInstance.post(
    `${ADMIN_API_PATH}/verification/requests/${ticketId}/reject`,
    payload
  );
  return response.data;
};

export const revokeVerification = async (userId, payload) => {
  const response = await axiosInstance.post(
    `${ADMIN_API_PATH}/verification/users/${userId}/revoke`,
    payload
  );
  return response.data;
};
