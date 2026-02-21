<script setup lang="ts">
import { CheckCircle2 } from "lucide-vue-next";
import { formatNumber } from "@/utils/format";

interface UserInfo {
  id: string;
  name: string;
  avatar_url: string;
  followers_count: number;
  following_count?: number;
  likes_count?: number;
  videos_count?: number;
  bio?: string;
  is_verified?: boolean;
}

interface Props {
  userInfo?: UserInfo | null;
  platform?: "tiktok" | "instagram";
}

withDefaults(defineProps<Props>(), {
  userInfo: null,
  platform: "tiktok",
});
</script>

<template>
  <div v-if="userInfo" class="brutal-card brutal-hover-lift rounded-none">
    <div class="flex items-center gap-4 p-4">
      <div class="relative shrink-0">
        <img
          :src="userInfo.avatar_url"
          :alt="userInfo.name"
          class="w-16 h-16 rounded-full ring-2 ring-slate-900 dark:ring-white object-cover"
        />
      </div>
      <div class="flex-1 min-w-0 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <a
              :href="
                platform === 'instagram'
                  ? `https://instagram.com/${userInfo.name}`
                  : `https://www.tiktok.com/@${userInfo.name}`
              "
              target="_blank"
              class="text-xl md:text-2xl font-black text-slate-900 dark:text-white hover:underline"
            >
              {{ userInfo.name }}
            </a>
            <CheckCircle2 v-if="userInfo.is_verified" :size="20" class="text-blue-500 shrink-0" />
          </div>
        </div>
        <p
          class="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line"
          :title="userInfo.bio"
        >
          {{ userInfo.bio }}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-4 px-6 pb-4 text-sm text-slate-600 dark:text-slate-300">
      <div class="flex items-center gap-1.5">
        <span
          class="text-slate-500 dark:text-electric/70 text-xs font-black uppercase tracking-tighter"
          >Followers</span
        >
        <span class="font-mono font-bold text-slate-900 dark:text-white text-lg">{{
          formatNumber(userInfo.followers_count || 0)
        }}</span>
      </div>
      <div class="w-[5px] h-[5px] rounded-full bg-slate-300 dark:bg-slate-600"></div>
      <div class="flex items-center gap-1.5">
        <span
          class="text-slate-500 dark:text-electric/70 text-xs font-black uppercase tracking-tighter"
          >Following</span
        >
        <span class="font-mono font-bold text-slate-900 dark:text-white text-lg">{{
          formatNumber(userInfo.following_count || 0)
        }}</span>
      </div>
      <div class="w-[5px] h-[5px] rounded-full bg-slate-300 dark:bg-slate-600"></div>
      <div class="flex items-center gap-1.5">
        <span
          class="text-slate-500 dark:text-electric/70 text-xs font-black uppercase tracking-tighter"
          >Likes</span
        >
        <span class="font-mono font-bold text-slate-900 dark:text-white text-lg">{{
          formatNumber(userInfo.likes_count || 0)
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
