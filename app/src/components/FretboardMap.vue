<script setup>
// 指板图（爬格子用）：横向 6 弦 × 4 品，每品标注指法数字 1-2-3-4
defineProps({
  position: { type: Number, default: 1 },
})

const YS = [14, 25, 36, 47, 58, 69] // 6 弦 → 1 弦
const FRET_X = [22, 46, 70, 94]
const W = 118
</script>

<template>
  <div class="fretboard">
    <svg :viewBox="`0 0 ${W} 86`" width="200" height="120" aria-hidden="true">
      <!-- 弦 -->
      <line
        v-for="(y, i) in YS"
        :key="'s' + i"
        :x1="10"
        :y1="y"
        :x2="W - 4"
        :y2="y"
        stroke="#333"
        :stroke-width="i === 0 ? 2.4 : i === 5 ? 1.4 : 1.8"
      />
      <!-- 品丝 -->
      <line v-for="(x, i) in [10, ...FRET_X, W - 4]" :key="'f' + i" :x1="x" :y1="YS[0] - 8" :x2="x" :y2="YS[5] + 8" stroke="#999" stroke-width="1" />
      <!-- 指法数字 -->
      <template v-for="(x, fi) in FRET_X" :key="'p' + fi">
        <text
          v-for="(y, si) in YS"
          :key="si"
          :x="x + 12"
          :y="y + 4"
          text-anchor="middle"
          font-size="13"
          font-weight="700"
          fill="#e30613"
        >
          {{ fi + 1 }}
        </text>
      </template>
      <!-- 弦名 -->
      <text v-for="(label, i) in ['6', '5', '4', '3', '2', '1']" :key="'n' + i" :x="6" :y="YS[i] + 4" font-size="10" fill="#8b8881" text-anchor="end">
        {{ label }}
      </text>
    </svg>
    <div class="dim small" style="text-align: center">
      从 {{ position }} 品开始：食指按 1、中指按 2、无名指按 3、小指按 4
    </div>
  </div>
</template>

<style scoped>
.fretboard {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
