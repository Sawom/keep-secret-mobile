import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
const baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

if (!baseURL)
  console.warn("Set EXPO_PUBLIC_API_URL in .env before starting the app.");
export const api = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

export async function clearNativeCookies() {
  /* Browser cookies are cleared by the backend logout response. */
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (r) => r.data,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const url = config?.url ?? "";
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      /\/auth\/(login|register|refresh|logout|forgot-password|reset-password)/.test(
        url,
      )
    )
      return Promise.reject(error);
    config._retry = true;

    if (!refreshPromise)
      refreshPromise = axios
        .post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 20000 },
        )
        .finally(() => {
          refreshPromise = null;
        });
    try {
      await refreshPromise;
      return api(config);
    } catch (e) {
      return Promise.reject(e);
    }
  },
);
