<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import { useTheme } from "@/composables/useTheme";
import { formatNumber } from "@/utils/format";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  Title,
  Filler,
  ArcElement,
} from "chart.js";

ChartJS.register(Tooltip, Legend, Title, Filler, ArcElement);

interface Props {
  videos?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  videos: () => [],
});

const engagementData = computed(() => {
  if (!props.videos || props.videos.length === 0) {
    return { likes: 0, comments: 0, shares: 0 };
  }

  const totalLikes = props.videos.reduce(
    (sum, v) => sum + (v.like_count || 0),
    0,
  );
  const totalComments = props.videos.reduce(
    (sum, v) => sum + (v.comment_count || 0),
    0,
  );
  const totalShares = props.videos.reduce(
    (sum, v) => sum + (v.share_count || 0),
    0,
  );
  const totalEngagement = totalLikes + totalComments + totalShares;

  return {
    likes: totalLikes,
    comments: totalComments,
    shares: totalShares,
    total: totalEngagement,
  };
});

const { isDark } = useTheme();

const chartData = computed(() => {
  const data = engagementData.value;

  return {
    labels: ["Likes", "Comments", "Shares"],
    datasets: [
      {
        data: [data.likes, data.comments, data.shares],
        backgroundColor: isDark.value
          ? ["#FF0099", "#00F0FF", "#FFCC00"]
          : ["#3b82f6", "#8b5cf6", "#06b6d4"],
        borderColor: isDark.value ? "#000000" : "#ffffff",
        borderWidth: 3,
        hoverOffset: 4,
        hoverBorderColor: isDark.value ? "#00F0FF" : "#ffffff",
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  cutout: "60%",
  cutoutPercentage: 60,
  events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"] as any,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
      labels: {
        color: isDark.value ? "#E0E0E0" : "#1e293b",
        font: {
          size: 13,
          weight: "bold" as const,
        },
        padding: 20,
        usePointStyle: true,
        pointStyle: "circle",
      },
    },
    tooltip: {
      backgroundColor: isDark.value
        ? "rgba(10, 10, 26, 0.95)"
        : "rgba(30, 41, 59, 0.95)",
      titleFont: { size: 14, weight: "bold" as const },
      titleColor: isDark.value ? "#00F0FF" : "#fff",
      bodyFont: { size: 12 },
      bodyColor: isDark.value ? "#E0E0E0" : "#fff",
      padding: 14,
      cornerRadius: 10,
      displayColors: true,
      borderColor: isDark.value ? "#00F0FF" : "transparent",
      borderWidth: isDark.value ? 1 : 0,
      callbacks: {
        label: (context: any) => {
          const total = engagementData.value.total;
          const value = context.parsed;
          const percentage =
            total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
          return `${context.label}: ${value?.toLocaleString()} (${percentage}%)`;
        },
      },
    },
  },
}));
</script>

<template>
  <div class="brutal-card brutal-hover-lift rounded-none p-6 h-full">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3
          class="text-lg font-black uppercase text-slate-900 dark:text-electric/70">
          Engagement Distribution
        </h3>
        <p class="text-sm font-bold opacity-60 uppercase dark:text-slate-400">
          Breakdown across all videos
        </p>
      </div>
      <div class="text-right">
        <p class="text-3xl font-mono font-black text-slate-900 dark:text-white">
          {{ engagementData?.total?.toLocaleString() }}
        </p>
        <p
          class="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
          Total Engagement
        </p>
      </div>
    </div>

    <div
      v-if="props.videos && props.videos.length === 0"
      class="flex items-center justify-center py-12">
      <p class="text-slate-500 dark:text-slate-400 text-lg">
        No video data available
      </p>
    </div>
    <div v-else class="flex items-center justify-center">
      <div class="relative w-full max-w-[400px] h-[400px]">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Stats Summary -->
    <div
      v-if="props.videos && props.videos.length > 0"
      class="grid grid-cols-3 gap-4 mt-12">
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3b82f6] dark:bg-slate-700">
          <svg class="w-6 h-6" fill="white" viewBox="0 0 24 24">
            <path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
        <p
          class="text-lg font-mono font-bold text-slate-900 dark:text-white mt-2">
          {{ formatNumber(engagementData.likes) }}
        </p>
        <p
          class="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">
          Total Likes
        </p>
      </div>
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#8b5cf6] dark:bg-slate-700">
          <svg class="w-6 h-6" fill="white" viewBox="0 0 24 24">
            <path
              d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
        </div>
        <p
          class="text-lg font-mono font-bold text-slate-900 dark:text-white mt-2">
          {{ formatNumber(engagementData.comments) }}
        </p>
        <p
          class="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">
          Total Comments
        </p>
      </div>
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#06b6d4] dark:bg-slate-700">
          <svg class="w-6 h-6" fill="white" viewBox="0 0 24 24">
            <path
              d="M21.707 20.293l-4-4a7 7 0 10-9.9-9.9 7 7 0 000 9.9 7 7 0 009.9 0l4 4a1 1 0 001.414-1.414zM6 11a5 5 0 115-5 5 5 0 01-5 5z" />
          </svg>
        </div>
        <p
          class="text-lg font-mono font-bold text-slate-900 dark:text-white mt-2">
          {{ formatNumber(engagementData.shares) }}
        </p>
        <p
          class="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">
          Total Shares
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-font {
  font-size: 16px;
}
</style>
