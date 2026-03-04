<script setup lang="ts">
import { Users, Heart, FileText, Eye, Calendar, ChevronDown, Download } from 'lucide-vue-next'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ExportReportModal from '@/components/dashboard/reports/ExportReportModal.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/dashboard/cards/StatCard.vue'
import ContentTable from '@/components/dashboard/content/ContentTable.vue'
import PlatformHealthComparison from '@/components/dashboard/profile/PlatformHealthComparison.vue'
import AudienceChart from '@/components/dashboard/charts/AudienceChart.vue'
import EngagementChart from '@/components/dashboard/charts/EngagementChart.vue'
import StatCardSkeleton from '@/components/loading/StatCardSkeleton.vue'
import ChartSkeleton from '@/components/loading/ChartSkeleton.vue'
import ContentTableSkeleton from '@/components/loading/ContentTableSkeleton.vue'
import { useDashboardData } from '@/composables/useDashboardData'
import { ref, computed } from 'vue'

const {
  kpiCards,
  platformHealth,
  followerHistory,
  engagementHistory,
  selectedDays,
  setDateRange,
  isLoading,
  error,
  lastUpdated,
  refresh,
  topContent
} = useDashboardData()

// Date range options
const dateRangeOptions = [
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 14 Days', value: '14' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'Last 90 Days', value: '90' }
]
const selectedRange = ref(String(selectedDays.value))
const isDropdownOpen = ref(false)
const isExportModalOpen = ref(false)

const selectedTimeframeLabel = computed(() => {
  return dateRangeOptions.find((o) => o.value === selectedRange.value)?.label || 'Last 30 Days'
})

function onDateRangeChange(val: string) {
  selectedRange.value = val
  setDateRange(parseInt(val))
  isDropdownOpen.value = false
}

// Map KPI card data to icons
const kpiIcons = [Users, Heart, FileText, Eye]
</script>

<template>
  <DashboardLayout>
    <!-- Page Header -->
    <PageHeader
      title="Overview"
      subtitle="Welcome back to your master dashboard."
      info-tooltip="Instagram metrics reflect the <strong>last 7 days</strong>. TikTok metrics are based on <strong>recent content</strong>. For detailed time-range filtering, visit each platform's analytics page."
      :last-updated="lastUpdated"
      :loading="isLoading"
      @refresh="refresh"
    />

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

    <!-- Actions Row -->
    <div class="flex justify-end gap-3 mb-6 relative">
      <button
        @click="isExportModalOpen = true"
        class="flex items-center gap-2 bg-neo-accent dark:bg-hotpink text-black px-4 py-2 border-3 border-black dark:border-electric font-black brutal-hover-lift group shadow-brutal-sm uppercase tracking-wider text-sm"
      >
        <Download :size="18" class="stroke-[3]" />
        Export
      </button>

      <button
        @click="isDropdownOpen = !isDropdownOpen"
        class="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 border-3 border-black dark:border-electric font-bold brutal-hover-lift group shadow-brutal-sm"
      >
        <Calendar :size="18" class="text-neo-accent dark:text-electric" />
        {{ selectedTimeframeLabel }}
        <ChevronDown
          :size="18"
          class="transition-transform duration-200"
          :class="{ 'rotate-180': isDropdownOpen }"
        />
      </button>

      <div
        v-if="isDropdownOpen"
        class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border-2 border-black dark:border-electric shadow-brutal z-50 flex flex-col"
      >
        <button
          v-for="tf in dateRangeOptions"
          :key="tf.value"
          @click="onDateRangeChange(tf.value)"
          class="flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-slate-900 dark:text-white"
        >
          {{ tf.label }}
          <svg
            v-if="selectedRange === tf.value"
            class="w-4 h-4 text-neo-accent dark:text-electric"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- KPI Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <template v-if="isLoading">
        <StatCardSkeleton :count="4" />
      </template>
      <template v-else>
        <StatCard
          v-for="(card, index) in kpiCards"
          :key="card.title"
          :title="card.title"
          :value="card.value"
          :icon="kpiIcons[index]"
          :subtitle="card.subtitle"
          :delta="card.delta"
          :delta-percent="card.deltaPercent"
          :delta-label="card.deltaLabel"
        />
      </template>
    </div>

    <!-- Audience Chart -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <ChartSkeleton v-if="isLoading" />
      <AudienceChart
        v-else
        platform="all"
        title="Audience Growth"
        subtitle="Daily follower snapshots"
        :follower-history="followerHistory"
      />
      <!-- Engagement Over Time -->

      <ChartSkeleton v-if="isLoading" />
      <EngagementChart
        v-else
        title="Engagement Over Time"
        subtitle="Daily total likes &amp; engagement rate"
        :historical-data="engagementHistory"
      />
    </div>

    <!-- Platform Health Comparison -->
    <div class="mb-12">
      <PlatformHealthComparison
        :instagram="platformHealth.instagram"
        :tiktok="platformHealth.tiktok"
        :loading="isLoading"
      />
    </div>

    <!-- Top Performing Content -->
    <ContentTableSkeleton v-if="isLoading" />
    <ContentTable v-else platform="all" :videos="topContent" />

    <!-- Export Modal -->
    <ExportReportModal :is-open="isExportModalOpen" @close="isExportModalOpen = false" />
  </DashboardLayout>
</template>
