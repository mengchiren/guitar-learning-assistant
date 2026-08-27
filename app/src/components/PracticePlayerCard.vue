<script setup>
// 跟练播放器（v0.14.0，参考 trouch/Practice-Loooper 的极简思路 + 商业 AB 循环练习器的核心交互）：
// 本地音频临时选入做 AB 循环 + 变速播放——
// 红线：音频只在本次会话内存里（objectURL），关闭页面即释放，不上传、不落 IndexedDB；
// 循环点标记是纯数字结构化数据，存 localStorage 随备份走，但不进云同步白名单（本机态策略同之前一致）。
// 变速用浏览器原生 playbackRate + preservesPitch，零依赖零体积增量。
import { ref, computed, watch, onUnmounted } from 'vue'
import { load, save } from '../utils/storage.js'
import { fmtClock } from '../utils/date.js'

const props = defineProps({
  songId: { type: String, required: true },
  // 已归一化的有效 BPM（纠错 > 手动 > 分析 > 种子值），用于换算当前倍速下的等效速度提示
  bpm: { type: Number, default: 0 },
})

const LOOP_KEY = 'practice-loops'

const fileInput = ref(null)
const el = ref(null) // <audio>
const fileUrl = ref('')
const fileName = ref('')
const playing = ref(false)
const cur = ref(0)
const dur = ref(0)
const rate = ref(1)
const aPoint = ref(null)
const bPoint = ref(null)
const err = ref('')

const RATES = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1]
// 与添加歌曲页同一份拒绝清单（kgg 等加密格式解不开，见 HANDOFF 坑 2）
const ENCRYPTED_EXTS = ['kgg', 'mflac', 'kgm', 'qmcflac', 'qmc0', 'qmc3']

function readAll() {
  return load(LOOP_KEY, {})
}
function persistMarks() {
  const map = readAll()
  map[props.songId] = { a: aPoint.value, b: bPoint.value }
  try {
    save(LOOP_KEY, map)
  } catch (e) {
    console.error('[practice-player] 循环点保存失败', e)
  }
}
function restoreMarks(d) {
  const m = readAll()[props.songId]
  if (!m || !d || !Number.isFinite(d)) {
    aPoint.value = null
    bPoint.value = null
    return
  }
  // 标记可能来自不同版本音频文件，超时长的一律丢弃不猜
  aPoint.value = m.a != null && m.a < d ? m.a : null
  bPoint.value = m.b != null && m.b <= d ? m.b : null
}

watch(
  () => props.songId,
  () => {
    resetFile()
  },
)

function resetFile() {
  stopAudio()
  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value)
  fileUrl.value = ''
  fileName.value = ''
  cur.value = 0
  dur.value = 0
  rate.value = 1
  aPoint.value = null
  bPoint.value = null
  err.value = ''
}

function pickFile() {
  fileInput.value?.click()
}

function onPick(e) {
  const f = e.target.files?.[0]
  e.target.value = '' // 允许重复选择同一文件
  if (!f) return
  const ext = f.name.split('.').pop().toLowerCase()
  if (ENCRYPTED_EXTS.includes(ext)) {
    err.value = '这是加密格式（酷狗 kgg 等），浏览器解不开。请换 mp3/flac/wav 等通用格式。'
    return
  }
  err.value = ''
  resetFile()
  fileUrl.value = URL.createObjectURL(f)
  fileName.value = f.name
}

function onMeta(e) {
  const d = e.target.duration
  if (!Number.isFinite(d)) {
    // webm 头缺 Duration 是老熟人了（录音页踩过，坑 25⑤）；源文件一般 mp3/flac 不受影响
    err.value = '这个音频文件的时长信息读不出来，AB 循环没法工作，请换 mp3 版本。'
    return
  }
  dur.value = d
  restoreMarks(d)
  // 换了新文件也把倍速控制权重新套一遍（playbackRate 属性会跨媒体加载残留）
  setRate(rate.value)
}

function togglePlay() {
  const au = el.value
  if (!au) return
  if (au.paused) au.play()
  else au.pause()
}
function onPlayState() {
  playing.value = !!el.value && !el.value.paused
}

function nudge(sec) {
  const au = el.value
  if (!au) return
  au.currentTime = Math.max(0, Math.min(dur.value - 0.01, au.currentTime + sec))
}
function mark(pt) {
  const au = el.value
  if (!au || !dur.value) return
  if (pt === 'A') aPoint.value = au.currentTime
  else bPoint.value = au.currentTime
  // 允许先标 B 后标 A；生效时统一按小到大处理（见 loopBounds）
  persistMarks()
}
function clearLoop() {
  aPoint.value = null
  bPoint.value = null
  persistMarks()
}
function jumpToA() {
  const au = el.value
  if (au && loopBounds.value) au.currentTime = loopBounds.value[0]
}

function setRate(r) {
  rate.value = r
  const au = el.value
  if (!au) return
  au.playbackRate = r
  // 变速不变调：Chrome/Firefox 用 preservesPitch，旧版 Safari 用 webkitPreservesPitch
  try {
    au.preservesPitch = true
  } catch { /* noop */ }
  try {
    au.webkitPreservesPitch = true
  } catch { /* noop */ }
}

const loopBounds = computed(() => {
  if (aPoint.value == null || bPoint.value == null) return null
  const lo = Math.min(aPoint.value, bPoint.value)
  const hi = Math.max(aPoint.value, bPoint.value)
  return hi - lo > 0.15 ? [lo, hi] : null
})

function onTimeUpdate() {
  const au = el.value
  if (!au) return
  cur.value = au.currentTime
  const lb = loopBounds.value
  if (lb && au.currentTime >= lb[1]) au.currentTime = lb[0] // 跳回 A 点实现循环
}

function stopAudio() {
  const au = el.value
  if (au) {
    try {
      au.pause()
      au.removeAttribute('src')
      au.load()
    } catch { /* noop */ }
  }
  playing.value = false
}

onUnmounted(() => {
  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value)
})

// 有效 BPM 提示：确认 A 点就落在小节头上的常用换算（按 4/4）
const barSeconds = computed(() => {
  const bpm = Math.round(props.bpm * rate.value * 100) / 100
  if (!bpm || bpm <= 0) return ''
  return (240 / bpm).toFixed(1)
})
</script>

<template>
  <div class="card">
    <h2>跟练播放器</h2>
    <p class="muted small">
      选入这首歌的音频，可 AB 循环抠段落、还能 0.5~1.25 倍变速跟着练。<strong>音频只在本次使用中临时存放，关闭页面即释放——不上传、不留存。</strong>
    </p>

    <input ref="fileInput" type="file" accept="audio/*,.mp3,.flac,.wav,.m4a,.ogg" hidden @change="onPick" />

    <template v-if="!fileUrl">
      <button class="btn btn-block" style="margin-top: 10px" @click="pickFile">选择音频文件开始跟练</button>
    </template>

    <template v-else>
      <div class="pp-file dim small" :title="fileName">🎵 {{ fileName }}</div>

      <audio
        ref="el"
        :src="fileUrl"
        preload="metadata"
        @play="onPlayState"
        @pause="onPlayState"
        @ended="onPlayState"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onMeta"
      ></audio>

      <div class="btn-row pp-controls" style="margin-top: 10px">
        <button class="btn btn-primary" @click="togglePlay">{{ playing ? '暂停' : '播放' }}</button>
        <button class="btn" title="后退 1 秒" @click="nudge(-1)">−1s</button>
        <button class="btn" title="前进 1 秒" @click="nudge(1)">+1s</button>
      </div>

      <div class="dim small pp-time">{{ fmtClock(cur) }} / {{ dur ? fmtClock(dur) : '--:--' }}</div>

      <label>速度 ×{{ rate.toFixed(2) }}<span v-if="barSeconds"> · 约 {{ barSeconds }} 秒一小节（4/4）</span></label>
      <input type="range" min="0.5" max="1.25" step="0.05" :value="rate" @change="setRate(Number($event.target.value))" />
      <div class="tag-row pp-rates">
        <span
          v-for="r in RATES"
          :key="r"
          class="tag"
          :class="{ on: rate === r }"
          @click="setRate(r)"
        >×{{ r }}</span>
      </div>

      <p class="muted small" style="margin-top: 10px">
        在段落起点前一两秒按 −1s 定位，然后依次设 A/B 两点即可循环抠段落：
      </p>
      <div class="btn-row pp-controls">
        <button class="btn" :class="{ on: aPoint != null }" @click="mark('A')">设为 A 点（起点）</button>
        <button class="btn" @click="mark('B')">设为 B 点（终点）</button>
      </div>
      <div v-if="loopBounds" class="pp-loopinfo small">
        循环中：<strong>{{ fmtClock(loopBounds[0]) }} → {{ fmtClock(loopBounds[1]) }}</strong>
        （共 {{ fmtClock(loopBounds[1] - loopBounds[0]) }}）
        <span class="btn-row" style="display: inline-flex; margin-left: 8px">
          <button class="btn btn-sm-pp" @click="jumpToA">回到 A</button>
          <button class="btn btn-danger-sm pp-sm-danger" @click="clearLoop">清除循环</button>
        </span>
      </div>

      <p v-if="err" class="small" style="color: var(--danger); margin-top: 8px">{{ err }}</p>
    </template>
  </div>
</template>

<style scoped>
.pp-file {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
}
.pp-time { margin-top: 8px; font-variant-numeric: tabular-nums; }
.pp-controls { flex-wrap: wrap; }
.pp-rates { flex-wrap: wrap; }
.pp-loopinfo { margin-top: 6px; }
.btn-sm-pp { padding: 3px 10px; font-size: 12px; }
/* 本地小号危险按钮：SongDetailView 里同名类是 scoped 私有样式，这里不能复用 */
.btn-danger-sm.pp-sm-danger { color: var(--danger); padding: 3px 10px; font-size: 12px; }
.btn.on { border-color: var(--accent); color: var(--accent); }
audio { display: none; }
</style>
