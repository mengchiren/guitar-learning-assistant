<script setup>
// 课件式曲谱渲染（v0.12.0）：谱头卡 + 分段（小节网格/技巧徽章/段落音色）+ 和弦图行。
// 兼容两种数据：新格式（meta + bars[]）与旧格式（sections[{name, chords, pattern, note}]）。
// 纯展示组件：无 store / 无定时器依赖，可 SSR 渲染（spike/test_sheet_view.mjs）。
import { computed } from 'vue'
import ChordChart from './ChordChart.vue'

const props = defineProps({
  // { source, meta?: { bpm, timeSig, tuning, key }, sections: [...] }
  sheet: { type: Object, required: true },
})

// 汇总全谱用到的和弦（去重，按首次出现顺序）→ 谱头指法图一排
const usedChords = computed(() => {
  const seen = []
  for (const sec of props.sheet.sections || []) {
    const tokens = []
    for (const bar of sec.bars || []) tokens.push(...(bar.chords || '').split(/\s+/))
    if (!sec.bars) tokens.push(...(sec.chords || '').split(/\s+/))
    for (const t of tokens) if (t && !seen.includes(t)) seen.push(t)
  }
  return seen
})

const hasBars = computed(() => (props.sheet.sections || []).some((s) => Array.isArray(s.bars) && s.bars.length))

const patternTooltip = '节奏符号：↓ 下拨 ｜ ↑ 上拨 ｜ × 闷音 ｜ 〜 分解/琶音'
</script>

<template>
  <div class="sheet-score">
    <!-- 谱头卡（新格式 meta） -->
    <div v-if="sheet.meta" class="sheet-meta">
      <span v-if="sheet.meta.bpm" class="tag">♩ = {{ sheet.meta.bpm }}</span>
      <span v-if="sheet.meta.timeSig" class="tag">{{ sheet.meta.timeSig }}</span>
      <span v-if="sheet.meta.tuning" class="tag">{{ sheet.meta.tuning }}</span>
      <span v-if="sheet.meta.key" class="tag">{{ sheet.meta.key }}</span>
      <div v-if="usedChords.length" class="sheet-diagrams">
        <ChordChart v-for="c in usedChords" :key="c" :name="c" :size="52" />
      </div>
    </div>

    <!-- 分段 -->
    <div v-for="(s, i) in sheet.sections" :key="i" class="sheet-section">
      <div class="sheet-head">
        <span class="tag">{{ s.name }}</span>
        <span v-if="s.fx" class="tag sheet-fx" :class="{ warm: s.fx === '失真' }">{{ s.fx }}</span>
        <span v-if="!s.bars && s.pattern" class="dim small">{{ s.pattern }}</span>
      </div>

      <!-- 新格式：小节网格 -->
      <div v-if="s.bars && s.bars.length" class="sheet-bars">
        <div v-for="(b, j) in s.bars" :key="j" class="sheet-bar" :class="{ riff: !b.chords }">
          <div v-if="b.techniques && b.techniques.length" class="sheet-tech">
            <span v-for="t in b.techniques" :key="t" class="tech-tag">{{ t }}</span>
          </div>
          <div class="sheet-bar-chords">
            <template v-if="b.chords">
              <span v-for="c in b.chords.split(/\s+/)" :key="c" class="bar-chord">{{ c }}</span>
            </template>
            <span v-else class="bar-label">{{ b.label || '—' }}</span>
          </div>
          <div v-if="b.pattern" class="sheet-bar-pattern" :title="patternTooltip">{{ b.pattern }}</div>
          <div v-if="b.note" class="sheet-bar-note">{{ b.note }}</div>
        </div>
      </div>

      <!-- 旧格式：和弦字符串 -->
      <div v-else class="sheet-chords">{{ s.chords }}</div>

      <p v-if="s.note" class="muted small">{{ s.note }}</p>
    </div>

    <!-- 节奏符号图例 -->
    <p v-if="hasBars" class="dim small sheet-legend">节奏符号：↓ 下拨 ↑ 上拨 × 闷音 〜 分解/琶音</p>

    <!-- 和弦指法图行（谱头已展示时不再重复） -->
    <div v-if="!sheet.meta && usedChords.length" class="chord-row">
      <ChordChart v-for="c in usedChords" :key="c" :name="c" />
    </div>
  </div>
</template>

<style scoped>
/* 谱头卡：标签行 flex 换行 + 每个标签不折行（避免「G 大调」断成两行） */
.sheet-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.sheet-meta .tag {
  white-space: nowrap;
}
.sheet-diagrams {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
}
.sheet-fx {
  background: var(--ok-soft);
  color: var(--ok-text, var(--text-1));
}
.sheet-fx.warm {
  background: var(--warn-soft);
  color: var(--warn-text);
}
/* 分段：段与段之间留呼吸，标题行与网格对齐 */
.sheet-section {
  margin-bottom: 18px;
}
.sheet-section:last-of-type {
  margin-bottom: 8px;
}
.sheet-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.sheet-head .tag {
  white-space: nowrap;
}
.sheet-bars {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 10px;
  margin: 4px 0 10px;
}
.sheet-bar {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 9px 11px;
  min-height: 64px;
  background: var(--bg-card);
}
.sheet-bar.riff {
  background: var(--bg-input);
}
.sheet-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 6px;
}
.tech-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
  white-space: nowrap;
}
.sheet-bar-chords {
  font-weight: 600;
  font-size: 15px;
  line-height: 1.25;
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
}
.bar-label {
  color: var(--accent-dark);
  font-weight: 600;
  font-size: 14px;
}
.sheet-bar-pattern {
  margin-top: 7px;
  font-size: 14px;
  letter-spacing: 3px;
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sheet-bar-note {
  margin-top: 3px;
  font-size: 11px;
  color: var(--text-2);
}
.sheet-legend {
  margin: 10px 0 0;
}
/* 旧格式（chords 字符串）：大字排开的和弦进行 + 指法图行 */
.sheet-chords {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--accent-dark);
  font-variant-numeric: tabular-nums;
  margin: 2px 0 4px;
}
.chord-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
  justify-content: center;
}
</style>
