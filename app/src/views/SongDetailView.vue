<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSongsStore } from '../stores/songs.js'
import { findToneTemplate, TONE_TEMPLATES } from '../data/templates.js'
import { useMetronomeStore } from '../stores/metronome.js'
import { usePlanStore } from '../stores/plan.js'
import { useSheetsStore } from '../stores/sheets.js'
import { stashAskContext } from '../stores/chat.js'
import { KEYS, CONF_LABELS } from '../utils/music.js'
import { getSheetPdfMeta, putSheetPdf, deleteSheetPdf } from '../utils/sheetPdfDb.js'
import ToneAdvice from '../components/ToneAdvice.vue'
import SheetScore from '../components/SheetScore.vue'
import SheetPdfViewer from '../components/SheetPdfViewer.vue'

const route = useRoute()
const router = useRouter()
const songs = useSongsStore()
const metro = useMetronomeStore()
const planStore = usePlanStore()
const sheetsStore = useSheetsStore()

// allSongs 已归一化：song.bpm/key/template 直接是有效值（纠错 > 手动 > 分析 > 种子值）
const song = computed(() => songs.byId(route.params.id))
const tpl = computed(() => (song.value?.template ? findToneTemplate(song.value.template) : null))

// 纠错表单（仅用户歌曲）
const cBpm = ref(null)
const cKey = ref('')
const cTemplate = ref('')
const savedFlash = ref(false)

// 只监听歌曲 id 变化（切歌时重填表单）；监听整个 song 会因读取深层字段连带触发，
// 保存纠错后立刻清掉「已保存」提示
watch(
  () => (song.value ? song.value.id : null),
  (id) => {
    if (!id || !song.value) return
    cBpm.value = song.value.bpm ?? null
    cKey.value = song.value.key ?? ''
    cTemplate.value = song.value.template ?? ''
    savedFlash.value = false
  },
  { immediate: true },
)

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
  const bpm = Math.min(220, Math.max(40, Math.round(song.value?.bpm || 100)))
  metro.bpm = bpm
  router.push('/metronome')
}

function askAi() {
  if (!song.value) return
  const st = planStore.songStatus[song.value.id]?.state || '未标记'
  const statusText = st === 'practicing' ? '练习中' : st === 'mastered' ? '已掌握' : '还没开始练'
  const chordsText = song.value.chords || song.value.analysis?.chordsRough?.join(' ') || '未知'
  stashAskContext(
    `用户正在看歌曲《${song.value.title}》：
- BPM：${song.value.bpm ?? '未知'}，调性：${song.value.key ?? '未知'}，套路：${song.value.template ?? '未知'}
- 难度：${song.value.difficulty ?? '未知'}；和弦：${chordsText}
- 这首歌的练习状态：${statusText}
- 用户设备：依班娜 GRX40 电吉他 + JOYO Jam Buddy 2 音箱`,
  )
  router.push('/ask')
}

function removeSong() {
  if (!song.value || song.value.isSeed) return
  songs.removeUserSong(song.value.id)
  router.replace('/songs')
}

// 曲谱：种子谱只读展示；用户自录谱优先显示、可编辑删除
const sheetInfo = computed(() => (song.value ? sheetsStore.sheetOf(song.value.id) : null))
const editingSheet = ref(false)
const sheetForm = ref([])

function startSheetEdit() {
  sheetForm.value = (sheetInfo.value?.sheet.sections || []).map((s) => ({ ...s }))
  if (!sheetForm.value.length) sheetForm.value.push({ name: '主歌', chords: '', pattern: '', note: '' })
  editingSheet.value = true
}
function addSection() {
  sheetForm.value.push({ name: '', chords: '', pattern: '', note: '' })
}
function removeSection(i) {
  sheetForm.value.splice(i, 1)
}
function saveSheet() {
  if (!song.value) return
  const sections = sheetForm.value
    .map((s) => ({ name: s.name.trim(), chords: s.chords.trim(), pattern: s.pattern.trim(), note: (s.note || '').trim() }))
    .filter((s) => s.name && s.chords)
  if (!sections.length) return
  sheetsStore.saveSheet(song.value.id, sections)
  editingSheet.value = false
}
function removeSheet() {
  if (!song.value) return
  sheetsStore.removeSheet(song.value.id)
  editingSheet.value = false
}

// —— 原谱 PDF（v0.12.0）：只存本机 IndexedDB，不进 git/部署包 ——
const pdfMeta = ref(null) // { fileName, size, addedAt }
const pdfInput = ref(null)
const viewingPdf = ref(false)
onMounted(async () => {
  const id = song.value?.id
  if (!id) return
  try {
    pdfMeta.value = await getSheetPdfMeta(id)
  } catch { /* IndexedDB 不可用时静默，PDF 区显示上传失败 */ }
})
function pickPdf() {
  pdfInput.value?.click()
}
async function onPdfPick(e) {
  const f = e.target.files?.[0]
  e.target.value = '' // 允许再次选同一个文件
  if (!f || !song.value) return
  if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
    window.alert('请选择 PDF 文件')
    return
  }
  if (f.size > 20 * 1024 * 1024) {
    window.alert('PDF 超过 20MB 上限（课件原谱一般 < 5MB）')
    return
  }
  try {
    await putSheetPdf(song.value.id, { fileName: f.name, size: f.size, addedAt: Date.now() }, f)
    pdfMeta.value = await getSheetPdfMeta(song.value.id)
  } catch (err) {
    window.alert('PDF 保存失败：' + (err?.message || err))
    console.error('sheet pdf save:', err)
  }
}
async function removePdf() {
  if (!song.value || !pdfMeta.value) return
  if (!window.confirm('移除关联的 PDF 文件？（只删本机存储，原文件不受影响）')) return
  try {
    await deleteSheetPdf(song.value.id)
    pdfMeta.value = null
  } catch (err) {
    window.alert('移除失败：' + (err?.message || err))
  }
}
const pdfSizeLabel = computed(() => {
  if (!pdfMeta.value?.size) return ''
  const mb = pdfMeta.value.size / 1024 / 1024
  return mb >= 1 ? mb.toFixed(1) + ' MB' : Math.max(1, Math.round(pdfMeta.value.size / 1024)) + ' KB'
})
</script>

<template>
  <div v-if="song" class="narrow">
    <h1 class="page-title">{{ song.title }}</h1>

    <div class="card">
      <div class="detail-head">
        <div>
          <div class="dim small">{{ song.artist || '未知歌手' }}<span v-if="song.source"> · {{ song.source }}</span></div>
          <div class="detail-tags" style="margin-top: 6px">
            <span class="tag tag-fixed">{{ song.template || '未归类' }}</span>
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
        <span class="info-val">{{ song.bpm ?? '—' }}</span>
        <span v-if="song.analysis" class="badge" :class="CONF_LABELS[song.analysis.confidence.bpm]">{{ song.analysis.confidence.bpm }}</span>
      </div>
      <div class="info-row">
        <span class="dim small">调性</span>
        <span class="info-val">{{ song.key ?? '—' }}</span>
        <span v-if="song.analysis" class="badge" :class="CONF_LABELS[song.analysis.confidence.key]">{{ song.analysis.confidence.key }}</span>
      </div>
      <div v-if="song.analysis && song.analysis.keyTop3.length > 1" class="muted small" style="margin-top: 2px">
        其他候选：{{ song.analysis.keyTop3.slice(1).map((k) => `${k.key}（${k.corr}）`).join('、') }}
      </div>
      <div class="info-row">
        <span class="dim small">套路</span>
        <span class="info-val">{{ song.template ?? '—' }}</span>
        <span v-if="song.analysis" class="badge" :class="CONF_LABELS[song.analysis.confidence.template]">{{ song.analysis.confidence.template }}</span>
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
      <button class="btn btn-block" style="margin-top: 12px" @click="askAi">问 AI 这首歌怎么练</button>
    </div>

    <div class="card">
      <h2>练习状态</h2>
      <p class="muted small">标记后「计划」页会据此推荐下一首；全部掌握可随时改回练习中。</p>
      <div class="tag-row" style="margin-top: 10px">
        <span
          class="tag"
          :class="{ on: planStore.songStatus[song.id]?.state === 'practicing' }"
          @click="planStore.setSongStatus(song.id, 'practicing')"
        >练习中</span>
        <span
          class="tag"
          :class="{ on: planStore.songStatus[song.id]?.state === 'mastered' }"
          @click="planStore.setSongStatus(song.id, 'mastered')"
        >已掌握</span>
        <span
          v-if="planStore.songStatus[song.id]"
          class="tag"
          @click="planStore.setSongStatus(song.id, null)"
        >清除状态</span>
      </div>
    </div>

    <div class="card">
      <h2>曲谱（和弦谱）</h2>

      <template v-if="sheetInfo && !editingSheet">
        <p class="dim small">
          {{ sheetInfo.isUser ? '我的曲谱（本机保存）' : `种子曲谱 · ${sheetInfo.sheet.source}` }}
        </p>
        <SheetScore :sheet="sheetInfo.sheet" />
        <div class="sheet-pdf">
          <template v-if="pdfMeta">
            <div class="sheet-pdf-head">
              <span class="dim small">原谱 PDF：{{ pdfMeta.fileName }}（{{ pdfSizeLabel }}）· 仅存本机</span>
              <div class="btn-row sheet-pdf-btns">
                <button class="btn" @click="viewingPdf = true">查看原谱</button>
                <button class="btn" @click="pickPdf">更换</button>
                <button class="btn btn-danger-sm" @click="removePdf">移除</button>
              </div>
            </div>
          </template>
          <template v-else-if="!editingSheet">
            <p class="muted small">有课件原谱 PDF（六线谱）？点下面关联，页面内直接查看——文件只存本机浏览器，不会上传。</p>
            <button class="btn" @click="pickPdf">关联原谱 PDF</button>
          </template>
          <input ref="pdfInput" type="file" accept="application/pdf,.pdf" hidden @change="onPdfPick" />
        </div>
        <div class="btn-row" style="margin-top: 12px">
          <button v-if="sheetInfo.isUser" class="btn" @click="startSheetEdit">编辑曲谱</button>
          <button v-else class="btn" @click="startSheetEdit">新建自己的版本</button>
          <button v-if="sheetInfo.isUser" class="btn btn-danger-sm" @click="removeSheet">删除我的曲谱</button>
        </div>
      </template>

      <template v-else-if="!sheetInfo && !editingSheet">
        <p class="muted small">这首歌还没有曲谱。可以自己录入分段和弦谱，保存在本机浏览器。</p>
        <button class="btn btn-block" style="margin-top: 10px" @click="startSheetEdit">录入曲谱</button>
      </template>

      <template v-else>
        <div v-for="(s, i) in sheetForm" :key="i" class="sheet-edit">
          <div class="sheet-edit-head">
            <span class="dim small">第 {{ i + 1 }} 段</span>
            <button v-if="sheetForm.length > 1" class="btn btn-danger-sm" @click="removeSection(i)">删除此段</button>
          </div>
          <label>段名（如：主歌 / 副歌）</label>
          <input v-model="s.name" type="text" placeholder="主歌" />
          <label>和弦进行（空格分隔）</label>
          <input v-model="s.chords" type="text" placeholder="Am C G D" />
          <label>节奏提示（可选）</label>
          <input v-model="s.pattern" type="text" placeholder="下 下上 下 下上" />
          <label>备注（可选）</label>
          <input v-model="s.note" type="text" placeholder="如：先 80% 速度" />
        </div>
        <div class="btn-row" style="margin-top: 12px">
          <button class="btn" @click="addSection">加一段</button>
          <button class="btn" @click="editingSheet = false">取消</button>
          <button class="btn btn-primary" @click="saveSheet">保存曲谱</button>
        </div>
      </template>
    </div>

    <div v-if="tpl" class="card">
      <h2>设备设置建议（按当前设备标注）</h2>
      <div class="tpl-head">
        <div class="tpl-name">{{ tpl.name }}</div>
        <span class="tag">{{ tpl.适用 }}</span>
      </div>
      <div class="small dim" style="margin-top: 6px">示例：{{ tpl.示例 }}</div>
      <ToneAdvice :tpl="tpl" />
      <p class="muted small" style="margin-top: 8px">{{ tpl.说明 }}</p>
      <button v-if="song.bpm" class="btn btn-block" style="margin-top: 12px" @click="openMetronome">
        用此 BPM 开节拍器（{{ Math.round(song.bpm) }} BPM）
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

  <SheetPdfViewer
    v-if="viewingPdf && song"
    :song-id="song.id"
    :name="pdfMeta?.fileName"
    @close="viewingPdf = false"
  />
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
.b-high { background: var(--ok-soft); border-color: var(--ok); color: var(--ok); }
.b-mid { background: var(--warn-soft); border-color: var(--warn-border); color: var(--warn-text); }
.b-low { background: var(--accent-soft); border-color: var(--accent); color: var(--accent-dark); }

.tpl-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.tpl-name { font-size: 18px; font-weight: 700; }

.chord-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; justify-content: center; }
.sheet-edit { border: 1px dashed var(--border); border-radius: 8px; padding: 12px; margin-bottom: 10px; }
.sheet-pdf { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border); }
.sheet-pdf-head {
  display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
}
.sheet-pdf-btns { margin: 0; }
.sheet-edit-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.sheet-edit label { display: block; margin: 8px 0 4px; }
.sheet-edit input { margin-bottom: 0; }
</style>
