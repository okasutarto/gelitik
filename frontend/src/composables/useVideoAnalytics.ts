import { ref } from "vue";
import api from "@/services/api";
import type { VideoDetailData } from "@/types/video";
import type { AxiosError } from "axios";

export type { VideoDetailData } from "@/types/video";

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}

export function useVideoAnalytics() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const videoData = ref<VideoDetailData | null>(null);

  const fetchVideoDetail = async (platform: string, videoId: string) => {
    try {
      loading.value = true;
      error.value = null;
      const { data } = await api.get(`/api/analytics/${platform}/video/${videoId}`);
      videoData.value = data;
      return data;
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        error.value = (err.response?.data as any)?.error || "Failed to fetch video analytics";
      } else {
        error.value = "Failed to fetch video analytics";
      }
      console.error("Video detail fetch error:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    videoData,
    fetchVideoDetail,
  };
}
