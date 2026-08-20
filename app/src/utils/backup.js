// 数据备份/恢复（v0.5.0 评审修复）：
// 全部结构化数据（localStorage 里 gla:v1:* 前缀的 key）导出为 JSON 文件，可一键恢复。
// 录音（IndexedDB blob）体量大，不在备份范围——丢录音可重录，丢打卡/歌单/曲谱才是真损失。
// 备份文件带版本号，后续存储 schema 升级时可据此做迁移。

import { save } from './storage.js'
import { localDateStr } from './date.js'

const PREFIX = 'gla:v1:'
const BACKUP_VERSION = 1

/**
 * 收集全部备份数据。
 * 遍历 localStorage 里所有本应用前缀的 key（自动覆盖未来新增的 store，不用维护清单）。
 */
export function collectBackup() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(PREFIX)) continue
    const raw = localStorage.getItem(key)
    if (raw === null) continue
    try {
      data[key.slice(PREFIX.length)] = JSON.parse(raw)
    } catch {
      // 单条数据损坏：跳过，不阻塞整个备份
    }
  }
  return {
    app: 'guitar-learning-assistant',
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

/** 导出并触发浏览器下载备份文件 */
export function downloadBackup() {
  const payload = JSON.stringify(collectBackup(), null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `练琴搭子备份-${localDateStr()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 解析并校验备份文件内容；格式不对会抛错 */
export function parseBackup(text) {
  let obj
  try {
    obj = JSON.parse(text)
  } catch {
    throw new Error('文件不是有效的 JSON')
  }
  if (!obj || obj.app !== 'guitar-learning-assistant' || typeof obj.data !== 'object' || obj.data === null) {
    throw new Error('不是「练琴搭子」的备份文件')
  }
  return obj
}

/**
 * 恢复备份数据，返回恢复的条目数。
 * 语义是「覆盖」：先清空本应用全部 key（含备份里没有的新 key），再写入备份数据——
 * 旧备份恢复进新版本应用不会得到两种状态的混合。
 * 注意：调用后应立即刷新页面，让各 store 重新读取；本函数会先等 ~250ms
 * 让 persist 插件挂起的防抖写入落地（旧值，随后被清空），避免恢复后被旧内存态写回。
 */
export async function restoreBackup(backup) {
  // 等挂起的 persist 防抖写入（≤150ms）先落地，随后统一清空覆盖
  await new Promise((r) => setTimeout(r, 250))
  // 清空全部本应用 key（含备份里没有的）
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(PREFIX)) keys.push(key)
  }
  for (const key of keys) localStorage.removeItem(key)
  // 写入备份数据
  const data = backup.data || {}
  let count = 0
  for (const [key, value] of Object.entries(data)) {
    save(key, value)
    count++
  }
  return count
}
