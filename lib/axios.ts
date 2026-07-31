import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
  },
});

/**
 * Request Interceptor
 * Useful for:
 * - Attaching authentication tokens
 * - Adding correlation IDs
 * - Logging requests
 */
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor
 * Useful for:
 * - Global error handling
 * - Token refresh
 * - Response transformation
 */
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default api;
