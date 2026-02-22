<script setup lang="ts">
import { TopVideosChart, EngagementDoughnutChart } from "@/components/dashboard";
import type { Video } from "@/types/video";

interface Props {
  videos?: Video[];
}

withDefaults(defineProps<Props>(), {
  videos: () => [],
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 relative z-10">
    <!-- View Distribution Chart (Left) -->
    <div class="brutal-card p-6 flex flex-col relative group brutal-hover-lift">
      <!-- <div class="flex items-center justify-between mb-2">
        <div>
          <h2
            class="text-xl font-black uppercase tracking-tight text-slate-900 border-b-4 border-transparent"
          >
            Views Trend
          </h2>
          <p class="text-sm font-bold opacity-60 uppercase text-slate-900 mt-1">Last 30 Days</p>
        </div>
        <button
          @click="downloadChartAsPNG"
          class="size-8 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          :class="
            isExporting
              ? 'bg-neo-3 border-black text-neo-accent cursor-not-allowed'
              : 'bg-neo-3 border-black hover:bg-slate-200 text-neo-accent cursor-pointer'
          "
          title="Export Chart"
        >
          <Download :size="20" />
        </button>
      </div> -->
      <div class="flex-1 min-h-0 relative w-full h-full overflow-hidden">
        <TopVideosChart :videos="videos" />
      </div>
    </div>

    <!-- Engagement Breakdown (Right) -->
    <div class="brutal-card p-6 flex flex-col brutal-hover-lift">
      <div class="mb-2">
        <h2
          class="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-electric/70 border-b-4 border-transparent"
        >
          Engagement Breakdown
        </h2>
        <p class="text-sm font-bold opacity-60 uppercase text-slate-900 dark:text-slate-400 mt-1">
          Likes · Comments · Shares
        </p>
      </div>
      <div class="flex-1 min-h-0 relative w-full h-full overflow-hidden">
        <EngagementDoughnutChart :videos="videos" />
      </div>
    </div>
  </div>
</template>
