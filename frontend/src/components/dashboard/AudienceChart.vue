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
import { useTheme } from "@/composables/useTheme";
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
const { isDark } = useTheme();

const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Mock data - in real app, this would come from API
// Mock data - in real app, this would come from API
const chartData = computed(() => {
  if (props.platform === "all") {
    return {
      labels,
      datasets: [
        {
          label: "Instagram",
          data: [2000, 3000, 4000, 2500, 3500, 4500, 3000],
          backgroundColor: isDark.value ? "#FF0099" : "#ec4899",
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: "TikTok",
          data: [2500, 3000, 4500, 3000, 3500, 4500, 3500],
          backgroundColor: isDark.value ? "#00F0FF" : "#0f172a",
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
          borderColor: isDark.value ? "#FF0099" : "#9333ea",
          backgroundColor: isDark.value
            ? "rgba(255, 0, 153, 0.1)"
            : "rgba(147, 51, 234, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: isDark.value ? "#FF0099" : "#fff",
          pointBorderColor: isDark.value ? "#fff" : "#9333ea",
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
          borderColor: isDark.value ? "#00F0FF" : "#0f172a",
          backgroundColor: isDark.value
            ? "rgba(0, 240, 255, 0.1)"
            : "rgba(15, 23, 42, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: isDark.value ? "#00F0FF" : "#fff",
          pointBorderColor: isDark.value ? "#fff" : "#0f172a",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Engagement",
          data: [1000, 1500, 2000, 4000, 3000, 5000, 7000],
          borderColor: isDark.value ? "#FFCC00" : "#14b8a6",
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }
});

const chartOptions = computed(() => ({
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
        color: isDark.value ? "#E0E0E0" : "#1e293b",
        font: {
          size: 12,
          weight: "bold" as const,
        },
      },
    },
    tooltip: {
      backgroundColor: isDark.value ? "rgba(10, 10, 26, 0.95)" : "#1e293b",
      titleFont: { size: 13, weight: "bold" as const },
      titleColor: isDark.value ? "#00F0FF" : "#fff",
      bodyFont: { size: 12 },
      bodyColor: isDark.value ? "#E0E0E0" : "#fff",
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      borderColor: isDark.value ? "#00F0FF" : "transparent",
      borderWidth: isDark.value ? 1 : 0,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: isDark.value ? "#E0E0E0" : "#94a3b8",
        font: { size: 12 },
      },
    },
    y: {
      grid: {
        color: isDark.value ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9",
      },
      ticks: {
        color: isDark.value ? "#E0E0E0" : "#94a3b8",
        font: { size: 12 },
        callback: function (value: string | number) {
          const numValue = Number(value);
          if (numValue >= 1000) return `${numValue / 1000}k`;
          return value;
        },
      },
    },
  },
}));

const isBarChart = computed(() => props.platform === "all");
</script>

<template>
  <div class="brutal-card brutal-hover-lift rounded-none p-6">
    <div v-if="platform === 'tiktok'" class="p-8 text-center">
      <p class="text-slate-500 dark:text-slate-400">
        Audience data coming soon for TikTok
      </p>
    </div>
    <div v-else>
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3
            class="text-lg font-black uppercase hidden lg:block dark:text-white">
            {{ title }}
          </h3>
          <p class="text-sm font-bold opacity-60 uppercase dark:text-slate-400">
            {{ subtitle }}
          </p>
        </div>
        <select
          v-model="selectedPeriod"
          class="bg-slate-50 dark:bg-navy border-neo-3 border-black dark:border-electric neo-shadow-hard-sm text-sm font-semibold text-slate-600 dark:text-white py-2 px-3 cursor-pointer outline-none brutal-hover-lift">
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
  </div>
</template>
