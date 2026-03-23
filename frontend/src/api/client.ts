import axios from "axios";
import { getToken, clearAuth } from "@/lib/auth";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuth();
      const path = globalThis.location.pathname;
      if (path !== "/login" && path !== "/register") {
        globalThis.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

/** Extract a human-readable error message from an Axios (or unknown) error. */
export function extractApiError(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { error?: string }; status?: number };
    message?: string;
  };
  if (e?.response?.data?.error) return e.response.data.error;
  if (e?.message === "Network Error")
    return "Unable to connect. Please check your internet connection.";
  return fallback;
}

export default client;
