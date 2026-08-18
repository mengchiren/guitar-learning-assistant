import { defineStore } from 'pinia'
import { load, save } from '../utils/storage'

// 可切换的模型平台（先接 DeepSeek，其余按需配 Key 即用）
export const AI_PROVIDERS = [
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'ark', label: '豆包（火山方舟）' },
  { id: 'qwen', label: '通义千问（百炼）' },
]

// 本地开发时请求线上 Functions（本地 vite 不跑 Functions）；生产同源直连
function apiBase() {
  return import.meta.env.DEV ? 'https://guitar-learning-assistant.pages.dev' : ''
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    provider: load('ai-provider', 'deepseek'),
    history: load('ai-history', []), // [{ role, content, provider, at }]
    // AI 访问令牌（防刷）：Cloudflare 环境变量 ASK_TOKEN 里的值，首次使用时填入，存本机
    token: load('ask-token', ''),
    busy: false,
    error: '',
  }),
  actions: {
    setProvider(id) {
      this.provider = id
      save('ai-provider', id)
    },
    setToken(t) {
      this.token = (t || '').trim()
      save('ask-token', this.token)
    },
    // contextText：页面内入口带来的上下文（歌曲/练习数据），随本次提问一起发给模型
    async send(text, contextText = '') {
      if (!text.trim() || this.busy) return
      if (!this.token) {
        this.error = '请先填写 AI 访问令牌（页面顶部输入框，值见验收指南「配访问令牌」一节）。'
        return
      }
      this.error = ''
      this.busy = true
      const messages = [...this.history.slice(-18), { role: 'user', content: text }]
      this.history.push({ role: 'user', content: text, provider: this.provider, at: Date.now() })
      try {
        const resp = await fetch(`${apiBase()}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Ask-Token': this.token },
          body: JSON.stringify({
            provider: this.provider,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            contextText,
          }),
        })
        const data = await resp.json().catch(() => ({}))
        if (data.ok) {
          this.history.push({ role: 'assistant', content: data.reply, provider: this.provider, at: Date.now() })
        } else if (data.code === 'NO_TOKEN_CONFIG' || data.code === 'BAD_TOKEN') {
          this.error = `${data.error || '访问令牌问题'}：令牌在 Cloudflare 后台环境变量 ASK_TOKEN 里，重新部署后填到本页顶部。`
        } else {
          this.error = data.code === 'NO_KEY' ? `${this.provider} 的 API Key 还没配置（Cloudflare 后台环境变量），换一个平台或先配置 Key。` : (data.error || '请求失败，请稍后再试')
        }
      } catch {
        this.error = '网络异常，请稍后再试'
      }
      this.busy = false
      this.persist()
    },
    clear() {
      this.history = []
      this.persist()
    },
    persist() {
      // 只保留最近 50 条，防止历史无限增长撑满 localStorage
      this.history = this.history.slice(-50)
      save('ai-history', this.history)
    },
  },
})

// 页面内入口把上下文放进 sessionStorage（跨路由传递，用完即清）
export function stashAskContext(text) {
  sessionStorage.setItem('gla:v1:ask-context', text)
}

export function takeAskContext() {
  const v = sessionStorage.getItem('gla:v1:ask-context')
  if (v) sessionStorage.removeItem('gla:v1:ask-context')
  return v || ''
}
