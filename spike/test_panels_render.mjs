// 面板组件渲染冒烟（v0.6.2，v0.17.0 按写实面板重写断言）：用 Vue SSR 把 AmpPanel/GuitarPanel 渲染成字符串，
// 验证 SVG 输出无运行时错误、高亮/指针/值标签/LED 状态确实渲染。
// 用法: node spike/test_panels_render.mjs
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const appRequire = createRequire(path.resolve(process.cwd(), 'app/package.json'))
const { createSSRApp } = appRequire('vue')
const { renderToString } = appRequire('@vue/server-renderer')
const { compileScript, parse } = appRequire('@vue/compiler-sfc')

const { GUITARS, AMPS } = await import('../app/src/data/devices.js')

// import → require（SSR 沙箱里没有 ESM 加载器）
const toRequire = (s) =>
  s
    .replace(/import \{ ([^}]+) \} from ['"]([^'"]+)['"]/g, (m, names, mod) => {
      const fixed = names.replace(/(\w+) as (\w+)/g, '$1: $2') // import 别名 as → 解构 :
      return `const { ${fixed} } = require("${mod}")`
    })
    .replace(/import (\w+) from ['"]([^'"]+)['"]/g, 'const $1 = require("$2")')

function loadSFC(file) {
  const src = readFileSync(file, 'utf8')
  const { descriptor } = parse(src, { filename: file })
  // inlineTemplate：让 compileScript 内部完成模板编译与绑定解析（standalone compileTemplate 的
  // bindingMetadata 在 compiler-sfc 3.5 下不生效，会退化成 _ctx 引用）
  const script = compileScript(descriptor, { id: file, inlineTemplate: true })
  const scriptContent = toRequire(script.content)
    .replace('export default', 'const __sfc__ =')
    .replace('export { __sfc__ }', '')
  const code = `${scriptContent}\nmodule.exports = __sfc__`
  const mod = { exports: {} }
  new Function('exports', 'module', 'require', code)(mod.exports, mod, appRequire)
  return mod.exports
}

const AmpPanel = loadSFC('app/src/components/AmpPanel.vue')
const GuitarPanel = loadSFC('app/src/components/GuitarPanel.vue')

let pass = 0
let fail = 0
function check(name, cond) {
  if (cond) pass++
  else fail++
  console.log(`${cond ? '✓' : '✗'} ${name}`)
}

const amp = AMPS[0]
const guitar = GUITARS[0]

// 用「失真节奏 Riff」套路的值渲染（v0.6.3：双脚钉通道 + 实物箱模名；v0.17.0 双踏板 + LED 状态）
const tpl = { guitar: { pickup: '档位 5（琴桥双线圈）', tone: '6~7' }, amp: { channel: 'Rhythm 节奏', model: 'J800 Lo', gain: 6, eq: { b: 5, m: 5, t: 6 }, mod: '关', delay: '关', reverb: 'Hall 轻' } }
const step = amp.channelMap[tpl.amp.channel]
const ampValues = { channel: step.channel, driveMode: step.driveMode, model: tpl.amp.model, gain: tpl.amp.gain, 'eq.b': tpl.amp.eq.b, 'eq.m': tpl.amp.eq.m, 'eq.t': tpl.amp.eq.t, mod: tpl.amp.mod, delay: tpl.amp.delay, reverb: tpl.amp.reverb }

const ampHtml = await renderToString(createSSRApp({ components: { AmpPanel }, template: '<AmpPanel :panel="p" :values="v" :highlight="[\'channel\',\'model\',\'gain\',\'driveMode\']" />', data: () => ({ p: amp.panel, v: ampValues }) }))
check('AmpPanel 渲染出写实面板', ampHtml.includes('amp-panel'))
check('AmpPanel 渲染 10 个旋钮', (ampHtml.match(/class="knob( on)?"/g) || []).length === 10)
check('AmpPanel 渲染 2 个实体踏板', (ampHtml.match(/class="pedal( on)?"/g) || []).length === 2)
check('AmpPanel 渲染 LOOPER 功能区 + 2 个拨杆开关', (ampHtml.match(/class="pedal-func"/g) || []).length === 1 && (ampHtml.match(/class="sw"/g) || []).length === 2)
check('AmpPanel gain 高亮（值标签 6）', ampHtml.includes('val-chip') && /class="val-text">6<\/text>/.test(ampHtml))
check('AmpPanel model 值标签 J800 Lo', /class="val-text">J800 Lo<\/text>/.test(ampHtml))
check('AmpPanel CHANNEL 踏板值标签 DRIVE', /class="val-text">DRIVE<\/text>/.test(ampHtml))
check('AmpPanel DRIVE MODE 踏板值标签 RHYTHM', /class="val-text">RHYTHM<\/text>/.test(ampHtml))
check('AmpPanel 数值旋钮指示刻线 4 个（eq.b/m/t + gain）', (ampHtml.match(/knob-tick/g) || []).length === 4)
check('AmpPanel LED 随通道点亮 2 枚（DRIVE + RHYTHM）', (ampHtml.match(/led-lit/g) || []).length === 2)
check('AmpPanel LED 全灭态（无 channel 值）', !(await renderToString(createSSRApp({ components: { AmpPanel }, template: '<AmpPanel :panel="p" />', data: () => ({ p: amp.panel }) }))).includes('led-lit'))
check('AmpPanel interactive 可点（点击区 class）', (await renderToString(createSSRApp({ components: { AmpPanel }, template: '<AmpPanel :panel="p" interactive />', data: () => ({ p: amp.panel }) }))).includes('clickable'))

const guitarHtml = await renderToString(createSSRApp({ components: { GuitarPanel }, template: '<GuitarPanel :panel="p" :values="v" :highlight="[\'pickup\']" />', data: () => ({ p: guitar.panel, v: { pickup: '档位 5（琴桥双线圈）' } }) }))
check('GuitarPanel 渲染琴身', guitarHtml.includes('body-wood'))
check('GuitarPanel 档位高亮点 1 个（档位 5）', (guitarHtml.match(/sw-on/g) || []).length === 1)

// 范围档位（清音伴奏 1~3）
const guitarHtml2 = await renderToString(createSSRApp({ components: { GuitarPanel }, template: '<GuitarPanel :panel="p" :values="v" :highlight="[\'pickup\']" />', data: () => ({ p: guitar.panel, v: { pickup: '档位 1~3（琴颈/中间）' } }) }))
check('GuitarPanel 范围档位高亮 3 个（1~3）', (guitarHtml2.match(/sw-on/g) || []).length === 3)

// 音量旋钮也高亮（v0.6.4：琴两个旋钮 VOLUME/TONE，音量进 keyParams）
const guitarHtml4 = await renderToString(createSSRApp({ components: { GuitarPanel }, template: '<GuitarPanel :panel="p" :values="v" :highlight="[\'pickup\',\'volume\']" />', data: () => ({ p: guitar.panel, v: { pickup: '档位 5（琴桥双线圈）', volume: '8~9', tone: '6~7' } }) }))
check('GuitarPanel 音量旋钮红圈 1 个 + 档位红圈（volume 高亮）', (guitarHtml4.match(/hl-ring/g) || []).length === 2)

// 不高亮时不应有红圈
const guitarHtml3 = await renderToString(createSSRApp({ components: { GuitarPanel }, template: '<GuitarPanel :panel="p" :values="v" />', data: () => ({ p: guitar.panel, v: { pickup: '档位 5（琴桥双线圈）' } }) }))
check('GuitarPanel 无高亮时无红圈', !guitarHtml3.includes('hl-ring'))

console.log(`\n结果：${pass}/${pass + fail} 项通过（${fail} 项失败）`)
process.exit(fail > 0 ? 1 : 0)
