import axios from "axios";

export const API_BASE_URL = "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token dynamically to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("certiflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid/stale token on 401
      localStorage.removeItem("certiflow_token");
      // If the user was on an authenticated route, redirect to login
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/verify")
      ) {
        window.location.href = "/login?session_expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
