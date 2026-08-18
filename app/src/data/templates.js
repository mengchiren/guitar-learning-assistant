// 音色套路模板库（M0 确定的「套路模板 + 歌曲归类」方案的核心数据资产）。
// 参数按 JOYO Jam Buddy 2 + Ibanez GRX40 标注，是「参考起点」，实际弹奏时用耳朵微调。
// M2 起：歌曲分析会把每首歌归类到这里的某个套路。

// 按 id 或 name 查找套路模板。
// seedSongs 的 template 字段存的是 name 且可能带「（待校准）」等括号后缀，
// 统一剥掉全角括号再匹配，不依赖 id 硬匹配。
export function findToneTemplate(nameOrId) {
  const clean = (s) => (s || '').replace(/（.*?）/g, '').trim()
  return TONE_TEMPLATES.find(
    (t) => t.id === nameOrId || t.name === nameOrId || clean(t.name) === clean(nameOrId),
  )
}

export const TONE_TEMPLATES = [
  {
    id: 'clean',
    name: '清音伴奏',
    适用: '民谣感 / 分解和弦',
    示例: '《真的爱你》前奏、《光辉岁月》分解',
    guitar: { pickup: '档位 1~3（琴颈/中间）', volume: '7~8', tone: '6~8 偏亮' },
    amp: { channel: 'Clean 清音', model: '65 Black Nor', gain: 3, eq: { b: 5, m: 5, t: 5 }, mod: '关', delay: '关', reverb: 'Hall 轻（约 3）' },
    说明: '音色旋钮开大偏亮，音量旋钮可稍收。箱模选 65 Black Nor（芬达黑脸清音）。适合弹唱伴奏与分解和弦。',
  },
  {
    id: 'clean-chorus',
    name: '清音 + 合唱氛围',
    适用: 'J-Rock 清音扫弦',
    示例: '动漫歌清音段落、轻音《ふわふわ時間》前奏',
    guitar: { pickup: '档位 1 或 2', volume: '7~8', tone: '5~7' },
    amp: { channel: 'Clean 清音', model: '65 Black Nor', gain: 3, eq: { b: 5, m: 5, t: 5 }, mod: 'Chorus 轻（速度慢）', delay: '关', reverb: 'Hall 中（约 4）' },
    说明: '合唱效果让扫弦有「宽」的感觉，是 J-Rock 清音段落的标配。',
  },
  {
    id: 'light-od',
    name: '轻过载节奏',
    适用: '流行摇滚节奏',
    示例: '《光辉岁月》节奏吉他',
    guitar: { pickup: '档位 4~5', volume: '8~9', tone: '5~6' },
    amp: { channel: 'Rhythm 节奏', model: '65 Black Nor OD', gain: 5, eq: { b: 6, m: 5, t: 5 }, mod: '关', delay: '关', reverb: 'Hall 轻' },
    说明: '介于清音与失真之间，分解和强力和弦都能弹。箱模选 65 Black Nor OD（黑脸+过载推子）。Bass +1 让声音厚一点。',
  },
  {
    id: 'crunch',
    name: '失真节奏 Riff',
    适用: '摇滚 / 金属节奏',
    示例: '《NO, Thank You!》《空の箱》',
    guitar: { pickup: '档位 5（琴桥双线圈）', volume: '8~9', tone: '6~7' },
    amp: { channel: 'Rhythm 节奏', model: 'J800 Lo', gain: 6, eq: { b: 5, m: 5, t: 6 }, mod: '关', delay: '关', reverb: 'Hall 轻' },
    说明: '强力和弦、闷音下拨的主战场。箱模选 J800 Lo（马歇尔 JCM800 低输入），Treble +1 更冲；弹单音旋律时改用 Lead 通道。',
  },
  {
    id: 'heavy',
    name: '金属 Riff',
    适用: '重型摇滚 / 金属节奏',
    示例: '《KiLLKiSS》《Ave Mujica》《ギターと孤独と蒼い惑星》',
    guitar: { pickup: '档位 5（琴桥双线圈）', volume: '9~10', tone: '5~6 偏紧' },
    amp: { channel: 'Rhythm 节奏', model: 'DualRect Red', gain: 7, eq: { b: 6, m: 5, t: 5 }, mod: '关', delay: '关', reverb: 'Hall 轻（约 1）' },
    说明: '闷音下拨是主力，强力和弦快速移动。箱模选 DualRect Red（梅萨双整流红通道，金属标配）。Treble 收一点、低音加一点，闷音更紧实；Gain 7 起步，嫌糊就往下收。先 70~80% 速度练闷音，节奏稳了再加速。',
  },
  {
    id: 'lead',
    name: '失真主音 Solo',
    适用: '主音旋律 / Solo',
    示例: '《星座になれたら》主旋律',
    guitar: { pickup: '档位 5', volume: '8~9', tone: '7~8' },
    amp: { channel: 'Lead 主音', model: 'J800 Hi OD', gain: 7, eq: { b: 5, m: 6, t: 6 }, mod: '关', delay: 'Analog 轻', reverb: 'Hall 中' },
    说明: 'Gain 和 Mid 拉高让单音「站得住」，轻延迟增加空间感。箱模选 J800 Hi OD（马歇尔 JCM800 高输入+推子，主音利器）。',
  },
]
