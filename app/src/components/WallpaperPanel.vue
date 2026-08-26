<script setup>
// 背景壁纸面板（v0.13.0）：外观主题卡里的「背景壁纸」子区。
// 结构：当前壁纸预览（主题默认 / 自定义缩略图）+ 上传图片/视频按钮 + 恢复主题默认 + 三个滑条。
// 壁纸文件存本机 IndexedDB（gla-wallpapers），只在这台设备；换设备需重新上传。
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { putWallpaper, deleteWallpaper, getWallpaperMeta } from '../utils/wallpaperDb.js'
import { validateWallpaperFile, normalizeWallpaper, WALLPAPER_CLAMP } from '../utils/wallpaper.js'
import { newId } from '../utils/id.js'

const settings = useSettingsStore()

const current = ref(null) // { id, type, name, size, thumb, createdAt } | null
let loadedId = ''

async function loadCurrent() {
  const id = settings.wallpaper.wallpaperId
  if (!id) {
    current.value = null
    loadedId = ''
    return
  }
  if (id === loadedId && current.value) return
  try {
    current.value = await getWallpaperMeta(id)
    loadedId = id
  } catch {
    current.value = null
  }
}

const isCustom = computed(() => settings.wallpaper.mode !== 'theme')
const modeName = computed(() => (settings.wallpaper.mode === 'video' ? '视频壁纸' : '图片壁纸'))
const err = ref('')
const uploading = ref(false)

function pick(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (f) onUpload(f)
}

function sizeLabel(b) {
  if (b < 1024) return b + 'B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + 'KB'
  return (b / 1024 / 1024).toFixed(1) + 'MB'
}

async function onUpload(file) {
  err.value = ''
  const v = validateWallpaperFile(file)
  if (!v.ok) {
    err.value = v.error
    return
  }
  uploading.value = true
  try {
    const id = newId()
    const meta = {
      id,
      type: v.type,
      mime: file.type || '',
      size: file.size,
      name: file.name,
      createdAt: new Date().toISOString(),
    }
    try {
      meta.thumb = await makeThumb(file, v.type)
    } catch {
      meta.thumb = ''
    }
    await putWallpaper(id, meta, file)
    const oldId = settings.wallpaper.wallpaperId
    if (oldId && oldId !== id) deleteWallpaper(oldId).catch(() => {})
    settings.wallpaper = normalizeWallpaper({
      mode: v.type,
      wallpaperId: id,
      blur: v.type === 'video' ? 4 : 0,
      brightness: 1,
      veil: 0.55,
    })
    await loadCurrent()
  } catch (e) {
    err.value = '保存失败：' + (e?.message || '未知错误')
  } finally {
    uploading.value = false
  }
}

async function onUseTheme() {
  const id = settings.wallpaper.wallpaperId
  if (id) deleteWallpaper(id).catch(() => {})
  settings.wallpaper = normalizeWallpaper({})
  current.value = null
  loadedId = ''
  err.value = ''
}

const M = computed(() => ({
  blur: Number(settings.wallpaper.blur || 0),
  brightness: Number(settings.wallpaper.brightness || 1),
  veil: Number(settings.wallpaper.veil || 0),
}))

function setBlur(e) {
  settings.wallpaper = { ...settings.wallpaper, blur: Number(e.target.value) }
}
function setBrightness(e) {
  settings.wallpaper = { ...settings.wallpaper, brightness: Number(e.target.value) }
}
function setVeil(e) {
  settings.wallpaper = { ...settings.wallpaper, veil: Number(e.target.value) }
}

onMounted(loadCurrent)

// ---- 缩略图抽帧（浏览器 API）----
function drawScaled(el, maxDim) {
  const w = el.naturalWidth || el.videoWidth || el.width
  const h = el.naturalHeight || el.videoHeight || el.height
  if (!w || !h) throw new Error('无法读取画面尺寸')
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  canvas.getContext('2d').drawImage(el, 0, 0, cw, ch)
  return canvas.toDataURL('image/jpeg', 0.8)
}

function makeThumb(file, type, maxDim = 360) {
  const url = URL.createObjectURL(file)
  if (type === 'image') {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          const d = drawScaled(img, maxDim)
          URL.revokeObjectURL(url)
          resolve(d)
        } catch (e) {
          URL.revokeObjectURL(url)
          reject(e)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('图片解码失败'))
      }
      img.src = url
    })
  }
  // 视频：取首帧（seek 到 0.1s 或 50% 时长，再抽帧）
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    let settled = false
    const cleanup = () => URL.revokeObjectURL(url)
    const grab = () => {
      if (settled) return
      settled = true
      try {
        const d = drawScaled(v, maxDim)
        cleanup()
        resolve(d)
      } catch (e) {
        cleanup()
        reject(e)
      }
    }
    v.onloadedmetadata = () => {
      try {
        v.currentTime = Math.min(0.1, (v.duration || 0.1) * 0.5)
      } catch {
        /* 某些标签页 seek 不了，靠 oncanplay 兜底 */
      }
    }
    v.onseeked = grab
    v.oncanplay = grab
    v.onerror = () => {
      cleanup()
      reject(new Error('视频解码失败'))
    }
    v.src = url
  })
}
</script>

<template>
  <div class="wallpaper-panel">
    <!-- 当前壁纸：主题默认 / 自定义缩略图 -->
    <div v-if="isCustom && current" class="wallpaper-current">
      <img v-if="current.thumb" class="wallpaper-thumb" :src="current.thumb" alt="当前壁纸" />
      <span v-else class="wallpaper-thumb wallpaper-thumb--empty"><Icon name="image" :size="22" /></span>
      <div class="wallpaper-current-meta">
        <div class="small" style="font-weight: 600">{{ current.name }}</div>
        <div class="dim small">{{ modeName }} · {{ sizeLabel(current.size) }}</div>
      </div>
    </div>
    <div v-else class="wallpaper-current wallpaper-current--theme">
      <span class="small" style="font-weight: 600">当前：主题默认背景</span>
    </div>

    <!-- 上传 + 恢复 -->
    <div class="wallpaper-actions">
      <label class="wallpaper-upload" :class="{ busy: uploading }">
        <span>上传图片</span>
        <input type="file" accept="image/*" hidden @change="pick" />
      </label>
      <label class="wallpaper-upload" :class="{ busy: uploading }">
        <span>上传视频</span>
        <input type="file" accept="video/*" hidden @change="pick" />
      </label>
      <button v-if="isCustom" class="wallpaper-remove" @click="onUseTheme">恢复主题默认</button>
    </div>
    <p class="dim small" style="margin-top: 6px">图片 ≤5MB · 视频 ≤100MB（mp4/webm）</p>

    <!-- 三个滑条：自定义时生效 -->
    <div v-if="isCustom" class="wallpaper-sliders">
      <label class="wallpaper-slider">
        <span>模糊 {{ M.blur }}px</span>
        <input type="range" min="0" :max="WALLPAPER_CLAMP.blurMax" step="1" :value="M.blur" @input="setBlur" />
      </label>
      <label class="wallpaper-slider">
        <span>亮度 {{ M.brightness.toFixed(1) }}</span>
        <input type="range" :min="WALLPAPER_CLAMP.brightnessMin" :max="WALLPAPER_CLAMP.brightnessMax" step="0.1" :value="M.brightness" @input="setBrightness" />
      </label>
      <label class="wallpaper-slider">
        <span>遮罩 {{ Math.round(M.veil * 100) }}%</span>
        <input type="range" min="0" :max="WALLPAPER_CLAMP.veilMax" step="0.05" :value="M.veil" @input="setVeil" />
      </label>
    </div>

    <p v-if="err" class="muted small" style="margin-top: 8px; color: var(--warn-text)">{{ err }}</p>
    <p class="muted small" style="margin-top: 8px">壁纸只保存在这台设备浏览器里，换设备需重新上传；建议选明亮/虚化壁纸并调遮罩，保证练琴内容清晰。</p>
  </div>
</template>
