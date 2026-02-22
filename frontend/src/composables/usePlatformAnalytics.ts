import { ref } from "vue";
import api from "@/services/api";
import type { PlatformData } from "@/types/analytics";
import type { AxiosError } from "axios";

export type { PlatformData } from "@/types/analytics";

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}

export function usePlatformAnalytics(platform: string) {
  const loading = ref(true);
  const error = ref<string | null>(null);
  const accountData = ref<PlatformData | null>(null);

  const fetchAnalytics = async (timeframe?: string) => {
    try {
      loading.value = true;
      error.value = null;
      const config = timeframe ? { params: { timeframe } } : {};
      const { data } = await api.get(`/api/analytics/${platform}`, config);
      accountData.value = data;
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          error.value = "Unauthorized";
        } else {
          error.value = (err.response?.data as any)?.error || "Failed to fetch analytics";
        }
      } else {
        error.value = "An unexpected error occurred";
      }
      console.error("Analytics fetch error:", err);
    } finally {
      loading.value = false;
    }
  };

  const fetchOverview = async () => {
    try {
      const { data } = await api.get("/api/analytics/overview");
      return data;
    } catch (err: unknown) {
      console.error("Overview fetch error:", err);
      throw err;
    }
  };

  return {
    loading,
    error,
    accountData,
    fetchAnalytics,
    fetchOverview,
  };
}
