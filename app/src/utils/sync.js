// 云同步前端核心（v0.11.0）。
// 设计：全量快照 + 最后写入胜出（单用户，冲突概率极低）+ 方向提示由 UI 层确认。
// 数据范围：SYNC_KEYS 白名单（新增可同步数据必须登记；瞬态/本机态数据永远不进白名单）——
//   同步：打卡记录、用户歌单与纠错、计划/课程进度、自录曲谱、AI 聊天历史、设置/主题偏好。
//   不同步：录音（音频与元数据，本地存储约定）、计时会话、打卡草稿、令牌、通知标记等本机态数据。
// 使用「本机最后写入时间」做新旧判断：storage.js 每次 save 都会更新 gla:v1:sync-stamp。

import { save, load } from './storage.js'
import { newId } from './id.js'

const PREFIX = 'gla:v1:'

/** 同步范围白名单（gla:v1: 短名）。新增可同步数据必须在这里登记，否则不会上云。 */
export const SYNC_KEYS = [
  'practice-records', // 打卡记录/时长（练习页 records）
  'songs', // 用户歌单 + 歌曲分析/纠错/待校准标记
  'plan-basics-done', // 基本功达标
  'plan-song-status', // 歌曲练习中/已掌握
  'course-progress', // 课程进度
  'user-sheets', // 自录曲谱
  'ai-history', // AI 答疑历史（含问答内容，也是学习资料）
  // 设置/主题偏好
  'reminders',
  'active-devices',
  'display-mode',
  'theme',
  'glass',
  'mascot',
  'dark-mode',
]

/** 只读本机最近一次数据写入时间（storage.js save 时更新；没有则为 ''） */
export function localStamp() {
  return load('sync-stamp', '')
}

/** 本机同步设备 ID（首次生成后持久，用于区分「另一台设备上传的」） */
export function localDeviceId() {
  let v = load('sync-device', '')
  if (!v) {
    v = newId()
    save('sync-device', v)
  }
  return v
}

/**
 * 收集本机可同步数据的全量快照（只取 SYNC_KEYS 白名单；单条损坏跳过不阻塞）。
 * @returns {{ app: string, backupVersion: number, data: Record<string, unknown>, updatedAt: string, deviceId: string }}
 */
export function collectSnapshot() {
  const data = {}
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) continue
    try {
      data[key] = JSON.parse(raw)
    } catch {
      /* 单条损坏：跳过 */
    }
  }
  return {
    app: 'guitar-learning-assistant',
    backupVersion: 1,
    data,
    updatedAt: localStamp() || new Date().toISOString(),
    deviceId: localDeviceId(),
  }
}

/**
 * 下载快照后应用：清空同步范围内的本机 key（远端没有的也清，真覆盖语义）再写入。
 * 与恢复备份语义一致——调用方应用后应立即 location.reload() 让 store 重读。
 * @param {Record<string, unknown>} data
 */
export function applySnapshot(data) {
  save('sync-stamp', new Date().toISOString())
  for (const key of SYNC_KEYS) {
    if (key in data) save(key, data[key])
    else localStorage.removeItem(PREFIX + key)
  }
}

/**
 * 方向决策（纯函数）：「最后写入胜出 + 方向提示」的核心判断。
 * @param {string} localAt 本机最后写入时间（ISO 或 ''）
 * @param {string} remoteAt 云端快照时间（ISO 或 ''）
 * @returns {'upload'|'download'|'none'|'unknown'}
 *   upload   本机更新（或远端为空）→ 建议上传
 *   download 云端更新 → 建议下载
 *   none     两端一致/都为空 → 无需动作
 *   unknown  本机无写入记录但云端有（老数据/新装）→ 让用户自己选方向
 */
export function chooseDirection(localAt, remoteAt) {
  if (localAt && remoteAt) {
    return new Date(localAt) >= new Date(remoteAt) ? 'upload' : 'download'
  }
  if (localAt) return 'upload' // 远端为空
  if (remoteAt) return 'unknown'
  return 'none'
}

/** 本地开发时请求线上 Functions（本地 vite 不跑 Functions）；生产同源直连（与 chat.js 一致） */
function apiBase() {
  return import.meta.env?.DEV ? 'https://guitar-learning-assistant.pages.dev' : ''
}

/**
 * 请求同步代理（/api/sync）。令牌不匹配/未配置等服务端错误会抛错（带服务端 message）。
 * @param {string} action 'check' | 'upload' | 'download'
 * @param {object} [payload]
 * @param {string} token
 */
export async function syncRequest(action, payload = {}, token) {
  const resp = await fetch(`${apiBase()}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sync-Token': token },
    body: JSON.stringify({ action, ...payload }),
  })
  let out = {}
  try {
    out = await resp.json()
  } catch {
    /* 非 JSON 响应 */
  }
  if (!resp.ok || !out.ok) throw new Error(out.error || `同步请求失败（${resp.status}）`)
  return out
}

/** 人性化时间（本机时区）：'2026-08-24 21:30'；空返回 '—' */
export function fmtWhen(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
