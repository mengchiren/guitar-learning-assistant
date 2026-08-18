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
