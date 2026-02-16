import { ref } from 'vue'
import api from '@/services/api'

export interface VideoDetailData {
  id: string
  title: string
  description: string
  thumbnail: string
  cover_image_url?: string
  create_time: number
  duration: number
  views: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
  // Additional detailed analytics
  demographics?: {
    age_range?: { range: string; percentage: number }[]
    gender?: { gender: string; percentage: number }[]
    top_countries?: { country: string; percentage: number }[]
    top_cities?: { city: string; percentage: number }[]
  }
  performance_over_time?: {
    date: string
    views: number
    likes: number
    comments: number
    shares: number
  }[]
  traffic_sources?: {
    source: string
    percentage: number
  }[]
}

export function useVideoAnalytics() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const videoData = ref<VideoDetailData | null>(null)

  const fetchVideoDetail = async (platform: string, videoId: string) => {
    try {
      loading.value = true
      error.value = null
      const { data } = await api.get(`/api/analytics/${platform}/video/${videoId}`)
      videoData.value = data
      return data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch video analytics'
      console.error('Video detail fetch error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    videoData,
    fetchVideoDetail
  }
}
