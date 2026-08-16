// 和弦指法图数据（自绘 SVG 的数据源）。
// frets：6 个值，从 6 弦（低音 E）到 1 弦（高音 e）：'x' 不弹、0 空弦、数字品位。
// baseFret：可选，横按和弦的起始品位（图从该品画起，标在左侧）。
// hint：可选，新手提示。
// category：图库页分组：open 开放 / seventh 七和弦 / suspended 挂留与延伸 / barre 横按 / power 强力和弦 / slash 转位低音。
// 改数据后必须重跑 spike/test_sheets.mjs 校验。
export const CHORD_CHARTS = [
  // ---- 开放和弦 ----
  { name: 'C', frets: ['x', 0, 2, 2, 1, 0], category: 'open' },
  { name: 'D', frets: ['x', 'x', 0, 2, 3, 2], category: 'open' },
  { name: 'E', frets: [0, 2, 2, 1, 0, 0], category: 'open' },
  { name: 'G', frets: [3, 2, 0, 0, 0, 3], category: 'open' },
  { name: 'A', frets: ['x', 0, 2, 2, 2, 0], category: 'open' },
  { name: 'Am', frets: ['x', 0, 2, 2, 1, 0], category: 'open' },
  { name: 'Em', frets: [0, 2, 2, 0, 0, 0], category: 'open' },
  { name: 'Dm', frets: ['x', 'x', 0, 2, 3, 1], category: 'open' },
  { name: 'F', frets: ['x', 'x', 3, 2, 1, 1], category: 'open', hint: '简化按法，不用大横按' },
  // ---- 七和弦 ----
  { name: 'C7', frets: ['x', 3, 2, 3, 1, 0], category: 'seventh' },
  { name: 'G7', frets: [3, 2, 0, 0, 0, 1], category: 'seventh' },
  { name: 'D7', frets: ['x', 'x', 0, 2, 1, 2], category: 'seventh' },
  { name: 'A7', frets: ['x', 0, 2, 0, 2, 0], category: 'seventh' },
  { name: 'E7', frets: [0, 2, 0, 1, 0, 0], category: 'seventh' },
  { name: 'B7', frets: ['x', 2, 1, 2, 0, 2], category: 'seventh' },
  { name: 'Am7', frets: ['x', 0, 2, 0, 1, 0], category: 'seventh' },
  { name: 'Dm7', frets: ['x', 'x', 0, 2, 1, 1], category: 'seventh' },
  { name: 'Em7', frets: [0, 2, 2, 0, 3, 0], category: 'seventh' },
  { name: 'Cmaj7', frets: ['x', 3, 2, 0, 0, 0], category: 'seventh' },
  { name: 'Dmaj7', frets: ['x', 'x', 0, 2, 2, 2], category: 'seventh' },
  { name: 'Amaj7', frets: ['x', 0, 2, 1, 2, 0], category: 'seventh' },
  { name: 'Fmaj7', frets: ['x', 'x', 3, 2, 1, 0], category: 'seventh' },
  // ---- 挂留与延伸和弦 ----
  { name: 'Dsus4', frets: ['x', 'x', 0, 2, 3, 3], category: 'suspended' },
  { name: 'Asus4', frets: ['x', 0, 2, 2, 3, 0], category: 'suspended' },
  { name: 'Esus4', frets: [0, 2, 2, 2, 0, 0], category: 'suspended' },
  { name: 'Asus2', frets: ['x', 0, 2, 2, 0, 0], category: 'suspended' },
  { name: 'Dsus2', frets: ['x', 'x', 0, 2, 3, 0], category: 'suspended' },
  { name: 'Cadd9', frets: ['x', 3, 2, 0, 3, 0], category: 'suspended' },
  // ---- 横按和弦 ----
  { name: 'B', frets: ['x', 2, 4, 4, 4, 2], category: 'barre', hint: '食指横按 2 品' },
  { name: 'Bm', frets: ['x', 2, 4, 4, 3, 2], category: 'barre', hint: '食指横按 2 品' },
  { name: 'Bm7', frets: ['x', 2, 4, 2, 3, 2], category: 'barre', hint: '食指横按 2 品' },
  { name: 'C#m', frets: ['x', 4, 6, 6, 5, 4], baseFret: 4, category: 'barre', hint: '食指横按 4 品' },
  { name: 'F#', frets: [2, 4, 4, 3, 2, 2], baseFret: 2, category: 'barre', hint: '食指横按 2 品' },
  { name: 'F#m', frets: [2, 4, 4, 2, 2, 2], baseFret: 2, category: 'barre', hint: '食指横按 2 品' },
  { name: 'G#m', frets: [4, 6, 6, 4, 4, 4], baseFret: 4, category: 'barre', hint: '食指横按 4 品' },
  { name: 'G#m7', frets: [4, 6, 4, 4, 4, 4], baseFret: 4, category: 'barre', hint: '食指横按 4 品' },
  { name: 'Fm', frets: [1, 3, 3, 1, 1, 1], baseFret: 1, category: 'barre', hint: '食指横按 1 品' },
  { name: 'Bb', frets: ['x', 1, 3, 3, 3, 1], baseFret: 1, category: 'barre', hint: '食指横按 1 品' },
  // ---- 强力和弦（五和弦） ----
  { name: 'E5', frets: [0, 2, 'x', 'x', 'x', 'x'], category: 'power' },
  { name: 'A5', frets: ['x', 0, 2, 'x', 'x', 'x'], category: 'power' },
  { name: 'F5', frets: [1, 3, 'x', 'x', 'x', 'x'], category: 'power' },
  { name: 'G5', frets: [3, 5, 'x', 'x', 'x', 'x'], category: 'power' },
  { name: 'B5', frets: ['x', 2, 4, 'x', 'x', 'x'], category: 'power' },
  { name: 'C5', frets: ['x', 3, 5, 'x', 'x', 'x'], baseFret: 3, category: 'power' },
  { name: 'C#5', frets: ['x', 4, 6, 'x', 'x', 'x'], baseFret: 4, category: 'power' },
  { name: 'D5', frets: ['x', 5, 7, 'x', 'x', 'x'], baseFret: 5, category: 'power' },
  // ---- 扩充：升/降号调常用和弦（v0.4.2 新谱需要）----
  { name: 'Cm', frets: ['x', 3, 5, 5, 4, 3], baseFret: 3, category: 'barre', hint: '食指横按 3 品' },
  { name: 'Eb', frets: ['x', 6, 8, 8, 8, 6], baseFret: 6, category: 'barre', hint: '食指横按 6 品' },
  { name: 'Gm', frets: [3, 5, 5, 3, 3, 3], baseFret: 3, category: 'barre', hint: '食指横按 3 品' },
  { name: 'Ab', frets: [4, 6, 6, 5, 4, 4], baseFret: 4, category: 'barre', hint: '食指横按 4 品' },
  { name: 'Bbm', frets: ['x', 1, 3, 3, 2, 1], baseFret: 1, category: 'barre', hint: '食指横按 1 品' },
  { name: 'Db', frets: ['x', 4, 6, 6, 6, 4], baseFret: 4, category: 'barre', hint: '食指横按 4 品' },
  { name: 'Ebm', frets: ['x', 6, 8, 8, 7, 6], baseFret: 6, category: 'barre', hint: '食指横按 6 品' },
  { name: 'D#m', frets: ['x', 6, 8, 8, 7, 6], baseFret: 6, category: 'barre', hint: '食指横按 6 品' },
  { name: 'Gb', frets: [2, 4, 4, 3, 2, 2], baseFret: 2, category: 'barre', hint: '食指横按 2 品' },
  { name: 'C#', frets: ['x', 4, 6, 6, 6, 4], baseFret: 4, category: 'barre', hint: '食指横按 4 品' },
  { name: 'D#', frets: ['x', 6, 8, 8, 8, 6], baseFret: 6, category: 'barre', hint: '食指横按 6 品' },
  { name: 'A#', frets: ['x', 1, 3, 3, 3, 1], baseFret: 1, category: 'barre', hint: '食指横按 1 品' },
  { name: 'G#', frets: [4, 6, 6, 5, 4, 4], baseFret: 4, category: 'barre', hint: '食指横按 4 品' },
  { name: 'Cm7', frets: ['x', 3, 5, 3, 4, 3], baseFret: 3, category: 'seventh', hint: '食指横按 3 品' },
  { name: 'C#m7', frets: ['x', 4, 6, 4, 5, 4], baseFret: 4, category: 'seventh', hint: '食指横按 4 品' },
  { name: 'D#m7', frets: ['x', 6, 8, 6, 7, 6], baseFret: 6, category: 'seventh', hint: '食指横按 6 品' },
  { name: 'Fm7', frets: [1, 3, 1, 1, 1, 1], baseFret: 1, category: 'seventh', hint: '食指横按 1 品' },
  { name: 'Gm7', frets: [3, 5, 3, 3, 3, 3], baseFret: 3, category: 'seventh', hint: '食指横按 3 品' },
  { name: 'Bbm7', frets: ['x', 1, 3, 1, 2, 1], baseFret: 1, category: 'seventh', hint: '食指横按 1 品' },
  { name: 'Ebm7', frets: ['x', 6, 8, 6, 7, 6], baseFret: 6, category: 'seventh', hint: '食指横按 6 品' },
  { name: 'F#m7', frets: [2, 4, 2, 2, 2, 2], baseFret: 2, category: 'seventh', hint: '食指横按 2 品' },
  { name: 'Dbmaj7', frets: ['x', 4, 6, 5, 6, 4], baseFret: 4, category: 'seventh', hint: '食指横按 4 品' },
  { name: 'Bbmaj7', frets: ['x', 1, 3, 2, 3, 1], baseFret: 1, category: 'seventh', hint: '食指横按 1 品' },
  { name: 'G#7', frets: [4, 6, 4, 5, 4, 4], baseFret: 4, category: 'seventh', hint: '食指横按 4 品' },
  { name: 'A#7', frets: ['x', 1, 3, 1, 3, 1], baseFret: 1, category: 'seventh', hint: '食指横按 1 品' },
  { name: 'Bb7', frets: ['x', 1, 3, 1, 3, 1], baseFret: 1, category: 'seventh', hint: '食指横按 1 品' },
  { name: 'C6', frets: ['x', 3, 5, 5, 5, 5], baseFret: 3, category: 'seventh', hint: '食指横按 3 品' },
  { name: 'Gsus4', frets: [3, 3, 0, 0, 1, 3], category: 'suspended' },
  { name: 'Bsus4', frets: [2, 2, 4, 4, 2, 2], baseFret: 2, category: 'suspended', hint: '食指横按 2 品' },
  { name: 'C#sus4', frets: ['x', 4, 6, 6, 7, 4], baseFret: 4, category: 'suspended', hint: '食指横按 4 品' },
  { name: 'D7sus4', frets: ['x', 'x', 0, 2, 1, 3], category: 'suspended' },
  { name: 'F#5', frets: [2, 4, 'x', 'x', 'x', 'x'], baseFret: 2, category: 'power' },
  { name: 'G#5', frets: [4, 6, 'x', 'x', 'x', 'x'], baseFret: 4, category: 'power' },
// ---- 转位低音和弦 ----
  { name: 'D/F#', frets: [2, 'x', 0, 2, 3, 2], category: 'slash', hint: '低音走 6 弦 2 品（F#）' },
  { name: 'C/G', frets: [3, 3, 2, 0, 1, 0], category: 'slash', hint: '低音走 6 弦 3 品（G）' },
  { name: 'G/B', frets: ['x', 2, 0, 0, 0, 3], category: 'slash', hint: '低音走 5 弦 2 品（B）' },
]

export function findChord(name) {
  return CHORD_CHARTS.find((c) => c.name === name) || null
}

// 图库页分组顺序与标题
export const CHORD_GROUPS = [
  { key: 'open', label: '开放和弦' },
  { key: 'seventh', label: '七和弦' },
  { key: 'suspended', label: '挂留与延伸和弦' },
  { key: 'barre', label: '横按和弦' },
  { key: 'power', label: '强力和弦（五和弦）' },
  { key: 'slash', label: '转位低音和弦' },
]
