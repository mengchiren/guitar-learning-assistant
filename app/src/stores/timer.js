import { defineStore } from 'pinia'

// 练习计时器（全局）：切页不停表，练习页/外壳胶囊共享同一计时状态
let tick = null

export const useTimerStore = defineStore('timer', {
  state: () => ({
    running: false,
    startedAt: 0,
    accumulated: 0, // 已累计秒数（不含当前这一段）
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
