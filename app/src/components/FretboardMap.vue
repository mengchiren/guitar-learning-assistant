<script setup>
// 指板图（爬格子用）：竖版——琴头朝上，1 品在最上面，往下递推 2/3/4 品。
// 6 条竖弦线 + 品丝横线，每格标指法数字（1=食指 2=中指 3=无名指 4=小指）。
defineProps({
  position: { type: Number, default: 1 },
})

const XS = [12, 24, 36, 48, 60, 72] // 6 弦（低音 E）→ 1 弦（高音 e）
const NUT_Y = 30 // 顶部琴枕线
const FRET_H = 20 // 每品高度
const BOTTOM_Y = NUT_Y + FRET_H * 4
</script>

<template>
  <div class="fretboard">
    <svg :viewBox="`0 0 84 ${BOTTOM_Y + 26}`" width="150" height="190" aria-hidden="true">
      <!-- 琴枕（顶部粗线） -->
      <line :x1="XS[0] - 6" :y1="NUT_Y" :x2="XS[5] + 6" :y2="NUT_Y" stroke="#333" stroke-width="3" />
      <!-- 品丝（1 品往下：2、3、4 品丝 + 底边） -->
      <line
        v-for="y in [NUT_Y + FRET_H, NUT_Y + FRET_H * 2, NUT_Y + FRET_H * 3, BOTTOM_Y]"
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
      <!-- 每格指法数字：1 品全 1、2 品全 2 … -->
      <template v-for="f in [1, 2, 3, 4]" :key="'f' + f">
        <text
          v-for="x in XS"
          :key="'n' + x"
          :x="x"
          :y="NUT_Y + FRET_H * (f - 0.5) + 4"
          text-anchor="middle"
          font-size="12"
          font-weight="700"
          class="fret-num"
        >
          {{ f }}
        </text>
        <!-- 品数标在左侧 -->
        <text :x="XS[0] - 9" :y="NUT_Y + FRET_H * (f - 0.5) + 4" font-size="9" fill="#8b8881" text-anchor="end">
          {{ position + f - 1 }} 品
        </text>
      </template>
      <!-- 弦号标在顶部 -->
      <text v-for="(label, i) in ['6', '5', '4', '3', '2', '1']" :key="'c' + i" :x="XS[i]" :y="NUT_Y - 10" font-size="10" fill="#8b8881" text-anchor="middle">
        {{ label }}
      </text>
    </svg>
    <div class="dim small" style="text-align: center">
      上面 1 品往下递推：食指按 1 品、中指按 2 品、无名指按 3 品、小指按 4 品
    </div>
  </div>
</template>

<style scoped>
.fretboard {
  display: flex;
  flex-direction: column;
  align-items: center;
}
/* 指法数字：跟随主题强调色 */
.fret-num { fill: var(--accent); }
</style>
