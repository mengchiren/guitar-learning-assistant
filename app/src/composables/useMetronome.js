import { ref, onUnmounted } from 'vue'

// 节拍器：Web Audio 前瞻调度（lookahead scheduling），避免 setInterval 抖动
export function useMetronome() {
  const bpm = ref(100)
  const beats = ref(4)
  const running = ref(false)

  let ctx = null
  let timer = null
  let nextTime = 0
  let beatIndex = 0
  const taps = []

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    return ctx
  }

  function click(time, accented) {
    const c = ctx
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'square'
    osc.frequency.value = accented ? 1760 : 990
    gain.gain.setValueAtTime(accented ? 0.28 : 0.16, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(time)
    osc.stop(time + 0.06)
  }

  function schedule() {
    while (nextTime < ctx.currentTime + 0.12) {
      click(nextTime, beatIndex % beats.value === 0)
      nextTime += 60 / bpm.value
      beatIndex++
    }
  }

  function start() {
    ensureCtx()
    ctx.resume()
    nextTime = ctx.currentTime + 0.05
    beatIndex = 0
    schedule()
    timer = setInterval(schedule, 25)
    running.value = true
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
    running.value = false
  }

  function toggle() {
    if (running.value) stop()
    else start()
  }

  function tap() {
    const now = performance.now()
    taps.push(now)
    if (taps.length > 6) taps.shift()
    if (taps.length >= 2) {
      const intervals = []
      for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const value = Math.round(60000 / avg)
      if (value >= 40 && value <= 220) bpm.value = value
    }
  }

  onUnmounted(stop)
  return { bpm, beats, running, start, stop, toggle, tap }
}
