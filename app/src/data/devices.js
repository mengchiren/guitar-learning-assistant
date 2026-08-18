// 设备参数模板库（v0.6.0 起含「能力描述」）。音色建议会按「当前选中的设备」把套路模板
// 映射为具体旋钮位置。新增设备时在此扩展即可，toneGuide.js 按 params 自动渲染，不改代码。
// 参数以实物面板/说明书核对为准。

/**
 * @typedef {object} DeviceParam 设备可调参数（套路模板字段 → 设备旋钮的映射描述）
 * @property {string} field 模板字段名：guitar 侧取 tpl.guitar[field]；amp 侧取 tpl.amp[field]
 *                            （'eq' 取整个 tpl.amp.eq 对象；eq.b/m/t 取 tpl.amp.eq.b 等）
 * @property {string} label 展示名
 * @property {'pickup'|'button'|'knob'|'gain'|'eq'|'effect'} kind 渲染方式：
 *                           pickup=拾音器拨杆 / button=通道按钮 / knob=旋钮 / gain=带满格 / eq=三段合一 / effect=开关型
 * @property {number} [max] kind 为 gain 时的满格值
 */

/**
 * @typedef {object} Device 设备
 * @property {string} id
 * @property {string} name
 * @property {string[]} keyParams 新手速览优先展示的参数（顺序即展示顺序）
 * @property {DeviceParam[]} params 全部可调参数（顺序即步骤顺序）
 */

/** @type {Device[]} */
export const GUITARS = [
  {
    id: 'ibanez-grx40-lgy',
    name: 'Ibanez GRX40-LGY 复古白',
    pickups: 'HSS：琴桥 Infinity R 双线圈 + 琴颈/中间 Infinity RS 单线圈',
    switchPositions: [
      { pos: 1, label: '琴颈单线圈', use: '清音、柔和旋律' },
      { pos: 2, label: '琴颈 + 中间', use: '清音扫弦、放克' },
      { pos: 3, label: '中间单线圈', use: '清音、布鲁斯' },
      { pos: 4, label: '中间 + 琴桥（并联）', use: '轻过载、Crunch' },
      { pos: 5, label: '琴桥双线圈', use: '失真节奏、主音' },
    ],
    knobs: ['音量', '音色'],
    tips: [
      '音色旋钮开大偏亮、关小偏闷',
      '音量旋钮关小可把失真「清音化」',
      '零基础阶段先熟悉 1、2、5 档就够用',
    ],
    keyParams: ['pickup'],
    params: [
      { field: 'pickup', label: '琴·档位', kind: 'pickup' },
      { field: 'tone', label: '音色旋钮', kind: 'knob' },
    ],
  },
]

/** @type {Device[]} */
export const AMPS = [
  {
    id: 'joyo-jam-buddy-2',
    name: 'JOYO Jam Buddy 2',
    channels: ['Clean 清音', 'Rhythm 节奏', 'Lead 主音'],
    ampModels: ['Clean', 'Blues', 'Funk', 'Rock', 'Metal'], // 共 14 种，以说明书为准
    eq: ['Bass', 'Mid', 'Treble'],
    mods: ['关', 'Chorus', 'Flanger', 'Phaser', 'Tremolo', 'Vibrato'],
    delays: ['关', 'Digital', 'Analog'],
    reverbs: ['关', 'Hall', 'Church'],
    extras: ['30 秒 Looper', '36 种节奏鼓机', '内置调音器', '蓝牙伴奏', 'USB-C 录音/充电'],
    knobs: [
      'Guitar Vol', 'Music Vol', 'Bass/Save', 'Mid/Tune', 'Treble/D.Control',
      'Gain/Quit', 'Reverb/D.Vol', 'Delay/D.Type', 'Mod/D.Speed', 'Amp/Ch.Volume',
    ],
    keyParams: ['channel', 'model', 'gain'],
    params: [
      { field: 'channel', label: '通道', kind: 'button' },
      { field: 'model', label: '箱模', kind: 'knob' },
      { field: 'gain', label: 'Gain', kind: 'gain', max: 10 },
      { field: 'eq', label: 'EQ', kind: 'eq' },
      { field: 'mod', label: 'MOD', kind: 'effect', off: '音箱：MOD 效果保持关', on: '音箱：MOD 开「%s」' },
      { field: 'delay', label: 'Delay', kind: 'effect', off: '音箱：Delay 延迟保持关', on: '音箱：Delay 开「%s」' },
      { field: 'reverb', label: 'Reverb', kind: 'knob', off: '音箱：Reverb 混响保持关', on: '音箱：Reverb 混响开「%s」' },
    ],
  },
]
