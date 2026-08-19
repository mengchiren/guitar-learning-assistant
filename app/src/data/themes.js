// 外观主题清单（v0.7.0）：CSS 变量驱动的主题包。
// 每套主题 = id + 名称 + 说明 + 色板预览 + 素材（背景图/看板娘，可选）。
// 主题变量在 style.css 的 [data-theme='xxx'] 块里定义；这里只放清单与元数据，
// 「我的」页据此渲染选择卡。新增主题：①这里加一条；②style.css 加对应变量块；
// ③可选：public/theme/ 下放素材。功能代码零改动。

/**
 * @typedef {object} Theme
 * @property {string} id 主题 id（写入 html[data-theme]）
 * @property {string} name 主题名
 * @property {string} desc 一句话说明
 * @property {string[]} swatch 色板预览（3~5 个主色）
 * @property {string} [bgImage] 桌面背景图（public/theme/ 下，可选）
 * @property {string} [mascot] 看板娘图（public/theme/ 下，可选）
 * @property {string} [mascotName] 看板娘名字/打招呼语
 */

export const THEMES = [
  {
    id: 'classic',
    name: '经典瑞士军刀',
    desc: '米白纸面 + 瑞士红，默认主题',
    swatch: ['#f4f3ef', '#e30613', '#161616', '#dddad2'],
  },
  {
    id: 'yui',
    name: '呆唯 · 轻音海洋',
    desc: '奶油暖粉 + 海盐青 + 平泽唯看板娘（轻音少女）',
    swatch: ['#fff5ec', '#f08a94', '#5fa8c9', '#f5c96b', '#8a6a4f'],
    bgImage: '/theme/yui-bg-desktop.jpg',
    mascot: '/theme/yui-mascot.png',
    mascotName: '唯',
  },
]
