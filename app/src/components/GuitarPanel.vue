<script setup>
// 吉他写实示意图（v0.17.0）：按用户实物照片（Ibanez GRX40-LGY 浅灰 HSS）绘制的正面全身图。
// 琴头/琴颈/琴身/护板/拾音器/琴桥为设备专属装饰（本组件固定），拨杆与音量/音色旋钮由
// devices.js 的 guitar.panel 数据驱动。pickup 值支持「档位 5」与「档位 1~3」两种写法（后者高亮区间）。
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
const uid = 'gp' + Math.random().toString(36).slice(2, 8)

// 品记位置（22 品示意）：1/3/5/7/9/12（双点）/15/17
const inlays = [
  { y: 118 }, { y: 146 }, { y: 174 }, { y: 202 }, { y: 230 },
  { y: 258, double: true }, { y: 286 },
]
// 弦（6 根，低音粗到高音细）；起点在琴头弦钮区，终点在琴桥
const strings = [1, 2, 3, 4, 5, 6].map((i) => ({
  w: 0.6 + (6 - i) * 0.28,
  x1: 146 + (7 - i) * 2.6,
  x2: 142 + (7 - i) * 2.9,
}))
</script>

<template>
  <svg
    :viewBox="`0 0 ${panel.width} ${panel.height}`"
    class="guitar-panel"
    role="img"
    aria-label="吉他面板示意图"
  >
    <defs>
      <!-- 琴身浅灰珠光 -->
      <linearGradient :id="`${uid}-body`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e0e2e6" />
        <stop offset="0.5" stop-color="#d2d4d9" />
        <stop offset="1" stop-color="#bcbfc5" />
      </linearGradient>
      <!-- 琴头/琴颈枫木 -->
      <linearGradient :id="`${uid}-wood`" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e8d2a8" />
        <stop offset="0.5" stop-color="#f0ddb6" />
        <stop offset="1" stop-color="#ddc495" />
      </linearGradient>
      <!-- 指板玫瑰木 -->
      <linearGradient :id="`${uid}-fretboard`" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#6f4326" />
        <stop offset="0.5" stop-color="#834f2c" />
        <stop offset="1" stop-color="#6f4326" />
      </linearGradient>
      <!-- 护板白 -->
      <linearGradient :id="`${uid}-guard`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f7f8f9" />
        <stop offset="1" stop-color="#e9eaec" />
      </linearGradient>
      <!-- 金属件 -->
      <linearGradient :id="`${uid}-metal`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e9eaee" />
        <stop offset="0.5" stop-color="#b9bbc2" />
        <stop offset="1" stop-color="#8f9298" />
      </linearGradient>
      <!-- 落地阴影 -->
      <filter :id="`${uid}-blur`" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
    </defs>

    <!-- 琴头（枫木尖头，右上尖） -->
    <path d="M128 10 C150 2, 168 24, 172 52 L178 40 C186 46, 188 60, 184 74 L174 86 L132 86 L126 50 C124 34, 124 20, 128 10 Z" :fill="`url(#${uid}-wood)`" stroke="#b79a63" stroke-width="1.2" />
    <!-- Ibanez 竖排 logo + GRX 40 -->
    <text x="150" y="52" text-anchor="middle" class="head-logo" transform="rotate(-58 150 46)">Ibanez</text>
    <text x="136" y="80" class="head-model" transform="rotate(-24 140 78)">GRX 40</text>
    <!-- 弦钮（右侧 6 颗银色） -->
    <g v-for="i in 6" :key="i">
      <circle :cx="193" :cy="18 + i * 10.5" r="4.6" :fill="`url(#${uid}-metal)`" stroke="#7a7c82" stroke-width="0.8" />
      <rect :x="196.5" :y="15.5 + i * 10.5" width="7" height="5.5" rx="2" :fill="`url(#${uid}-metal)`" stroke="#7a7c82" stroke-width="0.6" />
    </g>

    <!-- 琴颈 -->
    <rect x="136" y="86" width="28" height="228" :fill="`url(#${uid}-wood)`" stroke="#c2a771" stroke-width="0.6" />
    <!-- 指板（玫瑰木） -->
    <rect x="140" y="92" width="20" height="218" :fill="`url(#${uid}-fretboard)`" stroke="#5a3319" stroke-width="0.6" />
    <!-- 品丝（银色细线） -->
    <g v-for="f in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="f" :stroke="`url(#${uid}-metal)`" stroke-width="1.4">
      <line :x1="140" :x2="160" :y1="96 + f * 22" :y2="96 + f * 22" />
    </g>
    <!-- 圆点品记 -->
    <g v-for="iv in inlays" :key="iv.y">
      <circle :cx="150" :cy="iv.y" r="2.6" fill="#f2f2ee" opacity="0.95" />
      <circle v-if="iv.double" :cx="150" :cy="iv.y + 7" r="2.6" fill="#f2f2ee" opacity="0.95" />
    </g>

    <!-- 琴身（浅灰双缺角：两肩上翘尖角 + 中间深凹口） -->
    <path
      d="M150 302 L124 294 C112 286, 104 278, 94 271 C78 262, 62 268, 54 288 C47 308, 48 336, 57 360 C67 398, 82 438, 100 472 C112 495, 130 510, 150 512 C170 510, 188 495, 200 472 C218 438, 233 398, 243 360 C252 336, 253 308, 246 288 C238 268, 222 262, 206 271 C196 278, 188 286, 176 294 Z"
      :fill="`url(#${uid}-body)`"
      stroke="#9fa2a8"
      stroke-width="1.6"
      class="body-wood"
    />
    <!-- 琴身珠光高光 -->
    <path d="M96 320 C70 330, 56 356, 52 388 C56 352, 78 326, 108 312 Z" fill="#fff" opacity="0.5" />

    <!-- 白色护板（Strat 多片造型，含固定螺丝） -->
    <path
      d="M86 318 L186 318 L206 330 L216 348 L206 366 L222 378 L224 408 L210 420 L216 452 L202 464 L198 484 L172 488 L148 492 L116 486 L96 478 L78 470 L84 448 L72 430 L78 404 L70 384 L80 362 L72 344 L80 326 Z"
      :fill="`url(#${uid}-guard)`"
      stroke="#ced1d5"
      stroke-width="1.2"
    />
    <!-- 护板螺丝 -->
    <g fill="#c4c7cb">
      <circle cx="92" cy="326" r="2.2" /><circle cx="200" cy="326" r="2.2" />
      <circle cx="84" cy="452" r="2.2" /><circle cx="148" cy="484" r="2.2" />
      <circle cx="216" cy="444" r="2.2" /><circle cx="224" cy="384" r="2.2" />
    </g>

    <!-- 拾音器：琴颈/中间单线圈（白壳银柱） + 琴桥双线圈（白壳黑柱） -->
    <g>
      <rect x="112" y="352" width="76" height="24" rx="9" fill="#f2f3f4" stroke="#b9bcc0" stroke-width="1.2" />
      <g fill="#a9acb2">
        <circle v-for="i in 6" :key="i" :cx="124 + i * 10.4" cy="364" r="3" />
      </g>
      <rect x="112" y="402" width="76" height="24" rx="9" fill="#f2f3f4" stroke="#b9bcc0" stroke-width="1.2" />
      <g fill="#a9acb2">
        <circle v-for="i in 6" :key="i" :cx="124 + i * 10.4" cy="414" r="3" />
      </g>
      <rect x="110" y="452" width="80" height="34" rx="10" fill="#f2f3f4" stroke="#b9bcc0" stroke-width="1.2" />
      <g fill="#3c3e42">
        <circle v-for="i in 6" :key="i" :cx="122 + i * 10.4" cy="464" r="3" />
        <circle v-for="i in 6" :key="'b' + i" :cx="122 + i * 10.4" cy="474" r="3" />
      </g>
    </g>

    <!-- 琴桥（银色 6 鞍 + 调节螺丝） -->
    <g>
      <rect x="106" y="500" width="88" height="26" rx="6" :fill="`url(#${uid}-metal)`" stroke="#787a80" stroke-width="1.2" />
      <g stroke="#6e7076" stroke-width="1">
        <line v-for="i in 6" :key="i" :x1="112 + i * 13" :x2="112 + i * 13" :y1="504" :y2="522" />
      </g>
      <g fill="#aeb0b6">
        <circle cx="150" cy="548" r="3" /><circle cx="166" cy="548" r="3" /><circle cx="182" cy="548" r="3" />
      </g>
    </g>

    <!-- 弦（6 根，琴头 → 琴桥） -->
    <g :stroke="`url(#${uid}-metal)`" fill="none">
      <line v-for="s in strings" :key="s.w" :x1="s.x1" :y1="86" :x2="s.x2" :y2="500" :stroke-width="s.w" />
    </g>

    <!-- 5 档拨杆（数据驱动位置） -->
    <g :class="{ on: on(panel.switch.field) }">
      <!-- 底座槽 -->
      <rect :x="panel.switch.x - 7" :y="panel.switch.y - 24" width="14" height="48" rx="7" fill="#58595e" stroke="#3e3f44" stroke-width="1" />
      <rect :x="panel.switch.x - 4.5" :y="panel.switch.y - 21" width="9" height="42" rx="4.5" fill="#232427" />
      <!-- 档位刻度点（沿行程） -->
      <g v-for="p in panel.switch.positions" :key="p">
        <circle
          :cx="panel.switch.x + 13"
          :cy="panel.switch.y - 17 + (p - 1) * 8.5"
          r="2"
          :class="['sw-tick', { 'sw-on': pickupPositions.includes(p) }]"
        />
      </g>
      <!-- 白帽拨杆（居中位） -->
      <g :transform="`translate(${panel.switch.x}, ${panel.switch.y}) rotate(-18)`">
        <rect x="-3" y="-30" width="6" height="26" rx="3" :fill="`url(#${uid}-metal)`" stroke="#6e7076" stroke-width="0.8" />
        <ellipse cx="0" cy="-32" rx="9" ry="7" fill="#f6f6f4" stroke="#c9cacd" stroke-width="0.8" />
      </g>
      <rect v-if="pickupPositions.length && on(panel.switch.field)" :x="panel.switch.x - 14" :y="panel.switch.y - 31" width="40" height="62" rx="12" fill="none" class="hl-ring" />
    </g>

    <!-- 音量/音色白色旋钮（数据驱动位置） -->
    <g v-for="k in panel.knobs" :key="k.field" :class="{ on: on(k.field) }">
      <circle :cx="k.x" :cy="k.y" r="13.5" fill="#f4f4f2" stroke="#b9babd" stroke-width="1.2" />
      <circle :cx="k.x" :cy="k.y" r="3" fill="#8d8f94" />
      <g stroke="#c3c4c8" stroke-width="0.9">
        <line :x1="k.x + 10" :y1="k.y" :x2="k.x + 13" :y2="k.y" />
        <line :x1="k.x" :y1="k.y - 10" :x2="k.x" :y2="k.y - 13" />
        <line :x1="k.x" :y1="k.y + 10" :x2="k.x" :y2="k.y + 13" />
        <line :x1="k.x - 10" :y1="k.y" :x2="k.x - 13" :y2="k.y" />
      </g>
      <!-- 顶部指示刻度（当前高亮时指向提示值） -->
      <circle v-if="on(k.field)" :cx="k.x" :cy="k.y - 11" r="2.2" class="knob-pt" />
      <circle v-if="on(k.field)" :cx="k.x" :cy="k.y" r="17.5" class="hl-ring" />
      <text :x="k.x" :y="k.y + 30" text-anchor="middle" class="knob-label">{{ k.label }}</text>
      <title>{{ k.label }}：{{ k.note }}</title>
    </g>

    <text :x="panel.width / 2" :y="panel.height - 8" text-anchor="middle" class="panel-note">{{ panel.note }}</text>
  </svg>
</template>

<style scoped>
.guitar-panel { width: 100%; display: block; }

.head-logo { fill: #232427; font-size: 17px; font-weight: 900; font-style: italic; }
.head-model { fill: #232427; font-size: 9px; font-weight: 700; }

.knob-pt { fill: var(--accent, #e30613); }
.sw-tick { fill: #6e6f75; }
.sw-on { fill: var(--accent, #e30613); }
.knob-label { fill: var(--text-dim, #6f6c64); font-size: 10px; font-weight: 700; }
.panel-note { fill: #9a9a9e; font-size: 9px; }

.hl-ring { fill: none; stroke: var(--accent, #e30613); stroke-width: 2.5; }
</style>
