<script setup>
import { computed } from 'vue'
import { usePracticeStore } from '../stores/practice'
import { usePlanStore } from '../stores/plan'
import { useSongsStore } from '../stores/songs'
import { FUNDAMENTALS } from '../data/fundamentals.js'
import { weekStartOf, shiftDays, fmt } from '../utils/planEngine.js'

const practice = usePracticeStore()
const planStore = usePlanStore()
const songsStore = useSongsStore()

const today = computed(() => fmt(new Date()))

// 每日分钟聚合
const minutesByDay = computed(() => {
  const map = {}
  for (const r of practice.records) {
    map[r.date] = (map[r.date] || 0) + Math.round((r.seconds || 0) / 60)
  }
  return map
})

// 近 4 周（含本周）柱状图
const weeks4 = computed(() => {
  const thisWeek = weekStartOf(today.value)
  return [3, 2, 1, 0].map((ago) => {
    const start = shiftDays(thisWeek, -7 * ago)
    let minutes = 0
    let days = 0
    for (let i = 0; i < 7; i++) {
      const d = shiftDays(start, i)
      if (minutesByDay.value[d]) {
        minutes += minutesByDay.value[d]
        days++
      }
    }
    return { start, minutes, days }
  })
})
const weeksMax = computed(() => Math.max(30, ...weeks4.value.map((w) => w.minutes)))

// 本周 vs 上周
const weekSummary = computed(() => {
  const cur = weeks4.value[3]
  const prev = weeks4.value[2]
  return { cur, prev }
})

// 月度热力图
const monthGrid = computed(() => {
  const t = today.value
  const year = Number(t.slice(0, 4))
  const month = Number(t.slice(5, 7))
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const offset = first.getDay() === 0 ? 6 : first.getDay() - 1 // 周一起始
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date: ds, minutes: minutesByDay.value[ds] || 0 })
  }
  return { cells, title: `${year} 年 ${month} 月` }
})

function heatClass(min) {
  if (min <= 0) return 'h0'
  if (min < 10) return 'h1'
  if (min < 30) return 'h2'
  return 'h3'
}

const basics = computed(() =>
  FUNDAMENTALS.map((f) => ({ ...f, doneAt: planStore.basicsDone[f.id] || null })),
)

const songsStatus = computed(() => {
  const list = Object.entries(planStore.songStatus)
    .map(([id, v]) => {
      const s = songsStore.byId(id)
      return { id, title: s ? s.title : '未知歌曲', state: v.state, date: v.date }
    })
    .sort((a, b) => (a.date >= b.date ? -1 : 1))
  return list
})
</script>

<template>
  <div>
    <h1 class="page-title">统计报表</h1>

    <div class="card">
      <h2>本周概览</h2>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-num">{{ weekSummary.cur.days }}</div>
          <div class="dim small">练琴天数（目标 4 天）</div>
        </div>
        <div class="stat">
          <div class="stat-num">{{ weekSummary.cur.minutes }}</div>
          <div class="dim small">本周分钟</div>
        </div>
        <div class="stat">
          <div class="stat-num">{{ weekSummary.prev.days }}</div>
          <div class="dim small">上周天数</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>近 4 周趋势</h2>
      <div class="week-bars">
        <div v-for="w in weeks4" :key="w.start" class="week-col">
          <div
            class="week-bar"
            :class="{ today: w.start === weekSummary.cur.start }"
            :style="{ height: Math.max(4, (w.minutes / weeksMax) * 100) + '%' }"
          ></div>
          <div class="week-val dim small">{{ w.minutes }}</div>
          <div class="dim small">{{ w.start.slice(5).replace('-', '/') }} 周</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>{{ monthGrid.title }} 热力图</h2>
      <div class="heat-grid">
        <div
          v-for="(c, i) in monthGrid.cells"
          :key="i"
          class="heat-cell"
          :class="c ? heatClass(c.minutes) : 'empty'"
          :title="c ? `${c.date}：${c.minutes} 分钟` : ''"
        >
          {{ c ? c.day : '' }}
        </div>
      </div>
      <div class="heat-legend dim small">
        <span class="heat-cell h0">0</span> 0
        <span class="heat-cell h1">0</span> 1~9
        <span class="heat-cell h2">0</span> 10~29
        <span class="heat-cell h3">0</span> 30+ 分钟
      </div>
    </div>

    <div class="card">
      <h2>基本功清单</h2>
      <div v-for="b in basics" :key="b.id" class="list-row">
        <span class="tag" :class="{ on: b.doneAt }" @click="planStore.toggleBasic(b.id)">
          {{ b.doneAt ? '已达标（点此撤销）' : '未达标' }}
        </span>
        <div>
          <div class="small" style="font-weight: 600">{{ b.name }}</div>
          <div class="dim small">{{ b.goal }}</div>
        </div>
        <span v-if="b.doneAt" class="dim small" style="margin-left: auto">{{ b.doneAt.slice(5) }}</span>
      </div>
      <p class="muted small" style="margin-top: 8px">点击状态标签可标记或撤销达标。</p>
    </div>

    <div class="card">
      <h2>歌曲掌握</h2>
      <p v-if="!songsStatus.length" class="muted small">还没标记过歌曲状态，去歌曲详情页或计划页标记吧。</p>
      <div v-for="s in songsStatus" :key="s.id" class="list-row">
        <span class="tag" :class="{ on: s.state === 'mastered' }">
          {{ s.state === 'mastered' ? '已掌握' : '练习中' }}
        </span>
        <router-link :to="`/songs/${s.id}`" class="small song-link">{{ s.title }}</router-link>
        <span class="dim small" style="margin-left: auto">{{ s.date.slice(5) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-row { display: flex; gap: 12px; }
.stat { flex: 1; text-align: center; }
.stat-num { font-size: 26px; font-weight: 800; color: var(--accent); }

.week-bars { display: flex; gap: 10px; height: 110px; align-items: flex-end; }
.week-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 3px; }
.week-bar { width: 100%; max-width: 40px; background: #d6d3cb; border-radius: 3px 3px 0 0; }
.week-bar.today { background: var(--accent); }
.week-val { font-weight: 700; }

.heat-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.heat-cell {
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  border-radius: 4px; font-size: 12px; color: var(--text-dim); background: var(--bg-input);
}
.heat-cell.empty { background: transparent; }
.heat-cell.h1 { background: #f6c9cd; }
.heat-cell.h2 { background: #e89aa1; }
.heat-cell.h3 { background: var(--accent); color: #fff; font-weight: 700; }
.heat-legend { display: flex; align-items: center; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.heat-legend .heat-cell { width: 18px; aspect-ratio: 1; font-size: 0; }

.list-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.list-row:last-child { margin-bottom: 0; }
.song-link { color: var(--text); }
</style>
