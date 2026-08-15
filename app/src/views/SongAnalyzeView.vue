<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSongsStore } from '../stores/songs'
import { analyzeAudio } from '../utils/analyze'
import { TONE_TEMPLATES } from '../data/templates'

const router = useRouter()
const songs = useSongsStore()
const isDev = import.meta.env.DEV

const PITCH = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const KEYS = PITCH.flatMap((p) => [`${p} 大调`, `${p} 小调`])
const ENCRYPTED_EXTS = ['kgg', 'mflac', 'kgm', 'qmcflac', 'qmc0', 'qmc3']
const MAX_SIZE = 30 * 1024 * 1024

const mode = ref('analyze') // analyze | manual
const file = ref(null)
const title = ref('')
const artist = ref('')
const analyzing = ref(false)
const result = ref(null)
const error = ref('')
const mBpm = ref(null)
const mKey = ref('')
const mTemplate = ref('')
const savedFlash = ref(false)

const encrypted = computed(() => {
  const name = file.value?.name || ''
  const ext = name.split('.').pop().toLowerCase()
  return ENCRYPTED_EXTS.includes(ext)
})

function onFileChange(e) {
  error.value = ''
  result.value = null
  const f = e.target.files?.[0] || null
  file.value = f
  if (f && !title.value) title.value = f.name.replace(/\.[^.]+$/, '')
}

async function decodeFile(f) {
  const buf = await f.arrayBuffer()
  const AC = window.AudioContext || window.webkitAudioContext
  const ctx = new AC()
  try {
    const audio = await ctx.decodeAudioData(buf)
    const n = audio.length
    const out = new Float32Array(n)
    const ch0 = audio.getChannelData(0)
    if (audio.numberOfChannels > 1) {
      const ch1 = audio.getChannelData(1)
      for (let i = 0; i < n; i++) out[i] = (ch0[i] + ch1[i]) / 2
    } else {
      out.set(ch0)
    }
    return { samples: out, sampleRate: audio.sampleRate }
  } finally {
    ctx.close()
  }
}

async function runAnalyze() {
  error.value = ''
  result.value = null
  const f = file.value
  if (!f) {
    error.value = '请先选择一个音频文件。'
    return
  }
  if (encrypted.value) {
    error.value = '这是加密格式（酷狗 kgg 等），无法分析。请换用 mp3/flac/wav 等通用格式，或改用「歌名搜索 / 手动录入」。'
    return
  }
  if (f.size > MAX_SIZE) {
    error.value = '文件超过 30MB，手机内存可能吃紧。请换更小的文件（如已转码的 mp3）。'
    return
  }
  analyzing.value = true
  try {
    const { samples, sampleRate } = await decodeFile(f)
    result.value = analyzeAudio({ samples, sampleRate })
  } catch (err) {
    console.error(err)
    error.value = '浏览器无法解码这个文件（可能是非标准编码）。请换源，或改用手动录入。'
  } finally {
    analyzing.value = false
  }
}

function saveAnalysis() {
  if (!result.value) return
  const id = songs.addUserSong({
    title: title.value.trim() || file.value?.name || '未命名歌曲',
    artist: artist.value.trim() || '',
    source: 'analysis',
    fileName: file.value?.name || '',
    analysis: result.value,
  })
  router.push(`/songs/${id}`)
}

function saveManual() {
  if (!title.value.trim()) {
    error.value = '歌名不能为空。'
    return
  }
  const id = songs.addUserSong({
    title: title.value.trim(),
    artist: artist.value.trim() || '',
    source: 'manual',
    manual: {
      bpm: mBpm.value ? Math.round(Number(mBpm.value)) : null,
      key: mKey.value || null,
      template: mTemplate.value || null,
    },
  })
  savedFlash.value = true
  setTimeout(() => router.push(`/songs/${id}`), 400)
}

// 开发环境专用：IAB 不支持文件选择器，用它加载 public/ 下的测试音频走同一管线
async function loadDevTest() {
  error.value = ''
  analyzing.value = true
  try {
    const resp = await fetch('/test-audio.mp3')
    if (!resp.ok) throw new Error('test audio not found')
    const buf = await resp.arrayBuffer()
    const AC = window.AudioContext || window.webkitAudioContext
    const ctx = new AC()
    let samples
    let sampleRate
    try {
      const audio = await ctx.decodeAudioData(buf)
      const n = audio.length
      samples = new Float32Array(n)
      const ch0 = audio.getChannelData(0)
      if (audio.numberOfChannels > 1) {
        const ch1 = audio.getChannelData(1)
        for (let i = 0; i < n; i++) samples[i] = (ch0[i] + ch1[i]) / 2
      } else {
        samples.set(ch0)
      }
      sampleRate = audio.sampleRate
    } finally {
      ctx.close()
    }
    title.value = title.value || '开发测试音频'
    result.value = analyzeAudio({ samples, sampleRate })
  } catch (err) {
    console.error(err)
    error.value = '开发测试音频加载失败。'
  } finally {
    analyzing.value = false
  }
}

const confLabel = { 高: 'b-high', 中: 'b-mid', 低: 'b-low' }
</script>

<template>
  <div class="narrow">
    <h1 class="page-title">添加歌曲</h1>

    <div class="tag-row" style="margin-bottom: 14px">
      <span class="tag" :class="{ on: mode === 'analyze' }" @click="mode = 'analyze'; error = ''">上传音频分析</span>
      <span class="tag" :class="{ on: mode === 'manual' }" @click="mode = 'manual'; error = ''">手动录入</span>
    </div>

    <template v-if="mode === 'analyze'">
      <div class="card">
        <h2>选择音频文件</h2>
        <input type="file" accept=".mp3,.flac,.wav,.m4a,.ogg,audio/*" @change="onFileChange" />
        <p class="muted small" style="margin-top: 8px">
          支持 mp3 / flac / wav / m4a。文件只在你的浏览器里本地分析，不会上传。酷狗 kgg 等加密格式无法分析。
        </p>
        <label>歌名</label>
        <input v-model="title" type="text" placeholder="例如：NO, Thank You!" />
        <label>歌手 / 出处（可选）</label>
        <input v-model="artist" type="text" placeholder="例如：放課後ティータイム" />
        <button class="btn btn-primary btn-block" style="margin-top: 14px" :disabled="analyzing" @click="runAnalyze">
          {{ analyzing ? '正在分析…' : '开始分析' }}
        </button>
        <button v-if="isDev" class="btn btn-block" style="margin-top: 8px" :disabled="analyzing" @click="loadDevTest">
          加载开发测试音频
        </button>
      </div>

      <p v-if="error" class="small" style="color: var(--danger); margin-bottom: 10px">{{ error }}</p>

      <div v-if="result" class="card">
        <h2>分析结果预览</h2>
        <div class="info-row">
          <span class="dim small">BPM</span>
          <span class="info-val">{{ result.tempoUseBpm }}</span>
          <span class="badge" :class="confLabel[result.confidence.bpm]">{{ result.confidence.bpm }}</span>
        </div>
        <div class="info-row">
          <span class="dim small">调性</span>
          <span class="info-val">{{ result.keyTop3[0].key }}</span>
          <span class="badge" :class="confLabel[result.confidence.key]">{{ result.confidence.key }}</span>
        </div>
        <div class="muted small" style="margin-top: 2px">
          其他候选：{{ result.keyTop3.slice(1).map((k) => `${k.key}（${k.corr}）`).join('、') }}
        </div>
        <div class="info-row" style="margin-top: 6px">
          <span class="dim small">套路</span>
          <span class="info-val">{{ result.template }}</span>
          <span class="badge" :class="confLabel[result.confidence.template]">{{ result.confidence.template }}</span>
        </div>
        <div v-if="result.chordsRough.length" class="info-row">
          <span class="dim small">和弦</span>
          <span class="info-val">{{ result.chordsRough.join(' ') }}</span>
          <span class="badge b-low">低</span>
        </div>
        <div style="margin-top: 10px">
          <p v-for="n in result.notes" :key="n" class="muted small" style="margin-bottom: 4px">· {{ n }}</p>
        </div>
        <button class="btn btn-primary btn-block" style="margin-top: 12px" @click="saveAnalysis">保存到我的歌单</button>
        <p class="muted small" style="margin-top: 8px">保存后可在歌曲详情页人工纠错，纠错值优先展示。</p>
      </div>
    </template>

    <template v-else>
      <div class="card">
        <h2>手动录入（kgg 等无法分析的歌也可用）</h2>
        <label>歌名（必填）</label>
        <input v-model="title" type="text" placeholder="例如：Singing!" />
        <label>歌手 / 出处（可选）</label>
        <input v-model="artist" type="text" placeholder="例如：放課後ティータイム" />
        <label>BPM</label>
        <input v-model="mBpm" type="number" min="40" max="300" placeholder="例如 180" />
        <label>调性</label>
        <select v-model="mKey">
          <option value="">（未知）</option>
          <option v-for="k in KEYS" :key="k" :value="k">{{ k }}</option>
        </select>
        <label>套路</label>
        <select v-model="mTemplate">
          <option value="">（未知）</option>
          <option v-for="t in TONE_TEMPLATES" :key="t.id" :value="t.name">{{ t.name }}（{{ t.适用 }}）</option>
        </select>
        <button class="btn btn-primary btn-block" style="margin-top: 14px" @click="saveManual">保存</button>
        <p v-if="savedFlash" class="small" style="color: var(--ok); margin-top: 8px">已保存</p>
        <p v-if="error" class="small" style="color: var(--danger); margin-top: 8px">{{ error }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.info-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
.info-row .dim { width: 44px; flex: none; }
.info-val { font-weight: 600; }
.badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-weight: 700;
  flex: none;
}
.b-high { background: #e8f3ec; border-color: var(--ok); color: var(--ok); }
.b-mid { background: #fdf3e0; border-color: #d9a441; color: #a97412; }
.b-low { background: #fdeaea; border-color: var(--accent); color: var(--accent-dark); }
</style>
