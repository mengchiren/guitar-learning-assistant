// 前端分析引擎（app/src/utils/analyze.js）对拍单测
// 用 ffmpeg 把 spike/songs 真实歌曲解码为 22050Hz 单声道 f32 PCM，喂给 JS 引擎，
// 与 spike/README.md 的权威对拍表（社区数据）比对。
// 用法: node spike/test_frontend_analyze.mjs <ffmpeg路径>
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeAudio } from '../app/src/utils/analyze.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FFMPEG = process.argv[2]
if (!FFMPEG) {
  console.error('用法: node spike/test_frontend_analyze.mjs <ffmpeg路径>')
  process.exit(1)
}

const SONGS_DIR = path.join(__dirname, 'songs')

// 权威值来自 spike/README.md 对拍表；调性允许平行调命中（如 F# 小调 = A 大调平行）
const CASES = [
  { file: '放課後ティータイム - NO, Thank You!.mp3', bpm: 181, keys: ['A 小调'], template: '失真节奏 Riff', tol: 0.03 },
  { file: 'トゲナシトゲアリ - 空の箱 (空箱)(井芹仁菜、河原木桃香).mp3', bpm: 148, keys: ['A 大调', 'F# 小调'], template: '失真节奏 Riff', tol: 0.03 },
  { file: 'Ave Mujica - KiLLKiSS.flac', bpm: 200, keys: ['E 小调'], template: '金属 Riff', tol: 0.03 },
  { file: 'トゲナシトゲアリ - 雑踏、僕らの街 (熙熙攘攘、我们的城市).flac', bpm: 171, keys: ['E 小调'], template: '失真节奏 Riff', tol: 0.03 },
  { file: '結束バンド - 星座になれたら (若能化作星座).flac', bpm: 123, keys: ['G# 大调', 'Ab 大调'], template: '失真主音 Solo', tol: 0.03 },
]

function decode(file) {
  const r = spawnSync(
    FFMPEG,
    ['-v', 'error', '-i', path.join(SONGS_DIR, file), '-f', 'f32le', '-ac', '1', '-ar', '22050', 'pipe:1'],
    { maxBuffer: 512 * 1024 * 1024 },
  )
  if (r.status !== 0) throw new Error(`ffmpeg 解码失败 ${file}: ${r.stderr?.toString()}`)
  const buf = Buffer.from(r.stdout)
  const samples = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4)
  return { samples, sampleRate: 22050 }
}

let pass = 0
let fail = 0
for (const c of CASES) {
  const t0 = Date.now()
  const { samples, sampleRate } = decode(c.file)
  const r = analyzeAudio({ samples, sampleRate, debug: true })
  const ms = Date.now() - t0

  // BPM 峰值比（主峰 vs 排除近邻/倍频程后的次峰）
  const top = r._debug.topLags
  const isNear = (x, y) => Math.abs(x - y) <= 1 || Math.abs(2 * x - y) <= 1 || Math.abs(x - 2 * y) <= 1
  const second = top.find((s) => !isNear(s.lag, top[0].lag))
  const peakRatio = second ? top[0].score / second.score : 0

  const bpmErr = Math.abs(r.tempoUseBpm - c.bpm) / c.bpm
  const bpmOk = bpmErr <= c.tol
  const keyOk = r.keyTop3.some((k) => c.keys.includes(k.key))
  const tplOk = r.template === c.template
  const ok = bpmOk && keyOk && tplOk
  if (ok) pass++
  else fail++

  console.log(`\n=== ${c.file} ===  (${ms}ms, ${r.durationSec}s)`)
  console.log(`  BPM  前端 ${r.tempoUseBpm}（原始 ${r.tempoBpm}） vs 真实 ${c.bpm} → 误差 ${(bpmErr * 100).toFixed(1)}% ${bpmOk ? '✓' : '✗'} [置信度 ${r.confidence.bpm}] 峰值比 ${peakRatio.toFixed(3)}`)
  console.log(`  调性 ${JSON.stringify(r.keyTop3)} → 期望 ${c.keys.join('/')} ${keyOk ? '✓' : '✗'} [置信度 ${r.confidence.key}]`)
  console.log(`  套路 ${r.template} vs ${c.template} ${tplOk ? '✓' : '✗'} [置信度 ${r.confidence.template}]`)
  console.log(`  和弦 ${JSON.stringify(r.chordsRough)}`)
  if (r.notes.length) console.log(`  提示 ${r.notes.join('；')}`)
}

console.log(`\n结果：${pass}/${CASES.length} 首全项通过（${fail} 首有偏差）`)
process.exit(fail > 0 ? 1 : 0)
