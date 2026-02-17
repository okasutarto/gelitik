// Analytics Types
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
    userInfo?: unknown
    videos?: unknown[]
    analytics?: PlatformAnalytics
  }
}
