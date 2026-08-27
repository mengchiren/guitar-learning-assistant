<script setup>
// 原谱 PDF 查看器（v0.12.0）：全屏遮罩弹层，pdfjs-dist 逐页 canvas 渲染。
// pdfjs 动态 import：只在首次打开时加载，不拖进歌曲详情 chunk。
// 手机 A4 竖版建议横屏；双指缩放不做，用 −/+ 与「适应宽度」按钮控制。
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getSheetPdfBlob } from '../utils/sheetPdfDb.js'

const props = defineProps({
  songId: { type: String, required: true },
  name: { type: String, default: '' },
})
const emit = defineEmits(['close'])

const pageNum = ref(1)
const total = ref(0)
const zoom = ref(1) // 1 = 适应宽度
const loading = ref(true)
const error = ref('')
const canvas = ref(null)
const scrollBox = ref(null)
const isPortraitTip = ref(false)

let pdfDoc = null
let renderTask = null
let pdfjsLib = null
// v0.13.2：worker 只创建一次常驻复用——此前每次 load 都 new Worker 且从不回收，
// 反复开关 PDF 会累积渲染线程（泄漏）
let sharedWorkerPort = null

function ensurePdfWorker(lib) {
  if (!sharedWorkerPort) {
    // 用 Vite 原生 worker 打包写法：产物是 .js 文件，随主构建进 SW 预缓存
    // （pdf.worker.min.mjs 若走 new URL 资产引用会留在 globPatterns 之外，断网拉不到）
    sharedWorkerPort = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url), { type: 'module' })
    lib.GlobalWorkerOptions.workerPort = sharedWorkerPort
  }
}

async function load() {
  try {
    loading.value = true
    error.value = ''
    const blob = await getSheetPdfBlob(props.songId)
    if (!blob) throw new Error('没有找到 PDF 文件（可能已被移除或本机未上传）')
    const mod = await import('pdfjs-dist')
    pdfjsLib = mod
    ensurePdfWorker(pdfjsLib)
    const buf = await blob.arrayBuffer()
    pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise
    total.value = pdfDoc.numPages
    isPortraitTip.value = window.innerHeight > window.innerWidth
    await nextTick()
    await renderPage()
  } catch (e) {
    error.value = e?.message || 'PDF 加载失败'
    console.error('sheet pdf viewer:', e)
  } finally {
    loading.value = false
  }
}

async function renderPage() {
  if (!pdfDoc || !canvas.value) return
  if (renderTask) {
    try { renderTask.cancel() } catch { /* 已完成的忽略 */ }
  }
  const page = await pdfDoc.getPage(pageNum.value)
  const base = page.getViewport({ scale: 1 })
  // zoom === 1 → 适应容器宽度（PDF 原尺寸约 595px 宽，手机 390px 屏直接 fit）；
  // 否则为相对 PDF 原尺寸的倍数（0.75 → 3），由 −/+ 按钮步进。
  const containerW = (canvas.value.parentElement?.clientWidth || window.innerWidth) - 16
  const effScale = zoom.value === 1 ? Math.max(containerW / base.width, 0.2) : zoom.value
  const vp = page.getViewport({ scale: effScale })
  const dpr = window.devicePixelRatio || 1
  canvas.value.width = Math.floor(vp.width * dpr)
  canvas.value.height = Math.floor(vp.height * dpr)
  canvas.value.style.width = Math.floor(vp.width) + 'px'
  canvas.value.style.height = Math.floor(vp.height) + 'px'
  renderTask = page.render({
    canvasContext: canvas.value.getContext('2d'),
    viewport: vp,
    transform: dpr > 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
  })
  return renderTask.promise
}

function prevPage() {
  if (pageNum.value > 1) { pageNum.value--; renderPage() }
}
function nextPage() {
  if (pageNum.value < total.value) { pageNum.value++; renderPage() }
}
function setZoom(z) {
  zoom.value = z
  renderPage()
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowLeft') prevPage()
  if (e.key === 'ArrowRight') nextPage()
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  load()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (renderTask) { try { renderTask.cancel() } catch { /* noop */ } }
  // v0.13.2：关闭时销毁文档句柄释放内存；worker 常驻复用（见 sharedWorkerPort）
  if (pdfDoc) { try { pdfDoc.destroy() } catch { /* noop */ } }
  pdfDoc = null
})
</script>

<template>
  <div class="pdf-viewer" @click.self="emit('close')">
    <div class="pdf-topbar">
      <span class="pdf-name" :title="name">{{ name || '原谱 PDF' }}</span>
      <div class="pdf-ctrl">
        <span class="pdf-pageinfo">{{ pageNum }}/{{ total }}</span>
        <button class="btn btn-sm" @click="setZoom(0.75)" :disabled="zoom === 0.75">−</button>
        <button class="btn btn-sm" :class="{ 'on': zoom === 1 }" @click="setZoom(1)">适应宽度</button>
        <button class="btn btn-sm" @click="setZoom(Math.min(zoom * 1.25, 3))" :disabled="zoom === 3">+</button>
        <button class="btn btn-sm" @click="emit('close')">关闭</button>
      </div>
    </div>
    <p v-if="isPortraitTip" class="pdf-tip">📱 手机建议横屏查看（左右滑动 + 按钮翻页缩放）</p>
    <div ref="scrollBox" class="pdf-scroll">
      <p v-if="loading" class="muted small" style="text-align:center;padding:24px">正在加载 PDF…</p>
      <p v-else-if="error" class="pdf-error">{{ error }}</p>
      <canvas v-show="!loading && !error" ref="canvas" class="pdf-canvas"></canvas>
      <div v-if="!loading && !error" class="pdf-nav">
        <button class="btn" @click="prevPage" :disabled="pageNum <= 1">← 上一页</button>
        <button class="btn" @click="nextPage" :disabled="pageNum >= total">下一页 →</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-viewer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
}
.pdf-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-card);
  flex-wrap: wrap;
}
.pdf-name {
  font-weight: 600;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pdf-ctrl {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}
.pdf-pageinfo {
  font-variant-numeric: tabular-nums;
  color: var(--text-2);
  margin-right: 4px;
}
.pdf-tip {
  text-align: center;
  color: #fff;
  font-size: 13px;
  padding: 6px 0 0;
}
.pdf-scroll {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  touch-action: pan-x pan-y;
}
.pdf-canvas {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  max-width: 100%;
}
.pdf-nav {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.pdf-error {
  color: #fff;
  padding: 24px;
  text-align: center;
}
</style>
