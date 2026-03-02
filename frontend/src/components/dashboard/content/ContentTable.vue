<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Platform } from "@/types/platform";
import type { Video } from "@/types/video";
import VideoDetailModal from "./VideoDetailModal.vue";
import { formatNumber } from "@/utils/format";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-vue-next";
import {
  calculateEngagementRate,
  formatTimeAgo,
  getPlatformBadge,
  capitalize,
  truncateText,
  formatDuration,
  formatDate,
} from "@/utils/video";

// Extended Video type that includes _platform from dashboardStore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VideoWithPlatform = any;

interface Props {
  platform?: Platform;
  videos?: VideoWithPlatform[];
}

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
    return props.videos.map((video: Video) => {
      const v = video as unknown as Record<string, unknown>;
      // Extract platform from _platform field (set by dashboardStore) or fall back to props.platform
      const itemPlatform = (v._platform as Platform) || props.platform;
      return {
        id: (v.id as string) || video.id || "",
        title: video.title || video.video_description || (v.caption as string) || "Untitled",
        thumbnail:
          video.cover_image_url ||
          (v.thumbnail_url as string) ||
          (v.media_url as string) ||
          "https://images.unsplash.com/photo-1611162616305-c69b3e718c5?w=100&h=100&fit=crop",
        platform: itemPlatform,
        duration: video.duration || 0,
        // Instagram: views, reach | TikTok: view_count, impressions
        views:
          video.view_count ||
          (v.views as number) ||
          (v.impressions as number) ||
          (v.reach as number) ||
          0,
        likes: video.like_count || (v.likes as number) || 0,
        comments: video.comment_count || (v.comments as number) || 0,
        shares: video.share_count || (v.share_count as number) || 0,
        saves: (v.saves as number) || (v.save_count as number) || 0,
        created:
          video.create_time ||
          (v.timestamp ? new Date(v.timestamp as string).getTime() / 1000 : 0) ||
          "",
        timeAgo: formatTimeAgo(video.create_time || (v.timestamp as string)),
      };
    });
  }
  return [];
});

const hasVideoData = computed(() => {
  if (!props.videos || props.videos.length === 0) return false;
  return props.videos.some((v: Video) => {
    const vi = v as unknown as Record<string, unknown>;
    return (
      (v.view_count || 0) > 0 ||
      (vi.views as number) > 0 ||
      (vi.impressions as number) > 0 ||
      (vi.reach as number) > 0
    );
  });
});

// Sorting
type SortKey =
  | "created"
  | "duration"
  | "views"
  | "likes"
  | "shares"
  | "saves"
  | "comments"
  | "engagement"
  | "platform";
type SortOrder = "asc" | "desc" | null;
const sortKey = ref<SortKey>("created");
const sortOrder = ref<SortOrder>("desc");

const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    // Cycle: desc -> asc -> none
    if (sortOrder.value === "desc") sortOrder.value = "asc";
    else if (sortOrder.value === "asc") {
      sortKey.value = null;
      sortOrder.value = null;
    } else sortOrder.value = "desc";
  } else {
    sortKey.value = key;
    sortOrder.value = "desc";
  }
  currentPage.value = 1;
};

const sortedContent = computed(() => {
  const data = [...filteredContent.value];
  if (!sortKey.value || !sortOrder.value) return data;

  const key = sortKey.value;
  const order = sortOrder.value === "asc" ? 1 : -1;

  return data.sort((a, b) => {
    if (key === "engagement") {
      const aVal = calculateEngagementRate(a);
      const bVal = calculateEngagementRate(b);
      return (aVal - bVal) * order;
    }
    if (key === "platform") {
      const aVal = a.platform === "instagram" ? 0 : 1;
      const bVal = b.platform === "instagram" ? 0 : 1;
      return (aVal - bVal) * order;
    }
    const aVal = (a[key] as number) || 0;
    const bVal = (b[key] as number) || 0;
    return (aVal - bVal) * order;
  });
});

// Pagination
const ITEMS_PER_PAGE = 10;
const currentPage = ref(1);

const totalPages = computed(() => Math.ceil(sortedContent.value.length / ITEMS_PER_PAGE));

const paginatedContent = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE;
  return sortedContent.value.slice(start, start + ITEMS_PER_PAGE);
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// Reset to page 1 and sort when content changes
watch(
  () => props.videos,
  () => {
    currentPage.value = 1;
    sortKey.value = null;
    sortOrder.value = null;
  }
);
</script>

<template>
  <div class="brutal-card rounded-none overflow-hidden">
    <!-- Header -->
    <div
      class="p-6 flex items-center border-b-4 border-black bg-neo-accent dark:bg-[#FF0099] dark:border-[#00F0FF]"
    >
      <h3 class="text-lg font-bold text-slate-900 dark:text-black">Top Performing Content</h3>
    </div>

    <template v-if="sortedContent.length === 0">
      <div class="p-12 text-center">
        <p class="text-slate-500 dark:text-slate-400 text-lg">No content yet</p>
        <p
          v-if="props.videos && props.videos.length > 0 && !hasVideoData"
          class="text-xs text-slate-400 dark:text-slate-500 mt-2"
        >
          TikTok API returned video data with 0 views. This is normal in sandbox mode.
        </p>
      </div>
    </template>

    <template v-else>
      <!-- Desktop Table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead
            class="bg-black text-white dark:text-electric/70 font-bold border-b-4 border-black"
          >
            <tr>
              <th class="px-4 py-4">Content</th>
              <th
                class="px-4 py-4 text-center cursor-pointer select-none hover:text-white transition-colors"
                @click="toggleSort('platform')"
              >
                <div class="flex items-center justify-center gap-1">
                  Platform
                  <ArrowDown v-if="sortKey === 'platform' && sortOrder === 'desc'" :size="14" />
                  <ArrowUp v-else-if="sortKey === 'platform' && sortOrder === 'asc'" :size="14" />
                  <ArrowUpDown v-else :size="14" class="opacity-40" />
                </div>
              </th>
              <th
                class="px-4 py-4 text-center cursor-pointer select-none hover:text-white transition-colors"
                @click="toggleSort('created')"
              >
                <div class="flex items-center justify-center gap-1">
                  Date Created
                  <ArrowDown v-if="sortKey === 'created' && sortOrder === 'desc'" :size="14" />
                  <ArrowUp v-else-if="sortKey === 'created' && sortOrder === 'asc'" :size="14" />
                  <ArrowUpDown v-else :size="14" class="opacity-40" />
                </div>
              </th>
              <th
                v-if="platform !== 'instagram'"
                class="px-4 py-4 text-center cursor-pointer select-none hover:text-white transition-colors"
                @click="toggleSort('duration')"
              >
                <div class="flex items-center justify-center gap-1">
                  Duration
                  <ArrowDown v-if="sortKey === 'duration' && sortOrder === 'desc'" :size="14" />
                  <ArrowUp v-else-if="sortKey === 'duration' && sortOrder === 'asc'" :size="14" />
                  <ArrowUpDown v-else :size="14" class="opacity-40" />
                </div>
              </th>
              <th
                class="px-4 py-4 text-center cursor-pointer select-none hover:text-white transition-colors"
                @click="toggleSort('views')"
              >
                <div class="flex items-center justify-center gap-1">
                  Views
                  <ArrowDown v-if="sortKey === 'views' && sortOrder === 'desc'" :size="14" />
                  <ArrowUp v-else-if="sortKey === 'views' && sortOrder === 'asc'" :size="14" />
                  <ArrowUpDown v-else :size="14" class="opacity-40" />
                </div>
              </th>
              <th
                class="px-4 py-4 text-center cursor-pointer select-none hover:text-white transition-colors"
                @click="toggleSort('likes')"
              >
                <div class="flex items-center justify-center gap-1">
                  Likes
                  <ArrowDown v-if="sortKey === 'likes' && sortOrder === 'desc'" :size="14" />
                  <ArrowUp v-else-if="sortKey === 'likes' && sortOrder === 'asc'" :size="14" />
                  <ArrowUpDown v-else :size="14" class="opacity-40" />
                </div>
              </th>
              <th
                class="px-4 py-4 text-center cursor-pointer select-none hover:text-white transition-colors"
                @click="toggleSort('shares')"
              >
                <div class="flex items-center justify-center gap-1">
                  Shares
                  <ArrowDown v-if="sortKey === 'shares' && sortOrder === 'desc'" :size="14" />
                  <ArrowUp v-else-if="sortKey === 'shares' && sortOrder === 'asc'" :size="14" />
                  <ArrowUpDown v-else :size="14" class="opacity-40" />
                </div>
              </th>
              <th
                class="px-4 py-4 text-center cursor-pointer select-none hover:text-white transition-colors"
                @click="toggleSort('saves')"
              >
                <div class="flex items-center justify-center gap-1">
                  Saves
                  <ArrowDown v-if="sortKey === 'saves' && sortOrder === 'desc'" :size="14" />
                  <ArrowUp v-else-if="sortKey === 'saves' && sortOrder === 'asc'" :size="14" />
                  <ArrowUpDown v-else :size="14" class="opacity-40" />
                </div>
              </th>
              <th
                class="px-4 py-4 text-center cursor-pointer select-none hover:text-white transition-colors"
                @click="toggleSort('comments')"
              >
                <div class="flex items-center justify-center gap-1">
                  Comments
                  <ArrowDown v-if="sortKey === 'comments' && sortOrder === 'desc'" :size="14" />
                  <ArrowUp v-else-if="sortKey === 'comments' && sortOrder === 'asc'" :size="14" />
                  <ArrowUpDown v-else :size="14" class="opacity-40" />
                </div>
              </th>
              <th
                class="px-4 py-4 text-center cursor-pointer select-none hover:text-white transition-colors"
                @click="toggleSort('engagement')"
              >
                <div class="flex items-center justify-center gap-1">
                  Engagement
                  <ArrowDown v-if="sortKey === 'engagement' && sortOrder === 'desc'" :size="14" />
                  <ArrowUp v-else-if="sortKey === 'engagement' && sortOrder === 'asc'" :size="14" />
                  <ArrowUpDown v-else :size="14" class="opacity-40" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-y-2 divide-black">
            <tr
              v-for="item in paginatedContent"
              :key="item.id"
              @click="openVideoDetail(item.id)"
              class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
            >
              <td class="px-4 py-4 min-w-[200px]">
                <div class="flex items-center gap-3">
                  <img
                    :src="item.thumbnail"
                    :alt="item.title"
                    class="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-100 dark:ring-slate-700 shrink-0"
                  />
                  <span
                    class="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors truncate"
                    :title="item.title"
                  >
                    {{ truncateText(item.title, 40) }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <span
                  :class="[
                    'text-[10px] font-bold uppercase px-2 py-1',
                    getPlatformBadge(item.platform).bg,
                    getPlatformBadge(item.platform).text,
                  ]"
                >
                  {{ item.platform === "instagram" ? "IG" : capitalize(item.platform) }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap font-semibold text-xs text-center">
                {{ formatDate(item.created) }}
              </td>
              <td
                v-if="platform !== 'instagram'"
                class="px-4 py-4 whitespace-nowrap font-semibold text-center"
              >
                {{ formatDuration(item.duration || 0) }}
              </td>
              <td class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.views || 0) }}
              </td>
              <td class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.likes || 0) }}
              </td>
              <td class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.shares || 0) }}
              </td>
              <td class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.saves || 0) }}
              </td>
              <td class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.comments || 0) }}
              </td>
              <td class="px-4 py-4 font-mono font-semibold whitespace-nowrap text-center">
                {{ calculateEngagementRate(item).toFixed(1) + "%" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
        <div
          v-for="item in paginatedContent"
          :key="item.id"
          @click="openVideoDetail(item.id)"
          class="p-4 flex gap-4 active:bg-slate-50 dark:active:bg-slate-700/50 cursor-pointer"
        >
          <img
            :src="item.thumbnail"
            :alt="item.title"
            class="w-16 h-16 rounded-lg object-cover shrink-0"
          />
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">
              {{ item.title }}
            </h4>
            <div class="flex items-center gap-2 mt-1">
              <span
                :class="[
                  'text-[10px] font-bold uppercase px-1.5 py-0.5',
                  getPlatformBadge(item.platform).bg,
                  getPlatformBadge(item.platform).text,
                ]"
              >
                {{ item.platform === "instagram" ? "Insta" : capitalize(item.platform) }}
              </span>
              <span class="text-xs text-slate-400 dark:text-slate-500">• {{ item.timeAgo }}</span>
            </div>
          </div>
          <div class="flex flex-col justify-center items-end text-right">
            <span class="text-lg font-bold text-slate-900 dark:text-white">{{ item.views }}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Views</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Pagination -->
    <div
      v-if="sortedContent.length > ITEMS_PER_PAGE"
      class="px-6 py-4 flex items-center justify-between border-t-2 border-black dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
    >
      <span class="text-sm font-bold text-slate-500 dark:text-slate-400">
        Showing {{ (currentPage - 1) * ITEMS_PER_PAGE + 1 }}–{{
          Math.min(currentPage * ITEMS_PER_PAGE, sortedContent.length)
        }}
        of {{ sortedContent.length }}
      </span>

      <div class="flex items-center gap-1">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-1.5 text-sm font-bold border-2 border-black dark:border-white transition-colors"
          :class="
            currentPage === 1
              ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
          "
        >
          Prev
        </button>

        <button
          v-for="page in totalPages"
          :key="page"
          @click="goToPage(page)"
          class="w-9 h-9 text-sm font-bold border-2 border-black dark:border-white transition-colors"
          :class="
            page === currentPage
              ? 'bg-black dark:bg-electric text-white dark:text-black'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
          "
        >
          {{ page }}
        </button>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-1.5 text-sm font-bold border-2 border-black dark:border-white transition-colors"
          :class="
            currentPage === totalPages
              ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
          "
        >
          Next
        </button>
      </div>
    </div>
  </div>

  <!-- Video Detail Modal -->
  <VideoDetailModal
    v-if="selectedVideoId"
    :show="isModalOpen"
    :video-data="filteredContent.find((v) => v.id === selectedVideoId) || null"
    @close="closeModal"
  />
</template>
