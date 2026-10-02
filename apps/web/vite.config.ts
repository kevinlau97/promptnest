import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // bild.quarker.cc 图片：CacheFirst，允许缓存 opaque response
          {
            urlPattern: /^https:\/\/bild\.quarker\.cc\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bild-images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 其他所有外部 HTTPS 请求：NetworkOnly，不缓存
          {
            urlPattern: ({ url }) => url.protocol === 'https:',
            handler: 'NetworkOnly',
          },
          // WASM：CacheFirst
          {
            urlPattern: /\/node_modules\/wasm-vips\/.*|.*vips.*\.(wasm|js)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-vips-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Memos',
        short_name: 'Prompts',
        description: 'Personal prompt management tool',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
