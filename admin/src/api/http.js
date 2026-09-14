import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Access token lives only in memory (limits XSS exposure); refresh token is an httpOnly cookie.
let accessToken = null;
let onSessionExpired = () => {};

export const tokenStore = {
  get: () => accessToken,
  set: (token) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};

export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// One shared refresh for all requests that get 401 at the same time.
let refreshPromise = null;

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true })
      .then(({ data }) => {
        tokenStore.set(data.data.accessToken);
        return data.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => original?.url?.includes(p));

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        await refreshSession();
        return http(original);
      } catch (refreshError) {
        tokenStore.clear();
        onSessionExpired();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

/** Unwraps the standard `{ success, message, data, meta }` envelope. */
export const unwrap = (promise) => promise.then(({ data }) => data);
