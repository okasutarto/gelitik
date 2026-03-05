<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/utils/format";
import type { PlatformSnapshot } from "@/stores/dashboardStore";

interface Props {
  instagram: PlatformSnapshot | null;
  tiktok: PlatformSnapshot | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Rule-based insight generation
const insight = computed(() => {
  const ig = props.instagram;
  const tt = props.tiktok;

  if (!ig && !tt) return null;
  if (!ig) return { text: "Connect Instagram to compare platforms", type: "info" as const };
  if (!tt) return { text: "Connect TikTok to compare platforms", type: "info" as const };

  const igRate = ig.engagementRate;
  const ttRate = tt.engagementRate;

  if (igRate > 0 && ttRate > 0 && igRate > ttRate * 2) {
    return {
      text: "Instagram has significantly higher engagement than TikTok",
      type: "positive" as const,
    };
  }
  if (igRate > 0 && ttRate > 0 && ttRate > igRate * 2) {
    return {
      text: "TikTok has significantly higher engagement than Instagram",
      type: "positive" as const,
    };
  }

  if (ig.followerGrowth < 0) {
    return {
      text: "Instagram lost followers this period — review recent content",
      type: "warning" as const,
    };
  }
  if (tt.followerGrowth < 0) {
    return {
      text: "TikTok lost followers this period — review recent content",
      type: "warning" as const,
    };
  }

  return { text: "Both platforms are performing consistently", type: "neutral" as const };
});

const insightClasses = computed(() => {
  if (!insight.value) return "";
  switch (insight.value.type) {
    case "positive":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
    case "info":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  }
});
</script>

<template>
  <div class="brutal-card p-6 brutal-hover-lift">
    <h2 class="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-6">
      Platform Health
    </h2>

    <!-- Skeleton loader -->
    <template v-if="loading">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-6">
          <div v-for="i in 2" :key="i" class="space-y-3">
            <div class="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse"></div>
            <div class="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse"></div>
            <div class="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse"></div>
            <div class="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Content -->
    <template v-else>
      <div class="grid grid-cols-2 gap-6">
        <!-- Instagram Column -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full bg-[#FF4B8B]"></div>
            <span class="text-sm font-black uppercase text-slate-500 dark:text-slate-400"
              >Instagram</span
            >
          </div>
          <template v-if="instagram">
            <div class="space-y-3">
              <div>
                <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                  Followers
                </p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">
                  {{ formatNumber(instagram.followers) }}
                </p>
                <p
                  v-if="instagram.followerGrowth !== 0"
                  class="text-xs font-bold mt-0.5"
                  :class="
                    instagram.followerGrowth >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  "
                >
                  {{ instagram.followerGrowth >= 0 ? "▲" : "▼" }}
                  {{ instagram.followerGrowth >= 0 ? "+" : ""
                  }}{{ formatNumber(instagram.followerGrowth) }} ({{
                    instagram.followerGrowthPercent >= 0 ? "+" : ""
                  }}{{ instagram.followerGrowthPercent.toFixed(1) }}%)
                </p>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                  Engagement
                </p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">
                  {{ (instagram.engagementRate ?? 0).toFixed(2) }}%
                </p>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                  Posts This Week
                </p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">
                  {{ instagram.postsThisWeek || "—" }}
                </p>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-slate-400 dark:text-slate-500 italic">Not connected</p>
        </div>

        <!-- TikTok Column -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full bg-[#1A1A2E] dark:bg-[#00F0FF]"></div>
            <span class="text-sm font-black uppercase text-slate-500 dark:text-slate-400"
              >TikTok</span
            >
          </div>
          <template v-if="tiktok">
            <div class="space-y-3">
              <div>
                <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                  Followers
                </p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">
                  {{ formatNumber(tiktok.followers) }}
                </p>
                <p
                  v-if="tiktok.followerGrowth !== 0"
                  class="text-xs font-bold mt-0.5"
                  :class="
                    tiktok.followerGrowth >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  "
                >
                  {{ tiktok.followerGrowth >= 0 ? "▲" : "▼" }}
                  {{ tiktok.followerGrowth >= 0 ? "+" : ""
                  }}{{ formatNumber(tiktok.followerGrowth) }} ({{
                    tiktok.followerGrowthPercent >= 0 ? "+" : ""
                  }}{{ tiktok.followerGrowthPercent.toFixed(1) }}%)
                </p>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                  Engagement
                </p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">
                  {{ tiktok.engagementRate.toFixed(2) }}%
                </p>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                  Posts This Week
                </p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">
                  {{ tiktok.postsThisWeek || "—" }}
                </p>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-slate-400 dark:text-slate-500 italic">Not connected</p>
        </div>
      </div>

      <!-- Insight Banner -->
      <div
        v-if="insight"
        class="mt-6 p-3 rounded border-2 text-sm font-bold"
        :class="insightClasses"
      >
        💡 {{ insight.text }}
      </div>
    </template>
  </div>
</template>
