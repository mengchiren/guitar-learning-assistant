<script setup>
import seedSongs from '../data/seedSongs.json'
</script>

<template>
  <div>
    <h1 class="page-title">歌曲库</h1>
    <p class="muted small" style="margin-bottom: 12px">
      种子曲库（{{ seedSongs.length }} 首，数据经 M0 对拍校准）。歌曲上传与自动分析将在 M2 上线。
    </p>
    <div class="song-grid">
      <div v-for="s in seedSongs" :key="s.id" class="card song-card">
        <div class="song-head">
          <div>
            <div class="song-title">{{ s.title }}</div>
            <div class="dim small">{{ s.artist }} · {{ s.source }}</div>
          </div>
          <span class="tag">{{ s.template }}</span>
        </div>
        <div class="song-meta dim small">
          <span>BPM {{ s.bpm }}</span> · <span>{{ s.key }}</span> · <span>难度：{{ s.difficulty }}</span>
        </div>
        <div v-if="s.chords" class="muted small" style="margin-top: 6px">和弦：{{ s.chords }}</div>
        <div v-if="s.note" class="muted small" style="margin-top: 4px">{{ s.note }}</div>
        <div class="muted small" style="margin-top: 4px; opacity: 0.7">数据来源：{{ s.dataFrom }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.song-grid { display: grid; }
.song-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.song-title { font-size: 17px; font-weight: 700; }
.song-meta { margin-top: 8px; }

@media (min-width: 768px) {
  .song-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; align-items: start; }
  .song-grid .card { margin-bottom: 0; }
}
</style>
