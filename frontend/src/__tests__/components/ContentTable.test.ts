import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ContentTable from '@/components/dashboard/ContentTable.vue'

// Mock the format utility
vi.mock('@/utils/format', () => ({
  formatNumber: vi.fn((num: number) => num.toLocaleString()),
  formatCompactNumber: vi.fn((num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  })
}))

const mockVideos = [
  {
    id: '1',
    title: 'Video 1',
    thumbnail: 'https://example.com/thumb1.jpg',
    viewCount: 15000,
    likeCount: 1200,
    commentCount: 150,
    shareCount: 50,
    createdAt: new Date('2026-01-15')
  },
  {
    id: '2',
    title: 'Video 2',
    thumbnail: 'https://example.com/thumb2.jpg',
    viewCount: 25000,
    likeCount: 3500,
    commentCount: 400,
    shareCount: 100,
    createdAt: new Date('2026-01-14')
  },
  {
    id: '3',
    title: 'Video 3',
    thumbnail: 'https://example.com/thumb3.jpg',
    viewCount: 8000,
    likeCount: 600,
    commentCount: 80,
    shareCount: 20,
    createdAt: new Date('2026-01-13')
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
          videos: mockVideos,
          loading: false
        }
      })

      expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    })

    it('should display video titles', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos,
          loading: false
        }
      })

      expect(wrapper.text()).toContain('Video 1')
      expect(wrapper.text()).toContain('Video 2')
      expect(wrapper.text()).toContain('Video 3')
    })
  })

  describe('CT-02: Video Columns', () => {
    it('should display all required columns', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos,
          loading: false
        }
      })

      const headers = wrapper.findAll('th')
      const headerText = headers.map(h => h.text())

      expect(headerText).toContain('Title')
      expect(headerText).toContain('Views')
      expect(headerText).toContain('Likes')
    })
  })

  describe('CT-03: Sort by Views', () => {
    it('should sort by views descending by default', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos,
          loading: false
        }
      })

      const rows = wrapper.findAll('tbody tr')
      // First row should have highest views (25000)
      expect(rows[0].text()).toContain('Video 2')
    })

    it('should change sort order when header clicked', async () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos,
          loading: false
        }
      })

      const viewsHeader = wrapper.find('th:contains("Views")')
      await viewsHeader.trigger('click')

      const rows = wrapper.findAll('tbody tr')
      // After click, should sort ascending (8000 first)
      expect(rows[0].text()).toContain('Video 3')
    })
  })

  describe('CT-04: Sort by Likes', () => {
    it('should sort by likes when header clicked', async () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos,
          loading: false
        }
      })

      const likesHeader = wrapper.find('th:contains("Likes")')
      await likesHeader.trigger('click')

      const rows = wrapper.findAll('tbody tr')
      // First should have most likes (3500)
      expect(rows[0].text()).toContain('Video 2')
    })
  })

  describe('CT-05: Empty State', () => {
    it('should show empty state when no videos', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: [],
          loading: false
        }
      })

      expect(wrapper.text()).toContain('No content found')
      expect(wrapper.find('tbody tr').exists()).toBe(false)
    })
  })

  describe('CT-06: Video Click', () => {
    it('should emit video-click event when row clicked', async () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: mockVideos,
          loading: false
        }
      })

      const firstRow = wrapper.find('tbody tr')
      await firstRow.trigger('click')

      expect(wrapper.emitted('video-click')).toBeTruthy()
      expect(wrapper.emitted('video-click')?.[0]).toEqual([mockVideos[0]])
    })
  })

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      const wrapper = mount(ContentTable, {
        props: {
          videos: [],
          loading: true
        }
      })

      expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    })
  })
})
