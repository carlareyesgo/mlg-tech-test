import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../domain/models';   

const secureStorage: StateStorage = {
  getItem: async (name) => {
    const v = await SecureStore.getItemAsync(name);
    return v ?? null; 
  },
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};

type AuthState = {
  user: User | null;
  accessToken?: string;
  refreshToken?: string;
  setAuth: (u: User, at: string, rt: string) => void;
  clear: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: undefined,
      refreshToken: undefined,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      clear: () => set({ user: null, accessToken: undefined, refreshToken: undefined }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => secureStorage),

      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export const getTokens = () => {
  const s = useAuth.getState();
  return { accessToken: s.accessToken, refreshToken: s.refreshToken };
};
export const setTokens = (accessToken: string, refreshToken: string) => {
  const s = useAuth.getState();
  useAuth.setState({ ...s, accessToken, refreshToken });
};
export const clearAuth = () => useAuth.getState().clear();
