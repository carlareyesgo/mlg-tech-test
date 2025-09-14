import { User, Tokens } from './models';

export interface AuthRepository {
  register(params: { email: string; password: string; name?: string }): Promise<{ user: User; tokens: Tokens }>;
  login(params: { email: string; password: string }): Promise<{ user: User; tokens: Tokens }>;
  me(): Promise<{ id: string; email: string }>;
  refresh(refreshToken: string): Promise<Tokens>;
}
