<script setup lang="ts">
import { computed } from "vue";
import { CheckCircle2, ArrowUpRight } from "lucide-vue-next";

interface UserInfo {
  display_name: string;
  avatar_url: string;
  bio_description: string;
  is_verified: boolean;
  follower_count: number;
  video_count: number;
  likes_count: number;
  following_count: number;
}

interface Props {
  userInfo: UserInfo;
}

const props = defineProps<Props>();

const formatNumber = (num: number): string => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};
</script>

<template>
  <div class="neo-card border-neo-3 border-black neo-hover-lift">
    <div class="flex items-center gap-4 p-4">
      <div class="relative shrink-0">
        <img
          :src="userInfo.avatar_url"
          :alt="userInfo.display_name"
          class="w-16 h-16 rounded-full ring-2 ring-slate-900 dark:ring-white object-cover" />
      </div>
      <div class="flex-1 min-w-0 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <a
              href="https://www.tiktok.com/@okasp.dev"
              target="_blank"
              class="text-xl md:text-2xl font-black text-slate-900 dark:text-white hover:underline">
              {{ userInfo.display_name }}
            </a>
            <CheckCircle2
              v-if="userInfo.is_verified"
              :size="20"
              class="text-blue-500 shrink-0" />
          </div>
        </div>
        <p
          class="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 whitespace-pre-line"
          :title="userInfo.bio_description">
          {{ userInfo.bio_description }}
        </p>
      </div>
    </div>
    <div
      class="flex items-center gap-4 px-6 pb-4 text-sm text-slate-600 dark:text-slate-300">
      <div class="flex items-center gap-1.5">
        <span
          class="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-wide"
          >Likes</span
        >
        <span class="font-bold">{{
          formatNumber(userInfo.likes_count || 0)
        }}</span>
      </div>
      <div
        class="w-[5px] h-[5px] rounded-full bg-slate-300 dark:bg-slate-600"></div>
      <div class="flex items-center gap-1.5">
        <span
          class="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-wide"
          >Followers</span
        >
        <span class="font-bold">{{
          formatNumber(userInfo.follower_count || 0)
        }}</span>
      </div>
      <div
        class="w-[5px] h-[5px] rounded-full bg-slate-300 dark:bg-slate-600"></div>
      <div class="flex items-center gap-1.5">
        <span
          class="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-wide"
          >Following</span
        >
        <span class="font-bold">{{
          formatNumber(userInfo.following_count || 0)
        }}</span>
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
  text-overflow: ellipsis;
}
</style>
