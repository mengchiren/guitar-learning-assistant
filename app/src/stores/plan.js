import { defineStore } from 'pinia'
import { load } from '../utils/storage.js'
import { localDateStr } from '../utils/date.js'
import { usePracticeStore } from './practice.js'
import { useSongsStore } from './songs.js'
import { generatePlan } from '../utils/planEngine.js'

// 学习计划：基本功达标标记 + 歌曲练习状态；练习包由 planEngine 纯函数生成
export const usePlanStore = defineStore('plan', {
  // v0.6.0：状态变更自动持久化（persist 插件），不再手动 save
  persist: [
    { key: 'plan-basics-done', paths: ['basicsDone'] },
    { key: 'plan-song-status', paths: ['songStatus'] },
  ],
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
      // allSongs 已归一化，template/bpm 直接是有效值
      const list = songs.allSongs.map((s) => ({ id: s.id, title: s.title, template: s.template, bpm: s.bpm }))
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
    },
    setSongStatus(id, state) {
      // state: 'practicing' | 'mastered' | null（null = 清除状态）
      if (state === null) delete this.songStatus[id]
      else this.songStatus[id] = { state, date: localDateStr() }
    },
  },
})
