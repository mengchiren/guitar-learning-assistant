// 听力训练纯逻辑（v0.16.0，参考 MasterGuitar 的生成式题库 + 渐近难度思路）。
// 纯函数、无 DOM/音频依赖：题目生成与判分可注入随机源做确定性单测
//（spike/test_ear_training.mjs）；音频播放层在视图内用 Web Audio 实现。
//
// 三关难度阶梯贴合吉他学习动线：
//   ①空弦音名 → 直接服务调音；②和弦性质（大/小/强力）→ 直接服务音色套路选择；
//   ③常见音程 → 扒歌旋律的基础。题库程序化生成，无内容资产成本。

/** 三关配置：id / 文案 / 选项。顺序即显示顺序。 */
export const LEVELS = [
  {
    id: 'strings',
    name: '第 1 关 · 空弦音名',
    desc: '听一个拨弦音，判断是哪根空弦',
    why: '六根空弦的固定音高 EADGBE 是调音和所有把位的基准，先认熟它们。',
    options: ['6 弦 E', '5 弦 A', '4 弦 D', '3 弦 G', '2 弦 B', '1 弦 E'],
  },
  {
    id: 'chordType',
    name: '第 2 关 · 和弦性质',
    desc: '听一个扫和弦，判断大 / 小 / 强力',
    why: '清音伴奏大多是大小和弦，失真 Riff 基本都是强力和弦——听出区别直接服务选套路。',
    options: ['大和弦', '小和弦', '强力和弦'],
  },
  {
    id: 'interval',
    name: '第 3 关 · 音程',
    desc: '两个音先后响，判断相差几度',
    why: '级进与跳进是扒歌旋律的核心听力，这六个音程覆盖流行歌九成的用法。',
    options: ['大二度', '小三度', '大三度', '纯四度', '纯五度', '八度'],
  },
]

export const QUESTIONS_PER_ROUND = 10

// 低到高的六根空弦 midi 号：E2 A2 D3 G3 B3 E4
const STRING_MIDI = [40, 45, 50, 55, 59, 64]
const CHORD_KIND_ANSWER = { major: 0, minor: 1, power: 2 }
const INTERVAL_SEMITONES = {
  大二度: 2,
  小三度: 3,
  大三度: 4,
  纯四度: 5,
  纯五度: 7,
  八度: 12,
}

export function midiHz(m) {
  return 440 * Math.pow(2, (m - 69) / 12)
}

/**
 * 生成一道题。
 * @param {string} levelId LEVELS[].id
 * @param {() => number} [rand] 随机源 (0..1)，默认 Math.random；测试注入固定种子保证可复现
 * @returns {{ levelId: string, answer: number, audio: object }}
 *   audio.type: pluck(单音) | strum(三音扫) | twoNote(先后两音)
 */
export function makeQuestion(levelId, rand = Math.random) {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]

  if (levelId === 'strings') {
    const idx = Math.floor(rand() * STRING_MIDI.length)
    return {
      levelId,
      answer: idx,
      audio: { type: 'pluck', notes: [midiHz(STRING_MIDI[idx])] },
    }
  }

  if (levelId === 'chordType') {
    const kind = pick(Object.keys(CHORD_KIND_ANSWER))
    const root = 40 + Math.floor(rand() * 12) // E2 ~ D#3
    let pitches
    if (kind === 'major') pitches = [root, root + 4, root + 7]
    else if (kind === 'minor') pitches = [root, root + 3, root + 7]
    else pitches = [root, root + 7] // 强力和弦只有根音+五度
    return {
      levelId,
      answer: CHORD_KIND_ANSWER[kind],
      audio: { type: 'strum', notes: pitches.map(midiHz) },
    }
  }

  if (levelId === 'interval') {
    const label = pick(LEVELS[2].options)
    const semis = INTERVAL_SEMITONES[label]
    const base = 52 + Math.floor(rand() * 10) // E3 往上一段舒适听感区
    const up = rand() < 0.6 // 多数上行，偶尔下行避免模式化
    const a = up ? base : base + semis
    const b = up ? base + semis : base
    return {
      levelId,
      answer: LEVELS[2].options.indexOf(label),
      audio: { type: 'twoNote', notes: [midiHz(a), midiHz(b)] },
    }
  }

  throw new Error(`未知关卡 ${levelId}`)
}

/** 判分：选项下标是否等于答案 */
export function gradeAnswer(question, optionIdx) {
  return question.answer === optionIdx
}

/** 本关选项表（视图渲染用） */
export function optionsOf(levelId) {
  return LEVELS.find((l) => l.id === levelId)?.options ?? []
}
