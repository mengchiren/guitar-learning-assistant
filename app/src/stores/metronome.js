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
    schedule() {
      while (nextTime < ctx.currentTime + 0.12) {
        const beatNo = (beatIndex % this.beats) + 1
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
    start() {
      if (this.running) return
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
      ctx.resume()
      nextTime = ctx.currentTime + 0.05
      beatIndex = 0
      this.schedule()
      timer = setInterval(() => this.schedule(), 25)
      this.running = true
    },
    stop() {
      if (timer) clearInterval(timer)
      timer = null
      this.running = false
      this.currentBeat = 0
    },
    toggle() {
      if (this.running) this.stop()
      else this.start()
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
