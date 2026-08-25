// 云同步代理（Cloudflare Pages Functions，路由 POST /api/sync）。
// 单用户结构化数据全量快照同步（v0.11.0）：
//   - 存储：Cloudflare KV 绑定（环境变量名 SYNC_KV，绑定命名空间同步名 SYNC_KV），
//     单 key `sync:snapshot` 存最新快照（JSON：{ app, backupVersion, data, updatedAt, deviceId }）。
//   - 鉴权：与 /api/ask 同款访问令牌——环境变量 SYNC_TOKEN 存随机密钥（只配一次），
//     应用内「数据同步」卡首次使用时填入，每次请求带 X-Sync-Token 头；未配置令牌时拒绝服务
//     （fail-closed）。Key 不进代码包，脚本无法从网页源码拿到。
//   - 前端约定：全量快照 + 最后写入胜出 + 打开时自动检查（direction 决策在前端做，
//     上传前/下载前用户确认方向——服务端只做存储与读回，无业务逻辑）。
//
// action 说明：
//   upload   → body { app, backupVersion?, data, updatedAt, deviceId }；写入 KV，返回 { ok, updatedAt }
//   download → 读 KV，返回 { ok, empty?, data?, updatedAt?, deviceId? }（无数据时 empty: true）
//   check    → 只读版本信息，返回 { ok, empty?, updatedAt?, deviceId? }（不返回 data）

// 来源白名单：与 ask.js 保持一致（新域名/新端口记得同步加）
const ALLOWED_ORIGINS = [
  'https://guitar-learning-assistant.pages.dev',
  'http://localhost:4174',
  'http://localhost:5173',
]

const CORS = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Token',
})

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS(origin) },
  })
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || ''
  if (!ALLOWED_ORIGINS.includes(origin)) return new Response(null, { status: 403 })
  return new Response(null, { status: 204, headers: CORS(origin) })
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || ''
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return json({ ok: false, error: '请求来源不被允许' }, 403)
  }

  // 访问令牌校验：未配置 SYNC_TOKEN 时拒绝服务（宁可暂时用不了，也不敞开数据读写）
  const syncToken = env.SYNC_TOKEN
  if (!syncToken) {
    return json({ ok: false, error: '同步功能未启用（服务端未配置 SYNC_TOKEN）' }, 503)
  }
  const auth = request.headers.get('X-Sync-Token') || ''
  if (auth !== syncToken) {
    return json({ ok: false, error: '同步令牌不正确' }, 401)
  }

  // KV 绑定必须存在（Cloudflare Pages 控制台绑定命名空间，变量名 SYNC_KV）
  const kv = env.SYNC_KV
  if (!kv) {
    return json({ ok: false, error: '同步存储未配置（KV 绑定 SYNC_KV 缺失）' }, 503)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: '请求体不是 JSON' }, 400)
  }

  const action = body.action
  try {
    if (action === 'upload') {
      const snapshot = {
        app: 'guitar-learning-assistant',
        backupVersion: body.backupVersion || 1,
        data: body.data || {},
        updatedAt: body.updatedAt || new Date().toISOString(),
        deviceId: body.deviceId || 'unknown',
      }
      await kv.put('sync:snapshot', JSON.stringify(snapshot))
      return json({ ok: true, updatedAt: snapshot.updatedAt })
    }

    if (action === 'download' || action === 'check') {
      const raw = await kv.get('sync:snapshot')
      if (!raw) return json({ ok: true, empty: true })
      const snap = JSON.parse(raw)
      const out = {
        ok: true,
        empty: false,
        updatedAt: snap.updatedAt,
        deviceId: snap.deviceId,
      }
      if (action === 'download') out.data = snap.data || {}
      return json(out)
    }

    return json({ ok: false, error: '未知 action' }, 400)
  } catch (err) {
    return json({ ok: false, error: '同步存储读写失败' }, 500)
  }
}
