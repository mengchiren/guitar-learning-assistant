<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const tabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/tools', label: '工具', icon: '🎯' },
  { path: '/songs', label: '歌曲', icon: '🎸' },
  { path: '/profile', label: '我的', icon: '👤' },
]
</script>

<template>
  <div class="shell">
    <main class="page">
      <router-view />
    </main>
    <nav class="tabbar">
      <router-link
        v-for="t in tabs"
        :key="t.path"
        :to="t.path"
        class="tab"
        :class="{ active: route.path === t.path }"
      >
        <span class="tab-icon">{{ t.icon }}</span>
        <span class="tab-label">{{ t.label }}</span>
      </router-link>
    </nav>
  </div>
</template>
