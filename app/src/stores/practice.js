import { defineStore } from 'pinia'
import { load } from '../utils/storage.js'
import { localDateStr, shiftDate } from '../utils/date.js'
import { newId } from '../utils/id.js'

export const usePracticeStore = defineStore('practice', {
  // v0.6.0：状态变更自动持久化（persist 插件），不再手动 save
  persist: { key: 'practice-records', paths: ['records'] },
  state: () => ({
    // record: { id, date: 'YYYY-MM-DD', seconds, tags: [], note }
    records: load('practice-records', []),
  }),
  getters: {
    todaySeconds: (s) =>
      s.records.filter((r) => r.date === localDateStr()).reduce((sum, r) => sum + r.seconds, 0),
    streakDays(s) {
      const dates = new Set(s.records.map((r) => r.date))
      let streak = 0
      let cursor = dates.has(localDateStr()) ? 0 : 1 // 今天没练则从昨天开始数
      while (dates.has(shiftDate(new Date(), -cursor))) {
        streak++
        cursor++
      }
      return streak
    },
    last7Days(s) {
      const out = []
      for (let i = 6; i >= 0; i--) {
        const date = shiftDate(new Date(), -i)
        const seconds = s.records
          .filter((r) => r.date === date)
          .reduce((sum, r) => sum + r.seconds, 0)
        out.push({ date, seconds })
      }
      return out
    },
    totalSeconds: (s) => s.records.reduce((sum, r) => sum + r.seconds, 0),
  },
  actions: {
    /**
     * @param {{date: string, seconds: number, tags: string[], note?: string}} record
     */
    addRecord({ date, seconds, tags, note }) {
      this.records.push({
        id: newId(),
        date,
        seconds,
        tags,
        note,
      })
    },
  },
})
