// PDF 文本层抽取结果 ↔ songSheets 谱面 交叉校验（配套 spike/pdf_sheet_extract.py）。
// 用法：node spike/pdf_compare_sheets.mjs spike/pdf_chords_mengde.json meng-de-chukou
// 校验三件事：①meta（bpm/timeSig/tuning）是否一致；②和弦标注序列折叠后是否逐项一致；
// ③技巧标签只做频次展示——乐谱是段落级印刷、谱面是小节级标注，不做强校验。
// exit code 0=全部通过 / 1=有差异。
import { SEED_SHEETS } from '../app/src/data/songSheets.js'
import fs from 'node:fs'

const [, , jsonPath = 'spike/pdf_chords_mengde.json', sheetId = 'meng-de-chukou'] = process.argv
const ex = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
const sheet = SEED_SHEETS[sheetId]
if (!sheet || !sheet.sections) {
  console.error(`✗ 找不到带 sections 的谱面 ${sheetId}`)
  process.exit(1)
}

let fail = 0
console.log(`# 校验报告：${ex.sourcePdf} ↔ songSheets.${sheetId}\n`)

console.log('## meta')
for (const k of ['bpm', 'timeSig']) {
  const a = sheet.meta?.[k]
  const b = ex.meta?.[k]
  const ok = String(a ?? '') === String(b ?? '')
  console.log(`- ${k}: 谱面=${a} PDF=${b} ${ok ? '✓' : '✗'}`)
  if (!ok) fail++
}
{
  // tuning 允许大小写与前缀差（Standard vs Standard tuning）
  const a = String(sheet.meta?.tuning ?? '').toLowerCase()
  const b = String(ex.meta?.tuning ?? '').toLowerCase()
  const ok = a && b && (a.startsWith(b) || b.startsWith(a))
  console.log(`- tuning: 谱面=${sheet.meta?.tuning} PDF=${ex.meta?.tuning} ${ok ? '✓' : '✗'}`)
  if (!ok) fail++
}

console.log('\n## 和弦标注序列（谱面逐小节 vs PDF 文本层）')
const mine = sheet.sections
  .flatMap((sec) => sec.bars.map((bar) => String(bar.chords ?? '').trim()))
  .filter(Boolean)
  .join(' ')
  .split(/\s+/)
const pdf = ex.chordStream.map((c) => c.t)
console.log('- 谱面:', mine.join(' '))
console.log('- PDF :', pdf.join(' '))
if (mine.length === pdf.length && mine.every((t, i) => t === pdf[i])) {
  console.log(`- 结果：${mine.length} 个和弦标注逐项一致 ✓`)
} else {
  fail++
  console.log(`- 结果：长度 ${mine.length} vs ${pdf.length}，存在差异 ✗`)
  for (let i = 0; i < Math.max(mine.length, pdf.length); i++) {
    if (mine[i] !== pdf[i]) console.log(`  - 第 ${i + 1} 个：谱面=${mine[i] ?? '(空)'} PDF=${pdf[i] ?? '(空)'}`)
  }
}

console.log('\n## 技巧标签频次（仅展示，不强校验）')
console.log(`- PDF: ${JSON.stringify(ex.fxTokenFreq)}（乐谱为段落级印刷）`)
console.log(`- 提示：谱面侧按小节重复标注同一段落标记，两者语义等价但次数天然不同\n`)

process.exit(fail > 0 ? 1 : 0)
