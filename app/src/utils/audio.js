// 音频解码工具：把音频文件统一解码成 22050Hz 单声道 PCM（分析引擎的输入格式）。
// 歌曲分析页与录音对拍共用这一条管线（原先两套重复实现已合并）。

import { TARGET_SR } from './analyze.js'

// 解码后原始 PCM 数据量护栏（手机内存安全线）
const MAX_PCM_BYTES = 300 * 1024 * 1024

export class MemoryLimitError extends Error {
  constructor() {
    super('memory limit')
    this.name = 'MemoryLimitError'
  }
}

/**
 * 把音频文件（arrayBuffer）解码为单声道 PCM。
 * @param {ArrayBuffer} arrayBuf 音频文件字节
 * @param {object} [opts]
 * @param {number} [opts.targetRate=22050] 目标采样率
 * @param {number} [opts.maxSeconds=Infinity] 只保留前 N 秒（录音对拍用，省内存）
 * @returns {Promise<{samples: Float32Array, sampleRate: number}>}
 */
export async function decodeToMono(arrayBuf, { targetRate = TARGET_SR, maxSeconds = Infinity } = {}) {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) throw new Error('Web Audio 不可用')
  const ctx = new AC()
  let audio
  try {
    audio = await ctx.decodeAudioData(arrayBuf)
  } finally {
    ctx.close()
  }
  const pcmBytes = audio.length * audio.numberOfChannels * 4
  if (pcmBytes > MAX_PCM_BYTES) throw new MemoryLimitError()
  // OfflineAudioContext 直接渲染成 22050Hz 单声道：不再持有全采样率双声道的工作副本，峰值内存省约 4 倍
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
