<script setup lang="ts">
import { Users, Heart, FileText, MousePointerClick } from 'lucide-vue-next'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import AudienceChart from '@/components/dashboard/AudienceChart.vue'
import ContentTable from '@/components/dashboard/ContentTable.vue'

// Overview stats combining all platforms
const overviewStats = [
  {
    title: 'Total Audience',
    value: '1.8M',
    change: '12%',
    changeType: 'up' as const,
    icon: Users,
    subtitle: '+24k this week'
  },
  {
    title: 'Total Engagement',
    value: '8.2%',
    change: '5.4%',
    changeType: 'up' as const,
    icon: Heart,
    subtitle: 'Avg. across platforms'
  },
  {
    title: 'Total Posts',
    value: '1,240',
    change: '2.1%',
    changeType: 'down' as const,
    icon: FileText,
    subtitle: 'Published YTD'
  },
  {
    title: 'Link Clicks',
    value: '8,902',
    change: '18%',
    changeType: 'up' as const,
    icon: MousePointerClick,
    subtitle: 'Across all bios'
  }
]
</script>

<template>
  <DashboardLayout>
    <!-- Page Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Welcome back to your master dashboard.
      </p>
    </div>

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        v-for="stat in overviewStats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :change="stat.change"
        :change-type="stat.changeType"
        :icon="stat.icon"
        :subtitle="stat.subtitle"
        platform="all"
      />
    </div>

    <!-- Audience Growth Chart -->
    <div class="mb-8">
      <AudienceChart
        platform="all"
        title="Audience Growth"
        subtitle="Combined performance over last 7 days"
      />
    </div>

    <!-- Top Performing Content -->
    <ContentTable platform="all" />
  </DashboardLayout>
</template>
