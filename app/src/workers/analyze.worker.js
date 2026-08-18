// 音频分析 Worker：把 analyzeAudio 放到后台线程，避免分析大文件时卡住界面。
// analyzeAudio 是纯函数（无 DOM 依赖），在 Worker 里直接跑。
import { analyzeAudio } from '../utils/analyze.js'

self.onmessage = (e) => {
  const { id, samples, sampleRate, debug } = e.data || {}
  try {
    const result = analyzeAudio({ samples, sampleRate, debug })
    self.postMessage({ id, ok: true, result })
  } catch (err) {
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) })
  }
}
