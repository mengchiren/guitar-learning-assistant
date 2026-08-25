// 种子曲谱库（分段和弦谱，人工整理的学习笔记，仅个人本地使用）。
// key = 种子歌 id；sections：{ name 段名, chords 和弦进行（空格分隔）, pattern 节奏提示, note 备注 }。
// 原则：宁缺毋滥，不编造——没把握的歌不录入，留「暂无曲谱」由用户自录。
// 谱里出现的每个和弦名必须在 data/chords.js 的图库里有定义（spike/test_sheets.mjs 校验）。
export const SEED_SHEETS = {
  'no-thank-you': {
    'source': '种子库和弦数据 + 社区扒谱交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'Am C B',
        'pattern': '失真下拨为主',
        'note': '闷音起步，逐段放开'
      },
{
        'name': '主歌',
        'chords': 'Am C G D',
        'pattern': '下 下上 下 下上',
        'note': '每两小节一组循环'
      },
{
        'name': '预副歌',
        'chords': 'Am D F C',
        'pattern': '全下拨，力度渐强',
        'note': ''
      },
{
        'name': '副歌',
        'chords': 'F G C Am G',
        'pattern': '全下拨，卡农变体走向',
        'note': 'F 用简化按法，先 80% 速度'
      }
    ]
  },
  'sora-no-hako': {
    'source': '按种子库度数进行整理（1/5/1/3m/4），请对照原曲校准',
    'sections': [
{
        'name': '主歌',
        'chords': 'A E A C#m D',
        'pattern': '轻过载节奏',
        'note': 'A 大调平行小调色彩，力度随情绪渐强'
      }
    ]
  },
  'seiza': {
    'source': 'ChordWiki（chordwiki.jpn.org）+ 虫虫钢琴调性交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'Dbmaj7 Cm7 Bm7 Bbm7',
        'pattern': '分解和弦',
        'note': '半音下行 Dbmaj7-Cm7-Bm7-Bbm7 是特征动机'
      },
{
        'name': '主歌',
        'chords': 'Dbmaj7 Bbm7 Cm7 Fm7',
        'pattern': '分解/琶音（清音）',
        'note': 'Ab 大调，BPM 123'
      },
{
        'name': '预副歌',
        'chords': 'Bbm7 Ab Dbmaj7',
        'pattern': '',
        'note': '原谱含 Dm7-5、Eb7 等色彩和弦，可对照原曲校准'
      },
{
        'name': '副歌',
        'chords': 'Dbmaj7 Bbm7 Cm7 Fm7',
        'pattern': '失真扫弦/强力和弦感',
        'note': '第二句 Em7-Ebm7 半音下行'
      },
{
        'name': '尾奏',
        'chords': 'Bbm7 Cm7 Dbmaj7 Bbm7 Ab',
        'pattern': '',
        'note': '结尾解决回 Ab 主和弦'
      }
    ]
  },
  'haruhikage': {
    'source': 'bilibili 和弦谱（CRYCHIC 版）+ 谱站交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'B E',
        'pattern': '6/8 分解和弦',
        'note': '循环 4 遍；原调 B，6/8 拍，BPM 97'
      },
{
        'name': '主歌',
        'chords': 'B E',
        'pattern': '6/8 分解',
        'note': 'B-E 往复；中段出现 B7 属七'
      },
{
        'name': '过渡',
        'chords': 'G#m C#m7 F# B',
        'pattern': '',
        'note': '进副歌前的过渡段'
      },
{
        'name': '副歌',
        'chords': 'B E D#m7 G#m',
        'pattern': '',
        'note': '属七和弦使用较多（E7），忧伤又上扬的色彩来源'
      },
{
        'name': '间奏',
        'chords': 'E7 B',
        'pattern': '',
        'note': 'E7 四小节 + B 四小节，重复两遍'
      }
    ]
  },
  'kuro-no-birthday': {
    'source': 'ChordTube 自动和弦谱（官方 MV），请对照原曲校准',
    'sections': [
{
        'name': '前奏',
        'chords': 'D#m B C#m',
        'pattern': '失真下拨',
        'note': '主 riff 循环；原曲 7 弦吉他，标准调弦简化弹'
      },
{
        'name': '主歌',
        'chords': 'D#m B C# D#m7 B C#',
        'pattern': '失真下拨',
        'note': '前奏 riff 的变体循环'
      },
{
        'name': '预副歌',
        'chords': 'D# B A# D# A#7 B F#',
        'pattern': '',
        'note': '转大调色彩段'
      },
{
        'name': '副歌',
        'chords': 'D# B F# C#sus4',
        'pattern': '失真下拨',
        'note': '副歌核心循环'
      },
{
        'name': '桥段',
        'chords': 'C# D#m C# D#m A# C# G# A# F#',
        'pattern': '',
        'note': '含经过和弦（已简化），请对照原曲校准'
      },
{
        'name': '尾奏',
        'chords': 'D#m B D#m B',
        'pattern': '',
        'note': '回到主 riff 收尾'
      }
    ]
  },
  'ave-mujica': {
    'source': 'ChordTube + ChordU 交叉验证，请对照原曲校准',
    'sections': [
{
        'name': '主歌',
        'chords': 'Gm Eb Gm Eb',
        'pattern': '失真下拨',
        'note': '两源一致；原曲 Drop A 调弦，标准调弦弹和弦即可'
      },
{
        'name': '副歌',
        'chords': 'G C Am D G D Bb G',
        'pattern': '',
        'note': '尾段 G 大调循环，段落划分请对照原曲'
      },
{
        'name': '桥段',
        'chords': 'Gm G7 Cm Am D D7',
        'pattern': '',
        'note': '副歌前的推进段（原谱有色彩和弦，已简化）'
      }
    ]
  },
  'sora-no-musica': {
    'source': 'ChordTube 自动和弦谱（官方 MV），请对照原曲校准',
    'sections': [
{
        'name': '前奏',
        'chords': 'Bb Dm C Dm C F',
        'pattern': '',
        'note': 'F 大调感；BPM 待校准'
      },
{
        'name': '主歌',
        'chords': 'Bb C Dm F Bb C D F',
        'pattern': '',
        'note': '原谱 maj7/11 和弦已简化为基本和弦'
      },
{
        'name': '副歌',
        'chords': 'Bb C Dm7 Bb C Dm',
        'pattern': '',
        'note': '核心 Bb-C-Dm 循环'
      },
{
        'name': '桥段',
        'chords': 'F C Dm C Bb C F',
        'pattern': '',
        'note': '回前奏材料的过渡段'
      }
    ]
  },
  'kao': {
    'source': 'ChordTube 全曲版+TV 版交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'Bm E Bm7 E7 A G D B Em',
        'pattern': '',
        'note': 'E 小调，BPM 144 与官方一致'
      },
{
        'name': '主歌',
        'chords': 'Bm E Bm7 E7',
        'pattern': '',
        'note': '核心循环'
      },
{
        'name': '预副歌',
        'chords': 'Em Bm C Bm C Em7',
        'pattern': '',
        'note': ''
      },
{
        'name': '副歌',
        'chords': 'Em C G B',
        'pattern': '失真下拨',
        'note': '循环 4 遍，两版一致'
      },
{
        'name': '桥段',
        'chords': 'Em A F#m Bm E F#m E F#m Bm7',
        'pattern': '',
        'note': '含经过和弦（已简化）'
      },
{
        'name': '尾奏',
        'chords': 'Em B Em7 B7 Em D B E B Em',
        'pattern': '',
        'note': '原曲 7 弦吉他，标准调弦简化'
      }
    ]
  },
  'fuwa-fuwa-time': {
    'source': 'Ultimate Guitar 和弦谱（E 调）+ 吉他社 GTP 总谱交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'E A B',
        'pattern': '失真吉他 riff，8 分下拨',
        'note': '循环 4 遍；标准调弦无变调夹'
      },
{
        'name': '主歌',
        'chords': 'E A E C#m A B',
        'pattern': '节奏吉他扫弦',
        'note': '注意低音下行 E/D#、A/G#、B/A；段尾 Esus4 接 E'
      },
{
        'name': '预副歌',
        'chords': 'B A B C#m A Bm',
        'pattern': '先抑后扬，渐强',
        'note': 'C#/C 半音过渡可简化；Bm 为借用和弦'
      },
{
        'name': '副歌',
        'chords': 'E A B',
        'pattern': '8 分下拨，强拍重音',
        'note': '循环 4 遍，与主 riff 同型'
      },
{
        'name': '间奏',
        'chords': 'E A B',
        'pattern': '吉他 solo + 鼓打点',
        'note': ''
      },
{
        'name': '尾奏',
        'chords': 'E A B',
        'pattern': '同副歌循环渐弱',
        'note': 'BPM 180 较快，先降速练习'
      }
    ]
  },
  'tenshi-ni-fureta-yo': {
    'source': 'Ultimate Guitar 和弦谱（22 票，夹 3 品 G 调指法）+ 虫虫钢琴交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'G D Em D C D',
        'pattern': '分解和弦/轻扫',
        'note': '变调夹 3 品按 G 调指法，实际调 Bb 大调'
      },
{
        'name': '主歌',
        'chords': 'G D B7 Em D C D',
        'pattern': '弹唱扫弦',
        'note': '循环两遍；第三遍上行进入副歌'
      },
{
        'name': '副歌',
        'chords': 'G D Em D C D B7 Em Am7 D',
        'pattern': '扫弦加重',
        'note': 'B7 为副属和弦'
      },
{
        'name': '桥段',
        'chords': 'C D B7 Em D C G Am7 G Am7 B7 D',
        'pattern': '转调色彩段落',
        'note': 'B7 副属和弦可弹 B 简化'
      },
{
        'name': '尾奏',
        'chords': 'G D Em D C D G',
        'pattern': '渐弱收尾',
        'note': 'BPM 待校准（约 155，社区谱记 100~117 疑似半速）'
      }
    ]
  },
  'u-and-i': {
    'source': 'ChordWiki 和弦谱（G 调）+ 引擎分析交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'G Bm7 Cadd9 D7sus4',
        'pattern': '分解和弦引入',
        'note': '两遍，句尾低音下行'
      },
{
        'name': '主歌',
        'chords': 'G Bm7 Cadd9 D7sus4',
        'pattern': '弹唱 4/4',
        'note': 'G 调无变调夹'
      },
{
        'name': '预副歌',
        'chords': 'Cadd9 D C G',
        'pattern': '渐强',
        'note': '原谱转位和弦已简化'
      },
{
        'name': '副歌',
        'chords': 'G D Em7 D Cadd9 G7 C6 D',
        'pattern': '全奏扫弦，最响段落',
        'note': 'C#m7-5 经过和弦可省略；BPM 215 极快，先降速'
      }
    ]
  },
  'kage-mai': {
    'source': 'ChordU 自动和弦检测（单源），请对照原曲校准',
    'sections': [
{
        'name': '前奏',
        'chords': 'Gb Ab Bbm',
        'pattern': '切分节奏',
        'note': '自动检测仅供参考，个别和弦需耳校'
      },
{
        'name': '主歌',
        'chords': 'Gb Ab Fm Bbm',
        'pattern': '8 分切分',
        'note': 'Bbm 小调色彩'
      },
{
        'name': '副歌',
        'chords': 'Gb Ab Bbm Gb Ab Fm Bbm',
        'pattern': '强力和弦重音',
        'note': '与主歌同型进行'
      },
{
        'name': '桥段',
        'chords': 'B Db Ebm Bbm',
        'pattern': '',
        'note': '借用和弦标注存疑，弹前务必耳校'
      }
    ]
  },
  'utagoe-no-kizuna': {
    'source': '官方乐队总谱书读谱说明（bilibili 专栏翻译）',
    'sections': [
{
        'name': '前奏',
        'chords': 'Dm7 Bb',
        'pattern': '6/8 拍，琶音分解，4 小节循环',
        'note': '官谱注解：Dm7 到 Bb 的连接（食指预按横按）；曲调 F 大调'
      },
{
        'name': '主歌',
        'chords': 'F',
        'pattern': '4/4 拍，按和弦名琶音 + 和弦切割',
        'note': '官谱标注 F 处为 Fadd9；该段其余和弦未公布，请勿整段套用'
      }
    ],
    'note_extra': '全曲 6/8(73) 到 4/4(190) 到 6/8 变速；副歌为全切分和弦切割，官谱未给出副歌和弦名'
  },
  'hitoshizuku-sora': {
    'source': 'ChordU + 官方乐队总谱书读谱说明 + 虫虫钢琴交叉验证',
    'sections': [
{
        'name': '副歌',
        'chords': 'Gb Db Ebm Bbm B Bb Ab Bbm Gb Db',
        'pattern': '2-beat 节奏（琶音 + 八度切割）',
        'note': '按歌词断句：Gb Db Ebm Bbm / B Bb Ab Bbm / 句尾回落 Gb Db；调性 Gb 大调（=F#），BPM 204'
      }
    ],
    'note_extra': '官谱 BPM 204；主歌/预副歌完整循环未找到可靠谱面，宁缺毋滥只录副歌'
  },
  'distortion': {
    'source': 'Chordify 两页面一致 + 官方乐队总谱书读谱说明',
    'sections': [
{
        'name': '副歌（F# 大调段落）',
        'chords': 'B F# G#m C#',
        'pattern': '8 拍摇滚切割',
        'note': '单线闷音用右手琴桥闷音；官谱 BPM 176；A 大调段落的和弦名未找到可靠谱面'
      }
    ],
    'note_extra': '官谱：全曲 A 大调与 F# 大调交替；G 段为吉他 solo'
  },
  'guitar-loneliness': {
    'source': 'Hooktheory + 吉他社双吉他谱 + 哔哩简谱分析交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'F#m E A E',
        'pattern': '16 分失真下拨 riff',
        'note': '原调 F# 小调；可夹 2 品用 Em D A 指型弹'
      },
{
        'name': '主歌',
        'chords': 'F#m E A E F#m',
        'pattern': '',
        'note': '与前奏同循环'
      },
{
        'name': '预副歌/副歌',
        'chords': 'Dsus2 C#m7 F#m Asus2',
        'pattern': '8 分强力和弦扫弦',
        'note': '简化可按 D C#m7 F#m A'
      },
{
        'name': '桥段（升调尾副歌）',
        'chords': 'Gm7 F Bb D7',
        'pattern': '',
        'note': '末段副歌整体升半音'
      }
    ]
  },
  'kara-kara': {
    'source': 'Ultimate Guitar 全曲谱 + Hooktheory 交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'C#m A C#m D',
        'pattern': '数学摇滚切分 riff',
        'note': '原谱为 C#m9/A11 等 9 和弦，已简化'
      },
{
        'name': '主歌',
        'chords': 'Asus2 G#m7 F#m7 C#m7',
        'pattern': '',
        'note': '循环 4 遍'
      },
{
        'name': '预副歌',
        'chords': 'Asus2 G#m7 F#m7 E F#m G#m Asus2',
        'pattern': '',
        'note': ''
      },
{
        'name': '副歌',
        'chords': 'Asus2 Bsus4 G#m7 G#7 C#m7 B',
        'pattern': '',
        'note': 'G#7 为 C#m 次属；每遍前有 N.C 喊声'
      },
{
        'name': '桥段',
        'chords': 'Asus2 G#m7 F#m7 E F#m G#m Asus2',
        'pattern': '',
        'note': '与预副歌同进行'
      },
{
        'name': '间奏',
        'chords': 'F#5 G#5 A5 B5',
        'pattern': '五和弦 riff',
        'note': ''
      },
{
        'name': '尾奏',
        'chords': 'Amaj7',
        'pattern': '',
        'note': 'E 大调；BPM 190 含 5/4、6/4 变拍'
      }
    ]
  },
  'seishun-complex': {
    'source': 'Songsterr + Hooktheory + Chordify 交叉验证',
    'sections': [
{
        'name': '前奏',
        'chords': 'Bbmaj7 A7 Dm Dm7',
        'pattern': '失真 8 分下拨',
        'note': '调性 D 小调；简谱版夹 3 品按 G 调'
      },
{
        'name': '副歌',
        'chords': 'Bb7 A7 Dm Gm7 A7',
        'pattern': '',
        'note': '主歌/桥段无可靠分段谱，宁缺毋滥只录两段'
      }
    ]
  },
  'wasurete-yaranai': {
    'source': '编曲分析文章（45364561）+ 吉他谱素材交叉验证',
    'sections': [
{
        'name': '主歌',
        'chords': 'A B G#m C#m A B C#m E',
        'pattern': '',
        'note': 'E 大调 45364561 走向，BPM 184'
      },
{
        'name': '预副歌',
        'chords': 'Cmaj7 Bsus4 F# E',
        'pattern': '',
        'note': '原谱转位和弦已简化，顺序请对照原曲校准'
      },
{
        'name': '副歌',
        'chords': 'E B C#m G#m A E F#m7 B',
        'pattern': '',
        'note': '卡农变体 + add9/m7 色彩，请对照原曲校准'
      }
    ]
  },
  // —— v0.12.0 课件式谱面（Guitar Pro 导出 PDF 同款风格）——
  // meta：谱头卡（速度/拍号/调弦/调性）；段内 fx = 段落音色标签；
  // bars[] = 按小节网格渲染（可选，缺失时回退旧 chords 字符串渲染）；
  // bar 内 chords 为空时用 label 占位（闷音/旋律等，省略显示 —）。
  // 节奏符号词表：↓ ↑ ↓↑ ↓↓↑ ↓↑↓↑ ×(闷音) 〜(分解/琶音) ｜(小节分隔)
  // 技巧词表：P.M. let ring 滑音 击弦 勾弦 推弦 半推 全推 揉弦 泛音
  'meng-de-chukou': {
    'source': '中级课 70 课课件六线谱（成田工作室）整理，具体指法看原谱 PDF',
    'meta': { 'bpm': 75, 'timeSig': '4/4', 'tuning': 'Standard', 'key': 'G 大调' },
    'sections': [
      {
        'name': '前奏',
        'fx': '清音',
        'bars': [
          { 'chords': 'Cmaj7', 'pattern': '↓', 'techniques': [] },
          { 'chords': 'Bm7', 'pattern': '↓', 'techniques': [] },
          { 'chords': 'Am7', 'pattern': '↓', 'techniques': [] },
          { 'chords': 'G', 'pattern': '↓', 'techniques': [] }
        ],
        'note': '第 1-4 小节，每小节一个和弦整音符垫底，Guitar Pro 原谱标注 ♩=75 慢速起手'
      },
      {
        'name': '清音旋律',
        'fx': '清音',
        'bars': [
          { 'chords': 'Cmaj7', 'pattern': '〜', 'techniques': ['let ring'] },
          { 'chords': 'Bm7', 'pattern': '〜', 'techniques': ['let ring'] },
          { 'chords': 'Am7', 'pattern': '〜', 'techniques': ['let ring'] },
          { 'chords': 'G', 'pattern': '〜', 'techniques': ['let ring'] }
        ],
        'note': '第 5-8 小节，Clean Strat 分解旋律，音符要弹出来并让音延住（let ring）'
      },
      {
        'name': '失真 Riff',
        'fx': '失真',
        'bars': [
          { 'chords': '', 'label': '闷音', 'pattern': '× × × ×', 'techniques': ['P.M.'] },
          { 'chords': '', 'label': '闷音', 'pattern': '× × × ×', 'techniques': ['P.M.'] },
          { 'chords': '', 'label': '闷音', 'pattern': '× × × ×', 'techniques': ['P.M.'] },
          { 'chords': '', 'label': '闷音', 'pattern': '× × × ×', 'techniques': ['P.M.'] }
        ],
        'note': '第 9-12 小节，切失真闷音下拨（原谱低音弦 X-X-7-5 音型），手掌闷住琴弦弹'
      },
      {
        'name': '主旋律',
        'fx': '失真',
        'bars': [
          { 'chords': '', 'label': '旋律', 'pattern': '↓ ↑↓', 'techniques': ['滑音', '击弦', '勾弦'] },
          { 'chords': '', 'label': '旋律', 'pattern': '↓ ↑↓', 'techniques': ['推弦'] },
          { 'chords': '', 'label': '旋律', 'pattern': '↓ ↑↓', 'techniques': ['推弦', '半推'] },
          { 'chords': '', 'label': '旋律', 'pattern': '↓ ↑↓', 'techniques': ['滑音', '击弦', '勾弦'] }
        ],
        'note': '第 13-40 小节主旋律（六线谱 5-8 页），滑音/击勾弦/推弦 full·½ 密集，先慢练到 60% 速度；每小节精确音品以原谱 PDF 为准'
      }
    ]
  }
}
