// 分析引擎的 CI 安全测试：纯 JS 合成节拍音（无需 ffmpeg、无需版权音频），
// 每次 push 自动跑，保护 BPM 测速与「慢歌不加倍」逻辑不回归。
// 说明：真实歌曲对拍（test_frontend_analyze.mjs）需要本地版权音频 + ffmpeg，只在本地跑；
// 半速「加倍」分支在合成音上无法稳定触发（引擎阈值按真实音乐校准），由本地对拍覆盖。
//
// 合成原理：每拍一个短促冲击（880Hz 正弦 × 快速衰减包络），4 拍一组加重音（220Hz）。
// 每拍振幅用「缓慢起伏的正弦调制 + 小扰动」（模仿真实演奏的渐强渐弱）——
// 完全均匀的冲击串在自相关上所有周期整数倍 lag 打平，引擎会随意挑一个倍数（实测会测出 1/3 速）。
// 用法: node spike/test_frontend_synthetic.mjs
import { analyzeAudio } from '../app/src/utils/analyze.js'

const SR = 22050
const SECONDS = 30

function synthBeatTrack(bpm, seconds = SECONDS) {
  const n = Math.floor(SR * seconds)
  const samples = new Float32Array(n)
  const beatEvery = (60 / bpm) * SR // 每拍采样数
  const beats = Math.floor(seconds / (60 / bpm))
  // 每拍振幅：慢变正弦 + 小扰动（确定性种子，CI 可复现）
  const amps = []
  let seed = 42
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let i = 0; i < beats; i++) amps.push(0.6 + 0.35 * Math.sin((2 * Math.PI * i) / 8 + 1.0) + 0.05 * rand())

  let beatIndex = 0
  for (let t = 0; t < n; t++) {
    const posInBeat = t % beatEvery
    if (posInBeat < 300) {
      const accented = beatIndex % 4 === 0
      const f = accented ? 220 : 880
      const env = 1 - posInBeat / 300
      samples[t] = Math.sin((2 * Math.PI * f * t) / SR) * env * (accented ? Math.max(amps[beatIndex] ?? 0.8, 0.95) : amps[beatIndex] ?? 0.8)
    }
    if (posInBeat + 1 >= beatEvery) beatIndex++
  }
  return samples
}

// 快歌 180 与中速 120 只断言最终 BPM；慢歌 90 额外断言「不得被误加倍」
const CASES = [
  { name: '快歌 180 BPM', bpm: 180, mustNotDouble: false },
  { name: '真实慢歌 90 BPM（不得误加倍）', bpm: 90, mustNotDouble: true },
  { name: '中速 120 BPM', bpm: 120, mustNotDouble: false },
]

let pass = 0
let fail = 0
for (const c of CASES) {
  const samples = synthBeatTrack(c.bpm)
  const r = analyzeAudio({ samples, sampleRate: SR, debug: true })
  const errPct = (Math.abs(r.tempoUseBpm - c.bpm) / c.bpm) * 100
  const doubleOk = c.mustNotDouble ? !r.tempoDoubled : true
  const ok = errPct <= 3 && doubleOk
  if (ok) pass++
  else fail++
  console.log(
    `[${c.name}] 实测 ${r.tempoUseBpm} BPM（原始 ${r.tempoBpm}，${r.tempoDoubled ? '已加倍' : '未加倍'}）误差 ${errPct.toFixed(1)}% ${ok ? '✓' : '✗'}`,
  )
}

console.log(`\n结果：${pass}/${CASES.length} 项通过（${fail} 项失败）`)
process.exit(fail > 0 ? 1 : 0)
