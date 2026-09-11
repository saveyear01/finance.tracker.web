import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Ship updates without asking. The alternative ('prompt') needs UI to
      // offer the reload, which there is nowhere to put yet.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Finance Tracker',
        short_name: 'Finance',
        description:
          'Track where your money sits and what it is for, across every wallet.',
        // Matches the light background (--background) so the Android status
        // bar and the splash screen don't flash a different colour on launch.
        theme_color: '#fcfcfc',
        background_color: '#fcfcfc',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        /*
         * Two deliberate omissions, both about auth:
         *
         * 1. No runtimeCaching rule for /api. Every API response here is
         *    per-user and cookie-authenticated; caching one would let the next
         *    person to open the app on a shared device read the last one's
         *    data. Offline reads of last-synced balances will need a
         *    per-user store, not a blanket HTTP cache.
         * 2. The SPA navigation fallback must never answer an /api URL, or a
         *    signed-out API call would resolve to the HTML shell instead of a
         *    401 and the route guard would never fire.
         */
        navigateFallbackDenylist: [/^\/api/],
      },
      // A service worker in dev is a classic source of "why isn't my change
      // showing". Test the PWA against `npm run build && npm run preview`.
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // The web ports sit one above marginlab's (8100 / 8200). The API is on 8000
  // like marginlab's, so only one of the two backends can run at a time.
  server: {
    port: 8101,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // `vite preview` does not inherit `server.proxy`, and previewing the built
  // app is how the service worker gets tested — so it needs its own.
  preview: {
    port: 8201,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
