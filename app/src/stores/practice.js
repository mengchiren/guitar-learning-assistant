import { defineStore } from 'pinia'
import { load, save } from '../utils/storage'

function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftDate(base, delta) {
  const d = new Date(base)
  d.setDate(d.getDate() + delta)
  return todayStr(d)
}

export const usePracticeStore = defineStore('practice', {
  state: () => ({
    // record: { id, date: 'YYYY-MM-DD', seconds, tags: [], note }
    records: load('practice-records', []),
  }),
  getters: {
    todaySeconds: (s) =>
      s.records.filter((r) => r.date === todayStr()).reduce((sum, r) => sum + r.seconds, 0),
    streakDays(s) {
      const dates = new Set(s.records.map((r) => r.date))
      let streak = 0
      let cursor = dates.has(todayStr()) ? 0 : 1 // 今天没练则从昨天开始数
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
    addRecord({ date, seconds, tags, note }) {
      this.records.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date,
        seconds,
        tags,
        note,
      })
      this.persist()
    },
    persist() {
      save('practice-records', this.records)
    },
  },
})
