<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import { Chart as ChartJS, Tooltip, Legend, Title, Filler } from "chart.js";

ChartJS.register(Tooltip, Legend, Title, Filler);

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

const chartData = computed(() => {
  const data = engagementData.value;

  return {
    labels: ["Likes", "Comments", "Shares"],
    datasets: [
      {
        data: [data.likes, data.comments, data.shares],
        backgroundColor: ["#3b82f6", "#8b5cf6", "#06b6d4"],
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 4,
        hoverBorderColor: "#ffffff",
      },
    ],
  };
});

const formatNumber = (value: number) => {
  return value?.toLocaleString() || "0";
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  cutout: "60%",
  cutoutPercentage: 60,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
      labels: {
        color: "#1e293b",
        font: {
          size: 13,
          weight: "600",
        },
        padding: 20,
        usePointStyle: true,
        pointStyle: "circle",
      },
    },
    tooltip: {
      backgroundColor: "rgba(30, 41, 59, 0.95)",
      titleFont: { size: 14, weight: "bold" },
      bodyFont: { size: 12 },
      padding: 14,
      cornerRadius: 10,
      displayColors: true,
      callbacks: {
        label: (context) => {
          const total = engagementData.value.total;
          const value = context.parsed;
          const percentage =
            total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
          return `${context.label}: ${value?.toLocaleString()} (${percentage}%)`;
        },
      },
    },
  },
};
</script>

<template>
  <div class="neo-card border-neo-3 border-black neo-hover-lift">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-black uppercase text-slate-900 dark:text-white">
          Engagement Distribution
        </h3>
        <p class="text-sm font-bold opacity-60 uppercase dark:text-slate-400">
          Breakdown across all videos
        </p>
      </div>
      <div class="text-right">
        <p class="text-3xl font-black text-slate-900 dark:text-white">
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
      class="grid grid-cols-3 gap-4 mt-6">
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3b82f6] dark:bg-slate-700">
          <svg class="w-6 h-6" fill="white" viewBox="0 0 24 24">
            <path
              d="M20.84 7.61 9 14 17 4.36A2.09 1.04 12.04 2.3L14.3 14.32a2.83-6.14 1.16L17.69 2.27 14.32-4.32A3.09 1.04L20.84 7.61z" />
          </svg>
        </div>
        <p class="text-lg font-bold text-slate-900 dark:text-white mt-2">
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
              d="M21 7.067 3.058 5 0.5C21.067 3.058 3.813.058 3.576 1.067z" />
          </svg>
        </div>
        <p class="text-lg font-bold text-slate-900 dark:text-white mt-2">
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
              d="M8.5 13.5a2.5 2 1-2.42 14l-5.74-13.5a2.5 2.8 5.74 13.5-12a1.42 5.74-13.5a2.5 2.83 0z" />
          </svg>
        </div>
        <p class="text-font-bold text-slate-900 dark:text-white mt-2">
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
