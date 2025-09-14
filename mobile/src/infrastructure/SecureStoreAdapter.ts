import * as SecureStore from 'expo-secure-store';

export interface ISecureStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export class SecureStoreAdapter implements ISecureStorage {
  async get(key: string) { return (await SecureStore.getItemAsync(key)) ?? null; }
  async set(key: string, value: string) { await SecureStore.setItemAsync(key, value); }
  async delete(key: string) { await SecureStore.deleteItemAsync(key); }
}
