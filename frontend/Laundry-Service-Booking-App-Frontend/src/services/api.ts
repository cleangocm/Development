import axios from 'axios';

// API base URL pointing to the production backend
const getBaseURL = (): string => {
  // If explicitly set in env, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Default to production backend
  return 'https://laundry-service-booking-app-backend.onrender.com/api/v1';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds to account for retries with exponential backoff
  withCredentials: false, // Don't send cookies with requests
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Status codes that redirect to the error page (not auth endpoints)
const ERROR_PAGE_CODES = new Set([402, 403, 408, 410, 429, 500, 502, 503, 504]);

// Status codes that should trigger a retry
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const errorCode = error.code || 'UNKNOWN';
    const errorMsg = error.message || 'Unknown error';
    const status = error.response?.status;

    const config = error.config;
    const requestUrl = config?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/');
    // status is already defined above, no need to redefine

    // Retry logic for server errors
    if (status && RETRYABLE_STATUS_CODES.has(status) && !isAuthEndpoint) {
      const retryCount = (config as Record<string, unknown>)?.__retryCount as number ?? 0;
      const maxRetries = 3;

      if (retryCount < maxRetries) {
        (config as Record<string, unknown>).__retryCount = retryCount + 1;
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return api(config);
      }
    }

    if (status === 401 && !isAuthEndpoint) {
      // Unauthorized on a protected endpoint — clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status && ERROR_PAGE_CODES.has(status) && !isAuthEndpoint) {
      // Redirect to the dedicated error page for server/permission errors (after retries exhausted)
      const message = error.response?.data?.message
        ? encodeURIComponent(error.response.data.message)
        : '';
      window.location.href = `/error-page?code=${status}${message ? `&message=${message}` : ''}`;
      return Promise.reject(error);
    }

    // For client errors (400, 404, etc.) on non-auth endpoints, reject silently
    // so components can handle them locally without crashing
    return Promise.reject(error);
  }
);

export default api;
