import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(
    (() => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored || stored === "null") return null;
        return JSON.parse(stored) as User;
      } catch {
        localStorage.removeItem("user");
        return null;
      }
    })()
  );
  const token = ref<string | null>(localStorage.getItem("token"));
  const isAuthenticated = computed(() => !!token.value);
  const isLoading = ref(false);

  const setAuth = (newUser: User, newToken: string) => {
    user.value = newUser;
    token.value = newToken;
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", newToken);
  };

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.user, data.token);
      return { success: true };
    } catch (error: unknown) {
      let message = "Login failed";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        message = axiosError.response?.data?.error || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      return { success: false, error: message };
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    isLoading.value = true;
    try {
      await api.post("/auth/register", { email, password, name });
      // Do not auto-login; user must verify email first
      return { success: true };
    } catch (error: unknown) {
      let message = "Registration failed";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        message = axiosError.response?.data?.error || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      return { success: false, error: message };
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const checkSession = async () => {
    if (!token.value) return false;

    try {
      const { data } = await api.get("/auth/me");
      user.value = data;
      localStorage.setItem("user", JSON.stringify(data));
      return true;
    } catch {
      logout();
      return false;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkSession,
    setAuth,
  };
});
