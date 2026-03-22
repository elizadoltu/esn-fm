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
      globalThis.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default client;
