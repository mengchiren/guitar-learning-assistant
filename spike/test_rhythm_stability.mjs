// 录音节奏稳定度校验（v0.15.0，CI 跑）：直接喂 analyzeAudio 合成扫弦信号。
// ①90 BPM 稳定四分音符 → 高分；②同速但每次起音 ±120ms 随机抖动 → 分数显著更低、
// 中位偏差更大；③均匀八分音符（半拍细分）→ 细分自适应应给高分；④<8s / 全静音 → null。
// 参考坑 34：纯等幅冲击串会让自相关打平，这里每下发振幅/频率都带固定种子随机扰动。
// 用法: node spike/test_rhythm_stability.mjs
import { analyzeAudio } from '../app/src/utils/analyze.js'

const SR = 22050

function lcg(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}

/** 合成一段「逐拍拨弦」信号：每次起音是 90ms 指数衰减的正弦瞬态 + 少量宽带噪声 */
function makeStrums({ bpm, jitterMs = 0, subdiv = 1, durSec = 14, seed = 42 }) {
  const rnd = lcg(seed)
  const n = Math.floor(durSec * SR)
  const y = new Float32Array(n)
  const stepSec = (60 / bpm) * subdiv // 相邻两次起音的间隔
  const burstLen = Math.round(0.09 * SR)
  for (let t = Math.floor(stepSec * SR); t < n - burstLen - 2; t += Math.floor(stepSec * SR)) {
    const start = Math.max(0, Math.floor(t + ((rnd() * 2 - 1) * jitterMs) / 1000 * SR))
    if (start + burstLen >= n) break
    const amp = 0.45 + rnd() * 0.3
    const f0 = 170 + rnd() * 150
    for (let i = 0; i < burstLen; i++) {
      y[start + i] += amp * Math.exp(-i / (burstLen * 0.22)) * Math.sin((2 * Math.PI * f0 * i) / SR)
      y[start + i] += (rnd() - 0.5) * 0.06 * Math.exp(-i / (burstLen * 0.4))
    }
  }
  return y
}

let pass = 0
let fail = 0
function touch(name, fn) {
  try {
    fn()
    pass++
    console.log(`✓ ${name}`)
  } catch (e) {
    fail++
    console.error(`✗ ${name}: ${e.message}`)
  }
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg || 'fail')
}

const clean = analyzeAudio({ samples: makeStrums({ bpm: 90 }), sampleRate: SR })
const sloppy = analyzeAudio({ samples: makeStrums({ bpm: 90, jitterMs: 120 }), sampleRate: SR })
const eighth = analyzeAudio({ samples: makeStrums({ bpm: 90, subdiv: 0.5 }), sampleRate: SR })
const tooShort = analyzeAudio({ samples: makeStrums({ bpm: 90, durSec: 5 }), sampleRate: SR })
const silent = analyzeAudio({ samples: new Float32Array(SR * 12), sampleRate: SR })

touch('稳定扫弦：高分且平均偏差小', () => {
  const r = clean.rhythmStability
  ok(r, `无结果 ${JSON.stringify(clean.notes)}`)
  ok(r.score >= 70, `分数过低 ${r.score}`)
  ok(r.medianDevMs <= 40, `偏差过大 ${r.medianDevMs}ms`)
})
touch('明显抖动的扫弦：分数显著更低、偏差更大', () => {
  const a = clean.rhythmStability
  const b = sloppy.rhythmStability
  ok(a && b, '有结果缺失')
  ok(b.score <= a.score - 25, `区分度不足：稳 ${a.score} vs 抖 ${b.score}`)
  ok(b.medianDevMs >= a.medianDevMs + 25, `偏差未拉开：${a.medianDevMs} → ${b.medianDevMs}`)
})
touch('均匀八分音符：半拍细分为其记高分（不强求踩正拍）', () => {
  const r = eighth.rhythmStability
  ok(r, '无结果')
  ok(r.score >= 65, `八分音符被误罚 ${r.score}`)
})
touch('过短（<8s）返回 null', () => {
  ok(tooShort.rhythmStability === null, `应为 null，实际 ${JSON.stringify(tooShort.rhythmStability)}`)
})
touch('全静音返回 null（不误报分数）', () => {
  ok(silent.rhythmStability === null, `应为 null，实际 ${JSON.stringify(silent.rhythmStability)}`)
})

console.log(`\n节奏稳定度测试：${pass}/${pass + fail} 通过`)
process.exit(fail > 0 ? 1 : 0)
