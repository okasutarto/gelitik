import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '@/stores/dashboardStore'

// Mock API
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

describe('Dashboard Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('DASH-01 to DASH-05: Dashboard Metrics', () => {
    it('should load and display total followers', async () => {
      const store = useDashboardStore()

      const mockResponse = {
        data: {
          totalFollowers: 15000,
          totalViews: 500000,
          totalLikes: 75000,
          totalComments: 5000,
          totalShares: 2000
        }
      }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchOverview()

      expect(store.totalFollowers).toBe(15000)
    })

    it('should load and display total views', async () => {
      const store = useDashboardStore()

      const mockResponse = {
        data: {
          totalFollowers: 15000,
          totalViews: 500000,
          totalLikes: 75000
        }
      }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchOverview()

      expect(store.totalViews).toBe(500000)
    })

    it('should load and display total likes', async () => {
      const store = useDashboardStore()

      const mockResponse = {
        data: {
          totalFollowers: 15000,
          totalViews: 500000,
          totalLikes: 75000
        }
      }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchOverview()

      expect(store.totalLikes).toBe(75000)
    })

    it('should show empty state when no data', async () => {
      const store = useDashboardStore()

      const mockResponse = {
        data: {
          totalFollowers: 0,
          totalViews: 0,
          totalLikes: 0
        }
      }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchOverview()

      expect(store.totalFollowers).toBe(0)
      expect(store.totalViews).toBe(0)
      expect(store.totalLikes).toBe(0)
      expect(store.isEmpty).toBe(true)
    })

    it('should set loading state while fetching', async () => {
      const store = useDashboardStore()

      const mockResponse = {
        data: {
          totalFollowers: 1000,
          totalViews: 5000,
          totalLikes: 500
        }
      }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get).mockImplementation(() => new Promise(resolve =>
        setTimeout(() => resolve(mockResponse), 100)
      ))

      const fetchPromise = store.fetchOverview()

      // Should be loading initially
      expect(store.loading).toBe(true)

      await fetchPromise

      // Should not be loading after completion
      expect(store.loading).toBe(false)
    })
  })

  describe('REFRESH-01 to REFRESH-03: Manual Refresh', () => {
    it('should refresh data when refresh is called', async () => {
      const store = useDashboardStore()

      const mockResponse1 = {
        data: { totalFollowers: 1000, totalViews: 5000, totalLikes: 500 }
      }

      const mockResponse2 = {
        data: { totalFollowers: 1500, totalViews: 7000, totalLikes: 800 }
      }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      await store.fetchOverview()
      expect(store.totalFollowers).toBe(1000)

      await store.refreshData()
      expect(store.totalFollowers).toBe(1500)
    })

    it('should handle refresh error gracefully', async () => {
      const store = useDashboardStore()

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'))

      await expect(store.refreshData()).rejects.toThrow('Network error')
    })

    it('should preserve old data on refresh failure', async () => {
      const store = useDashboardStore()

      const mockResponse = {
        data: { totalFollowers: 1000, totalViews: 5000, totalLikes: 500 }
      }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get)
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(new Error('Network error'))

      await store.fetchOverview()
      expect(store.totalFollowers).toBe(1000)

      try {
        await store.refreshData()
      } catch (e) {
        // Expected to fail
      }

      // Old data should still be present
      expect(store.totalFollowers).toBe(1000)
    })
  })

  describe('CONN-01 to CONN-05: Account Connection', () => {
    it('should load connected accounts', async () => {
      const store = useDashboardStore()

      const mockResponse = {
        data: [
          { id: '1', platform: 'tiktok', username: 'testuser', isActive: true }
        ]
      }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchAccounts()

      expect(store.accounts).toHaveLength(1)
      expect(store.accounts[0].platform).toBe('tiktok')
    })

    it('should show prompt when no accounts connected', async () => {
      const store = useDashboardStore()

      const mockResponse = { data: [] }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchAccounts()

      expect(store.accounts).toHaveLength(0)
      expect(store.hasAccounts).toBe(false)
    })
  })
})
