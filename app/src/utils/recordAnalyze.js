// 录音 → BPM 分析：复用歌曲分析引擎（analyze.js）。
// 录音是用户自己弹的（清音电吉他为主），节拍检测有效性不如完整歌曲，
// 结果只作参考并标置信度，用户可手动改。
import { analyzeAudio } from './analyze'

const MAX_ANALYZE_SEC = 180 // 只分析前 3 分钟，保证手机上秒级出结果

export async function analyzeRecordingBlob(blob) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  const ctx = new AudioCtx()
  try {
    const buf = await blob.arrayBuffer()
    const audio = await ctx.decodeAudioData(buf)
    const ch = audio.numberOfChannels
    const total = Math.min(audio.length, Math.round(MAX_ANALYZE_SEC * audio.sampleRate))
    // 多声道混合成单声道（与 analyzeAudio 期望一致）
    const mono = new Float32Array(total)
    for (let c = 0; c < ch; c++) {
      const data = audio.getChannelData(c)
      for (let i = 0; i < total; i++) mono[i] += data[i] / ch
    }
    const res = analyzeAudio({ samples: mono, sampleRate: audio.sampleRate })
    return {
      bpm: Math.round(res.tempoUseBpm),
      confidence: res.confidence.bpm,
      durationSec: res.durationSec,
      notes: res.notes,
    }
  } catch {
    // 解码失败（罕见格式）或音频太短：返回 null，不阻塞保存，BPM 留空让用户手填
    return null
  } finally {
    ctx.close()
  }
}
