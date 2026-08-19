import { defineStore } from 'pinia'
import { load } from '../utils/storage.js'

export const useSettingsStore = defineStore('settings', {
  // v0.6.0：状态变更自动持久化（persist 插件），不再手动 save
  persist: [
    { key: 'reminders', paths: ['reminders'] },
    { key: 'active-devices', paths: ['activeDevices'] },
    { key: 'display-mode', paths: ['displayMode'] },
    { key: 'theme', paths: ['themeId'] },
    { key: 'glass', paths: ['glass'] },
  ],
  state: () => ({
    reminders: load('reminders', { enabled: false, time: '20:00' }),
    activeDevices: load('active-devices', {
      guitarId: 'ibanez-grx40-lgy',
      ampId: 'joyo-jam-buddy-2',
    }),
    // 设备建议显示方式：beginner = 参数速览 + 大白话操作流程；full = 全部参数表
    displayMode: load('display-mode', 'beginner'),
    // 外观主题（v0.7.0）：data/themes.js 的 id；classic 为默认
    themeId: load('theme', 'classic'),
    // 透明毛玻璃（v0.7.1）：开启后卡片/顶栏半透明 + 背景模糊，背景插画更透
    glass: load('glass', false),
  }),
})
