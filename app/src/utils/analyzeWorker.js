// 分析引擎的 Worker 封装：主线程只传数据、收结果，不阻塞 UI。
// Worker 不可用时（极端环境）回退到主线程直调，功能不降级。
//
// v0.13.2 自愈：postMessage 不再转移所有权（结构化克隆复制一份）——原来转移后
// samples.buffer 已 detach，Worker 一崩当前分析无法重试，用户被迫重选文件重新解码。
// 现在 Worker 崩溃时重建实例并对在途任务原地重发一次（限一次，防死循环）。

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
      // Worker 崩溃：重建 + 在途任务各重试一次（samples 还在主线程手里，可重发）
      try {
        worker.terminate()
      } catch {
        /* ignore */
      }
      worker = null
      const inflight = [...pending.entries()]
      pending.clear()
      const reborn = ensureWorker()
      for (const [id, p] of inflight) {
        if (reborn && !p.retried) {
          p.retried = true
          pending.set(id, p)
          dispatch(id, p.input)
        } else {
          p.reject(new Error(reborn ? '分析线程异常，请重试' : '分析线程多次异常'))
        }
      }
    }
    return true
  } catch {
    return false
  }
}

function dispatch(id, { samples, sampleRate, debug }) {
  // 结构化克隆（不用转移列表）：克隆一份大数组的瞬时开销换来「崩溃可原地重试」
  worker.postMessage({ id, samples, sampleRate, debug })
}

/**
 * 在 Worker 里分析音频（v0.13.2 起 samples 归主线程所有，不转移所有权）。
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
    const p = { resolve, reject, input: { samples, sampleRate, debug }, retried: false }
    pending.set(id, p)
    dispatch(id, p.input)
  })
}
