<script setup lang="ts">
import { ref } from "vue";
import { Download } from "lucide-vue-next";
import { TopVideosChart, EngagementDoughnutChart } from "@/components/dashboard";
import type { Video } from "@/types/video";

interface Props {
  videos?: Video[];
}

const props = withDefaults(defineProps<Props>(), {
  videos: () => [],
});

const isExporting = ref(false);

const downloadChartAsPNG = () => {
  isExporting.value = true;

  setTimeout(() => {
    const chart1Canvas = document.querySelector(".neo-card canvas");
    const chart2Canvas = document.querySelector(
      ".neo-card canvas:nth-of-type(2)",
    );

    if (chart1Canvas) {
      const link = document.createElement("a");
      link.download = "tiktok-views-chart.png";
      link.href = (chart1Canvas as HTMLCanvasElement).toDataURL(
        "image/png",
        1.0,
      );
      link.click();
    }

    if (chart2Canvas) {
      const link = document.createElement("a");
      link.download = "tiktok-engagement-chart.png";
      link.href = (chart2Canvas as HTMLCanvasElement).toDataURL(
        "image/png",
        1.0,
      );
      link.click();
    }

    isExporting.value = false;
  }, 1000);
};
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-2">
    <!-- Left Column: Top Videos Chart (60%) -->
    <div class="flex-1 lg:w-3/5 lg:pr-3">
      <TopVideosChart :videos="videos" />
    </div>

    <!-- Right Column: Engagement Doughnut Chart (40%) -->
    <div class="flex-1 lg:w-2/5 lg:pl-3">
      <EngagementDoughnutChart :videos="videos" />
    </div>
  </div>
</template>
