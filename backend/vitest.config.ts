import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Set required env vars before tests run
process.env.JWT_SECRET = 'test-secret'
process.env.TIKTOK_CLIENT_ID = 'test-tiktok-id'
process.env.TIKTOK_CLIENT_SECRET = 'test-tiktok-secret'
process.env.INSTAGRAM_CLIENT_ID = 'test-insta-id'
process.env.INSTAGRAM_CLIENT_SECRET = 'test-insta-secret'
process.env.GOOGLE_CLIENT_ID = 'test-google-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'dist/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
