<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRecordingsStore } from '../stores/recordings.js'
import RecordPanel from '../components/RecordPanel.vue'

const recordings = useRecordingsStore()

const playingId = ref(null)
const audioUrl = ref('')
const loadingId = ref('')
const pendingDelete = ref(null) // 待确认删除的录音
const deleteError = ref('')

// v-for 里的模板 ref 会被 Vue 收集成数组（不是元素），必须用函数式 ref 拿当前唯一的 audio 元素
let audioElement = null
function setAudioEl(el) {
  audioElement = el
}

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
    audioElement?.play().catch(() => {})
  } catch {
    // 音频数据损坏：提示后继续
  }
  loadingId.value = ''
}

function stopPlay() {
  audioElement?.pause()
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = ''
  playingId.value = null
}

function remove(r) {
  // 两段式按钮在播放状态下点击会失效（列表重渲染干扰），改为独立弹层确认
  deleteError.value = ''
  pendingDelete.value = r
}

async function doDelete() {
  const r = pendingDelete.value
  if (!r) return
  try {
    if (playingId.value === r.id) stopPlay()
    await recordings.remove(r.id)
    pendingDelete.value = null
  } catch (e) {
    deleteError.value = '删除失败：' + (e?.message || e?.name || '未知错误')
  }
}

function cancelDelete() {
  pendingDelete.value = null
  deleteError.value = ''
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
          <button class="btn small-btn" @click="remove(r)">删除</button>
        </div>
      </div>

      <audio
        v-if="playingId === r.id"
        :ref="setAudioEl"
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

    <!-- 删除确认弹层（独立固定层，播放中也能正常点击） -->
    <div v-if="pendingDelete" class="del-overlay" @click.self="cancelDelete">
      <div class="del-card">
        <p style="margin-bottom: 4px"><b>删除这条录音？</b></p>
        <p class="small dim" style="margin-bottom: 12px">
          {{ pendingDelete.date }} · {{ fmtSec(pendingDelete.seconds) }}，删除后不能恢复。
        </p>
        <p v-if="deleteError" class="small" style="color: var(--danger); margin-bottom: 8px">{{ deleteError }}</p>
        <div class="btn-row">
          <button class="btn btn-primary" @click="doDelete">确认删除</button>
          <button class="btn" @click="cancelDelete">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rec-item { padding: 12px 14px; }
.rec-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.rec-actions { display: flex; gap: 6px; }
.small-btn { padding: 4px 10px; font-size: 13px; }
.rec-audio { width: 100%; margin-top: 10px; }

.del-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 24px;
}
.del-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 340px;
}
</style>
