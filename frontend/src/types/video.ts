// Video Types
import type { Platform } from './platform'

export interface Video {
  id: string
  video_description?: string
  cover_image_url?: string
  create_time?: string | number
  duration?: number
  view_count?: number
  like_count?: number
  comment_count?: number
  share_count?: number
  // Computed
  title?: string
  thumbnail?: string
  views?: number
  likes?: number
  comments?: number
  shares?: number
  created?: string
  timeAgo?: string
}

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
  demographics?: VideoDemographics
  performance_over_time?: PerformanceData[]
  traffic_sources?: TrafficSource[]
}

export interface VideoDemographics {
  age_range?: AgeRange[]
  gender?: Gender[]
  top_countries?: Country[]
  top_cities?: City[]
}

export interface AgeRange {
  range: string
  percentage: number
}

export interface Gender {
  gender: string
  percentage: number
}

export interface Country {
  country: string
  percentage: number
}

export interface City {
  city: string
  percentage: number
}

export interface PerformanceData {
  date: string
  views: number
  likes: number
  comments: number
  shares: number
}

export interface TrafficSource {
  source: string
  percentage: number
}

// Filtered content type for ContentTable
export interface VideoContentItem {
  id: string
  title: string
  thumbnail: string
  platform: Platform
  duration: number
  views: number
  likes: number
  comments: number
  shares: number
  created: string | number
  timeAgo: string
}
