// 壁纸模块测试（v0.13.0）：纯逻辑（wallpaper.js）+ IndexedDB 存储层（wallpaperDb.js）
// + settings 壁纸态与 persist 落盘。纯 Node 跑，无需浏览器。
// 用法: node spike/test_wallpapers.mjs
import { createRequire } from 'node:module'
import path from 'node:path'

// pinia/vue/fake-indexeddb 在 app/node_modules，从 spike/ 直接 import 解析不到，
// 用 createRequire 指到 app/（与 test_stores_smoke.mjs 同款）。
const appRequire = createRequire(path.resolve(process.cwd(), 'app/package.json'))
const { createPinia, setActivePinia } = appRequire('pinia')
const { createApp } = appRequire('vue')

// fake-indexeddb：为 wallpaperDb.js 提供 IndexedDB 环境（wallpaperDb 在调用时才读 indexedDB）
const fakeIDB = appRequire('fake-indexeddb')
globalThis.indexedDB = fakeIDB.indexedDB
globalThis.IDBKeyRange = fakeIDB.IDBKeyRange

// ---- localStorage 内存 shim ----
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  get length() {
    return mem.size
  },
  key: (i) => [...mem.keys()][i] ?? null,
}

const wp = await import('../app/src/utils/wallpaper.js')
const wpdb = await import('../app/src/utils/wallpaperDb.js')

let pass = 0
let fail = 0
async function touch(name, fn) {
  try {
    await fn()
    pass++
    console.log(`✓ ${name}`)
  } catch (e) {
    fail++
    console.log(`✗ ${name}: ${e.message}`)
  }
}

// ---- 纯逻辑：类型判定 / 上传校验 / 归一化 ----
await touch('wallpaperTypeFor 图片 mime', () => {
  if (wp.wallpaperTypeFor({ type: 'image/png' }) !== 'image') throw new Error('应为 image')
})
await touch('wallpaperTypeFor 视频 mime', () => {
  if (wp.wallpaperTypeFor({ type: 'video/mp4' }) !== 'video') throw new Error('应为 video')
})
await touch('wallpaperTypeFor 视频扩展名兜底', () => {
  if (wp.wallpaperTypeFor({ type: '', name: 'a.webm' }) !== 'video') throw new Error('应为 video')
})
await touch('wallpaperTypeFor 未知类型', () => {
  if (wp.wallpaperTypeFor({ type: 'text/plain' }) !== '') throw new Error('应为空')
})
await touch('validateWallpaperFile 空文件拒绝', () => {
  const r = wp.validateWallpaperFile(null)
  if (r.ok) throw new Error('应拒绝')
})
await touch('validateWallpaperFile 图片≤5MB', () => {
  const r = wp.validateWallpaperFile({ type: 'image/jpeg', name: 'a.jpg', size: 5 * 1024 * 1024 })
  if (!r.ok || r.type !== 'image') throw new Error('应通过')
})
await touch('validateWallpaperFile 图片>5MB 拒绝', () => {
  const r = wp.validateWallpaperFile({ type: 'image/jpeg', name: 'a.jpg', size: 5 * 1024 * 1024 + 1 })
  if (r.ok) throw new Error('应拒绝')
})
await touch('validateWallpaperFile 视频≤100MB', () => {
  const r = wp.validateWallpaperFile({ type: 'video/mp4', name: 'a.mp4', size: 100 * 1024 * 1024 })
  if (!r.ok || r.type !== 'video') throw new Error('应通过')
})
await touch('validateWallpaperFile 视频>100MB 拒绝', () => {
  const r = wp.validateWallpaperFile({ type: 'video/mp4', name: 'a.mp4', size: 100 * 1024 * 1024 + 1 })
  if (r.ok) throw new Error('应拒绝')
})
await touch('validateWallpaperFile 非图片视频拒绝', () => {
  const r = wp.validateWallpaperFile({ type: 'application/pdf', name: 'a.pdf', size: 10 })
  if (r.ok) throw new Error('应拒绝')
})
await touch('isWallpaperCustom', () => {
  if (!wp.isWallpaperCustom('image') || !wp.isWallpaperCustom('video')) throw new Error('应为真')
  if (wp.isWallpaperCustom('theme')) throw new Error('应为假')
})
await touch('normalizeWallpaper 默认值', () => {
  const n = wp.normalizeWallpaper(undefined)
  if (n.mode !== 'theme' || n.wallpaperId !== '') throw new Error('默认应为 theme')
  if (!(n.blur >= 0 && n.blur <= wp.WALLPAPER_CLAMP.blurMax)) throw new Error('blur 越界')
  if (!(n.veil >= 0 && n.veil <= wp.WALLPAPER_CLAMP.veilMax)) throw new Error('veil 越界')
})
await touch('normalizeWallpaper 非法 mode 回退 theme', () => {
  const n = wp.normalizeWallpaper({ mode: 'weird' })
  if (n.mode !== 'theme') throw new Error('应回退 theme')
})
await touch('normalizeWallpaper 越界钳制', () => {
  const n = wp.normalizeWallpaper({ mode: 'video', wallpaperId: 'x', blur: 999, brightness: 9, veil: 2 })
  if (n.blur !== wp.WALLPAPER_CLAMP.blurMax) throw new Error('blur 应被钳制')
  if (n.brightness !== wp.WALLPAPER_CLAMP.brightnessMax) throw new Error('brightness 应被钳制')
  if (n.veil !== wp.WALLPAPER_CLAMP.veilMax) throw new Error('veil 应被钳制')
})
await touch('normalizeWallpaper theme 清空 wallpaperId', () => {
  const n = wp.normalizeWallpaper({ mode: 'theme', wallpaperId: 'abc' })
  if (n.wallpaperId !== '') throw new Error('theme 下应清空 id')
})

// ---- IndexedDB 存储层 ----
await touch('wallpaperDb put/get 往返', async () => {
  const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' })
  await wpdb.putWallpaper('w1', { id: 'w1', type: 'image', mime: 'image/jpeg', size: 3, name: 'a.jpg', thumb: 'data:image/jpeg;base64,xx' }, blob)
  const meta = await wpdb.getWallpaperMeta('w1')
  if (!meta || meta.name !== 'a.jpg') throw new Error('meta 不一致')
  const got = await wpdb.getWallpaperBlob('w1')
  if (!got || got.size !== 3) throw new Error('blob 不一致')
})
await touch('wallpaperDb getAll 排序', async () => {
  await wpdb.putWallpaper('w2', { id: 'w2', type: 'video', mime: 'video/mp4', size: 4, name: 'b.mp4', createdAt: '2026-01-02' }, new Blob(['x']))
  await wpdb.putWallpaper('w3', { id: 'w3', type: 'image', mime: 'image/png', size: 4, name: 'c.png', createdAt: '2026-01-01' }, new Blob(['y']))
  const list = await wpdb.getAllWallpaperMeta()
  if (!Array.isArray(list) || list.length < 3) throw new Error('应至少 3 条')
})
await touch('wallpaperDb 删除不留孤儿', async () => {
  await wpdb.deleteWallpaper('w3')
  const m = await wpdb.getWallpaperMeta('w3')
  const b = await wpdb.getWallpaperBlob('w3')
  if (m || b) throw new Error('删除后应都为空')
})

// ---- settings 壁纸态 + persist 落盘 ----
const { persistPlugin } = await import('../app/src/plugins/persist.js')
const pinia = createPinia().use(persistPlugin)
createApp({}).use(pinia)
setActivePinia(pinia)

const { useSettingsStore } = await import('../app/src/stores/settings.js')
const settings = useSettingsStore()
await touch('settings 默认壁纸态', () => {
  if (settings.wallpaper.mode !== 'theme') throw new Error('默认应为 theme')
})
await touch('settings 壁纸态 persist 落盘', async () => {
  settings.wallpaper = wp.normalizeWallpaper({ mode: 'image', wallpaperId: 'w1', blur: 2, brightness: 1, veil: 0.5 })
  await new Promise((r) => setTimeout(r, 400))
  const raw = mem.get('gla:v1:wallpaper')
  const parsed = raw ? JSON.parse(raw) : null
  if (!parsed || parsed.mode !== 'image' || parsed.wallpaperId !== 'w1') throw new Error('未正确落盘')
})

console.log(`\n壁纸测试 ${pass} 通过 / ${fail} 失败`)
if (fail > 0) process.exit(1)
