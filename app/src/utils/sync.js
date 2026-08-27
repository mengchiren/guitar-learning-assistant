// 云同步前端核心（v0.11.0，v0.13.2 收紧）。
// 设计：全量快照 + 最后写入胜出（单用户，冲突概率极低）+ 方向提示由 UI 层确认。
// 数据范围：SYNC_KEYS 白名单（在 utils/syncKeys.js 登记；瞬态/本机态数据永远不进白名单）——
//   同步：打卡记录、用户歌单与纠错、计划/课程进度、自录曲谱、AI 聊天历史、设置/主题偏好。
//   不同步：录音（音频与元数据，本地存储约定）、壁纸（文件只存本机 IndexedDB，settings.wallpaper 虽落盘但不入云）、计时会话、打卡草稿、令牌、通知标记等本机态数据。
// 「本机最后写入时间」= sync-stamp，storage.js save 时更新；v0.13.2 起**只对白名单 key 刷新**
// （否则在本机写个不同步的草稿也会把自己判成最新，误导方向决策）。

import { save, load } from './storage.js'
import { newId } from './id.js'
import { SYNC_KEYS, MAX_SNAPSHOT_BYTES } from './syncKeys.js'
import { apiBase } from './config.js'

export { SYNC_KEYS }
export { MAX_SNAPSHOT_BYTES }

const PREFIX = 'gla:v1:'
const PER_KEY_MAX_BYTES = 512 * 1024

/** 只读本机最近一次同步数据写入时间（storage.js save 白名单 key 时更新；没有则为 ''） */
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

function isSaneJsonValue(v) {
  if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) return true
  if (Array.isArray(v)) return true
  // 仅接受普通对象（拒绝构造过的类实例等）
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

/**
 * 校验下载快照里的 data（v0.13.2）：坏 key / 类型异常 / 单条过大直接跳过并说明，
 * 不再整包盲灌进各 store（store 的 load 也没有结构校验，脏数据会一直当真）。
 * @param {unknown} rawData
 * @returns {{ clean: Record<string, unknown>, skipped: string[] }}
 */
export function sanitizeRemoteData(rawData) {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return { clean: {}, skipped: ['<整个快照 data 不是对象>'] }
  }
  const clean = {}
  const skipped = []
  for (const [key, value] of Object.entries(rawData)) {
    if (!SYNC_KEYS.includes(key)) {
      skipped.push(`${key}:不在白名单`)
      continue
    }
    if (!isSaneJsonValue(value)) {
      skipped.push(`${key}:类型异常(${typeof value})`)
      continue
    }
    try {
      if (JSON.stringify(value).length > PER_KEY_MAX_BYTES) {
        skipped.push(`${key}:超过 ${Math.round(PER_KEY_MAX_BYTES / 1024)}KB`)
        continue
      }
    } catch {
      skipped.push(`${key}:不可序列化`)
      continue
    }
    clean[key] = value
  }
  return { clean, skipped }
}

/**
 * 下载快照后应用：清空同步范围内的本机 key（远端没有的也清，真覆盖语义）再写入。
 * 与恢复备份语义一致——调用方应用后应立即 location.reload() 让 store 重读。
 * @param {Record<string, unknown>} data 远端快照 data 字段
 * @returns {string[]} 被跳过的异常条目说明（供 UI 提示，可忽略）
 */
export function applySnapshot(data) {
  const { clean, skipped } = sanitizeRemoteData(data)
  if (skipped.length) console.warn('[sync] 快照中以下条目异常已跳过:', skipped)
  localStorage.setItem(PREFIX + 'sync-stamp', new Date().toISOString())
  for (const key of SYNC_KEYS) {
    if (key in clean) save(key, clean[key])
    else localStorage.removeItem(PREFIX + key)
  }
  return skipped
}

function safeTimestamp(iso) {
  if (!iso || typeof iso !== 'string') return NaN
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : NaN
}

/**
 * 方向决策（纯函数）：「最后写入胜出 + 方向提示」的核心判断。
 * @param {string} localAt 本机最后写入时间（ISO 或 ''）
 * @param {string} remoteAt 云端快照时间（ISO 或 ''）
 * @returns {'upload'|'download'|'none'|'unknown'}
 *   upload   本机更新（或远端为空）→ 建议上传
 *   download 云端更新 → 建议下载
 *   none     两端一致/都为空 → 无需动作
 *   unknown  本机无写入记录但云端有、或任一端时间戳非法 → 让用户自己选方向
 *             （v0.13.2 起：坏时间戳不再落入 NaN 比较恒 false 的默认 download 分支；
 *              两端时钟不准也属于该范畴，用户确认框里能看到两端时间自行把关）
 */
export function chooseDirection(localAt, remoteAt) {
  const lt = safeTimestamp(localAt)
  const rt = safeTimestamp(remoteAt)
  if (Number.isFinite(lt) && Number.isFinite(rt)) {
    return lt >= rt ? 'upload' : 'download'
  }
  // 有值但解析失败（时钟故障/伪造）→ 不能自动判断
  if ((localAt && !Number.isFinite(lt)) || (remoteAt && !Number.isFinite(rt))) return 'unknown'
  if (Number.isFinite(lt)) return 'upload' // 远端为空
  if (Number.isFinite(rt)) return 'unknown' // 本机无记录（老数据/新装）
  return 'none'
}

/** apiBase 已收敛到 utils/config.js（v0.13.2） */

/**
 * 请求同步代理（/api/sync）。令牌不匹配/未配置等服务端错误会抛错（带服务端 message）。
 * 上传前做体积自检（与服务端上限一致），防止异常膨胀的数据刷爆自家 KV 配额。
 * @param {string} action 'check' | 'upload' | 'download'
 * @param {object} [payload]
 * @param {string} token
 */
export async function syncRequest(action, payload = {}, token) {
  const bodyStr = JSON.stringify({ action, ...payload })
  if (bodyStr.length > MAX_SNAPSHOT_BYTES) {
    throw new Error('本次要上传的数据量异常偏大（正常应在几百 KB 内），已中止以防误传。请先检查本机数据或导出备份排查。')
  }
  const resp = await fetch(`${apiBase()}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sync-Token': token },
    body: bodyStr,
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
