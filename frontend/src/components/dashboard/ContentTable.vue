<script setup lang="ts">
import { computed } from "vue";
import type { Platform } from "@/composables/usePlatform";

interface ContentItem {
  id: string;
  title: string;
  thumbnail: string;
  platform: Platform;
  reach: string;
  engagement: string;
  status: "viral" | "active" | "ended";
  timeAgo: string;
}

interface Props {
  platform?: Platform;
  videos?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  platform: "all",
  videos: undefined,
});

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const calculateEngagementRate = (video: any): number => {
  const views = video.views || 0;
  const likes = video.likes || 0;
  const comments = video.comments || 0;
  const shares = video.shares || 0;
  const totalEngagement = likes + comments + shares;

  if (views === 0) {
    return 0;
  }

  const rate = (totalEngagement / views) * 100;

  return rate;
};

const formatTimeAgo = (createTime: string): string => {
  if (!createTime) return "Unknown";
  const now = new Date();
  const created = new Date(createTime);
  const diffMs = now.getTime() - created.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffDays > 7) return `${Math.floor(diffDays)}d ago`;
  if (diffDays >= 1) return `${Math.floor(diffDays)}d ago`;
  if (diffHours >= 1) return `${Math.floor(diffHours)}h ago`;
  return "Just now";
};

const filteredContent = computed(() => {
  if (props.videos && props.videos.length > 0) {
    return props.videos.map((video: any) => ({
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
    props.videos.some((v: any) => v.view_count > 0)
  );
});

const getPlatformBadge = (platform: Platform) => {
  const configs: Record<Platform, { bg: string; text: string; dot: string }> = {
    all: {
      bg: "bg-primary-50 dark:bg-primary-900/30",
      text: "text-primary-600 dark:text-primary-400",
      dot: "bg-primary-500",
    },
    instagram: {
      bg: "bg-pink-50 dark:bg-pink-900/30",
      text: "text-pink-600 dark:text-pink-400",
      dot: "bg-pink-500",
    },
    tiktok: {
      bg: "bg-slate-100 dark:bg-slate-700",
      text: "text-slate-700 dark:text-slate-300",
      dot: "bg-slate-900 dark:bg-white",
    },
    linkedin: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
    },
  };
  return configs[platform];
};

const getStatusBadge = (status: ContentItem["status"]) => {
  const configs: Record<typeof status, { bg: string; text: string }> = {
    viral: {
      bg: "bg-green-50 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
    },
    active: {
      bg: "bg-primary-50 dark:bg-primary-900/30",
      text: "text-primary-600 dark:text-primary-400",
    },
    ended: {
      bg: "bg-slate-100 dark:bg-slate-700",
      text: "text-slate-500 dark:text-slate-400",
    },
  };
  return configs[status];
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const formatDuration = (seconds: number): string => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDate = (timestamp: number): string => {
  const timestampNum =
    typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  const date = new Date(timestampNum * 1000);

  if (isNaN(date.getTime())) {
    console.error("[ContentTable] Invalid timestamp:", timestamp);
    return "Unknown";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
</script>

<template>
  <div class="neo-card border-neo-3 border-black overflow-hidden">
    <!-- Header -->
    <div class="p-6 flex items-center justify-between border-b-4 border-black">
      <h3 class="text-lg font-bold text-slate-900 dark:text-white">
        Top Performing Content
      </h3>
      <button
        class="text-primary-600 dark:text-primary-400 text-sm font-semibold hover:underline">
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
            class="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold border-b-4 border-black">
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
              <td class="px-4 py-4 whitespace-nowrap text-xs text-center">
                {{ formatDate(item.created) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-center">
                {{ formatDuration(item.duration || 0) }}
              </td>
              <td class="px-4 py-4 font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.views || 0) }}
              </td>
              <td class="px-4 py-4 font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.likes || 0) }}
              </td>
              <td class="px-4 py-4 font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.shares || 0) }}
              </td>
              <td class="px-4 py-4 font-semibold whitespace-nowrap text-center">
                {{ formatNumber(item.comments || 0) }}
              </td>
              <td class="px-4 py-4 font-semibold whitespace-nowrap text-center">
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
          class="p-4 flex gap-4 active:bg-slate-50 dark:active:bg-slate-700/50">
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
                  'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
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
              item.reach
            }}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium"
              >Reach</span
            >
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
