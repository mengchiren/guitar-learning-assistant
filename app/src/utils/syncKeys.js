// 云同步范围与限额常量（v0.13.2 从 utils/sync.js 拆出独立模块）：
// 为什么单独放——storage.js 要按白名单决定是否刷新 sync-stamp，而 sync.js 又依赖
// storage.js（save/load），直接互相导入会成环；把纯常量抽出来给两边用。

/** 同步范围白名单（gla:v1: 短名）。新增可同步数据必须在这里登记，否则不会上云。 */
export const SYNC_KEYS = [
  'practice-records', // 打卡记录/时长（练习页 records）
  'songs', // 用户歌单 + 歌曲分析/纠错/待校准标记
  'plan-basics-done', // 基本功达标
  'plan-song-status', // 歌曲练习中/已掌握
  'course-progress', // 课程进度
  'user-sheets', // 自录曲谱
  'ai-history', // AI 答疑历史（含问答内容，也是学习资料）
  // 设置/主题偏好
  'reminders',
  'active-devices',
  'display-mode',
  'theme',
  'glass',
  'mascot',
  'dark-mode',
]

/** 单个快照（序列化后）的大小上限。正常个人数据在几百 KB 量级，超限视为异常上传拦截。 */
export const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024
