import axiosInstance from '@/services/axiosInstance';

/**
 * Auth service — all API calls related to authentication.
 */
const authService = {
  /**
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ user: object, token: string }>}
   */
  login: async (credentials) => {
    const { data } = await axiosInstance.post('/auth/login', credentials);
    return data;
  },

  /**
   * @param {{ name: string, email: string, password: string }} payload
   * @returns {Promise<{ user: object, token: string }>}
   */
  register: async (payload) => {
    const { data } = await axiosInstance.post('/auth/register', payload);
    return data;
  },

  /**
   * @returns {Promise<void>}
   */
  logout: async () => {
    await axiosInstance.post('/auth/logout');
  },

  /**
   * @returns {Promise<object>}
   */
  getMe: async () => {
    const { data } = await axiosInstance.get('/auth/me');
    return data;
  },
};

export default authService;
