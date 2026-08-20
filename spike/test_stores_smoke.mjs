// Store 冒烟测试（v0.5.1 起）：实例化所有 Pinia store 并访问全部 getter/action 依赖的状态，
// 防止「删了函数定义但调用点没改」这类只在运行时炸的引用错误（曾致首页空白）。
// v0.6.0 起：接入 persist 插件并断言「状态变更自动落盘」（消灭手动 save 漏调问题）。
// 纯 Node 跑，无需浏览器：localStorage 用内存 shim 代替。
// 用法: node spike/test_stores_smoke.mjs
import { createRequire } from 'node:module'
import path from 'node:path'

// pinia/vue 在 app/node_modules，从 spike/ 直接 import 解析不到，用 createRequire 指到 app/
const appRequire = createRequire(path.resolve(process.cwd(), 'app/package.json'))
const { createPinia, setActivePinia } = appRequire('pinia')
const { createApp } = appRequire('vue')

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

const { persistPlugin } = await import('../app/src/plugins/persist.js')
const storage = await import('../app/src/utils/storage.js')

// Pinia 插件在 pinia.install(app) 之前只排队不生效——用最小 Vue app 触发安装
const pinia = createPinia().use(persistPlugin)
createApp({}).use(pinia)
setActivePinia(pinia)

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

// ---- storage 层：save/load 往返 + 订阅 ----
touch('storage save/load 往返', () => {
  storage.save('smoke-test', { a: 1 })
  const v = storage.load('smoke-test', null)
  if (!v || v.a !== 1) throw new Error('往返不一致')
})
touch('storage 订阅与退订', () => {
  let fired = 0
  const unsub = storage.subscribe('smoke-test', () => fired++)
  storage.save('smoke-test', { a: 2 })
  unsub()
  storage.save('smoke-test', { a: 3 })
  if (fired !== 1) throw new Error(`订阅触发 ${fired} 次，期望 1 次`)
})

// ---- store 全量冒烟 ----
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

// 造一条打卡记录，让统计类 getter 走真实路径
const practice = usePracticeStore()
practice.addRecord({ date: '2026-08-18', seconds: 1200, tags: ['基本功'], note: '冒烟' })

touch('practice.todaySeconds', () => practice.todaySeconds)
touch('practice.streakDays', () => practice.streakDays)
touch('practice.last7Days', () => practice.last7Days)
touch('practice.totalSeconds', () => practice.totalSeconds)

const songs = useSongsStore()
touch('songs.allSongs（种子+用户，归一化实体）', () => {
  if (!songs.allSongs.length) throw new Error('allSongs 为空')
  const seed = songs.byId('no-thank-you')
  if (!seed || seed.bpm !== 181 || seed.isSeed !== true) throw new Error('种子歌归一化字段不对')
})
touch('songs 增删改（id 为 UUID）', () => {
  const id = songs.addUserSong({ title: '测试歌', artist: '', source: 'manual', manual: { bpm: 100 } })
  if (!/^[0-9a-f-]{36}$/.test(id) && !id.startsWith('u-')) throw new Error(`id 不是 UUID 风格: ${id}`)
  const song = songs.byId(id)
  if (song.bpm !== 100) throw new Error('归一化 bpm 不对')
  songs.updateUserSong(id, { corrections: { bpm: 110 } })
  if (songs.byId(id).bpm !== 110) throw new Error('纠错优先级不对')
  songs.removeUserSong(id)
  if (songs.byId(id)) throw new Error('删除无效')
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
touch('settings 全部状态（含变更触发落盘）', () => {
  settings.reminders.enabled = true
  settings.reminders.time = '20:00'
  settings.activeDevices.guitarId = 'ibanez-grx40-lgy'
  settings.displayMode = 'beginner'
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

// ---- 自动持久化断言（persist 插件，防抖 150ms） ----
await new Promise((r) => setTimeout(r, 350))
touch('persist 自动落盘：practice-records', () => {
  const raw = mem.get('gla:v1:practice-records')
  if (!raw) throw new Error('未落盘')
  if (!JSON.parse(raw).some((r) => r.note === '冒烟')) throw new Error('内容不对')
})
touch('persist 自动落盘：songs / plan / settings / course / sheets / chat', () => {
  const keys = [
    'gla:v1:songs',
    'gla:v1:plan-basics-done',
    'gla:v1:plan-song-status',
    'gla:v1:reminders',
    'gla:v1:active-devices',
    'gla:v1:display-mode',
    'gla:v1:course-progress',
    'gla:v1:user-sheets',
    'gla:v1:ai-provider',
    'gla:v1:ai-history',
    'gla:v1:ask-token',
  ]
  for (const k of keys) {
    if (!mem.has(k)) throw new Error(`未落盘: ${k}`)
  }
})
touch('persist 落盘格式与旧版一致（单字段存值本身）', () => {
  const songs = JSON.parse(mem.get('gla:v1:songs'))
  if (!Array.isArray(songs)) throw new Error('songs 应是数组')
  const provider = mem.get('gla:v1:ai-provider')
  if (provider !== '"deepseek"') throw new Error(`ai-provider 格式不对: ${provider}`)
})
touch('persist 自动落盘：timer-session（v0.8.0 计时会话）', () => {
  const raw = mem.get('gla:v1:timer-session')
  if (!raw) throw new Error('未落盘')
  const s = JSON.parse(raw)
  for (const f of ['running', 'startedAt', 'accumulated']) {
    if (!(f in s)) throw new Error(`字段缺失 ${f}`)
  }
  if ('now' in s) throw new Error('now 是每秒 tick 不应落盘')
})

// ---- v0.8.0 新增：打卡草稿落盘 / 落盘失败通知 / 备份恢复覆盖语义 ----
await (async () => {
  try {
    practice.draft.finished = true
    await new Promise((r) => setTimeout(r, 350))
    const raw = mem.get('gla:v1:practice-draft')
    if (!raw) throw new Error('practice-draft 未落盘')
    if (JSON.parse(raw).finished !== true) throw new Error('draft 内容不对')
    practice.draft.finished = false
    pass++
    console.log('✓ persist 自动落盘：practice-draft（v0.8.0 打卡草稿）')
  } catch (e) {
    fail++
    console.log(`✗ persist 自动落盘 practice-draft: ${e.message}`)
  }
})()

await (async () => {
  try {
    // persist 落盘失败：插件捕获不崩，且 storage 通知全局监听者（App 横幅）
    let notified = 0
    const off = storage.onStorageError(() => notified++)
    const orig = localStorage.setItem
    localStorage.setItem = (k, v) => {
      if (k === 'gla:v1:practice-draft') throw new Error('QuotaExceededError')
      return orig(k, v)
    }
    practice.draft.finished = true
    await new Promise((r) => setTimeout(r, 350))
    localStorage.setItem = orig
    practice.draft.finished = false
    off()
    if (notified < 1) throw new Error(`存储失败通知 ${notified} 次，期望 ≥1`)
    pass++
    console.log('✓ persist 落盘失败被捕获且通知全局监听者（v0.8.0）')
  } catch (e) {
    fail++
    console.log(`✗ persist 落盘失败通知: ${e.message}`)
  }
})()

await (async () => {
  try {
    const { restoreBackup } = await import('../app/src/utils/backup.js')
    mem.set('gla:v1:legacy-extra', '"x"') // 模拟备份导出后新增的 key
    const n = await restoreBackup({ app: 'guitar-learning-assistant', data: { 'smoke-backup': { ok: 1 } } })
    if (n !== 1) throw new Error(`恢复条数 ${n}，期望 1`)
    if (mem.has('gla:v1:legacy-extra')) throw new Error('未清空备份里没有的多余 key')
    if (!mem.has('gla:v1:smoke-backup')) throw new Error('未写入备份数据')
    pass++
    console.log('✓ restoreBackup 覆盖语义（先清空再写入，v0.8.0）')
  } catch (e) {
    fail++
    console.log(`✗ restoreBackup 覆盖语义: ${e.message}`)
  }
})()

console.log(`\n结果：${pass}/${pass + fail} 项通过（${fail} 项失败）`)
process.exit(fail > 0 ? 1 : 0)
