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

// 套路归类 → 模板 id（对应 app/src/data/templates.js 的 TONE_TEMPLATES；
// v0.8.0 起与 templates.js 的 name 完全一致，含空格——曾因「清音 + 合唱氛围」少空格
// 导致归类命中的歌 findToneTemplate 匹配不到模板，详情页设备建议缺失）
export const TEMPLATE_IDS = {
  清音伴奏: 'clean',
  '清音 + 合唱氛围': 'clean-chorus',
  轻过载节奏: 'light-od',
  '失真节奏 Riff': 'crunch',
  '金属 Riff': 'heavy',
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
function estimateKey(chroma) {  const scores = []
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
    if (n >= 2) out.push(`${seq[i]}x${n}`)
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
 * 节奏稳定度（v0.15.0 录音陪练反馈）。
 * 度量：相邻起音的间隔与「拍格整数倍」的贴合程度——不是把全曲锁死到一条绝对相位线上。
 * 为什么这样设计：①传入的 BPM 本身是参考值（±几个百分点常见、半速判定可能偏一格），
 * 绝对相位拟合会把 BPM 的小误差放大成"越弹越歪"；②漏弹/休止不该记为节奏错误，
 * 但间隔忽长忽短必须被抓出来——整数倍容忍正好表达这两点；③自动尝试半拍/一拍/
 * 两拍细分与 ±4% 速度扫描：均匀八分音符按其自身细分记高分，不强求踩正拍。
 * 返回 null 表示无法评估（音频太短/起音太少/无 BPM）。
 */
function evaluateRhythmStability(envS, frameRate, bpm, durationSec) {
  if (!bpm || bpm <= 0 || durationSec < 8 || envS.length < Math.round(8 * frameRate)) return null

  // 自适应阈值寻峰：全局峰值 15% 以上、严格高于两侧邻居、彼此间隔 ≥120ms（同一
  // 起音被相邻多帧命中的话只留最强帧——拨弦瞬态的谱通量会拖出几十毫秒的回声小峰）
  let gmax = 0
  for (let t = 0; t < envS.length; t++) if (envS[t] > gmax) gmax = envS[t]
  if (gmax <= 0) return null
  const minGap = Math.max(1, Math.round(frameRate * 0.12))
  const peaks = []
  for (let t = 1; t < envS.length - 1; t++) {
    if (envS[t] < gmax * 0.15) continue
    if (envS[t] <= envS[t - 1] || envS[t] < envS[t + 1]) continue
    const last = peaks[peaks.length - 1]
    if (peaks.length && t - last < minGap) {
      if (envS[t] > envS[last]) peaks[peaks.length - 1] = t
      continue
    }
    peaks.push(t)
  }
  if (peaks.length < 5) return null

  // 包络第 i 格对应第 (i+1) 帧与上一帧交界 ≈ (i+1)*HOP；时间分辨率约 ±11.6ms（HOP/sr/2）
  const times = peaks.map((p) => ((p + 1) * HOP) / TARGET_SR)
  const gaps = []
  for (let j = 1; j < times.length; j++) {
    const g = times[j] - times[j - 1]
    if (g >= 0.12) gaps.push(g)
  }
  if (gaps.length < 4) return null

  let best = null
  for (const speedMul of [0.96, 0.98, 1, 1.02, 1.04]) {
    for (const subdiv of [0.5, 1, 2]) {
      const P = ((60 / bpm) * subdiv * speedMul)
      if (P < 0.15 || P > 3) continue
      // 每个间隔与最近整倍数拍的差值：漏掉一拍会落到 2P，同样是合法节拍层级
      const errs = []
      for (const g of gaps) {
        const mul = Math.max(1, Math.round(g / P))
        errs.push(Math.abs(g - mul * P))
      }
      errs.sort((a, b) => a - b)
      const med = errs[Math.floor(errs.length / 2)]
      if (!best || med < best.med) best = { med, P }
    }
  }
  if (!best) return null

  // 命中率：用选出的拍格重算，间隔偏差 ≤ max(90ms, 18% 拍长) 记为贴合
  const tol = Math.min(0.09, 0.18 * best.P)
  let hits = 0
  for (const g of gaps) {
    const mul = Math.max(1, Math.round(g / best.P))
    if (Math.abs(g - mul * best.P) <= tol) hits++
  }

  const devMs = Math.round(best.med * 1000)
  const hitRatePct = Math.round((hits / gaps.length) * 100)
  // 计分透明化：机器级稳定（≈±12ms 内）可得满分；分数 = 满分 − 超出 12ms 的间隔偏差，
  // 再按贴合率加权（0.35 底权保证偶有杂起音不摧毁总分）
  const base = Math.max(0, 100 - Math.max(0, devMs - 12))
  const score = Math.min(100, Math.round(base * (0.35 + 0.65 * (hitRatePct / 100))))
  return { score, medianDevMs: devMs, hitRatePct }
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
  // v0.8.0：帧循环内缓冲复用（原来每帧新建 4 个数组，Worker 里 GC 压力大）；
  // 输出与旧实现完全一致（每个元素都被覆盖写或先 fill(0)）
  const mag = new Float32Array(N_FFT / 2)
  const semi = new Float32Array(SEMI_COUNT)
  const col = new Float32Array(12)
  const chordCol = new Float32Array(12)

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
    semi.fill(0)
    for (let k = 0; k < N_FFT / 2; k++) {
      if (!binInRange[k]) continue
      const energy = mag[k] * mag[k]
      const midiExact = hzToMidi(binFreq[k])
      const m0 = Math.floor(midiExact)
      const frac = midiExact - m0
      if (m0 >= SEMI_MIN && m0 <= SEMI_MAX) semi[m0 - SEMI_MIN] += (1 - frac) * energy
      if (m0 + 1 >= SEMI_MIN && m0 + 1 <= SEMI_MAX) semi[m0 + 1 - SEMI_MIN] += frac * energy
    }
    col.fill(0)
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
        for (let p = 0; p < 12; p++) chordCol[p] = col[p] / norm
        chordCols.set(f, chordCol.slice())
      }
    }
    // v0.8.0：mag 已复用（帧外单数组），这里必须拷贝而非引用赋值——
    // 否则 prevMag 与 mag 指向同一数组，下一帧 flux 计算时 prevMag 已被覆写，谱通量恒 0
    prevMag.set(mag)
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

  // v0.15.0 节奏稳定度：录音陪练反馈用（歌曲分析顺带产出，成本可忽略——包络已就绪）
  const rhythmStability = evaluateRhythmStability(envS, frameRate, tempoUseBpm, durationSec)

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
  if (rhythmStability && rhythmStability.score < 40) notes.push('节奏起伏较大（清音单音/慢练/环境噪音都常见），稳定度分数仅供参考。')
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
    rhythmStability,
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
