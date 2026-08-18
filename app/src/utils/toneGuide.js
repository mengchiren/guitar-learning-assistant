// 把套路模板翻译成新手友好的内容（v0.6.0 设备声明式化）：
// 1) 参数速览（keyParams）；2) 大白话操作流程（按设备 params 顺序）；3) 其余可先不动的参数。
// 设备有哪些旋钮、标签、满格值由 data/devices.js 的 params/keyParams 声明——
// 新增设备只改数据，本文件逻辑不动；设备未声明某参数则自动跳过。

/**
 * @param {object} tpl 套路模板（data/templates.js）
 * @param {{ guitar: object, amp: object }} [devices] 当前设备（data/devices.js 的 GUITARS/AMPS 项）
 * @returns {{ params: Array<{label: string, value: string}>, steps: string[], fineTune: string[] }}
 */
export function beginnerGuide(tpl, { guitar, amp } = {}) {
  const gParams = guitar?.params || []
  const aParams = amp?.params || []
  const gKey = guitar?.keyParams || []
  const aKey = amp?.keyParams || []

  const isOff = (v) => !v || v === '关'

  // 取模板值：guitar 侧 tpl.guitar[field]；amp 侧 tpl.amp[field]（eq 特殊）
  const valueOf = (side, field) => {
    const src = side === 'guitar' ? tpl.guitar : tpl.amp
    if (!src) return undefined
    if (field === 'eq') return src.eq
    if (field.startsWith('eq.')) return src.eq?.[field.slice(3)]
    return src[field]
  }

  const paramValue = (side, p) => {
    const v = valueOf(side, p.field)
    // 通道：显示脚钉语义（如「DRIVE → RHYTHM」），一眼知道该按哪个脚钉
    if (side === 'amp' && p.field === 'channel' && amp?.channelMap?.[v]) {
      const step = amp.channelMap[v]
      return step.driveMode ? `${step.channel} → ${step.driveMode}` : step.channel
    }
    if (p.kind === 'gain') return `${v} / ${p.max}`
    return String(v ?? '')
  }

  // 步骤文案（按设备参数顺序；eq/effect 不进步骤，进 fineTune）。
  // 通道可能返回多行（JAM BUDDY 2 双脚钉：CHANNEL 选 CLEAN/DRIVE，DRIVE MODE 选 RHYTHM/LEAD）
  const stepFor = (side, p) => {
    const v = valueOf(side, p.field)
    if (side === 'guitar') {
      return p.kind === 'pickup' ? `琴：拾音器拨杆拨到「${v}」` : `琴：音色旋钮拧到「${v}」`
    }
    switch (p.kind) {
      case 'button': {
        const step = amp?.channelMap?.[v]
        if (step) {
          const lines = [
            `音箱：CHANNEL 脚钉按到「${step.channel}」${step.channel === 'CLEAN' ? '（清音）' : '（失真）'}`,
          ]
          if (step.driveMode) {
            lines.push(`音箱：DRIVE MODE 脚钉按到「${step.driveMode}」${step.driveMode === 'RHYTHM' ? '（节奏）' : '（主音）'}`)
          }
          return lines
        }
        return `音箱：按下「${v}」通道按钮`
      }
      case 'gain':
        return `音箱：Gain 增益旋钮拧到「${v}」（满格是 ${p.max}）`
      case 'knob':
        return `音箱：${p.label}旋钮转到「${v}」`
      default:
        return null // eq / effect 归 fineTune
    }
  }

  // 可先不动（非速览参数）：eq 三合一、开关型效果（on/off 完整文案在设备数据里）、其余旋钮
  const fineFor = (side, p) => {
    const v = valueOf(side, p.field)
    if (side === 'guitar') return `琴：音色旋钮拧到「${v}」`
    if (p.on || p.off) return isOff(v) ? (p.off || '').replace('%s', v) : (p.on || '').replace('%s', v)
    if (p.kind === 'eq') return `音箱：EQ 三个旋钮 → 低音 ${v.b} · 中音 ${v.m} · 高音 ${v.t}`
    return `音箱：${p.label}调到「${v}」`
  }

  // 参数速览：keyParams 顺序（琴在前、音箱在后）
  const params = []
  for (const f of gKey) {
    const p = gParams.find((x) => x.field === f)
    if (p) params.push({ label: p.label, value: paramValue('guitar', p) })
  }
  for (const f of aKey) {
    const p = aParams.find((x) => x.field === f)
    if (p) params.push({ label: p.label, value: paramValue('amp', p) })
  }

  // 操作步骤：keyParams 顺序（琴在前、音箱在后；eq/effect 等无步骤文案的自动跳过）
  const steps = []
  for (const f of gKey) {
    const p = gParams.find((x) => x.field === f)
    const s = p && stepFor('guitar', p)
    if (s) steps.push(...(Array.isArray(s) ? s : [s]))
  }
  for (const f of aKey) {
    const p = aParams.find((x) => x.field === f)
    const s = p && stepFor('amp', p)
    if (s) steps.push(...(Array.isArray(s) ? s : [s]))
  }

  // 可先不动：keyParams 之外的全部参数（on/off 完整文案在设备数据里）
  const fineTune = []
  for (const p of gParams) {
    if (!gKey.includes(p.field)) fineTune.push(fineFor('guitar', p))
  }
  for (const p of aParams) {
    if (!aKey.includes(p.field)) fineTune.push(fineFor('amp', p))
  }

  return { params, steps, fineTune }
}
