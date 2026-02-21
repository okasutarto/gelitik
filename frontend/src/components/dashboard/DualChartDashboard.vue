<script setup lang="ts">
import { ref } from "vue";
import { Download } from "lucide-vue-next";
import { TopVideosChart } from "@/components/dashboard";
import type { Video } from "@/types/video";

interface Props {
  videos?: Video[];
}

withDefaults(defineProps<Props>(), {
  videos: () => [],
});

const isExporting = ref(false);

const downloadChartAsPNG = () => {
  isExporting.value = true;
  setTimeout(() => {
    // These variables (chart1Canvas, chart2Canvas) are assumed to be available
    // in the scope where this function is called or through refs.
    // For the purpose of fixing the syntax, they are placed here.
    const chart1Canvas = document.getElementById("top-videos-chart-canvas"); // Placeholder, replace with actual ref/ID
    const chart2Canvas = document.getElementById("engagement-doughnut-chart-canvas"); // Placeholder, replace with actual ref/ID

    if (chart1Canvas) {
      const link = document.createElement("a");
      link.download = "tiktok-views-chart.png";
      link.href = (chart1Canvas as HTMLCanvasElement).toDataURL("image/png", 1.0);
      link.click();
    }

    if (chart2Canvas) {
      const link = document.createElement("a");
      link.download = "tiktok-engagement-chart.png";
      link.href = (chart2Canvas as HTMLCanvasElement).toDataURL("image/png", 1.0);
      link.click();
    }

    isExporting.value = false;
  }, 1000);
};
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 relative z-10">
    <!-- View Distribution Chart -->
    <div class="brutal-card p-6 h-[400px] flex flex-col relative group brutal-hover-lift">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h2
            class="text-xl font-black uppercase tracking-tight text-slate-900 border-b-4 border-transparent"
          >
            Views Trend
          </h2>
          <p class="text-sm font-bold opacity-60 uppercase text-slate-900 mt-1">Last 30 Days</p>
        </div>
        <button
          @click="downloadChartAsPNG"
          class="size-8 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          :class="
            isExporting
              ? 'bg-neo-3 border-black text-neo-accent cursor-not-allowed'
              : 'bg-neo-3 border-black hover:bg-slate-200 text-neo-accent cursor-pointer'
          "
          title="Export Chart"
        >
          <Download :size="20" />
        </button>
      </div>
      <div class="flex-1 min-h-0 relative w-full h-full overflow-hidden">
        <TopVideosChart :videos="videos" />
      </div>
    </div>
  </div>
</template>
