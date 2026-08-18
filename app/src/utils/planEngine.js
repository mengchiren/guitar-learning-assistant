// M3 学习计划规则引擎（纯函数，无副作用）。
// 输入打卡记录、基本功达标标记、歌曲练习状态，输出三档（10/30/60 分钟）练习包。
// 规则全部内置且可解释：每项带 why 文案，包级带 tier 说明。改任何规则后必须重跑
// spike/test_plan_engine.mjs 对拍测试。
import { FUNDAMENTALS } from '../data/fundamentals.js'

// ---- 日期工具（本地时区，YYYY-MM-DD） ----
export function weekStartOf(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  const day = d.getDay() // 0=周日
  const delta = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - delta)
  return fmt(d)
}

export function fmt(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function shiftDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return fmt(d)
}

// 某周（周一为起点）的练习统计
function weekStats(records, weekStart) {
  const end = shiftDays(weekStart, 7)
  const days = new Set()
  let totalSeconds = 0
  for (const r of records || []) {
    if (r.date >= weekStart && r.date < end) {
      days.add(r.date)
      totalSeconds += r.seconds || 0
    }
  }
  return { days: days.size, totalSeconds }
}

// 每周达标标准：练够 4 天
export const GOAL_DAYS_PER_WEEK = 4

// 三档结构模板：[基本功1 分钟, 基本功2 分钟, 歌曲 分钟, 复习 分钟]
const TIER_TEMPLATES = {
  10: [5, 5, 0, 0],
  30: [5, 10, 15, 0],
  60: [10, 10, 30, 10],
}

// 基本功排序：未达标优先（按清单顺序）；已达标按达标日期越久越靠前（复习用）
function rankBasics(basicsDone) {
  const pending = FUNDAMENTALS.filter((f) => !basicsDone[f.id])
  const done = FUNDAMENTALS.filter((f) => basicsDone[f.id])
    .sort((a, b) => (basicsDone[a.id] || '') <= (basicsDone[b.id] || '') ? -1 : 1)
  return [...pending, ...done]
}

// 歌曲排序：练习中 → 同套路未掌握推荐 → 其他未掌握；全部掌握后按掌握日期最久优先回炉
// 返回 { ordered, lastMastered }：lastMastered 为最近掌握的歌曲（用于「同套路接续」文案）
function rankSongs(songs, songStatus) {
  const statusOf = (id) => songStatus[id]?.state || null
  const practicing = songs.filter((s) => statusOf(s.id) === 'practicing')

  const masteredEntries = Object.entries(songStatus)
    .filter(([, v]) => v.state === 'mastered')
    .sort((a, b) => (a[1].date || '') >= (b[1].date || '') ? -1 : 1)
  const masteredIds = new Set(masteredEntries.map(([id]) => id))

  // 未掌握候选（排除练习中与已掌握）
  const candidates = songs.filter((s) => statusOf(s.id) !== 'practicing' && !masteredIds.has(s.id))

  // 上一首刚掌握的歌，用于同套路接续推荐
  const lastMastered = masteredEntries.length
    ? songs.find((s) => s.id === masteredEntries[0][0]) || null
    : null
  const templateToFollow = lastMastered ? lastMastered.template : null

  const ordered = [...practicing]
  if (templateToFollow) {
    ordered.push(...candidates.filter((s) => s.template && s.template === templateToFollow))
    ordered.push(...candidates.filter((s) => !(s.template && s.template === templateToFollow)))
  } else {
    ordered.push(...candidates)
  }
  // 全部掌握：按掌握日期最久优先回炉复习
  if (!practicing.length && !candidates.length) {
    for (const [id] of [...masteredEntries].sort((a, b) => (a[1].date || '') <= (b[1].date || '') ? -1 : 1)) {
      const s = songs.find((x) => x.id === id)
      if (s) ordered.push(s)
    }
  }
  return { ordered, lastMastered }
}

/**
 * @typedef {object} PlanItem 练习包单项（跨 store 契约：plan 引擎 → 计划页/首页）
 * @property {'basic'|'song'|'review'} kind
 * @property {string} ref 关联 id（基本功 id / 歌曲 id / 'review' / 'free'）
 * @property {string} title
 * @property {number} minutes
 * @property {string} goal 达标标准
 * @property {string} why 为什么这么建议（规则透明）
 * @property {boolean} done
 * @property {string} [desc]
 */

/**
 * @typedef {object} PlanOutput 练习包输出
 * @property {'normal'|'reduce'|'boost'} mode 动态调整模式
 * @property {string} tierNote 调整说明
 * @property {{start: string, days: number, totalSeconds: number, goalDays: number, lastWeekDays: number}} week 本周概览
 * @property {Record<'10'|'30'|'60', PlanItem[]>} packs 三档练习包
 */

/**
 * 生成练习包
 * @param {object} p
 * @param {Array}  p.records 打卡记录 [{date, seconds, tags, note}]
 * @param {object} p.basicsDone 达标标记 { spider: 'YYYY-MM-DD', ... }
 * @param {object} p.songStatus 歌曲状态 { songId: { state: 'practicing'|'mastered', date } }
 * @param {Array}  p.songs 可选歌曲 [{ id, title, template, bpm }]（种子库 + 用户歌）
 * @param {string} p.todayStr 今天 YYYY-MM-DD（本地时区）
 * @returns {PlanOutput}
 */
export function generatePlan({ records, basicsDone = {}, songStatus = {}, songs = [], todayStr }) {
  const thisWeek = weekStartOf(todayStr)
  const lastWeek = shiftDays(thisWeek, -7)
  const weeksAgo2 = shiftDays(thisWeek, -14)

  const cur = weekStats(records, thisWeek)
  const prev = weekStats(records, lastWeek)
  const prev2 = weekStats(records, weeksAgo2)

  // 动态调整规则
  const hasHistory = (records || []).length > 0
  let mode = 'normal'
  let tierNote = ''
  if (hasHistory && prev.days <= 2) {
    mode = 'reduce'
    tierNote = `上周只练了 ${prev.days} 天，这周先恢复习惯——建议量减半，从 10 分钟档开始。`
  } else if (prev.days >= GOAL_DAYS_PER_WEEK && prev2.days >= GOAL_DAYS_PER_WEEK && cur.days >= GOAL_DAYS_PER_WEEK) {
    mode = 'boost'
    tierNote = '连续 3 周都练够 4 天，很稳！这周建议量 +10%，可以加一点强度。'
  } else if (cur.days >= GOAL_DAYS_PER_WEEK) {
    tierNote = '这周已练够 4 天，保持节奏即可。'
  }

  // 基本功与歌曲排序
  const basics = rankBasics(basicsDone)
  const { ordered: songList, lastMastered } = rankSongs(songs, songStatus)

  const scale = mode === 'reduce' ? 0.5 : mode === 'boost' ? 1.1 : 1
  const toMin = (m) => {
    if (m === 0) return 0
    const scaled = Math.round((m * scale) / 5) * 5
    return Math.max(5, scaled)
  }

  const buildItems = (tpl) => {
    const [b1m, b2m, songM, reviewM] = tpl
    const items = []
    if (b1m > 0 && basics[0]) {
      const f = basics[0]
      const isNew = !basicsDone[f.id]
      items.push({
        kind: 'basic',
        ref: f.id,
        title: f.name,
        minutes: toMin(b1m),
        goal: f.goal,
        why: isNew ? '基本功清单里还没达标，优先练' : '已达标，定期复习保持手感',
        done: Boolean(basicsDone[f.id]),
        desc: f.desc,
      })
    }
    if (b2m > 0 && basics[1]) {
      const f = basics[1]
      const isNew = !basicsDone[f.id]
      items.push({
        kind: 'basic',
        ref: f.id,
        title: f.name,
        minutes: toMin(b2m),
        goal: f.goal,
        why: isNew ? '基本功清单里还没达标，优先练' : '已达标，定期复习保持手感',
        done: Boolean(basicsDone[f.id]),
        desc: f.desc,
      })
    }
    if (songM > 0) {
      const s = songList[0]
      if (s) {
        const st = songStatus[s.id]?.state
        const followsTemplate =
          !st && lastMastered && s.template && s.template === lastMastered.template
        items.push({
          kind: 'song',
          ref: s.id,
          title: s.title,
          minutes: toMin(songM),
          goal: s.bpm
            ? `跟节拍器练顺这首歌，建议目标 ${Math.round(s.bpm)} BPM`
            : '跟节拍器把这首歌的速度段落练顺',
          why:
            st === 'practicing'
              ? '你正在练这首歌，继续推进'
              : st === 'mastered'
                ? '这首已掌握，定期回炉'
                : followsTemplate
                  ? `《${lastMastered.title}》刚掌握，同套路（${s.template}）接这首`
                  : '从种子库接一首新歌开始实战',
          done: st === 'mastered',
          desc: '先用 80% 速度跟节拍器，顺了再回原速',
        })
      } else {
        items.push({
          kind: 'review',
          ref: 'free',
          title: '自由练习',
          minutes: toMin(songM),
          goal: '弹点自己喜欢的，保持手感',
          why: '歌曲库暂时没有可推荐的歌',
          done: false,
        })
      }
    }
    if (reviewM > 0) {
      items.push({
        kind: 'review',
        ref: 'review',
        title: '复习本周内容',
        minutes: toMin(reviewM),
        goal: '把本周练过的歌和基本功过一遍',
        why: '练习包结构：留一段复习时间巩固',
        done: false,
      })
    }
    return items
  }

  const packs = {}
  for (const [tier, tpl] of Object.entries(TIER_TEMPLATES)) {
    packs[tier] = buildItems(tpl)
  }

  return {
    mode,
    tierNote,
    week: {
      start: thisWeek,
      days: cur.days,
      totalSeconds: cur.totalSeconds,
      goalDays: GOAL_DAYS_PER_WEEK,
      lastWeekDays: prev.days,
    },
    packs,
  }
}
