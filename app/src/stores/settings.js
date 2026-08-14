import { defineStore } from 'pinia'
import { load, save } from '../utils/storage'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    reminders: load('reminders', { enabled: false, time: '20:00' }),
    activeDevices: load('active-devices', {
      guitarId: 'ibanez-grx40-lgy',
      ampId: 'joyo-jam-buddy-2',
    }),
  }),
  actions: {
    saveReminders() {
      save('reminders', this.reminders)
    },
    saveActiveDevices() {
      save('active-devices', this.activeDevices)
    },
  },
})
