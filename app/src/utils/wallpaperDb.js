// 壁纸文件的本地持久化（IndexedDB，v0.13.0）。
// 壁纸（图片/视频）体积可能达 100MB，localStorage 放不下，存浏览器内置数据库；
// 元数据与文件分两个 object store：外观设置页只读 meta（含缩略图），应用背景时才取 blob。
// 红线：壁纸只存在本机浏览器（与录音/原谱 PDF 同级），不进 git、不进部署包——
// Wallpaper Engine 壁纸多为用户自制/版权内容，站点是公开 URL，绝不随构建产物下发。
const DB_NAME = 'gla-wallpapers'
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

// 单事务写 meta + blob：任一步失败整体回滚，不留孤儿文件（仿 sheetPdfDb.putSheetPdf）。
export function putWallpaper(id, meta, blob) {
  return new Promise((resolve, reject) => {
    openDb().then(
      (db) => {
        const tx = db.transaction([META, BLOBS], 'readwrite')
        try {
          tx.objectStore(META).put({ ...meta, id })
          tx.objectStore(BLOBS).put({ id, blob })
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
export function deleteWallpaper(id) {
  return new Promise((resolve, reject) => {
    openDb().then(
      (db) => {
        const tx = db.transaction([META, BLOBS], 'readwrite')
        try {
          tx.objectStore(META).delete(id)
          tx.objectStore(BLOBS).delete(id)
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

export async function getAllWallpaperMeta() {
  const db = await openDb()
  const list = await request(db, META, 'readonly', (s) => s.getAll())
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function getWallpaperMeta(id) {
  const db = await openDb()
  return request(db, META, 'readonly', (s) => s.get(id))
}

export async function getWallpaperBlob(id) {
  const db = await openDb()
  const row = await request(db, BLOBS, 'readonly', (s) => s.get(id))
  return row ? row.blob : null
}
