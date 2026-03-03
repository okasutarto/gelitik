<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import { Heart, MessageCircle, Share2 } from "lucide-vue-next";
import { useTheme } from "@/composables/useTheme";
import { formatNumber } from "@/utils/format";
import type { Video } from "@/types/video";
import "@/composables/useChart"; // Registers Chart.js components
import type { TooltipItem } from "chart.js";
import type { ChartOptions } from "chart.js";

interface Props {
  videos?: Video[];
}

const props = withDefaults(defineProps<Props>(), {
  videos: () => [],
});

const engagementData = computed(() => {
  if (!props.videos || props.videos.length === 0) {
    return { likes: 0, comments: 0, shares: 0, total: 0 };
  }

  const totalLikes = props.videos.reduce((sum, v) => sum + (v.like_count || 0), 0);
  const totalComments = props.videos.reduce((sum, v) => sum + (v.comment_count || 0), 0);
  const totalShares = props.videos.reduce((sum, v) => sum + (v.share_count || 0), 0);
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

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: true,
  cutout: "60%",
  cutoutPercentage: 60,
  events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
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
      backgroundColor: isDark.value ? "rgba(10, 10, 26, 0.95)" : "rgba(30, 41, 59, 0.95)",
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
        label: (context: TooltipItem<"doughnut">) => {
          const total = engagementData.value.total;
          const value = context.parsed;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
          return `${context.label}: ${value?.toLocaleString()} (${percentage}%)`;
        },
      },
    },
  },
}));
</script>

<template>
  <div class="p-6 h-full">
    <div class="flex items-center justify-end mb-6">
      <div class="text-right">
        <p class="text-3xl font-mono font-black text-slate-900 dark:text-white">
          {{ engagementData?.total?.toLocaleString() }}
        </p>
        <p class="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
          Total Engagement
        </p>
      </div>
    </div>

    <div
      v-if="props.videos && props.videos.length === 0"
      class="flex items-center justify-center py-12"
    >
      <p class="text-slate-500 dark:text-slate-400 text-lg">No video data available</p>
    </div>
    <div v-else class="flex items-center justify-center">
      <div class="relative w-full max-w-[400px] h-[400px]">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Stats Summary -->
    <div v-if="props.videos && props.videos.length > 0" class="grid grid-cols-3 gap-4 mt-12">
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3b82f6] dark:bg-slate-700"
        >
          <Heart class="w-6 h-6 text-white" :stroke-width="2.5" />
        </div>
        <p class="text-lg font-mono font-bold text-slate-900 dark:text-white mt-2">
          {{ formatNumber(engagementData.likes) }}
        </p>
        <p class="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">
          Total Likes
        </p>
      </div>
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#8b5cf6] dark:bg-slate-700"
        >
          <MessageCircle class="w-6 h-6 text-white" :stroke-width="2.5" />
        </div>
        <p class="text-lg font-mono font-bold text-slate-900 dark:text-white mt-2">
          {{ formatNumber(engagementData.comments) }}
        </p>
        <p class="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">
          Total Comments
        </p>
      </div>
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#06b6d4] dark:bg-slate-700"
        >
          <Share2 class="w-6 h-6 text-white" :stroke-width="2.5" />
        </div>
        <p class="text-lg font-mono font-bold text-slate-900 dark:text-white mt-2">
          {{ formatNumber(engagementData.shares) }}
        </p>
        <p class="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">
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
