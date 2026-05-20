import { authApi } from '@/api/authApi';

/**
 * Auth service — all API calls related to authentication.
 */
const authService = {
  /**
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ user: object, token: string }>}
   */
  login: async (credentials) => {
    return authApi.login(credentials);
  },

  /**
   * @param {{ name: string, email: string, password: string }} payload
   * @returns {Promise<{ user: object, token: string }>}
   */
  register: async (payload) => {
    return authApi.register(payload);
  },

  /**
   * @returns {Promise<void>}
   */
  logout: async (refreshToken) => {
    await authApi.logout(refreshToken);
  },

  /**
   * @returns {Promise<object>}
   */
  getMe: async () => {
    return authApi.getCurrentUser();
  },
};

export default authService;
