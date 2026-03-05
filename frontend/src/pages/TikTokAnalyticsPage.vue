<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { Play, Share2, Download, Heart, MessageCircle, Activity, Users } from 'lucide-vue-next'

import { useDashboardStore } from '@/stores/dashboardStore'

import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ExportReportModal from '@/components/dashboard/reports/ExportReportModal.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/dashboard/cards/StatCard.vue'
import UserProfile from '@/components/dashboard/profile/UserProfile.vue'
import ContentTable from '@/components/dashboard/content/ContentTable.vue'
import StatCardSkeleton from '@/components/loading/StatCardSkeleton.vue'
import UserProfileSkeleton from '@/components/loading/UserProfileSkeleton.vue'
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

const router = useRouter()
const toast = useToast()
const { loading, accountData, fetchAnalytics } = usePlatformAnalytics('tiktok')
const dashboardStore = useDashboardStore()

const isExportModalOpen = ref(false)
const lastUpdated = ref<Date | null>(null)

async function handleRefresh() {
  await Promise.all([fetchAnalytics(), dashboardStore.fetchHistory(30)])
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
  // Use profile likes_count - it's already the total (includes all video likes)
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
      value: formatNumber(userData.value?.followers_count || 0),
      icon: Users,
      subtitle: 'Total followers',
      delta: followersDelta?.delta,
      deltaPercent: followersDelta?.percent,
      deltaLabel: followersDelta ? deltaLabel : undefined
    },
    {
      title: 'Video Views',
      value: formatNumber(totalViews),
      icon: Play,
      subtitle: 'Total across all contents',
      subMetric: avgLabel(totalViews),
      delta: viewsDelta?.delta,
      deltaPercent: viewsDelta?.percent,
      deltaLabel: viewsDelta ? deltaLabel : undefined
    },
    {
      title: 'Total Likes',
      value: formatNumber(totalLikes),
      icon: Heart,
      subtitle: 'Total content likes',
      subMetric: avgLabel(totalLikes),
      delta: likesDelta?.delta,
      deltaPercent: likesDelta?.percent,
      deltaLabel: likesDelta ? deltaLabel : undefined
    },
    {
      title: 'Comments',
      value: formatNumber(totalComments),
      icon: MessageCircle,
      subtitle: 'Total comments received',
      subMetric: avgLabel(totalComments),
      delta: commentsDelta?.delta,
      deltaPercent: commentsDelta?.percent,
      deltaLabel: commentsDelta ? deltaLabel : undefined
    },
    {
      title: 'Shares',
      value: formatNumber(totalShares),
      icon: Share2,
      subtitle: 'Total video shares',
      subMetric: avgLabel(totalShares),
      delta: sharesDelta?.delta,
      deltaPercent: sharesDelta?.percent,
      deltaLabel: sharesDelta ? deltaLabel : undefined
    },
    {
      title: 'Engagement Rate',
      value: engagementRate.toFixed(2) + '%',
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
    return { likes: [], comments: [], views: [] }
  }

  const likes = history.map((h) => ({ date: h.date, value: h.totalLikes ?? 0 }))
  const comments = history.map((h) => ({ date: h.date, value: h.totalComments ?? 0 }))
  const views = history.map((h) => ({ date: h.date, value: h.totalViews ?? 0 }))

  return { likes, comments, views }
})

onMounted(() => {
  // Check for connection success message from OAuth callback
  const connectionSuccess = sessionStorage.getItem('connection-success')
  if (connectionSuccess === 'tiktok') {
    sessionStorage.removeItem('connection-success')
    toast.success('TikTok account connected successfully! You can now view your analytics.')
  }

  Promise.all([fetchAnalytics(), dashboardStore.fetchHistory(30)])
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
  <DashboardLayout>
    <!-- Page Header -->
    <PageHeader
      title="TikTok Insights"
      subtitle="Analyze your TikTok trends and reach."
      :last-updated="lastUpdated"
      :loading="loading"
      @refresh="handleRefresh"
    />

    <!-- User Profile -->
    <UserProfile v-if="!loading && userData" :user-info="userData" />
    <UserProfileSkeleton v-else-if="loading" />

    <!-- Action Row -->
    <div v-if="!loading" class="flex justify-end mt-6 mb-2 relative">
      <button
        @click="isExportModalOpen = true"
        class="flex items-center gap-2 bg-neo-accent dark:bg-hotpink text-black px-4 py-2 border-3 border-black dark:border-electric font-black brutal-hover-lift group shadow-brutal-sm uppercase tracking-wider text-sm"
      >
        <Download :size="18" class="stroke-[3]" />
        Export
      </button>
    </div>

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
        />
      </template>
    </div>

    <!-- Charts Row: Engagement Distribution & Reach vs Action -->
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
        subtitle="Daily total likes &amp; engagement rate"
        :historical-data="engagementHistory"
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
  </DashboardLayout>
</template>
