<script setup>
import { ref, computed } from 'vue'
import { useSettingsStore } from '../stores/settings.js'

const settings = useSettingsStore()
const notifStatus = ref('')

// 提醒时间用「时/分」两个下拉选择，避免部分浏览器 time 输入框弹不出选择器
const remHour = computed(() => Number(settings.reminders.time.split(':')[0]))
const remMinute = computed(() => Number(settings.reminders.time.split(':')[1]))

function setHour(v) {
  settings.reminders.time = `${String(v).padStart(2, '0')}:${String(remMinute.value).padStart(2, '0')}`
}
function setMinute(v) {
  settings.reminders.time = `${String(remHour.value).padStart(2, '0')}:${String(v).padStart(2, '0')}`
}

async function requestNotif() {
  if (!('Notification' in window)) {
    notifStatus.value = '此浏览器不支持系统通知'
    return
  }
  const p = await Notification.requestPermission()
  notifStatus.value = p === 'granted' ? '✅ 系统通知已授权' : '系统通知未授权（应用内提醒仍可用）'
}
</script>

<template>
  <div class="narrow">
    <h1 class="page-title">提醒设置</h1>
    <div class="card">
      <div class="switch-row">
        <div>
          <div class="small" style="font-weight: 600">每日练琴提醒</div>
          <div class="dim small">每天固定时间提醒练琴</div>
        </div>
        <button
          class="switch"
          :class="{ on: settings.reminders.enabled }"
          @click="settings.reminders.enabled = !settings.reminders.enabled"
        >
          <span class="knob"></span>
        </button>
      </div>
      <div v-if="settings.reminders.enabled" class="time-pick">
        <label>提醒时间</label>
        <div class="time-selects">
          <select :value="remHour" aria-label="提醒小时" @change="setHour(Number($event.target.value))">
            <option v-for="h in 24" :key="h" :value="String(h - 1).padStart(2, '0')">{{ String(h - 1).padStart(2, '0') }}</option>
          </select>
          <span class="dim">时</span>
          <select :value="remMinute" aria-label="提醒分钟" @change="setMinute(Number($event.target.value))">
            <option v-for="m in 12" :key="m" :value="String((m - 1) * 5).padStart(2, '0')">{{ String((m - 1) * 5).padStart(2, '0') }}</option>
          </select>
          <span class="dim">分</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>提醒方式说明（M1）</h2>
      <p class="muted small">
        当前版本：应用打开时（首页）会检查提醒时间，到点且今天还没练，会显示「到点啦」提示。
        系统级推送与微信推送（推送加）将在后续版本接入，届时不打开应用也能收到提醒。
      </p>
      <button class="btn btn-block" style="margin-top: 10px" @click="requestNotif">请求系统通知权限</button>
      <p v-if="notifStatus" class="small" style="margin-top: 8px">{{ notifStatus }}</p>
    </div>
  </div>
</template>

<style scoped>
.time-selects { display: flex; align-items: center; gap: 8px; }
.time-selects select { width: 84px; }
.time-selects span { flex: none; }
</style>
