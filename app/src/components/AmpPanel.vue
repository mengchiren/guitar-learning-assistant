<script setup>
// 音箱面板示意图（v0.6.2）：由 devices.js 的 amp.panel 数据驱动。
// - 数值旋钮（kind=num）：按 min/max 画指针角度（0→左下，满→右下）
// - 循环选择旋钮（kind=text）：只高亮 + 下方显示当前值
// - 高亮 = 当前套路建议要动的旋钮/脚钉（瑞士红圈 + 值标签）
// - interactive 模式（音箱入门页）：点旋钮/脚钉触发 select 事件看说明
import { computed } from 'vue'

const props = defineProps({
  panel: { type: Object, required: true },
  values: { type: Object, default: () => ({}) }, // field → 当前值（如 { gain: 7, model: 'Rock' }）
  highlight: { type: Array, default: () => [] }, // 需要高亮的 field 列表
  interactive: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

const START_ANGLE = 135 // 指针起始角（SVG 原生角：135°=左下 7 点半方向）
const SPAN = 270 // 0→满 顺时针扫 270°（7:30 → 12:00 → 4:30，和真实旋钮一致）

// 数值 → 指针角度（SVG 坐标 y 向下，角度顺时针）
function pointerAngle(knob) {
  const v = Number(props.values[knob.field])
  if (!Number.isFinite(v) || knob.kind !== 'num') return START_ANGLE
  const min = knob.min ?? 0
  const max = knob.max ?? 10
  const ratio = Math.max(0, Math.min(1, (v - min) / (max - min)))
  return START_ANGLE + SPAN * ratio
}

// 指针端点（SVG 角度：0° 向右，y 向下所以角度顺时针）
function pointerEnd(knob) {
  const deg = pointerAngle(knob)
  const rad = (deg * Math.PI) / 180
  const r = knob.r ?? 22
  return { x: knob.x + r * 0.78 * Math.cos(rad), y: knob.y + r * 0.78 * Math.sin(rad) }
}

// 把多行标签（'Bass / Save'）拆成两行
function labelLines(label) {
  return String(label).split('/').map((s) => s.trim())
}

const isNum = (k) => k.kind === 'num'
const on = (field) => props.highlight.includes(field)
const val = (field) => props.values[field]
</script>

<template>
  <svg
    :viewBox="`0 0 ${panel.width} ${panel.height}`"
    class="amp-panel"
    role="img"
    :aria-label="`${panel.title || '音箱'}面板示意图`"
  >
    <!-- 面板底 -->
    <rect :x="2" :y="2" :width="panel.width - 4" :height="panel.height - 4" rx="18" class="panel-body" />
    <!-- 品牌区 -->
    <text :x="panel.width / 2" y="52" text-anchor="middle" class="brand">JOYO</text>
    <text :x="panel.width / 2" y="74" text-anchor="middle" class="brand-sub">JAM BUDDY 2 · 面板示意</text>
    <line :x1="60" :y1="92" :x2="panel.width - 60" :y2="92" class="panel-line" />

    <!-- 旋钮 -->
    <g
      v-for="k in panel.knobs"
      :key="k.field"
      :class="{ knob: true, on: on(k.field), clickable: interactive }"
      @click="interactive && emit('select', k.field)"
    >
      <circle :cx="k.x" :cy="k.y" :r="k.r ?? 26" class="knob-ring" />
      <circle :cx="k.x" :cy="k.y" :r="k.r ?? 26" class="knob-bg" />
      <!-- 数值旋钮：指针 -->
      <template v-if="isNum(k)">
        <line :x1="k.x" :y1="k.y" :x2="pointerEnd(k).x" :y2="pointerEnd(k).y" class="knob-pointer" />
        <circle :cx="k.x" :cy="k.y" :r="4" class="knob-dot" />
      </template>
      <template v-else>
        <line :x1="k.x" :y1="k.y - 12" :x2="k.x" :y2="k.y + 12" class="knob-line" />
      </template>
      <!-- 高亮圈 -->
      <circle v-if="on(k.field)" :cx="k.x" :cy="k.y" :r="(k.r ?? 26) + 6" class="hl-ring" />
      <!-- 印刷标签（两行） -->
      <text :x="k.x" :y="k.y + (k.r ?? 26) + 12" text-anchor="middle" class="knob-label">
        {{ labelLines(k.label)[0] }}
      </text>
      <text v-if="labelLines(k.label)[1]" :x="k.x" :y="k.y + (k.r ?? 26) + 26" text-anchor="middle" class="knob-label dim">
        {{ labelLines(k.label)[1] }}
      </text>
      <!-- 当前值标签（高亮时红底） -->
      <g v-if="val(k.field) !== undefined && on(k.field)">
        <rect :x="k.x - 44" :y="k.y - (k.r ?? 26) - 34" :width="88" :height="20" rx="10" class="val-chip" />
        <text :x="k.x" :y="k.y - (k.r ?? 26) - 20" text-anchor="middle" class="val-text">{{ val(k.field) }}</text>
      </g>
      <title>{{ k.label }}：{{ k.note }}</title>
    </g>

    <!-- 脚钉 -->
    <g
      v-for="f in panel.foots"
      :key="f.id"
      :class="{ foot: true, on: on(f.id), clickable: interactive }"
      @click="interactive && emit('select', f.id)"
    >
      <rect :x="f.x" :y="f.y" :width="f.w" :height="f.h" rx="8" class="foot-body" />
      <circle :cx="f.x + 14" :cy="f.y + f.h / 2" :r="5" :class="['foot-led', { 'led-on': on(f.id) }]" />
      <text :x="f.x + f.w / 2 + 4" :y="f.y + f.h / 2 + 4" text-anchor="middle" class="foot-label">{{ f.label }}</text>
      <rect v-if="on(f.id)" :x="f.x - 4" :y="f.y - 4" :width="f.w + 8" :height="f.h + 8" rx="10" class="hl-ring" />
      <g v-if="val(f.id) !== undefined && on(f.id)">
        <rect :x="f.x + f.w / 2 - 46" :y="f.y - 30" :width="92" :height="20" rx="10" class="val-chip" />
        <text :x="f.x + f.w / 2" :y="f.y - 16" text-anchor="middle" class="val-text">{{ val(f.id) }}</text>
      </g>
      <title>{{ f.label }}：{{ f.note }}</title>
    </g>

    <!-- 示意说明 -->
    <text :x="panel.width / 2" :y="panel.height - 14" text-anchor="middle" class="panel-note">
      {{ panel.note }}
    </text>
  </svg>
</template>

<style scoped>
.amp-panel { width: 100%; min-width: 520px; display: block; }
.panel-body { fill: #2c2c2e; stroke: #444; }
.panel-line { stroke: #555; stroke-width: 1; }
.brand { fill: #fff; font-size: 26px; font-weight: 800; letter-spacing: 4px; }
.brand-sub { fill: #9a9a9e; font-size: 12px; letter-spacing: 2px; }
.panel-note { fill: #8a8a8e; font-size: 10px; }

.knob-ring { fill: #3a3a3d; stroke: #5a5a5e; stroke-width: 2; }
.knob-bg { fill: #4a4a4e; }
.knob-pointer { stroke: #e8e8ea; stroke-width: 3; stroke-linecap: round; }
.knob-line { stroke: #b0b0b4; stroke-width: 3; stroke-linecap: round; }
.knob-dot { fill: #e8e8ea; }
.knob-label { fill: #d8d8dc; font-size: 11px; font-weight: 600; }
.knob-label.dim { fill: #9a9a9e; font-size: 10px; font-weight: 400; }

.hl-ring { fill: none; stroke: var(--accent, #e30613); stroke-width: 3; }
.val-chip { fill: var(--accent, #e30613); }
.val-text { fill: #fff; font-size: 11px; font-weight: 800; }

.foot-body { fill: #3a3a3d; stroke: #5a5a5e; stroke-width: 2; }
.foot-label { fill: #e8e8ea; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
.foot-led { fill: #222; }
.led-on { fill: var(--accent, #e30613); }
.clickable { cursor: pointer; }
.clickable:hover .knob-ring, .clickable:hover .foot-body { stroke: var(--accent, #e30613); }
</style>
