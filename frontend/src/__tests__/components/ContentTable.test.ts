import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ContentTable from '@/components/dashboard/content/ContentTable.vue'

// Mock the format utility
vi.mock('@/utils/format', () => ({
  formatNumber: vi.fn((num: number) => num.toLocaleString()),
  formatCompactNumber: vi.fn((num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  })
}))

// Mock the video utilities
vi.mock('@/utils/video', () => ({
  calculateEngagementRate: vi.fn((video) => {
    const likes = video.likes || 0
    const comments = video.comments || 0
    const shares = video.shares || 0
    const views = video.views || 1
    return ((likes + comments + shares) / views) * 100
  }),
  formatTimeAgo: vi.fn(() => '2 days ago'),
  getPlatformBadge: vi.fn(() => 'TikTok'),
  capitalize: vi.fn((s) => s),
  truncateText: vi.fn((s) => s),
  formatDuration: vi.fn(() => '0:30'),
  formatDate: vi.fn(() => 'Jan 15, 2026')
}))

const mockVideos = [
  {
    id: '1',
    title: 'Video 1',
    video_description: 'Description 1',
    cover_image_url: 'https://example.com/thumb1.jpg',
    view_count: 15000,
    like_count: 1200,
    comment_count: 150,
    share_count: 50,
    create_time: 1705276800
  },
  {
    id: '2',
    title: 'Video 2',
    video_description: 'Description 2',
    cover_image_url: 'https://example.com/thumb2.jpg',
    view_count: 25000,
    like_count: 3500,
    comment_count: 400,
    share_count: 100,
    create_time: 1705190400
  },
  {
    id: '3',
    title: 'Video 3',
    video_description: 'Description 3',
    cover_image_url: 'https://example.com/thumb3.jpg',
    view_count: 8000,
    like_count: 600,
    comment_count: 80,
    share_count: 20,
    create_time: 1705104000
  }
]

describe('ContentTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('CT-01: Display Videos', () => {
    it('should render video rows', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos
        }
      })

      expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    })

    it('should display video titles', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos
        }
      })

      expect(wrapper.text()).toContain('Video 1')
      expect(wrapper.text()).toContain('Video 2')
      expect(wrapper.text()).toContain('Video 3')
    })
  })

  describe('CT-02: Video Columns', () => {
    it('should display table headers', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos
        }
      })

      const headers = wrapper.findAll('th')
      const headerText = headers.map(h => h.text())

      expect(headerText).toContain('Content')
      expect(headerText).toContain('Views')
      expect(headerText).toContain('Likes')
    })
  })

  describe('CT-03: Sort by Views', () => {
    it('should display videos in original order by default', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos
        }
      })

      const rows = wrapper.findAll('tbody tr')
      // Default order is as provided (first video is first)
      expect(rows[0].text()).toContain('Video 1')
    })
  })

  describe('CT-05: Empty State', () => {
    it('should show empty state when no videos', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: []
        }
      })

      expect(wrapper.text()).toContain('No content yet')
      expect(wrapper.find('tbody tr').exists()).toBe(false)
    })
  })

  // Note: ContentTable component does not emit video-click event
  // It uses a modal internally instead of emitting events
})
