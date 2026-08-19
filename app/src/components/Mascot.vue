<script setup>
// 看板娘（v0.7.0）：主题可选的常驻小角色。
// 只在当前主题声明了 mascot 图时显示（data/themes.js）；点她说话，练琴鼓励向。
import { ref, computed } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { THEMES } from '../data/themes.js'

const settings = useSettingsStore()

const theme = computed(() => THEMES.find((t) => t.id === settings.themeId))
// 开关（v0.7.2）：「我的 → 外观主题 → 显示看板娘」；关掉后主题配置了看板娘也不显示
const visible = computed(() => settings.mascotEnabled && Boolean(theme.value?.mascot))

const LINES = [
  '今天也要加油练琴哦～',
  '爬格子 5 分钟也好过没有！',
  'F 和弦按不响？慢慢来～',
  '练累了就歇会儿，我等你。',
  '连续打卡的感觉超棒的！',
  '先 80% 速度跟节拍器试试！',
  '音色调好了吗？记得照套路拧～',
]
const line = ref(LINES[0])
const shown = ref(false)

function poke() {
  line.value = LINES[Math.floor(Math.random() * LINES.length)]
  shown.value = true
  // 气泡 4 秒后自动收起，再点可再说
  clearTimeout(poke._t)
  poke._t = setTimeout(() => (shown.value = false), 4000)
}
</script>

<template>
  <div v-if="visible" class="mascot">
    <div v-if="shown" class="mascot-bubble">{{ line }}</div>
    <button class="mascot-btn" :aria-label="`${theme.mascotName || '看板娘'}：点我说话`" @click="poke">
      <img :src="theme.mascot" :alt="theme.mascotName || '看板娘'" />
    </button>
  </div>
</template>

<style scoped>
.mascot {
  position: fixed;
  right: 14px;
  bottom: calc(74px + env(safe-area-inset-bottom));
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}
/* 桌面端提上来一点（无底部导航） */
@media (min-width: 768px) {
  .mascot { bottom: 20px; right: 24px; }
}
.mascot-btn {
  pointer-events: auto;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.12));
}
.mascot-btn img {
  width: 76px;
  height: auto;
  display: block;
  transition: transform 0.15s;
}
.mascot-btn:hover img,
.mascot-btn:active img { transform: scale(1.08) rotate(-3deg); }
.mascot-bubble {
  pointer-events: auto;
  background: var(--bg-card);
  border: 1px solid var(--accent);
  border-radius: 14px 14px 4px 14px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text);
  max-width: 200px;
  margin-bottom: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: pop 0.2s ease-out;
}
@keyframes pop {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
