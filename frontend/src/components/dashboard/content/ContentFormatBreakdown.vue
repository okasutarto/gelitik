<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useTheme } from "@/composables/useTheme";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ContentFormat {
  type: string;
  count: number;
  avgReach: number;
  avgEngagement: number;
}

interface Props {
  formats: ContentFormat[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const { isDark } = useTheme();

const typeLabels: Record<string, string> = {
  IMAGE: "Feed Posts",
  CAROUSEL_ALBUM: "Carousels",
  VIDEO: "Videos",
  REELS: "Reels",
};

const typeColors: Record<string, string> = {
  IMAGE: "#FFD000",
  CAROUSEL_ALBUM: "#FF4B8B",
  VIDEO: "#1A1A2E",
  REELS: "#00F0FF",
};

const chartData = computed(() => ({
  labels: props.formats.map((f) => typeLabels[f.type] || f.type),
  datasets: [
    {
      data: props.formats.map((f) => f.count),
      backgroundColor: props.formats.map((f) => typeColors[f.type] || "#94a3b8"),
      borderColor: isDark.value ? "#1e293b" : "#ffffff",
      borderWidth: 3,
      hoverOffset: 8,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "55%",
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: isDark.value ? "#1e293b" : "#ffffff",
      titleColor: isDark.value ? "#e2e8f0" : "#1e293b",
      bodyColor: isDark.value ? "#94a3b8" : "#64748b",
      borderColor: isDark.value ? "#334155" : "#e2e8f0",
      borderWidth: 1,
      padding: 12,
      titleFont: { weight: "bold" as const, size: 13 },
    },
  },
}));

const totalPosts = computed(() => props.formats.reduce((s, f) => s + f.count, 0));
</script>

<template>
  <div class="brutal-card p-6 brutal-hover-lift">
    <h2 class="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-1">
      Content Format
    </h2>
    <p class="text-sm font-bold opacity-60 uppercase text-slate-900 dark:text-slate-400 mb-4">
      Performance by Type
    </p>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="animate-pulse flex items-center gap-6">
        <div class="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        <div class="flex-1 space-y-3">
          <div class="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div class="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </template>

    <!-- Content -->
    <template v-else-if="formats.length > 0">
      <div class="flex items-center gap-6">
        <!-- Doughnut -->
        <div class="w-40 h-40 relative flex-shrink-0">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <p class="text-2xl font-black text-slate-900 dark:text-white">{{ totalPosts }}</p>
              <p class="text-xs font-bold text-slate-400 uppercase">Posts</p>
            </div>
          </div>
        </div>

        <!-- Legend Table -->
        <div class="flex-1 space-y-2">
          <div
            v-for="format in formats"
            :key="format.type"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-sm border border-black dark:border-slate-600"
                :style="{ backgroundColor: typeColors[format.type] || '#94a3b8' }"
              ></div>
              <span class="text-sm font-bold text-slate-700 dark:text-slate-300">
                {{ typeLabels[format.type] || format.type }}
              </span>
            </div>
            <span class="text-sm font-black text-slate-900 dark:text-white">
              {{ format.count }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <template v-else>
      <p class="text-sm text-slate-400 dark:text-slate-500 italic text-center py-8">
        No content data available yet
      </p>
    </template>
  </div>
</template>
