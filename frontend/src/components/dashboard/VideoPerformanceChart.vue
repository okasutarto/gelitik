<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Bar, Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Props {
  videos?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  videos: () => [],
});

const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => Math.ceil((props.videos?.length || 0) / itemsPerPage));

const paginatedVideos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return (props.videos || []).slice(start, end);
});

const hasVideoData = computed(() => {
  return props.videos && props.videos.length > 0 && props.videos.some((v: any) => v.view_count > 0);
});

const truncateTitle = (title: string, maxLength: number = 20): string => {
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
  if (!paginatedVideos.value || paginatedVideos.value.length === 0) {
    return { labels: [], datasets: [] };
  }

  console.log('[VideoPerformanceChart] Processing videos:', paginatedVideos.value);

  const engagementRates = paginatedVideos.value.map((v) => {
    const likes = v.like_count || 0;
    const comments = v.comment_count || 0;
    const shares = v.share_count || 0;
    const views = v.view_count || 0;
    const totalEngagement = likes + comments + shares;
    const rate = views > 0 ? (totalEngagement / views) * 100 : 0;
    
    console.log('[VideoPerformanceChart] Video engagement:', {
      title: v.video_description?.substring(0, 30),
      likes,
      comments,
      shares,
      views,
      totalEngagement,
      rate: rate.toFixed(2) + '%'
    });
    
    return rate;
  });

  const hasValidData = paginatedVideos.value.some((v) => (v.view_count || 0) > 0);
  const hasAnyEngagement = paginatedVideos.value.some((v) => (v.like_count || 0) + (v.comment_count || 0) + (v.share_count || 0) > 0);

  console.log('[VideoPerformanceChart] Summary:', {
    totalVideos: paginatedVideos.value.length,
    hasValidViews: hasValidData,
    hasAnyEngagement,
    sampleRates: engagementRates.slice(0, 3).map(r => r.toFixed(2) + '%')
  });

  return {
    labels: paginatedVideos.value.map((v) => truncateTitle(v.video_description || "", 20)),
    datasets: [
      {
        label: "Views",
        data: paginatedVideos.value.map((v) => v.view_count || 0),
        backgroundColor: "#0f172a",
        borderRadius: 4,
        barPercentage: 0.6,
        order: 2,
      },
      {
        label: "Engagement Rate",
        data: engagementRates,
        borderColor: "#14b8a6",
        backgroundColor: hasValidData ? "rgba(20, 184, 166, 0.2)" : "rgba(20, 184, 166, 0.05)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        order: 1,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "top" as const,
      align: "end" as const,
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 20,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: "#1e293b",
      titleFont: { size: 13 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        title: (tooltipItems: any) => {
          const video = paginatedVideos.value[tooltipItems[0].dataIndex];
          return video ? truncateTitle(video.video_description || "", 50) : "";
        },
        label: (context: any) => {
          if (context.dataset.label === "Engagement Rate") {
            return `${context.dataset.label}: ${context.formattedValue}%`;
          }
          return `${context.dataset.label}: ${context.formattedValue}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#94a3b8",
        font: { size: 11 },
        maxRotation: 45,
        minRotation: 45,
      },
    },
    y: {
      grid: {
        color: "#f1f5f9",
      },
      ticks: {
        color: "#94a3b8",
        font: { size: 12 },
        callback: function (value: string | number) {
          const numValue = Number(value);
          if (numValue >= 1000) return `${numValue / 1000}k`;
          return value;
        },
      },
      beginAtZero: true,
    },
  },
} as const;

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

watch(
  () => props.videos?.length,
  () => {
    currentPage.value = 1;
  }
);
</script>

<template>
  <div class="neo-card border-neo-3 border-black neo-hover-lift">
    <div v-if="!videos || videos.length === 0" class="p-8 text-center">
      <p class="text-slate-500 dark:text-slate-400">
        No video data available
      </p>
    </div>
    <div v-else-if="!hasVideoData" class="p-8 text-center">
      <p class="text-slate-500 dark:text-slate-400">
        TikTok API returned video data with 0 views. This is normal in sandbox mode.
      </p>
    </div>
    <div v-else>
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3
            class="text-lg font-black uppercase hidden lg:block dark:text-white">
            Video Performance
          </h3>
          <p class="text-sm font-bold opacity-60 uppercase dark:text-slate-400">
            Views and engagement rate
          </p>
        </div>
        <div class="flex items-center gap-4">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="bg-slate-50 dark:bg-slate-700 border-neo-3 border-black neo-shadow-hard-sm text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-500 cursor-pointer outline-none hover:ne-hover-lift">
            Previous
          </button>
          <span class="text-sm font-bold text-slate-900 dark:text-white px-3">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="bg-slate-50 dark:bg-slate-700 border-neo-3 border-black neo-shadow-hard-sm text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-500 cursor-pointer outline-none hover:ne-hover-lift">
            Next
          </button>
        </div>
      </div>

      <div class="h-64 w-full">
        <Bar
          :data="chartData"
          :options="chartOptions"
        />
      </div>
    </div>
  </div>
</template>
