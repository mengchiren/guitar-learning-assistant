// 壁纸文件的本地持久化（IndexedDB，v0.13.0）。
// 壁纸（图片/视频）体积可能达 100MB，localStorage 放不下，存浏览器内置数据库；
// 元数据与文件分两个 object store：外观设置页只读 meta（含缩略图），应用背景时才取 blob。
// 红线：壁纸只存在本机浏览器（与录音/原谱 PDF 同级），不进 git、不进部署包——
// Wallpaper Engine 壁纸多为用户自制/版权内容，站点是公开 URL，绝不随构建产物下发。
// v0.13.2：通用能力收敛到 idbPairStore.js（key=id）。
import { createIdbPairStore } from './idbPairStore.js'

const pair = createIdbPairStore({ dbName: 'gla-wallpapers', keyPath: 'id' })

// 单事务写 meta + blob：任一步失败整体回滚，不留孤儿文件（仿 sheetPdfDb.putSheetPdf）。
export function putWallpaper(id, meta, blob) {
  return pair.withTransaction([pair.META, pair.BLOBS], (tx) => {
    tx.objectStore(pair.META).put({ ...meta, id })
    tx.objectStore(pair.BLOBS).put({ id, blob })
  })
}

// 单事务删 meta + blob：不再可能留下孤儿文件。
export function deleteWallpaper(id) {
  return pair.withTransaction([pair.META, pair.BLOBS], (tx) => {
    tx.objectStore(pair.META).delete(id)
    tx.objectStore(pair.BLOBS).delete(id)
  })
}

export const getAllWallpaperMeta = () => pair.getAllMeta()
export const getWallpaperMeta = (id) => pair.getMeta(id)
export const getWallpaperBlob = (id) => pair.getBlob(id)
