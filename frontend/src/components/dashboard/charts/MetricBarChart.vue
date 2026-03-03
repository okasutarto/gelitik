<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import { useTheme } from "@/composables/useTheme";
import "@/composables/useChart";

interface Props {
  title?: string;
  subtitle?: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Engagement Distribution",
  subtitle: "Likes · Comments · Shares",
  likes: 0,
  comments: 0,
  shares: 0
});

const { isDark } = useTheme();

const chartData = computed(() => ({
  labels: ["Likes", "Comments", "Shares"],
  datasets: [{
    label: "Count",
    data: [props.likes, props.comments, props.shares],
    backgroundColor: [
      isDark.value ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.8)",
      isDark.value ? "rgba(139, 92, 246, 0.8)" : "rgba(124, 58, 237, 0.8)",
      isDark.value ? "rgba(6, 182, 212, 0.8)" : "rgba(8, 145, 178, 0.8)"
    ],
    borderColor: [
      isDark.value ? "#3b82f6" : "#2563eb",
      isDark.value ? "#8b5cf6" : "#7c3aed",
      isDark.value ? "#06b6d4" : "#0891b2"
    ],
    borderWidth: 2,
    borderRadius: 4,
    barThickness: 40
  }]
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y" as const,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: isDark.value ? "rgba(10, 10, 26, 0.95)" : "rgba(30, 41, 59, 0.95)",
      titleFont: { size: 14, weight: "bold" as const },
      titleColor: isDark.value ? "#00F0FF" : "#fff",
      bodyFont: { size: 12 },
      bodyColor: isDark.value ? "#E0E0E0" : "#fff",
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: {
        color: isDark.value ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9"
      },
      ticks: {
        color: isDark.value ? "#E0E0E0" : "#94a3b8",
        font: { size: 11 },
        callback: (value: number | string) => {
          const num = Number(value);
          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
          return value;
        }
      }
    },
    y: {
      grid: {
        display: false
      },
      ticks: {
        color: isDark.value ? "#E0E0E0" : "#1e293b",
        font: { size: 12, weight: "bold" as const }
      }
    }
  }
}));
</script>

<template>
  <div class="brutal-card brutal-hover-lift rounded-none p-6">
    <!-- Header -->
    <div class="mb-4">
      <h3 class="text-lg font-black uppercase dark:text-white">
        {{ title }}
      </h3>
      <p class="text-sm font-bold opacity-60 uppercase dark:text-slate-400">
        {{ subtitle }}
      </p>
    </div>

    <!-- Chart -->
    <div class="h-48">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
