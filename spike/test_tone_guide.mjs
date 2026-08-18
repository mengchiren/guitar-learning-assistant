// 套路归类规则 + 新手模式设备建议 回归测试（v0.6.0）：
// ①classify 规则数据化后语义必须与旧硬编码完全一致（边界点逐项断言）；
// ②beginnerGuide 设备声明式化后，默认设备（GRX40 + Jam Buddy 2）的输出必须与
//   v0.5.x 硬编码版逐字符一致（基准为 spike/dump_tone_guide.mjs 抓取的旧输出）。
// 用法: node spike/test_tone_guide.mjs
import { classify } from '../app/src/utils/analyze.js'
import { beginnerGuide } from '../app/src/utils/toneGuide.js'
import { TONE_TEMPLATES } from '../app/src/data/templates.js'
import { GUITARS, AMPS } from '../app/src/data/devices.js'

let pass = 0
let fail = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) pass++
  else {
    fail++
    console.log(`✗ ${name}\n  actual:   ${JSON.stringify(actual)}\n  expected: ${JSON.stringify(expected)}`)
  }
}

// ---- 1. classify 规则边界点（与旧硬编码语义一致 + v0.6.1 金属规则） ----
// 规则顺序：金属 Riff(bpm≥195 且 rmsDb>-14) → 失真节奏 Riff(bpm≥140 且 rmsDb>-14)
//          → 失真主音 Solo(cen>2600 且 rmsDb>-16) → 轻过载节奏(rmsDb>-16)
//          → 清音+合唱氛围(bpm≥110 且 cen>1500) → 兜底 清音伴奏/中
// 置信度：余量<0.2 低；<1 中；否则高（余量 = min((值-阈值)/分母)，分母 bpm:10 rmsDb:3 cen:500）
check('classify: 金属 Riff 高置信', classify({ bpm: 205, rmsDb: -10, centroidHz: 2000 }), { template: '金属 Riff', confidence: '高' })
check('classify: 金属边界（bpm 恰好 195，余量 0）', classify({ bpm: 195, rmsDb: -13.5, centroidHz: 2000 }), { template: '金属 Riff', confidence: '低' })
check('classify: 195 以下不命中金属（回落失真 Riff）', classify({ bpm: 194, rmsDb: -10, centroidHz: 2000 }), { template: '失真节奏 Riff', confidence: '高' })
check('classify: 快失真 Riff 高置信', classify({ bpm: 150, rmsDb: -10, centroidHz: 2000 }), { template: '失真节奏 Riff', confidence: '高' })
check('classify: Riff 边界（bpm 恰好 140，余量 0）', classify({ bpm: 140, rmsDb: -13, centroidHz: 2000 }), { template: '失真节奏 Riff', confidence: '低' })
check('classify: Riff 余量不足为低', classify({ bpm: 140, rmsDb: -13.5, centroidHz: 2000 }), { template: '失真节奏 Riff', confidence: '低' })
check('classify: 主音 Solo', classify({ bpm: 100, rmsDb: -15, centroidHz: 3000 }), { template: '失真主音 Solo', confidence: '中' })
check('classify: 轻过载', classify({ bpm: 100, rmsDb: -15, centroidHz: 1000 }), { template: '轻过载节奏', confidence: '中' })
check('classify: 清音+合唱', classify({ bpm: 120, rmsDb: -20, centroidHz: 1600 }), { template: '清音+合唱氛围', confidence: '中' })
check('classify: 兜底清音伴奏', classify({ bpm: 80, rmsDb: -20, centroidHz: 1000 }), { template: '清音伴奏', confidence: '中' })
check('classify: Solo 优先于轻过载（规则顺序）', classify({ bpm: 100, rmsDb: -15, centroidHz: 2700 }), { template: '失真主音 Solo', confidence: '中' })

// ---- 2. beginnerGuide 输出与 v0.5.x 基准逐字符一致 ----
const devices = { guitar: GUITARS[0], amp: AMPS[0] }
const BASELINE = {
  清音伴奏: {
    params: [
      { label: '琴·档位', value: '档位 1~3（琴颈/中间）' },
      { label: '通道', value: 'Clean 清音' },
      { label: '箱模', value: 'Clean' },
      { label: 'Gain', value: '3 / 10' },
    ],
    steps: [
      '琴：拾音器拨杆拨到「档位 1~3（琴颈/中间）」',
      '音箱：按下「Clean 清音」通道按钮',
      '音箱：箱模旋钮转到「Clean」',
      '音箱：Gain 增益旋钮拧到「3」（满格是 10）',
    ],
    fineTune: [
      '琴：音色旋钮拧到「6~8 偏亮」',
      '音箱：EQ 三个旋钮 → 低音 5 · 中音 5 · 高音 5',
      '音箱：MOD 效果保持关',
      '音箱：Delay 延迟保持关',
      '音箱：Reverb 混响开「Hall 轻（约 3）」',
    ],
  },
  '清音 + 合唱氛围': {
    params: [
      { label: '琴·档位', value: '档位 1 或 2' },
      { label: '通道', value: 'Clean 清音' },
      { label: '箱模', value: 'Clean' },
      { label: 'Gain', value: '3 / 10' },
    ],
    steps: [
      '琴：拾音器拨杆拨到「档位 1 或 2」',
      '音箱：按下「Clean 清音」通道按钮',
      '音箱：箱模旋钮转到「Clean」',
      '音箱：Gain 增益旋钮拧到「3」（满格是 10）',
    ],
    fineTune: [
      '琴：音色旋钮拧到「5~7」',
      '音箱：EQ 三个旋钮 → 低音 5 · 中音 5 · 高音 5',
      '音箱：MOD 开「Chorus 轻（速度慢）」',
      '音箱：Delay 延迟保持关',
      '音箱：Reverb 混响开「Hall 中（约 4）」',
    ],
  },
  轻过载节奏: {
    params: [
      { label: '琴·档位', value: '档位 4~5' },
      { label: '通道', value: 'Rhythm 节奏' },
      { label: '箱模', value: 'Blues' },
      { label: 'Gain', value: '5 / 10' },
    ],
    steps: [
      '琴：拾音器拨杆拨到「档位 4~5」',
      '音箱：按下「Rhythm 节奏」通道按钮',
      '音箱：箱模旋钮转到「Blues」',
      '音箱：Gain 增益旋钮拧到「5」（满格是 10）',
    ],
    fineTune: [
      '琴：音色旋钮拧到「5~6」',
      '音箱：EQ 三个旋钮 → 低音 6 · 中音 5 · 高音 5',
      '音箱：MOD 效果保持关',
      '音箱：Delay 延迟保持关',
      '音箱：Reverb 混响开「Hall 轻」',
    ],
  },
  '失真节奏 Riff': {
    params: [
      { label: '琴·档位', value: '档位 5（琴桥双线圈）' },
      { label: '通道', value: 'Rhythm 节奏' },
      { label: '箱模', value: 'Rock' },
      { label: 'Gain', value: '6 / 10' },
    ],
    steps: [
      '琴：拾音器拨杆拨到「档位 5（琴桥双线圈）」',
      '音箱：按下「Rhythm 节奏」通道按钮',
      '音箱：箱模旋钮转到「Rock」',
      '音箱：Gain 增益旋钮拧到「6」（满格是 10）',
    ],
    fineTune: [
      '琴：音色旋钮拧到「6~7」',
      '音箱：EQ 三个旋钮 → 低音 5 · 中音 5 · 高音 6',
      '音箱：MOD 效果保持关',
      '音箱：Delay 延迟保持关',
      '音箱：Reverb 混响开「Hall 轻」',
    ],
  },
}

// 失真主音 Solo 的基准（模板 name 是「失真主音 Solo」）
BASELINE['失真主音 Solo'] = {
  params: [
    { label: '琴·档位', value: '档位 5' },
    { label: '通道', value: 'Lead 主音' },
    { label: '箱模', value: 'Rock' },
    { label: 'Gain', value: '7 / 10' },
  ],
  steps: [
    '琴：拾音器拨杆拨到「档位 5」',
    '音箱：按下「Lead 主音」通道按钮',
    '音箱：箱模旋钮转到「Rock」',
    '音箱：Gain 增益旋钮拧到「7」（满格是 10）',
  ],
  fineTune: [
    '琴：音色旋钮拧到「7~8」',
    '音箱：EQ 三个旋钮 → 低音 5 · 中音 6 · 高音 6',
    '音箱：MOD 效果保持关',
    '音箱：Delay 开「Analog 轻」',
    '音箱：Reverb 混响开「Hall 中」',
  ],
}

// 金属 Riff（v0.6.1 新增）的基准
BASELINE['金属 Riff'] = {
  params: [
    { label: '琴·档位', value: '档位 5（琴桥双线圈）' },
    { label: '通道', value: 'Rhythm 节奏' },
    { label: '箱模', value: 'Metal' },
    { label: 'Gain', value: '7 / 10' },
  ],
  steps: [
    '琴：拾音器拨杆拨到「档位 5（琴桥双线圈）」',
    '音箱：按下「Rhythm 节奏」通道按钮',
    '音箱：箱模旋钮转到「Metal」',
    '音箱：Gain 增益旋钮拧到「7」（满格是 10）',
  ],
  fineTune: [
    '琴：音色旋钮拧到「5~6 偏紧」',
    '音箱：EQ 三个旋钮 → 低音 6 · 中音 5 · 高音 5',
    '音箱：MOD 效果保持关',
    '音箱：Delay 延迟保持关',
    '音箱：Reverb 混响开「Hall 轻（约 1）」',
  ],
}

for (const t of TONE_TEMPLATES) {
  const out = beginnerGuide(t, devices)
  check(`beginnerGuide: ${t.name}`, out, BASELINE[t.name])
}

// ---- 3. 设备缺参数时的降级（模拟一台没有 Delay 的新音箱） ----
const ampNoDelay = { ...devices.amp, params: devices.amp.params.filter((p) => p.field !== 'delay') }
const outNoDelay = beginnerGuide(TONE_TEMPLATES.find((t) => t.id === 'lead'), { ...devices, amp: ampNoDelay })
check('设备无 Delay 时 fineTune 自动跳过', outNoDelay.fineTune.includes('音箱：Delay 延迟保持关'), false)

// ---- 4. 面板数据与套路模板一致性（v0.6.2 图形化配置） ----
const ampPanel = devices.amp.panel
const panelFields = ampPanel.knobs.map((k) => k.field)
check('音箱面板旋钮字段无重复', new Set(panelFields).size, panelFields.length)
check('音箱面板坐标都在画布内', ampPanel.knobs.every((k) => k.x > 30 && k.x < ampPanel.width - 30 && k.y > 110 && k.y < ampPanel.height - 40), true)
check('音箱面板脚钉含 channel', ampPanel.foots.some((f) => f.id === 'channel'), true)
for (const t of TONE_TEMPLATES) {
  check(`套路 ${t.name}：gain/mod/delay/reverb/model 在面板有旋钮`, ['gain', 'mod', 'delay', 'reverb', 'model'].every((f) => panelFields.includes(f)), true)
  check(`套路 ${t.name}：eq 三旋钮齐全`, ['eq.b', 'eq.m', 'eq.t'].every((f) => panelFields.includes(f)), true)
  check(`套路 ${t.name}：channel 在脚钉`, ampPanel.foots.some((f) => f.id === 'channel'), true)
}
check('吉他面板档位 5 个', devices.guitar.panel.switch.positions, 5)
check('吉他面板旋钮字段无重复', new Set(devices.guitar.panel.knobs.map((k) => k.field)).size, devices.guitar.panel.knobs.length)

console.log(`\n结果：${pass}/${pass + fail} 项通过（${fail} 项失败）`)
process.exit(fail > 0 ? 1 : 0)
