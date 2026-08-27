// Pinia 自动持久化插件（v0.6.0）：
// store 声明 persist 配置后，状态变更自动（防抖 150ms）写 localStorage，
// 消灭「手动调 save() 漏调就静默丢数据」的问题。
// 与 v0.5.x 的手动持久化共用同一批 storage key 与存储格式，老数据零迁移。
//
// 配置示例：
//   persist: { key: 'songs', paths: ['userSongs'] }                    // 单 key 单字段
//   persist: [                                                         // 多 key 多字段
//     { key: 'ai-provider', paths: ['provider'] },
//     { key: 'ai-history', paths: ['history'] },
//   ]
// paths.length === 1 时存字段值本身（与旧格式一致），多个字段时存 { field: value } 对象。
//
// 注意：不声明 persist 的 store（timer/metronome 等全局运行时、recordings 走 IndexedDB）不受影响。
//
// v0.13.2：防抖窗口内的挂起写入统一登记，页面隐藏/关闭（visibilitychange→hidden /
// pagehide）时立即强制刷盘——「暂停计时→马上杀进程」这类操作若只靠 150ms 防抖，
// 落盘的还是旧状态，会把关机时段记进练习时长或丢掉最后的草稿。

import { save } from '../utils/storage.js'

const DEBOUNCE_MS = 150

// 全局唯一：key 不会跨 store 重复，timers/pending 都放模块级便于统一 flush
const timers = new Map()
const pending = new Map()

function runNow(key) {
  const t = timers.get(key)
  if (t !== undefined) clearTimeout(t)
  timers.delete(key)
  const fn = pending.get(key)
  if (!fn) return
  pending.delete(key)
  try {
    fn()
  } catch (err) {
    // storage.save 已通知全局监听者（App 弹横幅），这里吞掉避免后台任务抛未捕获错误
    console.error('[persist] 保存失败', key, err)
  }
}

export function flushPersist() {
  for (const key of [...pending.keys()]) runNow(key)
}

function bindFlushOnHide() {
  if (typeof window === 'undefined' || !window.addEventListener) return
  const onHide = () => {
    if (typeof document === 'undefined' || document.visibilityState === 'hidden') flushPersist()
  }
  window.addEventListener('pagehide', onHide)
  window.addEventListener('visibilitychange', onHide)
}

let bound = false

export function persistPlugin({ store, options }) {
  const configs = options.persist
  if (!configs) return
  const list = Array.isArray(configs) ? configs : [configs]

  store.$subscribe(
    (_mutation, state) => {
      for (const cfg of list) {
        const key = cfg.key
        const paths = cfg.paths || Object.keys(state)
        const data = {}
        for (const p of paths) data[p] = state[p]
        pending.set(
          key,
          () => save(key, paths.length === 1 ? data[paths[0]] : data),
        )
        if (timers.has(key)) clearTimeout(timers.get(key))
        timers.set(
          key,
          setTimeout(() => {
            timers.delete(key)
            runNow(key)
          }, DEBOUNCE_MS),
        )
      }
    },
    { detached: true, deep: true },
  )

  if (!bound) {
    bound = true
    bindFlushOnHide()
  }
}
