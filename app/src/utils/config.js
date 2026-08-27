// 运行环境相关的少量全局配置（v0.13.2 收敛：此前 chat.js / sync.js 各写一份 apiBase）。
// 本地 dev 不跑 CF Pages Functions，接口请求指向线上；生产同源直连。
export function apiBase() {
  return import.meta.env?.DEV ? 'https://guitar-learning-assistant.pages.dev' : ''
}
