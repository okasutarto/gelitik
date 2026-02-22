<script setup lang="ts">
import { computed, ref } from "vue";
import { Bar } from "vue-chartjs";
import { useTheme } from "@/composables/useTheme";
import { formatNumber } from "@/utils/format";
import { truncateText } from "@/utils/video";
import type { Video } from "@/types/video";
import "@/composables/useChart"; // Registers Chart.js components
import type { TooltipItem } from "chart.js";

interface Props {
  videos?: Video[];
}

const props = withDefaults(defineProps<Props>(), {
  videos: () => [],
});

const sortBy = ref<"views" | "likes" | "shares" | "engagement">("views");
const sortDirection = ref<"desc" | "asc">("desc");
const { isDark } = useTheme();

const sortedVideos = computed(() => {
  if (!props.videos || props.videos.length === 0) return [];

  return [...props.videos].sort((a, b) => {
    // Map sortBy values to actual field names
    const getField = (item: typeof a, sort: string) => {
      if (sort === "views") return item.view_count || 0;
      if (sort === "likes") return item.like_count || 0;
      if (sort === "shares") return item.share_count || 0;
      return item.view_count || 0;
    };

    const metricA =
      sortBy.value === "engagement"
        ? (((a.like_count || 0) + (a.comment_count || 0) + (a.share_count || 0)) /
            (a.view_count || 0.00001)) *
          100
        : getField(a, sortBy.value);
    const metricB =
      sortBy.value === "engagement"
        ? (((b.like_count || 0) + (b.comment_count || 0) + (b.share_count || 0)) /
            (b.view_count || 0.00001)) *
          100
        : getField(b, sortBy.value);

    if (sortDirection.value === "asc") {
      return metricA - metricB;
    } else {
      return metricB - metricA;
    }
  });
});

const displayedVideos = computed(() => {
  return sortedVideos.value.slice(0, 5);
});

const chartData = computed(() => {
  const videos = displayedVideos.value;

  return {
    labels: videos.map((v, i) =>
      truncateText(v.title || v.video_description || `Video ${i + 1}`, 30)
    ),
    datasets: [
      {
        label: sortBy.value.charAt(0).toUpperCase() + sortBy.value.slice(1),
        data: videos.map((v) => {
          if (sortBy.value === "views") return v.view_count || 0;
          if (sortBy.value === "likes") return v.like_count || 0;
          if (sortBy.value === "shares") return v.share_count || 0;
          return (
            (((v.like_count || 0) + (v.comment_count || 0) + (v.share_count || 0)) /
              (v.view_count || 0.00001)) *
            100
          );
        }),
        backgroundColor: isDark.value ? "#00F0FF" : "#0f172a",
        borderRadius: 6,
        barThickness: 20,
        borderWidth: 0,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y" as const,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: isDark.value ? "rgba(10, 10, 26, 0.95)" : "rgba(30, 41, 59, 0.95)",
      titleFont: { size: 14, weight: "bold" as const },
      titleColor: isDark.value ? "#00F0FF" : "#fff",
      bodyFont: { size: 12 },
      bodyColor: isDark.value ? "#E0E0E0" : "#fff",
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      borderColor: isDark.value ? "#00F0FF" : "transparent",
      borderWidth: isDark.value ? 1 : 0,
      callbacks: {
        title: (tooltipItems: TooltipItem<"bar">[]) => {
          const video = displayedVideos.value[tooltipItems[0].dataIndex];
          return video ? truncateText(video.title || video.video_description || "", 50) : "";
        },
        label: (context: TooltipItem<"bar">) => {
          const video = displayedVideos.value[context.dataIndex];
          if (!video) return "";
          const value = context.parsed.y || 0;

          if (sortBy.value === "engagement") {
            return `${sortBy.value.charAt(0).toUpperCase() + sortBy.value.slice(1)}: ${value.toFixed(2)}%`;
          }
          return `${sortBy.value.charAt(0).toUpperCase() + sortBy.value.slice(1)}: ${formatNumber(value)}`;
        },
      },
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      beginAtZero: true,
      grid: {
        color: isDark.value ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9",
      },
      ticks: {
        color: isDark.value ? "#E0E0E0" : "#94a3b8",
        font: { size: 11 },
        callback: (value: string | number) => {
          const numValue = Number(value);
          if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
          if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
          return value;
        },
      },
    },
  },
}));

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h3 class="text-lg font-black uppercase text-slate-900 dark:text-electric/70">
          Top 5 Videos by Performance
        </h3>
        <p class="text-sm font-bold opacity-60 uppercase dark:text-slate-400">
          Sorting by {{ sortBy.charAt(0).toUpperCase() + sortBy.slice(1) }}
        </p>
      </div>
      <div class="flex gap-2">
        <select
          v-model="sortBy"
          class="bg-slate-50 dark:bg-navy border-neo-3 border-black dark:border-electric neo-shadow-hard-sm text-sm font-semibold text-slate-600 dark:text-white py-2 px-3 cursor-pointer outline-none brutal-hover-lift"
        >
          <option value="views">Views</option>
          <option value="likes">Likes</option>
          <option value="shares">Shares</option>
          <option value="engagement">Engagement Rate</option>
        </select>
        <button
          @click="toggleSortDirection"
          class="bg-slate-50 dark:bg-navy border-neo-3 border-black dark:border-electric neo-shadow-hard-sm text-sm font-semibold text-slate-600 dark:text-white py-2 px-4 cursor-pointer outline-none brutal-hover-lift flex items-center gap-2"
        >
          {{ sortDirection === "asc" ? "↑ Ascending" : "↓ Descending" }}
        </button>
      </div>
    </div>

    <!-- Chart Container -->
    <div v-if="displayedVideos.length === 0" class="flex-1 items-center justify-center py-12">
      <p class="text-slate-500 dark:text-slate-400 text-lg">No video data available</p>
    </div>
    <div v-else class="flex-1 relative h-[300px]">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <!-- Video List -->
    <div class="mt-6 space-y-3">
      <div
        v-for="(video, index) in displayedVideos"
        :key="video.id"
        class="flex items-center gap-3 py-3 border-b-2 border-black last:border-0 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div class="text-lg font-bold w-6 text-slate-600 dark:text-slate-300 shrink-0">
          {{ index + 1 }}.
        </div>
        <div class="flex-1 min-w-0 flex gap-3">
          <div class="flex-1 flex items-center gap-3 min-w-0">
            <img
              :src="
                video.cover_image_url ||
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTIeMmUyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtc2l6ZT0iMjQiPkltYWdlPC90ZXh0Pjwvc3ZnPg=='
              "
              :alt="truncateText(video.title || video.video_description || '', 20)"
              class="w-12 h-12 rounded-lg object-cover"
            />
            <div class="min-w-0">
              <p class="font-semibold text-slate-900 dark:text-white truncate text-sm">
                {{ truncateText(video.title || video.video_description || "", 40) }}
              </p>
            </div>
          </div>
          <div class="text-right min-w-[80px] flex flex-col justify-center items-end">
            <p class="text-xl font-mono font-black text-slate-900 dark:text-white">
              {{
                sortBy === "engagement"
                  ? `${((((video.like_count || 0) + (video.comment_count || 0) + (video.share_count || 0)) / (video.view_count || 1)) * 100).toFixed(2)}%`
                  : formatNumber(
                      Number(
                        video[
                          sortBy === "views"
                            ? "view_count"
                            : sortBy === "likes"
                              ? "like_count"
                              : sortBy === "shares"
                                ? "share_count"
                                : "view_count"
                        ]
                      ) || 0
                    )
              }}
            </p>
            <p class="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              {{ sortBy === "views" ? "Views" : sortBy.charAt(0).toUpperCase() + sortBy.slice(1) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom line clamp for video descriptions - uses Tailwind's line-clamp-2 */
</style>
