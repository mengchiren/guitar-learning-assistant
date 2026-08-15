// 把套路模板翻译成新手友好的内容：
// 1) 参数速览（最关键的 4 项）；2) 大白话操作流程（一步步照做）；3) 其余可先不动的参数。

const isOff = (v) => !v || v === '关'

export function beginnerGuide(tpl) {
  const g = tpl.guitar
  const a = tpl.amp
  const eq = `低音 ${a.eq.b} · 中音 ${a.eq.m} · 高音 ${a.eq.t}`

  return {
    // 参数速览：先给具体参数，方便对照音箱面板
    params: [
      { label: '琴·档位', value: g.pickup },
      { label: '通道', value: a.channel },
      { label: '箱模', value: a.model },
      { label: 'Gain', value: `${a.gain} / 10` },
    ],
    // 大白话操作流程：照着一步步做就能出声
    steps: [
      `琴：拾音器拨杆拨到「${g.pickup}」`,
      `音箱：按下「${a.channel}」通道按钮`,
      `音箱：箱模旋钮转到「${a.model}」`,
      `音箱：Gain 增益旋钮拧到「${a.gain}」（满格是 10）`,
    ],
    // 新手可先不动：弹起来觉得不对再照着调
    fineTune: [
      `琴：音色旋钮拧到「${g.tone}」`,
      `音箱：EQ 三个旋钮 → ${eq}`,
      isOff(a.mod) ? '音箱：MOD 效果保持关' : `音箱：MOD 开「${a.mod}」`,
      isOff(a.delay) ? '音箱：Delay 延迟保持关' : `音箱：Delay 开「${a.delay}」`,
      `音箱：Reverb 混响开「${a.reverb}」`,
    ],
  }
}
