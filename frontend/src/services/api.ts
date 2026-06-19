import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gopay_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.url?.startsWith('/api/')) config.url = config.url.slice(4);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.config) return Promise.reject(error);
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
      return Promise.reject(error);
    }
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('gopay_refresh');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('gopay_token', data.accessToken);
          localStorage.setItem('gopay_refresh', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          const { logout } = await import('./auth');
          logout();
          window.location.hash = '#/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
