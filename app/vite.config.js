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
        name: '电吉他学习助手',
        short_name: '练琴助手',
        description: '歌曲分析、音色设置、练琴打卡的个人电吉他学习助手',
        lang: 'zh-CN',
        display: 'standalone',
        start_url: '/',
        theme_color: '#171a21',
        background_color: '#171a21',
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
