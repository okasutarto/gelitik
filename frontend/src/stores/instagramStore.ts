import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/api";

const TTL = 15 * 60 * 1000; // 15 minutes

export interface InstagramInsights {
  followers: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  totalInteractions: number;
  profileViews: number;
  accountsEngaged: number;
  following: number;
  mediaCount: number;
}

export interface InstagramProfile {
  id: string;
  name: string;
  username: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
}

export interface InstagramStoreData {
  profile: InstagramProfile;
  insights: InstagramInsights;
  media: Record<string, unknown>[];
}

export const useInstagramStore = defineStore("instagram", () => {
  const data = ref<InstagramStoreData | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastFetched = ref<number | null>(null);

  async function fetch(platform: string = "instagram-graph") {
    // Skip if within TTL
    if (lastFetched.value && Date.now() - lastFetched.value < TTL && data.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/api/analytics/${platform}`);
      data.value = response.data?.data ?? response.data;
      lastFetched.value = Date.now();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch Instagram analytics";
      error.value = msg;
      console.error("[InstagramStore] Fetch error:", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function refresh(platform: string = "instagram-graph") {
    lastFetched.value = null;
    await fetch(platform);
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
