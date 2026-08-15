// 分析单个文件（不跑断言），打印完整结果 + lag 谱
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeAudio } from '../app/src/utils/analyze.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FFMPEG = process.argv[2]
const FILE = process.argv[3]
if (!FFMPEG || !FILE) { console.error('用法: node spike/analyze_one.mjs <ffmpeg> <文件名>'); process.exit(1) }

const r = spawnSync(FFMPEG, ['-v','error','-i', path.join(__dirname, 'songs', FILE), '-f','f32le','-ac','1','-ar','22050','pipe:1'], { maxBuffer: 512*1024*1024 })
if (r.status !== 0) { console.error('ffmpeg 解码失败:', r.stderr?.toString()); process.exit(1) }
const buf = Buffer.from(r.stdout)
const samples = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4)

const t0 = Date.now()
const out = analyzeAudio({ samples, sampleRate: 22050, debug: true })
console.log(`分析耗时 ${Date.now() - t0}ms，时长 ${out.durationSec}s`)
console.log(`tempoBpm=${out.tempoBpm} tempoUseBpm=${out.tempoUseBpm} doubled=${out.tempoDoubled}`)
console.log(`rmsDb=${out.rmsDb} centroidHz=${out.centroidHz}`)
console.log(`keyTop3=${JSON.stringify(out.keyTop3)}`)
console.log(`template=${out.template} 置信度=${JSON.stringify(out.confidence)}`)
console.log(`和弦=${JSON.stringify(out.chordsRough)}`)
console.log(`notes=${JSON.stringify(out.notes)}`)
console.log('topLags:')
for (const s of out._debug.topLags.slice(0, 10)) {
  console.log(`  lag=${String(s.lag).padStart(3)} bpm=${s.bpm.toFixed(1).padStart(6)} score=${s.score.toFixed(4)}`)
}
