<script setup lang="ts">
import { Eye, Users, UserPlus, Layers } from 'lucide-vue-next'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import AudienceChart from '@/components/dashboard/AudienceChart.vue'
import ContentTable from '@/components/dashboard/ContentTable.vue'
import TopCitiesPanel from '@/components/dashboard/TopCitiesPanel.vue'
import AgeRangePanel from '@/components/dashboard/AgeRangePanel.vue'

// Instagram-specific stats
const instagramStats = [
  {
    title: 'Impressions',
    value: '892K',
    change: '12%',
    changeType: 'up' as const,
    icon: Eye,
    subtitle: '+12% vs last week'
  },
  {
    title: 'Accounts Reached',
    value: '124K',
    change: '5%',
    changeType: 'up' as const,
    icon: Users,
    subtitle: '+5% new accounts'
  },
  {
    title: 'Profile Visits',
    value: '12.5K',
    change: '8.4%',
    changeType: 'up' as const,
    icon: UserPlus,
    subtitle: 'From bio link'
  },
  {
    title: 'Stories Reach',
    value: '45.2K',
    change: '18%',
    changeType: 'up' as const,
    icon: Layers,
    subtitle: 'Avg per story'
  }
]
</script>

<template>
  <DashboardLayout>
    <!-- Page Header with Platform Color -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-1">
        <div class="size-2 rounded-full bg-pink-500" />
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Instagram Insights</h2>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Deep dive into your Instagram performance.
      </p>
    </div>

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        v-for="stat in instagramStats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :change="stat.change"
        :change-type="stat.changeType"
        :icon="stat.icon"
        :subtitle="stat.subtitle"
        platform="instagram"
      />
    </div>

    <!-- Audience Growth Chart -->
    <div class="mb-8">
      <AudienceChart
        platform="instagram"
        title="Follower Net Growth"
        subtitle="Instagram specific growth metrics"
      />
    </div>

    <!-- Instagram-Specific Panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <TopCitiesPanel />
      <AgeRangePanel />
    </div>

    <!-- Top Performing Content -->
    <ContentTable platform="instagram" />
  </DashboardLayout>
</template>
