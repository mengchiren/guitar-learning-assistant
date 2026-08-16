// M3 规则引擎对拍测试：node spike/test_plan_engine.mjs
// 覆盖：默认结构 / 减量 / 增量 / 歌曲优先级 / 同套路推荐 / 基本功轮换。
// 改 planEngine.js 任何规则后必须重跑，全部通过才算数。
import { generatePlan, weekStartOf, shiftDays } from '../app/src/utils/planEngine.js'

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

// 测试锚点：2026-08-16 是周日 → 本周一 = 2026-08-10
const TODAY = '2026-08-16'
const THIS_WEEK = weekStartOf(TODAY)
check('周一起点', THIS_WEEK === '2026-08-10', `got ${THIS_WEEK}`)

const SONGS = [
  { id: 'no-thank-you', title: 'NO, Thank You!', template: '失真节奏 Riff', bpm: 181 },
  { id: 'singing', title: 'Singing!', template: '失真节奏 Riff', bpm: 180 },
  { id: 'sora-no-hako', title: '空の箱', template: '失真节奏 Riff', bpm: 148 },
  { id: 'haruhikage', title: '春日影', template: '清音伴奏', bpm: 97 },
]

function rec(date, minutes = 30) {
  return { date, seconds: minutes * 60, tags: ['基本功'], note: '' }
}
function daysInWeek(start, n) {
  return Array.from({ length: n }, (_, i) => shiftDays(start, i))
}

// 1. 默认结构：无记录、无标记 → normal 模式，10 档 2 项基本功（前两项未达标），30/60 档含歌曲
{
  const p = generatePlan({ records: [], basicsDone: {}, songStatus: {}, songs: SONGS, todayStr: TODAY })
  check('默认模式 normal', p.mode === 'normal', p.mode)
  check('10 档 2 项基本功', p.packs[10].length === 2 && p.packs[10].every((i) => i.kind === 'basic'))
  check('10 档无歌曲', p.packs[10].every((i) => i.kind !== 'song'))
  check('30 档含歌曲', p.packs[30].some((i) => i.kind === 'song'))
  check('60 档含复习', p.packs[60].some((i) => i.kind === 'review'))
  check('未达标基本功优先（爬格子第一）', p.packs[10][0].ref === 'spider', p.packs[10][0].ref)
  check('默认歌曲=种子第 1 首', p.packs[30].find((i) => i.kind === 'song').ref === 'no-thank-you')
  check('歌曲目标含 BPM', p.packs[30].find((i) => i.kind === 'song').goal.includes('181 BPM'))
  check('默认 why 说明', p.packs[30].every((i) => i.why && i.why.length > 0))
}

// 2. 减量：上周只练 2 天 → reduce + 分钟减半
{
  const lastWeekDays = daysInWeek(shiftDays(THIS_WEEK, -7), 2)
  const records = lastWeekDays.map((d) => rec(d))
  const p = generatePlan({ records, basicsDone: {}, songStatus: {}, songs: SONGS, todayStr: TODAY })
  check('上周≤2天 → reduce', p.mode === 'reduce', p.mode)
  check('减量后 30 档歌曲 10 分钟（15→5 步进取整）', p.packs[30].find((i) => i.kind === 'song').minutes <= 10)
  check('减量提示文案', p.tierNote.includes('减半'), p.tierNote)
}

// 3. 增量：连续 3 周达标（本周/上周/前周均 ≥4 天）
{
  const records = []
  for (const ws of [shiftDays(THIS_WEEK, -14), shiftDays(THIS_WEEK, -7), THIS_WEEK]) {
    records.push(...daysInWeek(ws, 4).map((d) => rec(d)))
  }
  const p = generatePlan({ records, basicsDone: {}, songStatus: {}, songs: SONGS, todayStr: TODAY })
  check('连续3周达标 → boost', p.mode === 'boost', p.mode)
  check('增量后 30 档歌曲 ≥15', p.packs[30].find((i) => i.kind === 'song').minutes >= 15)
  check('增量提示文案', p.tierNote.includes('+10%'), p.tierNote)
}

// 4. 歌曲优先级：practicing 优先
{
  const p = generatePlan({
    records: [],
    basicsDone: {},
    songStatus: { haruhikage: { state: 'practicing', date: '2026-08-14' } },
    songs: SONGS,
    todayStr: TODAY,
  })
  check('练习中的歌优先', p.packs[30].find((i) => i.kind === 'song').ref === 'haruhikage')
  check('练习中歌曲 why', p.packs[30].find((i) => i.kind === 'song').why.includes('正在练'))
}

// 5. 同套路推荐：NO, Thank You! 刚掌握 → 推荐同套路下一首未掌握的
{
  const p = generatePlan({
    records: [],
    basicsDone: {},
    songStatus: {
      'no-thank-you': { state: 'mastered', date: '2026-08-15' },
      singing: { state: 'mastered', date: '2026-08-01' },
    },
    songs: SONGS,
    todayStr: TODAY,
  })
  const song = p.packs[30].find((i) => i.kind === 'song')
  check('推荐同套路未掌握（空の箱）', song.ref === 'sora-no-hako', song.ref)
  check('已掌握歌不重复推荐', song.ref !== 'no-thank-you' && song.ref !== 'singing')
  check('推荐 why 说明同套路接续', song.why.includes('同套路'), song.why)
}

// 6. 基本功全部达标 → 按达标日期最久优先复习
{
  const basicsDone = {
    spider: '2026-08-01',
    'chord-switch': '2026-08-02',
    strum: '2026-08-03',
    'mute-down': '2026-08-04',
    'power-move': '2026-08-05',
  }
  const p = generatePlan({ records: [], basicsDone, songStatus: {}, songs: SONGS, todayStr: TODAY })
  check('全达标后第一项=最早达标的爬格子', p.packs[10][0].ref === 'spider')
  check('全达标项 done=true', p.packs[10][0].done === true)
  check('复习 why 文案', p.packs[10][0].why.includes('复习'))
}

// 7. 周日边界：周日起点算本周一（跨年不回归）
{
  const p = generatePlan({ records: [], basicsDone: {}, songStatus: {}, songs: SONGS, todayStr: '2026-01-01' })
  check('元旦周起点=周一', p.week.start === '2025-12-29', p.week.start)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
