// 和弦指法图数据（自绘 SVG 的数据源）。
// frets：6 个值，从 6 弦（低音 E）到 1 弦（高音 e）：'x' 不弹、0 空弦、数字品位。
// baseFret：可选，横按和弦的起始品位（图从该品画起，标在左侧）。
// hint：可选，新手提示。改数据后必须重跑 spike/test_sheets.mjs 校验。
export const CHORD_CHARTS = [
  // 开放和弦
  { name: 'C', frets: ['x', 0, 2, 2, 1, 0] },
  { name: 'D', frets: ['x', 'x', 0, 2, 3, 2] },
  { name: 'E', frets: [0, 2, 2, 1, 0, 0] },
  { name: 'G', frets: [3, 2, 0, 0, 0, 3] },
  { name: 'A', frets: ['x', 0, 2, 2, 2, 0] },
  { name: 'Am', frets: ['x', 0, 2, 2, 1, 0] },
  { name: 'Em', frets: [0, 2, 2, 0, 0, 0] },
  { name: 'Dm', frets: ['x', 'x', 0, 2, 3, 1] },
  { name: 'E7', frets: [0, 2, 0, 1, 0, 0] },
  // 横按和弦
  { name: 'B', frets: ['x', 2, 4, 4, 4, 2], hint: '食指横按 2 品' },
  { name: 'C#m', frets: ['x', 4, 6, 6, 5, 4], baseFret: 4, hint: '食指横按 4 品' },
  { name: 'F', frets: ['x', 'x', 3, 2, 1, 1], hint: '简化按法，不用大横按' },
  { name: 'F#', frets: [2, 4, 4, 3, 2, 2], baseFret: 2, hint: '食指横按 2 品' },
  { name: 'F#m', frets: [2, 4, 4, 2, 2, 2], baseFret: 2, hint: '食指横按 2 品' },
  { name: 'G#m', frets: [4, 6, 6, 4, 4, 4], baseFret: 4, hint: '食指横按 4 品' },
  // 强力和弦（五和弦）
  { name: 'E5', frets: [0, 2, 'x', 'x', 'x', 'x'] },
  { name: 'A5', frets: ['x', 0, 2, 'x', 'x', 'x'] },
  { name: 'F5', frets: [1, 3, 'x', 'x', 'x', 'x'] },
  { name: 'G5', frets: [3, 5, 'x', 'x', 'x', 'x'] },
]

export function findChord(name) {
  return CHORD_CHARTS.find((c) => c.name === name) || null
}
