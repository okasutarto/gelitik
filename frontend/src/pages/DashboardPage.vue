<script setup lang="ts">
import { Users, Heart, FileText, Eye, RefreshCw } from "lucide-vue-next";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import StatCard from "@/components/dashboard/StatCard.vue";
import ContentTable from "@/components/dashboard/ContentTable.vue";
import PlatformHealthComparison from "@/components/dashboard/PlatformHealthComparison.vue";
import BestTimeHeatmap from "@/components/dashboard/BestTimeHeatmap.vue";
import AudienceChart from "@/components/dashboard/AudienceChart.vue";
import { useDashboardData } from "@/composables/useDashboardData";

const { kpiCards, platformHealth, heatmapData, isLoading, error, lastUpdated, refresh, topContent } =
  useDashboardData();

// Map KPI card data to icons
const kpiIcons = [Users, Heart, FileText, Eye];
</script>

<template>
  <DashboardLayout>
    <!-- Page Header with Refresh inline -->
    <div
      class="relative bg-neo-accent dark:bg-hotpink border-b-4 border-black dark:border-electric p-6 md:p-8 mb-8 -mx-4 md:-mx-8"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <h2 class="text-4xl lg:text-5xl font-black uppercase text-slate-900 leading-tight">
            Overview
          </h2>
          <p class="text-sm font-bold opacity-60 uppercase text-slate-900 mt-2">
            Welcome back to your master dashboard.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="lastUpdated"
            class="text-xs text-slate-700 dark:text-slate-900 font-bold hidden sm:inline-block"
          >
            Updated {{ lastUpdated.toLocaleTimeString() }}
          </span>
          <button
            @click="refresh"
            class="brutal-card bg-white p-2 brutal-hover-lift"
            :class="{ 'animate-spin': isLoading }"
            title="Refresh data"
          >
            <RefreshCw :size="16" class="text-slate-900" />
          </button>
        </div>
      </div>
    </div>

    <!-- Error Banner -->
    <div
      v-if="error"
      class="brutal-card border-red-500 bg-red-50 dark:bg-red-900/20 p-4 mb-6 flex items-center justify-between"
    >
      <span class="text-sm font-bold text-red-600 dark:text-red-400">
        {{ error }}
      </span>
      <button
        @click="refresh"
        class="text-sm font-black uppercase px-3 py-1 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 rounded hover:bg-red-200 transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- KPI Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <template v-if="isLoading && kpiCards.length === 0">
        <StatCard v-for="i in 4" :key="i" title="" :value="0" :loading="true" />
      </template>
      <template v-else>
        <StatCard
          v-for="(card, index) in kpiCards"
          :key="card.title"
          :title="card.title"
          :value="card.value"
          :icon="kpiIcons[index]"
          :subtitle="card.subtitle"
        />
      </template>

      <!-- Audience Chart - Full Width Below -->
      <div class="col-span-1 md:col-span-2 lg:col-span-4 mt-6">
        <AudienceChart
          platform="all"
          title="Audience Growth"
          subtitle="Combined performance over last 7 days"
        />
      </div>
    </div>

    <!-- Platform Health Comparison -->
    <div class="mb-12">
      <PlatformHealthComparison
        :instagram="platformHealth.instagram"
        :tiktok="platformHealth.tiktok"
        :loading="isLoading"
      />
    </div>

    <!-- Best Time Heatmap -->
    <!-- <div class="mb-12">
      <BestTimeHeatmap :data="heatmapData" :loading="isLoading" />
    </div> -->

    <!-- Top Performing Content -->
    <ContentTable platform="all" :videos="topContent" />
  </DashboardLayout>
</template>
