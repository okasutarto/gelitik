// Test Fixtures for Gelitik MVP

export interface MockUser {
  id: string
  email: string
  name: string
  googleId?: string
  tiktokId?: string
  instagramId?: string
}

export interface MockVideo {
  id: string
  title: string
  thumbnail: string
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: Date
}

export interface MockAccount {
  id: string
  platform: 'tiktok' | 'instagram' | 'instagram-graph'
  username: string
  isActive: boolean
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: Date
}

export interface MockAnalytics {
  followers: number
  following: number
  likes: number
  views: number
  comments: number
  shares: number
  date: Date
}

// Factory functions
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    name: 'Test User',
    ...overrides
  }
}

export function createMockVideo(overrides?: Partial<MockVideo>): MockVideo {
  return {
    id: 'video-' + Math.random().toString(36).substr(2, 9),
    title: 'Test Video',
    thumbnail: 'https://example.com/thumb.jpg',
    viewCount: Math.floor(Math.random() * 100000),
    likeCount: Math.floor(Math.random() * 10000),
    commentCount: Math.floor(Math.random() * 1000),
    shareCount: Math.floor(Math.random() * 500),
    createdAt: new Date(),
    ...overrides
  }
}

export function createMockVideos(count: number): MockVideo[] {
  return Array.from({ length: count }, () => createMockVideo())
}

export function createMockAccount(overrides?: Partial<MockAccount>): MockAccount {
  return {
    id: 'account-' + Math.random().toString(36).substr(2, 9),
    platform: 'tiktok',
    username: 'testuser',
    isActive: true,
    ...overrides
  }
}

export function createMockAnalytics(overrides?: Partial<MockAnalytics>): MockAnalytics {
  return {
    followers: 1000,
    following: 500,
    likes: 5000,
    views: 50000,
    comments: 1000,
    shares: 500,
    date: new Date(),
    ...overrides
  }
}

export function createMockOverview() {
  return {
    totalFollowers: 15000,
    totalViews: 500000,
    totalLikes: 75000,
    totalComments: 5000,
    totalShares: 2000
  }
}

// Error scenarios
export const errorScenarios = {
  networkError: new Error('Network Error'),
  unauthorizedError: { response: { status: 401 } },
  notFoundError: { response: { status: 404 } },
  rateLimitError: { response: { status: 429, headers: { 'retry-after': '60' } } },
  serverError: { response: { status: 500 } }
}
