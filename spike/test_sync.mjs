// 云同步核心校验（v0.11.0，CI 跑；v0.13.2 增收紧项）：
// ①chooseDirection 方向决策边界（含坏时间戳防御）；②SYNC_KEYS 白名单规范；
// ③collectSnapshot 只收集白名单数据；④applySnapshot 覆盖语义 + 远端数据清洗；
// ⑤sync-stamp 只对白名单 key 刷新的门控；⑥fmtWhen 格式化。
// 纯 Node + localStorage 内存 shim（与 test_stores_smoke.mjs 同款）。
// 用法: node spike/test_sync.mjs

// ---- localStorage 内存 shim ----
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

const sync = await import('../app/src/utils/sync.js')
const storage = await import('../app/src/utils/storage.js')

let pass = 0
let fail = 0
function touch(name, fn) {
  try {
    fn()
    pass++
    console.log(`✓ ${name}`)
  } catch (e) {
    fail++
    console.error(`✗ ${name}: ${e.message}`)
  }
}

function resetMem() {
  mem.clear()
}

// ---- ① chooseDirection ----
touch('chooseDirection：本机新 → upload', () => {
  const d = sync.chooseDirection('2026-08-24T10:00:00.000Z', '2026-08-24T09:00:00.000Z')
  if (d !== 'upload') throw new Error(`got ${d}`)
})
touch('chooseDirection：云端新 → download', () => {
  const d = sync.chooseDirection('2026-08-24T09:00:00.000Z', '2026-08-24T10:00:00.000Z')
  if (d !== 'download') throw new Error(`got ${d}`)
})
touch('chooseDirection：相同时间（本机优先）→ upload', () => {
  const d = sync.chooseDirection('2026-08-24T10:00:00.000Z', '2026-08-24T10:00:00.000Z')
  if (d !== 'upload') throw new Error(`got ${d}`)
})
touch('chooseDirection：本机有云端空 → upload', () => {
  if (sync.chooseDirection('2026-08-24T10:00:00.000Z', '') !== 'upload') throw new Error('fail')
})
touch('chooseDirection：本机空云端有 → unknown', () => {
  if (sync.chooseDirection('', '2026-08-24T10:00:00.000Z') !== 'unknown') throw new Error('fail')
})
touch('chooseDirection：都空 → none', () => {
  if (sync.chooseDirection('', '') !== 'none') throw new Error('fail')
})

// ---- ② 白名单规范 ----
touch('SYNC_KEYS 均为非空字符串且无重复', () => {
  if (!Array.isArray(sync.SYNC_KEYS) || sync.SYNC_KEYS.length < 10) throw new Error('清单过短')
  const seen = new Set()
  for (const k of sync.SYNC_KEYS) {
    if (!k || typeof k !== 'string') throw new Error(`非法条目 ${k}`)
    if (seen.has(k)) throw new Error(`重复: ${k}`)
    seen.add(k)
  }
})
touch('SYNC_KEYS 不包含瞬态/令牌/本地态 key', () => {
  const forbidden = ['practice-draft', 'ask-token', 'sync-token', 'timer-session', 'sync-stamp', 'sync-device', 'sync-last-sync', 'sync-auto-check', 'notified-date', 'recordings', 'ai-provider']
  for (const k of forbidden) {
    if (sync.SYNC_KEYS.includes(k)) throw new Error(`瞬态 key 混入白名单: ${k}`)
  }
})

// ---- ③ collectSnapshot 只收集白名单 ----
resetMem()
storage.save('songs', [{ title: '测试歌', bpm: 120 }])
storage.save('practice-records', [{ date: '2026-08-18', seconds: 100 }])
storage.save('ai-history', [{ role: 'user', content: '问' }])
storage.save('practice-draft', { tags: ['x'], note: '草稿不应上云' })
storage.save('ask-token', 'secret-token')
storage.save('notified-date', '2026-08-24')
storage.save('timer-session', { running: true })
touch('collectSnapshot 只含白名单 key 且数据正确', () => {
  const snap = sync.collectSnapshot()
  const keys = Object.keys(snap.data).sort()
  const want = ['ai-history', 'practice-records', 'songs'].sort()
  if (JSON.stringify(keys) !== JSON.stringify(want)) throw new Error(`keys=${keys.join(',')}`)
  if (snap.data.songs[0].bpm !== 120) throw new Error('songs 内容不对')
  if (!snap.deviceId || !snap.updatedAt) throw new Error('快照缺 deviceId/updatedAt')
  if (snap.app !== 'guitar-learning-assistant') throw new Error('app 标识缺失')
})
touch('collectSnapshot 单条损坏跳过不阻塞', () => {
  localStorage.setItem('gla:v1:songs', '{bad json')
  const snap = sync.collectSnapshot()
  if ('songs' in snap.data) throw new Error('损坏数据未跳过')
})

// ---- ④ applySnapshot 覆盖语义 ----
resetMem()
storage.save('songs', [{ title: '旧歌' }])
storage.save('plan-basics-done', { spider: '2026-08-01' })
sync.applySnapshot({
  songs: [{ title: '新歌', bpm: 110 }],
  'course-progress': { basic: { done: ['b1'] } },
})
touch('applySnapshot：写入远端数据 + 清掉远端没有的 key', () => {
  if (storage.load('songs', [])[0].title !== '新歌') throw new Error('songs 未覆盖')
  if (storage.load('course-progress', null) === null) throw new Error('course-progress 未写入')
  const raw = localStorage.getItem('gla:v1:plan-basics-done')
  if (raw !== null) throw new Error('远端没有的 key 未被清除')
})

// ---- ④v0.13.2 applySnapshot 数据清洗（防坏快照整包灌进 store）----
resetMem()
storage.save('songs', [{ title: '旧歌' }])
touch('applySnapshot：未知 key / 非法类型被跳过并返回 skipped 说明', () => {
  const skipped = sync.applySnapshot({
    songs: [{ title: '新歌', bpm: 110 }],
    evil: { a: 1 }, // 不在白名单
    'course-progress': 'not-an-object-value-is-ok-string', // 原始值合法，应写入
    timerSession: 123, // 命名不在白名单
  })
  if (!Array.isArray(skipped) || !skipped.includes('evil:不在白名单')) throw new Error(`skipped=${skipped}`)
  if (localStorage.getItem('gla:v1:evil') !== null) throw new Error('非白名单 key 竟被落库')
  if (storage.load('songs', [])[0].title !== '新歌') throw new Error('正常数据未写入')
})
touch('sanitizeRemoteData：整个 data 不是对象 → 全部跳过不抛错', () => {
  const r1 = sync.sanitizeRemoteData(null)
  if (Object.keys(r1.clean).length !== 0 || r1.skipped.length === 0) throw new Error('null 处理不对')
  const r2 = sync.sanitizeRemoteData([1, 2])
  if (Object.keys(r2.clean).length !== 0) throw new Error('数组处理不对')
})
touch('sanitizeRemoteData：函数类型 / 过大条目被拒', () => {
  const r = sync.sanitizeRemoteData({ songs: () => {}, 'ai-history': [{ role: 'user', content: 'x'.repeat(600 * 1024) }] })
  if ('songs' in r.clean || 'ai-history' in r.clean) throw new Error(`应全部拒绝: ${r.skipped}`)
})

// ---- ④b v0.13.2 chooseDirection 坏时间戳防御 ----
touch('chooseDirection：本机时间戳非法 → unknown（不再恒 download）', () => {
  if (sync.chooseDirection('not-a-date', '2026-08-24T10:00:00.000Z') !== 'unknown') throw new Error('fail')
})
touch('chooseDirection：云端时间戳非法 → unknown', () => {
  if (sync.chooseDirection('2026-08-24T10:00:00.000Z', 'garbage') !== 'unknown') throw new Error('fail')
})
touch('chooseDirection：两端都非法 → unknown', () => {
  if (sync.chooseDirection('x', 'y') !== 'unknown') throw new Error('fail')
})

// ---- ④c v0.13.2 sync-stamp 门控 ----
resetMem()
touch('stamp 门控：只写本机态 key（计时会话/草稿）不刷新 sync-stamp', () => {
  storage.save('timer-session', { running: true })
  storage.save('practice-draft', { note: 'x' })
  if (localStorage.getItem('gla:v1:sync-stamp') !== null) throw new Error('本机态写入不应刷新 stamp')
})
touch('stamp 门控：白名单 key 写入才刷新 sync-stamp', () => {
  storage.save('songs', [{ title: 'A' }])
  if (!localStorage.getItem('gla:v1:sync-stamp')) throw new Error('同步数据写入应刷新 stamp')
})

// ---- ⑤ fmtWhen ----
touch('fmtWhen：空 → —', () => {
  if (sync.fmtWhen('') !== '—') throw new Error('fail')
})
touch('fmtWhen：ISO 转本机 YYYY-MM-DD HH:mm', () => {
  const t = sync.fmtWhen('2026-08-24T10:30:00+08:00')
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(t)) throw new Error(`got ${t}`)
})

console.log(`\n结果：${pass}/${pass + fail} 项通过（${fail} 项失败）`)
process.exit(fail > 0 ? 1 : 0)
