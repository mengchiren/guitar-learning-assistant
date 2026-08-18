<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { beginnerGuide } from '../utils/toneGuide.js'

// 设备设置建议卡：按「我的 → 显示偏好」切换两种模式。
// beginner：参数速览 + 大白话操作流程；full：全部参数表（9 项网格）。
const props = defineProps({
  tpl: { type: Object, required: true },
})
const settings = useSettingsStore()
// computed 而非一次性计算：同组件实例复用时（路由参数切换）tpl 会变，内容要跟着变
const beginner = computed(() => beginnerGuide(props.tpl))
</script>

<template>
  <div v-if="settings.displayMode === 'beginner'">
    <div class="quick-params">
      <span v-for="p in beginner.params" :key="p.label" class="quick-chip">
        <b>{{ p.label }}</b>{{ p.value }}
      </span>
    </div>

    <div class="step-list">
      <div v-for="(s, i) in beginner.steps" :key="s" class="step">
        <span class="step-num">{{ i + 1 }}</span>
        <span>{{ s }}</span>
      </div>
    </div>

    <div class="fine-tune">
      <div class="fine-tune-title">其余参数（新手可先不动）</div>
      <p v-for="f in beginner.fineTune" :key="f" class="muted small">{{ f }}</p>
    </div>
  </div>

  <div v-else class="tpl-grid">
    <div class="tpl-item"><b>吉他档位</b>{{ tpl.guitar.pickup }}</div>
    <div class="tpl-item"><b>音色旋钮</b>{{ tpl.guitar.tone }}</div>
    <div class="tpl-item"><b>通道</b>{{ tpl.amp.channel }}</div>
    <div class="tpl-item"><b>箱模</b>{{ tpl.amp.model }}</div>
    <div class="tpl-item"><b>Gain</b>{{ tpl.amp.gain }} / 10</div>
    <div class="tpl-item"><b>EQ</b>B{{ tpl.amp.eq.b }} · M{{ tpl.amp.eq.m }} · T{{ tpl.amp.eq.t }}</div>
    <div class="tpl-item"><b>MOD</b>{{ tpl.amp.mod }}</div>
    <div class="tpl-item"><b>Delay</b>{{ tpl.amp.delay }}</div>
    <div class="tpl-item"><b>Reverb</b>{{ tpl.amp.reverb }}</div>
  </div>
</template>

<style scoped>
.quick-params { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.quick-chip {
  background: var(--bg-input);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 600;
}
.quick-chip b { display: block; color: var(--text-dim); font-size: 11px; font-weight: 600; margin-bottom: 1px; }

.step-list { display: flex; flex-direction: column; gap: 8px; }
.step { display: flex; align-items: center; gap: 10px; font-size: 15px; }
.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.fine-tune { margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--border); }
.fine-tune-title { font-size: 13px; font-weight: 700; color: var(--text-dim); margin-bottom: 6px; }
.fine-tune p { margin-bottom: 3px; }

.tpl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.tpl-item { background: var(--bg-input); border-radius: 10px; padding: 8px 10px; font-size: 14px; }
.tpl-item b { display: block; color: var(--text-dim); font-size: 12px; margin-bottom: 2px; font-weight: 600; }
</style>
