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
// v0.13.2：公共代码（Origin/CORS/JSON/令牌恒时比较）收敛到 _lib.js；
// 上传快照加体积上限（2MB，正常个人数据几百 KB 量级），防持令牌的异常/恶意负载刷配额；
// 上传的 data 必须是普通对象。
//
// action 说明：
//   upload   → body { app, backupVersion?, data, updatedAt, deviceId }；写入 KV，返回 { ok, updatedAt }
//   download → 读 KV，返回 { ok, empty?, data?, updatedAt?, deviceId? }（无数据时 empty: true）
//   check    → 只读版本信息，返回 { ok, empty?, updatedAt?, deviceId? }（不返回 data）

import { jsonResponse as json, corsHeaders, resolveOrigin, verifyToken } from '../_lib.js'

const ALLOW_HEADERS = ['Content-Type', 'X-Sync-Token']

// 快照体积上限（序列化后字符数）。KV 单值上限 25MB，这里收紧到 2MB：
// 正常个人数据在几百 KB 内，超限视为异常负载，直接拒绝保护带宽与配额。
const MAX_UPLOAD_CHARS = 2 * 1024 * 1024

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

  // 访问令牌校验：未配置 SYNC_TOKEN 时拒绝服务（宁可暂时用不了，也不敞开数据读写）
  const badToken = await verifyToken(request, env, { header: 'X-Sync-Token', envVar: 'SYNC_TOKEN' })
  if (badToken) {
    const msg =
      badToken.code === 'NO_TOKEN_CONFIG'
        ? '同步功能未启用（服务端未配置令牌）'
        : '同步令牌不正确'
    return json({ ok: false, code: badToken.code, error: msg }, badToken.status, origin)
  }

  // KV 绑定必须存在（Cloudflare Pages 控制台绑定命名空间，变量名 SYNC_KV）
  const kv = env.SYNC_KV
  if (!kv) {
    return json({ ok: false, error: '同步存储未配置（KV 绑定缺失）' }, 503, origin)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: '请求体不是 JSON' }, 400, origin)
  }

  const action = body.action
  try {
    if (action === 'upload') {
      if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
        return json({ ok: false, error: '快照数据格式不对（data 必须是对象）' }, 400, origin)
      }
      const snapshot = {
        app: 'guitar-learning-assistant',
        backupVersion: body.backupVersion || 1,
        data: body.data || {},
        updatedAt: body.updatedAt || new Date().toISOString(),
        deviceId: body.deviceId || 'unknown',
      }
      const raw = JSON.stringify(snapshot)
      if (raw.length > MAX_UPLOAD_CHARS) {
        return json({ ok: false, error: '快照超过大小上限（异常数据），已拒绝写入' }, 413, origin)
      }
      await kv.put('sync:snapshot', raw)
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

    return json({ ok: false, error: '未知 action' }, 400, origin)
  } catch (err) {
    console.error('[sync] KV 读写失败:', err?.message || err)
    return json({ ok: false, error: '同步存储读写失败' }, 500, origin)
  }
}
