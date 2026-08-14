import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../views/HomeView.vue') },
  { path: '/practice', component: () => import('../views/PracticeView.vue') },
  { path: '/tools', component: () => import('../views/ToolsView.vue') },
  { path: '/metronome', component: () => import('../views/MetronomeView.vue') },
  { path: '/tuner', component: () => import('../views/TunerView.vue') },
  { path: '/songs', component: () => import('../views/SongsView.vue') },
  { path: '/profile', component: () => import('../views/ProfileView.vue') },
  { path: '/devices', component: () => import('../views/DevicesView.vue') },
  { path: '/reminders', component: () => import('../views/RemindersView.vue') },
  { path: '/templates', component: () => import('../views/TemplatesView.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
