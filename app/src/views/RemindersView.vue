<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()
const notifStatus = ref('')

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
          @click="settings.reminders.enabled = !settings.reminders.enabled; settings.saveReminders()"
        >
          <span class="knob"></span>
        </button>
      </div>
      <label v-if="settings.reminders.enabled">提醒时间</label>
      <input
        v-if="settings.reminders.enabled"
        type="time"
        v-model="settings.reminders.time"
        @change="settings.saveReminders()"
      />
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
