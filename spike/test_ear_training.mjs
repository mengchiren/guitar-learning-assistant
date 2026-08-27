// 听力训练纯逻辑校验（v0.16.0，CI 跑）：
// ①随机源可注入时题目序列完全确定（同种子两次生成一致）；②answer 落在选项范围内；
// ③audio 全部是有限正频率；④三种和弦性质均匀出现（统计护栏防隐形偏差）；
// ⑤判分边界正确；⑥未知关卡抛错。
import { LEVELS, makeQuestion, gradeAnswer, optionsOf, QUESTIONS_PER_ROUND } from '../app/src/utils/earTraining.js'

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
function lcg(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}

touch('LEVELS 三关且选项数合理', () => {
  ok(LEVELS.length === 3, `关卡数 ${LEVELS.length}`)
  for (const l of LEVELS) {
    if (!Array.isArray(l.options) || l.options.length < 3 || l.options.length > 6) throw new Error('选项数异常')
    ok(l.name && l.desc && l.why, '文案缺失')
  }
})

touch('同种子两轮生成的 answer 序列完全一致', () => {
  for (const l of LEVELS) {
    const a = Array.from({ length: 30 }, () => makeQuestion(l.id, lcg(123)).answer)
    const b = Array.from({ length: 30 }, () => makeQuestion(l.id, lcg(123)).answer)
    ok(JSON.stringify(a) === JSON.stringify(b), `${l.id} 序列不确定`)
  }
})

touch('answer 始终在选项范围内', () => {
  for (const l of LEVELS) {
    const rs = lcg(7)
    for (let i = 0; i < 60; i++) {
      const q = makeQuestion(l.id, rs)
      ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < l.options.length, `${l.id} answer=${q.answer}`)
      if (q.answer !== undefined && typeof q.answer !== 'number') throw new Error('类型异常')
    }
  }
})

touch('audio 全为有限正频率', () => {
  for (const l of LEVELS) {
    const rs = lcg(11)
    for (let i = 0; i < 40; i++) {
      const q = makeQuestion(l.id, rs)
      ok(q.audio && Array.isArray(q.audio.notes) && q.audio.notes.length >= 1, '缺 notes')
      for (const f of q.audio.notes) ok(Number.isFinite(f) && f > 20 && f < 5000, `非法频率 ${f}`)
    }
  }
})

touch('和弦性质三档均匀出现（统计护栏）', () => {
  const counts = [0, 0, 0]
  const rs = lcg(202)
  const N = 900
  for (let i = 0; i < N; i++) counts[makeQuestion('chordType', rs).answer]++
  for (let k = 0; k < 3; k++) {
    const ratio = counts[k] / N
    ok(ratio > 0.25 && ratio < 0.42, `第 ${k} 档占比 ${ratio.toFixed(2)} 异常`)
  }
})

touch('强力和弦只有两个音、大小和弦三个音', () => {
  const rs = lcg(31)
  for (let i = 0; i < 90; i++) {
    const q = makeQuestion('chordType', rs)
    ok(q.audio.notes.length === (q.answer === 2 ? 2 : 3), `音数与答案不符 (${q.answer})`)
  }
})

touch('判分边界', () => {
  const opts = optionsOf('interval')
  const q = makeQuestion('interval', lcg(99))
  ok(gradeAnswer(q, q.answer) === true, '正确项判错')
  const wrong = (q.answer + 1) % opts.length
  ok(gradeAnswer(q, wrong) === false, '相邻选项应判错')
  ok(gradeAnswer(q, opts.length + 3) === false, '越界下标应判错')
})

touch('未知关卡抛错 / optionsOf 表一致', () => {
  let threw = false
  try {
    makeQuestion('not-exist')
  } catch {
    threw = true
  }
  ok(threw, '未抛错')
  for (const l of LEVELS) ok(optionsOf(l.id).join('|') === l.options.join('|'), 'optionsOf 不一致')
})

touch('每轮题数为常量 10', () => {
  ok(QUESTIONS_PER_ROUND === 10, `值=${QUESTIONS_PER_ROUND}`)
})

console.log(`\n结果：${pass}/${pass + fail} 通过`)
process.exit(fail > 0 ? 1 : 0)
