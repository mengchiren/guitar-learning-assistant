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

// 品记位置（示意 12 品双点）
const inlays = [
  { y: 124 }, { y: 148 }, { y: 172 }, { y: 196 }, { y: 220 },
  { y: 244, double: true }, { y: 268 }, { y: 290 },
]
// 弦（6 根，低音粗到高音细）；起点在琴头，终点在琴桥
const strings = [1, 2, 3, 4, 5, 6].map((i) => ({
  w: 0.6 + (6 - i) * 0.26,
  x1: 145 + (7 - i) * 2.5,
  x2: 143 + (7 - i) * 2.8,
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
        <stop offset="0" stop-color="#d9dbe0" />
        <stop offset="0.5" stop-color="#cccfd5" />
        <stop offset="1" stop-color="#b4b8bf" />
      </linearGradient>
      <!-- 琴头/琴颈枫木 -->
      <linearGradient :id="`${uid}-wood`" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e9d3a9" />
        <stop offset="0.5" stop-color="#f1deb7" />
        <stop offset="1" stop-color="#dec695" />
      </linearGradient>
      <!-- 指板玫瑰木 -->
      <linearGradient :id="`${uid}-fretboard`" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#6f4326" />
        <stop offset="0.5" stop-color="#844f2c" />
        <stop offset="1" stop-color="#6f4326" />
      </linearGradient>
      <!-- 护板白 -->
      <linearGradient :id="`${uid}-guard`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fdfdfe" />
        <stop offset="1" stop-color="#eef0f3" />
      </linearGradient>
      <!-- 金属件 -->
      <linearGradient :id="`${uid}-metal`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e9eaee" />
        <stop offset="0.5" stop-color="#b9bbc2" />
        <stop offset="1" stop-color="#8f9298" />
      </linearGradient>
    </defs>

    <!-- ══ 琴头（枫木，顶部微尖，右侧弦钮列） ══ -->
    <path
      d="M136 8 C148 0, 166 6, 172 28 L176 56 L170 96 L130 96 L128 42 C128 26, 130 14, 136 8 Z"
      :fill="`url(#${uid}-wood)`"
      stroke="#b79a63"
      stroke-width="1.2"
    />
    <!-- Ibanez 斜体 logo + GRX 40 -->
    <text x="150" y="52" text-anchor="middle" class="head-logo" transform="rotate(-58 150 46)">Ibanez</text>
    <text x="137" y="80" class="head-model" transform="rotate(-22 140 78)">GRX 40</text>
    <!-- 弦钮（右侧 6 颗银色） -->
    <g v-for="i in 6" :key="i">
      <circle :cx="191" :cy="22 + i * 11.5" r="4.6" :fill="`url(#${uid}-metal)`" stroke="#7a7c82" stroke-width="0.8" />
      <rect :x="194.5" :y="19.2 + i * 11.5" width="7" height="5.5" rx="2" :fill="`url(#${uid}-metal)`" stroke="#7a7c82" stroke-width="0.6" />
    </g>

    <!-- ══ 琴颈 + 指板 ══ -->
    <rect x="136" y="94" width="28" height="230" :fill="`url(#${uid}-wood)`" stroke="#c2a771" stroke-width="0.6" />
    <rect x="140" y="100" width="20" height="216" :fill="`url(#${uid}-fretboard)`" stroke="#5a3319" stroke-width="0.6" />
    <!-- 品丝 -->
    <g v-for="f in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]" :key="f" :stroke="`url(#${uid}-metal)`" stroke-width="1.4">
      <line :x1="140" :x2="160" :y1="104 + f * 18.5" :y2="104 + f * 18.5" />
    </g>
    <!-- 圆点品记 -->
    <g v-for="iv in inlays" :key="iv.y">
      <circle :cx="150" :cy="iv.y" r="2.6" fill="#f2f2ee" opacity="0.95" />
      <circle v-if="iv.double" :cx="150" :cy="iv.y + 7" r="2.6" fill="#f2f2ee" opacity="0.95" />
    </g>

    <!-- ══ 琴身（浅灰双缺角 Strat 型：双肩尖角 + 深凹口 + 下腰宽 + 底部圆弧） ══ -->
    <path
      d="M150 322
         C140 312, 133 306, 126 300
         C116 290, 106 280, 96 274
         C88 268, 80 264, 72 270
         C62 278, 56 292, 54 308
         C51 322, 49 336, 50 352
         C46 380, 44 408, 44 430
         C45 470, 52 505, 62 535
         C70 562, 82 588, 96 610
         C106 626, 118 638, 132 644
         C138 647, 144 648, 150 648
         C156 648, 162 647, 168 644
         C182 638, 194 626, 204 610
         C218 588, 230 562, 238 535
         C248 505, 255 470, 256 430
         C256 408, 254 380, 250 352
         C251 336, 249 322, 246 308
         C244 292, 238 278, 228 270
         C220 264, 212 268, 204 274
         C194 280, 184 290, 174 300
         C167 306, 160 312, 150 322
         Z"
      :fill="`url(#${uid}-body)`"
      stroke="#9fa2a8"
      stroke-width="1.6"
      class="body-wood"
    />
    <!-- 琴身珠光高光 -->
    <path d="M80 360 C66 388, 60 424, 62 460 C66 430, 76 398, 96 374 Z" fill="#fff" opacity="0.45" />

    <!-- ══ 白色护板（Strat 造型：上缘平 + 右下包旋钮 + 底部圆弧 + 左侧曲线） ══ -->
    <path
      d="M92 352
         L186 352
         C198 352, 208 358, 212 368
         C218 380, 216 392, 212 402
         C222 410, 226 424, 226 442
         C226 464, 222 486, 218 502
         C224 516, 228 530, 228 544
         C228 558, 220 568, 208 572
         C190 578, 168 578, 148 574
         C126 570, 106 562, 92 550
         C80 540, 74 526, 74 510
         C70 494, 68 476, 70 458
         C68 442, 68 426, 70 410
         C68 398, 68 384, 70 372
         C72 360, 78 354, 92 352
         Z"
      :fill="`url(#${uid}-guard)`"
      stroke="#b6bac0"
      stroke-width="1.4"
    />
    <!-- 护板螺丝 -->
    <g fill="#c4c7cb">
      <circle cx="94" cy="362" r="2.2" /><circle cx="198" cy="362" r="2.2" />
      <circle cx="84" cy="494" r="2.2" /><circle cx="146" cy="522" r="2.2" />
      <circle cx="212" cy="480" r="2.2" /><circle cx="222" cy="420" r="2.2" />
    </g>

    <!-- ══ 拾音器：琴颈/中间单线圈（白壳银柱） + 琴桥双线圈（白壳黑柱） ══ -->
    <g>
      <rect x="112" y="392" width="76" height="24" rx="9" fill="#f2f3f4" stroke="#b9bcc0" stroke-width="1.2" />
      <g fill="#a9acb2">
        <circle v-for="i in 6" :key="i" :cx="124 + i * 10.4" cy="404" r="3" />
      </g>
      <rect x="112" y="440" width="76" height="24" rx="9" fill="#f2f3f4" stroke="#b9bcc0" stroke-width="1.2" />
      <g fill="#a9acb2">
        <circle v-for="i in 6" :key="i" :cx="124 + i * 10.4" cy="452" r="3" />
      </g>
      <rect x="108" y="488" width="84" height="36" rx="10" fill="#f2f3f4" stroke="#b9bcc0" stroke-width="1.2" />
      <g fill="#3c3e42">
        <circle v-for="i in 6" :key="i" :cx="120 + i * 10.4" cy="500" r="3" />
        <circle v-for="i in 6" :key="'b' + i" :cx="120 + i * 10.4" cy="513" r="3" />
      </g>
    </g>

    <!-- ══ 琴桥（银色 6 鞍 + 调节螺丝） ══ -->
    <g>
      <rect x="102" y="588" width="96" height="28" rx="6" :fill="`url(#${uid}-metal)`" stroke="#787a80" stroke-width="1.2" />
      <g stroke="#6e7076" stroke-width="1">
        <line v-for="i in 6" :key="i" :x1="108 + i * 14" :x2="108 + i * 14" :y1="592" :y2="612" />
      </g>
      <g fill="#aeb0b6">
        <circle cx="150" cy="630" r="3" /><circle cx="166" cy="630" r="3" /><circle cx="182" cy="630" r="3" />
      </g>
    </g>

    <!-- ══ 弦（6 根，琴头 → 琴桥） ══ -->
    <g :stroke="`url(#${uid}-metal)`" fill="none">
      <line v-for="s in strings" :key="s.w" :x1="s.x1" :y1="96" :x2="s.x2" :y2="588" :stroke-width="s.w" />
    </g>

    <!-- ══ 5 档拨杆（数据驱动位置） ══ -->
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

    <!-- ══ 音量/音色白色旋钮（数据驱动位置） ══ -->
    <g v-for="k in panel.knobs" :key="k.field" :class="{ on: on(k.field) }">
      <circle :cx="k.x" :cy="k.y" r="13.5" fill="#f4f4f2" stroke="#b9babd" stroke-width="1.2" />
      <circle :cx="k.x" :cy="k.y" r="3" fill="#8d8f94" />
      <g stroke="#c3c4c8" stroke-width="0.9">
        <line :x1="k.x + 10" :y1="k.y" :x2="k.x + 13" :y2="k.y" />
        <line :x1="k.x" :y1="k.y - 10" :x2="k.x" :y2="k.y - 13" />
        <line :x1="k.x" :y1="k.y + 10" :x2="k.x" :y2="k.y + 13" />
        <line :x1="k.x - 10" :y1="k.y" :x2="k.x - 13" :y2="k.y" />
      </g>
      <!-- 刻度文字 -->
      <text :x="k.x" :y="k.y - 22" text-anchor="middle" class="knob-num">{{ k.label === '音量' ? 'VOLUME' : 'TONE' }}</text>
      <circle v-if="on(k.field)" :cx="k.x" :cy="k.y" r="17.5" class="hl-ring" />
      <title>{{ k.label }}：{{ k.note }}</title>
    </g>
  </svg>
</template>

<style scoped>
.guitar-panel { width: 100%; display: block; }

.head-logo { fill: #232427; font-size: 19px; font-weight: 900; font-style: italic; }
.head-model { fill: #232427; font-size: 9px; font-weight: 700; }

.knob-num { fill: #6f7076; font-size: 6.5px; font-weight: 700; }
.sw-tick { fill: #6e6f75; }
.sw-on { fill: var(--accent, #e30613); }

.hl-ring { fill: none; stroke: var(--accent, #e30613); stroke-width: 2.5; }
</style>
