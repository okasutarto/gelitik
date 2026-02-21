import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useTiktokStore } from './tiktokStore'
import { useInstagramStore } from './instagramStore'
import { formatNumber } from '@/utils/format'

export interface KpiCardData {
  label: string
  value: string
  rawValue: number
  delta: number
  deltaPercent: number
  deltaLabel: string
  icon: string
  positive: boolean
}

export interface PlatformSnapshot {
  platform: 'instagram' | 'tiktok'
  followers: number
  followerGrowth: number
  followerGrowthPercent: number
  engagementRate: number
  postsThisWeek: number
}

export const useDashboardStore = defineStore('dashboard', () => {
  const tiktokStore = useTiktokStore()
  const instagramStore = useInstagramStore()

  const isLoading = computed(() => tiktokStore.isLoading || instagramStore.isLoading)
  const error = computed(() => tiktokStore.error || instagramStore.error)

  // Aggregated KPI data
  const totalFollowers = computed(() => {
    const ig = instagramStore.data?.insights?.followers ?? 0
    const tt = tiktokStore.data?.analytics?.followers ?? 0
    return ig + tt
  })

  const totalEngagementRate = computed(() => {
    const igRate = instagramStore.data?.insights
      ? instagramStore.data.insights.totalInteractions > 0 && instagramStore.data.insights.reach > 0
        ? (instagramStore.data.insights.totalInteractions / instagramStore.data.insights.reach) * 100
        : 0
      : 0
    const ttRate = tiktokStore.data?.analytics?.engagementRate ?? 0
    const count = (igRate > 0 ? 1 : 0) + (ttRate > 0 ? 1 : 0)
    return count > 0 ? (igRate + ttRate) / count : 0
  })

  const totalPosts = computed(() => {
    const igPosts = instagramStore.data?.insights?.mediaCount ?? 0
    const ttPosts = tiktokStore.data?.userInfo?.video_count ?? 0
    return igPosts + ttPosts
  })

  const totalViews = computed(() => {
    const igImpressions = instagramStore.data?.insights?.impressions ?? 0
    const ttViews = tiktokStore.data?.analytics?.totalViews ?? 0
    return igImpressions + ttViews
  })

  // Platform health snapshots
  const instagramHealth = computed<PlatformSnapshot | null>(() => {
    if (!instagramStore.data?.insights) return null
    const insights = instagramStore.data.insights
    return {
      platform: 'instagram',
      followers: insights.followers,
      followerGrowth: 0, // Requires historical data
      followerGrowthPercent: 0,
      engagementRate: insights.reach > 0
        ? (insights.totalInteractions / insights.reach) * 100
        : 0,
      postsThisWeek: 0, // Requires time-based filtering
    }
  })

  const tiktokHealth = computed<PlatformSnapshot | null>(() => {
    if (!tiktokStore.data?.analytics) return null
    const analytics = tiktokStore.data.analytics
    return {
      platform: 'tiktok',
      followers: analytics.followers,
      followerGrowth: 0,
      followerGrowthPercent: 0,
      engagementRate: analytics.engagementRate,
      postsThisWeek: 0,
    }
  })

  // Combined top content from both platforms
  const topContent = computed(() => {
    const igMedia = (instagramStore.data?.media ?? []).map((m: Record<string, unknown>) => ({
      ...m,
      _platform: 'instagram' as const,
    }))
    const ttVideos = (tiktokStore.data?.videos ?? []).map((v: Record<string, unknown>) => ({
      ...v,
      _platform: 'tiktok' as const,
    }))

    return [...igMedia, ...ttVideos]
      .sort((a, b) => {
        const aViews = (a.view_count as number) ?? (a.impressions as number) ?? 0
        const bViews = (b.view_count as number) ?? (b.impressions as number) ?? 0
        return bViews - aViews
      })
      .slice(0, 10)
  })

  // Formatted KPI summaries
  const kpiSummary = computed(() => ({
    totalFollowers: formatNumber(totalFollowers.value),
    totalEngagementRate: totalEngagementRate.value.toFixed(2) + '%',
    totalPosts: formatNumber(totalPosts.value),
    totalViews: formatNumber(totalViews.value),
  }))

  // Fetch all data
  async function fetchAll() {
    await Promise.all([
      tiktokStore.fetch(),
      instagramStore.fetch(),
    ])
  }

  async function refreshAll() {
    await Promise.all([
      tiktokStore.refresh(),
      instagramStore.refresh(),
    ])
  }

  function clearAll() {
    tiktokStore.clear()
    instagramStore.clear()
  }

  return {
    isLoading,
    error,
    totalFollowers,
    totalEngagementRate,
    totalPosts,
    totalViews,
    instagramHealth,
    tiktokHealth,
    topContent,
    kpiSummary,
    fetchAll,
    refreshAll,
    clearAll,
  }
})
