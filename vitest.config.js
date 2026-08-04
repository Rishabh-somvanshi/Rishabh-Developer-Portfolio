import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Match the production build's JSX runtime (vite.config.js loads
  // @vitejs/plugin-react, which defaults to the automatic runtime). Without
  // this, vitest's own esbuild transform falls back to the classic runtime,
  // which requires `React` in scope — most components here rely on the
  // automatic runtime and don't import React themselves, so they'd throw
  // "React is not defined" as soon as a test tried to render them.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
    setupFiles: ['vitest.setup.js'],
  },
})
