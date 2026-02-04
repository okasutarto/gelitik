<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { Play, Share2, Clock, Eye } from 'lucide-vue-next'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import AudienceChart from '@/components/dashboard/AudienceChart.vue'
import ContentTable from '@/components/dashboard/ContentTable.vue'
import TerritoryPanel from '@/components/dashboard/TerritoryPanel.vue'
import DeviceTypePanel from '@/components/dashboard/DeviceTypePanel.vue'
import { usePlatformAnalytics } from '@/composables/usePlatformAnalytics'
import { useRouter } from 'vue-router'

const router = useRouter()
const { loading, accountData, fetchAnalytics } = usePlatformAnalytics('tiktok')

const tiktokStats = computed(() => {
  if (!accountData.value?.data.analytics) return []

  const analytics = accountData.value.data.analytics
  return [
    {
      title: 'Video Views',
      value: formatNumber(analytics.totalViews || 0),
      change: '24%',
      changeType: 'up' as const,
      icon: Play,
      subtitle: '+1.2M vs last week'
    },
    {
      title: 'Shares',
      value: formatNumber(analytics.totalShares || 0),
      change: '15%',
      changeType: 'up' as const,
      icon: Share2,
      subtitle: 'Viral velocity high'
    },
    {
      title: 'Total Likes',
      value: formatNumber(analytics.totalLikes || 0),
      change: '8.4%',
      changeType: 'up' as const,
      icon: Eye,
      subtitle: 'Watch time total'
    },
    {
      title: 'Engagement Rate',
      value: analytics.engagementRate.toFixed(2) + '%',
      change: '12%',
      changeType: 'up' as const,
      icon: Clock,
      subtitle: 'Retention rate'
    }
  ]
})

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

onMounted(() => {
  fetchAnalytics().catch((err) => {
    if ((err as any)?.response?.status === 404) {
      alert('TikTok account not connected. Please connect your account first.')
      router.push('/connections')
    }
  })
})

</script>

<template>
  <DashboardLayout>
    <!-- Page Header with Platform Color -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-1">
        <div class="size-2 rounded-full bg-slate-900 dark:bg-white" />
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">TikTok Analytics</h2>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Analyze your TikTok trends and reach.
      </p>
    </div>

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        v-for="stat in tiktokStats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :change="stat.change"
        :change-type="stat.changeType"
        :icon="stat.icon"
        :subtitle="stat.subtitle"
        platform="tiktok"
      />
    </div>

    <!-- Views Trend Chart -->
    <div class="mb-8">
      <AudienceChart
        platform="tiktok"
        title="Views Trend"
        subtitle="Video performance trajectory"
      />
    </div>

    <!-- TikTok-Specific Panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <TerritoryPanel />
      <DeviceTypePanel />
    </div>

    <!-- Top Performing Content -->
    <ContentTable platform="tiktok" />
  </DashboardLayout>
</template>
