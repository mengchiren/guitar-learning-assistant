// 批量分析 歌曲文件/ 目录下的音频，输出精简结果（BPM/调性/套路）
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { analyzeAudio } from '../app/src/utils/analyze.js'

const FFMPEG = process.argv[2]
const DIR = process.argv[3] || '歌曲文件'
const files = readdirSync(DIR).filter((f) => /\.(mp3|flac|wav)$/i.test(f))
const out = []
for (const f of files) {
  const r = spawnSync(FFMPEG, ['-v','error','-i', `${DIR}/${f}`, '-f','f32le','-ac','1','-ar','22050','pipe:1'], { maxBuffer: 768*1024*1024 })
  if (r.status !== 0) { out.push({ file: f, error: 'decode failed' }); console.log(`${f} DECODE FAIL`); continue }
  const buf = Buffer.from(r.stdout)
  const samples = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4)
  const t0 = Date.now()
  try {
    const res = analyzeAudio({ samples, sampleRate: 22050 })
    const item = {
      file: f,
      durationSec: res.durationSec,
      bpm: res.tempoUseBpm,
      bpmRaw: res.tempoBpm,
      doubled: res.tempoDoubled,
      bpmConf: res.confidence.bpm,
      keyTop: res.keyTop3.slice(0, 2),
      template: res.template,
      rmsDb: res.rmsDb,
    }
    out.push(item)
    console.log(`${f} | ${res.durationSec}s | BPM ${res.tempoUseBpm}(${res.confidence.bpm}${res.tempoDoubled ? ',doubled' : ''}) | ${res.keyTop3[0]?.key ?? '?'} | ${res.template}`)
  } catch (e) {
    out.push({ file: f, error: String(e) })
    console.log(`${f} ERROR ${e}`)
  }
  console.log(`  (${Date.now() - t0}ms)`)
}
import { writeFileSync } from 'node:fs'
writeFileSync('spike/batch_analyze_result.json', JSON.stringify(out, null, 2))
console.log('done', out.length)
