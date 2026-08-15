<script setup>
import Icon from '../components/Icon.vue'
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()

function toggleDisplayMode() {
  settings.displayMode = settings.displayMode === 'beginner' ? 'full' : 'beginner'
  settings.saveDisplayMode()
}
</script>

<template>
  <div>
    <h1 class="page-title">我的</h1>
    <div class="profile-grid">
      <router-link to="/devices" class="card row-card">
        <span class="row-icon"><Icon name="guitar" :size="22" /></span>
        <div>
          <div>我的设备</div>
          <div class="dim small">Ibanez GRX40 + JOYO Jam Buddy 2</div>
        </div>
      </router-link>
      <router-link to="/reminders" class="card row-card">
        <span class="row-icon"><Icon name="bell" :size="22" /></span>
        <div>
          <div>提醒设置</div>
          <div class="dim small">练琴提醒 · 打卡</div>
        </div>
      </router-link>
      <router-link to="/templates" class="card row-card">
        <span class="row-icon"><Icon name="sliders" :size="22" /></span>
        <div>
          <div>音色套路库</div>
          <div class="dim small">5 套常用音色设置</div>
        </div>
      </router-link>
    </div>
    <div class="card">
      <div class="switch-row">
        <div>
          <div class="small" style="font-weight: 600">新手模式（设备建议）</div>
          <div class="dim small">参数速览 + 大白话操作流程；关掉后显示全部参数表</div>
        </div>
        <button
          class="switch"
          :class="{ on: settings.displayMode === 'beginner' }"
          @click="toggleDisplayMode"
        >
          <span class="knob"></span>
        </button>
      </div>
      <p class="muted small" style="margin-top: 8px">影响歌曲详情页与音色套路库的参数展示。</p>
    </div>
    <div class="card">
      <h2>关于</h2>
      <p class="muted small">
        练琴搭子 M1~M2：设备档案、音色套路、节拍器、调音器、练琴打卡与提醒、歌曲分析与设备建议。
        数据目前保存在本机浏览器；多端云同步在后续版本接入。
        学习计划见需求文档（M3）。
      </p>
    </div>
  </div>
</template>

<style scoped>
.profile-grid { display: grid; }
.row-card { display: flex; gap: 12px; align-items: center; text-decoration: none; color: var(--text); font-weight: 600; }
.row-icon { display: flex; color: var(--text-dim); }

@media (min-width: 768px) {
  .profile-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .profile-grid .card { margin-bottom: 0; }
}
</style>
