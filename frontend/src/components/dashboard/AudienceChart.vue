<script setup lang="ts">
import { computed, ref } from "vue";
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
import type { Platform } from "@/composables/usePlatform";

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
  platform: Platform;
  title?: string;
  subtitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Audience Growth",
  subtitle: "Performance over last 7 days",
});

const selectedPeriod = ref("7days");

const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Mock data - in real app, this would come from API
const chartData = computed(() => {
  if (props.platform === "all") {
    return {
      labels,
      datasets: [
        {
          label: "Instagram",
          data: [2000, 3000, 4000, 2500, 3500, 4500, 3000],
          backgroundColor: "#ec4899",
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: "TikTok",
          data: [2500, 3000, 4500, 3000, 3500, 4500, 3500],
          backgroundColor: "#5c5b5b",
          borderRadius: 4,
          barPercentage: 0.6,
        },
      ],
    };
  } else if (props.platform === "instagram") {
    return {
      labels,
      datasets: [
        {
          label: "Followers",
          data: [4000, 5000, 7000, 5500, 8000, 6500, 9000],
          borderColor: "#9333ea",
          backgroundColor: "rgba(147, 51, 234, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#9333ea",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  } else {
    return {
      labels,
      datasets: [
        {
          label: "Views",
          data: [2000, 3500, 2500, 6000, 4500, 7500, 9500],
          borderColor: "#0f172a",
          backgroundColor: "rgba(15, 23, 42, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#0f172a",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Engagement",
          data: [1000, 1500, 2000, 4000, 3000, 5000, 7000],
          borderColor: "#14b8a6",
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: props.platform === "all",
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
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#94a3b8",
        font: { size: 12 },
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
    },
  },
} as const;

const isBarChart = computed(() => props.platform === "all");
</script>

<template>
  <div
    class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">
          {{ title }}
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
      </div>
      <select
        v-model="selectedPeriod"
        class="bg-slate-50 dark:bg-slate-700 border-none text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 py-2 px-3 focus:ring-2 focus:ring-primary-500 cursor-pointer outline-none">
        <option value="7days">Last 7 Days</option>
        <option value="30days">Last 30 Days</option>
        <option value="quarter">Last Quarter</option>
      </select>
    </div>

    <!-- Chart -->
    <div class="h-64 w-full">
      <Bar v-if="isBarChart" :data="chartData" :options="chartOptions" />
      <Line v-else :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
