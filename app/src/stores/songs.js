import { defineStore } from 'pinia'
import { load, save } from '../utils/storage'
import seedSongs from '../data/seedSongs.json'

let uidSeq = 0
function genId() {
  uidSeq = (uidSeq + 1) % 100000
  return `u-${Date.now().toString(36)}-${uidSeq}`
}

// 用户歌单：分析/手动录入的歌曲 + 人工纠错。
// 记录结构：{ id, title, artist, source: 'analysis'|'manual', fileName?,
//   analysis?: 引擎输出, manual?: { bpm, key, template }, corrections?: { bpm?, key?, template? }, createdAt }
export const useSongsStore = defineStore('songs', {
  state: () => ({
    userSongs: load('songs', []),
  }),
  getters: {
    // 合并歌单：种子库（只读）+ 用户歌单
    allSongs() {
      return [
        ...seedSongs.map((s) => ({ ...s, isSeed: true })),
        ...this.userSongs.map((s) => ({ ...s, isSeed: false })),
      ]
    },
  },
  actions: {
    byId(id) {
      return this.allSongs.find((s) => s.id === id)
    },
    addUserSong(song) {
      const record = { id: genId(), createdAt: Date.now(), ...song }
      this.userSongs.push(record)
      this.persist()
      return record.id
    },
    updateUserSong(id, patch) {
      const s = this.userSongs.find((x) => x.id === id)
      if (!s) return
      Object.assign(s, patch)
      this.persist()
    },
    removeUserSong(id) {
      this.userSongs = this.userSongs.filter((x) => x.id !== id)
      this.persist()
    },
    persist() {
      save('songs', this.userSongs)
    },
  },
})

// 展示用的有效值：纠错 > 手动 > 分析原始值
export function effectiveSong(song) {
  const a = song.analysis || {}
  const m = song.manual || {}
  const c = song.corrections || {}
  return {
    ...song,
    bpm: c.bpm ?? m.bpm ?? a.tempoUseBpm ?? song.bpm ?? null,
    key: c.key ?? m.key ?? (a.keyTop3 && a.keyTop3[0] ? a.keyTop3[0].key : null) ?? song.key ?? null,
    template: c.template ?? m.template ?? a.template ?? song.template ?? null,
  }
}
