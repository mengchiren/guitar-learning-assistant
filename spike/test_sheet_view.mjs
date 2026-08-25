// 课件式谱面渲染冒烟（v0.12.0）：用 Vue SSR 把 SheetScore 渲染成字符串，
// 验证谱头卡/小节网格/技巧徽章/旧格式兼容都正常输出，无运行时错误。
// 用法: node spike/test_sheet_view.mjs
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const appRequire = createRequire(path.resolve(process.cwd(), 'app/package.json'))
const { createSSRApp } = appRequire('vue')
const { renderToString } = appRequire('@vue/server-renderer')
const { compileScript, parse } = appRequire('@vue/compiler-sfc')

const { SEED_SHEETS } = await import('../app/src/data/songSheets.js')

// —— SFC 加载沙箱：import → require；相对路径按 SFC 所在目录解析；.vue 子组件递归预加载 ——
const sfcCache = {}
function resolveMod(mod, dir) {
  // 生成代码里的路径用正斜杠：双引号字符串中 \ 会被当转义吃掉
  return mod.startsWith('.') ? path.resolve(dir, mod).replaceAll('\\', '/') : mod
}
function toRequire(s, dir) {
  return s
    .replace(/import \{ ([^}]+) \} from ['"]([^'"]+)['"]/g, (m, names, mod) => {
      const fixed = names.replace(/(\w+) as (\w+)/g, '$1: $2')
      return `const { ${fixed} } = require("${resolveMod(mod, dir)}")`
    })
    .replace(/import (\w+) from ['"]([^'"]+)['"]/g, (m, name, mod) => `const ${name} = require("${resolveMod(mod, dir)}")`)
}
function sfcRequire(id) {
  if (id.endsWith('.vue')) return sfcCache[id]
  return appRequire(id)
}
function loadSFC(file) {
  file = file.replaceAll('\\', '/') // 缓存 key / require 统一正斜杠
  if (sfcCache[file]) return sfcCache[file]
  const src = readFileSync(file, 'utf8')
  const { descriptor } = parse(src, { filename: file })
  // inlineTemplate：compileScript 内部完成模板编译与绑定解析
  const script = compileScript(descriptor, { id: file, inlineTemplate: true })
  // 先递归预加载子 .vue 组件（require 时直接取缓存）
  for (const m of script.content.matchAll(/import\s+\w+\s+from\s+['"]([^'"]+\.vue)['"]/g)) {
    loadSFC(path.resolve(path.dirname(file), m[1]).replaceAll('\\', '/'))
  }
  const code = toRequire(script.content, path.dirname(file))
    .replace('export default', 'const __sfc__ =')
    .replace('export { __sfc__ }', '')
  const mod = { exports: {} }
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', 'require', `${code}\nmodule.exports = __sfc__`)(mod.exports, mod, sfcRequire)
  sfcCache[file] = mod.exports
  return mod.exports
}

const SheetScore = loadSFC('app/src/components/SheetScore.vue')
// 预加载子组件（ChordChart → chords.js 会被 require 缓存，无需二次处理）

let pass = 0
let fail = 0
function check(name, cond) {
  if (cond) pass++
  else fail++
  console.log(`${cond ? '✓' : '✗'} ${name}`)
}

// —— 新格式（毕业曲 rich sheet） ——
const gradSheet = SEED_SHEETS['meng-de-chukou']
const html = await renderToString(createSSRApp({ components: { SheetScore }, template: '<SheetScore :sheet="sheet" />', data: () => ({ sheet: gradSheet }) }))

check('谱头卡渲染速度 ♩ = 75', html.includes('♩ = 75'))
check('谱头卡渲染拍号 4/4', html.includes('>4/4<'))
check('谱头卡渲染调弦 Standard', html.includes('>Standard<'))
check('谱头卡渲染调性 G 大调', html.includes('>G 大调<'))
check('谱头卡渲染和弦图（Cmaj7 指法图）', html.includes('Cmaj7') && (html.match(/chord-chart/g) || []).length >= 4)
check('分段渲染 4 段', (html.match(/class="tag">前奏|class="tag">清音旋律|class="tag">失真 Riff|class="tag">主旋律/g) || []).length === 4)
check('段落音色标签 清音 / 失真', html.includes('>清音<') && html.includes('>失真<'))
check('小节网格渲染 16 格', (html.match(/sheet-bar/g) || []).length >= 16)
check('技巧徽章 P.M. 渲染', html.includes('>P.M.<'))
check('技巧徽章 let ring 渲染', html.includes('>let ring<'))
check('技巧徽章 滑音/推弦 渲染', html.includes('>滑音<') && html.includes('>推弦<'))
check('节奏符号 〜 / × 渲染', html.includes('〜') && html.includes('×'))
check('节奏图例提示渲染', html.includes('节奏符号：↓ 下拨'))
check('小节备注（第 1-4 小节）渲染', html.includes('第 1-4 小节'))
check('riff 小节样式类存在', html.includes('sheet-bar riff'))

// —— 旧格式兼容（seiza 无 meta，chords 字符串）——
const legacy = SEED_SHEETS['seiza']
const html2 = await renderToString(createSSRApp({ components: { SheetScore }, template: '<SheetScore :sheet="sheet" />', data: () => ({ sheet: legacy }) }))
check('旧格式渲染和弦字符串', html2.includes('Dbmaj7 Cm7 Bm7 Bbm7'))
check('旧格式无谱头卡', !html2.includes('sheet-meta'))
check('旧格式渲染指法图行（chord-row）', html2.includes('chord-row') && html2.includes('chord-chart'))
check('旧格式段备注渲染', html2.includes('半音下行'))

console.log(`\n结果：${pass}/${pass + fail} 项通过（${fail} 项失败）`)
process.exit(fail > 0 ? 1 : 0)
