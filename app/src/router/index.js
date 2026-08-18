import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '../data/nav.js'

// 路由表由 data/nav.js 统一声明（v0.6.0），加页面只改那里
export default createRouter({
  history: createWebHistory(),
  routes: ROUTES,
  // 前进进新页面回到顶部；后退返回列表时恢复之前滚动到的位置
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})
