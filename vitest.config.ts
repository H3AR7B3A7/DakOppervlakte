import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig(async () => {
  const tsconfigPaths = (await import('vite-tsconfig-paths')).default
  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', '.next'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.d.ts',
          'src/app/api/**',
          'src/lib/init-db.ts',
          'src/__tests__/**',
        ],
      },
    },
  }
})
