import { ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export interface PlatformAnalytics {
  followers: number
  following: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalViews: number
  engagementRate: number
}

export interface AccountInfo {
  id: string
  platform: string
  displayName: string
  username: string
  avatar?: string
}

export interface PlatformData {
  account: AccountInfo
  data: {
    userInfo?: any
    videos?: any[]
    analytics?: PlatformAnalytics
  }
}

export function usePlatformAnalytics(platform: string) {
  const authStore = useAuthStore()
  const loading = ref(true)
  const error = ref<string | null>(null)
  const accountData = ref<PlatformData | null>(null)

  const fetchAnalytics = async () => {
    try {
      loading.value = true
      error.value = null
      const { data } = await api.get(`/api/analytics/${platform}`)
      accountData.value = data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch analytics'
      console.error('Analytics fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchOverview = async () => {
    try {
      const { data } = await api.get('/api/analytics/overview')
      return data
    } catch (err: any) {
      console.error('Overview fetch error:', err)
      throw err
    }
  }

  return {
    loading,
    error,
    accountData,
    fetchAnalytics,
    fetchOverview
  }
}
