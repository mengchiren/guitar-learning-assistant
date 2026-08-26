import { defineStore } from 'pinia'
import { load, save } from '../utils/storage.js'
import { DEFAULT_WALLPAPER, normalizeWallpaper } from '../utils/wallpaper.js'

// v0.10.0：DeepSeek 极简成为默认主题。旧「经典瑞士军刀」选择迁移到新默认
// （用户明确选过 classic 的概率极低——它就是旧默认；仍可在主题卡里手动切回）
function loadThemeId() {
  const v = load('theme', 'dsh')
  if (v === 'classic') {
    save('theme', 'dsh')
    return 'dsh'
  }
  return v
}

export const useSettingsStore = defineStore('settings', {
  // v0.6.0：状态变更自动持久化（persist 插件），不再手动 save
  persist: [
    { key: 'reminders', paths: ['reminders'] },
    { key: 'active-devices', paths: ['activeDevices'] },
    { key: 'display-mode', paths: ['displayMode'] },
    { key: 'theme', paths: ['themeId'] },
    { key: 'glass', paths: ['glass'] },
    { key: 'mascot', paths: ['mascotEnabled'] },
    { key: 'dark-mode', paths: ['darkMode'] },
    { key: 'wallpaper', paths: ['wallpaper'] },
  ],
  state: () => ({
    reminders: load('reminders', { enabled: false, time: '20:00' }),
    activeDevices: load('active-devices', {
      guitarId: 'ibanez-grx40-lgy',
      ampId: 'joyo-jam-buddy-2',
    }),
    // 设备建议显示方式：beginner = 参数速览 + 大白话操作流程；full = 全部参数表
    displayMode: load('display-mode', 'beginner'),
    // 外观主题（v0.7.0）：data/themes.js 的 id；v0.10.0 起默认 dsh（DeepSeek 极简）
    themeId: loadThemeId(),
    // 透明毛玻璃（v0.7.1）：开启后卡片/顶栏半透明 + 背景模糊，背景插画更透
    glass: load('glass', false),
    // 看板娘开关（v0.7.2）：false 时主题配置了看板娘也不显示
    mascotEnabled: load('mascot', true),
    // 深色模式（v0.10.0）：system = 跟随系统；light/dark = 强制浅/深
    // 仅「DeepSeek 极简」主题实现了深色变量，其他主题忽略此设置
    darkMode: load('dark-mode', 'system'),
    // 背景壁纸（v0.13.0）：mode = theme（主题默认背景）/ image / video；
    // 自定义时含 wallpaperId（指 gla-wallpapers 里的 id）+ 模糊/亮度/遮罩浓度。
    // 壁纸文件只存本机 IndexedDB，不入 SYNC_KEYS（与录音同级），不随云同步跨设备。
    wallpaper: normalizeWallpaper(load('wallpaper', DEFAULT_WALLPAPER)),
  }),
})
