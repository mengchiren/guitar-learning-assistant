import { defineStore } from 'pinia'
import { getAllMeta, getBlob, putMeta, putBlob, deleteRecording } from '../utils/recordingsDb.js'

// 录音分类与打卡一致（歌曲/基本功/课程/自由练习），统计页以后可串起来
export const RECORD_CATEGORIES = ['歌曲', '基本功', '课程', '自由练习']

export function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const useRecordingsStore = defineStore('recordings', {
  state: () => ({
    list: [], // 元数据（不含音频），按时间倒序
    loaded: false,
  }),
  actions: {
    async load() {
      this.list = await getAllMeta()
      this.loaded = true
    },
    // meta: { date, seconds, category, songId, songName, bpm, bpmConf, bpmManual, note, mimeType }
    async add({ blob, meta }) {
      const id = makeId()
      const rec = { ...meta, id, createdAt: Date.now() }
      await putBlob(id, blob)
      await putMeta(rec)
      this.list.unshift(rec)
    },
    async remove(id) {
      await deleteRecording(id)
      this.list = this.list.filter((r) => r.id !== id)
    },
    async blobOf(id) {
      return getBlob(id)
    },
  },
})
