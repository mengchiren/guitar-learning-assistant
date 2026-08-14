<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { usePracticeStore } from '../stores/practice'
import { useSettingsStore } from '../stores/settings'
import Icon from '../components/Icon.vue'

const practice = usePracticeStore()
const settings = useSettingsStore()

const tick = ref(0)
const clockTimer = setInterval(() => tick.value++, 30000)
onUnmounted(() => clearInterval(clockTimer))

const nowHHMM = computed(() => {
  tick.value
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})
const shouldRemind = computed(
  () =>
    settings.reminders.enabled &&
    nowHHMM.value >= settings.reminders.time &&
    practice.todaySeconds === 0
)

const fmt = (s) => {
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分` : `${m} 分钟`
}
const todayText = computed(() => fmt(practice.todaySeconds))
const max7 = computed(() => Math.max(...practice.last7Days.map((d) => d.seconds), 60))

const tips = [
  { dur: 10, text: '爬格子 5 分钟 + 和弦转换 5 分钟' },
  { dur: 30, text: '基本功 15 分钟 + 歌曲段落 15 分钟' },
  { dur: 60, text: '基本功 20 分钟 + 歌曲 30 分钟 + 复习 10 分钟' },
]
</script>

<template>
  <div>
    <h1 class="page-title">今天练琴了吗？</h1>

    <div v-if="shouldRemind" class="card remind-banner">
      <Icon name="bell" :size="16" />
      <span>到点啦，今天还没练琴！10 分钟爬格子也好过没有。</span>
    </div>

    <div class="card hero">
      <div class="hero-main">
        <div class="hero-num">{{ todayText }}</div>
        <div class="dim small">今日累计练习</div>
      </div>
      <div class="hero-side">
        <div class="hero-streak">{{ practice.streakDays }} 天</div>
        <div class="dim small">连续打卡</div>
      </div>
    </div>

    <router-link to="/practice" class="btn btn-primary btn-block">开始练习</router-link>

    <div class="card">
      <h2>最近 7 天</h2>
      <div class="week-bars">
        <div v-for="(d, i) in practice.last7Days" :key="d.date" class="week-bar-wrap">
          <div
            class="week-bar"
            :class="{ today: i === practice.last7Days.length - 1 }"
            :style="{ height: Math.max(4, (d.seconds / max7) * 100) + '%' }"
          ></div>
          <div class="week-label dim">{{ d.date.slice(5) }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>今日练习包（弹性）</h2>
      <div v-for="t in tips" :key="t.dur" class="list-row">
        <span class="tag">{{ t.dur }} 分钟</span>
        <span class="small">{{ t.text }}</span>
      </div>
      <p class="muted" style="margin-top: 8px">
        零基础阶段：先坚持每天摸琴 10 分钟，再逐步加量。学习计划完整版见 M3。
      </p>
    </div>

    <div class="card">
      <h2>练琴提醒</h2>
      <p v-if="settings.reminders.enabled" class="small">每天 {{ settings.reminders.time }} 提醒（应用内）</p>
      <p v-else class="small muted">未开启</p>
      <router-link to="/reminders" class="small" style="color: var(--accent-dark)">去设置</router-link>
    </div>
  </div>
</template>

<style scoped>
.hero { display: flex; justify-content: space-between; align-items: center; }
.hero-num { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
.hero-streak { font-size: 22px; font-weight: 800; color: var(--accent); }
.hero-side { text-align: right; }
.remind-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent-dark);
  border-left: 3px solid var(--accent);
}
.week-bars { display: flex; gap: 8px; height: 90px; align-items: flex-end; }
.week-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: 4px; }
.week-bar { width: 100%; max-width: 34px; background: #d6d3cb; border-radius: 3px 3px 0 0; }
.week-bar.today { background: var(--accent); }
.week-label { font-size: 11px; }
.list-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
</style>
