<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import { useTheme } from '@/composables/useTheme'
import ChartTimeframeControl from './ChartTimeframeControl.vue'
import '@/composables/useChart' // Registers Chart.js components

interface FollowerHistoryEntry {
  date: string
  followers: number
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalSaves: number
  engagementRate: number
}

interface Props {
  title?: string
  subtitle?: string
  followerHistory?: Record<string, FollowerHistoryEntry[]>
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Engagement Comparison',
  subtitle: 'TikTok vs Instagram engagement'
})

const { isDark } = useTheme()

// Metric selector state
const selectedMetric = ref('likes')

const allMetricOptions = [
  { label: 'ENGAGEMENT', value: 'engagement' },
  { label: 'LIKES', value: 'likes' },
  { label: 'COMMENTS', value: 'comments' },
  { label: 'SHARES', value: 'shares' },
  { label: 'SAVES', value: 'saves' }
]

// Metric options - saves only for Instagram
const metricOptions = computed(() => {
  const hasInstagram = props.followerHistory && (
    props.followerHistory['instagram-graph']?.length > 0 ||
    props.followerHistory['instagram']?.length > 0
  )
  if (hasInstagram) {
    return allMetricOptions
  }
  // TikTok doesn't have saves
  return allMetricOptions.filter((opt) => opt.value !== 'saves')
})

// Check if we have real history data for the comparison chart
const hasHistoryData = computed(() => {
  if (!props.followerHistory) return false
  return Object.values(props.followerHistory).some((arr) => arr.length > 0)
})

// Get the metric value from an entry based on selected metric
const getMetricValue = (entry: FollowerHistoryEntry): number => {
  switch (selectedMetric.value) {
    case 'likes':
      return entry.totalLikes ?? 0
    case 'comments':
      return entry.totalComments ?? 0
    case 'shares':
      return entry.totalShares ?? 0
    case 'saves':
      return entry.totalSaves ?? 0
    case 'engagement':
      return entry.engagementRate ?? 0
    default:
      return entry.totalLikes ?? 0
  }
}

const chartData = computed(() => {
  if (!props.followerHistory || !hasHistoryData.value) {
    return {
      labels: [],
      datasets: []
    }
  }

  // Collect all unique dates across platforms
  const allDates = new Set<string>()
  for (const entries of Object.values(props.followerHistory)) {
    for (const entry of entries) {
      allDates.add(entry.date)
    }
  }
  const sortedDates = [...allDates].sort()
  const displayLabels = sortedDates.map((d) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const datasets = []

  // Instagram (check both instagram-graph and instagram keys)
  const igKey = props.followerHistory['instagram-graph']
    ? 'instagram-graph'
    : props.followerHistory['instagram']
      ? 'instagram'
      : null
  if (igKey && props.followerHistory[igKey].length > 0) {
    const igMap = new Map(props.followerHistory[igKey].map((e) => [e.date, getMetricValue(e)]))
    datasets.push({
      label: 'Instagram',
      data: sortedDates.map((d) => igMap.get(d) ?? 0),
      borderColor: isDark.value ? '#FF0099' : '#ec4899',
      backgroundColor: isDark.value ? 'rgba(255, 0, 153, 0.1)' : 'rgba(236, 72, 153, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: isDark.value ? '#FF0099' : '#fff',
      pointBorderColor: isDark.value ? '#fff' : '#ec4899',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    })
  }

  // TikTok
  if (props.followerHistory['tiktok']?.length > 0) {
    const ttMap = new Map(props.followerHistory['tiktok'].map((e) => [e.date, getMetricValue(e)]))
    datasets.push({
      label: 'TikTok',
      data: sortedDates.map((d) => ttMap.get(d) ?? 0),
      borderColor: isDark.value ? '#00F0FF' : '#0f172a',
      backgroundColor: isDark.value ? 'rgba(0, 240, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: isDark.value ? '#00F0FF' : '#fff',
      pointBorderColor: isDark.value ? '#fff' : '#0f172a',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    })
  }

  return { labels: displayLabels, datasets }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        color: isDark.value ? '#E0E0E0' : '#1e293b',
        font: {
          size: 12,
          weight: 'bold' as const
        }
      }
    },
    tooltip: {
      backgroundColor: isDark.value ? 'rgba(10, 10, 26, 0.95)' : '#1e293b',
      titleFont: { size: 13, weight: 'bold' as const },
      titleColor: isDark.value ? '#00F0FF' : '#fff',
      bodyFont: { size: 12 },
      bodyColor: isDark.value ? '#E0E0E0' : '#fff',
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      borderColor: isDark.value ? '#00F0FF' : 'transparent',
      borderWidth: isDark.value ? 1 : 0
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: isDark.value ? '#E0E0E0' : '#94a3b8',
        font: { size: 12 }
      }
    },
    y: {
      grid: {
        color: isDark.value ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9'
      },
      ticks: {
        color: isDark.value ? '#E0E0E0' : '#94a3b8',
        font: { size: 12 },
        callback: function (value: string | number) {
          const numValue = Number(value)
          // For engagement rate, show as percentage
          if (selectedMetric.value === 'engagement') {
            return `${numValue}%`
          }
          if (numValue >= 1000) return `${numValue / 1000}k`
          return value
        }
      },
      beginAtZero: true
    }
  }
}))
</script>

<template>
  <div class="brutal-card brutal-hover-lift rounded-none p-6">
    <div v-if="!hasHistoryData" class="p-8 text-center">
      <p class="text-sm font-bold text-slate-500 dark:text-slate-400">No engagement data yet</p>
      <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Engagement snapshots are recorded each time you view your analytics. Check back after a few days.
      </p>
    </div>
    <div v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 class="text-lg font-black uppercase hidden lg:block dark:text-white">
            {{ title }}
          </h3>
          <p class="text-sm font-bold opacity-60 uppercase dark:text-slate-400">
            {{ subtitle }}
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          <ChartTimeframeControl v-model="selectedMetric" :options="metricOptions" />
        </div>
      </div>

      <!-- Chart -->
      <div class="h-64 w-full">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>
