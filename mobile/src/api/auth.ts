import { api } from './client';

export type User = { id: string; email: string; name?: string | null };

export async function register(email: string, password: string, name?: string) {
  const { data } = await api.post('/api/auth/register', { email, password, name });
  return data as { user: User; tokens: { accessToken: string; refreshToken: string } };
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data as { user: User; tokens: { accessToken: string; refreshToken: string } };
}

export async function me() {
  const { data } = await api.get('/api/auth/me');
  return data as { id: string; email: string };
}
