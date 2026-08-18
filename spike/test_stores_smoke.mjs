// Store 冒烟测试（v0.5.1 补）：实例化所有 Pinia store 并访问全部 getter/action 依赖的状态，
// 防止「删了函数定义但调用点没改」这类只在运行时炸的引用错误（曾致首页空白）。
// 纯 Node 跑，无需浏览器：localStorage 用内存 shim 代替。
// 用法: node spike/test_stores_smoke.mjs
import { createRequire } from 'node:module'
import path from 'node:path'

// pinia/vue 在 app/node_modules，从 spike/ 直接 import 解析不到，用 createRequire 指到 app/
const appRequire = createRequire(path.resolve(process.cwd(), 'app/package.json'))
const { createPinia, setActivePinia } = appRequire('pinia')

// ---- localStorage 内存 shim（storage.js 只在读写时访问） ----
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  get length() {
    return mem.size
  },
  key: (i) => [...mem.keys()][i] ?? null,
}

setActivePinia(createPinia())

const { usePracticeStore } = await import('../app/src/stores/practice.js')
const { usePlanStore } = await import('../app/src/stores/plan.js')
const { useSongsStore } = await import('../app/src/stores/songs.js')
const { useSettingsStore } = await import('../app/src/stores/settings.js')
const { useCourseStore } = await import('../app/src/stores/course.js')
const { useSheetsStore } = await import('../app/src/stores/sheets.js')
const { useRecordingsStore } = await import('../app/src/stores/recordings.js')
const { useChatStore } = await import('../app/src/stores/chat.js')
const { useMetronomeStore } = await import('../app/src/stores/metronome.js')
const { useTimerStore } = await import('../app/src/stores/timer.js')

let pass = 0
let fail = 0
function touch(name, fn) {
  try {
    fn()
    pass++
    console.log(`✓ ${name}`)
  } catch (e) {
    fail++
    console.log(`✗ ${name}: ${e.message}`)
  }
}

// 造一条打卡记录，让统计类 getter 走真实路径
const practice = usePracticeStore()
practice.addRecord({ date: '2026-08-18', seconds: 1200, tags: ['基本功'], note: '冒烟' })

touch('practice.todaySeconds', () => practice.todaySeconds)
touch('practice.streakDays', () => practice.streakDays)
touch('practice.last7Days', () => practice.last7Days)
touch('practice.totalSeconds', () => practice.totalSeconds)

const songs = useSongsStore()
touch('songs.allSongs（种子+用户）', () => {
  if (!songs.allSongs.length) throw new Error('allSongs 为空')
})
touch('songs.byId', () => songs.byId('no-thank-you'))
touch('songs 增删改', () => {
  const id = songs.addUserSong({ title: '测试歌', artist: '', source: 'manual', manual: { bpm: 100 } })
  songs.updateUserSong(id, { corrections: { bpm: 110 } })
  if (songs.byId(id).corrections.bpm !== 110) throw new Error('updateUserSong 无效')
  songs.removeUserSong(id)
})

const plan = usePlanStore()
touch('plan.plan（规则引擎全链路）', () => {
  const p = plan.plan
  if (!p.packs || !p.packs[10] || !p.packs[30] || !p.packs[60]) throw new Error('练习包缺失')
})
touch('plan.toggleBasic / setSongStatus', () => {
  plan.toggleBasic('spider')
  plan.setSongStatus('no-thank-you', 'practicing')
  plan.toggleBasic('spider')
  plan.setSongStatus('no-thank-you', null)
})

const settings = useSettingsStore()
touch('settings 全部状态', () => {
  void settings.reminders
  void settings.activeDevices
  void settings.displayMode
  settings.saveReminders()
  settings.saveActiveDevices()
  settings.saveDisplayMode()
})

const course = useCourseStore()
touch('course.catalog / summaryOf / toggleLesson', () => {
  if (!course.catalog.length) throw new Error('目录为空')
  course.toggleLesson('basic', course.catalog[0].lessons[0].key)
  course.summaryOf('basic')
})

const sheets = useSheetsStore()
touch('sheets.sheetOf / saveSheet / removeSheet', () => {
  sheets.saveSheet('test-song', [{ name: '主歌', chords: 'C G', pattern: '', note: '' }])
  if (!sheets.sheetOf('test-song')) throw new Error('saveSheet 无效')
  sheets.removeSheet('test-song')
})

const recordingsModule = await import('../app/src/stores/recordings.js')
touch('recordings.RECORD_CATEGORIES / makeId', () => {
  if (!recordingsModule.RECORD_CATEGORIES.length) throw new Error('RECORD_CATEGORIES 为空')
  if (!recordingsModule.makeId()) throw new Error('makeId 无效')
})

const chat = useChatStore()
touch('chat 状态 / setProvider / setToken', () => {
  chat.setProvider('deepseek')
  chat.setToken('smoke-token')
  if (chat.token !== 'smoke-token') throw new Error('setToken 无效')
  chat.clear()
})

touch('metronome 状态（不启动声音）', () => {
  useMetronomeStore().bpm = 120
  useMetronomeStore().beats = 4
})
touch('timer 状态', () => {
  useTimerStore().start()
  useTimerStore().pause()
  useTimerStore().reset()
})

console.log(`\n结果：${pass}/${pass + fail} 项通过（${fail} 项失败）`)
process.exit(fail > 0 ? 1 : 0)
