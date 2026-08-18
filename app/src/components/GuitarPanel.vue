<script setup>
// 吉他示意图（v0.6.2）：由 devices.js 的 guitar.panel 数据驱动。
// 简化琴身轮廓 + 5 档拾音器拨杆（高亮当前档）+ 音量/音色旋钮。
// pickup 值支持「档位 5」与「档位 1~3」两种写法（后者高亮区间）。
import { computed } from 'vue'

const props = defineProps({
  panel: { type: Object, required: true },
  values: { type: Object, default: () => ({}) },
  highlight: { type: Array, default: () => [] },
})
const emit = defineEmits(['select'])

// 解析档位：'档位 5（琴桥双线圈）' → [5]；'档位 1~3（琴颈/中间）' → [1,2,3]
const pickupPositions = computed(() => {
  const v = String(props.values.pickup || '')
  const m = v.match(/档位\s*(\d+)\s*~?\s*(\d+)?/)
  if (!m) return []
  const a = Number(m[1])
  const b = m[2] ? Number(m[2]) : a
  const out = []
  for (let i = a; i <= b; i++) out.push(i)
  return out
})

const on = (field) => props.highlight.includes(field)
</script>

<template>
  <svg
    :viewBox="`0 0 ${panel.width} ${panel.height}`"
    class="guitar-panel"
    role="img"
    aria-label="吉他面板示意图"
  >
    <!-- 琴头 -->
    <rect x="128" y="8" width="44" height="52" rx="6" class="neck-wood" />
    <g v-for="i in 6" :key="i">
      <circle :cx="132 + ((i - 1) % 3) * 9" :cy="14 + (i > 3 ? 12 : 0)" :r="2.6" class="peg" />
    </g>
    <!-- 琴颈 -->
    <rect x="133" y="56" width="34" height="140" class="neck-wood" />
    <line x1="150" y1="86" x2="150" y2="196" class="neck-line" />
    <g v-for="f in [0, 1, 2, 3]" :key="f">
      <line :x1="133" :y1="76 + f * 26" :x2="167" :y2="76 + f * 26" class="fret" />
    </g>
    <!-- 琴身（双缺角轮廓） -->
    <path
      d="M167 190 L167 208 C 204 210, 228 226, 234 252 C 239 276, 236 302, 228 322 C 218 346, 200 364, 178 374 C 160 382, 140 386, 124 380 C 102 372, 84 354, 74 330 C 66 308, 64 280, 70 256 C 77 228, 102 210, 133 202 L133 190 Z"
      class="body-wood"
    />
    <!-- 琴身饰线 -->
    <path
      d="M162 214 C 196 218, 218 232, 224 256 C 229 278, 226 300, 219 318 C 210 340, 194 356, 174 366 C 158 373, 142 376, 128 371"
      class="body-line"
    />
    <!-- 琴桥 -->
    <rect x="118" y="330" width="64" height="8" rx="3" class="hardware" />
    <!-- 弦（示意 4 根） -->
    <g v-for="i in 4" :key="i">
      <line :x1="138 + i * 3" :y1="14" :x2="142 + i * 4" :y2="330" class="string" />
    </g>
    <!-- 拾音器档位拨杆：5 档刻度 -->
    <g :class="{ on: on(panel.switch.field) }">
      <rect :x="panel.switch.x - 6" :y="panel.switch.y - 18" :width="12" :height="44" rx="4" class="switch-base" />
      <g v-for="p in panel.switch.positions" :key="p">
        <line
          :x1="panel.switch.x + 12"
          :y1="panel.switch.y - 14 + (p - 1) * 7"
          :x2="panel.switch.x + 20"
          :y2="panel.switch.y - 14 + (p - 1) * 7"
          class="switch-tick"
        />
        <circle
          v-if="pickupPositions.includes(p)"
          :cx="panel.switch.x"
          :cy="panel.switch.y - 12 + (p - 1) * 7"
          :r="4.5"
          class="switch-dot"
        />
      </g>
      <circle
        v-if="on(panel.switch.field) && pickupPositions.length"
        :cx="panel.switch.x"
        :cy="panel.switch.y - 12 + (pickupPositions[0] - 1) * 7"
        :r="7"
        class="hl-ring"
      />
    </g>
    <!-- 音量/音色旋钮 -->
    <g v-for="k in panel.knobs" :key="k.field" :class="{ on: on(k.field) }">
      <circle :cx="k.x" :cy="k.y" :r="12" class="knob" />
      <circle v-if="on(k.field)" :cx="k.x" :cy="k.y" :r="14.5" class="hl-ring" />
      <text :x="k.x" :y="k.y + 28" text-anchor="middle" class="knob-label">{{ k.label }}</text>
      <title>{{ k.label }}：{{ k.note }}</title>
    </g>
    <text :x="panel.width / 2" :y="panel.height - 10" text-anchor="middle" class="panel-note">{{ panel.note }}</text>
  </svg>
</template>

<style scoped>
.guitar-panel { width: 100%; display: block; }
.neck-wood { fill: #d8c9a8; stroke: #b3a27e; }
.body-wood { fill: #e8e2d2; stroke: #b3a27e; stroke-width: 2; }
.body-line { fill: none; stroke: #c9bda0; stroke-width: 2; }
.fret { stroke: #9a8a68; stroke-width: 1.5; }
.neck-line { stroke: #9a8a68; stroke-width: 1; }
.peg { fill: #8a8a8e; }
.hardware { fill: #c9c9cd; }
.string { stroke: #c9c9cd; stroke-width: 1; }

.switch-base { fill: #e0e0e4; stroke: #b0b0b4; }
.switch-tick { stroke: #9a9a9e; stroke-width: 2; }
.switch-dot { fill: var(--accent, #e30613); }

.knob { fill: #e0e0e4; stroke: #b0b0b4; stroke-width: 2; }
.knob-label { fill: var(--text-dim, #6f6c64); font-size: 10px; font-weight: 600; }
.panel-note { fill: #9a9a9e; font-size: 9px; }

.hl-ring { fill: none; stroke: var(--accent, #e30613); stroke-width: 2.5; }
</style>
