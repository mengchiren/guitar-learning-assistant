<script setup>
import Icon from '../components/Icon.vue'
</script>

<template>
  <div>
    <h1 class="page-title">练习工具</h1>
    <div class="tool-grid">
      <router-link to="/metronome" class="card tool-card">
        <span class="tool-icon"><Icon name="metronome" :size="24" /></span>
        <div>
          <div class="tool-name">节拍器</div>
          <div class="dim small">练习节奏、跟目标速度</div>
        </div>
      </router-link>
      <router-link to="/tuner" class="card tool-card">
        <span class="tool-icon"><Icon name="tuner" :size="24" /></span>
        <div>
          <div class="tool-name">调音器</div>
          <div class="dim small">麦克风收音 + 参考音</div>
        </div>
      </router-link>
      <router-link to="/chords" class="card tool-card">
        <span class="tool-icon"><Icon name="chord" :size="24" /></span>
        <div>
          <div class="tool-name">和弦图库</div>
          <div class="dim small">50+ 常用和弦指法图 · 点开可放大</div>
        </div>
      </router-link>
      <router-link to="/templates" class="card tool-card">
        <span class="tool-icon"><Icon name="sliders" :size="24" /></span>
        <div>
          <div class="tool-name">音色套路库</div>
          <div class="dim small">5 套常用音色 · 对应你的设备</div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.tool-grid { display: grid; }
.tool-card { display: flex; align-items: center; gap: 14px; text-decoration: none; color: var(--text); }
.tool-icon { display: flex; color: var(--text-dim); }
.tool-name { font-size: 17px; font-weight: 700; }

@media (min-width: 768px) {
  .tool-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .tool-grid .card { margin-bottom: 0; }
}
</style>
