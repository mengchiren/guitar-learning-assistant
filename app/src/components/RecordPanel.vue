<script setup>
import { ref, onUnmounted, computed } from 'vue'
import { useRecordingsStore, RECORD_CATEGORIES } from '../stores/recordings'
import { analyzeRecordingBlob } from '../utils/recordAnalyze'
import { localDateStr } from '../utils/date'
import { useSongsStore } from '../stores/songs'

const recordings = useRecordingsStore()
const songs = useSongsStore()

const MAX_SEC = 600 // 单次最长 10 分钟

const status = ref('idle') // idle | recording | saving
const secs = ref(0)
const error = ref('')
const savedTip = ref(false)

const analyzing = ref(false)
const lastBlob = ref(null)
const lastMime = ref('')
const bpm = ref(null)
const bpmConf = ref(null)
const bpmManual = ref(false)
const category = ref('自由练习')
const songId = ref('')
const note = ref('')

let mediaRecorder = null
let chunks = []
let stream = null
let recTimer = null

const clock = computed(() => {
  const m = String(Math.floor(secs.value / 60)).padStart(2, '0')
  const s = String(secs.value % 60).padStart(2, '0')
  return `${m}:${s}`
})

function pickMime() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m
  }
  return ''
}

function fmtSec(total) {
  const m = Math.floor(total / 60)
  const s = Math.round(total % 60)
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`
}

async function startRec() {
  error.value = ''
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    error.value = '当前环境不支持麦克风录音（手机浏览器需要 HTTPS 打开的正式地址，局域网 http 不行）。'
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (e) {
    error.value =
      e.name === 'NotAllowedError'
        ? '麦克风权限被拒绝，请在浏览器设置里允许本站使用麦克风后重试。'
        : '无法使用麦克风，请检查设备后重试。'
    return
  }
  chunks = []
  const mime = pickMime()
  try {
    mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  } catch {
    mediaRecorder = new MediaRecorder(stream)
  }
  lastMime.value = mediaRecorder.mimeType || 'audio/webm'
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data)
  }
  mediaRecorder.onstop = onStop
  mediaRecorder.start(1000) // 每秒落一块，异常中断也尽量保数据
  status.value = 'recording'
  secs.value = 0
  recTimer = setInterval(() => {
    secs.value++
    if (secs.value >= MAX_SEC) stopRec()
  }, 1000)
}

function stopRec() {
  if (recTimer) clearInterval(recTimer)
  recTimer = null
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
}

async function onStop() {
  let blob = new Blob(chunks, { type: lastMime.value })
  chunks = []
  // MediaRecorder 录的 webm 文件头不带时长 → 原生播放器进度条拖不动、总时长显示异常。
  // 保存前补写 Duration 字段（iPhone 的 mp4 没这个问题）。补写失败就保留原文件，不影响保存。
  if (lastMime.value.startsWith('audio/webm')) {
    try {
      const { default: fixWebmDuration } = await import('fix-webm-duration')
      blob = await fixWebmDuration(blob, secs.value * 1000)
    } catch {
      // 忽略：极端格式补写失败仍按原 blob 保存
    }
  }
  lastBlob.value = blob
  status.value = 'saving'
  analyzing.value = true
  bpm.value = null
  bpmConf.value = null
  bpmManual.value = false
  const result = await analyzeRecordingBlob(blob)
  analyzing.value = false
  if (result && result.bpm > 0) {
    bpm.value = result.bpm
    bpmConf.value = result.confidence
  }
}

function onBpmInput() {
  bpmManual.value = true
}

async function saveRec() {
  if (lastBlob.value && secs.value >= 1) {
    const song = songId.value ? songs.allSongs.find((s) => s.id === songId.value) : null
    await recordings.add({
      blob: lastBlob.value,
      meta: {
        date: localDateStr(),
        seconds: Math.max(1, secs.value),
        category: category.value,
        songId: song ? song.id : '',
        songName: song ? song.title : '',
        bpm: bpm.value ? Number(bpm.value) : null,
        bpmConf: bpmManual.value ? null : bpmConf.value,
        bpmManual: bpmManual.value,
        note: note.value,
        mimeType: lastMime.value,
      },
    })
  }
  resetPanel()
  savedTip.value = true
  setTimeout(() => (savedTip.value = false), 4000)
}

function discardRec() {
  resetPanel()
}

function resetPanel() {
  status.value = 'idle'
  secs.value = 0
  lastBlob.value = null
  bpm.value = null
  bpmConf.value = null
  bpmManual.value = false
  category.value = '自由练习'
  songId.value = ''
  note.value = ''
  error.value = ''
}

onUnmounted(() => {
  // 录音中离开页面：停止录音（不保存），避免麦克风占用不释放
  if (status.value === 'recording') {
    if (recTimer) clearInterval(recTimer)
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      stream = null
    }
  }
})
</script>

<template>
  <div>
    <p class="muted small" style="margin-bottom: 10px">
      用麦克风录下练习（单次最长 10 分钟），存本机浏览器、不出设备；录完自动测 BPM 对拍。
    </p>

    <p v-if="error" class="small" style="color: var(--danger); margin-bottom: 8px">{{ error }}</p>

    <!-- 录音中 -->
    <div v-if="status === 'recording'" class="rec-box">
      <div class="rec-row">
        <span class="rec-dot"></span>
        <span class="rec-clock">{{ clock }}</span>
      </div>
      <p class="small dim">正在录音…练完点「停止」，切走本页会停止录音。</p>
      <button class="btn btn-block" style="margin-top: 10px" @click="stopRec">停止</button>
    </div>

    <!-- 保存表单 -->
    <div v-else-if="status === 'saving'">
      <div class="rec-row">
        <span class="rec-dot stopped"></span>
        <span>已录 {{ fmtSec(secs) }}</span>
      </div>

      <div v-if="analyzing" class="small dim" style="margin: 8px 0">正在测 BPM…</div>
      <div v-else-if="bpm" class="small" style="margin: 8px 0">
        测得约 <strong>{{ bpm }} BPM</strong>
        <span v-if="!bpmManual && bpmConf" class="dim">（置信度 {{ bpmConf }}）</span>
        <span v-if="bpmManual" class="dim">（已手动修改）</span>
        <span v-if="!bpmManual && !bpmConf" class="dim">（仅供对拍参考）</span>
      </div>
      <div v-else class="small dim" style="margin: 8px 0">自动对拍没测出来（太短或环境噪音），可手动填或留空。</div>

      <label>BPM（对拍结果，可改）</label>
      <input type="number" v-model="bpm" min="30" max="300" placeholder="例如 60" @input="onBpmInput" />

      <label style="margin-top: 10px">分类</label>
      <div class="tag-row" style="margin-top: 6px">
        <span
          v-for="c in RECORD_CATEGORIES"
          :key="c"
          class="tag"
          :class="{ on: category === c }"
          @click="category = c"
        >
          {{ c }}
        </span>
      </div>

      <template v-if="category === '歌曲'">
        <label style="margin-top: 10px">关联歌曲</label>
        <select v-model="songId">
          <option value="">不关联</option>
          <option v-for="s in songs.allSongs" :key="s.id" :value="s.id">{{ s.title }}</option>
        </select>
      </template>

      <label style="margin-top: 10px">备注</label>
      <textarea v-model="note" rows="2" placeholder="例如：跟节拍器 80，到副歌抢拍"></textarea>

      <div class="btn-row" style="margin-top: 12px">
        <button class="btn btn-primary" @click="saveRec">保存录音</button>
        <button class="btn" @click="discardRec">丢弃</button>
      </div>
    </div>

    <!-- 空闲 -->
    <div v-else>
      <button class="btn btn-primary btn-block" @click="startRec">开始录音</button>
      <p v-if="savedTip" class="small" style="color: var(--ok); margin-top: 8px">
        已保存，可在「工具 → 录音回听」里回放。
      </p>
    </div>
  </div>
</template>

<style scoped>
.rec-box { text-align: center; padding: 8px 0 2px; }
.rec-row { display: flex; align-items: center; gap: 10px; font-weight: 700; }
.rec-clock { font-size: 28px; font-variant-numeric: tabular-nums; }
.rec-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--danger, #e30613);
  animation: blink 1s infinite;
  flex-shrink: 0;
}
.rec-dot.stopped { background: var(--text-dim); animation: none; }
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}
</style>
