<script setup>
import { ref, computed } from 'vue'
import { useSongsStore, effectiveSong } from '../stores/songs.js'

const songs = useSongsStore()
const q = ref('')

const list = computed(() => {
  const kw = q.value.trim().toLowerCase()
  const all = songs.allSongs.map((s) => ({ raw: s, eff: effectiveSong(s) }))
  if (!kw) return all
  return all.filter(({ raw }) => {
    const hay = `${raw.title} ${raw.artist} ${raw.source}`.toLowerCase()
    return hay.includes(kw)
  })
})
</script>

<template>
  <div>
    <h1 class="page-title">歌曲库</h1>

    <div class="song-tools">
      <input v-model="q" type="search" placeholder="搜索歌名或歌手…" aria-label="搜索歌曲" />
      <router-link to="/songs/new" class="btn btn-primary">添加歌曲</router-link>
    </div>

    <p v-if="list.length" class="muted small" style="margin-bottom: 12px">
      共 {{ list.length }} 首（含种子曲库与你自己添加的）。点歌曲查看分析与设备设置建议。
    </p>
    <p v-else class="muted small" style="margin-bottom: 12px">
      没有找到「{{ q }}」。可以点右上角「添加歌曲」，上传音频自动分析或手动录入。
    </p>

    <div class="song-grid">
      <router-link
        v-for="({ raw, eff }) in list"
        :key="raw.id"
        :to="`/songs/${raw.id}`"
        class="card song-card"
      >
        <div class="song-head">
          <div>
            <div class="song-title">{{ raw.title }}</div>
            <div class="dim small">{{ raw.artist }} · {{ raw.source }}</div>
          </div>
          <div class="song-tags">
            <span class="tag tag-fixed">{{ raw.isSeed ? '种子' : '我的' }}</span>
            <span class="tag tag-fixed">{{ eff.template || '未归类' }}</span>
          </div>
        </div>
        <div class="song-meta dim small">
          <span v-if="eff.bpm">BPM {{ eff.bpm }}</span>
          <span v-if="eff.key"> · {{ eff.key }}</span>
          <span v-if="raw.difficulty"> · 难度：{{ raw.difficulty }}</span>
        </div>
        <div v-if="eff.bpm || eff.key" class="muted small" style="margin-top: 4px; opacity: 0.7">
          {{ raw.isSeed ? '种子库数据（M0 校准）' : '来源：' + (raw.source === 'manual' ? '手动录入' : '自动分析') }}
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.song-tools { display: flex; gap: 10px; margin-bottom: 12px; }
.song-tools input { flex: 1; }
.song-tools .btn { flex: none; }
.song-grid { display: grid; }
.song-card { display: block; text-decoration: none; color: var(--text); }
.song-card:hover { border-color: var(--accent); }
.song-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.song-tags { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex: none; }
.tag-fixed { cursor: default; }
.song-title { font-size: 17px; font-weight: 700; }
.song-meta { margin-top: 8px; }

@media (min-width: 768px) {
  .song-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; align-items: start; }
  .song-grid .card { margin-bottom: 0; }
}
</style>
