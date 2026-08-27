// 「meta + blobs 双 object store」IndexedDB 工厂（v0.13.2）。
// 录音 / 曲谱原谱 PDF / 壁纸三处此前各自维护一份近乎逐行相同的封装（open/request/
// 单事务写删共约 90 行 ×3），收敛到这里；各业务模块只保留自己的导出名与个别差异。
// 升级被其他标签页占用时打警告（原实现会无声挂起等待）。
export function createIdbPairStore({ dbName, dbVersion = 1, keyPath, metaStore = 'meta', blobStore = 'blobs' }) {
  let dbPromise = null

  function openDb() {
    if (dbPromise) return dbPromise
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB 不可用'))
        return
      }
      const req = indexedDB.open(dbName, dbVersion)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(metaStore)) db.createObjectStore(metaStore, { keyPath })
        if (!db.objectStoreNames.contains(blobStore)) db.createObjectStore(blobStore, { keyPath })
      }
      req.onblocked = () => console.warn(`[idb] ${dbName} 升级被其他页面阻塞，请关闭本应用其他标签页后刷新`)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    return dbPromise
  }

  /** 单 store 上跑一个请求并等结果 */
  async function run(storeName, mode, fn) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode)
      const r = fn(tx.objectStore(storeName))
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
  }

  /** 多 store 单事务写：fn 里自己下操作；任一步失败整体回滚（防孤儿 blob） */
  function withTransaction(storeNames, fn) {
    return new Promise((resolve, reject) => {
      openDb().then(
        (db) => {
          const tx = db.transaction(storeNames, 'readwrite')
          try {
            fn(tx)
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

  return {
    META: metaStore,
    BLOBS: blobStore,
    withTransaction,
    putMeta: (meta) => run(metaStore, 'readwrite', (s) => s.put(meta)),
    getMeta: (key) => run(metaStore, 'readonly', (s) => s.get(key)),
    getAllMeta: async () => {
      const list = await run(metaStore, 'readonly', (s) => s.getAll())
      return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    },
    putBlob: (key, blob) => run(blobStore, 'readwrite', (s) => s.put({ [keyPath]: key, blob })),
    getBlob: async (key) => {
      const row = await run(blobStore, 'readonly', (s) => s.get(key))
      return row ? row.blob : null
    },
  }
}
