import axios from 'axios';

/**
 * axiosInstance — pre-configured Axios client.
 *
 * Interceptors are defined here as bare stubs.
 * Add request auth injection and response error handling below.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    // TODO: Attach Authorization header
    // const token = useAuthStore.getState().token;
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Handle 401 / 403 / 5xx globally
    return Promise.reject(error);
  }
);

export default axiosInstance;
