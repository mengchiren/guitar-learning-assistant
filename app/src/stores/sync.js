import { defineStore } from 'pinia'
import { load } from '../utils/storage.js'
import {
  collectSnapshot,
  applySnapshot,
  chooseDirection,
  syncRequest,
  localStamp,
  localDeviceId,
} from '../utils/sync.js'

// 云同步（v0.11.0）：状态与动作。
// 交互约定（用户确认）：打开应用自动检查（autoCheck，默认开）+「我的 → 数据同步」手动上传/下载；
// 冲突策略：最后写入胜出 + 方向提示（chooseDirection 给出建议，上传/下载前均先确认方向）。
export const useSyncStore = defineStore('sync', {
  persist: [
    { key: 'sync-token', paths: ['token'] },
    { key: 'sync-device', paths: ['deviceId'] },
    { key: 'sync-last-sync', paths: ['lastSyncAt'] },
    { key: 'sync-auto-check', paths: ['autoCheck'] },
  ],
  state: () => ({
    // 同步令牌（防刷）：Cloudflare 环境变量 SYNC_TOKEN 里的值，首次使用时填入，存本机
    token: load('sync-token', ''),
    // 设备 ID：生成本机标识，用于区分「另一台设备上传的」快照
    deviceId: localDeviceId(),
    // 本机上次成功同步（上传或下载）的云端时间
    lastSyncAt: load('sync-last-sync', ''),
    // 打开应用时自动检查远端更新（默认开）
    autoCheck: load('sync-auto-check', true),
    busy: false,
    error: '',
    notice: '',
    // 最近一次检查到的远端状态（供 UI 展示方向建议）
    remoteAt: '',
    remoteEmpty: true,
  }),
  getters: {
    configured: (s) => Boolean(s.token),
  },
  actions: {
    setToken(t) {
      this.token = (t || '').trim()
    },
    clearMessage() {
      this.error = ''
      this.notice = ''
    },
    /** 只读检查远端（不传数据）：返回 { empty, updatedAt }；更新 remoteAt/remoteEmpty */
    async checkRemote() {
      if (!this.token || this.busy) return null
      this.busy = true
      this.error = ''
      try {
        const res = await syncRequest('check', {}, this.token)
        this.remoteAt = res.updatedAt || ''
        this.remoteEmpty = Boolean(res.empty)
        return { empty: this.remoteEmpty, updatedAt: this.remoteAt }
      } catch (e) {
        this.error = e.message || '检查远端失败'
        return null
      } finally {
        this.busy = false
      }
    },
    /** 上传本机快照（调用方已确认方向） */
    async uploadNow() {
      if (!this.token || this.busy) return false
      this.busy = true
      this.error = ''
      this.notice = ''
      try {
        const snap = collectSnapshot()
        const res = await syncRequest('upload', snap, this.token)
        this.lastSyncAt = res.updatedAt || snap.updatedAt
        this.remoteAt = this.lastSyncAt
        this.remoteEmpty = false
        this.notice = `已上传（${this.lastSyncAt}）`
        return true
      } catch (e) {
        this.error = e.message || '上传失败'
        return false
      } finally {
        this.busy = false
      }
    },
    /** 下载云端快照并应用（调用方已确认方向）；应用后整页刷新让 store 重读。 */
    async downloadNow() {
      if (!this.token || this.busy) return false
      this.busy = true
      this.error = ''
      this.notice = ''
      try {
        const res = await syncRequest('download', {}, this.token)
        if (res.empty) {
          this.error = '云端还没有数据，先在本机点「立即上传」吧'
          return false
        }
        applySnapshot(res.data)
        this.lastSyncAt = res.updatedAt || ''
        location.reload()
        return true
      } catch (e) {
        this.error = e.message || '下载失败'
        return false
      } finally {
        this.busy = false
      }
    },
    /** 打开应用时的自动检查：远端更新且方向为 download/unknown 时返回建议，供 UI 弹横幅 */
    async autoCheckOnce() {
      if (!this.autoCheck || !this.token || this.busy) return null
      const r = await this.checkRemote()
      if (!r || r.empty || !r.updatedAt) return null
      const dir = chooseDirection(localStamp(), r.updatedAt)
      if (dir === 'download' || dir === 'unknown') return r
      return null
    },
  },
})
