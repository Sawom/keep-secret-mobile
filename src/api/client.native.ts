import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import CookieManager from "@react-native-cookies/cookies";

const baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
if (!baseURL) {
  console.warn(
    "EXPO_PUBLIC_API_URL is not configured. Copy .env.example to .env and set your backend URL.",
  );
}

export const api = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Android's native cookie store is the session source. Cookies are not copied to
// AsyncStorage, SecureStore, or React state. Attach them to Axios requests because
// React Native's XHR cookie behavior differs between Android/dev-client versions.
api.interceptors.request.use(async (config) => {
  if (!baseURL) return config;
  try {
    const cookies = await CookieManager.get(baseURL);
    const cookieHeader = Object.entries(cookies ?? {})
      .filter(
        ([, cookie]) =>
          typeof cookie?.value === "string" && cookie.value.length > 0,
      )
      .map(([name, cookie]) => `${name}=${cookie.value}`)
      .join("; ");
    if (cookieHeader) config.headers.set("Cookie", cookieHeader);
  } catch (error) {
    console.warn("Could not read native session cookie jar", error);
  }
  return config;
});

export async function clearNativeCookies() {
  try {
    if (baseURL) await CookieManager.clearAll();
  } catch (error) {
    console.warn("Native cookie cleanup failed", error);
  }
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<unknown> | null = null;

// Keep cookie persistence and response unwrapping in the SAME success handler.
// This prevents the app's API calls from receiving AxiosResponse where it expects
// response.data, while ensuring Set-Cookie is stored before the next API request.
api.interceptors.response.use(
  async (response) => {
    if (baseURL) {
      const raw: any = response.headers?.["set-cookie"];

      const setCookies: string[] = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? raw
              .split(/,(?=\s*[^;,=\s]+=)/g)
              .map((value: string) => value.trim())
          : [];

      for (const cookie of setCookies) {
        try {
          await CookieManager.setFromResponse(baseURL, cookie);
        } catch (error) {
          console.warn("Could not persist native session cookie", error);
        }
      }
    }
    return response.data;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const url = config?.url ?? "";
    const isAuthRoute =
      /\/auth\/(login|register|refresh|logout|forgot-password|reset-password|google\/mobile)/.test(
        url,
      );
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      isAuthRoute ||
      !baseURL
    ) {
      return Promise.reject(error);
    }

    config._retry = true;
    if (!refreshPromise) {
      refreshPromise = api.post("/auth/refresh", {}).finally(() => {
        refreshPromise = null;
      });
    }
    try {
      await refreshPromise;
      return api(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
