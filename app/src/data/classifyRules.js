// 套路归类规则表（v0.6.0）：把 analyze.js 里硬编码的 classify 规则抽成数据。
// 新增一种套路：①在 templates.js 加模板；②在下面按顺序加一条规则（数组顺序 = 命中优先级）。
// 字段：conditions 全部满足即命中；margin 用全局 FIELD_MARGINS 归一化算置信度。
// 注意：改这里的规则/阈值后必须重跑 spike/test_frontend_analyze.mjs（真实歌曲对拍 5 首）。

/**
 * @typedef {object} ClassifyRule
 * @property {string} template 命中的套路名（对应 templates.js 的 name）
 * @property {Array<{field: 'bpm'|'rmsDb'|'centroidHz', op: '>='|'>', value: number}>} conditions
 */

export const CLASSIFY_RULES = [
  {
    // 金属 Riff（v0.6.1 新增）：190+ BPM 重型歌，闷音下拨为主。
    // 放在最前：与「失真节奏 Riff」的差别主要在速度与重量（小调暗色歌更常见，但不强判调性）。
    template: '金属 Riff',
    conditions: [
      { field: 'bpm', op: '>=', value: 195 },
      { field: 'rmsDb', op: '>', value: -14 },
    ],
  },
  {
    template: '失真节奏 Riff',
    conditions: [
      { field: 'bpm', op: '>=', value: 140 },
      { field: 'rmsDb', op: '>', value: -14 },
    ],
  },
  {
    template: '失真主音 Solo',
    conditions: [
      { field: 'centroidHz', op: '>', value: 2600 },
      { field: 'rmsDb', op: '>', value: -16 },
    ],
  },
  {
    template: '轻过载节奏',
    conditions: [{ field: 'rmsDb', op: '>', value: -16 }],
  },
  {
    template: '清音+合唱氛围',
    conditions: [
      { field: 'bpm', op: '>=', value: 110 },
      { field: 'centroidHz', op: '>', value: 1500 },
    ],
  },
]

/** 置信度归一化余量分母（与旧 classify 的 normMargin 一致）：余量 = (值-阈值)/分母 */
export const FIELD_MARGINS = {
  bpm: 10,
  rmsDb: 3,
  centroidHz: 500,
}
