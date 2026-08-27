// v0.13.2 最小错误观测：全局渲染 / Promise / 脚本异常写入本机环形缓冲（最多 20 条）。
// 只存本机 localStorage、不出设备、永不上云（不得加入 SYNC_KEYS 白名单）。
// 手机 PWA 没有 DevTools，之前报错是黑洞——至少用户能点开横幅看到发生了什么、
// 能一键复制给开发者。

const KEY = 'gla:v1:error-log'
const MAX_ITEMS = 20
const MAX_MSG_LEN = 240

let listeners = []

function load() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function getErrors() {
  return load()
}

export function clearErrors() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 配额等异常忽略，缓冲只是辅助观测 */
  }
}

/** 错误新增/清理时通知订阅者（参数传最新一条或 null）。 */
export function onLogChange(cb) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((f) => f !== cb)
  }
}

function notify(latest) {
  for (const cb of listeners.slice()) cb(latest)
}

function push(kind, message) {
  let item
  try {
    const list = load()
    item = {
      at: Date.now(),
      kind,
      msg: String(message || '').slice(0, MAX_MSG_LEN),
    }
    // 同消息 60 秒内去重刷时间戳，避免循环报错刷爆缓冲
    if (!(list[0] && list[0].msg === item.msg && item.at - list[0].at < 60000)) {
      list.unshift(item)
      list.length = Math.min(list.length, MAX_ITEMS)
      localStorage.setItem(KEY, JSON.stringify(list))
    }
  } catch {
    /* 存不进去就算了，观测不能反过来引发新错误 */
  }
  notify(item)
}

function unwrapReason(reason) {
  if (!reason) return String(reason)
  return reason.message || reason.reason?.message || String(reason)
}

/**
 * 全局兜底注册：应用入口调一次。
 * 未捕获异常仍保持控制台原有行为，这里只是旁路记录。
 */
export function initErrorCapture(app) {
  app.config.errorHandler = (err, _instance, info) => {
    console.error('[error] Vue 渲染异常:', err, info)
    push('render', err?.message ? `${err.message}` : `${info}: ${String(err)}`)
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('unhandledrejection', (e) => {
      push('promise', unwrapReason(e.reason))
    })
    window.addEventListener('error', (e) => {
      if (e.message) push('script', e.message)
    })
  }
}
