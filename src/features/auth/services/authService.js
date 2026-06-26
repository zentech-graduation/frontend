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

  /**
   * @param {{ token: string, email?: string }} values
   * @returns {Promise<object>}
   */
  verifyEmail: async (values) => authApi.verifyEmail(values),

  /**
   * @param {{ email: string }} values
   * @returns {Promise<object>}
   */
  resendVerification: async (values) => authApi.resendVerification(values),

  /**
   * @param {{ email: string }} values
   * @returns {Promise<object>}
   */
  forgotPassword: async (values) => authApi.forgotPassword(values),

  /**
   * @param {{ token: string, password: string }} values
   * @returns {Promise<object>}
   */
  resetPassword: async (values) => authApi.resetPassword(values),

  /**
   * @param {string} code
   * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
   */
  exchangeOAuthCode: async (code) => authApi.exchangeOAuthCode(code),
};

export default authService;
