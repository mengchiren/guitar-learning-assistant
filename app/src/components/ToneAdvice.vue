<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { beginnerGuide } from '../utils/toneGuide.js'
import { GUITARS, AMPS } from '../data/devices.js'
import AmpPanel from './AmpPanel.vue'
import GuitarPanel from './GuitarPanel.vue'

// 设备设置建议卡：按「我的 → 显示偏好」切换两种模式。
// beginner：面板示意图（v0.6.2，要动的旋钮红圈高亮）+ 参数速览 + 大白话操作流程；full：全部参数表。
// 按当前选中的设备渲染（新设备只改 devices.js 数据，渲染逻辑不动）。
const props = defineProps({
  tpl: { type: Object, required: true },
})
const settings = useSettingsStore()
const guitar = GUITARS.find((d) => d.id === settings.activeDevices.guitarId)
const amp = AMPS.find((d) => d.id === settings.activeDevices.ampId)
// computed 而非一次性计算：同组件实例复用时（路由参数切换）tpl 会变，内容要跟着变
const beginner = computed(() => beginnerGuide(props.tpl, { guitar, amp }))

// 面板图数据：套路值 → 面板字段；高亮 = 设备 keyParams（新手必须动的）。
// 通道特殊：JAM BUDDY 2 是双脚钉（CHANNEL=CLEAN/DRIVE，DRIVE MODE=RHYTHM/LEAD），
// 按 channelMap 拆成脚钉状态，DRIVE 时 DRIVE MODE 脚钉一起高亮。
const ampValues = computed(() => {
  const a = props.tpl.amp
  const step = amp?.channelMap?.[a.channel] || null
  return {
    channel: step ? step.channel : a.channel,
    driveMode: step?.driveMode || undefined,
    model: a.model,
    gain: a.gain,
    'eq.b': a.eq.b,
    'eq.m': a.eq.m,
    'eq.t': a.eq.t,
    mod: a.mod,
    delay: a.delay,
    reverb: a.reverb,
  }
})
const guitarValues = computed(() => ({ pickup: props.tpl.guitar.pickup, volume: props.tpl.guitar.volume, tone: props.tpl.guitar.tone }))
const ampHighlight = computed(() => {
  const base = amp?.keyParams || []
  return ampValues.value.driveMode ? [...base, 'driveMode'] : base
})
const guitarHighlight = guitar?.keyParams || []
</script>

<template>
  <div v-if="settings.displayMode === 'beginner'">
    <!-- 面板示意图：要动的旋钮红圈高亮（v0.6.2） -->
    <div class="panel-scroll">
      <div class="panel-wrap">
        <div v-if="guitar" class="guitar-wrap">
          <GuitarPanel :panel="guitar.panel" :values="guitarValues" :highlight="guitarHighlight" />
        </div>
        <div v-if="amp" class="amp-wrap">
          <AmpPanel :panel="amp.panel" :values="ampValues" :highlight="ampHighlight" />
        </div>
      </div>
    </div>
    <p class="muted small" style="margin-top: 6px">上图红色圈出的就是要动的：照着数值拧/按，其余先别碰。</p>

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
/* 面板区：手机横向滚动（音箱图保持可读宽度），桌面并排 */
.panel-scroll { overflow-x: auto; padding-bottom: 4px; }
.panel-wrap { display: flex; gap: 10px; align-items: flex-start; }
.guitar-wrap { flex: none; width: 92px; }
.amp-wrap { flex: none; width: 520px; }

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
