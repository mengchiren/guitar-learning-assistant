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
    <!-- 移动端：二级页返回栏 -->
    <header v-if="!route.meta.tab" class="subhead mobile-only">
      <button class="back-btn" aria-label="返回" @click="goBack">
        <Icon name="chevron-left" :size="22" />
      </button>
    </header>

    <!-- 桌面端：顶部导航栏 -->
    <header class="topbar desktop-only">
      <div class="topbar-left">
        <button v-if="!route.meta.tab" class="back-btn" aria-label="返回" @click="goBack">
          <Icon name="chevron-left" :size="20" />
        </button>
        <router-link to="/" class="brand">
          <span class="brand-mark"><Icon name="guitar" :size="18" /></span>
          <span class="brand-name">电吉他学习助手</span>
        </router-link>
      </div>
      <nav class="topnav">
        <router-link
          v-for="t in tabs"
          :key="t.path"
          :to="t.path"
          class="topnav-link"
          :class="{ active: route.path === t.path }"
        >
          {{ t.label }}
        </router-link>
      </nav>
      <div class="topbar-tools">
        <router-link to="/metronome" class="tool-btn" title="节拍器" aria-label="节拍器">
          <Icon name="metronome" :size="20" />
        </router-link>
        <router-link to="/tuner" class="tool-btn" title="调音器" aria-label="调音器">
          <Icon name="tuner" :size="20" />
        </router-link>
      </div>
    </header>

    <main class="page">
      <router-view />
    </main>

    <!-- 移动端：底部导航 -->
    <nav v-if="route.meta.tab" class="tabbar mobile-only">
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
