import { createRouter, createWebHistory } from 'vue-router'

// meta.tab = 主页（显示底部导航）；meta.title = 子页面标题
const routes = [
  { path: '/', component: () => import('../views/HomeView.vue'), meta: { tab: true } },
  { path: '/practice', component: () => import('../views/PracticeView.vue'), meta: { title: '练习计时' } },
  { path: '/tools', component: () => import('../views/ToolsView.vue'), meta: { tab: true } },
  { path: '/metronome', component: () => import('../views/MetronomeView.vue'), meta: { title: '节拍器' } },
  { path: '/tuner', component: () => import('../views/TunerView.vue'), meta: { title: '调音器' } },
  { path: '/songs', component: () => import('../views/SongsView.vue'), meta: { tab: true } },
  { path: '/songs/new', component: () => import('../views/SongAnalyzeView.vue'), meta: { title: '添加歌曲' } },
  { path: '/songs/:id', component: () => import('../views/SongDetailView.vue'), meta: { title: '歌曲详情' } },
  { path: '/profile', component: () => import('../views/ProfileView.vue'), meta: { tab: true } },
  { path: '/devices', component: () => import('../views/DevicesView.vue'), meta: { title: '我的设备' } },
  { path: '/reminders', component: () => import('../views/RemindersView.vue'), meta: { title: '提醒设置' } },
  { path: '/templates', component: () => import('../views/TemplatesView.vue'), meta: { title: '音色套路库' } },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  // 前进进新页面回到顶部；后退返回列表时恢复之前滚动到的位置
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})
