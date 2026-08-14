// 设备参数模板库。音色建议会按「当前选中的设备」把套路模板映射为具体旋钮位置。
// 新增设备时在此扩展即可。参数以实物面板/说明书核对为准。

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
  },
]

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
  },
]
