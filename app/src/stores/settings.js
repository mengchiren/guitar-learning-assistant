import { defineStore } from 'pinia'
import { load, save } from '../utils/storage.js'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    reminders: load('reminders', { enabled: false, time: '20:00' }),
    activeDevices: load('active-devices', {
      guitarId: 'ibanez-grx40-lgy',
      ampId: 'joyo-jam-buddy-2',
    }),
    // 设备建议显示方式：beginner = 参数速览 + 大白话操作流程；full = 全部参数表
    displayMode: load('display-mode', 'beginner'),
  }),
  actions: {
    saveReminders() {
      save('reminders', this.reminders)
    },
    saveActiveDevices() {
      save('active-devices', this.activeDevices)
    },
    saveDisplayMode() {
      save('display-mode', this.displayMode)
    },
  },
})
