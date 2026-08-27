// Pages Functions 公共库（v0.13.2）：Origin 白名单 / CORS 头 / JSON 响应 / 访问令牌校验。
// 为什么存在：ask.js 与 sync.js 曾把这段逐行复制两份，换自定义域名必须双文件同步改，
// 漏改一侧就静默放行失败或拒绝正常请求。现在收敛到一处：
//   - 默认白名单在 DEFAULT_ALLOWED_ORIGINS；
//   - 临时追加域名用环境变量 ALLOWED_ORIGINS（逗号分隔），改环境变量即可、无需动代码。

export const DEFAULT_ALLOWED_ORIGINS = [
  'https://guitar-learning-assistant.pages.dev',
  'http://localhost:4174',
  'http://localhost:5173',
]

export function allowedOrigins(env) {
  const extra = String(env?.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra])]
}

/**
 * 取请求 Origin：在白名单内返回 origin 本身，不在返回 ''。
 * 白名单防的是浏览器跨站调用（脚本可伪造 Origin 但令牌层会继续拦截）。
 */
export function resolveOrigin(request, env) {
  const origin = request.headers.get('Origin') || ''
  return allowedOrigins(env).includes(origin) ? origin : ''
}

export function corsHeaders(origin, allowHeaders = ['Content-Type']) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': allowHeaders.join(', '),
  }
}

export function jsonResponse(data, status = 200, origin = '', allowHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin, allowHeaders) },
  })
}

async function sha256hex(str) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 恒时比较两个字符串（先各自 SHA-256 等长化再逐字节异或累积，
 * 消除 !==短路比较的理论 timing 泄露面）。Workers 环境 crypto.subtle 可用。
 */
export async function timingSafeEqualStr(a, b) {
  const [ha, hb] = await Promise.all([sha256hex(a), sha256hex(b)])
  let diff = ha.length ^ hb.length
  for (let i = 0; i < Math.max(ha.length, hb.length); i++) {
    diff |= (ha.charCodeAt(i % ha.length) || 0) ^ (hb.charCodeAt(i % hb.length) || 0)
  }
  return diff === 0
}

/**
 * 访问令牌校验统一入口。未配置令牌 fail-closed（503）宁可暂时用不了也不敞开额度。
 * @param {Request} request
 * @param {object} env
 * @param {{ header: string, envVar: string }} cfg header='X-Ask-Token'，envVar='ASK_TOKEN'
 * @returns {Promise<{status:number, code:string}|null>} null 表示通过
 */
export async function verifyToken(request, env, { header, envVar }) {
  const secret = env[envVar]
  if (!secret) return { status: 503, code: 'NO_TOKEN_CONFIG' }
  const got = request.headers.get(header) || ''
  const ok = got && (await timingSafeEqualStr(got, secret))
  if (!ok) return { status: 401, code: 'BAD_TOKEN' }
  return null
}
