// 本地持久化抽象层（v0.6.0 升级）。
// 职责：①统一 key 前缀；②schema 版本与迁移（未来数据结构变更只改 MIGRATIONS 表，
// 老数据在 load 时自动升级写回，业务代码无感）；③变更订阅（save 时通知，云同步接入点）。
// 本地实现用 localStorage；云同步（Supabase）接入时替换 save/load 实现即可，业务代码不受影响。
// 注意：save 失败（如 localStorage 满）会抛错——宁可暴露问题，也不静默丢数据；
// v0.8.0 起同时通知全局监听者（onStorageError），UI 据此弹「存储不足」横幅。

const PREFIX = 'gla:v1:'
const META_KEY = 'gla:v1:meta'

/** 当前 schema 版本。未来改数据结构时 +1，并在 MIGRATIONS 里登记对应迁移函数。 */
export const SCHEMA_VERSION = 1

/**
 * 迁移注册表：key → 迁移函数数组，下标 i 表示把该 key 的数据从版本 (i+1) 升到 (i+2)。
 * 示例（未来 v2 要把 songs.analysis.tempoUseBpm 改名）：
 *   'songs': [(d) => d.map((s) => ({ ...s, analysis: { ...s.analysis, tempoUseBpm: undefined } }))]
 * 老数据 load 时自动按链跑完并写回；新写入的数据直接记当前版本，不会重复迁移。
 */
const MIGRATIONS = {}

/** @typedef {{ schemaVersion: number, keyVersions: Record<string, number> }} StorageMeta */

function readMeta() {
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? JSON.parse(raw) : { schemaVersion: 1, keyVersions: {} }
  } catch {
    return { schemaVersion: 1, keyVersions: {} }
  }
}

function writeMeta(meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    /* 元数据写失败不致命 */
  }
}

/** key → 订阅者集合（云同步预留：save 后通知） */
const subscribers = new Map()

// 存储失败监听者（v0.8.0）：save 抛错（localStorage 满等）时逐个通知，UI 弹横幅
const errorListeners = new Set()

/**
 * 订阅存储失败事件（save 抛错时触发）。返回取消订阅函数。
 * @param {(err: unknown) => void} fn
 * @returns {() => void}
 */
export function onStorageError(fn) {
  errorListeners.add(fn)
  return () => {
    errorListeners.delete(fn)
  }
}

function notifyStorageError(err) {
  for (const fn of errorListeners) {
    try {
      fn(err)
    } catch {
      /* 监听者异常不影响主流程 */
    }
  }
}

/**
 * 读取并反序列化。带版本迁移：老数据自动升级。
 * @template T
 * @param {string} key 业务 key（不含前缀）
 * @param {T} fallback 无数据时的默认值
 * @returns {T}
 */
export function load(key, fallback) {
  const meta = readMeta()
  const raw = localStorage.getItem(PREFIX + key)
  if (raw === null) {
    // 全新数据：直接记为当前版本，避免未来迁移误伤默认值
    if (meta.keyVersions[key] !== SCHEMA_VERSION) {
      meta.keyVersions[key] = SCHEMA_VERSION
      writeMeta(meta)
    }
    return fallback
  }
  try {
    let value = JSON.parse(raw)
    let from = meta.keyVersions[key] ?? 1
    const chain = MIGRATIONS[key] || []
    while (from < SCHEMA_VERSION) {
      const fn = chain[from - 1] // 版本 from → from+1 的迁移
      if (typeof fn === 'function') value = fn(value)
      from++
    }
    if ((meta.keyVersions[key] ?? 1) < SCHEMA_VERSION) {
      meta.keyVersions[key] = SCHEMA_VERSION
      writeMeta(meta)
      save(key, value) // 迁移结果写回（会触发订阅者）
    }
    return value
  } catch {
    return fallback // 单条数据损坏：返回默认值，不阻塞应用
  }
}

/** 序列化并写入，同时通知该 key 的订阅者。失败抛错并通知全局监听者（不静默）。 */
export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    // v0.11.0 云同步：记录「本机最后写入时间」（全量快照同步的新旧判断依据）。
    // 高频小字符串写入，成本可忽略；同步恢复写入也会刷新它（reload 后才是新数据）。
    localStorage.setItem(PREFIX + 'sync-stamp', new Date().toISOString())
  } catch (err) {
    notifyStorageError(err)
    throw err
  }
  const subs = subscribers.get(key)
  if (subs) {
    for (const fn of subs) {
      try {
        fn(value)
      } catch {
        /* 订阅者异常不影响主流程 */
      }
    }
  }
}

/**
 * 订阅某个 key 的变更（save 后触发）。返回取消订阅函数。
 * @param {string} key
 * @param {(value: unknown) => void} fn
 * @returns {() => void}
 */
export function subscribe(key, fn) {
  if (!subscribers.has(key)) subscribers.set(key, new Set())
  subscribers.get(key).add(fn)
  return () => {
    subscribers.get(key)?.delete(fn)
  }
}
