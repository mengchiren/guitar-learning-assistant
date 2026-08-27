<script setup>
// 听力训练（v0.16.0，工程对标路线第 4 阶段第 1 项）：
// 三关生成式题库——空弦音名 / 和弦性质 / 常见音程。
// 纯逻辑在 utils/earTraining.js（可注入随机源做确定性单测），本视图只负责：
// Web Audio 播放合成拨弦音 + 作答交互 + 本机最佳纪录。
defineOptions({ name: 'EarTrainingView' })
import { ref, computed, onUnmounted } from 'vue'
import { LEVELS, makeQuestion, gradeAnswer, optionsOf, QUESTIONS_PER_ROUND } from '../utils/earTraining.js'
import { load, save } from '../utils/storage.js'

const BEST_KEY = 'ear-best'

const phase = ref('select') // select | quiz | done
const level = ref(null)
const qNo = ref(0)
const score = ref(0)
const streak = ref(0)
const maxStreak = ref(0)
const picked = ref(-1)
const resultKind = ref('') // '' | 'ok' | 'bad'
const bests = ref(load(BEST_KEY, {}))

// 答案只在闭包里（避免进响应式被 devtools 泄露）；作答后把「要揭示的正确项」放这个 ref
const revealIndex = ref(-1)

// 题目本体不进响应式
let curAnswer = -1
let curAudio = null

const options = computed(() => (level.value ? optionsOf(level.value.id) : []))
const levelInfo = computed(() => LEVELS.find((l) => l === level.value))

// ---- 音频播放：懒创建 AudioContext（首次点击手势内创建/resume，满足 iOS 自动播放策略）----
let ctx = null

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function pluck(freq, when) {
  const c = ensureCtx()
  const osc = c.createOscillator()
  const filter = c.createBiquadFilter()
  const gain = c.createGain()
  osc.type = 'triangle'
  osc.frequency.value = freq
  filter.type = 'lowpass'
  filter.frequency.value = 2400
  filter.Q.value = 0.8
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(0.32, when + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.15)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  osc.start(when)
  osc.stop(when + 1.2)
}

async function playQuestion() {
  if (!curAudio) return
  const c = ensureCtx()
  await c.resume().catch(() => {})
  const t0 = c.currentTime + 0.06
  const notes = curAudio.notes || []
  if (curAudio.type === 'twoNote') {
    pluck(notes[0], t0)
    pluck(notes[1], t0 + 0.42)
  } else {
    notes.forEach((f, i) => pluck(f, t0 + i * 0.03)) // 扫弦感：三音微错开
  }
}

// ---- 流程 ----
function startRound(lv) {
  level.value = lv
  phase.value = 'quiz'
  qNo.value = 1
  score.value = 0
  streak.value = 0
  maxStreak.value = 0
  newQuestion(true)
}

function newQuestion(autoPlay) {
  picked.value = -1
  resultKind.value = ''
  revealIndex.value = -1
  const q = makeQuestion(level.value.id, Math.random)
  curAnswer = q.answer
  curAudio = q.audio
  if (autoPlay) playQuestion()
}

function pickOption(i) {
  if (resultKind.value !== '') return // 已作答锁定
  picked.value = i
  const okFlag = gradeAnswer({ answer: curAnswer }, i)
  resultKind.value = okFlag ? 'ok' : 'bad'
  revealIndex.value = curAnswer
  if (okFlag) {
    score.value++
    streak.value++
    maxStreak.value = Math.max(maxStreak.value, streak.value)
  } else {
    streak.value = 0
  }
}

function nextOrFinish() {
  if (qNo.value >= QUESTIONS_PER_ROUND) finishRound()
  else {
    qNo.value++
    newQuestion(false) // 「下一题」点击本身是手势，直接播
  }
}

const roundPercent = computed(() =>
  Math.round((score.value / QUESTIONS_PER_ROUND) * 100),
)

function finishRound() {
  const id = level.value.id
  const prev = bests.value[id] || { score: 0 }
  if (score.value > prev.score) {
    const next = { ...bests.value, [id]: { score: score.value, maxStreak: maxStreak.value, at: Date.now() } }
    bests.value = next
    try {
      save(BEST_KEY, next)
    } catch (e) {
      console.error('[ear-training] 最佳纪录保存失败', e)
    }
  }
  phase.value = 'done'
}

const isBestNow = computed(() =>
  bests.value[level.value?.id]?.score === score.value && score.value > 0,
)

onUnmounted(() => {
  try {
    ctx && ctx.close()
  } catch { /* noop */ }
})
</script>

<template>
  <div class="narrow">
    <h1 class="page-title">听力训练</h1>

    <!-- 选关 -->
    <template v-if="phase === 'select'">
      <div v-for="l in LEVELS" :key="l.id" class="card">
        <h2>{{ l.name }}</h2>
        <p class="muted small">{{ l.desc }}</p>
        <p class="dim small">{{ l.why }}</p>
        <div class="btn-row" style="margin-top: 10px">
          <button class="btn btn-primary" @click="startRound(l)">开始本关</button>
          <span class="tag" :class="{ on: (bests[l.id]?.score ?? 0) > 0 }">
            最佳 {{ bests[l.id]?.score ?? '—' }}/{{ QUESTIONS_PER_ROUND }}
          </span>
        </div>
      </div>
      <p class="muted small">
        逐题作答后立即反馈；每关随机出题、无题库上限。最佳纪录只存在本机浏览器（不上云）。
      </p>
    </template>

    <!-- 作答中 -->
    <template v-else-if="phase === 'quiz'">
      <div class="card">
        <div class="quiz-head">
          <span class="dim small">第 {{ qNo }}/{{ QUESTIONS_PER_ROUND }} 题 · {{ level.name }}</span>
          <span class="dim small">得分 {{ score }}{{ streak > 1 ? ` · 连对 ${streak}` : '' }}</span>
        </div>

        <button class="btn btn-primary btn-block" @click="playQuestion">
          🔊 播放题目（任何时候都可以重听）
        </button>

        <div class="opts">
          <button
            v-for="(o, i) in options"
            :key="i"
            class="tag opt"
            :class="{
              locked: resultKind !== '',
              'reveal-right': revealIndex === i,
              'reveal-miss': resultKind === 'bad' && picked === i,
            }"
            @click="pickOption(i)"
          >
            {{ o }}
          </button>
        </div>

        <p v-if="resultKind === 'ok'" class="small" style="color: var(--ok); margin-top: 12px">✓ 回答正确，继续保持！</p>
        <p v-else-if="resultKind === 'bad'" class="small" style="color: var(--danger); margin-top: 12px">
          ✗ 正确答案是「{{ options[revealIndex] }}」——可以重听一遍找不同。
        </p>
        <p v-else class="muted small" style="margin-top: 12px">{{ level.why }}</p>

        <div class="btn-row" style="margin-top: 14px">
          <button class="btn btn-primary" :disabled="!resultKind" @click="nextOrFinish">
            {{ qNo >= QUESTIONS_PER_ROUND ? '查看成绩' : '下一题' }}
          </button>
          <button class="btn" @click="phase = 'select'">退出本关</button>
        </div>
      </div>
    </template>

    <!-- 结算 -->
    <template v-else-if="phase === 'done'">
      <div class="card" style="text-align: center">
        <h2>本关成绩</h2>
        <div class="score-big">{{ score }}/{{ QUESTIONS_PER_ROUND }}（{{ roundPercent }} 分）</div>
        <p class="dim small">最长连对 {{ maxStreak }} 次</p>
        <p class="small" style="margin-top: 8px">
          本关最佳纪录：<strong>{{ bests[level.id]?.score ?? 0 }}/{{ QUESTIONS_PER_ROUND }}</strong>
          <span v-if="isBestNow" style="color: var(--ok)">· 新纪录！🎉</span>
        </p>
        <div class="btn-row" style="justify-content: center; margin-top: 14px">
          <button class="btn btn-primary" @click="startRound(level)">再来一轮</button>
          <button class="btn" @click="phase = 'select'">换一关</button>
        </div>
        <p class="muted small" style="margin-top: 14px">练耳是慢功夫：每天两三轮，比一次练很久有用。</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.quiz-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.opts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.opt {
  cursor: pointer;
  font-size: 15px;
}
.opt.locked {
  cursor: default;
  opacity: 0.55;
}
/* 锁定后：正确项高亮、误选项标红 */
.opt.reveal-right {
  border-color: var(--ok);
  color: var(--ok);
  opacity: 1;
}
.opt.reveal-miss {
  border-color: var(--danger);
  color: var(--danger);
  opacity: 1;
}
.score-big {
  font-size: 44px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin: 6px 0;
}
@media (max-width: 767px) {
  .opts { display: grid; grid-template-columns: repeat(2, 1fr); }
  /* 第 1 关六个选项在手机上两列更稳 */
}
</style>
