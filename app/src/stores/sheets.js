import { defineStore } from 'pinia'
import { load } from '../utils/storage.js'
import { SEED_SHEETS } from '../data/songSheets.js'

// 曲谱：种子曲谱（只读，人工整理）+ 用户自录曲谱（localStorage，优先显示）。
// 谱子为个人学习笔记，仅存本地浏览器，无分享/公开功能。
export const useSheetsStore = defineStore('sheets', {
  // v0.6.0：状态变更自动持久化（persist 插件），不再手动 save
  persist: { key: 'user-sheets', paths: ['userSheets'] },
  state: () => ({
    // { songId: { sections: [{ name, chords, pattern, note }] } }
    userSheets: load('user-sheets', {}),
  }),
  getters: {
    // 返回 { sheet, isUser } 或 null（无谱）
    sheetOf() {
      return (songId) => {
        if (this.userSheets[songId]) return { sheet: this.userSheets[songId], isUser: true }
        if (SEED_SHEETS[songId]) return { sheet: SEED_SHEETS[songId], isUser: false }
        return null
      }
    },
  },
  actions: {
    saveSheet(songId, sections) {
      this.userSheets[songId] = { sections }
    },
    removeSheet(songId) {
      delete this.userSheets[songId]
    },
  },
})
