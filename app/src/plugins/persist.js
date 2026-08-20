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

import { save } from '../utils/storage.js'

const DEBOUNCE_MS = 150

export function persistPlugin({ store, options }) {
  const configs = options.persist
  if (!configs) return
  const list = Array.isArray(configs) ? configs : [configs]
  const timers = new Map()

  store.$subscribe(
    (_mutation, state) => {
      for (const cfg of list) {
        const key = cfg.key
        if (timers.has(key)) clearTimeout(timers.get(key))
        timers.set(
          key,
          setTimeout(() => {
            timers.delete(key)
            const paths = cfg.paths || Object.keys(state)
            const data = {}
            for (const p of paths) data[p] = state[p]
            try {
              save(key, paths.length === 1 ? data[paths[0]] : data)
            } catch (err) {
              // v0.8.0：落盘失败不静默——storage.save 已通知全局监听者（App 弹横幅），
              // 这里吞掉异常避免 setTimeout 里出现未捕获错误，下次变更会再次尝试。
              console.error('[persist] 保存失败', key, err)
            }
          }, DEBOUNCE_MS),
        )
      }
    },
    { detached: true, deep: true },
  )
}
