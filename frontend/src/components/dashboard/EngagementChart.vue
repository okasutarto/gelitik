<script setup lang="ts">
import { computed, ref } from "vue";
import { Line } from "vue-chartjs";
import { useTheme } from "@/composables/useTheme";
import ChartTimeframeControl from "@/components/dashboard/ChartTimeframeControl.vue";
import "@/composables/useChart"; // Registers Chart.js components

interface HistoricalData {
  likes?: { date: string; value: number }[];
  comments?: { date: string; value: number }[];
}

interface Props {
  title?: string;
  subtitle?: string;
  historicalData?: HistoricalData;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Engagement Over Time",
  subtitle: "Daily likes and comments",
});

const selectedMetric = ref("both");
const { isDark } = useTheme();

const metricOptions = [
  { label: "BOTH", value: "both" },
  { label: "LIKES", value: "likes" },
  { label: "COMMENTS", value: "comments" },
];

const chartData = computed(() => {
  const historyLikes = props.historicalData?.likes || [];
  const historyComments = props.historicalData?.comments || [];

  // Sort chronologically just in case API returns out of order
  const sortedLikes = [...historyLikes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const sortedComments = [...historyComments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let displayLabels: string[] = [];
  if (sortedLikes.length > 0) {
    displayLabels = sortedLikes.map((item) => {
      const d = new Date(item.date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
  } else if (sortedComments.length > 0) {
    displayLabels = sortedComments.map((item) => {
      const d = new Date(item.date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
  } else {
    // Fallback labels
    displayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }

  const likesData =
    sortedLikes.length > 0 ? sortedLikes.map((i) => i.value) : [0, 0, 0, 0, 0, 0, 0];
  const commentsData =
    sortedComments.length > 0 ? sortedComments.map((i) => i.value) : [0, 0, 0, 0, 0, 0, 0];

  const datasets = [];

  if (selectedMetric.value === "both" || selectedMetric.value === "likes") {
    datasets.push({
      label: "Likes",
      data: likesData,
      borderColor: isDark.value ? "#FFCC00" : "#eab308", // Yellow
      backgroundColor: isDark.value ? "rgba(255, 204, 0, 0.1)" : "rgba(234, 179, 8, 0.1)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: isDark.value ? "#FFCC00" : "#fff",
      pointBorderColor: isDark.value ? "#fff" : "#eab308",
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    });
  }

  if (selectedMetric.value === "both" || selectedMetric.value === "comments") {
    datasets.push({
      label: "Comments",
      data: commentsData,
      borderColor: isDark.value ? "#00F0FF" : "#06b6d4", // Cyan
      backgroundColor: isDark.value ? "rgba(0, 240, 255, 0.1)" : "rgba(6, 182, 212, 0.1)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: isDark.value ? "#00F0FF" : "#fff",
      pointBorderColor: isDark.value ? "#fff" : "#06b6d4",
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    });
  }

  return {
    labels: displayLabels,
    datasets,
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
      <div class="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
        <ChartTimeframeControl v-model="selectedMetric" :options="metricOptions" />
      </div>
    </div>

    <!-- Chart -->
    <div class="h-64 w-full">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
