import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Preload the two fonts the first screen is set in. Without this the browser
 * only discovers them after it has parsed the CSS and laid the page out, so
 * the name and intro paint in a fallback font and then visibly swap.
 */
function preloadFonts(patterns) {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        return Object.keys(ctx.bundle || {})
          .filter((file) => patterns.some((p) => p.test(file)))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' },
            injectTo: 'head',
          }))
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), preloadFonts([/space-grotesk-latin-wght-normal-/, /inter-latin-wght-normal-/])],
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
