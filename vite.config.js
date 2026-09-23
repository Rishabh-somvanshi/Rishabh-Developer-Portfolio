import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019',
    cssCodeSplit: false,
    // Vite's default (500kb) warns on the voyage3d chunk on every build; the
    // real bundle budgets are owned and enforced by `npm run audit`, not this.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
