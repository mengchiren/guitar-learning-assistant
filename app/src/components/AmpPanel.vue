<script setup>
// 音箱写实示意图（v0.17.0）：按用户实物照片（JOYO Jam Buddy 2 黑色版）绘制的 3/4 立体视角。
// - 机身/网罩/品牌区为设备专属装饰（本组件固定），旋钮/开关/屏幕/LED/踏板/接口由 devices.js 的 amp.panel 数据驱动
// - 数值旋钮（kind=num）：帽顶白色指示刻线按 min/max 映射角度（0→7:30，满→4:30，与真实旋钮一致）
// - 循环选择旋钮（kind=text）：只高亮 + 下方显示当前值（帽顶无刻线，避免误导"已调到某位置"）
// - 高亮 = 当前套路建议要动的旋钮/踏板（主题色圈 + 值标签）
// - LED 指示灯随 values.channel / values.driveMode 点亮（当前通道状态可读）
// - interactive 模式（音箱入门页）：点旋钮/开关/LED/踏板触发 select 事件看说明
import { computed } from 'vue'

const props = defineProps({
  panel: { type: Object, required: true },
  values: { type: Object, default: () => ({}) }, // field → 当前值（如 { gain: 7, model: 'Rock' }）
  highlight: { type: Array, default: () => [] }, // 需要高亮的 field 列表
  interactive: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

// 渐变/滤镜 id 前缀：防止同页多实例（多主题下同渲染路径）时 SVG defs 冲突
const uid = 'ap' + Math.random().toString(36).slice(2, 8)

const START_ANGLE = 135 // 指针起始角（SVG 原生角：135°=左下 7 点半方向）
const SPAN = 270 // 0→满 顺时针扫 270°（7:30 → 12:00 → 4:30，和真实旋钮一致）
const SIGNS = ['RHYTHM', 'LEAD', 'DRIVE', 'CLEAN']

// 数值 → 指针角度（SVG 坐标 y 向下，角度顺时针）
function pointerAngle(knob) {
  const v = Number(props.values[knob.field])
  if (!Number.isFinite(v) || knob.kind !== 'num') return START_ANGLE
  const min = knob.min ?? 0
  const max = knob.max ?? 10
  const ratio = Math.max(0, Math.min(1, (v - min) / (max - min)))
  return START_ANGLE + SPAN * ratio
}

// 指示刻线外端点（帽顶白线，从 0.18r 到 0.72r）
function tickEnd(knob, nudge) {
  const deg = pointerAngle(knob)
  const rad = (deg * Math.PI) / 180
  const r = knob.r ?? 24
  return {
    x: knob.x + r * (nudge === undefined ? 0.72 : nudge) * Math.cos(rad),
    y: knob.y + r * (nudge === undefined ? 0.72 : nudge) * Math.sin(rad),
  }
}

// LED 点亮状态：通道/模式映射
const ledLit = computed(() => {
  const ch = String(props.values.channel || '')
  const dm = String(props.values.driveMode || '')
  return {
    RHYTHM: dm === 'RHYTHM',
    LEAD: dm === 'LEAD',
    DRIVE: ch === 'DRIVE',
    CLEAN: ch === 'CLEAN',
  }
})

// LED 组标签（DRIVE MODE / CHANNEL）居中于组内两灯之间（与实物一致）
const ledGroups = computed(() => {
  const g = {}
  for (const l of props.panel.leds || []) {
    if (!g[l.group]) g[l.group] = []
    g[l.group].push(l)
  }
  return Object.entries(g).map(([name, ls]) => ({
    name,
    x: ls.reduce((s, l) => s + l.x, 0) / ls.length,
    y: ls[0].y + 24,
  }))
})

const isNum = (k) => k.kind === 'num'
const on = (field) => props.highlight.includes(field)
const val = (field) => props.values[field]
</script>

<template>
  <svg
    :viewBox="`0 0 ${panel.width} ${panel.height}`"
    class="amp-panel"
    role="img"
    :aria-label="`${panel.brand} ${panel.brandSub} 面板示意图`"
  >
    <defs>
      <!-- 机身（暖深灰褐，上亮下暗） -->
      <linearGradient :id="`${uid}-shell`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5a5751" />
        <stop offset="0.35" stop-color="#3a3733" />
        <stop offset="1" stop-color="#211f1c" />
      </linearGradient>
      <!-- 网罩格栅底 -->
      <linearGradient :id="`${uid}-spk`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#26272b" />
        <stop offset="0.5" stop-color="#18191d" />
        <stop offset="1" stop-color="#1e1f23" />
      </linearGradient>
      <!-- 蜂窝网罩点阵 -->
      <pattern :id="`${uid}-mesh`" width="9" height="8" patternUnits="userSpaceOnUse">
        <circle cx="2.4" cy="2.4" r="1.9" fill="#0d0e10" />
        <circle cx="2.4" cy="2.4" r="1.1" fill="#33343a" />
        <circle cx="6.9" cy="6.4" r="1.9" fill="#0d0e10" />
        <circle cx="6.9" cy="6.4" r="1.1" fill="#33343a" />
      </pattern>
      <!-- 控制面板：银灰拉丝铝（对照俯视图实物） -->
      <linearGradient :id="`${uid}-panel`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#dcdee1" />
        <stop offset="0.5" stop-color="#c6c9cd" />
        <stop offset="1" stop-color="#adb0b5" />
      </linearGradient>
      <!-- 品牌黑光带（JOYO 徽标/LCD/LED 区） -->
      <linearGradient :id="`${uid}-strip`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2c2d33" />
        <stop offset="0.12" stop-color="#1a1b20" />
        <stop offset="1" stop-color="#101114" />
      </linearGradient>
      <!-- 琥珀色旋钮顶面（对照实物：黑身 + 半透明琥珀顶） -->
      <radialGradient :id="`${uid}-amber`" cx="0.38" cy="0.3" r="0.9">
        <stop offset="0" stop-color="#ffdf92" />
        <stop offset="0.4" stop-color="#f3bc45" />
        <stop offset="0.78" stop-color="#d0951e" />
        <stop offset="1" stop-color="#96660e" />
      </radialGradient>
      <!-- 旋钮黑身侧壁 -->
      <radialGradient :id="`${uid}-knobside`" cx="0.5" cy="0.42" r="0.72">
        <stop offset="0.62" stop-color="#3a3b40" />
        <stop offset="0.9" stop-color="#1a1b1f" />
        <stop offset="1" stop-color="#0c0d0f" />
      </radialGradient>
      <!-- 旋钮座 -->
      <radialGradient :id="`${uid}-knobbase`" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0" stop-color="#101114" />
        <stop offset="1" stop-color="#0b0c0e" />
      </radialGradient>
      <!-- 银色拨杆 -->
      <linearGradient :id="`${uid}-metal`" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8b8d92" />
        <stop offset="0.45" stop-color="#e9eaee" />
        <stop offset="1" stop-color="#74767c" />
      </linearGradient>
      <!-- LCD 屏（浅灰绿背光） -->
      <linearGradient :id="`${uid}-lcd`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c9cdbc" />
        <stop offset="0.6" stop-color="#a9aea0" />
        <stop offset="1" stop-color="#90958a" />
      </linearGradient>
      <!-- LED 光晕 -->
      <radialGradient :id="`${uid}-ledGlow`" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffc83d" stop-opacity="0.55" />
        <stop offset="0.6" stop-color="#ffc83d" stop-opacity="0.14" />
        <stop offset="1" stop-color="#ffc83d" stop-opacity="0" />
      </radialGradient>
      <!-- 踏板 -->
      <linearGradient :id="`${uid}-pedal`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#26272b" />
        <stop offset="0.12" stop-color="#1b1c1f" />
        <stop offset="1" stop-color="#0c0d0f" />
      </linearGradient>
      <!-- 机身落地阴影 -->
      <filter :id="`${uid}-blur`" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
    </defs>

    <!-- 落地阴影 -->
    <ellipse :cx="panel.width / 2" :cy="panel.height - 10" :rx="panel.width * 0.42" ry="24" fill="#000" opacity="0.4" :filter="`url(#${uid}-blur)`" />

    <!-- 机身外壳（大圆角黑塑） -->
    <rect x="44" y="6" :width="panel.width - 88" :height="panel.height - 22" rx="40" :fill="`url(#${uid}-shell)`" stroke="#0d0e10" stroke-width="1" />
    <rect x="52" y="14" :width="panel.width - 104" :height="panel.height - 38" rx="34" fill="none" stroke="#5a5b60" stroke-width="1" opacity="0.35" />

    <!-- ══ 顶部喇叭网罩（蜂窝点阵 + JOYO 浮雕） ══ -->
    <rect x="118" y="20" :width="panel.width - 236" height="72" rx="26" :fill="`url(#${uid}-spk)`" stroke="#000" stroke-width="1" />
    <rect x="122" y="24" :width="panel.width - 244" height="64" rx="22" :fill="`url(#${uid}-mesh)`" />
    <!-- JOYO 浮雕（暗底 + 银面两层错位） -->
    <text :x="panel.width / 2" y="71.5" text-anchor="middle" class="spk-brand spk-brand-shadow" :style="{ fontStyle: 'italic' }">JOYO</text>
    <text :x="panel.width / 2" y="70" text-anchor="middle" class="spk-brand" :style="{ fontStyle: 'italic' }">JOYO</text>

    <!-- ══ 控制面板（银灰拉丝铝，只到品牌黑光带上沿） ══ -->
    <rect x="64" y="102" :width="panel.width - 128" height="242" rx="16" :fill="`url(#${uid}-panel)`" stroke="#8e9196" stroke-width="1.2" />
    <!-- 拉丝纹理（细横线） -->
    <g stroke="#ffffff" stroke-width="0.8" opacity="0.16">
      <line v-for="i in 15" :key="'b' + i" x1="72" :x2="panel.width - 72" :y1="104 + i * 15.5" :y2="104 + i * 15.5" />
    </g>
    <g stroke="#5d6065" stroke-width="0.6" opacity="0.12">
      <line v-for="i in 15" :key="'d' + i" x1="72" :x2="panel.width - 72" :y1="110 + i * 15.5" :y2="110 + i * 15.5" />
    </g>
    <!-- ══ 品牌黑光带（JOYO 徽标 · LCD · JAM BUDDY II · 四枚 LED） ══ -->
    <rect x="64" y="348" :width="panel.width - 128" height="148" rx="14" :fill="`url(#${uid}-strip)`" stroke="#3a3b41" stroke-width="1" />
    <rect x="70" y="352" :width="panel.width - 140" height="6" rx="3" fill="#4a4b52" opacity="0.5" />

    <!-- ══ 旋钮（黑身 + 琥珀顶，对照实物） ══ -->
    <g
      v-for="k in panel.knobs"
      :key="k.field"
      :class="{ knob: true, on: on(k.field), clickable: interactive }"
      @click="interactive && emit('select', k.field)"
    >      <!-- 印刷标签（旋钮上方，深字印在银面板上） -->
      <text :x="k.x" :y="k.y - (k.r ?? 24) - 12" text-anchor="middle" class="knob-label">{{ k.label }}</text>
      <!-- 座圈 -->
      <circle :cx="k.x" :cy="k.y" :r="(k.r ?? 24) + 4" :fill="`url(#${uid}-knobbase)`" />
      <!-- 黑色帽身 -->
      <circle :cx="k.x" :cy="k.y" :r="k.r ?? 24" :fill="`url(#${uid}-knobside)`" stroke="#0a0b0d" stroke-width="1" />
      <!-- 琥珀顶面 -->
      <circle :cx="k.x" :cy="k.y - (k.r ?? 24) * 0.06" :r="(k.r ?? 24) * 0.74" :fill="`url(#${uid}-amber)`" stroke="#8a5f0c" stroke-width="0.7" />
      <!-- 顶面高光 -->
      <ellipse :cx="k.x - (k.r ?? 24) * 0.22" :cy="k.y - (k.r ?? 24) * 0.3" :rx="(k.r ?? 24) * 0.26" ry="(k.r ?? 24) * 0.14" fill="#fff" opacity="0.35" />
      <!-- 数值旋钮：帽顶白色指示刻线 -->
      <template v-if="isNum(k)">
        <line :x1="tickEnd(k, 0.12).x" :y1="tickEnd(k, 0.12).y - (k.r ?? 24) * 0.06" :x2="tickEnd(k, 0.52).x" :y2="tickEnd(k, 0.52).y - (k.r ?? 24) * 0.06" class="knob-tick" />
      </template>
      <!-- 高亮圈 -->
      <circle v-if="on(k.field)" :cx="k.x" :cy="k.y" :r="(k.r ?? 24) + 10" class="hl-ring" />
      <!-- 当前值标签（高亮时红底） -->
      <g v-if="val(k.field) !== undefined && on(k.field)">
        <rect :x="k.x - 52" :y="k.y - (k.r ?? 24) - 44" :width="104" :height="20" rx="10" class="val-chip" />
        <text :x="k.x" :y="k.y - (k.r ?? 24) - 30" text-anchor="middle" class="val-text">{{ val(k.field) }}</text>
      </g>
      <title>{{ k.label }}：{{ k.note }}</title>
    </g>

    <!-- ══ 拨杆开关（POWER / 蓝牙，不参与套路） ══ -->
    <g
      v-for="s in panel.switches"
      :key="s.id"
      :class="{ sw: true, clickable: interactive }"
      @click="interactive && emit('select', s.id)"
    >
      <text :x="s.x" :y="s.y - 30" text-anchor="middle" class="knob-label">{{ s.label }}</text>
      <!-- 状态灯孔 -->
      <circle :cx="s.x" :cy="s.y - 20" r="3" class="sw-led-hole" />
      <!-- 底座 -->
      <rect :x="s.x - 9" :y="s.y - 16" width="18" height="32" rx="6" fill="#1c1d21" stroke="#3d3e44" stroke-width="1" />
      <!-- 拨杆银杆 -->
      <rect :x="s.x - 3" :y="s.y - 12" width="6" height="24" rx="3" :fill="`url(#${uid}-metal)`" stroke="#4a4b51" stroke-width="0.6" />
      <rect :x="s.x - 2" :y="s.y - 10" width="2.4" height="18" rx="1.2" fill="#fff" opacity="0.5" />
      <!-- ON / OFF -->
      <text :x="s.x + 16" :y="s.y - 4" class="sw-state">ON</text>
      <text :x="s.x + 16" :y="s.y + 12" class="sw-state">OFF</text>
      <title>{{ s.label }}：{{ s.note }}</title>
    </g>

    <!-- ══ 品牌区：JOYO 徽标 · LCD 屏 · JAM BUDDY II ══ -->
    <g v-if="panel.screen">
      <rect x="150" y="352" width="98" height="36" rx="7" fill="#f5f5f2" />
      <text x="199" y="376" text-anchor="middle" class="brand-logo">JOYO</text>
      <rect :x="panel.screen.x" :y="panel.screen.y" :width="panel.screen.w" :height="panel.screen.h" rx="7" fill="#141518" stroke="#33343a" stroke-width="1.4" />
      <rect :x="panel.screen.x + 4" :y="panel.screen.y + 4" :width="panel.screen.w - 8" :height="panel.screen.h - 8" rx="4" :fill="`url(#${uid}-lcd)`" />
      <rect :x="panel.screen.x + 4" :y="panel.screen.y + 4" :width="panel.screen.w - 8" :height="14" rx="4" fill="#fff" opacity="0.16" />
      <text x="676" y="378" text-anchor="middle" class="brand-model">JAM BUDDY II</text>
      <g v-if="interactive" class="clickable" @click="emit('select', 'screen')">
        <title>屏幕：{{ panel.screen.note }}</title>
      </g>
    </g>

    <!-- ══ LED 指示灯（当前通道状态） ══ -->
    <g v-for="l in panel.leds" :key="l.id" :class="{ led: true, clickable: interactive }" @click="interactive && emit('select', l.id)">
      <circle v-if="ledLit[l.label]" :cx="l.x" :cy="l.y" r="11" :fill="`url(#${uid}-ledGlow)`" />
      <circle :cx="l.x" :cy="l.y" r="4.6" :class="['led-dot', { 'led-lit': ledLit[l.label] }]" />
      <text :x="l.x" :y="l.y - 13" text-anchor="middle" class="led-label">{{ l.label }}</text>
      <title>{{ l.label }}：{{ l.note }}</title>
    </g>
    <!-- LED 组标签（每组居中） -->
    <text v-for="g in ledGroups" :key="g.name" :x="g.x" :y="g.y" text-anchor="middle" class="led-group">{{ g.name }}</text>

    <!-- ══ 踏板区 ══ -->
    <g v-for="f in panel.pedals" :key="f.id" :class="{ pedal: f.type !== 'label', 'pedal-func': f.type === 'label', clickable: interactive }" @click="interactive && emit('select', f.id)">
      <!-- 实体踏板 -->
      <template v-if="f.type !== 'label'">
        <rect :x="f.x - f.w / 2" :y="f.y - f.h / 2" :width="f.w" :height="f.h" rx="12" :fill="`url(#${uid}-pedal)`" stroke="#08090b" stroke-width="1.2" />
        <!-- 横纹凸起（细密 8 条，对照实物） -->
        <g stroke="#0e0f12" stroke-width="2.6" opacity="0.95">
          <line v-for="i in 8" :key="i" :x1="f.x - f.w / 2 + 12" :x2="f.x + f.w / 2 - 12" :y1="f.y - f.h / 2 + 10 + i * 8.4" :y2="f.y - f.h / 2 + 10 + i * 8.4" />
        </g>
        <g stroke="#3a3b41" stroke-width="0.9" opacity="0.85">
          <line v-for="i in 8" :key="'h' + i" :x1="f.x - f.w / 2 + 12" :x2="f.x + f.w / 2 - 12" :y1="f.y - f.h / 2 + 11.2 + i * 8.4" :y2="f.y - f.h / 2 + 11.2 + i * 8.4" />
        </g>
        <!-- 顶部高光 -->
        <rect :x="f.x - f.w / 2 + 3" :y="f.y - f.h / 2 + 3" :width="f.w - 6" height="6" rx="3" fill="#4c4d52" opacity="0.55" />
        <!-- 高亮圈 -->
        <rect v-if="on(f.id)" :x="f.x - f.w / 2 - 5" :y="f.y - f.h / 2 - 5" :width="f.w + 10" :height="f.h + 10" rx="15" class="hl-ring" />
        <!-- 当前值标签（高亮时红底，踏板上方） -->
        <g v-if="val(f.id) !== undefined && on(f.id)">
          <rect :x="f.x - 52" :y="f.y - f.h / 2 - 34" :width="104" :height="20" rx="10" class="val-chip" />
          <text :x="f.x" :y="f.y - f.h / 2 - 20" text-anchor="middle" class="val-text">{{ val(f.id) }}</text>
        </g>
        <title>{{ f.label }}：{{ f.note }}</title>
      </template>
      <!-- 标签型功能区（LOOPER CONTROL） -->
      <template v-else>
        <text :x="f.x" :y="f.y" text-anchor="middle" class="pedal-func-label">{{ f.label }}</text>
        <line :x1="f.x - 132" :y1="f.y - 4" :x2="f.x - 24" :y2="f.y - 4" class="pedal-func-line" />
        <line :x1="f.x + 24" :y1="f.y - 4" :x2="f.x + 132" :y2="f.y - 4" class="pedal-func-line" />
        <title>{{ f.label }}：{{ f.note }}</title>
      </template>
    </g>
  </svg>
</template>

<style scoped>
.amp-panel { width: 100%; display: block; }

/* 浮雕/品牌 */
.spk-brand { fill: #b4b6bb; font-size: 30px; font-weight: 900; letter-spacing: 8px; }
.spk-brand-shadow { fill: #08090b; }
.brand-logo { fill: #141414; font-size: 20px; font-weight: 900; letter-spacing: 1px; }
.brand-model { fill: #e4e5e8; font-size: 19px; font-weight: 800; font-style: italic; letter-spacing: 2px; }

/* 旋钮印刷标签（银面板上印深字） */
.knob-label { fill: #3b3c40; font-size: 10px; font-weight: 700; letter-spacing: 0.3px; }
.knob-tick { stroke: #fffdf4; stroke-width: 2.6; stroke-linecap: round; }

/* 高亮圈/值标签（主题色） */
.hl-ring { fill: none; stroke: var(--accent, #e30613); stroke-width: 3.5; }
.val-chip { fill: var(--accent, #e30613); }
.val-text { fill: #fff; font-size: 11px; font-weight: 800; }

/* 拨杆 */
.sw-led-hole { fill: #0c0d0f; stroke: #55575d; stroke-width: 1; }
.sw-state { fill: #4a4b50; font-size: 8px; font-weight: 600; }

/* LED */
.led-dot { fill: #33353a; stroke: #45474d; stroke-width: 1; }
.led-lit { fill: #ffc83d; stroke: #b98a1e; }
.led-label { fill: #c6c7cb; font-size: 9.5px; font-weight: 700; }
.led-group { fill: #8f9095; font-size: 9px; font-weight: 600; letter-spacing: 1.5px; }
.pedal-func-label { fill: #b9babf; font-size: 11px; font-weight: 800; letter-spacing: 2px; }
.pedal-func-line { stroke: #6e6f74; stroke-width: 1.4; }

.clickable { cursor: pointer; }
.clickable:hover .knob-label, .clickable:hover .led-label { fill: var(--accent, #e30613); }
</style>
