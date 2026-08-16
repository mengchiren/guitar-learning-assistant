import { defineStore } from 'pinia'
import { load, save } from '../utils/storage'
import { usePracticeStore } from './practice'
import { useSongsStore, effectiveSong } from './songs'
import { generatePlan } from '../utils/planEngine.js'

// 本地时区日期（与 PracticeView 的 localDateStr 同一模式）
function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 学习计划：基本功达标标记 + 歌曲练习状态；练习包由 planEngine 纯函数生成
export const usePlanStore = defineStore('plan', {
  state: () => ({
    // { spider: 'YYYY-MM-DD' } 达标日期
    basicsDone: load('plan-basics-done', {}),
    // { songId: { state: 'practicing' | 'mastered', date: 'YYYY-MM-DD' } }
    songStatus: load('plan-song-status', {}),
  }),
  getters: {
    // 规则引擎输出：三档练习包 + 周概览 + 调整说明
    plan(state) {
      const practice = usePracticeStore()
      const songs = useSongsStore()
      const list = songs.allSongs.map((s) => {
        const eff = effectiveSong(s)
        return { id: s.id, title: s.title, template: eff.template, bpm: eff.bpm }
      })
      return generatePlan({
        records: practice.records,
        basicsDone: state.basicsDone,
        songStatus: state.songStatus,
        songs: list,
        todayStr: localDateStr(),
      })
    },
  },
  actions: {
    toggleBasic(id) {
      if (this.basicsDone[id]) delete this.basicsDone[id]
      else this.basicsDone[id] = localDateStr()
      save('plan-basics-done', this.basicsDone)
    },
    setSongStatus(id, state) {
      // state: 'practicing' | 'mastered' | null（null = 清除状态）
      if (state === null) delete this.songStatus[id]
      else this.songStatus[id] = { state, date: localDateStr() }
      save('plan-song-status', this.songStatus)
    },
  },
})
