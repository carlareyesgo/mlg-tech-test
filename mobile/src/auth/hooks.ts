import { useMutation } from '@tanstack/react-query';
import { container } from '../infrastructure/container';
import { useAuth } from '../store/auth';

export const useLogin = () => {
  const setAuth = useAuth(s => s.setAuth);
  return useMutation({
    mutationFn: (p: { email: string; password: string }) => container.authRepo.login(p),
    onSuccess: ({ user, tokens }) => setAuth(user, tokens.accessToken, tokens.refreshToken),
  });
};

export const useRegister = () => {
  const setAuth = useAuth(s => s.setAuth);
  return useMutation({
    mutationFn: (p: { email: string; password: string; name?: string }) => container.authRepo.register(p),
    onSuccess: ({ user, tokens }) => setAuth(user, tokens.accessToken, tokens.refreshToken),
  });
};
