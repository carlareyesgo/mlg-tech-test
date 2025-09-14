import axios from 'axios';
import { Platform } from 'react-native';

const IOS_URL = process.env.EXPO_PUBLIC_API_URL_IOS || 'http://localhost:5296';
const ANDROID_URL = process.env.EXPO_PUBLIC_API_URL_ANDROID || 'http://10.0.2.2:5296';
export const baseURL = Platform.OS === 'android' ? ANDROID_URL : IOS_URL;

export const makeAxios = () => {
  const api = axios.create({ baseURL, timeout: 8000 });
  return api;
};
