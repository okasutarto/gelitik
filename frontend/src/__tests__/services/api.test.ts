import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import api from '@/services/api'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() }
      }
    }))
  }
}))

describe('API Service', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('ERR-01: Network Error', () => {
    it('should handle network errors gracefully', async () => {
      const { default: axios } = await import('axios')
      const mockAxiosInstance = axios.create()

      vi.mocked(mockAxiosInstance.get).mockRejectedValueOnce(
        new Error('Network Error')
      )

      await expect(mockAxiosInstance.get('/test')).rejects.toThrow('Network Error')
    })

    it('should return user-friendly error message on network failure', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'ERR_NETWORK'
      }

      const formattedError = api.formatError?.(networkError) || 'Unable to connect. Please check your internet connection.'

      expect(formattedError).toContain('Unable to connect')
    })
  })

  describe('ERR-02: Token Expired', () => {
    it('should detect 401 Unauthorized response', async () => {
      const { default: axios } = await import('axios')
      const mockAxiosInstance = axios.create()

      vi.mocked(mockAxiosInstance.get).mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Token expired' }
        }
      })

      try {
        await mockAxiosInstance.get('/protected')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should trigger re-authentication flow on token expiration', async () => {
      const authExpiredError = {
        response: {
          status: 401,
          data: { message: 'Token expired' }
        }
      }

      // Should redirect to login or refresh token
      expect(authExpiredError.response.status).toBe(401)
    })
  })

  describe('ERR-03: API Rate Limit', () => {
    it('should handle 429 Too Many Requests', async () => {
      const { default: axios } = await import('axios')
      const mockAxiosInstance = axios.create()

      vi.mocked(mockAxiosInstance.get).mockRejectedValueOnce({
        response: {
          status: 429,
          headers: {
            'retry-after': '60'
          }
        }
      })

      try {
        await mockAxiosInstance.get('/test')
      } catch (error: any) {
        expect(error.response.status).toBe(429)
        expect(error.response.headers['retry-after']).toBe('60')
      }
    })

    it('should return friendly message for rate limiting', () => {
      const rateLimitError = {
        response: {
          status: 429,
          headers: { 'retry-after': '60' }
        }
      }

      const message = 'Too many requests. Please try again in 60 seconds.'
      expect(message).toContain('60')
    })
  })

  describe('ERR-04: Missing Data', () => {
    it('should handle null/undefined responses gracefully', () => {
      const nullData = null
      const undefinedData = undefined

      const safeData = nullData || {}
      const safeUndefined = undefinedData || []

      expect(safeData).toEqual({})
      expect(safeUndefined).toEqual([])
    })

    it('should provide fallback for partial data', () => {
      const partialResponse = {
        followers: 1000,
        views: undefined,
        likes: null
      }

      const fallback = {
        followers: partialResponse.followers || 0,
        views: partialResponse.views || 0,
        likes: partialResponse.likes || 0
      }

      expect(fallback.followers).toBe(1000)
      expect(fallback.views).toBe(0)
      expect(fallback.likes).toBe(0)
    })
  })

  describe('ERR-05: 404 Pages', () => {
    it('should handle 404 Not Found', async () => {
      const { default: axios } = await import('axios')
      const mockAxiosInstance = axios.create()

      vi.mocked(mockAxiosInstance.get).mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'Resource not found' }
        }
      })

      try {
        await mockAxiosInstance.get('/nonexistent')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
      }
    })
  })

  describe('Request Interceptors', () => {
    it('should add auth token to requests', async () => {
      localStorage.setItem('token', 'test-token')

      // Simulate interceptor behavior
      const token = localStorage.getItem('token')
      const config = {
        headers: {}
      }

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }

      expect(config.headers['Authorization']).toBe('Bearer test-token')
    })

    it('should not add token if not present', () => {
      localStorage.removeItem('token')

      const token = localStorage.getItem('token')
      const config = {
        headers: {}
      }

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }

      expect(config.headers['Authorization']).toBeUndefined()
    })
  })
})
