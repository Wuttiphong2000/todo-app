// src/api/client.ts
import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error?.message ?? err.message ?? "Unknown error";
    return Promise.reject(new Error(msg));
  }
);

export default client;