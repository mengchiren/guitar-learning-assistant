<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRecordingsStore } from '../stores/recordings'
import RecordPanel from '../components/RecordPanel.vue'

const recordings = useRecordingsStore()

const playingId = ref(null)
const audioUrl = ref('')
const loadingId = ref('')
const confirmId = ref('')
const audioEl = ref(null)

onMounted(() => {
  recordings.load()
})

function fmtSec(total) {
  const m = Math.floor(total / 60)
  const s = Math.round(total % 60)
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`
}

async function togglePlay(r) {
  if (playingId.value === r.id) {
    stopPlay()
    return
  }
  loadingId.value = r.id
  try {
    const blob = await recordings.blobOf(r.id)
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = URL.createObjectURL(blob)
    playingId.value = r.id
    await nextTick()
    audioEl.value?.play().catch(() => {})
  } catch {
    // 音频数据损坏：提示后继续
  }
  loadingId.value = ''
}

function stopPlay() {
  audioEl.value?.pause()
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = ''
  playingId.value = null
}

function remove(r) {
  if (confirmId.value === r.id) {
    if (playingId.value === r.id) stopPlay()
    recordings.remove(r.id)
    confirmId.value = ''
  } else {
    confirmId.value = r.id
  }
}

onUnmounted(stopPlay)
</script>

<template>
  <div class="narrow">
    <h1 class="page-title">录音回听</h1>

    <div class="card">
      <h2>录一段</h2>
      <RecordPanel />
    </div>

    <h2 style="margin: 18px 0 8px">历史录音（{{ recordings.list.length }}）</h2>
    <div v-if="!recordings.loaded" class="card muted small">加载中…</div>
    <div v-else-if="!recordings.list.length" class="card muted small">
      还没有录音。练琴时点「开始录音」，录完自动测 BPM，在这里回听对比。
    </div>

    <div v-for="r in recordings.list" :key="r.id" class="card rec-item">
      <div class="rec-head">
        <div>
          <strong>{{ r.date }}</strong>
          <span class="dim small" style="margin-left: 8px">{{ fmtSec(r.seconds) }}</span>
          <span class="tag" style="margin-left: 8px">{{ r.category }}</span>
          <span v-if="r.songName" class="dim small" style="margin-left: 8px">{{ r.songName }}</span>
        </div>
        <div class="rec-actions">
          <button class="btn small-btn" @click="togglePlay(r)" :disabled="loadingId === r.id">
            {{ loadingId === r.id ? '…' : playingId === r.id ? '停止' : '播放' }}
          </button>
          <button class="btn small-btn" @click="remove(r)">
            {{ confirmId === r.id ? '确认删除？' : '删除' }}
          </button>
        </div>
      </div>

      <audio
        v-if="playingId === r.id"
        ref="audioEl"
        :src="audioUrl"
        controls
        class="rec-audio"
        @ended="stopPlay"
      ></audio>

      <p v-if="r.bpm" class="small" style="margin-top: 6px">
        {{ r.bpm }} BPM
        <span v-if="r.bpmManual" class="dim">（手动）</span>
        <span v-else-if="r.bpmConf" class="dim">（置信度 {{ r.bpmConf }}）</span>
        <span v-else class="dim">（自动对拍）</span>
      </p>
      <p v-if="r.note" class="small dim" style="margin-top: 4px">{{ r.note }}</p>
    </div>
  </div>
</template>

<style scoped>
.rec-item { padding: 12px 14px; }
.rec-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.rec-actions { display: flex; gap: 6px; }
.small-btn { padding: 4px 10px; font-size: 13px; }
.rec-audio { width: 100%; margin-top: 10px; }
</style>
