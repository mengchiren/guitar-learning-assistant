<script setup>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from './components/Icon.vue'
import { useTimerStore } from './stores/timer.js'
import { useSettingsStore } from './stores/settings.js'
import { onStorageError } from './utils/storage.js'
import { TABS, ROUTES } from './data/nav.js'
import Mascot from './components/Mascot.vue'

const route = useRoute()
const router = useRouter()
const timer = useTimerStore()
const settings = useSettingsStore()

// v0.9.0：tab 页面 KeepAlive 保活名单（组件名 = 文件名，见各 view 的 defineOptions）
const KEEP_ALIVE = ['HomeView', 'PlanView', 'ToolsView', 'SongsView', 'ProfileView']

// 恢复上次练习会话（v0.8.0）：进程被杀/刷新后重开，计时与 tick 都要续上
timer.init()

// 存储失败横幅（v0.8.0）：localStorage 满等导致落盘失败时提示用户，不静默丢数据
const storageError = ref('')
let offStorageError = null
onMounted(() => {
  offStorageError = onStorageError(() => {
    storageError.value =
      '存储空间不足，最近的更改可能没有保存。请到「我的」页导出备份，并删除旧录音或清空聊天记录后重试。'
  })
  // v0.9.0：空闲时预加载 5 个 tab 页面的 chunk（弱网/首次访问时减少切换等待）
  const warm = () => ROUTES.filter((r) => r.meta?.tab).forEach((r) => r.component())
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2000 })
  else setTimeout(warm, 1200)
})
onUnmounted(() => offStorageError && offStorageError())

// 外观主题（v0.7.0）：themeId 变化时切换 html[data-theme]，CSS 变量换肤
watch(
  () => settings.themeId,
  (id) => {
    document.documentElement.dataset.theme = id || 'classic'
  },
  { immediate: true },
)
// 透明毛玻璃（v0.7.1）：开启后卡片/面板半透明，背景插画透出来
watch(
  () => settings.glass,
  (on) => {
    document.documentElement.classList.toggle('glass', Boolean(on))
  },
  { immediate: true },
)

// tab 列表由 data/nav.js 统一声明（v0.6.0）

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
          <span class="brand-name">练琴搭子</span>
        </router-link>
      </div>
      <nav class="topnav">
        <router-link
          v-for="t in TABS"
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
      <!-- v0.9.0：tab 页面 KeepAlive 保活，切换即时显示（不再每次全量重建） -->
      <router-view v-slot="{ Component }">
        <KeepAlive :include="KEEP_ALIVE">
          <component :is="Component" />
        </KeepAlive>
      </router-view>
    </main>

    <!-- 存储失败横幅（v0.8.0）：落盘失败时持续显示，手动关闭 -->
    <div v-if="storageError" class="storage-banner" role="alert">
      <span>{{ storageError }}</span>
      <button class="storage-banner-close" aria-label="关闭提示" @click="storageError = ''">×</button>
    </div>

    <!-- 主题看板娘（v0.7.0）：仅当前主题配置了 mascot 时显示 -->
    <Mascot />

    <!-- 移动端：底部导航 -->
    <nav v-if="route.meta.tab" class="tabbar mobile-only">
      <router-link
        v-for="t in TABS"
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
