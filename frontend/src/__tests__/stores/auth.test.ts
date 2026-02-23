import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Mock the api service
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('login', () => {
    it('should set user and token on successful login', async () => {
      const authStore = useAuthStore()

      // Mock successful login
      const mockResponse = {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User'
          }
        }
      }

      const { default: api } = await import('@/services/api')
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      await authStore.login('test@example.com', 'password123')

      expect(authStore.token).toBe('mock-jwt-token')
      expect(authStore.user).toEqual(mockResponse.data.user)
      expect(localStorage.getItem('token')).toBe('mock-jwt-token')
    })

    it('should throw error on failed login', async () => {
      const authStore = useAuthStore()

      const { default: api } = await import('@/services/api')
      vi.mocked(api.post).mockRejectedValue(new Error('Invalid credentials'))

      await expect(authStore.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('should clear user, token and redirect', async () => {
      const authStore = useAuthStore()

      // Set initial state
      authStore.token = 'some-token'
      authStore.user = { id: 'user-1', email: 'test@example.com', name: 'Test' }

      authStore.logout()

      expect(authStore.token).toBeNull()
      expect(authStore.user).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('checkAuth', () => {
    it('should restore token from localStorage', () => {
      localStorage.setItem('token', 'stored-token')

      const authStore = useAuthStore()
      authStore.checkAuth()

      expect(authStore.token).toBe('stored-token')
    })

    it('should not restore if no token in localStorage', () => {
      const authStore = useAuthStore()
      authStore.checkAuth()

      expect(authStore.token).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      const authStore = useAuthStore()
      authStore.token = 'valid-token'

      expect(authStore.isAuthenticated).toBe(true)
    })

    it('should return false when no token', () => {
      const authStore = useAuthStore()
      authStore.token = null

      expect(authStore.isAuthenticated).toBe(false)
    })
  })
})
