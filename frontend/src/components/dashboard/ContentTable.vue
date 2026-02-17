<script setup lang="ts">
import { computed, ref } from "vue";
import type { Platform } from "@/types/platform";
import type { Video } from "@/types/video";
import { VideoDetailModal } from "@/components/dashboard";
import { formatNumber } from "@/utils/format";
import {
  calculateEngagementRate,
  formatTimeAgo,
  getPlatformBadge,
  capitalize,
  truncateText,
  formatDuration,
  formatDate,
} from "@/utils/video";

interface Props {
  platform?: Platform;
  videos?: Video[];
};

const props = withDefaults(defineProps<Props>(), {
  platform: "all",
  videos: undefined,
});

// Video detail modal state
const selectedVideoId = ref<string | null>(null);
const isModalOpen = ref(false);

const openVideoDetail = (videoId: string) => {
  selectedVideoId.value = videoId;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedVideoId.value = null;
};

const filteredContent = computed(() => {
  if (props.videos && props.videos.length > 0) {
    return props.videos.map((video: Video) => ({
      id: video.id,
      title: video.video_description || "Untitled",
      thumbnail:
        video.cover_image_url ||
        "https://images.unsplash.com/photo-1611162616305-c69b3e718c5?w=100&h=100&fit=crop",
      platform: props.platform as Platform,
      duration: video.duration || 0,
      views: video.view_count || 0,
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
      created: video.create_time || "",
      timeAgo: formatTimeAgo(video.create_time),
    }));
  }
  return [];
});

const hasVideoData = computed(() => {
  return (
    props.videos &&
    props.videos.length > 0 &&
    props.videos.some((v: Video) => (v.view_count || 0) > 0)
  );
});
</script>

<template>
  <div class="brutal-card rounded-none overflow-hidden">
    <!-- Header -->
    <div
      class="p-6 flex items-center justify-between border-b-4 border-black bg-neo-accent dark:bg-[#FF0099] dark:border-[#00F0FF]">
      <h3 class="text-lg font-bold text-slate-900 dark:text-black">
        Top Performing Content
      </h3>
      <button
        class="text-primary-600 dark:text-white text-sm font-semibold hover:underline">
        View All
      </button>
    </div>

    <template v-if="filteredContent.length === 0">
      <div class="p-12 text-center">
        <p class="text-slate-500 dark:text-slate-400 text-lg">No content yet</p>
        <p
          v-if="props.videos && props.videos.length > 0 && !hasVideoData"
          class="text-xs text-slate-400 dark:text-slate-500 mt-2">
          TikTok API returned video data with 0 views. This is normal in sandbox
          mode.
        </p>
      </div>
    </template>

    <template v-else>
      <!-- Desktop Table -->
      <div class="hidden md:block overflow-x-auto">
        <table
          class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead
            class="bg-black text-white dark:text-electric/70 font-bold border-b-4 border-black">
            <tr>
              <th class="px-4 py-4">Content</th>
              <th class="px-4 py-4 text-center">Date Created</th>
              <th class="px-4 py-4 text-center">Duration</th>
              <th class="px-4 py-4 text-center">Views</th>
              <th class="px-4 py-4 text-center">Likes</th>
              <th class="px-4 py-4 text-center">Shares</th>
              <th class="px-4 py-4 text-center">Comments</th>
              <th class="px-4 py-4 text-center">Engagement</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-y-2 divide-black">
            <tr
              v-for="item in filteredContent"
              :key="item.id"
              @click="openVideoDetail(item.id)"
              class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer">
              <td class="px-4 py-4 min-w-[200px]">
                <div class="flex items-center gap-3">
                  <img
                    :src="item.thumbnail"
                    :alt="item.title"
                    class="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-100 dark:ring-slate-700 shrink-0" />
                  <span
                    class="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors truncate"
                    :title="item.title">
                    {{ truncateText(item.title, 40) }}
                  </span>
                </div>
              </td>
              <td
                class="px-4 py-4 whitespace-nowrap font-semibold text-xs text-center">
                {{ formatDate(item.created) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap font-semibold text-center">
                {{ formatDuration(item.duration || 0) }}
              </td>
              <td
                class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.views || 0) }}
              </td>
              <td
                class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.likes || 0) }}
              </td>
              <td
                class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.shares || 0) }}
              </td>
              <td
                class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.comments || 0) }}
              </td>
              <td
                class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ calculateEngagementRate(item).toFixed(1) + "%" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div
        class="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
        <div
          v-for="item in filteredContent"
          :key="item.id"
          @click="openVideoDetail(item.id)"
          class="p-4 flex gap-4 active:bg-slate-50 dark:active:bg-slate-700/50 cursor-pointer">
          <img
            :src="item.thumbnail"
            :alt="item.title"
            class="w-16 h-16 rounded-lg object-cover shrink-0" />
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <h4
              class="text-sm font-bold text-slate-900 dark:text-white truncate">
              {{ item.title }}
            </h4>
            <div class="flex items-center gap-2 mt-1">
              <span
                :class="[
                  'text-[10px] font-bold uppercase px-1.5 py-0.5',
                  getPlatformBadge(item.platform).bg,
                  getPlatformBadge(item.platform).text,
                ]">
                {{
                  item.platform === "instagram"
                    ? "Insta"
                    : capitalize(item.platform)
                }}
              </span>
              <span class="text-xs text-slate-400 dark:text-slate-500"
                >• {{ item.timeAgo }}</span
              >
            </div>
          </div>
          <div class="flex flex-col justify-center items-end text-right">
            <span class="text-lg font-bold text-slate-900 dark:text-white">{{
              item.views
            }}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium"
              >Views</span
            >
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Video Detail Modal -->
  <VideoDetailModal
    v-if="selectedVideoId"
    :platform="platform"
    :video-id="selectedVideoId"
    :is-open="isModalOpen"
    @close="closeModal" />
</template>
