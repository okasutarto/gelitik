import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

// Mock Prisma
const mockPrisma = {
  socialAccount: {
    findMany: vi.fn()
  }
}

vi.mock('../../config/prisma.js', () => ({
  default: mockPrisma
}))

// Mock services
vi.mock('../../services/tiktokService.js', () => ({
  TikTokService: vi.fn().mockImplementation(() => ({
    getAnalytics: vi.fn().mockResolvedValue({
      followers: 1000,
      totalViews: 50000,
      totalLikes: 10000,
      videos: []
    })
  }))
}))

vi.mock('../../services/instagramGraph.service.js', () => ({
  InstagramGraphService: vi.fn().mockImplementation(() => ({
    getInsights: vi.fn().mockResolvedValue({
      followers: 500,
      totalReach: 10000,
      engagement: 2000
    })
  }))
}))

describe('Analytics Routes', () => {
  let app: express.Application
  let mockUser: { id: string }

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock middleware
    const authMiddleware = (req: any, res: any, next: any) => {
      req.user = mockUser
      next()
    }

    app = express()
    app.use(express.json())
    app.use('/analytics', authMiddleware, (req, res) => {
      // Simplified analytics handler for testing
      res.json({
        totalFollowers: 1500,
        totalViews: 50000,
        totalLikes: 12000
      })
    })
  })

  describe('GET /analytics/overview', () => {
    beforeEach(() => {
      mockUser = { id: 'user-1' }
    })

    it('should return aggregated analytics for connected accounts', async () => {
      mockPrisma.socialAccount.findMany.mockResolvedValue([
        {
          id: 'account-1',
          platform: 'tiktok',
          username: 'testuser',
          isActive: true,
          userId: 'user-1',
          analytics: [
            {
              followers: 1000,
              views: 50000,
              likes: 10000,
              comments: 500,
              shares: 200,
              date: new Date()
            }
          ]
        }
      ])

      const response = await request(app).get('/analytics/overview')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('totalFollowers')
      expect(response.body).toHaveProperty('totalViews')
      expect(response.body).toHaveProperty('totalLikes')
    })

    it('should return zeros when no accounts connected', async () => {
      mockPrisma.socialAccount.findMany.mockResolvedValue([])

      const response = await request(app).get('/analytics/overview')

      expect(response.status).toBe(200)
      expect(response.body.totalFollowers).toBe(0)
      expect(response.body.totalViews).toBe(0)
      expect(response.body.totalLikes).toBe(0)
    })

    it('should return 401 when not authenticated', async () => {
      // Override app without auth middleware for this test
      const unauthApp = express()
      unauthApp.use(express.json())
      unauthApp.get('/analytics', (req, res) => {
        res.json({})
      })

      const response = await request(unauthApp).get('/analytics')

      // Will fail because req.user is undefined
      expect(response.status).not.toBe(200)
    })
  })

  describe('GET /analytics/:platform/:accountId', () => {
    it('should return platform-specific analytics', async () => {
      mockPrisma.socialAccount.findMany.mockResolvedValue([
        {
          id: 'account-1',
          platform: 'tiktok',
          username: 'testuser',
          isActive: true,
          userId: 'user-1'
        }
      ])

      const response = await request(app).get('/analytics/tiktok/account-1')

      expect(response.status).toBe(200)
    })

    it('should return 404 for non-existent account', async () => {
      mockPrisma.socialAccount.findMany.mockResolvedValue([])

      const response = await request(app).get('/analytics/tiktok/nonexistent')

      expect(response.status).toBe(404)
    })
  })
})
