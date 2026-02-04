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
}

const props = withDefaults(defineProps<Props>(), {
  platform: "all",
});

// Mock data - in real app, this would come from API
const allContent: ContentItem[] = [
  {
    id: "1",
    title: "Summer Vibes Reel",
    thumbnail:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop",
    platform: "instagram",
    reach: "124k",
    engagement: "8.4%",
    status: "viral",
    timeAgo: "2h ago",
  },
  {
    id: "2",
    title: "Product Launch Teaser",
    thumbnail:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop",
    platform: "tiktok",
    reach: "85k",
    engagement: "12.1%",
    status: "active",
    timeAgo: "5h ago",
  },
  {
    id: "3",
    title: "Behind The Scenes",
    thumbnail:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop",
    platform: "instagram",
    reach: "45k",
    engagement: "5.2%",
    status: "ended",
    timeAgo: "1d ago",
  },
];

const filteredContent = computed(() => {
  if (props.platform === "all") return allContent;
  return allContent.filter((item) => item.platform === props.platform);
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

    <!-- Desktop Table -->
    <div class="hidden md:block overflow-x-auto">
      <table
        class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead
          class="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold border-b-4 border-black">
          <tr>
            <th class="px-6 py-4">Content</th>
            <th class="px-6 py-4">Platform</th>
            <th class="px-6 py-4">Reach</th>
            <th class="px-6 py-4">Engagement</th>
            <th class="px-6 py-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-y-2 divide-black">
          <tr
            v-for="item in filteredContent"
            :key="item.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer">
            <td class="px-6 py-4 flex items-center gap-3">
              <img
                :src="item.thumbnail"
                :alt="item.title"
                class="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-100 dark:ring-slate-700" />
              <span
                class="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                {{ item.title }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                  getPlatformBadge(item.platform).bg,
                  getPlatformBadge(item.platform).text,
                ]">
                <span
                  :class="[
                    'block size-1.5 rounded-full',
                    getPlatformBadge(item.platform).dot,
                  ]" />
                {{ capitalize(item.platform) }}
              </span>
            </td>
            <td class="px-6 py-4 font-semibold">{{ item.reach }}</td>
            <td class="px-6 py-4 font-semibold">{{ item.engagement }}</td>
            <td class="px-6 py-4 text-right">
              <span
                :class="[
                  'font-bold text-xs px-2 py-1 rounded-md',
                  getStatusBadge(item.status).bg,
                  getStatusBadge(item.status).text,
                ]">
                {{ capitalize(item.status) }}
              </span>
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
          <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">
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
  </div>
</template>
