// 练琴录音的本地持久化（IndexedDB）。
// 录音 blob 体积大（localStorage 上限 5MB 放不下），存浏览器内置数据库。
// 元数据与音频分两个 object store：列表页只读 meta，不把音频全量载入内存；
// 播放时按 id 取 blob。与 storage.js 一样是本地实现，后续云同步可整体替换。
// v0.13.2：通用能力收敛到 idbPairStore.js，这里只保留录音语义的导出与原子写删。
import { createIdbPairStore } from './idbPairStore.js'

const pair = createIdbPairStore({ dbName: 'gla-recordings', keyPath: 'id' })

export const putMeta = (meta) => pair.putMeta(meta)
export const getAllMeta = () => pair.getAllMeta()
export const getMeta = (id) => pair.getMeta(id)
export const putBlob = (id, blob) => pair.putBlob(id, blob)
export const getBlob = (id) => pair.getBlob(id)

// 单事务写 meta + blob（v0.8.0）：两个 object store 在同一事务里提交，
// 任一步失败整体回滚，不会留下「blob 存了、meta 没存」的孤儿录音。
export function addRecording(meta, blob) {
  return pair.withTransaction([pair.META, pair.BLOBS], (tx) => {
    tx.objectStore(pair.META).put(meta)
    tx.objectStore(pair.BLOBS).put({ id: meta.id, blob })
  })
}

// 单事务删 meta + blob（v0.8.0）：原子删除，不再可能留下孤儿 blob。
export function deleteRecording(id) {
  return pair.withTransaction([pair.META, pair.BLOBS], (tx) => {
    tx.objectStore(pair.META).delete(id)
    tx.objectStore(pair.BLOBS).delete(id)
  })
}
