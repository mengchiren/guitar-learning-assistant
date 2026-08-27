// 本地时区日期工具（YYYY-MM-DD）。
// 注意：不要用 toISOString()（那是 UTC），中国时区凌晨会差一天。
// 全工程统一从这里取日期，不要再各自实现 localDateStr/todayStr。
export function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 按天平移日期（返回 YYYY-MM-DD）
export function shiftDate(base, delta) {
  const d = new Date(base)
  d.setDate(d.getDate() + delta)
  return localDateStr(d)
}

// 两种时长格式（v0.13.2 收敛，此前五处各自实现）：
// fmtClock = 'mm:ss'（练习计时/顶栏胶囊/录音秒表）；fmtDuration = 'X 分 Y 秒'（列表展示时长）
export function fmtClock(total) {
  const t = Math.max(0, Math.floor(total || 0))
  const m = String(Math.floor(t / 60)).padStart(2, '0')
  const s = String(t % 60).padStart(2, '0')
  return `${m}:${s}`
}

// 保持与原视图内实现一致的语义：分钟向下取整、秒四舍五入
export function fmtDuration(total) {
  total = Number(total) || 0
  const m = Math.floor(total / 60)
  const s = Math.round(total % 60)
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`
}
