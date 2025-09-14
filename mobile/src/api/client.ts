import axios from 'axios';
import { Platform } from 'react-native';
import { getTokens, setTokens, clearAuth } from '../store/auth';

const IOS_URL = process.env.EXPO_PUBLIC_API_URL_IOS || 'http://localhost:5296';
const ANDROID_URL = process.env.EXPO_PUBLIC_API_URL_ANDROID || 'http://10.0.2.2:5296';

export const baseURL = Platform.OS === 'android' ? ANDROID_URL : IOS_URL;

export const api = axios.create({ baseURL });

api.defaults.timeout = 8000;

// Incluye access token en cada request
api.interceptors.request.use(async (config) => {
  const { accessToken } = getTokens();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Refresh automático
let isRefreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const { refreshToken } = getTokens();
      if (!refreshToken) {
        clearAuth();
        return Promise.reject(error);
      }

      // cola simple para evitar múltiples refresh en paralelo
      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
      }

      try {
        isRefreshing = true;
        const r = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken });
        setTokens(r.data.accessToken, r.data.refreshToken);
        queue.forEach(fn => fn());
        queue = [];
        return api(original); // reintenta
      } catch (e) {
        clearAuth();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
