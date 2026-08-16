<script setup>
import { ref, computed } from 'vue'
import { CHORD_CHARTS, CHORD_GROUPS, findChord } from '../data/chords.js'
import ChordChart from '../components/ChordChart.vue'

const zoomed = ref(null) // 放大查看的和弦名

const groups = computed(() =>
  CHORD_GROUPS.map((g) => ({
    ...g,
    chords: CHORD_CHARTS.filter((c) => c.category === g.key),
  })).filter((g) => g.chords.length),
)
</script>

<template>
  <div>
    <h1 class="page-title">和弦图库</h1>
    <p class="muted small" style="margin-bottom: 12px">
      {{ CHORD_CHARTS.length }} 个常用和弦指法图（标准按法）。点任意和弦可放大查看；✕ = 不弹这根弦，○ = 空弦。
    </p>

    <div v-for="g in groups" :key="g.key" class="card">
      <h2>{{ g.label }}</h2>
      <div class="chord-grid">
        <button
          v-for="c in g.chords"
          :key="c.name"
          class="chord-btn"
          :aria-label="`放大查看${c.name}和弦`"
          @click="zoomed = c.name"
        >
          <ChordChart :name="c.name" :size="64" />
        </button>
      </div>
    </div>

    <!-- 放大查看 -->
    <div v-if="zoomed" class="zoom-overlay" @click.self="zoomed = null">
      <div class="zoom-card">
        <ChordChart :name="zoomed" :size="150" />
        <p v-if="findChord(zoomed)?.hint" class="small" style="margin-top: 10px">
          提示：{{ findChord(zoomed).hint }}
        </p>
        <button class="btn btn-block" style="margin-top: 12px" @click="zoomed = null">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chord-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.chord-btn {
  background: var(--bg-input);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 0 2px;
  cursor: pointer;
  display: flex;
  justify-content: center;
}
.chord-btn:active { border-color: var(--accent); }

.zoom-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 24px;
}
.zoom-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90vw;
}

@media (min-width: 768px) {
  .chord-grid { grid-template-columns: repeat(6, 1fr); }
}
</style>
