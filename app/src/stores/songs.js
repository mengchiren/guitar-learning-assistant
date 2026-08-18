import { defineStore } from 'pinia'
import { load } from '../utils/storage.js'
import { newId } from '../utils/id.js'
import seedSongs from '../data/seedSongs.json' with { type: 'json' }

/**
 * @typedef {object} Song 歌曲（归一化统一实体：种子歌与用户歌同构）
 * @property {string} id
 * @property {string} title 歌名
 * @property {string} artist 歌手/出处
 * @property {boolean} isSeed 是否种子库（只读）
 * @property {'seed'|'analysis'|'manual'} source 数据来源
 * @property {number|null} bpm 有效 BPM（纠错 > 手动 > 分析 > 种子原始值）
 * @property {string|null} key 有效调性
 * @property {string|null} template 有效套路
 * @property {string|null} difficulty 难度描述（种子库）
 * @property {string|null} chords 和弦进行（种子库整理）
 * @property {string|null} note 备注
 * @property {string|null} dataFrom 数据来源说明（种子库）
 * @property {object|null} analysis 引擎原始输出（用户歌）
 * @property {object|null} manual 手动录入值（用户歌）
 * @property {object|null} corrections 人工纠错值（用户歌）
 * @property {number|null} createdAt 创建时间（用户歌）
 */

// 有效值归一化：纠错 > 手动 > 分析原始值 > 种子原始字段。
// 在 allSongs 里算一次，消费方直接用 song.bpm / song.key / song.template，不再各自拼装。
function effective(song, isSeed) {
  const a = song.analysis || {}
  const m = song.manual || {}
  const c = song.corrections || {}
  return {
    ...song,
    isSeed,
    bpm: c.bpm ?? m.bpm ?? a.tempoUseBpm ?? song.bpm ?? null,
    key: c.key ?? m.key ?? (a.keyTop3 && a.keyTop3[0] ? a.keyTop3[0].key : null) ?? song.key ?? null,
    template: c.template ?? m.template ?? a.template ?? song.template ?? null,
  }
}

export const useSongsStore = defineStore('songs', {
  // v0.6.0：状态变更自动持久化（persist 插件），不再手动 save
  persist: { key: 'songs', paths: ['userSongs'] },
  state: () => ({
    // 原始用户歌记录（含 analysis/manual/corrections 三层），展示一律走 allSongs 的归一化实体
    userSongs: load('songs', []),
  }),
  getters: {
    /**
     * 合并歌单（种子 + 用户），返回归一化 Song 实体列表。
     * 注意：每次访问都会重建数组——数据量小（29+N）可接受；如未来歌单变大再改缓存。
     * @returns {Song[]}
     */
    allSongs() {
      return [
        ...seedSongs.map((s) => effective(s, true)),
        ...this.userSongs.map((s) => effective(s, false)),
      ]
    },
  },
  actions: {
    /** @param {string} id */
    byId(id) {
      return this.allSongs.find((s) => s.id === id)
    },
    /**
     * @param {Partial<Song>} song 新歌（不含 id/createdAt，由本方法生成）
     * @returns {string} 新歌 id
     */
    addUserSong(song) {
      const record = { id: newId(), createdAt: Date.now(), ...song }
      this.userSongs.push(record)
      return record.id
    },
    /** @param {string} id @param {object} patch */
    updateUserSong(id, patch) {
      const s = this.userSongs.find((x) => x.id === id)
      if (!s) return
      Object.assign(s, patch)
    },
    /** @param {string} id */
    removeUserSong(id) {
      this.userSongs = this.userSongs.filter((x) => x.id !== id)
    },
  },
})
