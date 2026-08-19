<script setup>
// 音箱入门（v0.6.2）：JAM BUDDY 2 面板全景图解——点任意旋钮/脚钉看它是干嘛的。
// 解决零基础「找不到旋钮、看不懂英文标签、不知道多功能按压」的问题。
// 数据全部来自 devices.js 的 panel（坐标/说明），新设备只改数据。
import { ref, computed } from 'vue'
import { AMPS, GUITARS } from '../data/devices.js'
import { TONE_TEMPLATES } from '../data/templates.js'
import AmpPanel from '../components/AmpPanel.vue'
import GuitarPanel from '../components/GuitarPanel.vue'

const amp = AMPS[0]
const guitar = GUITARS[0]

// 套路通道 → 脚钉操作文案（与 toneGuide 的 channelMap 一致）
function channelLabel(v) {
  const step = amp.channelMap?.[v]
  if (!step) return v
  return step.driveMode ? `${step.channel} → ${step.driveMode}` : step.channel
}

// 点按选中的旋钮/脚钉说明
const selected = ref(null)
function onSelect(field) {
  const knob = amp.panel.knobs.find((k) => k.field === field)
  const foot = amp.panel.foots.find((f) => f.id === field)
  if (knob) {
    selected.value = { title: knob.label, note: knob.note, isFoot: false }
  } else if (foot) {
    selected.value = { title: foot.label, note: foot.note, isFoot: true }
  }
}

// 所有可图解项（入门页列表用）
const items = computed(() => [
  ...amp.panel.knobs.map((k) => ({ field: k.field, title: k.label, note: k.note, isFoot: false })),
  ...amp.panel.foots.map((f) => ({ field: f.id, title: f.label, note: f.note, isFoot: true })),
])
</script>

<template>
  <div class="narrow">
    <h1 class="page-title">音箱入门</h1>

    <div class="card">
      <h2>{{ amp.name }} · 面板图解</h2>
      <p class="muted small" style="margin-bottom: 8px">
        点下面面板上的任意旋钮/脚钉，看它是干什么的。红点 = 按下去有第二个功能（新手最容易漏）。
      </p>
      <div class="panel-scroll">
        <div class="panel-wrap">
          <AmpPanel :panel="amp.panel" interactive @select="onSelect" />
        </div>
      </div>
      <div v-if="selected" class="guide-box">
        <div class="guide-title">
          <span class="tag" :class="{ on: !selected.isFoot }">{{ selected.isFoot ? '脚钉' : '旋钮' }}</span>
          <b>{{ selected.title }}</b>
        </div>
        <p class="small" style="margin-top: 6px">{{ selected.note }}</p>
      </div>
      <p v-else class="muted small">还没点任何东西——点上面面板试试。</p>
    </div>

    <div class="card">
      <h2>每个旋钮/脚钉是干嘛的</h2>
      <div v-for="it in items" :key="it.field" class="list-row">
        <span class="tag" :class="{ on: !it.isFoot }">{{ it.isFoot ? '脚钉' : '旋钮' }}</span>
        <div>
          <div class="small" style="font-weight: 600">{{ it.title }}</div>
          <div class="dim small">{{ it.note }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>音色套路对照表（6 套）</h2>
      <p class="muted small" style="margin-bottom: 8px">练歌时先在歌曲详情页看套路名，再照这一行调。</p>
      <div class="tpl-table">
        <div class="tpl-row tpl-head">
          <span>套路</span><span>通道（脚钉）</span><span>箱模</span><span>Gain</span>
        </div>
        <div v-for="t in TONE_TEMPLATES" :key="t.id" class="tpl-row">
          <span class="tpl-name">{{ t.name }}</span>
          <span>{{ channelLabel(t.amp.channel) }}</span>
          <span>{{ t.amp.model }}</span>
          <span>{{ t.amp.gain }} / 10</span>
        </div>
      </div>
      <p class="muted small" style="margin-top: 8px">
        <b>通道怎么按？</b>CHANNEL 脚钉先选 CLEAN（清音）或 DRIVE（失真）；选了 DRIVE 的话，再用 DRIVE MODE 脚钉选 RHYTHM（节奏）或 LEAD（主音）。
        <b>Gain 旋钮是哪个？</b>标着 <b>Gain / Quit</b> 的旋钮；箱模是标着 <b>Amp / Ch.Volume</b> 的旋钮（转动循环选 14 种）。
      </p>
    </div>

    <div class="card">
      <h2>14 种箱体模拟对照表</h2>
      <p class="muted small" style="margin-bottom: 8px">
        转动「Amp / Ch.Volume」旋钮循环选择；名字带 <b>od</b> 的是过载推子版（更冲）。
      </p>
      <div v-for="m in amp.ampModels" :key="m" class="list-row">
        <span class="tag">{{ m }}</span>
        <div class="dim small">{{ amp.modelNotes[m] }}</div>
      </div>
    </div>

    <div class="card">
      <h2>还不会用？</h2>
      <p class="muted small">
        抖音 / B 站搜「JAM BUDDY 2 教学」有保姆级实操视频（照着拨一遍比看图更直观）；
        中文名「JOYO JAM BUDDY II 保姆级教学」也能搜到。图示旋钮位置以你手上的实物为准。
      </p>
    </div>
  </div>
</template>

<style scoped>
.panel-scroll { overflow-x: auto; padding-bottom: 4px; }
.panel-wrap { min-width: 540px; }

.guide-box {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  background: var(--accent-soft);
}
.guide-title { display: flex; align-items: center; gap: 8px; }

.list-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.list-row .tag { flex: none; }
.list-row:last-child { margin-bottom: 0; }

.tpl-table { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.tpl-row { display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr; gap: 6px; padding: 8px 10px; font-size: 13px; }
.tpl-row + .tpl-row { border-top: 1px solid var(--border); }
.tpl-head { background: var(--bg-input); font-weight: 700; color: var(--text-dim); font-size: 12px; }
.tpl-name { font-weight: 700; }
</style>
