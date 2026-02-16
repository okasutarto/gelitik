<script setup lang="ts">
import { computed, ref } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface Props {
  videos?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  videos: () => [],
});

const sortBy = ref<"views" | "likes" | "shares" | "engagement">("views");
const sortDirection = ref<"desc" | "asc">("desc");

const sortedVideos = computed(() => {
  if (!props.videos || props.videos.length === 0) return [];

  return [...props.videos].sort((a, b) => {
    const metricA =
      sortBy.value === "engagement"
        ? (((a.like_count || 0) +
            (a.comment_count || 0) +
            (a.share_count || 0)) /
            (a.view_count || 0.00001)) *
          100
        : a[sortBy.value === "views" ? "view_count" : sortBy.value];
    const metricB =
      sortBy.value === "engagement"
        ? (((b.like_count || 0) +
            (b.comment_count || 0) +
            (b.share_count || 0)) /
            (b.view_count || 0.00001)) *
          100
        : b[sortBy.value === "views" ? "view_count" : sortBy.value];

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

const truncateTitle = (title: string, maxLength: number = 30): string => {
  if (!title || title.length <= maxLength) return title;
  return title.substring(0, maxLength) + "...";
};

const formatNumber = (num: number): string => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const chartData = computed(() => {
  const videos = displayedVideos.value;

  return {
    labels: videos.map((v) => truncateTitle(v.video_description || "", 30)),
    datasets: [
      {
        label: sortBy.value.charAt(0).toUpperCase() + sortBy.value.slice(1),
        data: videos.map((v) => {
          if (sortBy.value === "views") return v.view_count || 0;
          if (sortBy.value === "likes") return v.like_count || 0;
          if (sortBy.value === "shares") return v.share_count || 0;
          return (
            (((v.like_count || 0) +
              (v.comment_count || 0) +
              (v.share_count || 0)) /
              (v.view_count || 0.00001)) *
            100
          );
        }),
        backgroundColor: "#0f172a",
        borderRadius: 6,
        barThickness: 20,
        borderWidth: 0,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y",
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "rgba(30, 41, 59, 0.95)",
      titleFont: { size: 14, weight: "bold" },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        title: (tooltipItems: any) => {
          const video = displayedVideos.value[tooltipItems[0].dataIndex];
          return video ? truncateTitle(video.video_description || "", 50) : "";
        },
        label: (context: any) => {
          const video = displayedVideos.value[context.dataIndex];
          if (!video) return "";
          const value = context.parsed.y;

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
        color: "#f1f5f9",
      },
      ticks: {
        color: "#94a3b8",
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
} as const;

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};
</script>

<template>
  <div
    class="brutal-card brutal-hover-lift rounded-none h-full flex flex-col p-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h3 class="text-lg font-black uppercase text-slate-900 dark:text-white">
          Top 5 Videos by Performance
        </h3>
        <p class="text-sm font-bold opacity-60 uppercase dark:text-slate-400">
          Sorting by {{ sortBy.charAt(0).toUpperCase() + sortBy.slice(1) }}
        </p>
      </div>
      <div class="flex gap-2">
        <select
          v-model="sortBy"
          class="bg-slate-50 dark:bg-slate-700 border-neo-3 border-black neo-shadow-hard-sm text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 py-2 px-3 focus:ring-2 focus:ring-primary-500 cursor-pointer outline-none hover:ne-hover-lift">
          <option value="views">Views</option>
          <option value="likes">Likes</option>
          <option value="shares">Shares</option>
          <option value="engagement">Engagement Rate</option>
        </select>
        <button
          @click="toggleSortDirection"
          class="bg-slate-50 dark:bg-slate-700 border-neo-3 border-black neo-shadow-hard-sm text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 py-2 px-4 focus:ring-2 focus:ring-primary-500 cursor-pointer outline-none hover:ne-hover-lift flex items-center gap-2">
          {{ sortDirection === "asc" ? "↓ Ascending" : "↓ Descending" }}
        </button>
      </div>
    </div>

    <!-- Chart Container -->
    <div
      v-if="displayedVideos.length === 0"
      class="flex-1 items-center justify-center py-12">
      <p class="text-slate-500 dark:text-slate-400 text-lg">
        No video data available
      </p>
    </div>
    <div v-else class="flex-1 relative h-[300px]">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <!-- Video List -->
    <div class="mt-6 space-y-3">
      <div
        v-for="(video, index) in displayedVideos"
        :key="video.id"
        class="flex items-center gap-3 py-3 border-b-2 border-black last:border-0 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <div
          class="text-lg font-bold w-6 text-slate-600 dark:text-slate-300 shrink-0">
          {{ index + 1 }}.
        </div>
          <div class="flex-1 min-w-0 flex gap-3">
           <div class="flex-1 flex items-center gap-3 min-w-0">
            <img
              :src="
                video.cover_image_url || 'https://via.placeholder.com/64x64'
              "
              :alt="truncateTitle(video.video_description || '', 20)"
              class="w-12 h-12 rounded-lg object-cover" />
            <div class="min-w-0">
              <p
                class="font-semibold text-slate-900 dark:text-white truncate text-sm">
                {{ truncateTitle(video.video_description || "", 40) }}
              </p>
            </div>
          </div>
          <div
            class="text-right min-w-[80px] flex flex-col justify-center items-end">
            <p class="text-xl font-mono font-black text-slate-900 dark:text-white">
              {{ formatNumber(video.view_count || 0) }}
            </p>
            <p
              class="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              {{ sortBy === 'views' ? 'Views' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.truncate {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
