<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from './components/Icon.vue'
import { useTimerStore } from './stores/timer'

const route = useRoute()
const router = useRouter()
const timer = useTimerStore()

const tabs = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/tools', label: '工具', icon: 'grid' },
  { path: '/songs', label: '歌曲', icon: 'music' },
  { path: '/profile', label: '我的', icon: 'user' },
]

// 外壳「练习中」胶囊：显示 mm:ss，点击回练习页
const chipTime = computed(() => {
  const total = Math.floor(timer.elapsedSec)
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
})
const showChip = computed(() => timer.active && route.path !== '/practice')

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
        <router-link v-if="showChip" to="/practice" class="timer-chip">
          <span class="timer-dot"></span>
          <span>{{ timer.running ? '练习中' : '已暂停' }} {{ chipTime }}</span>
        </router-link>
        <router-link to="/metronome" class="tool-btn" title="节拍器" aria-label="节拍器">
          <Icon name="metronome" :size="20" />
        </router-link>
        <router-link to="/tuner" class="tool-btn" title="调音器" aria-label="调音器">
          <Icon name="tuner" :size="20" />
        </router-link>
      </div>
    </header>

    <!-- 移动端：练习中悬浮胶囊 -->
    <router-link v-if="showChip" to="/practice" class="timer-chip timer-chip--float mobile-only">
      <span class="timer-dot"></span>
      <span>{{ timer.running ? '练习中' : '已暂停' }} {{ chipTime }}</span>
    </router-link>

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
