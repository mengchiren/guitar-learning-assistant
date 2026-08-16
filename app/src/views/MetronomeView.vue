<script setup>
import { useMetronomeStore } from '../stores/metronome'

const metro = useMetronomeStore()
const presets = [60, 80, 100, 120, 140, 160, 180]
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

      <p class="muted small" style="margin-top: 10px">
        提示：歌曲分析会给每首歌目标速度（M2 上线）。目前歌曲库里的目标 BPM 可在「歌曲」页查看。
      </p>
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
