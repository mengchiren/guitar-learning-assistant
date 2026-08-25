// 曲谱/和弦图数据完整性校验：node spike/test_sheets.mjs
// 改 chords.js / songSheets.js / fundamentals.js 任何数据后必须重跑，全部通过才算数。
import { CHORD_CHARTS, findChord, CHORD_GROUPS } from '../app/src/data/chords.js'
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
  check('和弦图库数量 ≥ 40', CHORD_CHARTS.length >= 40, `got ${CHORD_CHARTS.length}`)
  const validCats = new Set(CHORD_GROUPS.map((g) => g.key))
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
    check(`${c.name} 分组合法`, validCats.has(c.category), c.category)
  }
  // 每组至少 1 个和弦
  for (const g of CHORD_GROUPS) {
    check(
      `分组「${g.label}」有和弦`,
      CHORD_CHARTS.some((c) => c.category === g.key),
    )
  }
}

// 2. 种子曲谱（v0.12.0：兼容旧 chords 字符串与新 bars[] 小节网格格式）
{
  const seedIds = new Set(seedSongs.map((s) => s.id))
  const PATTERN_CHARS = /^[↓↑×〜｜\s]+$/ // 节奏符号词表（SheetScore 图例同源）
  const TECH_VOCAB = new Set(['P.M.', 'let ring', '滑音', '击弦', '勾弦', '推弦', '半推', '全推', '揉弦', '泛音'])
  const chordTok = (s) => (s || '').split(/\s+/).filter(Boolean)
  const checkChords = (prefix, chords) => {
    for (const ch of chords) {
      check(
        `${prefix} 和弦 ${ch} 在图库有定义`,
        Boolean(findChord(ch)),
        `请在 chords.js 补充 ${ch}`,
      )
    }
  }
  const checkPattern = (prefix, pattern) => {
    check(
      `${prefix} 节奏符号合法（↓↑×〜｜）`,
      PATTERN_CHARS.test(pattern || ''),
      JSON.stringify(pattern),
    )
  }
  const checkTechniques = (prefix, techs) => {
    for (const t of techs || []) {
      check(`${prefix} 技巧「${t}」在词表内`, TECH_VOCAB.has(t), t)
    }
  }

  for (const [songId, sheet] of Object.entries(SEED_SHEETS)) {
    check(`曲谱 ${songId} 对应种子歌存在`, seedIds.has(songId))
    check(`曲谱 ${songId} 有分段`, (sheet.sections || []).length > 0)
    // 谱头卡 meta（可选）
    if (sheet.meta) {
      check(`曲谱 ${songId} meta.bpm 合法`, typeof sheet.meta.bpm === 'number' && sheet.meta.bpm >= 20 && sheet.meta.bpm <= 300, JSON.stringify(sheet.meta.bpm))
      check(`曲谱 ${songId} meta.timeSig 合法`, typeof sheet.meta.timeSig === 'string' && /^\d\/\d$/.test(sheet.meta.timeSig), sheet.meta.timeSig)
      check(`曲谱 ${songId} meta.tuning 合法`, typeof sheet.meta.tuning === 'string' && sheet.meta.tuning.length > 0)
      check(`曲谱 ${songId} meta.key 合法`, typeof sheet.meta.key === 'string' && sheet.meta.key.length > 0)
    }
    for (const sec of sheet.sections) {
      const hasBars = Array.isArray(sec.bars)
      check(
        `曲谱 ${songId} 段「${sec.name}」有内容（和弦或小节网格）`,
        hasBars ? sec.bars.length > 0 : Boolean(sec.chords && sec.chords.trim()),
      )
      if (hasBars) {
        sec.bars.forEach((b, i) => {
          checkChords(`曲谱 ${songId} ${sec.name} 第 ${i + 1} 小节`, chordTok(b.chords))
          checkPattern(`曲谱 ${songId} ${sec.name} 第 ${i + 1} 小节`, b.pattern)
          checkTechniques(`曲谱 ${songId} ${sec.name} 第 ${i + 1} 小节`, b.techniques)
        })
      } else {
        checkChords(`曲谱 ${songId} ${sec.name}`, chordTok(sec.chords))
      }
      if (sec.fx) {
        check(`曲谱 ${songId} 段「${sec.name}」fx 非空`, typeof sec.fx === 'string' && sec.fx.length > 0 && sec.fx.length <= 8, sec.fx)
      }
    }
  }

  // 毕业曲（v0.12.0）专项：种子歌条目 + 谱头与 PDF 权威值一致
  const grad = seedSongs.find((s) => s.id === 'meng-de-chukou')
  check('种子歌「梦的出口」存在', Boolean(grad))
  if (grad) {
    check('梦的出口 BPM = 75（课件 PDF 权威值）', grad.bpm === 75, String(grad.bpm))
    check('梦的出口 调性 = G 大调', grad.key === 'G 大调', grad.key)
    check('梦的出口 套路 = 失真主音 Solo', grad.template === '失真主音 Solo', grad.template)
  }
  const gradSheet = SEED_SHEETS['meng-de-chukou']
  check('毕业曲谱存在且带 meta', Boolean(gradSheet?.meta?.bpm === 75 && gradSheet?.meta?.key === 'G 大调'))
  check('毕业曲谱 4 段齐全', (gradSheet?.sections || []).length === 4, String(gradSheet?.sections?.length))
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
