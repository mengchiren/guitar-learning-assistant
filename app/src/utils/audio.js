// 音频解码工具：把音频文件统一解码成 22050Hz 单声道 PCM（分析引擎的输入格式）。
// 歌曲分析页与录音对拍共用这一条管线（原先两套重复实现已合并）。
//
// v0.13.2 内存两道防线：
// ①【前移】decodeAudioData 之前按文件类型估算 PCM 上限——原实现先解出全速率
//   双声道再检查，peak 已经发生（低端机直接 OOM），拦不住任何东西；
// ②【降源】浏览器支持 decodeAudioData(buffer, {sampleRate}) 时（探测一次缓存结论），
//   直接请求目标采样率解码，输出 AudioBuffer 只有全速率的约 1/4～1/8；
//   不支持则维持旧的全速率解码 + OfflineAudioContext 重采样路径。

import { TARGET_SR } from './analyze.js'

// 解码后原始 PCM 数据量护栏（手机内存安全线）
const MAX_PCM_BYTES = 300 * 1024 * 1024

// 文件字节 → 解码 float32 PCM 字节的放大倍数上界（按扩展名分档，均含安全余量：
// 例如 FLAC 实测约 1.8~2.6 倍、MP3@320k 约 8.8 倍、低码率 Opus 可到 ~15 倍）
const PRE_DECODE_FACTOR_DEFAULT = 20
const PRE_DECODE_FACTORS = [
  [/\.(wav|wave|aif|aiff)$/, 2.2],
  [/\.flac$/, 3.5],
  [/\.(mp3)$/, 11],
  [/\.(m4a|mp4|aac|alac)$/, 10],
  [/\.(ogg|oga|opus|webm)$/, 18],
]

export class MemoryLimitError extends Error {
  constructor() {
    super('memory limit')
    this.name = 'MemoryLimitError'
  }
}

/**
 * 解码前用文件体积估个上限，超限直接拒绝（在真正吃内存之前）。
 */
export function estimatePcmBytes(arrayBuf, fileName = '') {
  const name = String(fileName || '').toLowerCase()
  let factor = PRE_DECODE_FACTOR_DEFAULT
  for (const [re, f] of PRE_DECODE_FACTORS) {
    if (re.test(name)) {
      factor = f
      break
    }
  }
  return arrayBuf.byteLength * factor
}

// {sampleRate} 选项目前会消耗（detach）传入的 ArrayBuffer，所以能力探测必须用
// 一次性哑缓冲做，不能拿真文件试。结论进程内缓存。
let decodeOptionsOk = null

function makeProbeWav() {
  // 最小合法 PCM WAV：RIFF + fmt(1ch 8000Hz 8bit) + 空 data，浏览器只需认头即可
  const b = new Uint8Array(44)
  const dv = new DataView(b.buffer)
  const put = (off, s) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i))
  }
  put(0, 'RIFF')
  dv.setUint32(4, 36, true)
  put(8, 'WAVEfmt ')
  dv.setUint32(16, 16, true)
  dv.setUint16(20, 1, true) // PCM
  dv.setUint16(22, 1, true) // mono
  dv.setUint32(24, 8000, true)
  dv.setUint32(28, 8000, true) // byteRate
  dv.setUint16(32, 1, true) // blockAlign
  dv.setUint16(34, 8, true) // bitsPerSample
  put(36, 'data')
  dv.setUint32(40, 0, true)
  return b
}

function probeDecodeOptions(ctx) {
  if (decodeOptionsOk !== null) return Promise.resolve(decodeOptionsOk)
  return new Promise((resolve) => {
    try {
      ctx.decodeAudioData(makeProbeWav().buffer, { sampleRate: TARGET_SR }).then(
        (buf) => {
          decodeOptionsOk = !!buf && buf.sampleRate === TARGET_SR
          resolve(decodeOptionsOk)
        },
        () => {
          decodeOptionsOk = false
          resolve(false)
        },
      )
    } catch {
      decodeOptionsOk = false
      resolve(false)
    }
  })
}

async function rawDecode(ctx, arrayBuf, wantRate) {
  if (wantRate && (await probeDecodeOptions(ctx))) {
    try {
      const buf = await ctx.decodeAudioData(arrayBuf, { sampleRate: wantRate })
      if (buf) return buf
    } catch {
      // 个别实现在带选项时偶发失败：buffer 可能已被消费，此处只能向上抛
    }
  }
  return ctx.decodeAudioData(arrayBuf)
}

/**
 * 把音频文件（arrayBuffer）解码为单声道 PCM。
 * @param {ArrayBuffer} arrayBuf 音频文件字节
 * @param {object} [opts]
 * @param {number} [opts.targetRate=22050] 目标采样率
 * @param {number} [opts.maxSeconds=Infinity] 只保留前 N 秒（录音对拍用，省内存）
 * @param {string} [opts.fileName=''] 原始文件名（决定体积估算的分档系数）
 * @returns {Promise<{samples: Float32Array, sampleRate: number}>}
 */
export async function decodeToMono(arrayBuf, { targetRate = TARGET_SR, maxSeconds = Infinity, fileName = '' } = {}) {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) throw new Error('Web Audio 不可用')
  if (estimatePcmBytes(arrayBuf, fileName) > MAX_PCM_BYTES) throw new MemoryLimitError()
  const ctx = new AC()
  let audio
  try {
    audio = await rawDecode(ctx, arrayBuf, targetRate)
  } finally {
    ctx.close()
  }
  const pcmBytes = audio.length * audio.numberOfChannels * 4
  if (pcmBytes > MAX_PCM_BYTES) throw new MemoryLimitError()
  // OfflineAudioContext 直接渲染成 22050Hz 单声道：不再持有全采样率双声道的工作副本
  const maxLen = maxSeconds === Infinity ? Infinity : Math.round(maxSeconds * targetRate)
  const len = Math.max(1, Math.min(Math.ceil((audio.length * targetRate) / audio.sampleRate), maxLen))
  const off = new OfflineAudioContext(1, len, targetRate)
  const src = off.createBufferSource()
  src.buffer = audio
  src.connect(off.destination)
  src.start()
  const rendered = await off.startRendering()
  return { samples: rendered.getChannelData(0), sampleRate: targetRate }
}
