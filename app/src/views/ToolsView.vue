<script setup>
// v0.9.0：KeepAlive 保活名单用组件名匹配（App.vue KEEP_ALIVE）
defineOptions({ name: 'ToolsView' })
import Icon from '../components/Icon.vue'
import { TOOLS } from '../data/nav.js'
</script>

<template>
  <div>
    <h1 class="page-title">练习工具</h1>
    <div class="tool-grid">
      <router-link v-for="t in TOOLS" :key="t.path" :to="t.path" class="card tool-card">
        <span class="tool-icon"><Icon :name="t.icon" :size="24" /></span>
        <div>
          <div class="tool-name">{{ t.name }}</div>
          <div class="dim small">{{ t.desc }}</div>
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
