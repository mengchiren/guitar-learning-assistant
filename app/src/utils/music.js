// 音乐通用常量（音名 / 调性选项 / 置信度徽章样式），全工程共用一份。
export const PITCH = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const KEYS = PITCH.flatMap((p) => [`${p} 大调`, `${p} 小调`])

// 置信度徽章：引擎输出的 高/中/低 → CSS class
export const CONF_LABELS = { 高: 'b-high', 中: 'b-mid', 低: 'b-low' }
