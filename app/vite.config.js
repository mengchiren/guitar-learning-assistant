import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '练琴搭子',
        short_name: '练琴搭子',
        description: '陪你练琴的个人助手：歌曲分析、音色设置、练琴打卡',
        lang: 'zh-CN',
        display: 'standalone',
        start_url: '/',
        theme_color: '#f4f3ef',
        background_color: '#f4f3ef',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html'
      }
    })
  ]
})
