// 曲谱/和弦图数据完整性校验：node spike/test_sheets.mjs
// 改 chords.js / songSheets.js / fundamentals.js 任何数据后必须重跑，全部通过才算数。
import { CHORD_CHARTS, findChord } from '../app/src/data/chords.js'
import { SEED_SHEETS } from '../app/src/data/songSheets.js'
import { FUNDAMENTALS } from '../app/src/data/fundamentals.js'
import seedSongs from '../app/src/data/seedSongs.json' with { type: 'json' }

let pass = 0
let fail = 0
function check(name, cond, detail = '') {
  if (cond) {
    pass++
    console.log(`  ✅ ${name}`)
  } else {
    fail++
    console.log(`  ❌ ${name} ${detail}`)
  }
}

// 1. 和弦图库
{
  const names = CHORD_CHARTS.map((c) => c.name)
  check('和弦图库无重名', new Set(names).size === names.length)
  for (const c of CHORD_CHARTS) {
    const maxFret = (c.baseFret || 1) + 4
    check(
      `${c.name} frets 长度 6`,
      c.frets.length === 6,
      `got ${c.frets.length}`,
    )
    check(
      `${c.name} frets 值合法`,
      c.frets.every((f) => f === 'x' || f === 0 || (typeof f === 'number' && f >= (c.baseFret || 1) && f <= maxFret)),
      JSON.stringify(c.frets),
    )
  }
}

// 2. 种子曲谱
{
  const seedIds = new Set(seedSongs.map((s) => s.id))
  for (const [songId, sheet] of Object.entries(SEED_SHEETS)) {
    check(`曲谱 ${songId} 对应种子歌存在`, seedIds.has(songId))
    check(`曲谱 ${songId} 有分段`, (sheet.sections || []).length > 0)
    for (const sec of sheet.sections) {
      check(`曲谱 ${songId} 段「${sec.name}」有和弦`, Boolean(sec.chords && sec.chords.trim()))
      const chords = (sec.chords || '').split(/\s+/).filter(Boolean)
      for (const ch of chords) {
        check(
          `曲谱 ${songId} 和弦 ${ch} 在图库有定义`,
          Boolean(findChord(ch)),
          `请在 chords.js 补充 ${ch}`,
        )
      }
    }
  }
}

// 3. 基本功清单
{
  const ids = FUNDAMENTALS.map((f) => f.id)
  check('基本功无重名 id', new Set(ids).size === ids.length)
  for (const f of FUNDAMENTALS) {
    check(`${f.id} 有任务分解`, (f.tasks || []).length > 0)
    check(`${f.id} 有图示配置`, Boolean(f.visuals && f.visuals.type))
    check(`${f.id} bpm 合法`, typeof f.bpm === 'number' && f.bpm >= 40 && f.bpm <= 220)
    if (f.visuals?.type === 'chords') {
      for (const c of f.visuals.chords) {
        check(`${f.id} 图示和弦 ${c} 在图库有定义`, Boolean(findChord(c)))
      }
    }
    if (f.visuals?.type === 'strum') {
      check(`${f.id} 扫弦图示有 pattern`, (f.visuals.pattern || []).length > 0)
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
