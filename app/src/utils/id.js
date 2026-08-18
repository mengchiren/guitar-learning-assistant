// 全局唯一 ID（v0.6.0）：优先 crypto.randomUUID（HTTPS/localhost 安全上下文可用），
// 不可用时回退时间戳 + 随机数。替代原先各处拼的 Date.now() 风格 id（多标签页可能撞号）。
export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
