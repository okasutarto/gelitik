<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { Play, Share2, Heart, MessageCircle, Activity, Users } from 'lucide-vue-next'

import { useDashboardStore } from '@/stores/dashboardStore'
import DateRangeFilter from '@/components/dashboard/DateRangeFilter.vue'

import PlatformAnalyticsLayout from '@/components/layout/PlatformAnalyticsLayout.vue'
import ExportReportModal from '@/components/dashboard/reports/ExportReportModal.vue'
import StatCard from '@/components/dashboard/cards/StatCard.vue'
import ContentTable from '@/components/dashboard/content/ContentTable.vue'
import StatCardSkeleton from '@/components/loading/StatCardSkeleton.vue'
import ChartSkeleton from '@/components/loading/ChartSkeleton.vue'
import AudienceChart from '@/components/dashboard/charts/AudienceChart.vue'
import ContentTableSkeleton from '@/components/loading/ContentTableSkeleton.vue'
import { usePlatformAnalytics } from '@/composables/usePlatformAnalytics'
import { useRouter } from 'vue-router'
import { formatNumber } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import type { AxiosError } from 'axios'
import type { Video } from '@/types/video'

import EngagementChart from '@/components/dashboard/charts/EngagementChart.vue'
import ViewsChart from '@/components/dashboard/charts/ViewsChart.vue'

const router = useRouter()
const toast = useToast()
const { loading, accountData, fetchAnalytics } = usePlatformAnalytics('tiktok')
const dashboardStore = useDashboardStore()

const isExportModalOpen = ref(false)
const selectedTimeframe = ref('7d')

// Parse timeframe value (e.g., '7d' -> 7)
const parseTimeframeValue = (value: string): number => {
  return parseInt(value.replace('d', ''), 10) || 7
}

const lastUpdated = ref<Date | null>(null)

async function handleRefresh() {
  await Promise.all([
    fetchAnalytics(),
    dashboardStore.fetchHistory(parseTimeframeValue(selectedTimeframe.value))
  ])
  lastUpdated.value = new Date()
}

const userData = computed(() => {
  const info = accountData.value?.data?.userInfo as any
  if (!info) return null
  return {
    id: info.open_id || '',
    name: info.display_name || '',
    avatar_url: info.avatar_url || '',
    followers_count: info.follower_count || 0,
    following_count: info.following_count || 0,
    likes_count: info.likes_count || 0,
    videos_count: info.video_count || 0,
    bio: info.bio_description || '',
    is_verified: info.is_verified || false
  }
})
const videos = computed<Video[]>(() => (accountData.value?.data?.videos as Video[]) || [])

// Compute delta between oldest and newest snapshot for a given metric
function getSnapshotDelta(
  metric:
    | 'followers'
    | 'totalViews'
    | 'totalLikes'
    | 'totalComments'
    | 'totalShares'
    | 'engagementRate'
) {
  const entries = dashboardStore.followerHistory?.tiktok
  if (!entries || entries.length < 2) return undefined
  const oldest = entries[0][metric]
  const newest = entries[entries.length - 1][metric]
  const delta = newest - oldest
  const percent = oldest > 0 ? (delta / oldest) * 100 : 0
  return { delta, percent }
}

const tiktokStats = computed(() => {
  if (!userData.value) return []
  const vids = videos.value
  const vidCount = vids.length
  const totalViews = vids.reduce((sum, v) => sum + (v.view_count || 0), 0)
  const totalLikes = userData.value?.likes_count || 0
  const totalShares = vids.reduce((sum, v) => sum + (v.share_count || 0), 0)
  const totalComments = vids.reduce((sum, v) => sum + (v.comment_count || 0), 0)
  const totalEngagement = totalLikes + totalComments + totalShares
  const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0

  const followersDelta = getSnapshotDelta('followers')
  const viewsDelta = getSnapshotDelta('totalViews')
  const likesDelta = getSnapshotDelta('totalLikes')
  const commentsDelta = getSnapshotDelta('totalComments')
  const sharesDelta = getSnapshotDelta('totalShares')
  const engagementDelta = getSnapshotDelta('engagementRate')

  const deltaLabel = 'vs. first record'
  const avgLabel = (total: number) =>
    vidCount > 0 ? `Avg. ${formatNumber(Math.round(total / vidCount))} per video` : undefined

  return [
    {
      title: 'Followers',
      value: userData.value?.followers_count || 0,
      icon: Users,
      subtitle: 'Total followers',
      delta: followersDelta?.delta,
      deltaPercent: followersDelta?.percent,
      deltaLabel: followersDelta ? deltaLabel : undefined
    },
    {
      title: 'Video Views',
      value: totalViews,
      icon: Play,
      subtitle: 'Total across all contents',
      subMetric: avgLabel(totalViews),
      delta: viewsDelta?.delta,
      deltaPercent: viewsDelta?.percent,
      deltaLabel: viewsDelta ? deltaLabel : undefined
    },
    {
      title: 'Total Likes',
      value: totalLikes,
      icon: Heart,
      subtitle: 'Total content likes',
      subMetric: avgLabel(totalLikes),
      delta: likesDelta?.delta,
      deltaPercent: likesDelta?.percent,
      deltaLabel: likesDelta ? deltaLabel : undefined
    },
    {
      title: 'Comments',
      value: totalComments,
      icon: MessageCircle,
      subtitle: 'Total comments received',
      subMetric: avgLabel(totalComments),
      delta: commentsDelta?.delta,
      deltaPercent: commentsDelta?.percent,
      deltaLabel: commentsDelta ? deltaLabel : undefined
    },
    {
      title: 'Shares',
      value: totalShares,
      icon: Share2,
      subtitle: 'Total video shares',
      subMetric: avgLabel(totalShares),
      delta: sharesDelta?.delta,
      deltaPercent: sharesDelta?.percent,
      deltaLabel: sharesDelta ? deltaLabel : undefined
    },
    {
      title: 'Engagement Rate',
      value: engagementRate,
      suffix: '%',
      icon: Activity,
      subtitle: 'Interactions / views',
      delta: engagementDelta ? parseFloat(engagementDelta.delta.toFixed(2)) : undefined,
      deltaPercent: engagementDelta?.percent,
      deltaLabel: engagementDelta ? deltaLabel : undefined
    }
  ]
})

// Follower Growth Chart Data
const followerHistory = computed(() => dashboardStore.followerHistory?.tiktok || [])

// Audience data for AudienceChart (convert to historicalData format)
const tiktokAudienceData = computed(() => {
  const history = followerHistory.value
  if (!history || history.length === 0) return undefined
  return {
    followers: history.map((h) => ({ date: h.date, value: h.followers }))
  }
})

// Historical Data for EngagementChart (from Analytics DB snapshots)
const engagementHistory = computed(() => {
  const history = followerHistory.value
  if (!history || history.length === 0) {
    return { likes: [], comments: [], shares: [], views: [], engagementRate: [] }
  }

  const likes = history.map((h) => ({ date: h.date, value: h.totalLikes ?? 0 }))
  const comments = history.map((h) => ({ date: h.date, value: h.totalComments ?? 0 }))
  const shares = history.map((h) => ({ date: h.date, value: h.totalShares ?? 0 }))
  const views = history.map((h) => ({ date: h.date, value: h.totalViews ?? 0 }))
  const engagementRate = history.map((h) => ({ date: h.date, value: h.engagementRate ?? 0 }))

  return { likes, comments, shares, views, engagementRate }
})

// Historical Data for Views Chart
const viewsHistory = computed(() => {
  const history = followerHistory.value
  if (!history || history.length === 0) {
    return { views: [] }
  }

  const views = history.map((h) => ({ date: h.date, value: h.totalViews ?? 0 }))
  return { views }
})

onMounted(() => {
  // Check for connection success message from OAuth callback
  const connectionSuccess = sessionStorage.getItem('connection-success')
  if (connectionSuccess === 'tiktok') {
    sessionStorage.removeItem('connection-success')
    toast.success('TikTok account connected successfully! You can now view your analytics.')
  }

  Promise.all([
    fetchAnalytics(),
    dashboardStore.fetchHistory(parseTimeframeValue(selectedTimeframe.value))
  ])
    .then(() => {
      lastUpdated.value = new Date()
    })
    .catch((err: unknown) => {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 404) {
        toast.error('TikTok account not connected. Please connect your account first.')
        router.push('/connections')
      }
    })
})
</script>

<template>
  <PlatformAnalyticsLayout
    title="TikTok Insights"
    subtitle="Analyze your TikTok trends and reach."
    :loading="loading"
    :last-updated="lastUpdated"
    :user-info="userData"
    @refresh="handleRefresh"
  >
    <!-- Action Row Slot -->
    <template #actions>
      <button
        type="button"
        @click="isExportModalOpen = true"
        class="flex items-center gap-2 bg-neo-accent dark:bg-hotpink text-black px-4 py-2 border-3 border-black dark:border-electric font-black brutal-hover-lift group shadow-brutal-sm uppercase tracking-wider text-sm"
      >
        <span class="font-black">Export</span>
      </button>

      <DateRangeFilter
        v-model="selectedTimeframe"
        :loading="loading"
        @update:model-value="handleRefresh"
      />
    </template>

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 my-8">
      <template v-if="loading">
        <StatCardSkeleton :count="6" />
      </template>
      <template v-else>
        <StatCard
          v-for="stat in tiktokStats"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :subtitle="stat.subtitle"
          :sub-metric="stat.subMetric"
          :delta="stat.delta"
          :delta-percent="stat.deltaPercent"
          :delta-label="stat.deltaLabel"
          :suffix="stat.suffix"
        />
      </template>
    </div>

    <!-- Views Chart -->
    <div class="mb-8">
      <ChartSkeleton v-if="loading" />
      <ViewsChart v-else :historical-data="viewsHistory" />
    </div>

    <!-- Charts Row: Audience & Engagement -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Follower Growth Chart -->
      <ChartSkeleton v-if="loading" />
      <AudienceChart
        v-else
        platform="tiktok"
        title="Audience Growth"
        subtitle="Daily follower snapshots"
        :historical-data="tiktokAudienceData"
      />
      <!-- Engagement Over Time -->
      <ChartSkeleton v-if="loading" />
      <EngagementChart
        v-else
        title="Engagement Over Time"
        subtitle="Daily likes, comments &amp; shares"
        :historical-data="engagementHistory"
        platform="tiktok"
      />
    </div>

    <ContentTableSkeleton v-if="loading" />
    <ContentTable v-else platform="tiktok" :videos="videos" />

    <!-- Export Modal -->
    <ExportReportModal
      :is-open="isExportModalOpen"
      default-platform="tiktok"
      @close="isExportModalOpen = false"
    />
  </PlatformAnalyticsLayout>
</template>
