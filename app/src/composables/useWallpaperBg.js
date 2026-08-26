// 壁纸背景的响应式桥接（v0.13.0）：settings.wallpaper → blob object URL。
// 在 App.vue 挂一个全屏背景层时使用；负责从 IndexedDB 取壁纸 blob、生成/回收 object URL。
// 注意：object URL 生命周期要管好——切壁纸/卸载时 revoke 旧 URL，否则会泄漏。
import { ref, watch, computed, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { getWallpaperBlob } from '../utils/wallpaperDb.js'
import { isWallpaperCustom, normalizeWallpaper } from '../utils/wallpaper.js'

export function useWallpaperBg() {
  const settings = useSettingsStore()
  const url = ref('')
  const ready = ref(false)
  let currentUrl = ''
  let seq = 0 // 请求序号：快速切换时丢弃过期的 blob，避免「慢的旧壁纸覆盖新选择」

  function revoke() {
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl)
      currentUrl = ''
    }
  }

  async function load() {
    const w = settings.wallpaper
    if (!isWallpaperCustom(w.mode) || !w.wallpaperId) {
      revoke()
      url.value = ''
      ready.value = false
      return
    }
    const mine = ++seq
    let blob = null
    try {
      blob = await getWallpaperBlob(w.wallpaperId)
    } catch {
      blob = null
    }
    if (mine !== seq) return // 期间用户又切了，丢弃这次结果
    if (!blob) {
      // 文件缺失（IndexedDB 被清 / 恢复备份到新设备）：自动回退主题背景，避免空遮罩
      settings.wallpaper = normalizeWallpaper({ ...w, mode: 'theme', wallpaperId: '' })
      revoke()
      url.value = ''
      ready.value = false
      return
    }
    revoke()
    currentUrl = URL.createObjectURL(blob)
    url.value = currentUrl
    ready.value = true
  }

  watch(() => settings.wallpaper, load, { immediate: true })
  onUnmounted(revoke)

  const bg = computed(() => {
    const w = settings.wallpaper
    const hasItem = isWallpaperCustom(w.mode) && !!w.wallpaperId
    return {
      mode: w.mode,
      // hasItem：确实选了自定义壁纸（非仅点了 image/video 但没上传）
      hasItem,
      url: url.value,
      blur: w.blur,
      brightness: w.brightness,
      veil: w.veil,
      // ready：blob 已从 IndexedDB 取出并生成 object URL
      ready: ready.value,
    }
  })

  return { bg }
}
