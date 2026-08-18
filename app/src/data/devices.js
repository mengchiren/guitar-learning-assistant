// 设备参数模板库（v0.6.2 起含「面板布局」数据）。
// 音色建议会按「当前选中的设备」把套路模板映射为具体旋钮位置；面板示意图（AmpPanel/GuitarPanel）
// 也由这里的 panel 数据驱动——新设备只需补数据：params（套路字段→旋钮）+ panel（坐标/量程/说明）。
// 参数以实物面板/说明书核对为准；面板图为示意，旋钮相对位置按实物标注。

/**
 * @typedef {object} PanelKnob 面板旋钮
 * @property {string} field 对应套路模板字段（guitar 侧 tpl.guitar[field]；amp 侧 tpl.amp[field]；
 *                           'eq.b/m/t' 取 tpl.amp.eq.*；非套路字段如 guitarVol 只作图解不入套路）
 * @property {string} label 面板印刷标签（如 'Gain / Quit'）
 * @property {number} x
 * @property {number} y 旋钮圆心坐标（面板画布坐标系）
 * @property {'num'|'text'} kind num=数值旋钮（按 min/max 画指针角度）；text=循环选择旋钮（只高亮+显示值）
 * @property {number} [min] kind=num 的最小值
 * @property {number} [max] kind=num 的最大值
 * @property {string} note 这是什么、怎么用（入门页点按显示）
 * @property {string} [tip] 与套路的关系提示（可选）
 */

/**
 * @typedef {object} PanelFoot 面板脚钉
 * @property {string} id 唯一 id（channel 等，套路字段 channel 映射到此）
 * @property {string} label 印刷标签
 * @property {number} x
 * @property {number} y 左上角坐标
 * @property {number} w
 * @property {number} h
 * @property {string} note 说明
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
    keyParams: ['pickup', 'volume'],
    params: [
      { field: 'pickup', label: '琴·档位', kind: 'pickup' },
      { field: 'volume', label: '音量旋钮', kind: 'knob' },
      { field: 'tone', label: '音色旋钮', kind: 'knob' },
    ],
    // 吉他示意图（v0.6.2）：琴身轮廓 + 5 档拨杆 + 音量/音色旋钮
    panel: {
      width: 300,
      height: 420,
      note: '示意图：5 档拾音器拨杆 + 音量/音色旋钮，位置以实物为准',
      switch: { field: 'pickup', x: 118, y: 292, positions: 5 },
      knobs: [
        { field: 'volume', label: '音量', x: 178, y: 332, kind: 'text', note: '吉他总音量。关小可以把失真变「清音化」。' },
        { field: 'tone', label: '音色', x: 146, y: 352, kind: 'text', note: '音色旋钮：开大偏亮、关小偏闷。套路建议里标了大致范围。' },
      ],
    },
  },
]

/** @type {Device[]} */
export const AMPS = [
  {
    id: 'joyo-jam-buddy-2',
    name: 'JOYO Jam Buddy 2',
    channels: ['Clean 清音', 'Rhythm 节奏', 'Lead 主音'],
    // 14 种箱头模拟：按用户实物转轮顺序，名字用标准大小写（od = OD 过载推子版）
    ampModels: [
      '65 Black Nor', '65 Black Nor OD', '65 Black Vib', '65 Black Vib OD',
      'J800 Lo', 'J800 Lo OD', 'J800 Hi', 'J800 Hi OD',
      'DualRect Red', 'DualRect Red OD',
      '5153 EL34', '5153 EL34 OD', '5153 6L6', '5153 6L6 OD',
    ],
    // 箱模中文对照（入门页/面板提示用）
    modelNotes: {
      '65 Black Nor': '芬达 65 黑脸清音（Fender 65 Blackface 类，干净明亮）',
      '65 Black Nor OD': '芬达 65 黑脸 + 过载推子（轻过载/蓝调）',
      '65 Black Vib': '芬达 65 黑脸颤音通道',
      '65 Black Vib OD': '芬达 65 黑脸颤音 + 过载推子',
      'J800 Lo': '马歇尔 JCM800 低输入（经典摇滚失真，crunch 标准）',
      'J800 Lo OD': '马歇尔 JCM800 低输入 + 过载推子',
      'J800 Hi': '马歇尔 JCM800 高输入（增益更大更冲）',
      'J800 Hi OD': '马歇尔 JCM800 高输入 + 过载推子（主音利器）',
      'DualRect Red': '梅萨 双整流 红通道（Mesa Dual Rectifier，金属标配）',
      'DualRect Red OD': '梅萨 双整流 红通道 + 过载推子（更凶）',
      '5153 EL34': 'EVH 5150III（EL34 管，现代金属）',
      '5153 EL34 OD': 'EVH 5150III（EL34）+ 过载推子',
      '5153 6L6': 'EVH 5150III（6L6 管，低频更厚）',
      '5153 6L6 OD': 'EVH 5150III（6L6）+ 过载推子',
    },
    // 双脚钉通道分工（v0.6.3 修正）：
    //   CHANNEL 脚钉 = CLEAN（清音）/ DRIVE（失真）二选一
    //   DRIVE MODE 脚钉 = DRIVE 状态下再选 RHYTHM（节奏）/ LEAD（主音）
    // 模板的 channel 语义值（Clean 清音/Rhythm 节奏/Lead 主音）→ 脚钉操作
    channelMap: {
      'Clean 清音': { channel: 'CLEAN', driveMode: null },
      'Rhythm 节奏': { channel: 'DRIVE', driveMode: 'RHYTHM' },
      'Lead 主音': { channel: 'DRIVE', driveMode: 'LEAD' },
    },
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
    // 顶部面板示意：10 个旋钮一排（左→右按实物），右侧 3 个脚钉。
    // 多功能旋钮（Bass/Save 等）的按压功能写在 note 里——新手最常踩的坑。
    panel: {
      width: 760,
      height: 300,
      note: '示意：旋钮从左到右按实物排列；CHANNEL 脚钉选 CLEAN/DRIVE，DRIVE MODE 脚钉在 DRIVE 下选 RHYTHM/LEAD；多功能旋钮按住触发第二功能（如 Save 保存预设）',
      knobs: [
        { field: 'guitarVol', label: 'Guitar Vol', x: 45, y: 150, kind: 'text', note: '吉他输入音量（接吉他的音量）。' },
        { field: 'musicVol', label: 'Music Vol', x: 115, y: 150, kind: 'text', note: '伴奏/音乐音量（蓝牙放伴奏时用它）。' },
        { field: 'eq.b', label: 'Bass / Save', x: 185, y: 150, kind: 'num', min: 0, max: 10, note: '转动：低音多少（0~10）。按住：保存当前音色为预设。' },
        { field: 'eq.m', label: 'Mid / Tune', x: 255, y: 150, kind: 'num', min: 0, max: 10, note: '转动：中音多少（0~10）。按住：进入内置调音器。' },
        { field: 'eq.t', label: 'Treble / D.Control', x: 325, y: 150, kind: 'num', min: 0, max: 10, note: '转动：高音多少（0~10）。按住：鼓机速度控制。' },
        { field: 'gain', label: 'Gain / Quit', x: 395, y: 150, kind: 'num', min: 0, max: 10, note: '转动：失真增益（0~10），越大越「糊/冲」。按住：退出当前模式。' },
        { field: 'reverb', label: 'Reverb / D.Vol', x: 465, y: 150, kind: 'text', note: '转动：混响类型（关/Hall 厅堂/Church 教堂）。按住：混响音量。' },
        { field: 'delay', label: 'Delay / D.Type', x: 535, y: 150, kind: 'text', note: '转动：延迟类型（关/Digital 数字/Analog 模拟）。按住：延迟音量。' },
        { field: 'mod', label: 'Mod / D.Speed', x: 605, y: 150, kind: 'text', note: '转动：MOD 效果类型（关/Chorus 合唱/Flanger/Phaser/Tremolo/Vibrato）。按住：效果速度。' },
        { field: 'model', label: 'Amp / Ch.Volume', x: 675, y: 150, kind: 'text', note: '转动：循环选择 14 种箱头模拟（65 Black=芬达黑脸清音、J800=马歇尔 JCM800、DualRect=梅萨双整流、5153=EVH 5150III，OD=过载推子版）。按住：通道音量。套路建议里的「箱模」就是转它。' },
      ],
      foots: [
        { id: 'channel', label: 'CHANNEL', x: 190, y: 238, w: 92, h: 36, note: '脚钉：第一步选通道——CLEAN（清音）/ DRIVE（失真）。套路建议会明确告诉你按哪边。' },
        { id: 'driveMode', label: 'DRIVE MODE', x: 310, y: 238, w: 92, h: 36, note: '脚钉：第二步（只在 DRIVE 状态下有效）——RHYTHM（节奏）/ LEAD（主音）。' },
        { id: 'looper', label: 'LOOPER', x: 430, y: 238, w: 92, h: 36, note: '脚钉：30 秒循环录音（Looper），练伴奏/录即兴用。' },
      ],
    },
  },
]
