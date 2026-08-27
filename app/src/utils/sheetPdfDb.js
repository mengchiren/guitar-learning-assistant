// 曲谱原谱 PDF 的本地持久化（IndexedDB，v0.12.0）。
// 课件 PDF（Guitar Pro 导出）体积通常 < 5MB，但 localStorage 5MB 上限放不下，存浏览器内置数据库。
// 元数据与文件分两个 object store：详情页只读 meta（文件名/大小），查看时才取 blob。
// 红线：PDF 只存在本机浏览器（与录音同级），不进 git、不进部署包——站点是公开 URL，
// 课件 PDF 页脚版权所有，绝不随构建产物下发。
// v0.13.2：通用能力收敛到 idbPairStore.js（key=songId）。
import { createIdbPairStore } from './idbPairStore.js'

const pair = createIdbPairStore({ dbName: 'gla-sheet-pdfs', keyPath: 'songId' })

// 单事务写 meta + blob：任一步失败整体回滚，不留孤儿文件。
export function putSheetPdf(songId, meta, blob) {
  return pair.withTransaction([pair.META, pair.BLOBS], (tx) => {
    tx.objectStore(pair.META).put({ ...meta, songId })
    tx.objectStore(pair.BLOBS).put({ songId, blob })
  })
}

// 单事务删 meta + blob：不再可能留下孤儿文件。
export function deleteSheetPdf(songId) {
  return pair.withTransaction([pair.META, pair.BLOBS], (tx) => {
    tx.objectStore(pair.META).delete(songId)
    tx.objectStore(pair.BLOBS).delete(songId)
  })
}

export const getSheetPdfMeta = (songId) => pair.getMeta(songId)
export const getSheetPdfBlob = (songId) => pair.getBlob(songId)
