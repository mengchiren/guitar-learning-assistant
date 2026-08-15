<script setup>
import { TONE_TEMPLATES } from '../data/templates'
import ToneAdvice from '../components/ToneAdvice.vue'
</script>

<template>
  <div>
    <h1 class="page-title">音色套路库</h1>
    <p class="muted small" style="margin-bottom: 12px">
      参数按当前设备（JOYO Jam Buddy 2 + GRX40）标注。套路是「参考起点」，实际用耳朵微调。
    </p>
    <div class="tpl-list">
      <div v-for="t in TONE_TEMPLATES" :key="t.id" class="card">
        <div class="tpl-head">
          <div class="tpl-name">{{ t.name }}</div>
          <span class="tag">{{ t.适用 }}</span>
        </div>
        <div class="small dim" style="margin-top: 6px">示例：{{ t.示例 }}</div>
        <ToneAdvice :tpl="t" />
        <p class="muted small" style="margin-top: 8px">{{ t.说明 }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tpl-list { display: grid; }
.tpl-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.tpl-name { font-size: 18px; font-weight: 700; }

@media (min-width: 768px) {
  .tpl-list { grid-template-columns: repeat(2, 1fr); gap: 16px; align-items: start; }
  .tpl-list .card { margin-bottom: 0; }
}
</style>
