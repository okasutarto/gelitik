<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
import { useTheme } from "@/composables/useTheme";
import "@/composables/useChart"; // Registers Chart.js components

interface ViewsData {
  date: string;
  value: number;
}

interface Props {
  title?: string;
  subtitle?: string;
  historicalData?: {
    views?: ViewsData[];
  };
}

const props = withDefaults(defineProps<Props>(), {
  title: "Views Over Time",
  subtitle: "Daily video views",
});

const { isDark } = useTheme();

const chartData = computed(() => {
  const historyViews = props.historicalData?.views || [];

  // Sort chronologically
  const sortedViews = [...historyViews].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const displayLabels = sortedViews.map((item) => {
    const d = new Date(item.date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const viewsData =
    sortedViews.length > 0
      ? sortedViews.map((i) => i.value)
      : [0, 0, 0, 0, 0, 0, 0];

  return {
    labels: displayLabels,
    datasets: [
      {
        label: "Views",
        data: viewsData,
        borderColor: isDark.value ? "#FF0099" : "#ec4899", // Pink
        backgroundColor: isDark.value ? "rgba(255, 0, 153, 0.1)" : "rgba(236, 72, 153, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: isDark.value ? "#FF0099" : "#fff",
        pointBorderColor: isDark.value ? "#fff" : "#ec4899",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

const chartOptions = computed(() => ({
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
      beginAtZero: true,
    },
  },
}));
</script>

<template>
  <div class="brutal-card brutal-hover-lift rounded-none p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <div>
        <h3 class="text-lg font-black uppercase hidden lg:block dark:text-white">
          {{ title }}
        </h3>
        <p class="text-sm font-bold opacity-60 uppercase dark:text-slate-400">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Chart -->
    <div class="h-64 w-full">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
