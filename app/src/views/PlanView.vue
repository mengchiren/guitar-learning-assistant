<script setup>
import { ref, computed } from 'vue'
import { usePlanStore } from '../stores/plan.js'
import { useSongsStore, effectiveSong } from '../stores/songs.js'
import Icon from '../components/Icon.vue'

const planStore = usePlanStore()
const songsStore = useSongsStore()

const plan = computed(() => planStore.plan)
// 进入页面时：上周练得少默认给 10 分钟档，其余默认 30；之后尊重用户手动切换
const tier = ref(plan.value.mode === 'reduce' ? '10' : '30')

const items = computed(() => plan.value.packs[tier.value] || [])
const totalMinutes = computed(() => items.value.reduce((a, i) => a + i.minutes, 0))

const kindLabel = { basic: '基本功', song: '歌曲', review: '复习' }

function songTitle(id) {
  const s = songsStore.byId(id)
  return s ? s.title : '未知歌曲'
}

function onToggle(item) {
  if (item.kind === 'basic') planStore.toggleBasic(item.ref)
  if (item.kind === 'song') {
    const st = planStore.songStatus[item.ref]?.state
    planStore.setSongStatus(item.ref, st === 'mastered' ? 'practicing' : 'mastered')
  }
}
</script>

<template>
  <div>
    <h1 class="page-title">学习计划</h1>

    <div class="card week-card">
      <div class="week-line">
        <span class="week-num">{{ plan.week.days }}</span>
        <span class="dim small">/ {{ plan.week.goalDays }} 天 · 本周目标</span>
        <span class="week-min dim small">{{ Math.floor(plan.week.totalSeconds / 60) }} 分钟</span>
      </div>
      <p v-if="plan.tierNote" class="tier-note">{{ plan.tierNote }}</p>
      <p v-else class="muted small">
        建议根据你的打卡记录与完成标记自动生成，规则透明：每项下面写了「为什么」。
      </p>
    </div>

    <div class="tag-row tier-switch">
      <span
        v-for="t in ['10', '30', '60']"
        :key="t"
        class="tag"
        :class="{ on: tier === t }"
        @click="tier = t"
      >
        {{ t }} 分钟
      </span>
      <span class="tier-total dim small">合计约 {{ totalMinutes }} 分钟</span>
    </div>

    <div v-for="item in items" :key="item.kind + item.ref" class="card plan-item" :class="{ done: item.done }">
      <div class="item-head">
        <div class="item-title">
          <span class="tag tag-kind">{{ kindLabel[item.kind] }}</span>
          <span class="item-name">
            <router-link v-if="item.kind === 'song'" :to="`/songs/${item.ref}`" class="song-link">
              {{ item.title }}
            </router-link>
            <router-link v-else-if="item.kind === 'basic'" :to="`/plan-item/basic/${item.ref}`" class="song-link">
              {{ item.title }}
            </router-link>
            <template v-else>{{ item.title }}</template>
          </span>
          <span class="tag item-min">{{ item.minutes }} 分钟</span>
        </div>
        <button
          v-if="item.kind !== 'review'"
          class="check-btn"
          :class="{ on: item.done }"
          :aria-label="item.done ? `取消完成${item.title}` : `标记完成${item.title}`"
          @click="onToggle(item)"
        >
          <Icon :name="item.done ? 'check-circle' : 'circle'" :size="22" />
        </button>
      </div>
      <p v-if="item.desc" class="small" style="margin-top: 6px">{{ item.desc }}</p>
      <p class="small" style="margin-top: 4px"><b>达标标准</b>：{{ item.goal }}</p>
      <p class="why muted small">为什么：{{ item.why }}</p>
    </div>

    <div class="entry-grid">
      <router-link to="/stats" class="card row-card">
        <span class="row-icon"><Icon name="chart" :size="22" /></span>
        <div>
          <div>统计报表</div>
          <div class="dim small">周报 · 月度热力图 · 清单状态</div>
        </div>
      </router-link>
      <router-link to="/course" class="card row-card">
        <span class="row-icon"><Icon name="book" :size="22" /></span>
        <div>
          <div>课程进度</div>
          <div class="dim small">成田三套课 · 学到第几课</div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.week-card { display: flex; flex-direction: column; gap: 6px; }
.week-line { display: flex; align-items: baseline; gap: 8px; }
.week-num { font-size: 30px; font-weight: 800; color: var(--accent); }
.week-min { margin-left: auto; font-weight: 600; }
.tier-note { font-size: 14px; color: var(--accent-dark); }
.tier-switch { align-items: center; }
.tier-total { margin-left: auto; }

.plan-item.done { border-color: var(--ok); background: #fbfdfb; }
.item-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.item-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tag-kind { font-size: 12px; }
.item-name { font-size: 16px; font-weight: 700; }
.item-min { font-size: 12px; }
.song-link { color: inherit; text-decoration: none; border-bottom: 1px dashed var(--border); }
.why { margin-top: 6px; opacity: 0.8; }
.check-btn {
  flex: none; background: none; border: none; padding: 2px;
  color: var(--text-dim); cursor: pointer;
}
.check-btn.on { color: var(--ok); }

.entry-grid { display: grid; }
.row-card { display: flex; gap: 12px; align-items: center; text-decoration: none; color: var(--text); font-weight: 600; margin-bottom: 0; }
.row-icon { display: flex; color: var(--text-dim); }

@media (min-width: 768px) {
  .entry-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
}
</style>
