// 录音 → BPM 分析：复用歌曲分析引擎（Web Worker 后台跑，不卡 UI）。
// 录音是用户自己弹的（清音电吉他为主），节拍检测有效性不如完整歌曲，
// 结果只作参考并标置信度，用户可手动改。
import { decodeToMono } from './audio.js'
import { analyzeInWorker } from './analyzeWorker.js'

const MAX_ANALYZE_SEC = 180 // 只分析前 3 分钟，保证手机上秒级出结果

export async function analyzeRecordingBlob(blob) {
  try {
    const arrayBuf = await blob.arrayBuffer()
    const { samples, sampleRate } = await decodeToMono(arrayBuf, { maxSeconds: MAX_ANALYZE_SEC })
    const res = await analyzeInWorker({ samples, sampleRate })
    return {
      bpm: Math.round(res.tempoUseBpm),
      confidence: res.confidence.bpm,
      durationSec: res.durationSec,
      notes: res.notes,
    }
  } catch {
    // 解码失败（罕见格式）或音频太短：返回 null，不阻塞保存，BPM 留空让用户手填
    return null
  }
}
