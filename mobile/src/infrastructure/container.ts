import mitt from 'mitt';
import { makeAxios, baseURL } from './AxiosClient';
import { ApiAuthRepository } from '../data/ApiAuthRepository';
import { useAuth, getTokens, setTokens, clearAuth } from '../store/auth';

export type Events = {
  'auth:logout': void;
  'auth:tokenRefreshed': void;
};
export const bus = mitt<Events>();

export const container = (() => {
  const api = makeAxios();
  // Bearer
  api.interceptors.request.use((cfg) => {
    const { accessToken } = getTokens();
    if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
    return cfg;
  });
  // Auto refresh
  let refreshing = false; let waiters: Array<() => void> = [];
  api.interceptors.response.use(
    (r) => r,
    async (err) => {
      const original = err.config;
      if (err.response?.status === 401 && !original._retry) {
        original._retry = true;
        const { refreshToken } = getTokens();
        if (!refreshToken) { clearAuth(); bus.emit('auth:logout'); throw err; }

        if (refreshing) await new Promise<void>(res => waiters.push(res));
        try {
          refreshing = true;
          const r = await makeAxios().post(`${baseURL}/api/auth/refresh`, { refreshToken });
          setTokens(r.data.accessToken, r.data.refreshToken);
          bus.emit('auth:tokenRefreshed');
          waiters.splice(0).forEach(fn => fn());
          return api(original);
        } catch (e) {
          clearAuth(); bus.emit('auth:logout'); throw e;
        } finally { refreshing = false; }
      }
      throw err;
    }
  );

  const authRepo = new ApiAuthRepository(api);
  return { api, authRepo, bus };
})();
