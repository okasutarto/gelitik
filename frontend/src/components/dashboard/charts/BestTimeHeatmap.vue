<script setup lang="ts">
import { Clock } from "lucide-vue-next";

// Define the heatmap data item structure
export interface HeatmapDataPoint {
  day: number; // 0 (Sun) to 6 (Sat)
  hour: number; // 0 to 23
  score: number; // 0 to 100
}

interface Props {
  data: HeatmapDataPoint[];
  loading?: boolean;
}

import { useTheme } from "@/composables/useTheme";

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const { isDark } = useTheme();

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 24 }, (_, i) => i);

// Helper to get score for a specific day and hour
const getScore = (day: number, hour: number) => {
  const point = props.data.find((p) => p.day === day && p.hour === hour);
  return point ? point.score : 0;
};

// Map score (0-100) to opacity (0.1 to 1.0) for visual intensity
const getOpacity = (score: number) => {
  if (score === 0) return 0.05; // Very faint background for zero
  return 0.2 + (score / 100) * 0.8; // Minimum visibility when non-zero
};

// Format hour (e.g., 0 -> 12am, 13 -> 1pm)
const formatHour = (hour: number) => {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return hour > 12 ? `${hour - 12}p` : `${hour}a`;
};
</script>

<template>
  <div class="brutal-card p-6 brutal-hover-lift overflow-hidden">
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-900/30 border-2 border-black flex items-center justify-center"
      >
        <Clock class="text-indigo-600 dark:text-indigo-400" :size="20" />
      </div>
      <div>
        <h2 class="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Best Time to Post
        </h2>
        <p class="text-sm font-bold opacity-60 uppercase text-slate-900 dark:text-slate-400">
          Based on past audience engagement
        </p>
      </div>
    </div>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="animate-pulse space-y-2">
        <div v-for="d in 7" :key="d" class="flex gap-1">
          <div class="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700"></div>
          <div
            v-for="h in 24"
            :key="h"
            class="flex-1 h-8 rounded bg-slate-200 dark:bg-slate-700 opacity-50"
          ></div>
        </div>
      </div>
    </template>

    <!-- Heatmap Grid -->
    <template v-else-if="data && data.length > 0">
      <div class="overflow-x-auto pb-4">
        <div class="min-w-[700px]">
          <!-- X-Axis Labels (Hours) -->
          <div class="flex mb-2 ml-[40px]">
            <div
              v-for="hour in hours"
              :key="`label-${hour}`"
              class="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase"
            >
              {{ hour % 3 === 0 ? formatHour(hour) : "" }}
            </div>
          </div>

          <!-- Heatmap Rows (Days) -->
          <div class="space-y-1">
            <div v-for="(dayName, dayIndex) in days" :key="dayName" class="flex items-center h-8">
              <!-- Y-Axis Label (Day) -->
              <div class="w-[40px] text-[11px] font-black uppercase text-slate-500 shrink-0">
                {{ dayName }}
              </div>

              <!-- Hourly Blocks -->
              <div class="flex-1 flex gap-1 h-full">
                <div
                  v-for="hour in hours"
                  :key="`${dayIndex}-${hour}`"
                  class="flex-1 rounded-[2px] transition-colors relative group border border-transparent hover:border-black dark:hover:border-[#00F0FF] cursor-crosshair"
                  :style="{
                    backgroundColor: isDark
                      ? `rgba(0, 240, 255, ${getOpacity(getScore(dayIndex, hour))})`
                      : `rgba(26, 26, 46, ${getOpacity(getScore(dayIndex, hour))})`,
                  }"
                >
                  <!-- Tooltip -->
                  <div
                    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black text-white text-xs font-bold rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 z-10 w-max transition-opacity"
                  >
                    {{ dayName }} {{ formatHour(hour) }}
                    <span class="block text-slate-300 font-normal"
                      >Score: {{ getScore(dayIndex, hour) }}/100</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div
        class="flex items-center justify-end gap-2 mt-4 text-xs font-bold text-slate-500 uppercase"
      >
        <span>Less</span>
        <div class="flex gap-1 h-3 w-20">
          <div class="flex-1 bg-[#1A1A2E] dark:bg-[#00F0FF] opacity-10 rounded-sm"></div>
          <div class="flex-1 bg-[#1A1A2E] dark:bg-[#00F0FF] opacity-40 rounded-sm"></div>
          <div class="flex-1 bg-[#1A1A2E] dark:bg-[#00F0FF] opacity-70 rounded-sm"></div>
          <div class="flex-1 bg-[#1A1A2E] dark:bg-[#00F0FF] opacity-100 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>
    </template>

    <!-- Empty State -->
    <template v-else>
      <div class="text-center py-12">
        <p class="text-sm font-bold text-slate-500 items-center justify-center flex flex-col gap-2">
          <Clock :size="32" class="opacity-20" />
          No historical data available yet.
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Adjust hover effect for arbitrary opacity-based backgrounds */
.dark .group:hover {
  border-color: #00f0ff;
}

/* Base colors for light/dark mode injected via style binding might be tricky without vars, so we'll use a CSS var trick instead */
</style>
