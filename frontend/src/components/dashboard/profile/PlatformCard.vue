<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, Users, Eye, Video, CheckCircle, XCircle, Loader2 } from 'lucide-vue-next'
import { formatNumber } from '@/utils/format'
import type { PlatformSnapshot } from '@/stores/dashboardStore'

interface Props {
  platform: 'tiktok' | 'instagram'
  data: PlatformSnapshot | null
  totalViews?: number
  posts?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  totalViews: 0,
  posts: 0,
  loading: false
})

const platformConfig = {
  tiktok: {
    name: 'TikTok',
    accentColor: 'electric',
    bgGradient: 'bg-electric',
    borderColor: 'border-electric',
    textColor: 'text-electric',
    bgColor: 'bg-electric',
    icon: '/icons/tiktok.svg'
  },
  instagram: {
    name: 'Instagram',
    accentColor: 'hotpink',
    bgGradient: 'bg-hotpink',
    borderColor: 'border-hotpink',
    textColor: 'text-hotpink',
    bgColor: 'bg-hotpink',
    icon: '/icons/instagram.svg'
  }
}

const config = computed(() => platformConfig[props.platform])
</script>

<template>
  <div
    class="brutal-card p-6 brutal-hover-lift relative overflow-hidden"
    :class="[
      `${config.bgGradient}`,
      'border-3',
      loading ? 'border-slate-300 dark:border-slate-600' : config.borderColor
    ]"
  >
    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-10"
    >
      <Loader2 class="animate-spin text-slate-400" :size="32" />
    </div>

    <!-- Platform Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 border-3 border-black dark:border-white flex items-center justify-center bg-white dark:bg-slate-800 shadow-brutal-sm"
        >
          <span class="font-black text-lg uppercase" :class="config.textColor">
            {{ platform === 'tiktok' ? 'TT' : 'IG' }}
          </span>
        </div>
        <div>
          <h3 class="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            {{ config.name }}
          </h3>
          <div class="flex items-center gap-1.5">
            <CheckCircle v-if="data" :size="14" class="text-emerald-500" />
            <XCircle v-else :size="14" class="text-red-500" />
            <span
              class="text-xs font-bold uppercase"
              :class="
                data ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              "
            >
              {{ data ? 'Connected' : 'Not Connected' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div v-if="data" class="grid grid-cols-2 gap-4">
      <!-- Followers -->
      <div
        class="p-4 bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-brutal-sm"
      >
        <div class="flex items-center gap-2 mb-2">
          <Users :size="16" class="text-slate-400" />
          <span class="text-xs font-bold uppercase text-slate-500">Followers</span>
        </div>
        <p class="text-2xl font-black text-slate-900 dark:text-white">
          {{ formatNumber(data.followers) }}
        </p>
        <div v-if="data.followerGrowthPercent !== 0" class="flex items-center gap-1 mt-1">
          <TrendingUp
            :size="12"
            :class="data.followerGrowthPercent > 0 ? 'text-emerald-500' : 'text-red-500'"
          />
          <span
            class="text-xs font-bold"
            :class="
              data.followerGrowthPercent > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            "
          >
            {{ data.followerGrowthPercent > 0 ? '+' : ''
            }}{{ data.followerGrowthPercent.toFixed(1) }}%
          </span>
        </div>
      </div>

      <!-- Engagement Rate -->
      <div
        class="p-4 bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-brutal-sm"
      >
        <div class="flex items-center gap-2 mb-2">
          <TrendingUp :size="16" class="text-slate-400" />
          <span class="text-xs font-bold uppercase text-slate-500">Engagement</span>
        </div>
        <p class="text-2xl font-black text-slate-900 dark:text-white">
          {{ data.engagementRate.toFixed(2) }}%
        </p>
      </div>

      <!-- Total Views -->
      <div
        class="p-4 bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-brutal-sm"
      >
        <div class="flex items-center gap-2 mb-2">
          <Eye :size="16" class="text-slate-400" />
          <span class="text-xs font-bold uppercase text-slate-500">Total Views</span>
        </div>
        <p class="text-2xl font-black text-slate-900 dark:text-white">
          {{ formatNumber(totalViews) }}
        </p>
      </div>

      <!-- Posts -->
      <div
        class="p-4 bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-brutal-sm"
      >
        <div class="flex items-center gap-2 mb-2">
          <Video :size="16" class="text-slate-400" />
          <span class="text-xs font-bold uppercase text-slate-500">Posts</span>
        </div>
        <p class="text-2xl font-black text-slate-900 dark:text-white">
          {{ formatNumber(posts) }}
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <p class="text-sm font-bold text-slate-500 dark:text-slate-400">
        Connect your {{ config.name }} account to see metrics
      </p>
    </div>
  </div>
</template>
