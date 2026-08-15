<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSongsStore, effectiveSong } from '../stores/songs'
import { findToneTemplate, TONE_TEMPLATES } from '../data/templates'
import { useMetronomeStore } from '../stores/metronome'

const route = useRoute()
const router = useRouter()
const songs = useSongsStore()
const metro = useMetronomeStore()

const PITCH = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const KEYS = PITCH.flatMap((p) => [`${p} 大调`, `${p} 小调`])

const song = computed(() => songs.byId(route.params.id))
const eff = computed(() => (song.value ? effectiveSong(song.value) : null))
const tpl = computed(() => (eff.value?.template ? findToneTemplate(eff.value.template) : null))

// 纠错表单（仅用户歌曲）
const cBpm = ref(null)
const cKey = ref('')
const cTemplate = ref('')
const savedFlash = ref(false)

watch(song, (s) => {
  if (!s) return
  const e = effectiveSong(s)
  cBpm.value = e.bpm ?? null
  cKey.value = e.key ?? ''
  cTemplate.value = e.template ?? ''
  savedFlash.value = false
}, { immediate: true })

function saveCorrections() {
  if (!song.value || song.value.isSeed) return
  songs.updateUserSong(song.value.id, {
    corrections: {
      bpm: cBpm.value ? Math.round(Number(cBpm.value)) : null,
      key: cKey.value || null,
      template: cTemplate.value || null,
    },
  })
  savedFlash.value = true
  setTimeout(() => (savedFlash.value = false), 2500)
}

function openMetronome() {
  const bpm = Math.min(220, Math.max(40, Math.round(eff.value?.bpm || 100)))
  metro.bpm = bpm
  router.push('/metronome')
}

function removeSong() {
  if (!song.value || song.value.isSeed) return
  songs.removeUserSong(song.value.id)
  router.replace('/songs')
}

const confLabel = { 高: 'b-high', 中: 'b-mid', 低: 'b-low' }
</script>

<template>
  <div v-if="song && eff" class="narrow">
    <h1 class="page-title">{{ song.title }}</h1>

    <div class="card">
      <div class="detail-head">
        <div>
          <div class="dim small">{{ song.artist || '未知歌手' }}<span v-if="song.source"> · {{ song.source }}</span></div>
          <div class="detail-tags" style="margin-top: 6px">
            <span class="tag tag-fixed">{{ eff.template || '未归类' }}</span>
            <span v-if="song.isSeed" class="tag tag-fixed">种子库 · M0 校准</span>
            <span v-else class="tag tag-fixed">{{ song.source === 'manual' ? '手动录入' : '自动分析' }}</span>
            <span v-if="song.corrections && Object.values(song.corrections).some(Boolean)" class="tag on tag-fixed">已人工纠错</span>
          </div>
        </div>
        <button v-if="!song.isSeed" class="btn btn-danger-sm" @click="removeSong">删除</button>
      </div>
    </div>

    <div class="card">
      <h2>歌曲信息</h2>
      <div class="info-row">
        <span class="dim small">BPM</span>
        <span class="info-val">{{ eff.bpm ?? '—' }}</span>
        <span v-if="song.analysis" class="badge" :class="confLabel[song.analysis.confidence.bpm]">{{ song.analysis.confidence.bpm }}</span>
      </div>
      <div class="info-row">
        <span class="dim small">调性</span>
        <span class="info-val">{{ eff.key ?? '—' }}</span>
        <span v-if="song.analysis" class="badge" :class="confLabel[song.analysis.confidence.key]">{{ song.analysis.confidence.key }}</span>
      </div>
      <div v-if="song.analysis && song.analysis.keyTop3.length > 1" class="muted small" style="margin-top: 2px">
        其他候选：{{ song.analysis.keyTop3.slice(1).map((k) => `${k.key}（${k.corr}）`).join('、') }}
      </div>
      <div class="info-row">
        <span class="dim small">套路</span>
        <span class="info-val">{{ eff.template ?? '—' }}</span>
        <span v-if="song.analysis" class="badge" :class="confLabel[song.analysis.confidence.template]">{{ song.analysis.confidence.template }}</span>
      </div>
      <div v-if="song.difficulty" class="info-row">
        <span class="dim small">难度</span>
        <span class="info-val">{{ song.difficulty }}</span>
      </div>
      <div class="info-row">
        <span class="dim small">和弦</span>
        <span v-if="song.chords" class="info-val">{{ song.chords }}</span>
        <span v-else-if="song.analysis && song.analysis.chordsRough.length" class="info-val">
          {{ song.analysis.chordsRough.join(' ') }}
          <span class="badge b-low">低</span>
          <span class="dim small">（粗略估计，仅供参考）</span>
        </span>
        <span v-else class="info-val muted small">暂无</span>
      </div>
      <div v-if="song.analysis && song.analysis.notes.length" style="margin-top: 10px">
        <p v-for="n in song.analysis.notes" :key="n" class="muted small" style="margin-bottom: 4px">· {{ n }}</p>
      </div>
    </div>

    <div v-if="tpl" class="card">
      <h2>设备设置建议（按当前设备标注）</h2>
      <div class="tpl-head">
        <div class="tpl-name">{{ tpl.name }}</div>
        <span class="tag">{{ tpl.适用 }}</span>
      </div>
      <div class="small dim" style="margin-top: 6px">示例：{{ tpl.示例 }}</div>
      <div class="tpl-grid">
        <div class="tpl-item"><b>吉他档位</b>{{ tpl.guitar.pickup }}</div>
        <div class="tpl-item"><b>音色旋钮</b>{{ tpl.guitar.tone }}</div>
        <div class="tpl-item"><b>通道</b>{{ tpl.amp.channel }}</div>
        <div class="tpl-item"><b>箱模</b>{{ tpl.amp.model }}</div>
        <div class="tpl-item"><b>Gain</b>{{ tpl.amp.gain }} / 10</div>
        <div class="tpl-item"><b>EQ</b>B{{ tpl.amp.eq.b }} · M{{ tpl.amp.eq.m }} · T{{ tpl.amp.eq.t }}</div>
        <div class="tpl-item"><b>MOD</b>{{ tpl.amp.mod }}</div>
        <div class="tpl-item"><b>Delay</b>{{ tpl.amp.delay }}</div>
        <div class="tpl-item"><b>Reverb</b>{{ tpl.amp.reverb }}</div>
      </div>
      <p class="muted small" style="margin-top: 8px">{{ tpl.说明 }}</p>
      <button v-if="eff.bpm" class="btn btn-block" style="margin-top: 12px" @click="openMetronome">
        用此 BPM 开节拍器（{{ Math.round(eff.bpm) }} BPM）
      </button>
    </div>

    <div v-if="!song.isSeed" class="card">
      <h2>人工纠错</h2>
      <p class="muted small">分析结果不准？改完保存，列表和这里都会用你改后的值。</p>
      <label>BPM</label>
      <input type="number" v-model="cBpm" min="40" max="300" placeholder="例如 148" />
      <label>调性</label>
      <select v-model="cKey">
        <option value="">（未知）</option>
        <option v-for="k in KEYS" :key="k" :value="k">{{ k }}</option>
      </select>
      <label>套路</label>
      <select v-model="cTemplate">
        <option value="">（未知）</option>
        <option v-for="t in TONE_TEMPLATES" :key="t.id" :value="t.name">{{ t.name }}（{{ t.适用 }}）</option>
      </select>
      <button class="btn btn-primary btn-block" style="margin-top: 12px" @click="saveCorrections">保存纠错</button>
      <p v-if="savedFlash" class="small" style="color: var(--ok); margin-top: 8px">已保存，展示值已更新</p>
    </div>

    <div v-else class="card">
      <p class="muted small">
        种子库数据经过 M0 对拍校准，这里保持只读。同一首歌想记自己的版本，可以在「歌曲库」用「添加歌曲」手动录入。
      </p>
    </div>
  </div>

  <div v-else class="narrow">
    <h1 class="page-title">歌曲不存在</h1>
    <router-link to="/songs" class="btn btn-block">回歌曲库</router-link>
  </div>
</template>

<style scoped>
.detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.detail-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-fixed { cursor: default; }
.btn-danger-sm {
  flex: none;
  padding: 7px 12px;
  font-size: 14px;
  color: var(--danger);
}
.info-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
.info-row .dim { width: 44px; flex: none; }
.info-val { font-weight: 600; }
.badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-weight: 700;
  flex: none;
}
.b-high { background: #e8f3ec; border-color: var(--ok); color: var(--ok); }
.b-mid { background: #fdf3e0; border-color: #d9a441; color: #a97412; }
.b-low { background: #fdeaea; border-color: var(--accent); color: var(--accent-dark); }

.tpl-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.tpl-name { font-size: 18px; font-weight: 700; }
.tpl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.tpl-item { background: var(--bg-input); border-radius: 10px; padding: 8px 10px; font-size: 14px; }
.tpl-item b { display: block; color: var(--text-dim); font-size: 12px; margin-bottom: 2px; font-weight: 600; }
</style>
