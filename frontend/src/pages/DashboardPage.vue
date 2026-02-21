<script setup lang="ts">
import { Users, Heart, FileText, Eye, RefreshCw } from "lucide-vue-next";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import StatCard from "@/components/dashboard/StatCard.vue";
import AudienceChart from "@/components/dashboard/AudienceChart.vue";
import ContentTable from "@/components/dashboard/ContentTable.vue";
import { useDashboardData } from "@/composables/useDashboardData";

const { kpiCards, isLoading, error, lastUpdated, refresh } = useDashboardData();

// Map KPI card data to icons
const kpiIcons = [Users, Heart, FileText, Eye];
</script>

<template>
  <DashboardLayout>
    <!-- Page Header with Theme Toggle + Refresh -->
    <div class="flex items-center justify-between mb-2">
      <PageHeader
        title="Overview"
        subtitle="Welcome back to your master dashboard."
        :show-theme-toggle="true"
      />
      <div class="flex items-center gap-3">
        <span v-if="lastUpdated" class="text-xs text-slate-400 dark:text-slate-500 font-mono">
          Updated {{ lastUpdated.toLocaleTimeString() }}
        </span>
        <button
          @click="refresh"
          class="brutal-card p-2 brutal-hover-lift"
          :class="{ 'animate-spin': isLoading }"
          title="Refresh data"
        >
          <RefreshCw :size="16" class="text-slate-600 dark:text-slate-400" />
        </button>
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
          :value="card.rawValue"
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

    <!-- Top Performing Content -->
    <ContentTable platform="all" />
  </DashboardLayout>
</template>
