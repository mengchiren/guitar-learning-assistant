// 本地持久化抽象层。
// M1 先用 localStorage；后续接入云端同步（Supabase）时只需替换这里的实现，业务代码不受影响。
const PREFIX = 'gla:v1:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}
