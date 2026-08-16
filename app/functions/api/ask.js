// AI 答疑代理（Cloudflare Pages Functions，路由 POST /api/ask）。
// 为什么需要它：纯前端 PWA 直连大模型 API 会泄露 API Key（网页代码人人可看）。
// Key 只存在 Cloudflare 控制台的环境变量里（AI_KEY_DEEPSEEK / AI_KEY_ARK / AI_KEY_QWEN），
// 本文件永远不出现真实 Key，环境变量也不进 git。
//
// 三平台都是 OpenAI 兼容的 chat/completions 格式，一张表切换：
//   deepseek  → https://api.deepseek.com/chat/completions
//   ark（火山方舟）→ https://ark.cn-beijing.volces.com/api/v3/chat/completions（model 填 endpoint id，环境变量 AI_MODEL_ARK）
//   qwen（阿里百炼）→ https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
//
// 限流策略（个人站轻量版）：max_tokens 上限 + 请求体大小上限 + 单条消息长度上限；
// 更严格的按 IP 限流可后续加 Cloudflare Rate Limiting 规则（控制台免费额度）。

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

const CORS = {
  'Access-Control-Allow-Origin': '*', // 本地开发（localhost:4174）跨域调线上 Functions 用；生产同源不受影响
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: '请求格式不对' }, 400)
  }

  const provider = PROVIDERS[body.provider]
  if (!provider) return json({ ok: false, error: '未知的模型平台' }, 400)

  const key = env[provider.keyEnv]
  if (!key) {
    return json({ ok: false, code: 'NO_KEY', provider: body.provider, error: '这个平台的 API Key 还没配置（需要在 Cloudflare 后台设置环境变量）' }, 503)
  }

  const model = provider.model || env[provider.modelEnv]
  if (!model) return json({ ok: false, code: 'NO_MODEL', error: '模型未配置' }, 503)

  // 输入护栏：只收 20 条以内的文本消息，每条不超过 4000 字
  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : []
  if (!messages.length) return json({ ok: false, error: '没有消息内容' }, 400)
  for (const m of messages) {
    if (typeof m.content !== 'string' || m.content.length > 4000) return json({ ok: false, error: '消息太长' }, 400)
    if (m.role !== 'user' && m.role !== 'assistant') return json({ ok: false, error: '消息角色不合法' }, 400)
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
    const resp = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) {
      const text = await resp.text()
      return json({ ok: false, error: `模型服务返回 ${resp.status}`, detail: text.slice(0, 300) }, 502)
    }
    const data = await resp.json()
    const reply = data.choices?.[0]?.message?.content || ''
    return json({ ok: true, reply, model })
  } catch (e) {
    return json({ ok: false, error: '请求模型服务失败，请稍后再试' }, 502)
  }
}
