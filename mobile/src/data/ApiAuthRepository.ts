import type { AuthRepository } from '../domain/AuthRepository';
import type { User, Tokens } from '../domain/models';
import type { AxiosInstance } from 'axios';

export class ApiAuthRepository implements AuthRepository {
  constructor(private api: AxiosInstance) {}

  async register(p: { email: string; password: string; name?: string }) {
    const { data } = await this.api.post('/api/auth/register', p);
    return data as { user: User; tokens: Tokens };
  }
  async login(p: { email: string; password: string }) {
    const { data } = await this.api.post('/api/auth/login', p);
    return data as { user: User; tokens: Tokens };
  }
  async me() {
    const { data } = await this.api.get('/api/auth/me');
    return data as { id: string; email: string };
  }
  async refresh(refreshToken: string) {
    const { data } = await this.api.post('/api/auth/refresh', { refreshToken });
    return data as Tokens;
  }
}
