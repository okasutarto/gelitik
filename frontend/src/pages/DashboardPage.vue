<script setup lang="ts">
import {
  Users,
  Heart,
  FileText,
  Eye,
  Calendar,
  ChevronDown,
  Download,
  Video
} from 'lucide-vue-next'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ExportReportModal from '@/components/dashboard/reports/ExportReportModal.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/dashboard/cards/StatCard.vue'
import ContentTable from '@/components/dashboard/content/ContentTable.vue'
import PlatformCard from '@/components/dashboard/profile/PlatformCard.vue'
import AudienceChart from '@/components/dashboard/charts/AudienceChart.vue'
import ViewsComparisonChart from '@/components/dashboard/charts/ViewsComparisonChart.vue'
import EngagementComparisonChart from '@/components/dashboard/charts/EngagementComparisonChart.vue'
import StatCardSkeleton from '@/components/loading/StatCardSkeleton.vue'
import ChartSkeleton from '@/components/loading/ChartSkeleton.vue'
import ContentTableSkeleton from '@/components/loading/ContentTableSkeleton.vue'
import { useDashboardData } from '@/composables/useDashboardData'
import { useTiktokStore } from '@/stores/tiktokStore'
import { ref, computed } from 'vue'

const {
  kpiCards,
  platformHealth,
  followerHistory,
  selectedDays,
  setDateRange,
  isLoading,
  error,
  lastUpdated,
  refresh,
  topContent
} = useDashboardData()

const tiktokStore = useTiktokStore()

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
const kpiIcons = [Users, Heart, FileText, Eye, Video]

// Get TikTok totals - use history data for views (same as Instagram)
const tiktokTotalViews = computed(() => {
  const ttHistory = followerHistory.value['tiktok']
  if (ttHistory && ttHistory.length > 0) {
    const latest = ttHistory[ttHistory.length - 1]
    return latest.totalViews
  }
  return tiktokStore.data?.analytics?.totalViews ?? 0
})
const tiktokPosts = computed(() => tiktokStore.data?.userInfo?.video_count ?? 0)

// Get Instagram totals - use history data for views (most accurate)
const instagramTotalViews = computed(() => {
  const igHistory = followerHistory.value['instagram-graph'] ?? followerHistory.value['instagram']
  if (igHistory && igHistory.length > 0) {
    const latest = igHistory[igHistory.length - 1]
    return latest.totalViews
  }
  return 0
})
const instagramPosts = computed(() => platformHealth.value.instagram?.postsThisWeek ?? 0)
</script>

<template>
  <DashboardLayout>
    <!-- Page Header -->
    <PageHeader
      title="Overview"
      subtitle="Your unified analytics command center."
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

    <!-- SECTION 1: Platform Cards (HERO) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <PlatformCard
        platform="tiktok"
        :data="platformHealth.tiktok"
        :total-views="tiktokTotalViews"
        :posts="tiktokPosts"
        :loading="isLoading"
      />
      <PlatformCard
        platform="instagram"
        :data="platformHealth.instagram"
        :total-views="instagramTotalViews"
        :posts="instagramPosts"
        :loading="isLoading"
      />
    </div>

    <!-- SECTION 2: Unified KPI Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <template v-if="isLoading">
        <StatCardSkeleton :count="5" />
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

    <div class="mb-8">
      <ViewsComparisonChart
        title="Views Comparison"
        subtitle="TikTok vs Instagram views"
        :follower-history="followerHistory"
      />
    </div>

    <!-- SECTION 3: Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <template v-if="isLoading">
        <ChartSkeleton />
        <ChartSkeleton />
      </template>
      <template v-else>
        <AudienceChart
          platform="all"
          title="Follower Comparison"
          subtitle="TikTok vs Instagram followers"
          :follower-history="followerHistory"
        />

        <EngagementComparisonChart
          title="Engagement Comparison"
          subtitle="TikTok vs Instagram likes"
          :follower-history="followerHistory"
        />
      </template>
    </div>

    <!-- Top Performing Content -->
    <ContentTableSkeleton v-if="isLoading" />
    <ContentTable v-else platform="all" :videos="topContent" />

    <!-- Export Modal -->
    <ExportReportModal :is-open="isExportModalOpen" @close="isExportModalOpen = false" />
  </DashboardLayout>
</template>
