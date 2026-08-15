<script setup>
import Icon from '../components/Icon.vue'
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
          <div class="dim small">5 套常用音色设置</div>
        </div>
      </router-link>
    </div>
    <div class="card">
      <h2>关于</h2>
      <p class="muted small">
        电吉他学习助手 M1 版本：设备档案、音色套路、节拍器、调音器、练琴打卡与提醒。
        数据目前保存在本机浏览器；多端云同步在后续版本接入。
        歌曲分析与学习计划见需求文档（M2/M3）。
      </p>
    </div>
  </div>
</template>

<style scoped>
.profile-grid { display: grid; }
.row-card { display: flex; gap: 12px; align-items: center; text-decoration: none; color: var(--text); font-weight: 600; }
.row-icon { display: flex; color: var(--text-dim); }

@media (min-width: 768px) {
  .profile-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .profile-grid .card { margin-bottom: 0; }
}
</style>
