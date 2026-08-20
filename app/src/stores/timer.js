import { defineStore } from 'pinia'
import { load } from '../utils/storage.js'
import { localDateStr } from '../utils/date.js'

// 练习计时器（全局）：切页不停表，练习页/外壳胶囊共享同一计时状态。
// v0.8.0：会话状态（running/startedAt/accumulated）随变更防抖落盘，
// 手机浏览器回收/误关/崩溃后重开可恢复，练了多久不白费。
// now 是每秒 tick 的响应式时钟，不入库（见 persist paths）。

let tick = null

const SESSION_KEY = 'timer-session'
const EMPTY_SESSION = { running: false, startedAt: 0, accumulated: 0 }
const STALE_MS = 12 * 3600 * 1000 // 恢复时 running 会话超过 12 小时视为脏会话

// 恢复上次会话（进程被杀/刷新后重开）：
// running 会话跨天或超时（如昨晚忘了关）自动作废，防止误记十几个小时；
// 否则原样恢复，elapsed 按 startedAt 继续累计。
function restoreSession() {
  let s
  try {
    s = load(SESSION_KEY, EMPTY_SESSION)
  } catch {
    s = EMPTY_SESSION
  }
  if (!s || typeof s !== 'object') return { ...EMPTY_SESSION }
  const running = Boolean(s.running) && typeof s.startedAt === 'number' && s.startedAt > 0
  if (running) {
    const started = new Date(s.startedAt)
    const stale =
      Date.now() - s.startedAt > STALE_MS || localDateStr(started) !== localDateStr()
    if (stale) return { ...EMPTY_SESSION }
  }
  return {
    running,
    startedAt: running ? s.startedAt : 0,
    accumulated: Number(s.accumulated) > 0 ? Number(s.accumulated) : 0,
  }
}

export const useTimerStore = defineStore('timer', {
  // 自动落盘（persist 插件，防抖 150ms）；now 每秒变化不写库
  persist: { key: SESSION_KEY, paths: ['running', 'startedAt', 'accumulated'] },
  state: () => ({
    ...restoreSession(),
    now: 0, // 每秒 tick，驱动 elapsedSec 重算（Date.now 非响应式）
  }),
  getters: {
    elapsedSec: (s) => {
      s.now // 显式依赖：每秒 tick 触发重算
      return s.accumulated + (s.running ? (Date.now() - s.startedAt) / 1000 : 0)
    },
    // 有进行中或已累计的练习时显示外壳「练习中」胶囊
    active: (s) => s.running || s.accumulated > 0,
  },
  actions: {
    // 应用启动时调用：恢复的 running 会话要重新拉起 tick，外壳胶囊才继续走
    init() {
      if (this.running && !tick) {
        tick = setInterval(() => {
          this.now = Date.now()
        }, 1000)
      }
    },
    start() {
      if (this.running) return
      this.running = true
      this.startedAt = Date.now()
      if (tick) clearInterval(tick)
      tick = setInterval(() => {
        this.now = Date.now()
      }, 1000)
    },
    pause() {
      if (!this.running) return
      this.accumulated += (Date.now() - this.startedAt) / 1000
      this.running = false
      this.clearTick()
    },
    stop() {
      if (this.running) this.accumulated += (Date.now() - this.startedAt) / 1000
      this.running = false
      this.clearTick()
    },
    reset() {
      this.stop()
      this.accumulated = 0
    },
    clearTick() {
      if (tick) clearInterval(tick)
      tick = null
    },
  },
})
