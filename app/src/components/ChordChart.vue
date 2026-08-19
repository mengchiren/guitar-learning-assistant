<script setup>
import { computed } from 'vue'
import { findChord } from '../data/chords.js'

// 和弦指法图：自绘 SVG（6 弦 5 品，顶部 x/o 标记，按弦点显示品位）
const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 84 }, // 图宽 px（高按比例），放大查看时调大
})

const chord = computed(() => findChord(props.name))
const XS = [12, 24, 36, 48, 60, 72] // 6 弦（低 E）→ 1 弦（高 e）的 x 坐标
const NUT_Y = 26 // 琴枕
const FRET_H = 17 // 每品高度
const BOTTOM_Y = NUT_Y + FRET_H * 5

const dots = computed(() => {
  const out = []
  const base = chord.value?.baseFret || 1
  chord.value?.frets.forEach((f, i) => {
    if (typeof f === 'number' && f > 0) {
      const rel = f - base + 1
      out.push({ x: XS[i], y: NUT_Y + FRET_H * (rel - 0.5), fret: f })
    }
  })
  return out
})
const topMarks = computed(() => {
  if (!chord.value) return []
  return chord.value.frets.map((f, i) => ({
    x: XS[i],
    kind: f === 'x' ? 'x' : f === 0 ? 'o' : null,
  }))
})
</script>

<template>
  <div class="chord-chart" :style="{ width: size + 12 + 'px' }">
    <svg :viewBox="`0 0 84 ${BOTTOM_Y + 30}`" :width="size" :height="Math.round(size * 1.33)" aria-hidden="true">
      <template v-if="chord">
        <!-- 顶部 x/o 标记 -->
        <text
          v-for="(m, i) in topMarks"
          :key="'t' + i"
          :x="m.x"
          y="16"
          text-anchor="middle"
          font-size="12"
          fill="#8b8881"
        >
          {{ m.kind === 'x' ? '✕' : m.kind === 'o' ? '○' : '' }}
        </text>
        <!-- 琴枕 / 起始品位线 -->
        <template v-if="(chord.baseFret || 1) > 1">
          <line :x1="XS[0] - 6" :y1="NUT_Y" :x2="XS[5] + 6" :y2="NUT_Y" stroke="#999" stroke-width="1.5" />
          <text :x="XS[0] - 8" :y="NUT_Y + 4" font-size="10" fill="#8b8881" text-anchor="end">{{ chord.baseFret }}</text>
        </template>
        <line v-else :x1="XS[0] - 6" :y1="NUT_Y" :x2="XS[5] + 6" :y2="NUT_Y" stroke="#333" stroke-width="3" />
        <line
          v-for="y in [NUT_Y + FRET_H, NUT_Y + FRET_H * 2, NUT_Y + FRET_H * 3, NUT_Y + FRET_H * 4, BOTTOM_Y]"
          :key="y"
          :x1="XS[0] - 6"
          :y1="y"
          :x2="XS[5] + 6"
          :y2="y"
          stroke="#999"
          stroke-width="1"
        />
        <!-- 弦 -->
        <line
          v-for="x in XS"
          :key="'s' + x"
          :x1="x"
          :y1="NUT_Y"
          :x2="x"
          :y2="BOTTOM_Y"
          stroke="#333"
          stroke-width="1.2"
        />
        <!-- 按弦点 -->
        <circle
          v-for="(d, i) in dots"
          :key="'d' + i"
          :cx="d.x"
          :cy="d.y"
          r="5"
          class="dot"
        />
      </template>
      <template v-else>
        <text x="42" y="60" text-anchor="middle" font-size="12" fill="#8b8881">暂无</text>
        <text x="42" y="74" text-anchor="middle" font-size="12" fill="#8b8881">指法图</text>
      </template>
    </svg>
    <div class="chord-name">{{ name }}</div>
    <div v-if="chord?.hint" class="chord-hint">{{ chord.hint }}</div>
  </div>
</template>

<style scoped>
.chord-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chord-name {
  font-weight: 700;
  font-size: 14px;
  margin-top: 2px;
}
.chord-hint {
  font-size: 11px;
  color: var(--text-dim);
  text-align: center;
}
/* 按弦点：跟随主题强调色 */
.dot { fill: var(--accent); }
</style>
