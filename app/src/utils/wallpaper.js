// 壁纸模块的纯逻辑（v0.13.0）：类型判定 / 上传校验 / 默认态 / 钳制。
// 与样式无关、无浏览器依赖，可在纯 Node 里跑单测（spike/test_wallpapers.mjs）。
// 约定：settings.wallpaper = { mode: 'theme'|'image'|'video', wallpaperId, blur, brightness, veil }。
// 红线：壁纸文件只存每台设备本机 IndexedDB（gla-wallpapers），不进 git / 部署包 / SW 预缓存。

export const WALLPAPER_LIMITS = {
  // 图片上限 5MB（壁纸定位，够高清）
  imageMaxBytes: 5 * 1024 * 1024,
  // 视频上限 100MB（用户确认放宽；WE 壁纸多是循环短片）
  videoMaxBytes: 100 * 1024 * 1024,
}

/** 滑条钳制（UI 层直接引用，避免魔法数散落） */
export const WALLPAPER_CLAMP = {
  blurMax: 12, // 模糊（px）
  brightnessMin: 0.4,
  brightnessMax: 2,
  veilMax: 0.95, // 遮罩浓度（0~1）
}

/** 默认壁纸态：跟随主题背景，不打模糊/不加遮罩 */
export const DEFAULT_WALLPAPER = { mode: 'theme', wallpaperId: '', blur: 0, brightness: 1, veil: 0.55 }

/**
 * 根据文件的 MIME 类型判定壁纸类别。
 * WE 壁纸主要是图片（jpg/png/apng/gif）与视频（mp4/webm）。
 * @param {{ type?: string }} file
 * @returns {'image'|'video'|''}
 */
export function wallpaperTypeFor(file) {
  const t = (file?.type || '').toLowerCase()
  if (t.startsWith('image/')) return 'image'
  if (t.startsWith('video/')) return 'video'
  // 部分视频/图片 mime 可能为空（如 .webm 少数情况），按扩展名兜底
  const name = (file?.name || '').toLowerCase()
  if (/\.(mp4|webm|mov|mkv)$/.test(name)) return 'video'
  if (/\.(jpe?g|png|apng|gif|webp|bmp)$/.test(name)) return 'image'
  return ''
}

/**
 * 上传前校验：类型必须是 image/video，且不超过对应大小上限。
 * @param {{ type?: string, name?: string, size?: number }} file
 * @returns {{ ok: true, type: 'image'|'video' } | { ok: false, error: string }}
 */
export function validateWallpaperFile(file) {
  if (!file) return { ok: false, error: '未选择文件' }
  const type = wallpaperTypeFor(file)
  if (!type) return { ok: false, error: '仅支持图片（jpg/png/webp 等）或视频（mp4/webm 等）' }
  const limit = type === 'image' ? WALLPAPER_LIMITS.imageMaxBytes : WALLPAPER_LIMITS.videoMaxBytes
  if (file.size > limit) {
    const mb = Math.round((limit / 1024 / 1024) * 10) / 10
    return { ok: false, error: `${type === 'image' ? '图片' : '视频'}超过 ${mb}MB 上限，请换一个` }
  }
  return { ok: true, type }
}

/** 当前是否使用自定义壁纸（非主题默认背景） */
export function isWallpaperCustom(mode) {
  return mode === 'image' || mode === 'video'
}

/** 归一化壁纸态（合并默认值，防旧字段缺失/越界） */
export function normalizeWallpaper(value) {
  const base = { ...DEFAULT_WALLPAPER, ...(value || {}) }
  if (!['theme', 'image', 'video'].includes(base.mode)) base.mode = 'theme'
  base.blur = Number.isFinite(base.blur) ? Math.max(0, Math.min(WALLPAPER_CLAMP.blurMax, base.blur)) : 0
  base.brightness = Number.isFinite(base.brightness)
    ? Math.max(WALLPAPER_CLAMP.brightnessMin, Math.min(WALLPAPER_CLAMP.brightnessMax, base.brightness))
    : 1
  base.veil = Number.isFinite(base.veil) ? Math.max(0, Math.min(WALLPAPER_CLAMP.veilMax, base.veil)) : 0.55
  if (!isWallpaperCustom(base.mode)) base.wallpaperId = ''
  return base
}
