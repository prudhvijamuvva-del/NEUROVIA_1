import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brandshield_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register') && !window.location.pathname.startsWith('/verify-otp') && window.location.pathname !== '/') {
      localStorage.removeItem('brandshield_access_token');
      localStorage.removeItem('brandshield_refresh_token');
      localStorage.removeItem('brandshield_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
