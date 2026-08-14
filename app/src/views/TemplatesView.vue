<script setup>
import { TONE_TEMPLATES } from '../data/templates'
</script>

<template>
  <div>
    <h1 class="page-title">音色套路库</h1>
    <p class="muted small" style="margin-bottom: 12px">
      参数按当前设备（JOYO Jam Buddy 2 + GRX40）标注。套路是「参考起点」，实际用耳朵微调。
    </p>
    <div v-for="t in TONE_TEMPLATES" :key="t.id" class="card">
      <div class="tpl-head">
        <div class="tpl-name">{{ t.name }}</div>
        <span class="tag">{{ t.适用 }}</span>
      </div>
      <div class="small dim" style="margin-top: 6px">示例：{{ t.示例 }}</div>
      <div class="tpl-grid">
        <div class="tpl-item"><b>吉他档位</b>{{ t.guitar.pickup }}</div>
        <div class="tpl-item"><b>音色旋钮</b>{{ t.guitar.tone }}</div>
        <div class="tpl-item"><b>通道</b>{{ t.amp.channel }}</div>
        <div class="tpl-item"><b>箱模</b>{{ t.amp.model }}</div>
        <div class="tpl-item"><b>Gain</b>{{ t.amp.gain }} / 10</div>
        <div class="tpl-item"><b>EQ</b>B{{ t.amp.eq.b }} · M{{ t.amp.eq.m }} · T{{ t.amp.eq.t }}</div>
        <div class="tpl-item"><b>MOD</b>{{ t.amp.mod }}</div>
        <div class="tpl-item"><b>Delay</b>{{ t.amp.delay }}</div>
        <div class="tpl-item"><b>Reverb</b>{{ t.amp.reverb }}</div>
      </div>
      <p class="muted small" style="margin-top: 8px">💡 {{ t.说明 }}</p>
    </div>
  </div>
</template>

<style scoped>
.tpl-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.tpl-name { font-size: 18px; font-weight: 700; }
.tpl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.tpl-item { background: var(--bg-input); border-radius: 10px; padding: 8px 10px; font-size: 14px; }
.tpl-item b { display: block; color: var(--text-dim); font-size: 12px; margin-bottom: 2px; font-weight: 600; }
</style>
