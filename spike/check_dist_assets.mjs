// 生产构建产物守卫（v0.13.2，CI 跑）：
// ①dist 里出现 .mjs/.wasm 即失败——workbox 的 globPatterns 只收 js/css/html/svg/
//   woff2/webp/jpg/png，这两类后缀的资源会游离在 SW 预缓存之外（断网拉不到；
//   pdf.worker 曾踩过 .mjs 这个坑，见 HANDOFF 坑 45），守在这里防复发；
// ②缺 index.html/sw.js/manifest 任一关键入口即失败；
// ③打印后缀分布与总体积（观察 preache 体积趋势的粗信号）。
// 用法：node spike/check_dist_assets.mjs <dist 目录>（默认 app/dist）

import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] || 'app/dist'
if (!existsSync(dir)) {
  console.error(`✗ 找不到构建产物目录 ${dir}`)
  process.exit(1)
}

const FORBIDDEN_EXTS = ['.mjs', '.wasm']
const REQUIRED_FILES = ['index.html', 'sw.js', 'manifest.webmanifest']

/** @type {Record<string, number>} 后缀 → 文件数 */
const byExt = {}
let totalBytes = 0

function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      walk(p)
      continue
    }
    const dot = name.lastIndexOf('.')
    const ext = dot >= 0 ? name.slice(dot) : '(无后缀)'
    byExt[ext] = (byExt[ext] || 0) + 1
    totalBytes += st.size
    if (FORBIDDEN_EXTS.includes(ext)) {
      console.error(`✗ globPatterns 未覆盖的后缀混入产物: ${p.replace(/\\/g, '/')}（HANDOFF 坑 45 复发风险）`)
      process.exitCode = 1
    }
  }
}

walk(dir)

for (const f of REQUIRED_FILES) {
  if (!existsSync(join(dir, f))) {
    console.error(`✗ 缺少关键入口文件 ${f}`)
    process.exitCode = 1
  }
}

console.log('产物后缀分布:', JSON.stringify(byExt))
console.log(`产物文件总体积: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
process.exit(process.exitCode || 0)
