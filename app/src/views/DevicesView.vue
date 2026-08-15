<script setup>
import { GUITARS, AMPS } from '../data/devices'
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()

function selectGuitar(id) {
  settings.activeDevices.guitarId = id
  settings.saveActiveDevices()
}
function selectAmp(id) {
  settings.activeDevices.ampId = id
  settings.saveActiveDevices()
}
</script>

<template>
  <div>
    <h1 class="page-title">我的设备</h1>
    <p class="muted small" style="margin-bottom: 12px">
      音色建议会按选中的设备生成。以后换琴换音箱，在这里录入即可。
    </p>

    <div class="device-grid">
      <div
        v-for="g in GUITARS"
        :key="g.id"
        class="card device-card"
        :class="{ selected: settings.activeDevices.guitarId === g.id }"
        @click="selectGuitar(g.id)"
      >
        <div class="device-head">
          <div>
            <div class="device-name">{{ g.name }}</div>
            <div class="dim small">{{ g.pickups }}</div>
          </div>
          <span v-if="settings.activeDevices.guitarId === g.id" class="tag on">使用中</span>
        </div>
        <div class="small" style="margin-top: 8px"><b>5 档拾音器</b></div>
        <div v-for="p in g.switchPositions" :key="p.pos" class="small dim" style="margin-top: 4px">
          {{ p.pos }} 档：{{ p.label }} —— {{ p.use }}
        </div>
        <div class="small" style="margin-top: 8px"><b>旋钮</b>：{{ g.knobs.join(' / ') }}</div>
        <div v-for="t in g.tips" :key="t" class="muted small" style="margin-top: 4px">{{ t }}</div>
      </div>

      <div
        v-for="a in AMPS"
        :key="a.id"
        class="card device-card"
        :class="{ selected: settings.activeDevices.ampId === a.id }"
        @click="selectAmp(a.id)"
      >
        <div class="device-head">
          <div>
            <div class="device-name">{{ a.name }}</div>
            <div class="dim small">通道：{{ a.channels.join(' / ') }}</div>
          </div>
          <span v-if="settings.activeDevices.ampId === a.id" class="tag on">使用中</span>
        </div>
        <div class="small" style="margin-top: 8px"><b>箱头模拟</b>：{{ a.ampModels.join('、') }} 等（以说明书为准）</div>
        <div class="small" style="margin-top: 4px"><b>EQ</b>：{{ a.eq.join(' / ') }}</div>
        <div class="small" style="margin-top: 4px">
          <b>效果</b>：MOD（{{ a.mods.join(' / ') }}）；Delay（{{ a.delays.join(' / ') }}）；Reverb（{{ a.reverbs.join(' / ') }}）
        </div>
        <div class="small" style="margin-top: 4px"><b>附加</b>：{{ a.extras.join('、') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.device-grid { display: grid; }
.device-card { cursor: pointer; }
.device-card.selected { border-color: var(--accent); }
.device-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.device-name { font-size: 16px; font-weight: 700; }

@media (min-width: 768px) {
  .device-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; align-items: start; }
  .device-grid .card { margin-bottom: 0; }
}
</style>
