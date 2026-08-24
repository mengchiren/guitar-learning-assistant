<script setup>
// v0.9.0：KeepAlive 保活名单用组件名匹配（App.vue KEEP_ALIVE）
defineOptions({ name: 'HomeView' })
import { ref, computed, watch, onActivated, onDeactivated } from 'vue'
import { usePracticeStore } from '../stores/practice.js'
import { useSettingsStore } from '../stores/settings.js'
import { usePlanStore } from '../stores/plan.js'
import { useMediaQuery } from '../composables/useMediaQuery.js'
import { localDateStr } from '../utils/date.js'
import Icon from '../components/Icon.vue'

const practice = usePracticeStore()
const settings = useSettingsStore()
const planStore = usePlanStore()

const isDesktop = useMediaQuery('(min-width: 768px)')

const tick = ref(0)
// v0.9.0：首页被 KeepAlive 保活后 onUnmounted 不再触发，定时器改由
// onDeactivated/onActivated 管理（页面不可见时停止 30s 刷新）
let clockTimer = null
function startClock() { if (!clockTimer) clockTimer = setInterval(() => tick.value++, 30000) }
function stopClock() { if (clockTimer) { clearInterval(clockTimer); clockTimer = null } }
onActivated(startClock)
onDeactivated(stopClock)
startClock()

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

// 系统通知（v0.8.0）：到点且今天未练时，若已授权则弹系统通知；每天最多一条。
// 注意：Android 上需要已安装 PWA 且 Chrome 支持才稳定，失败不影响应用内「到点啦」横幅。
const NOTIFIED_KEY = 'gla:v1:notified-date'
function maybeSystemNotify(on) {
  if (!on) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    if (localStorage.getItem(NOTIFIED_KEY) === localDateStr()) return
    localStorage.setItem(NOTIFIED_KEY, localDateStr())
    new Notification('练琴搭子', {
      body: '到点啦，今天还没练琴！10 分钟爬格子也好过没有。',
      icon: '/icon.svg',
    })
  } catch {
    /* 通知/标记失败不阻塞应用 */
  }
}
watch(shouldRemind, maybeSystemNotify, { immediate: true })

const fmt = (s) => {
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分` : `${m} 分钟`
}
const todayText = computed(() => fmt(practice.todaySeconds))
const max7 = computed(() => Math.max(...practice.last7Days.map((d) => d.seconds), 60))

// 今日练习包：读规则引擎输出（上周练得少时显示 10 分钟档，否则 30 分钟档）
const plan = computed(() => planStore.plan)
const packItems = computed(() => (plan.value.mode === 'reduce' ? plan.value.packs[10] : plan.value.packs[30]))
</script>

<template>
  <div>
    <h1 class="page-title">今天练琴了吗？</h1>

    <div v-if="shouldRemind" class="card remind-banner">
      <Icon name="bell" :size="16" />
      <span>到点啦，今天还没练琴！10 分钟爬格子也好过没有。</span>
    </div>

    <div class="home-grid">
      <div class="home-main">
        <div class="card hero">
          <div class="hero-main">
            <div class="hero-num">{{ todayText }}</div>
            <div class="dim small">今日累计练习</div>
          </div>
          <!-- v0.10.1：连续打卡并入 hero 卡（手机/桌面统一三区），不再单独一张卡 -->
          <div class="hero-side">
            <div class="hero-streak">{{ practice.streakDays }} 天</div>
            <div class="dim small">连续打卡</div>
          </div>
          <router-link v-if="isDesktop" to="/practice" class="btn btn-primary hero-btn">开始练习</router-link>
        </div>

        <router-link v-if="!isDesktop" to="/practice" class="btn btn-primary btn-block">开始练习</router-link>

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
      </div>

      <div class="home-side">
        <div class="card">
          <h2>今日练习包（弹性）</h2>
          <div v-for="t in packItems" :key="t.kind + t.ref" class="list-row">
            <span class="tag">{{ t.minutes }} 分钟</span>
            <router-link
              v-if="t.kind === 'song'"
              :to="`/songs/${t.ref}`"
              class="small pack-link"
            >{{ t.title }}</router-link>
            <router-link
              v-else-if="t.kind === 'basic'"
              :to="`/plan-item/basic/${t.ref}`"
              class="small pack-link"
            >{{ t.title }}</router-link>
            <span v-else class="small">{{ t.title }}</span>
          </div>
          <p v-if="plan.tierNote" class="small" style="margin-top: 8px; color: var(--accent-dark)">
            {{ plan.tierNote }}
          </p>
          <p class="muted" style="margin-top: 8px">
            时间不固定？从 10 分钟档开始。完整三档与完成打勾见「计划」。
          </p>
          <router-link to="/plan" class="small" style="color: var(--accent-dark)">看完整计划 →</router-link>
        </div>

        <div class="card">
          <h2>练琴提醒</h2>
          <p v-if="settings.reminders.enabled" class="small">每天 {{ settings.reminders.time }} 提醒（应用内）</p>
          <p v-else class="small muted">未开启</p>
          <router-link to="/reminders" class="small" style="color: var(--accent-dark)">去设置</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-grid { display: grid; grid-template-columns: 1fr; }
.home-main, .home-side { min-width: 0; }
.hero { display: flex; justify-content: space-between; align-items: center; }
.hero-num { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
.hero-streak { font-size: 22px; font-weight: 800; color: var(--accent); }
.hero-side { text-align: right; }
.hero-btn { flex: none; }
.remind-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent-dark);
  border-left: 3px solid var(--accent);
}
.week-bars { display: flex; gap: 8px; height: 90px; align-items: flex-end; }
.week-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: 4px; }
.week-bar { width: 100%; max-width: 34px; background: var(--bar); border-radius: 3px 3px 0 0; }
.week-bar.today { background: var(--accent); }
.week-label { font-size: 11px; }
.list-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.pack-link { color: var(--text); font-weight: 600; text-decoration: none; border-bottom: 1px dashed var(--border); }

@media (min-width: 768px) {
  .home-grid { grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
  .home-side .card { margin-bottom: 16px; }
  .hero-num { font-size: 36px; }
}
</style>
