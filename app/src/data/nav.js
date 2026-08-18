// 应用导航清单（v0.6.0）：路由 / 底部 tab / 工具页入口统一在这里声明。
// 加一个新页面：①在 ROUTES 加一条；②要出现在底部导航就加 meta.tab + label + icon；
// ③要出现在工具页就加一条 TOOLS。不再需要改 router/index.js / App.vue / ToolsView。

/**
 * @typedef {object} AppRoute
 * @property {string} path
 * @property {() => Promise<unknown>} component 懒加载组件
 * @property {object} [meta]
 * @property {boolean} [meta.tab] 显示在底部导航（手机）/顶栏（桌面）
 * @property {string} [meta.label] tab 文案（meta.tab 时必填）
 * @property {string} [meta.icon] tab 图标名（meta.tab 时必填，见 components/Icon.vue）
 * @property {string} [meta.title] 二级页标题（返回栏）
 */

export const ROUTES = [
  { path: '/', component: () => import('../views/HomeView.vue'), meta: { tab: true, label: '首页', icon: 'home' } },
  { path: '/plan', component: () => import('../views/PlanView.vue'), meta: { tab: true, label: '计划', icon: 'calendar' } },
  { path: '/plan-item/basic/:id', component: () => import('../views/PlanItemView.vue'), meta: { title: '练习详情' } },
  { path: '/practice', component: () => import('../views/PracticeView.vue'), meta: { title: '练习计时' } },
  { path: '/tools', component: () => import('../views/ToolsView.vue'), meta: { tab: true, label: '工具', icon: 'grid' } },
  { path: '/metronome', component: () => import('../views/MetronomeView.vue'), meta: { title: '节拍器' } },
  { path: '/tuner', component: () => import('../views/TunerView.vue'), meta: { title: '调音器' } },
  { path: '/chords', component: () => import('../views/ChordLibraryView.vue'), meta: { title: '和弦图库' } },
  { path: '/recordings', component: () => import('../views/RecordingsView.vue'), meta: { title: '录音回听' } },
  { path: '/ask', component: () => import('../views/ChatView.vue'), meta: { title: 'AI 答疑' } },
  { path: '/songs', component: () => import('../views/SongsView.vue'), meta: { tab: true, label: '歌曲', icon: 'music' } },
  { path: '/songs/new', component: () => import('../views/SongAnalyzeView.vue'), meta: { title: '添加歌曲' } },
  { path: '/songs/:id', component: () => import('../views/SongDetailView.vue'), meta: { title: '歌曲详情' } },
  { path: '/profile', component: () => import('../views/ProfileView.vue'), meta: { tab: true, label: '我的', icon: 'user' } },
  { path: '/stats', component: () => import('../views/StatsView.vue'), meta: { title: '统计报表' } },
  { path: '/course', component: () => import('../views/CourseView.vue'), meta: { title: '课程进度' } },
  { path: '/devices', component: () => import('../views/DevicesView.vue'), meta: { title: '我的设备' } },
  { path: '/reminders', component: () => import('../views/RemindersView.vue'), meta: { title: '提醒设置' } },
  { path: '/templates', component: () => import('../views/TemplatesView.vue'), meta: { title: '音色套路库' } },
  { path: '/amp-guide', component: () => import('../views/AmpGuideView.vue'), meta: { title: '音箱入门' } },
]

/** 底部导航 / 顶栏 tab（ROUTES 里 meta.tab 的子集） */
export const TABS = ROUTES.filter((r) => r.meta?.tab).map((r) => ({
  path: r.path,
  label: r.meta.label,
  icon: r.meta.icon,
}))

/**
 * 工具页入口卡片。
 * @typedef {object} ToolEntry
 * @property {string} path 必须是 ROUTES 里的路径
 * @property {string} name 卡片标题
 * @property {string} desc 卡片副标题
 * @property {string} icon 图标名（见 components/Icon.vue）
 */
export const TOOLS = [
  { path: '/metronome', name: '节拍器', desc: '练习节奏、跟目标速度', icon: 'metronome' },
  { path: '/tuner', name: '调音器', desc: '麦克风收音 + 参考音', icon: 'tuner' },
  { path: '/chords', name: '和弦图库', desc: '82 个常用和弦指法图 · 点开可放大', icon: 'chord' },
  { path: '/recordings', name: '录音回听', desc: '录练习 · 自动对拍 · 回听', icon: 'mic' },
  { path: '/ask', name: 'AI 答疑', desc: '练琴问题随时问 · 多模型切换', icon: 'sparkle' },
  { path: '/templates', name: '音色套路库', desc: '6 套常用音色 · 对应你的设备', icon: 'sliders' },
  { path: '/amp-guide', name: '音箱入门', desc: '面板旋钮图解 · 学会调音色', icon: 'amp' },
]
