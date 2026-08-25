<script setup>
// v0.9.0：KeepAlive 保活名单用组件名匹配（App.vue KEEP_ALIVE）
defineOptions({ name: 'ProfileView' })
import { ref, computed } from 'vue'
import Icon from '../components/Icon.vue'
import { useSettingsStore } from '../stores/settings.js'
import { useSyncStore } from '../stores/sync.js'
import { THEMES } from '../data/themes.js'
import { downloadBackup, parseBackup, restoreBackup } from '../utils/backup.js'
import { chooseDirection, localStamp, fmtWhen } from '../utils/sync.js'

const settings = useSettingsStore()
const sync = useSyncStore()

// ---- 数据同步（v0.11.0）：全量快照 + 最后写入胜出 + 方向提示 ----
const tokenInput = ref('')
const deviceTag = computed(() => (sync.deviceId ? sync.deviceId.slice(0, 8) : '—'))

function onSaveToken() {
  sync.setToken(tokenInput.value)
  tokenInput.value = ''
}

async function onUpload() {
  sync.clearMessage()
  const r = await sync.checkRemote()
  if (!r) return
  if (!r.empty && r.updatedAt) {
    const dir = chooseDirection(localStamp(), r.updatedAt)
    if (dir === 'download' || dir === 'unknown') {
      const ok = confirm(
        `云端数据更新于 ${fmtWhen(r.updatedAt)}，比本机新。\n\n` +
          '点「确定」= 用本机数据覆盖云端（云端现有版本将被覆盖）；\n' +
          '点「取消」= 改用「立即下载」取回云端版本。',
      )
      if (!ok) return
    }
  }
  await sync.uploadNow()
}

async function onDownload() {
  sync.clearMessage()
  const r = await sync.checkRemote()
  if (!r) return
  if (r.empty) {
    sync.error = '云端还没有数据：先在本机点「立即上传」，另一台设备再点下载即可互通。'
    return
  }
  const ok = confirm(
    `将本机数据覆盖为云端版本（更新于 ${fmtWhen(r.updatedAt)}）？\n\n点「确定」立即同步并刷新页面。`,
  )
  if (!ok) return
  await sync.downloadNow()
}

// 深色模式（v0.10.0）：仅「DeepSeek 极简」主题支持深色，其他主题忽略
const DARK_MODES = [
  { id: 'system', label: '跟随系统' },
  { id: 'light', label: '浅色' },
  { id: 'dark', label: '深色' },
]

function toggleDisplayMode() {
  settings.displayMode = settings.displayMode === 'beginner' ? 'full' : 'beginner'
}

// ---- 数据备份/恢复（v0.5.0）：结构化数据导出 JSON 文件，可恢复 ----
const restoreInput = ref(null)
const backupMsg = ref('')
const restoring = ref(false)

function onExport() {
  try {
    downloadBackup()
    backupMsg.value = '备份文件已下载（练琴搭子备份-日期.json），请收好它。'
  } catch (e) {
    backupMsg.value = '导出失败：' + (e?.message || '未知错误')
  }
  setTimeout(() => (backupMsg.value = ''), 6000)
}

function onPickRestoreFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const backup = parseBackup(String(reader.result))
      const n = Object.keys(backup.data).length
      if (!window.confirm(`将清除当前全部数据并恢复备份（备份含 ${n} 项数据），确定恢复？`)) return
      restoring.value = true
      await restoreBackup(backup)
      // v0.8.0：恢复完成立即刷新——旧版等 1.2 秒期间任何 store 变更/挂起写入
      // 都可能把旧内存态覆盖回刚恢复的数据，窗口越长越危险
      window.location.reload()
    } catch (err) {
      backupMsg.value = '恢复失败：' + (err?.message || '文件格式不对')
      restoring.value = false
    }
  }
  reader.onerror = () => {
    backupMsg.value = '读取文件失败'
  }
  reader.readAsText(f)
}
</script>

<template>
  <div>
    <h1 class="page-title">我的</h1>
    <div class="profile-grid">
      <router-link to="/devices" class="card row-card">
        <span class="row-icon"><Icon name="guitar" :size="22" /></span>
        <div>
          <div>我的设备</div>
          <div class="dim small">Ibanez GRX40 + JOYO Jam Buddy 2</div>
        </div>
      </router-link>
      <router-link to="/reminders" class="card row-card">
        <span class="row-icon"><Icon name="bell" :size="22" /></span>
        <div>
          <div>提醒设置</div>
          <div class="dim small">练琴提醒 · 打卡</div>
        </div>
      </router-link>
      <router-link to="/templates" class="card row-card">
        <span class="row-icon"><Icon name="sliders" :size="22" /></span>
        <div>
          <div>音色套路库</div>
          <div class="dim small">6 套常用音色设置</div>
        </div>
      </router-link>
      <router-link to="/stats" class="card row-card">
        <span class="row-icon"><Icon name="chart" :size="22" /></span>
        <div>
          <div>统计报表</div>
          <div class="dim small">周报 · 月度热力图 · 清单状态</div>
        </div>
      </router-link>
      <router-link to="/course" class="card row-card">
        <span class="row-icon"><Icon name="book" :size="22" /></span>
        <div>
          <div>课程进度</div>
          <div class="dim small">成田三套课 · 学到第几课</div>
        </div>
      </router-link>
    </div>
    <div class="card">
      <h2>外观主题</h2>
      <p class="muted small" style="margin-bottom: 10px">一键换肤，全站跟着变；点一下立即生效，可随时切回。</p>
      <div class="theme-grid">
        <button
          v-for="t in THEMES"
          :key="t.id"
          class="theme-card"
          :class="{ on: settings.themeId === t.id }"
          @click="settings.themeId = t.id"
        >
          <div class="theme-swatches">
            <span v-for="c in t.swatch" :key="c" class="swatch" :style="{ background: c }"></span>
          </div>
          <div class="theme-name">{{ t.name }}</div>
          <div class="dim small">{{ t.desc }}</div>
        </button>
      </div>
      <div class="switch-row" style="margin-top: 12px">
        <div>
          <div class="small" style="font-weight: 600">深色模式</div>
          <div class="dim small">仅「DeepSeek 极简」主题支持深色，其他主题保持浅色</div>
        </div>
        <div class="tag-row" style="flex: none; gap: 4px">
          <span
            v-for="m in DARK_MODES"
            :key="m.id"
            class="tag"
            :class="{ on: settings.darkMode === m.id }"
            @click="settings.darkMode = m.id"
          >{{ m.label }}</span>
        </div>
      </div>
      <div class="switch-row" style="margin-top: 12px">
        <div>
          <div class="small" style="font-weight: 600">透明毛玻璃</div>
          <div class="dim small">卡片/面板半透明 + 模糊，背景插画更透出来</div>
        </div>
        <button
          class="switch"
          :class="{ on: settings.glass }"
          :aria-label="settings.glass ? '关闭透明毛玻璃' : '开启透明毛玻璃'"
          @click="settings.glass = !settings.glass"
        >
          <span class="knob"></span>
        </button>
      </div>
      <div class="switch-row" style="margin-top: 12px">
        <div>
          <div class="small" style="font-weight: 600">显示看板娘</div>
          <div class="dim small">右下角常驻小角色，点她说话（仅主题配置了看板娘时）</div>
        </div>
        <button
          class="switch"
          :class="{ on: settings.mascotEnabled }"
          :aria-label="settings.mascotEnabled ? '隐藏看板娘' : '显示看板娘'"
          @click="settings.mascotEnabled = !settings.mascotEnabled"
        >
          <span class="knob"></span>
        </button>
      </div>
    </div>
    <div class="card">
      <div class="switch-row">
        <div>
          <div class="small" style="font-weight: 600">新手模式（设备建议）</div>
          <div class="dim small">参数速览 + 大白话操作流程；关掉后显示全部参数表</div>
        </div>
        <button
          class="switch"
          :class="{ on: settings.displayMode === 'beginner' }"
          @click="toggleDisplayMode"
        >
          <span class="knob"></span>
        </button>
      </div>
      <p class="muted small" style="margin-top: 8px">影响歌曲详情页与音色套路库的参数展示。</p>
    </div>
    <div class="card">
      <h2>数据同步（云）</h2>
      <!-- 首次：填入同步令牌（Cloudflare 环境变量 SYNC_TOKEN，与 AI 答疑令牌不通用） -->
      <template v-if="!sync.configured">
        <p class="muted small" style="margin-bottom: 10px">
          让电脑和手机的数据保持一致。首次使用：先在 Cloudflare 控制台给站点配置同步令牌（SYNC_TOKEN，见验收指南），再把令牌填在下面。
        </p>
        <div style="display: flex; gap: 10px">
          <input
            v-model="tokenInput"
            type="password"
            placeholder="同步令牌（与 AI 答疑令牌不通用）"
            aria-label="同步令牌"
          />
          <button class="btn btn-primary" style="flex: none" @click="onSaveToken">保存</button>
        </div>
      </template>
      <!-- 已配置：状态 + 操作 -->
      <template v-else>
        <p class="muted small" style="margin-bottom: 10px">
          打卡记录、歌单与歌曲分析、计划/课程进度、自录曲谱、聊天记录与设置偏好会上云；录音与音频不上云。
        </p>
        <div class="sync-rows">
          <div class="sync-row"><span class="dim small">本机</span><span class="small">设备 {{ deviceTag }}…</span></div>
          <div class="sync-row"><span class="dim small">上次同步</span><span class="small">{{ fmtWhen(sync.lastSyncAt) }}</span></div>
          <div class="sync-row">
            <span class="dim small">云端</span>
            <span class="small">{{ sync.remoteEmpty ? '暂无数据' : fmtWhen(sync.remoteAt) }}</span>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" :disabled="sync.busy" @click="onUpload">立即上传</button>
          <button class="btn" :disabled="sync.busy" @click="onDownload">立即下载</button>
        </div>
        <div class="switch-row" style="margin-top: 12px">
          <div>
            <div class="small" style="font-weight: 600">打开应用时自动检查</div>
            <div class="dim small">发现云端更新时在顶部提示，不会自动覆盖，需你确认方向</div>
          </div>
          <button
            class="switch"
            :class="{ on: sync.autoCheck }"
            :aria-label="sync.autoCheck ? '关闭自动检查' : '开启自动检查'"
            @click="sync.autoCheck = !sync.autoCheck"
          >
            <span class="knob"></span>
          </button>
        </div>
        <p v-if="sync.error" class="small" style="color: var(--danger); margin-top: 8px">{{ sync.error }}</p>
        <p v-if="sync.notice" class="small" style="color: var(--ok); margin-top: 8px">{{ sync.notice }}</p>
      </template>
    </div>
    <div class="card">
      <h2>数据备份</h2>
      <p class="muted small" style="margin-bottom: 10px">
        打卡记录、歌单、曲谱、课程进度、聊天记录都存在本机浏览器，清理缓存会全部丢失。建议定期导出备份文件。
        （录音体积大，不在备份范围。）
      </p>
      <div class="btn-row">
        <button class="btn btn-primary" @click="onExport">导出备份文件</button>
        <button class="btn" :disabled="restoring" @click="restoreInput?.click()">{{ restoring ? '恢复中…' : '从备份恢复' }}</button>
        <input ref="restoreInput" type="file" accept=".json,application/json" style="display: none" @change="onPickRestoreFile" />
      </div>
      <p v-if="backupMsg" class="small" style="color: var(--accent-dark); margin-top: 8px">{{ backupMsg }}</p>
    </div>
    <div class="card">
      <h2>关于</h2>
      <p class="muted small">
        练琴搭子 M1~M3：设备档案、音色套路、节拍器、调音器、练琴打卡与提醒、歌曲分析与设备建议、学习计划、曲谱与和弦图库；M4：录音回听 + AI 答疑 + 云同步。
        数据平时保存在本机浏览器；多端云同步已上线（见上方「数据同步」卡）。
      </p>
    </div>
  </div>
</template>

<style scoped>
.profile-grid { display: grid; }
.row-card { display: flex; gap: 12px; align-items: center; text-decoration: none; color: var(--text); font-weight: 600; }
.row-icon { display: flex; color: var(--text-dim); }

/* 数据同步卡（v0.11.0） */
.sync-rows { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.sync-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }

/* 外观主题选择卡（v0.7.0） */
.theme-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.theme-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  cursor: pointer;
  color: var(--text);
  font-family: inherit;
}
.theme-card.on { border-color: var(--accent); }
.theme-swatches { display: flex; gap: 6px; margin-bottom: 4px; }
.swatch { width: 26px; height: 26px; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.12); }
.theme-name { font-size: 15px; font-weight: 700; }

@media (min-width: 768px) {
  .profile-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .profile-grid .card { margin-bottom: 0; }
  .theme-grid { grid-template-columns: 1fr 1fr; }
}
</style>
