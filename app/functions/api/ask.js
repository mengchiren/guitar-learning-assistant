// AI 答疑代理（Cloudflare Pages Functions，路由 POST /api/ask）。
// 为什么需要它：纯前端 PWA 直连大模型 API 会泄露 API Key（网页代码人人可看）。
// Key 只存在 Cloudflare 控制台的环境变量里（AI_KEY_DEEPSEEK / AI_KEY_ARK / AI_KEY_QWEN），
// 本文件永远不出现真实 Key，环境变量也不进 git。
//
// 防盗刷（v0.5.0 评审修复）：Origin 白名单只能防「浏览器」跨站调用，挡不住 curl/脚本
// 直连（可伪造或不带 Origin），所以再加一层访问令牌：环境变量 ASK_TOKEN 存随机密钥
// （只配一次），应用内「AI 答疑」页首次使用时填入（存本机 localStorage），每次请求带
// X-Ask-Token 头。更严格的按 IP 限流需要自定义域名 + Cloudflare 限流规则（免费域名配不了）。
//
// v0.13.2：Origin/CORS/JSON/令牌校验抽到 _lib.js（与 sync.js 共用一份）；
// 令牌改恒时比较；上游错误原文不再回传客户端（只记服务端日志），避免暴露供应商细节。
//
// 三平台都是 OpenAI 兼容的 chat/completions 格式，一张表切换：
//   deepseek  → https://api.deepseek.com/chat/completions
//   ark（火山方舟）→ https://ark.cn-beijing.volces.com/api/v3/chat/completions（model 填 endpoint id，环境变量 AI_MODEL_ARK）
//   qwen（阿里百炼）→ https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions

import { jsonResponse as json, corsHeaders, resolveOrigin, verifyToken } from '../_lib.js'

const ALLOW_HEADERS = ['Content-Type', 'X-Ask-Token']

const PROVIDERS = {
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    keyEnv: 'AI_KEY_DEEPSEEK',
  },
  ark: {
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    modelEnv: 'AI_MODEL_ARK', // 方舟的 model 是接入点 id（ep-xxx），单独环境变量
    keyEnv: 'AI_KEY_ARK',
  },
  qwen: {
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-plus',
    keyEnv: 'AI_KEY_QWEN',
  },
}

const SYSTEM_PROMPT = `你是「练琴搭子」应用里的电吉他学习助手。用户是零基础初学者，设备是依班娜 GRX40 电吉他 + JOYO Jam Buddy 2 音箱。
回答要求：中文、大白话、按步骤组织（一步步能照着做）；针对电吉他；建议要具体（练什么、几遍、目标速度）；不要展开无关内容；默认简洁，除非用户要求详细。如果用户没有指定歌曲，可以结合上下文里给的歌曲/练习数据回答。`

export async function onRequestOptions({ request, env }) {
  const origin = resolveOrigin(request, env)
  if (!origin) return new Response(null, { status: 403 })
  return new Response(null, { status: 204, headers: corsHeaders(origin, ALLOW_HEADERS) })
}

export async function onRequestPost({ request, env }) {
  const origin = resolveOrigin(request, env)
  if (!origin) {
    return json({ ok: false, error: '请求来源不被允许' }, 403, origin)
  }

  // 访问令牌校验：未配置 ASK_TOKEN 时拒绝服务，配置了但令牌不匹配也拒绝——
  // 宁可暂时用不了，也不敞开额度。
  const badToken = await verifyToken(request, env, { header: 'X-Ask-Token', envVar: 'ASK_TOKEN' })
  if (badToken) {
    const msg =
      badToken.code === 'NO_TOKEN_CONFIG'
        ? '服务端还没配置访问令牌，请先在 Cloudflare 后台配置后再使用'
        : '访问令牌不对，请在应用里重新填写'
    return json({ ok: false, code: badToken.code, error: msg }, badToken.status, origin)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: '请求格式不对' }, 400, origin)
  }

  const provider = PROVIDERS[body.provider]
  if (!provider) return json({ ok: false, error: '未知的模型平台' }, 400, origin)

  const key = env[provider.keyEnv]
  if (!key) {
    return json(
      { ok: false, code: 'NO_KEY', provider: body.provider, error: `${body.provider} 平台的 Key 还没配置，先换一个模型或稍后再试` },
      503,
      origin,
    )
  }

  const model = provider.model || env[provider.modelEnv]
  if (!model) return json({ ok: false, code: 'NO_MODEL', error: '模型未配置' }, 503, origin)

  // 输入护栏：只收 20 条以内的文本消息，每条不超过 4000 字
  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : []
  if (!messages.length) return json({ ok: false, error: '没有消息内容' }, 400, origin)
  for (const m of messages) {
    if (typeof m.content !== 'string' || m.content.length > 4000) return json({ ok: false, error: '消息太长' }, 400, origin)
    if (m.role !== 'user' && m.role !== 'assistant') return json({ ok: false, error: '消息角色不合法' }, 400, origin)
  }

  const contextText = typeof body.contextText === 'string' ? body.contextText.slice(0, 2000) : ''

  const payload = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + (contextText ? `\n【用户当前的学习数据】\n${contextText}` : '') },
      ...messages,
    ],
    max_tokens: 1500,
    temperature: 0.7,
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 25000) // 上游 25 秒无响应就放弃
    const resp = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!resp.ok) {
      const text = await resp.text()
      console.error(`[ask] 上游 ${provider.url} 返回 ${resp.status}:`, text.slice(0, 300))
      // 错误详情只进服务端日志，不回传客户端（避免泄露供应商信息）
      return json({ ok: false, error: `模型服务暂时不可用（${resp.status}），请稍后再试` }, 502, origin)
    }
    const data = await resp.json()
    const reply = data.choices?.[0]?.message?.content || ''
    return json({ ok: true, reply, model }, 200, origin)
  } catch (e) {
    console.error('[ask] 请求上游失败:', e?.message || e)
    return json({ ok: false, error: '请求模型服务失败，请稍后再试' }, 502, origin)
  }
}
