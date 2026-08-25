// 曲谱原谱 PDF 的本地持久化（IndexedDB，v0.12.0）。
// 课件 PDF（Guitar Pro 导出）体积通常 < 5MB，但 localStorage 5MB 上限放不下，存浏览器内置数据库。
// 元数据与文件分两个 object store：详情页只读 meta（文件名/大小），查看时才取 blob。
// 红线：PDF 只存在本机浏览器（与录音同级），不进 git、不进部署包——站点是公开 URL，
// 课件 PDF 页脚版权所有，绝不随构建产物下发。
const DB_NAME = 'gla-sheet-pdfs'
const DB_VERSION = 1
const META = 'meta'
const BLOBS = 'blobs'

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB 不可用'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'songId' })
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS, { keyPath: 'songId' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function request(db, storeName, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// 单事务写 meta + blob（仿 recordingsDb.addRecording）：任一步失败整体回滚，不留孤儿文件。
export function putSheetPdf(songId, meta, blob) {
  return new Promise((resolve, reject) => {
    openDb().then(
      (db) => {
        const tx = db.transaction([META, BLOBS], 'readwrite')
        try {
          tx.objectStore(META).put({ ...meta, songId })
          tx.objectStore(BLOBS).put({ songId, blob })
        } catch (e) {
          reject(e)
          return
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error || new Error('数据库写入失败'))
        tx.onabort = () => reject(tx.error || new Error('数据库写入已回滚'))
      },
      (err) => reject(err),
    )
  })
}

// 单事务删 meta + blob：不再可能留下孤儿文件。
export function deleteSheetPdf(songId) {
  return new Promise((resolve, reject) => {
    openDb().then(
      (db) => {
        const tx = db.transaction([META, BLOBS], 'readwrite')
        try {
          tx.objectStore(META).delete(songId)
          tx.objectStore(BLOBS).delete(songId)
        } catch (e) {
          reject(e)
          return
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error || new Error('数据库写入失败'))
        tx.onabort = () => reject(tx.error || new Error('数据库写入已回滚'))
      },
      (err) => reject(err),
    )
  })
}

export async function getSheetPdfMeta(songId) {
  const db = await openDb()
  return request(db, META, 'readonly', (s) => s.get(songId))
}

export async function getSheetPdfBlob(songId) {
  const db = await openDb()
  const row = await request(db, BLOBS, 'readonly', (s) => s.get(songId))
  return row ? row.blob : null
}
