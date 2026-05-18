// src/api/client.ts
import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (localStorage.getItem("auth_guest") !== "true") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("todo_app_cache");
        window.location.href = "/login";
      }
    }
    const msg =
      err.response?.data?.error ?? err.message ?? "Unknown error";
    return Promise.reject(new Error(msg));
  }
);

export default client;
