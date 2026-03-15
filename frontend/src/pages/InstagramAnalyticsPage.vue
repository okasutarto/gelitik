<script setup lang="ts">
import { onMounted, computed, ref, type Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  Heart,
  Info,
  Download,
  TrendingUp,
  Users,
  Globe,
  Play,
  MessageCircle,
  Bookmark,
  Share2,
  Activity
} from 'lucide-vue-next'
import { formatNumber } from '@/utils/format'
import PlatformAnalyticsLayout from '@/components/layout/PlatformAnalyticsLayout.vue'
import ExportReportModal from '@/components/dashboard/reports/ExportReportModal.vue'
import StatCard from '@/components/dashboard/cards/StatCard.vue'
import StatCardSkeleton from '@/components/loading/StatCardSkeleton.vue'
import ContentTable from '@/components/dashboard/content/ContentTable.vue'
import GenderSplitPanel from '@/components/dashboard/demographics/GenderSplitPanel.vue'
import TopCitiesPanel from '@/components/dashboard/demographics/TopCitiesPanel.vue'
import AgeRangePanel from '@/components/dashboard/demographics/AgeRangePanel.vue'
import ContentFormatBreakdown from '@/components/dashboard/content/ContentFormatBreakdown.vue'
import AudienceChart from '@/components/dashboard/charts/AudienceChart.vue'
import EngagementChart from '@/components/dashboard/charts/EngagementChart.vue'
import ViewsChart from '@/components/dashboard/charts/ViewsChart.vue'

import ChartSkeleton from '@/components/loading/ChartSkeleton.vue'
import ContentTableSkeleton from '@/components/loading/ContentTableSkeleton.vue'
import { usePlatformAnalytics } from '@/composables/usePlatformAnalytics'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useRouter } from 'vue-router'

import { useToast } from '@/composables/useToast'
import DateRangeFilter from '@/components/dashboard/DateRangeFilter.vue'
import type { AxiosError } from 'axios'

// ========== TypeScript Interfaces ==========
interface DailyEngagementPoint {
  date: string
  likes: number
  comments: number
  shares: number
  saves: number
}

interface AccountActivity {
  reach: number
  impressions: number
  profileViews: number
  websiteClicks: number
}

interface InstagramStat {
  title: string
  value: string | number
  icon?: Component
  subtitle?: string
  subMetric?: string
  suffix?: string
  delta?: number
  deltaPercent?: number
  deltaLabel?: string
}

// Instagram Graph API insights response type
interface InstagramInsights {
  followers?: number
  totalLikes?: number
  totalComments?: number
  totalShares?: number
  totalSaves?: number
  totalViews?: number
  engagementRate?: number
  accountActivity?: Record<string, unknown>
  demographics?: unknown
  dailyViews?: { date: string; views?: number }[]
  dailyEngagement?: DailyEngagementPoint[]
  dailyFollowers?: { date: string; followers?: number }[]
  media?: unknown[]
  timeframe?: string
  firstSnapshotDate?: string
}

// Unified API response type
interface UnifiedApiResponse {
  data?: {
    profile?: unknown
    insights?: InstagramInsights
    media?: unknown[]
  }
  // TikTok/other platform format
  userInfo?: unknown
  videos?: unknown[]
  analytics?: unknown
}

// Helper function for Meta API metric extraction
function getMetricValue(arr: unknown[], metric: string): number {
  if (!Array.isArray(arr)) return 0
  const found = arr.find((m: unknown) => (m as { name?: string }).name === metric)
  const val = found as { values?: { value: number }[]; total_value?: number } | undefined
  return val?.values?.[0]?.value ?? val?.total_value ?? 0
}

// Metric name constants
const METRICS = {
  REACH: 'reach',
  IMPRESSIONS: 'impressions',
  PROFILE_VIEWS: 'profile_views',
  WEBSITE_CLICKS: 'website_clicks'
} as const

// Compute delta between oldest and newest snapshot for a given metric
function getIgSnapshotDelta(
  metric:
    | 'followers'
    | 'totalViews'
    | 'totalLikes'
    | 'totalComments'
    | 'totalShares'
    | 'engagementRate'
) {
  const entries = instagramHistory.value
  if (!entries || entries.length < 2) return undefined
  const oldest = entries[0][metric]
  const newest = entries[entries.length - 1][metric]
  const delta = newest - oldest
  const percent = oldest > 0 ? (delta / oldest) * 100 : 0
  return { delta, percent }
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const dashboardStore = useDashboardStore()

// Determine platform from route path - supports both instagram and instagram-graph
const platform = computed(() => {
  const path = route.path
  if (path.includes('instagram-graph')) return 'instagram-graph'
  return 'instagram'
})

const { loading, accountData, fetchAnalytics } = usePlatformAnalytics(platform.value)

// Determine if we're using Instagram Graph API
const isGraphApi = computed(() => platform.value === 'instagram-graph')

// Timeframe Filter State
const isExportModalOpen = ref(false)
const selectedTimeframe = ref('7d')

// Parse timeframe value (e.g., '7d' -> 7)
const parseTimeframeValue = (value: string): number => {
  return parseInt(value.replace('d', ''), 10) || 7
}

const lastUpdated = ref<Date | null>(null)

const fetchData = () => {
  Promise.all([
    fetchAnalytics(selectedTimeframe.value),
    dashboardStore.fetchHistory(parseTimeframeValue(selectedTimeframe.value), platform.value)
  ])
    .then(() => {
      lastUpdated.value = new Date()
    })
    .catch((err: unknown) => {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 404) {
        toast.error('Instagram account not connected. Please connect your account first.')
        router.push('/connections')
      }
    })
}

async function handleRefresh() {
  await fetchData()
}

// Get user profile data - map to UserProfile expected format

const userInfo = computed(() => {
  const data = accountData.value?.data as any // Assert as any to bypass static type issues for now
  if (!data) return null

  if (isGraphApi.value && data.profile) {
    return {
      id: data.profile.id || '',
      name: data.profile.name || data.profile.username,
      avatar_url: data.profile.profile_picture_url,
      bio: data.profile.biography || '',
      is_verified: false,
      followers_count: data.profile.followers_count || data.insights?.followers || 0,
      following_count: data.profile.follows_count || data.insights?.following || 0,
      likes_count: data.insights?.totalInteractions || 0,
      videos_count: data.insights?.mediaCount || data.profile?.media_count || 0
    }
  }

  return null
})

// Get media count for calculating averages
const mediaCount = computed(() => {
  const info = userInfo.value
  return info?.videos_count || 0
})

// Get media/videos for content table
const media = computed(() => {
  const data = accountData.value?.data as any
  if (!data) return []

  // For Instagram Graph API, media is in data.insights.media
  if (isGraphApi.value && data.insights?.media) {
    return Array.isArray(data.insights.media) ? data.insights.media : []
  }

  // For regular Instagram API, media is in data.media
  if (data.media) {
    return Array.isArray(data.media) ? data.media : []
  }

  // Handle standard internal format if needed
  return Array.isArray(data.videos)
    ? data.videos.map((m: any) => ({
        id: m.id,
        title: m.caption || 'Untitled',
        cover_image_url: m.thumbnail_url || m.media_url,
        create_time: m.timestamp ? new Date(m.timestamp).getTime() / 1000 : 0,
        // The frontend ContentTable expects view_count, likes, comments, shares, saves
        view_count:
          m.media_type === 'VIDEO' || m.media_product_type === 'REELS'
            ? m.video_views || m.views || m.reach || 0
            : m.views || m.reach || 0,
        like_count: m.like_count || 0,
        comment_count: m.comment_count || 0,
        share_count: m.share_count || 0,
        saves: m.save_count || 0,
        media_type: m.media_type || 'IMAGE',
        media_product_type: m.media_product_type || null,
        duration: m.media_type === 'VIDEO' ? 0 : undefined // Duration only for videos
      }))
    : []
})

// Determine content formats from media
const contentFormats = computed(() => {
  const vids = media.value
  if (!vids.length) return []

  const formats = vids.reduce((acc: any, t: any) => {
    // Map Meta API types or fallback to internal types
    const type = t.media_product_type === 'REELS' ? 'REELS' : t.media_type || 'IMAGE'
    if (!acc[type]) {
      acc[type] = { type, count: 0, totalReach: 0, totalEng: 0 }
    }
    acc[type].count += 1
    acc[type].totalReach += t.view_count || 0
    acc[type].totalEng +=
      (t.like_count || 0) + (t.comment_count || 0) + (t.share_count || 0) + (t.saves || 0)
    return acc
  }, {})

  return Object.values(formats).map((f: any) => ({
    type: f.type,
    count: f.count,
    avgReach: f.count > 0 ? f.totalReach / f.count : 0,
    avgEngagement: f.count > 0 ? f.totalEng / f.count : 0
  }))
})

// Get Instagram history from database (for charts)
const instagramHistory = computed(() => {
  const history =
    dashboardStore.followerHistory['instagram-graph'] ||
    dashboardStore.followerHistory['instagram'] ||
    []
  return history
})

// Historical Data for Views Chart (from Analytics DB snapshots)
const viewsHistory = computed(() => {
  const history = instagramHistory.value as any[]
  if (!history || history.length === 0) {
    return { views: [] }
  }
  const views = history.map((h: any) => ({ date: h.date, value: h.totalViews ?? 0 }))
  return { views }
})

// Historical Data for EngagementChart (from Analytics DB snapshots)
const engagementHistory = computed(() => {
  const history = instagramHistory.value as any[]
  if (!history || history.length === 0) {
    return { likes: [], comments: [], shares: [], saves: [], views: [], engagementRate: [] }
  }

  const likes = history.map((h: any) => ({ date: h.date, value: h.totalLikes ?? 0 }))
  const comments = history.map((h: any) => ({ date: h.date, value: h.totalComments ?? 0 }))
  const shares = history.map((h: any) => ({ date: h.date, value: h.totalShares ?? 0 }))
  const saves = history.map((h: any) => ({ date: h.date, value: h.totalSaves ?? 0 }))
  const views = history.map((h: any) => ({ date: h.date, value: h.totalViews ?? 0 }))

  const engagementRate = history.map((h: any) => ({
    date: h.date,
    value: h.engagementRate.toFixed(2) ?? 0
  }))

  return { likes, comments, shares, saves, views, engagementRate }
})

// Historical Data for AudienceChart (from Analytics DB snapshots)
const instagramAudienceData = computed(() => {
  const history = instagramHistory.value as any[]
  if (!history || history.length === 0) return undefined
  return {
    followers: history.map((h: any) => ({ date: h.date, value: h.followers }))
  }
})

// Account Activity - live Meta API (always last 30 days)
const accountActivity = computed((): AccountActivity | null => {
  const insights = (accountData.value as UnifiedApiResponse)?.data?.insights
  if (!insights?.accountActivity) return null

  const aa = insights.accountActivity as Record<string, unknown>

  // Use nullish coalescing instead of || to handle 0 values correctly
  // API returns camelCase (profileViews, websiteClicks) but we also check snake_case for compatibility
  const reach =
    aa.reach != null
      ? Number(aa.reach)
      : getMetricValue(aa[METRICS.REACH] as unknown[], METRICS.REACH)
  const impressions =
    aa.impressions != null
      ? Number(aa.impressions)
      : getMetricValue(aa[METRICS.IMPRESSIONS] as unknown[], METRICS.IMPRESSIONS)
  const profileViews =
    (aa.profileViews != null ? Number(aa.profileViews) : 0) ||
    (aa.profile_views != null ? Number(aa.profile_views) : 0) ||
    getMetricValue(aa[METRICS.PROFILE_VIEWS] as unknown[], METRICS.PROFILE_VIEWS)
  const websiteClicks =
    (aa.websiteClicks != null ? Number(aa.websiteClicks) : 0) ||
    (aa.website_clicks != null ? Number(aa.website_clicks) : 0) ||
    getMetricValue(aa[METRICS.WEBSITE_CLICKS] as unknown[], METRICS.WEBSITE_CLICKS)

  return {
    reach: reach || 0,
    impressions: impressions || 0,
    profileViews: profileViews || 0,
    websiteClicks: websiteClicks || 0
  }
})

// Combined chart data - use history from dashboardStore (more reliable)
const combinedViewsHistory = computed(() => {
  // Use viewsHistory which comes from dashboardStore followerHistory
  return viewsHistory.value
})

const combinedEngagementHistory = computed(() => {
  // Use engagementHistory which comes from dashboardStore followerHistory
  return engagementHistory.value
})

const combinedAudienceData = computed(() => {
  // Use instagramAudienceData which comes from dashboardStore followerHistory
  return instagramAudienceData.value
})

// Instagram stats cards - calculated from period-filtered daily data
const instagramStats = computed((): InstagramStat[] => {
  const history = instagramHistory.value

  // The DB stores CUMULATIVE values, so we use the LATEST value for each metric
  // and calculate the PERIOD GROWTH (difference between latest and oldest in period)
  const days = parseInt(selectedTimeframe.value) || 7
  const filteredHistory = history.slice(-days)

  // Get the latest (most recent) snapshot - this has cumulative values
  const latestSnapshot =
    filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1] : null
  const oldestSnapshot = filteredHistory.length > 0 ? filteredHistory[0] : null

  // Use cumulative values from latest snapshot
  const totalLikes = latestSnapshot?.totalLikes || 0
  const totalComments = latestSnapshot?.totalComments || 0
  const totalShares = latestSnapshot?.totalShares || 0
  const totalSaves = (latestSnapshot as any)?.totalSaves || 0
  const totalViews = latestSnapshot?.totalViews || 0
  const currentFollowers = latestSnapshot?.followers || 0

  // Calculate period growth (difference between latest and oldest in period)
  const periodGrowthLikes =
    latestSnapshot && oldestSnapshot
      ? (latestSnapshot.totalLikes || 0) - (oldestSnapshot.totalLikes || 0)
      : 0
  const periodGrowthComments =
    latestSnapshot && oldestSnapshot
      ? (latestSnapshot.totalComments || 0) - (oldestSnapshot.totalComments || 0)
      : 0
  const periodGrowthShares =
    latestSnapshot && oldestSnapshot
      ? (latestSnapshot.totalShares || 0) - (oldestSnapshot.totalShares || 0)
      : 0
  const periodGrowthSaves =
    latestSnapshot && oldestSnapshot
      ? ((latestSnapshot as any).totalSaves || 0) - ((oldestSnapshot as any).totalSaves || 0)
      : 0
  const periodGrowthViews =
    latestSnapshot && oldestSnapshot
      ? (latestSnapshot.totalViews || 0) - (oldestSnapshot.totalViews || 0)
      : 0

  // Calculate engagement rate using the same formula as the backend
  // (Total Engagement / Total Views) * 100
  const totalEngagement = totalLikes + totalComments + totalShares + totalSaves
  const periodEngagement = latestSnapshot?.engagementRate || (totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0)

  // Get delta from full history for followers (for comparison against first record)
  const followersDelta = getIgSnapshotDelta('followers')
  const engagementDelta = getIgSnapshotDelta('engagementRate')
  const deltaLabel = 'vs. first record'

  // Calculate average per post for subMetric
  const postCount = mediaCount.value
  const avgLabel = (total: number) =>
    postCount > 0 ? `Avg. ${formatNumber(Math.round(total / postCount))} per post` : undefined

  // Return 7 stats cards with period-filtered data
  return [
    {
      title: 'Followers',
      value: currentFollowers,
      icon: Users,
      subtitle: 'Total followers',
      delta: followersDelta?.delta,
      deltaPercent: followersDelta?.percent,
      deltaLabel: followersDelta ? deltaLabel : undefined
    },
    {
      title: 'Views',
      value: totalViews,
      icon: Play,
      subtitle: 'Total across all contents',
      subMetric: avgLabel(totalViews),
      delta: periodGrowthViews,
      deltaPercent:
        latestSnapshot && oldestSnapshot && oldestSnapshot.totalViews
          ? (periodGrowthViews / oldestSnapshot.totalViews) * 100
          : undefined,
      deltaLabel: 'vs. first record'
    },
    {
      title: 'Engagement Rate',
      value: periodEngagement.toFixed(2),
      suffix: '%',
      icon: Activity,
      subtitle: 'Interactions / views',
      delta: engagementDelta ? parseFloat(engagementDelta.delta.toFixed(2)) : undefined,
      deltaPercent: engagementDelta?.percent,
      deltaLabel: engagementDelta ? deltaLabel : undefined
    },
    {
      title: 'Likes',
      value: totalLikes,
      icon: Heart,
      subtitle: 'Total content likes',
      subMetric: avgLabel(totalLikes),
      delta: periodGrowthLikes,
      deltaPercent:
        latestSnapshot && oldestSnapshot && oldestSnapshot.totalLikes
          ? (periodGrowthLikes / oldestSnapshot.totalLikes) * 100
          : undefined,
      deltaLabel: 'vs. first record'
    },
    {
      title: 'Comments',
      value: totalComments,
      icon: MessageCircle,
      subtitle: 'Total comments received',
      subMetric: avgLabel(totalComments),
      delta: periodGrowthComments,
      deltaPercent:
        latestSnapshot && oldestSnapshot && oldestSnapshot.totalComments
          ? (periodGrowthComments / oldestSnapshot.totalComments) * 100
          : undefined,
      deltaLabel: 'vs. first record'
    },
    {
      title: 'Shares',
      value: totalShares,
      icon: Share2,
      subtitle: 'Total content shares',
      subMetric: avgLabel(totalShares),
      delta: periodGrowthShares,
      deltaPercent:
        latestSnapshot && oldestSnapshot && oldestSnapshot.totalShares
          ? (periodGrowthShares / oldestSnapshot.totalShares) * 100
          : undefined,
      deltaLabel: 'vs. first record'
    },
    {
      title: 'Saves',
      value: totalSaves,
      icon: Bookmark,
      subtitle: 'Total content saves',
      subMetric: avgLabel(totalSaves),
      delta: periodGrowthSaves,
      deltaPercent:
        latestSnapshot && oldestSnapshot && (oldestSnapshot as any).totalSaves
          ? (periodGrowthSaves / ((oldestSnapshot as any).totalSaves || 1)) * 100
          : undefined,
      deltaLabel: 'vs. first record'
    }
  ]
})

// Data availability tracking
const hasAccountActivity = computed(() => !!accountActivity.value)

// Account Activity cards (always last 30 days)
const accountActivityCards = computed(() => {
  const aa = accountActivity.value
  if (!aa) return []

  return [
    {
      title: 'Reach',
      value: aa.reach,
      subtitle: 'Accounts reached',
      description: 'Number of unique accounts that saw your content.',
      icon: TrendingUp
    },
    {
      title: 'Profile Visits',
      value: aa.profileViews,
      subtitle: 'Profile views',
      description: 'Number of times people visited your profile.',
      icon: Users
    },
    {
      title: 'Website Clicks',
      value: aa.websiteClicks,
      subtitle: 'Link taps',
      description: 'Number of clicks on links in your profile.',
      icon: Globe
    }
  ]
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <PlatformAnalyticsLayout
    title="Instagram Insights"
    subtitle="Deep dive into your Instagram performance."
    :loading="loading"
    :last-updated="lastUpdated"
    :user-info="userInfo"
    @refresh="handleRefresh"
  >
    <!-- Action Row Slot -->
    <template #actions>
      <button
        type="button"
        @click="isExportModalOpen = true"
        class="flex items-center gap-2 bg-neo-accent dark:bg-hotpink text-black px-4 py-2 border-3 border-black dark:border-electric font-black brutal-hover-lift group shadow-brutal-sm uppercase tracking-wider text-sm"
      >
        <Download :size="18" class="stroke-[3]" />
        Export
      </button>

      <DateRangeFilter
        v-model="selectedTimeframe"
        :loading="loading"
        @update:model-value="fetchData"
      />
    </template>

    <!-- Stat Cards: Row 1 - 4 cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 my-8">
      <template v-if="loading">
        <StatCardSkeleton :count="3" />
      </template>
      <template v-else>
        <StatCard
          v-for="stat in instagramStats.slice(0, 3)"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :subtitle="stat.subtitle"
          :sub-metric="stat.subMetric"
          :delta="stat.delta"
          :delta-percent="stat.deltaPercent"
          :delta-label="stat.deltaLabel"
        />
      </template>
    </div>

    <!-- Stat Cards: Row 2 - 3 cards (full width) -->
    <div class="grid grid-cols-4 gap-4 mb-8">
      <template v-if="loading">
        <StatCardSkeleton :count="4" />
      </template>
      <template v-else>
        <StatCard
          v-for="stat in instagramStats.slice(3)"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :subtitle="stat.subtitle"
          :sub-metric="stat.subMetric"
          :delta="stat.delta"
          :delta-percent="stat.deltaPercent"
          :delta-label="stat.deltaLabel"
        />
      </template>
    </div>

    <!-- Account Activity Section (Live Meta API - Always Last 30 Days) -->
    <div class="mb-8">
      <!-- Section Header -->
      <div v-if="!loading && hasAccountActivity" class="flex items-center justify-start mb-4">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Account Activity
          </h2>
          <!-- Info tooltip -->
          <div class="relative group flex items-center">
            <button
              class="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              aria-label="Account activity info"
            >
              <Info :size="18" />
            </button>
            <div
              class="absolute left-0 top-full mt-2 w-72 p-4 bg-white dark:bg-slate-800 border-2 border-black dark:border-electric shadow-brutal z-50 text-sm text-slate-600 dark:text-slate-300 font-medium transition-opacity duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible"
            >
              These metrics are provided by Meta for the last 30 days only and are not affected by
              the date filter above.
            </div>
          </div>
          <span
            class="px-3 py-1 text-xs font-bold bg-neo-accent dark:bg-hotpink text-black border-2 border-black dark:border-electric"
          >
            Last 30 Days
          </span>
        </div>
      </div>

      <!-- Account Activity Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <template v-if="loading">
          <StatCardSkeleton :count="3" />
        </template>
        <template v-else>
          <StatCard
            v-for="card in accountActivityCards"
            :key="card.title"
            :title="card.title"
            :value="card.value"
            :icon="card.icon"
            :subtitle="card.subtitle"
          />
        </template>
      </div>
    </div>

    <!-- Charts Row -->
    <!-- Views Chart -->
    <div class="mb-8">
      <ChartSkeleton v-if="loading" />
      <ViewsChart
        v-else
        title="Views Over Time"
        subtitle="Daily content views"
        :historical-data="combinedViewsHistory"
      />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
      <!-- Audience Growth Chart -->
      <div>
        <ChartSkeleton v-if="loading" />
        <template v-else>
          <AudienceChart
            platform="instagram"
            title="Follower Net Growth"
            subtitle="Instagram specific growth metrics"
            :historical-data="combinedAudienceData"
          />
        </template>
      </div>

      <!-- Engagement Over Time Chart -->
      <div>
        <ChartSkeleton v-if="loading" />
        <template v-else>
          <EngagementChart
            title="Engagement Over Time"
            subtitle="Daily likes, comments, shares &amp; saves"
            :historical-data="combinedEngagementHistory"
            :platform="platform"
          />
        </template>
      </div>
    </div>

    <!-- Demographics row -->
    <div
      class="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-8 border border-slate-200 dark:border-slate-800"
    >
      <template v-if="loading">
        <StatCardSkeleton :count="4" />
      </template>
      <template v-else>
        <ContentFormatBreakdown :formats="contentFormats" :loading="loading" />
        <GenderSplitPanel
          :data="(accountData?.data as any).insights.demographics.gender"
          :loading="loading"
        />
        <TopCitiesPanel
          :data="(accountData?.data as any).insights.demographics.cities"
          :loading="loading"
        />
        <AgeRangePanel
          :data="(accountData?.data as any).insights.demographics.age"
          :loading="loading"
        />
      </template>
    </div>

    <!-- Top Performing Content -->
    <ContentTableSkeleton v-if="loading" />
    <ContentTable v-else-if="accountData?.data" :platform="'instagram' as any" :videos="media" />

    <!-- Export Modal -->
    <ExportReportModal
      :is-open="isExportModalOpen"
      default-platform="instagram"
      @close="isExportModalOpen = false"
    />
  </PlatformAnalyticsLayout>
</template>
