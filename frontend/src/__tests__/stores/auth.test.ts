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

      const result = await authStore.login('test@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(authStore.token).toBe('mock-jwt-token')
      expect(authStore.user).toEqual(mockResponse.data.user)
      expect(localStorage.getItem('token')).toBe('mock-jwt-token')
    })

    it('should return error on failed login', async () => {
      const authStore = useAuthStore()

      const { default: api } = await import('@/services/api')
      vi.mocked(api.post).mockRejectedValue(new Error('Invalid credentials'))

      const result = await authStore.login('test@example.com', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('logout', () => {
    it('should clear user, token and redirect', async () => {
      const authStore = useAuthStore()

      // Set initial state using setAuth
      authStore.setAuth(
        { id: 'user-1', email: 'test@example.com', name: 'Test' },
        'some-token'
      )

      // Mock window.location
      vi.stubGlobal('window', {
        location: { href: '' }
      })

      authStore.logout()

      expect(authStore.token).toBeNull()
      expect(authStore.user).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()

      vi.unstubAllGlobals()
    })
  })

  describe('checkSession', () => {
    it('should restore token from localStorage', async () => {
      localStorage.setItem('token', 'stored-token')

      const authStore = useAuthStore()
      const { default: api } = await import('@/services/api')

      vi.mocked(api.get).mockResolvedValue({
        data: { id: 'user-1', email: 'test@example.com', name: 'Test' }
      })

      const result = await authStore.checkSession()

      expect(result).toBe(true)
      expect(authStore.token).toBe('stored-token')
    })

    it('should return false if no token in localStorage', async () => {
      const authStore = useAuthStore()

      const result = await authStore.checkSession()

      expect(result).toBe(false)
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      const authStore = useAuthStore()
      authStore.setAuth(
        { id: 'user-1', email: 'test@example.com', name: 'Test' },
        'valid-token'
      )

      expect(authStore.isAuthenticated).toBe(true)
    })

    it('should return false when no token', () => {
      const authStore = useAuthStore()

      expect(authStore.isAuthenticated).toBe(false)
    })
  })
})
