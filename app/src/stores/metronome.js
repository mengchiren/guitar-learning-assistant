import { defineStore } from 'pinia'

// Web Audio 资源与调度计时器放模块级：非响应式、全局唯一
let ctx = null
let timer = null
let nextTime = 0
let beatIndex = 0
const taps = []

// 节拍器（全局）：切页声音不断，节拍器页与练习页内嵌卡共享同一实例
export const useMetronomeStore = defineStore('metronome', {
  state: () => ({
    bpm: 100,
    beats: 4,
    running: false,
    currentBeat: 0, // 当前正在响的第几拍（1 起），供圆点高亮

    // ---- v0.14.0 渐进提速训练器（参考 Chordance 的 speed trainer）----
    // 会话态、不持久化：训练配置随停止即失效，符合练琴习惯；本 store 无 persist 配置。
    // 只在小节边界升速——前瞻调度下 tempo 变化发生在下一个调度拍上，不撕裂当前小节。
    rampEnabled: false,
    rampStartBpm: 100, // 开启训练那一刻的 BPM（供「回到起始」按钮）
    rampTargetBpm: 140,
    rampStepBpm: 5, // 每组提升量
    rampBarsPerStep: 4, // 每多少小节提升一次
    barCount: 0, // 本组已完成的小节数
    rampGroup: 0, // 已完成的提速组数（给用户正反馈）
  }),
  actions: {
    click(time, accented) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = accented ? 1760 : 990
      gain.gain.setValueAtTime(accented ? 0.28 : 0.16, time)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(time)
      osc.stop(time + 0.06)
    },
    // 小节边界回调：第一拍被调度且不是曲首时触发
    _onBarBoundary() {
      if (!this.rampEnabled || !this.running) return
      this.barCount += 1
      if (this.barCount < this.rampBarsPerStep) return
      this.barCount = 0
      const ceiling = Math.max(this.bpm, Math.min(220, this.rampTargetBpm))
      const next = Math.min(this.bpm + this.rampStepBpm, ceiling)
      if (next > this.bpm) {
        this.bpm = next
        this.rampGroup += 1
      }
      // 已到目标则保持原速继续响，不打断练习
    },
    schedule() {
      while (nextTime < ctx.currentTime + 0.12) {
        const beatNo = (beatIndex % this.beats) + 1
        if (beatNo === 1 && beatIndex > 0) this._onBarBoundary()
        this.click(nextTime, beatNo === 1)
        // 声音按 Web Audio 时钟排拍，视觉高亮也用同一时刻，圆点与实际响声对齐
        const delayMs = Math.max(0, (nextTime - ctx.currentTime) * 1000)
        setTimeout(() => {
          this.currentBeat = beatNo
        }, delayMs)
        nextTime += 60 / this.bpm
        beatIndex++
      }
    },
    async start() {
      if (this.running) return
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
      // v0.8.0：resume 后等音频上下文真正跑起来再排拍，否则第一次点击可能无声
      await ctx.resume()
      nextTime = ctx.currentTime + 0.05
      beatIndex = 0
      this.barCount = 0
      this.rampGroup = 0
      this.schedule()
      timer = setInterval(() => this.schedule(), 25)
      this.running = true
    },
    stop() {
      if (timer) clearInterval(timer)
      timer = null
      this.running = false
      this.currentBeat = 0
      this.barCount = 0
      this.rampGroup = 0
    },
    toggle() {
      if (this.running) this.stop()
      else this.start()
    },
    /** 开启训练时把当前 BPM 记为起点；关闭只关开关不动速度 */
    toggleRamp(on) {
      if (on && !this.rampEnabled) this.rampStartBpm = this.bpm
      this.rampEnabled = !!on
    },
    tap() {
      const now = performance.now()
      taps.push(now)
      if (taps.length > 6) taps.shift()
      if (taps.length >= 2) {
        const intervals = []
        for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1])
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
        const value = Math.round(60000 / avg)
        if (value >= 40 && value <= 220) this.bpm = value
      }
    },
  },
})
