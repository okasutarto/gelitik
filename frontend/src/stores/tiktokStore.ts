import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/api";

const TTL = 15 * 60 * 1000; // 15 minutes

export interface TikTokStoreData {
  videos: Record<string, unknown>[];
  analytics: {
    followers: number;
    following: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    engagementRate: number;
  };
  userInfo: {
    id: string;
    display_name: string;
    avatar_url: string;
    bio_description: string;
    follower_count: number;
    following_count: number;
    likes_count: number;
    video_count: number;
    is_verified: boolean;
  };
}

export const useTiktokStore = defineStore("tiktok", () => {
  const data = ref<TikTokStoreData | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastFetched = ref<number | null>(null);

  async function fetch() {
    // Skip if within TTL
    if (lastFetched.value && Date.now() - lastFetched.value < TTL && data.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get("/api/analytics/tiktok");
      data.value = response.data?.data ?? response.data;
      lastFetched.value = Date.now();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch TikTok analytics";
      error.value = msg;
      console.error("[TikTokStore] Fetch error:", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function refresh() {
    lastFetched.value = null;
    await fetch();
  }

  function clear() {
    data.value = null;
    error.value = null;
    lastFetched.value = null;
  }

  return {
    data,
    isLoading,
    error,
    lastFetched,
    fetch,
    refresh,
    clear,
  };
});
