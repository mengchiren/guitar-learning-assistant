<script setup>
import { useRoute, useRouter } from 'vue-router'
import Icon from './components/Icon.vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/tools', label: '工具', icon: 'grid' },
  { path: '/songs', label: '歌曲', icon: 'music' },
  { path: '/profile', label: '我的', icon: 'user' },
]

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="shell" :class="{ 'with-tabbar': route.meta.tab }">
    <header v-if="!route.meta.tab" class="subhead">
      <button class="back-btn" aria-label="返回" @click="goBack">
        <Icon name="chevron-left" :size="22" />
      </button>
    </header>
    <main class="page">
      <router-view />
    </main>
    <nav v-if="route.meta.tab" class="tabbar">
      <router-link
        v-for="t in tabs"
        :key="t.path"
        :to="t.path"
        class="tab"
        :class="{ active: route.path === t.path }"
      >
        <span class="tab-icon"><Icon :name="t.icon" :size="21" /></span>
        <span class="tab-label">{{ t.label }}</span>
      </router-link>
    </nav>
  </div>
</template>
