import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import authRoutes from '../../routes/auth.routes.js'

// Mock Prisma
vi.mock('../../config/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    session: {
      create: vi.fn(),
      deleteMany: vi.fn()
    }
  }
}))

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-token'),
    verify: vi.fn(() => ({ userId: 'user-1' }))
  }
}))

describe('Auth Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/auth', authRoutes)
  })

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const { default: prisma } = await import('../../config/prisma.js')

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-new',
        email: 'new@example.com',
        password: 'hashed',
        name: 'New User',
        googleId: null,
        tiktokId: null,
        instagramId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User'
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('token')
    })

    it('should reject duplicate email', async () => {
      const { default: prisma } = await import('../../config/prisma.js')

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
        password: 'hashed',
        name: 'Existing',
        googleId: null,
        tiktokId: null,
        instagramId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('already exists')
    })

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test'
        })

      expect(response.status).toBe(400)
    })

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test'
        })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const { default: prisma } = await import('../../config/prisma.js')

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: '$2a$10$hashedpassword', // bcrypt hash for 'password123'
        name: 'Test User',
        googleId: null,
        tiktokId: null,
        instagramId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
    })

    it('should reject invalid credentials', async () => {
      const { default: prisma } = await import('../../config/prisma.js')

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
    })
  })
})
