<script setup>
// 吉他写实示意图（v0.17.2 重画）：按用户实物照片（Ibanez GRX40-LGY，接近白色珠光）绘制的正面全身图。
// 比例按实物照片网格标注法重推（0.66 单位/mm，全琴 975mm → 648 单位）：
//   琴头 180mm（y8~127）/ 弦长 648mm（琴枕 y127 → 琴桥 y555）/ 琴身长约 440mm（角尖 y~373 → 底 y655）/ 宽 292mm（~193 单位）。
// 对照照片修正：①6 颗弦钮全部在琴头左侧一字排开；②琴身双缺角——左角细长上竖、右角粗短外撇，
// 缺口为紧贴指板的细缝钩槽、腰身浅、下身宽圆；③琴身白珠光；④指板端宽 57mm（38 单位），单线圈略宽于指板；
// ⑤琴桥右侧黑色输出插孔；⑥品丝 12 平均律递减 22 品，品记 3/5/7/9/15 单点 + 12 品双点；
// ⑦拨杆白帽朝下（指向琴桥方向，与实物一致）。拨杆与旋钮由 devices.js 的 guitar.panel 数据驱动。
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

const NUT_Y = 127
const SADDLE_Y = 556
// 品丝位置：按 12 平均律从琴枕（y127）递减（弦长 428 单位），22 品，指板延伸过琴身
const frets = [
  151, 173.7, 195, 215.2, 234.2, 252.2, 269.3, 285.7, 301.1, 315.3,
  328.5, 341, 352.5, 363.2, 373, 382.8, 391.8, 399.9, 407.3, 413.9, 423.4, 437,
]
// 品记：3/5/7/9/15 品单点 + 12 品双点（位于两品丝之间的品阶中央）
const inlays = [
  { y: 184.4 }, { y: 224.7 }, { y: 260.8 }, { y: 293.4 },
  { y: 334.8, double: true }, { y: 368.1 },
]
// 弦（6 根，i=1 高音 e 最细在最右）：琴枕处束窄（跨 23）、琴桥处展开（跨 34）
const strings = [1, 2, 3, 4, 5, 6].map((i) => {
  const s = i - 1
  const nutX = 161.5 - s * 4.6
  const bridgeX = 167 - s * 6.8
  const at = (y) => nutX + (bridgeX - nutX) * ((y - NUT_Y) / (SADDLE_Y - NUT_Y))
  return { w: 0.55 + (6 - i) * 0.27, nutX, bridgeX, pkX: at(457), hbX: at(517) }
})
// 头部段：第 j 个弦钮柱（上→下）对应第 7-j 根弦（最上柱 = 最粗低音 E 在最左）
const headStrings = [1, 2, 3, 4, 5, 6].map((j) => ({
  j,
  postY: 22 + (j - 1) * 17,
  nutX: 161.5 - (6 - j) * 4.6,
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
      <!-- 琴身白珠光 -->
      <linearGradient :id="`${uid}-body`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f4f5f7" />
        <stop offset="0.45" stop-color="#e9ebee" />
        <stop offset="1" stop-color="#cdd1d7" />
      </linearGradient>
      <!-- 琴头/琴颈枫木 -->
      <linearGradient :id="`${uid}-wood`" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e8d2a6" />
        <stop offset="0.5" stop-color="#f2e0b8" />
        <stop offset="1" stop-color="#ddc493" />
      </linearGradient>
      <!-- 指板玫瑰木 -->
      <linearGradient :id="`${uid}-fretboard`" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#6a4125" />
        <stop offset="0.5" stop-color="#7f4d2b" />
        <stop offset="1" stop-color="#6a4125" />
      </linearGradient>
      <!-- 护板白 -->
      <linearGradient :id="`${uid}-guard`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="1" stop-color="#eef0f3" />
      </linearGradient>
      <!-- 金属件 -->
      <linearGradient :id="`${uid}-metal`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e9eaee" />
        <stop offset="0.5" stop-color="#b9bbc2" />
        <stop offset="1" stop-color="#8f9298" />
      </linearGradient>
    </defs>

    <!-- ══ 琴身（对照实物网格：双角为竖直粗柱状、角尖小而略外撇；缺口细缝紧贴指板；
              肩部圆顺过到最宽处（y~470）；浅腰；下身回宽后收圆底） ══ -->
    <path
      class="body-wood"
      d="M132 440
         C130 443, 130 445, 130 446
         C126 444, 120 434, 118 424
         C112 404, 102 386, 95 372
         C88 378, 81 389, 77 401
         L76 414
         C74 434, 70 452, 66 468
         C64 482, 66 496, 70 508
         C74 519, 78 526, 79 532
         C68 548, 58 562, 55 578
         C56 606, 78 634, 112 647
         C125 652, 138 654, 150 654
         C162 654, 175 652, 188 647
         C222 634, 244 606, 245 578
         C242 562, 232 548, 221 532
         C222 526, 224 519, 228 508
         C232 496, 236 482, 234 468
         C232 452, 231 438, 231 424
         L231 414
         C229 406, 226 400, 222 396
         C212 411, 190 430, 176 438
         C171 441, 169 441, 168 440
         Z"
      :fill="`url(#${uid}-body)`"
      stroke="#b3b7bd"
      stroke-width="1.6"
    />
    <!-- 琴身珠光高光 -->
    <path d="M62 470 C56 500, 58 540, 68 570 C60 538, 60 500, 68 474 Z" fill="#fff" opacity="0.5" />
    <path d="M240 476 C246 506, 244 546, 234 576 C242 544, 242 506, 234 480 Z" fill="#fff" opacity="0.35" />

    <!-- ══ 白色护板（上端两尖角夹琴颈伸入缺口，右侧包拨杆+双旋钮，下缘圆弧过琴桥） ══ -->
    <path
      d="M126 424
         C136 434, 144 438, 150 438
         C156 438, 164 434, 174 424
         C185 436, 192 454, 196 472
         C200 490, 206 502, 214 514
         C224 528, 228 544, 227 560
         C225 576, 215 587, 200 592
         C176 600, 142 602, 114 596
         C90 590, 74 572, 67 548
         C61 522, 64 494, 70 468
         C77 442, 102 428, 126 424
         Z"
      :fill="`url(#${uid}-guard)`"
      stroke="#c6c9ce"
      stroke-width="1.3"
    />
    <!-- 护板螺丝 -->
    <g fill="#b9bcc2" stroke="#9fa2a8" stroke-width="0.5">
      <circle cx="130" cy="430" r="2" /><circle cx="170" cy="430" r="2" />
      <circle cx="76" cy="460" r="2" /><circle cx="69" cy="520" r="2" />
      <circle cx="80" cy="578" r="2" /><circle cx="134" cy="598" r="2" />
      <circle cx="190" cy="588" r="2" /><circle cx="222" cy="562" r="2" />
      <circle cx="208" cy="500" r="2" /><circle cx="182" cy="442" r="2" />
    </g>

    <!-- ══ 拾音器：琴颈/中间单线圈（白壳银柱）+ 琴桥双线圈（白壳黑磁柱），宽度略宽于指板 ══ -->
    <g>
      <rect x="127" y="450.5" width="46" height="13" rx="6.5" fill="#f3f4f5" stroke="#b9bcc0" stroke-width="1" />
      <g fill="#a9acb2">
        <circle v-for="s in strings" :key="'np' + s.w" :cx="s.pkX" cy="457" r="1.9" />
      </g>
      <rect x="127" y="497.5" width="46" height="13" rx="6.5" fill="#f3f4f5" stroke="#b9bcc0" stroke-width="1" />
      <g fill="#a9acb2">
        <circle v-for="s in strings" :key="'mp' + s.w" :cx="s.pkX" cy="504" r="1.9" />
      </g>
      <rect x="124" y="503" width="52" height="29" rx="8" fill="#f3f4f5" stroke="#b9bcc0" stroke-width="1" />
      <g fill="#3c3e42">
        <circle v-for="s in strings" :key="'hp' + s.w" :cx="s.hbX" cy="511" r="2" />
        <circle v-for="s in strings" :key="'hb' + s.w" :cx="s.hbX" cy="524" r="2" />
      </g>
    </g>

    <!-- ══ 琴桥（银色 6 鞍，收进琴身）+ 琴桥右侧输出插孔 ══ -->
    <g>
      <rect x="121" y="553" width="58" height="21" rx="4" :fill="`url(#${uid}-metal)`" stroke="#787a80" stroke-width="1.1" />
      <g v-for="(s, i) in strings" :key="'sad' + i">
        <rect :x="s.bridgeX - 4.2" y="556" width="8.4" height="16" rx="2" fill="#d8d9dd" stroke="#8f9298" stroke-width="0.7" />
        <circle :cx="s.bridgeX" cy="571" r="1.3" fill="#7c7e84" />
      </g>
      <!-- 输出插孔（黑胶木座 + 银色芯） -->
      <circle cx="188" cy="566" r="6.5" fill="#26272b" stroke="#101114" stroke-width="1" />
      <circle cx="188" cy="566" r="2.8" :fill="`url(#${uid}-metal)`" />
    </g>

    <!-- ══ 琴颈 + 指板（画在琴身之后，盖住琴身接口线；指板延伸过琴身到 22 品） ══ -->
    <rect x="129" y="124" width="42" height="318" :fill="`url(#${uid}-wood)`" stroke="#c2a771" stroke-width="0.6" />
    <rect x="132" y="127" width="36" height="310" :fill="`url(#${uid}-fretboard)`" stroke="#5a3319" stroke-width="0.6" />
    <!-- 品丝 -->
    <g stroke="#c8cad0" stroke-width="1.2">
      <line v-for="(fy, f) in frets" :key="f" x1="132" x2="168" :y1="fy" :y2="fy" />
    </g>
    <!-- 圆点品记（3/5/7/9/15 单点，12 品双点） -->
    <g fill="#f2f2ee">
      <template v-for="iv in inlays" :key="iv.y">
        <template v-if="iv.double">
          <circle cx="145.8" :cy="iv.y" r="2.2" />
          <circle cx="154.2" :cy="iv.y" r="2.2" />
        </template>
        <circle v-else cx="150" :cy="iv.y" r="2.2" />
      </template>
    </g>

    <!-- ══ 琴头（枫木尖头，Ibanez GIO，6 弦钮左侧一列） ══ -->
    <path
      d="M130 124
         C126 92, 122 60, 123 40
         C124 22, 136 12, 150 10
         C160 9, 170 12, 173 20
         C166 38, 163 52, 165 68
         C167 88, 165 106, 170 124
         Z"
      :fill="`url(#${uid}-wood)`"
      stroke="#b79a63"
      stroke-width="1.2"
    />
    <!-- 弦钮：6 颗银色，全部在琴头左侧一字排开 -->
    <g v-for="j in 6" :key="'tuner' + j">
      <ellipse :cx="119 + (j - 1) * 1.4" :cy="22 + (j - 1) * 17" rx="6.5" ry="7.5" :fill="`url(#${uid}-metal)`" stroke="#7a7c82" stroke-width="0.8" />
      <ellipse :cx="117.5 + (j - 1) * 1.4" :cy="22 + (j - 1) * 17" rx="2.3" ry="4.2" fill="#f4f5f7" opacity="0.7" />
    </g>
    <!-- 弦钮柱（琴头正面） -->
    <g v-for="j in 6" :key="'post' + j">
      <circle cx="154" :cy="22 + (j - 1) * 17" r="2.7" :fill="`url(#${uid}-metal)`" stroke="#7a7c82" stroke-width="0.6" />
    </g>
    <!-- GIO + Ibanez 斜排 logo（旋转组内定位，收在琴头木面内，GIO 靠琴头尖） -->
    <g transform="translate(163 62) rotate(-90)">
      <text x="26" y="2.5" text-anchor="middle" class="head-gio">GIO</text>
      <text x="-15" y="2.5" text-anchor="middle" class="head-logo">Ibanez</text>
    </g>
    <!-- 琴枕 -->
    <rect x="129" y="124" width="42" height="6" fill="#f4f2e8" stroke="#c9c6b8" stroke-width="0.5" />

    <!-- ══ 弦（琴头弦钮柱 → 琴枕 → 琴桥鞍） ══ -->
    <g :stroke="`url(#${uid}-metal)`" fill="none">
      <line v-for="h in headStrings" :key="'hs' + h.j" x1="154" :y1="h.postY" :x2="h.nutX" :y2="NUT_Y + 1" stroke-width="0.7" />
      <line v-for="s in strings" :key="s.w" :x1="s.nutX" :y1="NUT_Y + 1" :x2="s.bridgeX" :y2="SADDLE_Y" :stroke-width="s.w" />
    </g>

    <!-- ══ 5 档拨杆（数据驱动位置，白帽朝下指向琴桥方向，与实物一致） ══ -->
    <g :class="{ on: on(panel.switch.field) }">
      <!-- 底座槽 -->
      <rect :x="panel.switch.x - 6" :y="panel.switch.y - 15" width="12" height="30" rx="6" fill="#58595e" stroke="#3e3f44" stroke-width="1" />
      <rect :x="panel.switch.x - 3.8" :y="panel.switch.y - 12.5" width="7.6" height="25" rx="3.8" fill="#232427" />
      <!-- 档位刻度点（沿行程右侧） -->
      <g v-for="p in panel.switch.positions" :key="p">
        <circle
          :cx="panel.switch.x + 11"
          :cy="panel.switch.y - 14 + (p - 1) * 7"
          r="1.8"
          :class="['sw-tick', { 'sw-on': pickupPositions.includes(p) }]"
        />
      </g>
      <!-- 白帽拨杆（居中位，帽朝下） -->
      <g :transform="`translate(${panel.switch.x}, ${panel.switch.y}) rotate(160)`">
        <rect x="-2.8" y="-25" width="5.6" height="22" rx="2.8" :fill="`url(#${uid}-metal)`" stroke="#6e7076" stroke-width="0.8" />
        <ellipse cx="0" cy="-27" rx="8" ry="6" fill="#f6f6f4" stroke="#c9cacd" stroke-width="0.8" />
      </g>
      <rect v-if="pickupPositions.length && on(panel.switch.field)" :x="panel.switch.x - 11" :y="panel.switch.y - 26" width="36" height="52" rx="10" fill="none" class="hl-ring" />
      <title>{{ panel.switch.label || '档位' }}：{{ panel.switch.note }}</title>
    </g>

    <!-- ══ 音量/音色白色旋钮（数据驱动位置，带刻度点圈） ══ -->
    <g v-for="k in panel.knobs" :key="k.field" :class="{ on: on(k.field) }">
      <!-- 周围 10 个刻度点（模拟旋钮座刻度 1~10） -->
      <g fill="#a8abb1">
        <circle
          v-for="n in 10"
          :key="n"
          :cx="k.x + 12.5 * Math.cos((-60 + (n - 1) * 28) * Math.PI / 180)"
          :cy="k.y + 12.5 * Math.sin((-60 + (n - 1) * 28) * Math.PI / 180)"
          r="0.9"
        />
      </g>
      <circle :cx="k.x" :cy="k.y" r="9" fill="#f4f4f2" stroke="#b9babd" stroke-width="1.1" />
      <circle :cx="k.x" :cy="k.y" r="6" fill="none" stroke="#d4d5d8" stroke-width="0.8" />
      <circle :cx="k.x" :cy="k.y" r="2" fill="#8d8f94" />
      <!-- 帽面指示线（指向 10 点方向，示意可旋） -->
      <line :x1="k.x" :y1="k.y" :x2="k.x - 5" :y2="k.y - 3" stroke="#6f7076" stroke-width="1.4" stroke-linecap="round" />
      <!-- 名称印字（旋钮下方） -->
      <text :x="k.x" :y="k.y + 21" text-anchor="middle" class="knob-num">{{ k.label === '音量' ? 'VOLUME' : 'TONE' }}</text>
      <circle v-if="on(k.field)" :cx="k.x" :cy="k.y" r="13" class="hl-ring" />
      <title>{{ k.label }}：{{ k.note }}</title>
    </g>
  </svg>
</template>

<style scoped>
.guitar-panel { width: 100%; display: block; }

.head-gio { fill: #232427; font-size: 8.5px; font-weight: 900; letter-spacing: 1px; }
.head-logo { fill: #232427; font-size: 11px; font-weight: 900; font-style: italic; }

.knob-num { fill: #6f7076; font-size: 6.5px; font-weight: 700; }
.sw-tick { fill: #6e6f75; }
.sw-on { fill: var(--accent, #e30613); }

.hl-ring { fill: none; stroke: var(--accent, #e30613); stroke-width: 2.5; }
</style>
