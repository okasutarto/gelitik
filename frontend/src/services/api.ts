import axios, { type AxiosError } from "axios";
import { useToast } from "@/composables/useToast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Centralized Error Handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const toast = useToast();

    // Handle specific HTTP status codes
    switch (error.response?.status) {
      case 401:
        // Unauthorized - clear session and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        break;

      case 403:
        // Forbidden
        toast.error("You do not have permission to perform this action");
        break;

      case 404:
        // Not Found
        toast.error("The requested resource was not found");
        break;

      case 429:
        // Too Many Requests
        toast.error("Too many requests. Please try again later.");
        break;

      case 500:
      case 502:
      case 503:
        // Server errors
        toast.error("Server error. Please try again later.");
        break;

      default:
        // Other errors - show message from API or generic message
        const errorMessage =
          error.response?.data?.error || error.response?.data?.message || error.message;
        if (errorMessage && errorMessage !== "Unauthorized") {
          toast.error(errorMessage);
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
