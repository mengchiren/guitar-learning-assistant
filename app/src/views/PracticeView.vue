<script setup>
import { ref, computed } from 'vue'
import { usePracticeStore } from '../stores/practice.js'
import { useTimerStore } from '../stores/timer.js'
import { localDateStr, fmtClock } from '../utils/date.js'
import RecordPanel from '../components/RecordPanel.vue'

const practice = usePracticeStore()
const timer = useTimerStore()

const TAG_OPTIONS = ['歌曲', '基本功', '课程', '自由练习']
const saved = ref(false)
const backfillDate = ref(localDateStr())
const backfillMinutes = ref(30)
const backfillDone = ref(false)

// 打卡草稿（v0.8.0）存 practice.draft 并自动落盘：结束计时后离开/进程被杀，
// 重开应用标签/备注还在，能继续完成保存（与 timer 会话恢复配套）。
const draft = practice.draft
const finished = computed(() => draft.finished)
const tags = computed(() => draft.tags)
const note = computed({
  get: () => draft.note,
  set: (v) => (draft.note = v),
})

const clock = computed(() => fmtClock(timer.elapsedSec))

function toggleTag(t) {
  const i = draft.tags.indexOf(t)
  if (i >= 0) draft.tags.splice(i, 1)
  else draft.tags.push(t)
}

function finish() {
  timer.stop()
  draft.finished = true
}

function saveRecord() {
  const secs = Math.max(1, Math.round(timer.elapsedSec))
  practice.addRecord({
    date: localDateStr(),
    seconds: secs,
    tags: [...draft.tags],
    note: draft.note,
  })
  timer.reset()
  draft.finished = false
  draft.tags = []
  draft.note = ''
  saved.value = true
}

function backfill() {
  const secs = Math.max(1, Math.round(Number(backfillMinutes.value) * 60))
  practice.addRecord({ date: backfillDate.value, seconds: secs, tags: ['补卡'], note: note.value || '手动补卡' })
  backfillDone.value = true
  setTimeout(() => (backfillDone.value = false), 3000)
}
</script>

<template>
  <div class="narrow">
    <h1 class="page-title">练习计时</h1>

    <div class="card clock-card">
      <div class="clock">{{ clock }}</div>
      <div class="dim small">{{ timer.running ? '练习中…（切到其他页面计时也不会停）' : '开始后计时，练完点「结束打卡」' }}</div>
      <div class="dim small" style="margin-top: 4px">今日已打卡 {{ Math.floor(practice.todaySeconds / 60) }} 分钟</div>
    </div>

    <div v-if="!finished" class="btn-row">
      <button v-if="!timer.running" class="btn btn-primary" @click="timer.start()">开始</button>
      <button v-else class="btn" @click="timer.pause()">暂停</button>
      <button class="btn" @click="finish()" :disabled="timer.elapsedSec < 1">结束打卡</button>
    </div>

    <div v-if="finished && !saved" class="card">
      <h2>这次练了什么？</h2>
      <p class="small dim">时长 {{ Math.round(timer.elapsedSec / 60) }} 分钟</p>
      <div class="tag-row" style="margin-top: 8px">
        <span v-for="t in TAG_OPTIONS" :key="t" class="tag" :class="{ on: tags.includes(t) }" @click="toggleTag(t)">
          {{ t }}
        </span>
      </div>
      <label>备注（练了什么、遇到什么问题）</label>
      <textarea v-model="note" rows="3" placeholder="例如：爬格子到 60 速度，G 换 C 还不顺"></textarea>
      <button class="btn btn-primary btn-block" style="margin-top: 12px" @click="saveRecord">保存打卡</button>
    </div>

    <div v-if="saved" class="card" style="text-align: center">
      <p style="font-size: 20px; font-weight: 800">打卡成功</p>
      <p class="dim small" style="margin: 8px 0">
        今日累计 {{ Math.floor(practice.todaySeconds / 60) }} 分钟，连续 {{ practice.streakDays }} 天
      </p>
      <router-link to="/" class="btn btn-block">回首页</router-link>
    </div>

    <div v-if="!finished" class="card">
      <h2>练琴录音</h2>
      <RecordPanel />
    </div>

    <div v-if="!finished" class="card">
      <h2>补卡</h2>
      <p class="muted small">漏记了？手动补一条记录。</p>
      <label>日期</label>
      <input type="date" v-model="backfillDate" />
      <label>时长（分钟）</label>
      <input type="number" v-model="backfillMinutes" min="1" max="600" />
      <button class="btn btn-block" style="margin-top: 12px" @click="backfill">补卡</button>
      <p v-if="backfillDone" class="small" style="color: var(--ok); margin-top: 8px">已补卡</p>
    </div>
  </div>
</template>

<style scoped>
.clock-card { text-align: center; padding: 24px 16px; }
.clock { font-size: 56px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -1px; margin-bottom: 6px; }
</style>
