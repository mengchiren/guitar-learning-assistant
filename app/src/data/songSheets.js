// 种子曲谱库（分段和弦谱，人工整理的学习笔记，仅个人本地使用）。
// key = 种子歌 id；sections：{ name 段名, chords 和弦进行（空格分隔）, pattern 节奏提示, note 备注 }。
// 原则：宁缺毋滥，不编造——没把握的歌不录入，留「暂无曲谱」由用户自录。
// 谱里出现的每个和弦名必须在 data/chords.js 的图库里有定义（spike/test_sheets.mjs 校验）。
export const SEED_SHEETS = {
  'no-thank-you': {
    source: '种子库和弦数据 + 社区扒谱交叉验证',
    sections: [
      { name: '前奏', chords: 'Am C B', pattern: '失真下拨为主', note: '闷音起步，逐段放开' },
      { name: '主歌', chords: 'Am C G D', pattern: '下 下上 下 下上', note: '每两小节一组循环' },
      { name: '预副歌', chords: 'Am D F C', pattern: '全下拨，力度渐强', note: '' },
      { name: '副歌', chords: 'F G C Am G', pattern: '全下拨，卡农变体走向', note: 'F 用简化按法，先 80% 速度' },
    ],
  },
  'sora-no-hako': {
    source: '按种子库度数进行整理（1/5/1/3m/4），请对照原曲校准',
    sections: [
      { name: '主歌', chords: 'A E A C#m D', pattern: '轻过载节奏', note: 'A 大调平行小调色彩，力度随情绪渐强' },
    ],
  },
}
