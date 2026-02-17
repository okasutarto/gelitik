import { ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { PlatformAnalytics, PlatformData } from '@/types/analytics'
import type { AxiosError } from 'axios'

export type { PlatformAnalytics, PlatformData } from '@/types/analytics'

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error
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
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        error.value = err.response?.data?.error || 'Failed to fetch analytics'
      } else {
        error.value = 'Failed to fetch analytics'
      }
      console.error('Analytics fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchOverview = async () => {
    try {
      const { data } = await api.get('/api/analytics/overview')
      return data
    } catch (err: unknown) {
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
