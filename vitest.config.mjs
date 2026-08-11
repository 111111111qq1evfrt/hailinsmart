import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.js', 'test/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/main.js',
        'src/App.vue',
        'src/router/**',
        'src/views/**',
        'src/components/**'
      ]
    },
    resolveSnapshotPath: (testPath, extension) => {
      return testPath.replace('.test.js', `.snap${extension}`)
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})