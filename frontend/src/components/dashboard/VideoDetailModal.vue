<script setup lang="ts">
import { computed, onMounted } from "vue";
import {
  X,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
} from "lucide-vue-next";
import {
  useVideoAnalytics,
  type VideoDetailData,
} from "@/composables/useVideoAnalytics";
import BrutalBadge from "./BrutalBadge.vue";

interface Props {
  platform: string;
  videoId: string;
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const { loading, videoData, fetchVideoDetail } = useVideoAnalytics();

const engagementRate = computed(() => {
  if (!videoData.value) return 0;
  const { views, likes, comments, shares } = videoData.value;
  if (views === 0) return 0;
  return (((likes + comments + shares) / views) * 100).toFixed(1);
});

const formatNumber = (num: number): string => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

onMounted(() => {
  if (props.isOpen) {
    fetchVideoDetail(props.platform, props.videoId);
  }
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    @click.self="emit('close')">
    <div
      class="bg-white dark:bg-slate-800 border-4 border-black dark:border-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none shadow-brutal">
      <!-- Header -->
      <div
        class="sticky top-0 bg-white dark:bg-slate-800 border-b-4 border-black dark:border-white p-4 flex items-center justify-between z-10">
        <h2
          class="text-2xl font-black uppercase text-slate-900 dark:text-white">
          Video Analytics
        </h2>
        <button
          @click="emit('close')"
          class="w-10 h-10 bg-red-500 hover:bg-red-600 text-white border-2 border-black dark:border-white flex items-center justify-center transition-colors">
          <X :size="20" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
        <p class="mt-4 font-bold text-slate-600 dark:text-slate-400">
          Loading analytics...
        </p>
      </div>

      <!-- Content -->
      <div v-else-if="videoData" class="p-6">
        <!-- Video Info -->
        <div class="flex gap-4 mb-6">
          <img
            :src="videoData.thumbnail || videoData.cover_image_url"
            :alt="videoData.title"
            class="w-32 h-32 rounded-lg object-cover border-2 border-black dark:border-white shrink-0" />
          <div class="flex-1 min-w-0">
            <h3
              class="text-xl font-black text-slate-900 dark:text-white mb-2 line-clamp-2">
              {{ videoData.title || videoData.description || "Untitled Video" }}
            </h3>
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Duration: {{ Math.floor(videoData.duration / 60) }}:{{
                (videoData.duration % 60).toString().padStart(2, "0")
              }}
            </p>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            class="bg-blue-400 dark:bg-blue-900/40 border-2 border-black dark:border-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform hover:-translate-y-1">
            <div class="flex items-center gap-2 mb-2">
              <Eye :size="18" class="text-black dark:text-white" />
              <span
                class="text-xs font-black uppercase text-slate-700 dark:text-slate-300"
                >Views</span
              >
            </div>
            <p
              class="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {{ formatNumber(videoData.views) }}
            </p>
          </div>
          <div
            class="bg-pink-400 dark:bg-pink-900/40 border-2 border-black dark:border-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform hover:-translate-y-1">
            <div class="flex items-center gap-2 mb-2">
              <Heart :size="18" class="text-black dark:text-white" />
              <span
                class="text-xs font-black uppercase text-slate-700 dark:text-slate-300"
                >Likes</span
              >
            </div>
            <p
              class="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {{ formatNumber(videoData.likes) }}
            </p>
          </div>
          <div
            class="bg-yellow-400 dark:bg-yellow-900/40 border-2 border-black dark:border-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform hover:-translate-y-1">
            <div class="flex items-center gap-2 mb-2">
              <MessageCircle :size="18" class="text-black dark:text-white" />
              <span
                class="text-xs font-black uppercase text-slate-700 dark:text-slate-300"
                >Comments</span
              >
            </div>
            <p
              class="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {{ formatNumber(videoData.comments) }}
            </p>
          </div>
          <div
            class="bg-green-400 dark:bg-green-900/40 border-2 border-black dark:border-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform hover:-translate-y-1">
            <div class="flex items-center gap-2 mb-2">
              <Share2 :size="18" class="text-black dark:text-white" />
              <span
                class="text-xs font-black uppercase text-slate-700 dark:text-slate-300"
                >Shares</span
              >
            </div>
            <p
              class="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {{ formatNumber(videoData.shares) }}
            </p>
          </div>
        </div>

        <!-- Engagement Rate -->
        <div
          class="bg-cyber-yellow border-2 border-black dark:border-white p-4 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-black uppercase text-black/70">
                Engagement Rate
              </p>
              <p class="text-3xl font-mono font-bold text-black">
                {{ engagementRate }}%
              </p>
            </div>
            <TrendingUp :size="32" class="text-black" />
          </div>
        </div>

        <!-- Demographics (if available) -->
        <div v-if="videoData.demographics" class="space-y-6">
          <!-- Age Range -->
          <div
            v-if="videoData.demographics.age_range"
            class="border-2 border-black dark:border-white p-4">
            <h4
              class="text-sm font-black uppercase mb-3 text-slate-900 dark:text-white">
              Age Distribution
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in videoData.demographics.age_range"
                :key="item.range"
                class="flex items-center gap-2">
                <span
                  class="text-xs font-bold w-16 text-slate-600 dark:text-slate-400"
                  >{{ item.range }}</span
                >
                <div
                  class="flex-1 bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                  <div
                    class="bg-neo-accent h-full"
                    :style="{ width: `${item.percentage}%` }"></div>
                </div>
                <span
                  class="text-xs font-bold w-10 text-right text-slate-900 dark:text-white"
                  >{{ item.percentage }}%</span
                >
              </div>
            </div>
          </div>

          <!-- Gender -->
          <div
            v-if="videoData.demographics.gender"
            class="border-2 border-black dark:border-white p-4">
            <h4
              class="text-sm font-black uppercase mb-3 text-slate-900 dark:text-white">
              Gender Distribution
            </h4>
            <div class="flex gap-4">
              <div
                v-for="item in videoData.demographics.gender"
                :key="item.gender"
                class="flex-1 text-center">
                <div
                  class="bg-slate-100 dark:bg-slate-700 border-2 border-black dark:border-white p-3 rounded-lg">
                  <p class="text-2xl font-bold text-slate-900 dark:text-white">
                    {{ item.percentage }}%
                  </p>
                  <p
                    class="text-xs uppercase text-slate-600 dark:text-slate-400 mt-1">
                    {{ item.gender }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Countries -->
          <div
            v-if="videoData.demographics.top_countries"
            class="border-2 border-black dark:border-white p-4">
            <h4
              class="text-sm font-black uppercase mb-3 text-slate-900 dark:text-white">
              Top Countries
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in videoData.demographics.top_countries"
                :key="item.country"
                class="flex items-center gap-2">
                <span
                  class="text-xs font-bold w-24 text-slate-600 dark:text-slate-400"
                  >{{ item.country }}</span
                >
                <div
                  class="flex-1 bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                  <div
                    class="bg-primary-500 h-full"
                    :style="{ width: `${item.percentage}%` }"></div>
                </div>
                <span
                  class="text-xs font-bold w-10 text-right text-slate-900 dark:text-white"
                  >{{ item.percentage }}%</span
                >
              </div>
            </div>
          </div>

          <!-- Top Cities -->
          <div
            v-if="videoData.demographics.top_cities"
            class="border-2 border-black dark:border-white p-4">
            <h4
              class="text-sm font-black uppercase mb-3 text-slate-900 dark:text-white">
              Top Cities
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div
                v-for="item in videoData.demographics.top_cities"
                :key="item.city"
                class="bg-slate-100 dark:bg-slate-700 border border-black dark:border-white p-2 text-center">
                <p class="text-lg font-bold text-slate-900 dark:text-white">
                  {{ item.percentage }}%
                </p>
                <p
                  class="text-[10px] uppercase text-slate-600 dark:text-slate-400 truncate">
                  {{ item.city }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Traffic Sources (if available) -->
        <div
          v-if="videoData.traffic_sources"
          class="border-2 border-black dark:border-white p-4 mt-6">
          <h4
            class="text-sm font-black uppercase mb-3 text-slate-900 dark:text-white">
            Traffic Sources
          </h4>
          <div class="space-y-2">
            <div
              v-for="item in videoData.traffic_sources"
              :key="item.source"
              class="flex items-center gap-2">
              <span
                class="text-xs font-bold w-24 text-slate-600 dark:text-slate-400"
                >{{ item.source }}</span
              >
              <div
                class="flex-1 bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                <div
                  class="bg-green-500 h-full"
                  :style="{ width: `${item.percentage}%` }"></div>
              </div>
              <span
                class="text-xs font-bold w-10 text-right text-slate-900 dark:text-white"
                >{{ item.percentage }}%</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="p-12 text-center">
        <p class="text-red-500 font-bold">Failed to load video analytics</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
