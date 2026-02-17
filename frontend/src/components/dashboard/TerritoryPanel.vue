<script setup lang="ts">
import { Globe } from "lucide-vue-next";
import type { Platform } from "@/types/platform";

interface TerritoryData {
  name: string;
  percentage: number;
}

interface Props {
  platform?: Platform;
  territories?: TerritoryData[];
}

const props = withDefaults(defineProps<Props>(), {
  platform: "all",
  territories: () => [
    { name: "Indonesia", percentage: 92 },
    { name: "Malaysia", percentage: 5 },
    { name: "Singapore", percentage: 3 },
  ],
});

const getBarColor = (index: number) => {
  const colors = [
    "bg-slate-900 dark:bg-white",
    "bg-slate-700 dark:bg-slate-300",
    "bg-slate-500 dark:bg-slate-400",
  ];
  return colors[index] || "bg-slate-400";
};
</script>

<template>
  <div class="brutal-card brutal-hover-lift rounded-none p-6">
    <h4
      class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
      <Globe :size="18" class="text-teal-500" />
      Territory
    </h4>
    <div v-if="platform === 'tiktok'" class="p-8 text-center">
      <p class="text-slate-500 dark:text-slate-400">
        Territory data coming soon for TikTok
      </p>
    </div>
    <div v-else class="space-y-4">
      <div
        v-for="(territory, index) in territories"
        :key="territory.name"
        class="flex items-center justify-between">
        <span class="text-sm text-slate-600 dark:text-slate-300 min-w-[80px]">
          {{ territory.name }}
        </span>
        <div
          class="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all', getBarColor(index)]"
            :style="{ width: `${territory.percentage}%` }" />
        </div>
        <span
          class="text-sm font-mono font-bold text-slate-900 dark:text-white min-w-[40px] text-right">
          {{ territory.percentage }}%
        </span>
      </div>
    </div>
  </div>
</template>
