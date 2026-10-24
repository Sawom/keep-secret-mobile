import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import CookieManager from '@react-native-cookies/cookies';

const baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
if (!baseURL) console.warn('EXPO_PUBLIC_API_URL is not configured. Copy .env.example to .env and set your backend URL.');

export const api = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Tokens are never copied into AsyncStorage or app-managed files. Native cookie storage
// owns the HttpOnly cookies; this helper only clears the native cookie jar on logout.
// React Native's XHR cookie behavior differs by Android version. Persist Set-Cookie
// headers into the native cookie jar without ever reading token values into app state.
api.interceptors.response.use(async response => {
  if (baseURL) {
    const setCookie = response.headers?.['set-cookie'];
    const values: string[] = Array.isArray(setCookie) ? setCookie : (typeof setCookie === 'string' ? [setCookie] : []);
    for (const cookie of values) { try { await CookieManager.setFromResponse(baseURL, cookie); } catch (error) { console.warn('Could not persist server cookie', error); } }
  }
  return response;
});

export async function clearNativeCookies() {
  try {
    if (baseURL) await CookieManager.clearAll();
  } catch (error) {
    console.warn('Native cookie cleanup failed', error);
  }
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<unknown> | null = null;
api.interceptors.response.use(
  response => response.data,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const url = config?.url ?? '';
    if (error.response?.status !== 401 || !config || config._retry || /\/auth\/(login|register|refresh|logout|forgot-password|reset-password)/.test(url)) {
      return Promise.reject(error);
    }
    config._retry = true;
    if (!refreshPromise) {
      refreshPromise = axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true, timeout: 20000 })
        .finally(() => { refreshPromise = null; });
    }
    try {
      await refreshPromise;
      return api(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
