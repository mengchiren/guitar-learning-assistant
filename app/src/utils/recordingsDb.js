// 练琴录音的本地持久化（IndexedDB）。
// 录音 blob 体积大（localStorage 上限 5MB 放不下），存浏览器内置数据库。
// 元数据与音频分两个 object store：列表页只读 meta，不把音频全量载入内存；
// 播放时按 id 取 blob。与 storage.js 一样是本地实现，后续云同步可整体替换。
const DB_NAME = 'gla-recordings'
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
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS, { keyPath: 'id' })
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

export async function putMeta(meta) {
  const db = await openDb()
  await request(db, META, 'readwrite', (s) => s.put(meta))
}

export async function getAllMeta() {
  const db = await openDb()
  const list = await request(db, META, 'readonly', (s) => s.getAll())
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function getMeta(id) {
  const db = await openDb()
  return request(db, META, 'readonly', (s) => s.get(id))
}

export async function putBlob(id, blob) {
  const db = await openDb()
  await request(db, BLOBS, 'readwrite', (s) => s.put({ id, blob }))
}

export async function getBlob(id) {
  const db = await openDb()
  const row = await request(db, BLOBS, 'readonly', (s) => s.get(id))
  return row ? row.blob : null
}

export async function deleteRecording(id) {
  const db = await openDb()
  await Promise.all([
    request(db, META, 'readwrite', (s) => s.delete(id)),
    request(db, BLOBS, 'readwrite', (s) => s.delete(id)),
  ])
}
