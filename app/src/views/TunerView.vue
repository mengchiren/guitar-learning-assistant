<script setup>
import { onUnmounted } from 'vue'
import { useTuner } from '../composables/useTuner.js'

const tuner = useTuner()

const STRINGS = [
  { name: '6 弦 E2', freq: 82.41 },
  { name: '5 弦 A2', freq: 110.0 },
  { name: '4 弦 D3', freq: 146.83 },
  { name: '3 弦 G3', freq: 196.0 },
  { name: '2 弦 B3', freq: 246.94 },
  { name: '1 弦 E4', freq: 329.63 },
]

// 复用同一个 AudioContext：浏览器对上下文数量有上限，每次新建连点多次会失声
let refCtx = null

function playRef(freq) {
  if (!refCtx) refCtx = new (window.AudioContext || window.webkitAudioContext)()
  refCtx.resume()
  const osc = refCtx.createOscillator()
  const gain = refCtx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.35, refCtx.currentTime)
  gain.gain.setValueAtTime(0.35, refCtx.currentTime + 1.3)
  gain.gain.exponentialRampToValueAtTime(0.0001, refCtx.currentTime + 1.4)
  osc.connect(gain)
  gain.connect(refCtx.destination)
  osc.start()
  osc.stop(refCtx.currentTime + 1.4)
}

onUnmounted(() => tuner.stop())
</script>

<template>
  <div class="narrow">
    <h1 class="page-title">调音器</h1>
    <div class="card tuner">
      <div class="lock-row">
        <span class="lock-pill" :class="{ on: tuner.stable.value }">
          {{ tuner.stable.value ? '已锁定' : '拾音中…' }}
        </span>
      </div>
      <div class="tuner-note" :class="{ dimmed: !tuner.stable.value }">{{ tuner.note.value }}</div>
      <div class="needle-track">
        <div
          class="needle"
          :style="{ left: Math.max(0, Math.min(100, 50 + tuner.cents.value / 2)) + '%' }"
        ></div>
        <div class="needle-center"></div>
      </div>
      <div class="dim small">
        偏差 {{ tuner.cents.value > 0 ? '+' : '' }}{{ tuner.cents.value }} 音分（指针对准中线即准）
      </div>
      <div class="btn-row" style="margin-top: 14px">
        <button class="btn btn-primary" @click="tuner.active.value ? tuner.stop() : tuner.start()">
          {{ tuner.active.value ? '停止收音' : '开始收音' }}
        </button>
      </div>
      <p v-if="tuner.error.value" class="small" style="color: var(--danger); margin-top: 10px">
        {{ tuner.error.value }}
      </p>
    </div>

    <div class="card">
      <h2>没有麦克风？播放参考音</h2>
      <p class="muted small" style="margin-bottom: 8px">标准调弦 EADGBE，听着参考音拧弦钮</p>
      <div class="tag-row">
        <span v-for="s in STRINGS" :key="s.name" class="tag" @click="playRef(s.freq)">{{ s.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tuner { text-align: center; }
.lock-row { min-height: 20px; }
.lock-pill {
  display: inline-block;
  font-size: 11px;
  padding: 2px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--text-dim);
}
.lock-pill.on { border-color: var(--accent); color: var(--accent); }
.tuner-note { font-size: 56px; font-weight: 700; min-height: 76px; transition: opacity 0.15s linear; }
/* 未锁定时读数半透明：明确告诉用户这个数还没稳 */
.tuner-note.dimmed { opacity: 0.45; }
.needle-track { position: relative; height: 14px; background: var(--bg-input); border-radius: 999px; margin: 14px 0 8px; }
.needle { position: absolute; top: -4px; width: 4px; height: 22px; background: var(--accent); border-radius: 2px; transform: translateX(-50%); transition: left 0.06s linear; }
.needle-center { position: absolute; top: -6px; left: 50%; width: 2px; height: 26px; background: var(--text-dim); transform: translateX(-50%); }
</style>
