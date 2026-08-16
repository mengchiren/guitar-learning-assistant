<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FUNDAMENTALS } from '../data/fundamentals.js'
import { usePlanStore } from '../stores/plan'
import { useMetronomeStore } from '../stores/metronome'
import ChordChart from '../components/ChordChart.vue'
import FretboardMap from '../components/FretboardMap.vue'

const route = useRoute()
const router = useRouter()
const planStore = usePlanStore()
const metro = useMetronomeStore()

const item = computed(() => FUNDAMENTALS.find((f) => f.id === route.params.id) || null)
const done = computed(() => (item.value ? Boolean(planStore.basicsDone[item.value.id]) : false))

function openMetronome() {
  if (!item.value) return
  metro.bpm = item.value.bpm || 60
  router.push('/metronome')
}
</script>

<template>
  <div class="narrow">
    <template v-if="item">
      <h1 class="page-title">{{ item.name }}</h1>

      <div class="card">
        <p class="small">{{ item.desc }}</p>
        <p class="small" style="margin-top: 8px">
          <b>达标标准</b>：{{ item.goal }}
        </p>
        <div class="btn-row" style="margin-top: 12px">
          <button class="btn btn-primary" @click="openMetronome">
            用目标速度开节拍器（{{ item.bpm }} BPM）
          </button>
          <button class="btn" :class="{ ok: done }" @click="planStore.toggleBasic(item.id)">
            {{ done ? '✓ 已达标（点此撤销）' : '标记已达标' }}
          </button>
        </div>
      </div>

      <div class="card">
        <h2>任务分解</h2>
        <div v-for="(t, i) in item.tasks" :key="t.title" class="task">
          <span class="task-num">{{ i + 1 }}</span>
          <div>
            <div class="task-title">{{ t.title }}</div>
            <div class="muted small">{{ t.detail }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>图示</h2>
        <div v-if="item.visuals.type === 'chords'" class="chord-row">
          <ChordChart v-for="c in item.visuals.chords" :key="c" :name="c" />
        </div>
        <div v-else-if="item.visuals.type === 'strum'" class="strum-box">
          <div class="strum-pattern">
            <span v-for="(p, i) in item.visuals.pattern" :key="i" class="strum-beat">{{ p }}</span>
          </div>
          <p class="dim small" style="margin-top: 8px">↓ = 下拨，↑ = 上拨。按顺序循环，跟着节拍器数拍。</p>
        </div>
        <div v-else-if="item.visuals.type === 'spider'">
          <FretboardMap :position="item.visuals.position || 1" />
        </div>
      </div>
    </template>

    <template v-else>
      <h1 class="page-title">练习项不存在</h1>
      <router-link to="/plan" class="btn btn-block">回计划页</router-link>
    </template>
  </div>
</template>

<style scoped>
.btn.ok { color: var(--ok); border-color: var(--ok); }
.task { display: flex; gap: 10px; margin-bottom: 12px; }
.task:last-child { margin-bottom: 0; }
.task-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); color: #fff;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex: none; margin-top: 1px;
}
.task-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }

.chord-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.strum-box { text-align: center; }
.strum-pattern { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.strum-beat {
  font-size: 20px; font-weight: 700; color: var(--accent);
  background: var(--bg-input); border-radius: 8px; padding: 6px 12px;
  white-space: pre;
}
</style>
