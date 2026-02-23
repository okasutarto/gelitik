import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    extends: './frontend/vitest.config.ts',
    test: {
      name: 'frontend',
      dir: 'frontend'
    }
  },
  {
    extends: './backend/vitest.config.ts',
    test: {
      name: 'backend',
      dir: 'backend'
    }
  }
])
