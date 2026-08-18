// 分析引擎的 Worker 封装：主线程只传数据、收结果，不阻塞 UI。
// Worker 不可用时（极端环境）回退到主线程直调，功能不降级。

import { analyzeAudio } from './analyze.js'

let worker = null
let seq = 0
const pending = new Map()

function ensureWorker() {
  if (worker) return true
  try {
    worker = new Worker(new URL('../workers/analyze.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      const { id, ok, result, error } = e.data || {}
      const p = pending.get(id)
      if (!p) return
      pending.delete(id)
      if (ok) p.resolve(result)
      else p.reject(new Error(error || '分析失败'))
    }
    worker.onerror = () => {
      // Worker 崩溃：清空等待队列并回退主线程（下次调用重建）
      for (const [, p] of pending) p.reject(new Error('分析线程异常'))
      pending.clear()
      try {
        worker.terminate()
      } catch {
        /* ignore */
      }
      worker = null
    }
    return true
  } catch {
    return false
  }
}

/**
 * 在 Worker 里分析音频（samples 会被转移所有权，调用后不可再使用）。
 * @param {{ samples: Float32Array, sampleRate: number, debug?: boolean }} input
 * @returns {Promise<object>} 与 analyzeAudio 相同的分析结果 JSON
 */
export function analyzeInWorker({ samples, sampleRate, debug = false }) {
  if (!ensureWorker()) {
    // 回退：主线程直调（结果一致，只是分析期间 UI 会短暂阻塞）
    return Promise.resolve(analyzeAudio({ samples, sampleRate, debug }))
  }
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    // samples.buffer 转移给 Worker，避免大数组结构化克隆的双份内存
    worker.postMessage({ id, samples, sampleRate, debug }, [samples.buffer])
  })
}
