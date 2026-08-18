<script setup>
import { ref } from 'vue'
import Icon from '../components/Icon.vue'
import { useSettingsStore } from '../stores/settings.js'
import { downloadBackup, parseBackup, restoreBackup } from '../utils/backup.js'

const settings = useSettingsStore()

function toggleDisplayMode() {
  settings.displayMode = settings.displayMode === 'beginner' ? 'full' : 'beginner'
}

// ---- 数据备份/恢复（v0.5.0）：结构化数据导出 JSON 文件，可恢复 ----
const restoreInput = ref(null)
const backupMsg = ref('')
const restoring = ref(false)

function onExport() {
  try {
    downloadBackup()
    backupMsg.value = '备份文件已下载（练琴搭子备份-日期.json），请收好它。'
  } catch (e) {
    backupMsg.value = '导出失败：' + (e?.message || '未知错误')
  }
  setTimeout(() => (backupMsg.value = ''), 6000)
}

function onPickRestoreFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const backup = parseBackup(String(reader.result))
      if (!window.confirm(`将用备份文件覆盖当前全部数据（${Object.keys(backup.data).length} 项），确定恢复？`)) return
      restoring.value = true
      const n = restoreBackup(backup)
      backupMsg.value = `已恢复 ${n} 项数据，页面即将刷新…`
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      backupMsg.value = '恢复失败：' + (err?.message || '文件格式不对')
      restoring.value = false
    }
  }
  reader.onerror = () => {
    backupMsg.value = '读取文件失败'
  }
  reader.readAsText(f)
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
      <h2>数据备份</h2>
      <p class="muted small" style="margin-bottom: 10px">
        打卡记录、歌单、曲谱、课程进度、聊天记录都存在本机浏览器，清理缓存会全部丢失。建议定期导出备份文件。
        （录音体积大，不在备份范围。）
      </p>
      <div class="btn-row">
        <button class="btn btn-primary" @click="onExport">导出备份文件</button>
        <button class="btn" :disabled="restoring" @click="restoreInput?.click()">{{ restoring ? '恢复中…' : '从备份恢复' }}</button>
        <input ref="restoreInput" type="file" accept=".json,application/json" style="display: none" @change="onPickRestoreFile" />
      </div>
      <p v-if="backupMsg" class="small" style="color: var(--accent-dark); margin-top: 8px">{{ backupMsg }}</p>
    </div>
    <div class="card">
      <h2>关于</h2>
      <p class="muted small">
        练琴搭子 M1~M3：设备档案、音色套路、节拍器、调音器、练琴打卡与提醒、歌曲分析与设备建议、学习计划、曲谱与和弦图库。
        数据目前保存在本机浏览器；多端云同步在后续版本接入。
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
