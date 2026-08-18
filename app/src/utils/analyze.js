// 纯函数音频分析引擎（浏览器与 Node 通用，无 DOM 依赖）
// 算法与阈值移植自 spike/analyze.py：BPM（onset 包络自相关 + 半速加倍修正）、
// 帧 RMS/谱质心、K-S 调性模板、三和弦模板、启发式套路归类。
// 差异：spike 用 librosa CQT 算 chroma，此处用 STFT 谱映射 12 音级近似（JS 无 CQT）。
// 已知精度（spike 对拍）：BPM 误差 ≤1.5%；调性 4/5；和弦薄弱，仅作参考。
import { CLASSIFY_RULES, FIELD_MARGINS } from '../data/classifyRules.js'

export const TARGET_SR = 22050
export const HOP = 512
export const N_FFT = 2048

const PITCH = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Krumhansl-Schmuckler 调性模板（与 spike/analyze.py 一致）
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]

// 套路归类 → 模板 id（对应 app/src/data/templates.js 的 TONE_TEMPLATES）
export const TEMPLATE_IDS = {
  清音伴奏: 'clean',
  '清音+合唱氛围': 'clean-chorus',
  轻过载节奏: 'light-od',
  '失真节奏 Riff': 'crunch',
  '失真主音 Solo': 'lead',
}

// chroma 映射的半音范围（约 40Hz~4kHz，midi 27~107）
const SEMI_MIN = 27
const SEMI_MAX = 107
const SEMI_COUNT = SEMI_MAX - SEMI_MIN + 1

const HANN = new Float32Array(N_FFT)
for (let i = 0; i < N_FFT; i++) HANN[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N_FFT - 1))

function resampleLinear(samples, fromRate, toRate) {
  const ratio = fromRate / toRate
  const len = Math.floor(samples.length / ratio)
  const out = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const pos = i * ratio
    const i0 = Math.floor(pos)
    const frac = pos - i0
    const next = i0 + 1 < samples.length ? samples[i0 + 1] : 0
    out[i] = samples[i0] * (1 - frac) + next * frac
  }
  return out
}

// 迭代 radix-2 FFT（原地）
function fft(real, imag) {
  const n = real.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[real[i], real[j]] = [real[j], real[i]]
      ;[imag[i], imag[j]] = [imag[j], imag[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wRe = Math.cos(ang)
    const wIm = Math.sin(ang)
    const half = len >> 1
    for (let i = 0; i < n; i += len) {
      let curRe = 1
      let curIm = 0
      for (let k = 0; k < half; k++) {
        const uRe = real[i + k]
        const uIm = imag[i + k]
        const vRe = real[i + k + half] * curRe - imag[i + k + half] * curIm
        const vIm = real[i + k + half] * curIm + imag[i + k + half] * curRe
        real[i + k] = uRe + vRe
        imag[i + k] = uIm + vIm
        real[i + k + half] = uRe - vRe
        imag[i + k + half] = uIm - vIm
        const nRe = curRe * wRe - curIm * wIm
        curIm = curRe * wIm + curIm * wRe
        curRe = nRe
      }
    }
  }
}

function pearson(a, b) {
  const n = a.length
  let sa = 0
  let sb = 0
  let saa = 0
  let sbb = 0
  let sab = 0
  for (let i = 0; i < n; i++) {
    sa += a[i]
    sb += b[i]
    saa += a[i] * a[i]
    sbb += b[i] * b[i]
    sab += a[i] * b[i]
  }
  const num = n * sab - sa * sb
  const den = Math.sqrt((n * saa - sa * sa) * (n * sbb - sb * sb)) || 1
  return num / den
}

function hzToMidi(f) {
  return 69 + 12 * Math.log2(f / 440)
}

// 谱通量 onset 包络 + 自相关找节奏周期
function estimateTempo(env, frameRate) {
  const minBpm = 60
  const maxBpm = 200
  const minLag = Math.max(1, Math.floor((frameRate * 60) / maxBpm))
  const maxLag = Math.min(env.length - 1, Math.ceil((frameRate * 60) / minBpm))
  if (maxLag < minLag) return { tempo: 0, scores: [], bestLag: minLag }
  let bestLag = minLag
  let bestScore = -1
  const scores = []
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0
    for (let t = lag; t < env.length; t++) s += env[t] * env[t - lag]
    // 按项数归一化：否则短 lag 天然多乘几项，分数随 lag 单调衰减，真峰被淹没
    s /= env.length - lag
    scores.push({ lag, score: s, bpm: (60 * frameRate) / lag })
    if (s > bestScore) {
      bestScore = s
      bestLag = lag
    }
  }
  const tempo = (60 * frameRate) / bestLag
  return { tempo, scores, bestLag }
}

// K-S 模板相关取 Top3（与 spike/analyze.py 的 estimate_key 一致）
// 注意：spike 用 np.roll(MAJ, i)，即 key i 的模板峰值落在音级 i；手写实现要同方向
function estimateKey(chroma) {
  const scores = []
  for (let i = 0; i < 12; i++) {
    const maj = new Float32Array(12)
    const min = new Float32Array(12)
    for (let j = 0; j < 12; j++) {
      maj[j] = MAJ[(j - i + 12) % 12]
      min[j] = MIN[(j - i + 12) % 12]
    }
    scores.push({ key: `${PITCH[i]} 大调`, corr: pearson(chroma, maj) })
    scores.push({ key: `${PITCH[i]} 小调`, corr: pearson(chroma, min) })
  }
  scores.sort((a, b) => b.corr - a.corr)
  return scores.slice(0, 3).map((s) => ({ key: s.key, corr: Math.round(s.corr * 1000) / 1000 }))
}

// 粗略和弦：48 均布窗 × 24 个大小三和弦模板（与 spike 一致）
function roughChords(chordCols, windowIdx) {
  const tmpl = []
  for (let i = 0; i < 12; i++) {
    const maj = new Float32Array(12)
    maj[i] = 1
    maj[(i + 4) % 12] = 0.6
    maj[(i + 7) % 12] = 0.6
    tmpl.push({ name: PITCH[i], t: maj })
    const min = new Float32Array(12)
    min[i] = 1
    min[(i + 3) % 12] = 0.6
    min[(i + 7) % 12] = 0.6
    tmpl.push({ name: `${PITCH[i]}m`, t: min })
  }
  const seq = []
  for (const idx of windowIdx) {
    const col = chordCols.get(idx)
    if (!col) {
      seq.push(null)
      continue
    }
    let best = null
    let bs = -1
    for (const { name, t } of tmpl) {
      let s = 0
      for (let p = 0; p < 12; p++) s += col[p] * t[p]
      if (s > bs) {
        bs = s
        best = name
      }
    }
    seq.push(best)
  }
  const out = []
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] === null) continue
    let n = 1
    while (i + 1 < seq.length && seq[i + 1] === seq[i]) {
      n++
      i++
    }
    if (n >= 2) out.push(n > 1 ? `${seq[i]}x${n}` : seq[i])
  }
  return out.slice(0, 20)
}

// 套路归类（v0.6.0：规则来自 data/classifyRules.js，新增套路只加数据不改引擎；
// 语义与旧硬编码完全一致——按数组顺序首个命中，余量 = (值-阈值)/FIELD_MARGINS）
export function classify({ bpm, rmsDb, centroidHz }) {
  const values = { bpm, rmsDb, centroidHz }
  for (const r of CLASSIFY_RULES) {
    const hit = r.conditions.every((c) => {
      const v = values[c.field]
      return c.op === '>=' ? v >= c.value : v > c.value
    })
    if (hit) {
      let margin = Infinity
      for (const c of r.conditions) {
        const delta = FIELD_MARGINS[c.field] || 1
        margin = Math.min(margin, (values[c.field] - c.value) / delta)
      }
      const confidence = margin < 0.2 ? '低' : margin < 1 ? '中' : '高'
      return { template: r.template, confidence }
    }
  }
  return { template: '清音伴奏', confidence: '中' }
}

/**
 * @typedef {object} Confidence 各指标置信度
 * @property {'高'|'中'|'低'} bpm
 * @property {'高'|'中'|'低'} key
 * @property {'高'|'中'|'低'} template
 * @property {'高'|'中'|'低'} chords
 */

/**
 * @typedef {object} AnalysisResult 分析引擎输出契约（消费方：SongAnalyzeView / recordAnalyze / songs store）
 * @property {number} durationSec 时长（秒）
 * @property {number} tempoBpm 原始测速（未做半速加倍修正）
 * @property {number} tempoUseBpm 最终采用 BPM（含半速加倍修正）
 * @property {boolean} tempoDoubled 是否走了半速加倍
 * @property {number} rmsDb 平均响度（dB）
 * @property {number} centroidHz 平均谱质心（Hz）
 * @property {Array<{key: string, corr: number}>} keyTop3 调性 Top3
 * @property {string[]} chordsRough 粗略和弦序列
 * @property {string} template 套路名（对应 templates.js 的 name）
 * @property {string|null} templateId 套路 id
 * @property {Confidence} confidence
 * @property {string[]} notes 人话提示
 * @property {object} [_debug] debug 模式附加信息（topLags 等）
 */

/**
 * 分析一段音频。
 * @param {{ samples: Float32Array, sampleRate: number, debug?: boolean }} input 单声道 PCM
 * @returns {AnalysisResult} 分析结果 JSON（字段与 spike/analyze.py 对齐 + 置信度）
 */
export function analyzeAudio({ samples, sampleRate, debug = false }) {
  const y = sampleRate === TARGET_SR ? samples : resampleLinear(samples, sampleRate, TARGET_SR)
  const sr = TARGET_SR
  const durationSec = y.length / sr
  const frameRate = sr / HOP

  const nFrames = Math.max(1, Math.floor((y.length - N_FFT) / HOP) + 1)
  const re = new Float32Array(N_FFT)
  const im = new Float32Array(N_FFT)
  let prevMag = new Float32Array(N_FFT / 2)

  // 和弦窗口：48 均布帧（与 spike linspace 一致，astype(int) 截断）
  const nWindows = 48
  const windowIdx = []
  const windowSet = new Set()
  for (let w = 0; w < nWindows; w++) {
    const idx = Math.floor((w * (nFrames - 1)) / (nWindows - 1))
    windowIdx.push(idx)
    windowSet.add(idx)
  }
  const chordCols = new Map()

  const env = new Float32Array(Math.max(1, nFrames - 1))
  const envRms = new Float32Array(Math.max(1, nFrames - 1))
  let rmsSumSq = 0
  let centSum = 0
  const chromaSum = new Float32Array(12)

  // 预计算频点 → 频率/半音号（避免帧循环里重复 log2）
  const binFreq = new Float32Array(N_FFT / 2)
  const binMidi = new Int16Array(N_FFT / 2)
  const binInRange = new Uint8Array(N_FFT / 2)
  let prevFrms = 0
  for (let k = 0; k < N_FFT / 2; k++) {
    const freq = (k * sr) / N_FFT
    binFreq[k] = freq
    binMidi[k] = Math.round(hzToMidi(freq))
    binInRange[k] = binMidi[k] >= SEMI_MIN && binMidi[k] <= SEMI_MAX ? 1 : 0
  }

  for (let f = 0; f < nFrames; f++) {
    const start = f * HOP
    for (let i = 0; i < N_FFT; i++) {
      const v = start + i < y.length ? y[start + i] : 0
      re[i] = v * HANN[i]
      im[i] = 0
    }
    fft(re, im)

    const mag = new Float32Array(N_FFT / 2)
    let flux = 0
    let centW = 0
    let centS = 0
    for (let k = 0; k < N_FFT / 2; k++) {
      const m = Math.sqrt(re[k] * re[k] + im[k] * im[k])
      mag[k] = m
      if (f > 0) flux += Math.max(0, m - prevMag[k])
      centW += binFreq[k] * m
      centS += m
    }
    centSum += centS > 0 ? centW / centS : 0
    if (f > 0) env[f - 1] = flux

    // 帧 RMS（时域，frame 长 2048，与 librosa 默认一致）
    let sq = 0
    for (let i = 0; i < N_FFT; i++) {
      const v = start + i < y.length ? y[start + i] : 0
      sq += v * v
    }
    const frms = Math.sqrt(sq / N_FFT)
    rmsSumSq += frms * frms
    if (f > 0) envRms[f - 1] = Math.max(0, frms - prevFrms)
    prevFrms = frms

    // chroma：能量按半音聚合 + 逐八度归一化（CQT 逐八度等权，避免低频能量碾压高频）
    // 小数 midi 线性插值分配到相邻半音：STFT 低频区 bin 宽（~10.8Hz）与半音宽度相当，
    // 直接取整会把能量抹到错误音级
    const semi = new Float32Array(SEMI_COUNT)
    for (let k = 0; k < N_FFT / 2; k++) {
      if (!binInRange[k]) continue
      const energy = mag[k] * mag[k]
      const midiExact = hzToMidi(binFreq[k])
      const m0 = Math.floor(midiExact)
      const frac = midiExact - m0
      if (m0 >= SEMI_MIN && m0 <= SEMI_MAX) semi[m0 - SEMI_MIN] += (1 - frac) * energy
      if (m0 + 1 >= SEMI_MIN && m0 + 1 <= SEMI_MAX) semi[m0 + 1 - SEMI_MIN] += frac * energy
    }
    const col = new Float32Array(12)
    for (let oStart = SEMI_MIN; oStart <= SEMI_MAX; oStart += 12) {
      const oEnd = Math.min(oStart + 11, SEMI_MAX)
      let oSum = 0
      for (let m = oStart; m <= oEnd; m++) oSum += semi[m - SEMI_MIN]
      if (oSum <= 0) continue
      for (let m = oStart; m <= oEnd; m++) col[m % 12] += semi[m - SEMI_MIN] / oSum
    }
    let colMax = 0
    for (let p = 0; p < 12; p++) if (col[p] > colMax) colMax = col[p]
    if (colMax > 0) {
      for (let p = 0; p < 12; p++) chromaSum[p] += col[p] / colMax
      if (windowSet.has(f)) {
        // 只保存和弦窗口帧的 L2 归一化列，避免整首 chroma 矩阵
        let n2 = 0
        for (let p = 0; p < 12; p++) n2 += col[p] * col[p]
        const norm = Math.sqrt(n2) || 1
        const c = new Float32Array(12)
        for (let p = 0; p < 12; p++) c[p] = col[p] / norm
        chordCols.set(f, c)
      }
    }
    prevMag = mag
  }

  // onset 包络 = 谱通量 + 帧能量差分，各自 max 归一化后相加（能量差分抗镲片高频噪声）
  let fluxMax = 0
  let rmsMax = 0
  for (let t = 0; t < env.length; t++) {
    if (env[t] > fluxMax) fluxMax = env[t]
    if (envRms[t] > rmsMax) rmsMax = envRms[t]
  }
  for (let t = 0; t < env.length; t++) {
    env[t] = (fluxMax > 0 ? env[t] / fluxMax : 0) + (rmsMax > 0 ? envRms[t] / rmsMax : 0)
  }

  // 包络平滑（8 帧滑动均值）
  const envS = new Float32Array(env.length)
  let acc = 0
  for (let t = 0; t < env.length; t++) {
    acc += env[t]
    if (t >= 8) acc -= env[t - 8]
    envS[t] = acc / Math.min(t + 1, 8)
  }

  const { tempo, scores, bestLag } = estimateTempo(envS, frameRate)
  const tempoBpm = Math.round(tempo * 10) / 10
  // 半速判定（节拍强度比较法）：测值 <100 时比较 lag 与 lag/2 的自相关强度。
  // 两者相当 → 快歌的半速测值（真实拍点在 lag/2）→ 加倍；
  // lag 处明显更强 → 真实慢歌，保持原值。
  // 实测比值（lag/2 ÷ lag）：快歌 0.995~1.000，真实慢歌 <0.973，阈值取 0.98 两侧留足余量。
  let tempoDoubled = false
  if (tempoBpm > 0 && tempoBpm < 100) {
    const sc = (lag) => scores.find((x) => x.lag === lag)?.score ?? 0
    const halfLag = Math.floor(bestLag / 2)
    const sFull = sc(bestLag)
    const sHalf = halfLag >= 1 ? sc(halfLag) : 0
    tempoDoubled = sHalf >= sFull * 0.98
  }
  const tempoUseBpm = tempoDoubled ? Math.round(tempoBpm * 20) / 10 : tempoBpm

  const rmsDb = Math.round((20 * Math.log10(Math.sqrt(rmsSumSq / nFrames) + 1e-9)) * 10) / 10
  const centroidHz = Math.round(centSum / nFrames)

  const chromaMean = new Float32Array(12)
  for (let p = 0; p < 12; p++) chromaMean[p] = chromaSum[p] / nFrames
  let n2 = 0
  for (let p = 0; p < 12; p++) n2 += chromaMean[p] * chromaMean[p]
  const norm = Math.sqrt(n2) || 1
  for (let p = 0; p < 12; p++) chromaMean[p] /= norm
  const keyTop3 = estimateKey(chromaMean)

  const chordsRough = roughChords(chordCols, windowIdx)
  const { template, confidence: templateConf } = classify({ bpm: tempoUseBpm, rmsDb, centroidHz })

  // 置信度
  // BPM：前后半段测速一致性（八度折叠后对比）。节奏密集的摇滚 lag 谱近乎平坦，
  // 峰比区分不了置信度；两半段一致才是节奏清晰的可靠信号。
  let bpmConf = '低'
  if (tempoBpm > 0 && envS.length > 60) {
    const half = Math.floor(envS.length / 2)
    const tA = estimateTempo(envS.subarray(0, half), frameRate)
    const tB = estimateTempo(envS.subarray(half), frameRate)
    const fold = (t) => (t > 0 && t < 100 ? t * 2 : t)
    const a = fold(tA.tempo)
    const b = fold(tB.tempo)
    const diff = Math.abs(a - b) / Math.max(a, b)
    bpmConf = diff < 0.03 ? '高' : diff < 0.08 ? '中' : '低'
  }
  if (tempoDoubled && bpmConf === '高') bpmConf = '中' // 半速加倍是规则修正，不标高
  // 真实慢歌（未加倍）也封顶「中」：慢歌测速容易偏（如 3/2 谐波），不给「高」
  if (!tempoDoubled && tempoBpm > 0 && tempoBpm < 100 && bpmConf === '高') bpmConf = '中'
  const keyMargin = keyTop3.length >= 2 ? keyTop3[0].corr - keyTop3[1].corr : 0
  // 阈值按对拍校准：margin 0.15 仍可能选错（雑踏），0.2 以上才标高
  const keyConf = keyMargin >= 0.2 ? '高' : keyMargin >= 0.05 ? '中' : '低'

  const notes = []
  if (tempoDoubled) notes.push('测速低于 100，节拍强度判断为快歌半速测值，已加倍；真实慢歌（<100 BPM）仍可能被误判。')
  if (!tempoDoubled && tempoBpm > 0 && tempoBpm < 100) notes.push('测速低于 100 且判断为真实慢歌（未加倍）。慢歌测速容易偏差，建议对照节拍器或用种子库数值核对。')
  if (durationSec < 30) notes.push('音频不足 30 秒，BPM/调性估计不稳定。')
  if (keyConf === '低') notes.push('调性判据不强（Top2 差距小），建议以种子库或人工确认为准。')
  if (bpmConf === '低') notes.push('前后半段测速不一致或节奏复杂，BPM 仅供参考。')
  notes.push('和弦为粗略估计，准确率有限，仅供练习参考。')

  return {
    durationSec: Math.round(durationSec * 10) / 10,
    tempoBpm,
    tempoUseBpm,
    tempoDoubled,
    rmsDb,
    centroidHz,
    keyTop3,
    chordsRough,
    template,
    templateId: TEMPLATE_IDS[template] || null,
    confidence: { bpm: bpmConf, key: keyConf, template: templateConf, chords: '低' },
    notes,
    ...(debug
      ? {
          _debug: {
            envLen: envS.length,
            topLags: scores.slice().sort((a, b) => b.score - a.score).slice(0, 12),
          },
        }
      : {}),
  }
}
