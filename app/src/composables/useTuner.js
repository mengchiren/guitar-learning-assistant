import { ref } from 'vue'

// 调音器：麦克风收音 + 降采样自相关（ACF）基频检测
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const A4 = 440

export function useTuner() {
  const active = ref(false)
  const note = ref('--')
  const cents = ref(0)
  const error = ref('')
  // v0.14.0：读数平滑（参考 cwilso/PitchDetect 的去抖思路）——原始检测每帧都在跳，
  // 连续几帧落在同一音名且音分波动小才认为「锁定」，避免新手被乱跳的指针劝退
  const stable = ref(false)

  let audioCtx = null
  let stream = null
  let analyser = null
  let buf = null
  let raf = 0
  // v0.13.2：start 期间的重入锁——原来 active 要等 getUserMedia 返回后才置位，
  // 快速双击会起两条 stream/两个 AudioContext，先者被覆盖后永不释放（泄麦克风）
  let starting = false
  let hist = [] // 最近几帧 {m: 音名索引(midi), c: 相对该音名的音分}

  function resetSmoothing() {
    hist = []
    stable.value = false
  }

  function noteName(midi) {
    const n = ((midi % 12) + 12) % 12
    return NOTE_NAMES[n] + (Math.floor(midi / 12) - 1)
  }

  async function start() {
    if (active.value || starting) return
    starting = true
    error.value = ''
    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        })
      } catch (e) {
        const reason =
          e && e.name === 'NotAllowedError' ? '权限被拒绝' : '未找到麦克风或当前环境不支持（需 HTTPS 或 localhost）'
        error.value = `无法访问麦克风（${reason}）。也可以点下方「参考音」用耳朵调弦。`
        return
      }
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 4096
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      buf = new Float32Array(analyser.fftSize)
      resetSmoothing()
      active.value = true
      loop()
    } finally {
      starting = false
    }
  }

  function detectPitch() {
    analyser.getFloatTimeDomainData(buf)
    const n = buf.length
    let sum = 0
    for (let i = 0; i < n; i++) sum += buf[i] * buf[i]
    if (sum / n < 2e-6) return 0 // 静音

    // 降采样一半，减小自相关计算量
    const dec = new Float32Array(n / 2)
    for (let i = 0; i < dec.length; i++) dec[i] = (buf[2 * i] + buf[2 * i + 1]) / 2

    const sr2 = audioCtx.sampleRate / 2
    const minLag = Math.floor(sr2 / 500) // 最高检测 500Hz
    const maxLag = Math.min(Math.floor(sr2 / 60), Math.floor(dec.length / 2)) // 最低 60Hz

    let energy = 0
    for (let i = 0; i < dec.length; i++) energy += dec[i] * dec[i]
    if (energy < 1e-4) return 0

    let best = -1
    let bestLag = 0
    for (let lag = minLag; lag <= maxLag; lag++) {
      let s = 0
      for (let i = 0; i < dec.length - lag; i++) s += dec[i] * dec[i + lag]
      // v0.8.0：自相关按有效窗长归一化——s 只累加 dec.length-lag 项，
      // 若除以全长能量，lag 越大分数系统性越低，强二次谐波的吉他音色会偏向高八度误判
      const r = s / (energy * ((dec.length - lag) / dec.length))
      if (r > best) {
        best = r
        bestLag = lag
      }
    }
    if (best < 0.6) return 0
    return sr2 / bestLag
  }

  function loop() {
    if (!active.value) return
    const freq = detectPitch()
    if (freq > 0) {
      const midi = 69 + 12 * Math.log2(freq / A4)
      const nearest = Math.round(midi)
      const centsRaw = Math.round((midi - nearest) * 100)

      hist.push({ m: nearest, c: centsRaw })
      if (hist.length > 5) hist.shift()
      const sameNote = hist.every((h) => h.m === hist[0].m)
      const spread = Math.max(...hist.map((h) => h.c)) - Math.min(...hist.map((h) => h.c))
      if (hist.length >= 3 && sameNote && spread <= 8) {
        // 锁定：取近几帧均值，指针稳定可读
        note.value = noteName(hist[0].m)
        cents.value = Math.round(hist.reduce((s, h) => s + h.c, 0) / hist.length)
        stable.value = true
      } else {
        // 未锁定：保留上一次读数但标记不稳定（低音弦弱基频本来波动就大，阈值放宽到 8 音分）
        stable.value = false
      }
    } else {
      note.value = '--'
      cents.value = 0
      resetSmoothing()
    }
    raf = requestAnimationFrame(loop)
  }

  function stop() {
    active.value = false
    if (raf) cancelAnimationFrame(raf)
    if (analyser) { try { analyser.disconnect() } catch { /* noop */ } }
    if (stream) stream.getTracks().forEach((t) => t.stop())
    if (audioCtx) audioCtx.close()
    analyser = null
    stream = null
    audioCtx = null
    note.value = '--'
    cents.value = 0
    resetSmoothing()
  }

  return { active, note, cents, error, stable, start, stop }
}
