<script setup>
import { computed } from 'vue'
import { useMetronomeStore } from '../stores/metronome.js'

const metro = useMetronomeStore()
const presets = [60, 80, 100, 120, 140, 160, 180]

// 目标 BPM 双向钳制：40~220 且必须 ≥ 当前 BPM + 1 才有意义，越界写回安全值
const rampTarget = computed({
  get: () => metro.rampTargetBpm,
  set: (v) => {
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return
    metro.rampTargetBpm = Math.max(40, Math.min(220, n))
  },
})

function toggleRamp() {
  metro.toggleRamp(!metro.rampEnabled)
}

function backToStart() {
  metro.stop()
  metro.bpm = metro.rampStartBpm
}
</script>

<template>
  <div class="narrow">
    <h1 class="page-title">节拍器</h1>
    <div class="card metro">
      <div class="metro-bpm">{{ metro.bpm }}</div>
      <div class="dim small">BPM</div>

      <div class="beat-dots">
        <span
          v-for="i in metro.beats"
          :key="i"
          class="beat-dot"
          :class="{ first: i === 1, active: metro.running && metro.currentBeat === i }"
        ></span>
      </div>

      <div class="btn-row" style="margin-top: 12px">
        <button class="btn" @click="metro.bpm = Math.max(40, metro.bpm - 5)">−5</button>
        <button class="btn" @click="metro.bpm = Math.min(220, metro.bpm + 5)">+5</button>
      </div>

      <input type="range" min="40" max="220" v-model.number="metro.bpm" />

      <div class="tag-row">
        <span
          v-for="p in presets"
          :key="p"
          class="tag"
          :class="{ on: metro.bpm === p }"
          @click="metro.bpm = p"
        >{{ p }}</span>
      </div>

      <label>拍号</label>
      <select v-model.number="metro.beats">
        <option :value="2">2/4</option>
        <option :value="3">3/4</option>
        <option :value="4">4/4</option>
        <option :value="6">6/8</option>
      </select>

      <div class="btn-row" style="margin-top: 14px">
        <button class="btn btn-primary" @click="metro.toggle()">{{ metro.running ? '停止' : '开始' }}</button>
        <button class="btn" @click="metro.tap()">打拍定速</button>
      </div>

      <p v-if="metro.rampEnabled && metro.running" class="small" style="margin-top: 8px">
        已提速 {{ metro.rampGroup }} 组 · 本组第 {{ Math.min(metro.barCount + 1, metro.rampBarsPerStep) }}/{{ metro.rampBarsPerStep }} 小节
        <span v-if="metro.bpm < metro.rampTargetBpm">· 距目标 {{ metro.rampTargetBpm - metro.bpm }} BPM</span>
        <span v-else style="color: var(--ok)">· 已达目标，保持</span>
      </p>

      <p class="muted small" style="margin-top: 10px">
        提示：每首歌的目标 BPM 在歌曲详情页里，点「用此 BPM 开节拍器」可一键联动。
      </p>
    </div>

    <!-- v0.14.0 渐进提速训练卡（参考 Chordance 的 speed trainer）：爬格子/音阶提速用 -->
    <div class="card" style="margin-top: 14px">
      <h2>渐进提速训练</h2>
      <p class="muted small">
        每弹满设定的节数自动升一点速度，到目标即停。适合爬格子、音阶、Riff 提速练习。
      </p>

      <label>目标 BPM（需大于起始速度）</label>
      <input v-model.number="rampTarget" type="number" min="60" max="220" step="10" />

      <label>每次提升</label>
      <select v-model.number="metro.rampStepBpm">
        <option :value="1">+1 BPM（细水长流）</option>
        <option :value="2">+2 BPM</option>
        <option :value="5">+5 BPM（常规）</option>
      </select>

      <label>每多少小节提一次</label>
      <select v-model.number="metro.rampBarsPerStep">
        <option :value="2">每 2 小节</option>
        <option :value="4">每 4 小节</option>
        <option :value="8">每 8 小节</option>
      </select>

      <div class="btn-row" style="margin-top: 14px">
        <button class="btn btn-primary" @click="toggleRamp">
          {{ metro.rampEnabled ? '停用训练' : `开始训练（以当前 ${metro.bpm} 为起点）` }}
        </button>
        <button v-if="metro.rampEnabled" class="btn" @click="backToStart">回到起始 {{ metro.rampStartBpm }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metro { text-align: center; }
.metro-bpm { font-size: 64px; font-weight: 700; font-variant-numeric: tabular-nums; }
.beat-dots { display: flex; justify-content: center; gap: 8px; margin-top: 12px; }
.beat-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--bg-input); transition: background 0.05s linear, transform 0.05s linear; }
.beat-dot.first { background: var(--accent); }
.beat-dot.active { background: var(--accent); transform: scale(1.4); }
</style>
