import { ref } from 'vue'

// 调音器：麦克风收音 + 降采样自相关（ACF）基频检测
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const A4 = 440

export function useTuner() {
  const active = ref(false)
  const note = ref('--')
  const cents = ref(0)
  const error = ref('')

  let audioCtx = null
  let stream = null
  let analyser = null
  let buf = null
  let raf = 0
  // v0.13.2：start 期间的重入锁——原来 active 要等 getUserMedia 返回后才置位，
  // 快速双击会起两条 stream/两个 AudioContext，先者被覆盖后永不释放（泄麦克风）
  let starting = false

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
      note.value = noteName(nearest)
      cents.value = Math.round((midi - nearest) * 100)
    } else {
      note.value = '--'
      cents.value = 0
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
  }

  return { active, note, cents, error, start, stop }
}
