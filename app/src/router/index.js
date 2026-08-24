import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '../data/nav.js'

// 路由表由 data/nav.js 统一声明（v0.6.0），加页面只改那里
export default createRouter({
  history: createWebHistory(),
  routes: ROUTES,
  // 前进进新页面回到顶部；后退返回列表时恢复之前滚动到的位置
  // v0.9.0：tab 页面 KeepAlive 保活后 DOM 留在原位——tab 之间互切不再强制回顶，
  // 保留各自的滚动位置；进/出二级页仍按原语义（前进回顶、后退恢复）。
  scrollBehavior(to, from, savedPosition) {
    if (to.meta.tab && from.meta.tab) return undefined
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})
