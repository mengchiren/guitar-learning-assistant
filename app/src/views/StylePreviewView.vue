<script setup>
// 风格预览（临时页面，用于向用户展示 3 款设计方案，选中后才会落地到真实主题）
import { ref } from 'vue'
import Icon from '../components/Icon.vue'

const STYLES = [
  {
    id: 'galaxy',
    name: '星河指挥台',
    tag: '参考：星穹铁道',
    desc: '珍珠白/星云紫渐变底 · 磨砂卡片描金边 · 星芒点缀。像游戏里打开「乐器调音台」的感觉。',
    suit: '适合：想有「演出前调音」的仪式感，耐看、高级。',
  },
  {
    id: 'quest',
    name: '冒险打卡站',
    tag: '参考：多邻国',
    desc: '青草绿渐变底 · 白卡彩色图标 · 大按钮。打开就想「今天也来通关一关」。',
    suit: '适合：把练琴当任务闯关，鼓励性最强。',
  },
  {
    id: 'candy',
    name: '甜品练习室',
    tag: '参考：可爱二次元 / 轻音',
    desc: '奶油粉→淡紫渐变底 · 牛奶白卡片粉边 · 珊瑚粉主色。和现有呆唯主题同源但更完整的「新默认脸」。',
    suit: '适合：软萌可爱，和看板娘最搭。',
  },
]

// ?v=galaxy&mode=dark 直达指定款与明暗（截图/分享用）；无 v 时三款并用展示
const params = new URLSearchParams(location.search)
const qv = params.get('v')
const qmode = params.get('mode')
const solo = STYLES.some((s) => s.id === qv) ? qv : null

const modes = ref({ galaxy: 'light', quest: 'light', candy: 'light' })
if (solo && qmode) modes.value[solo] = qmode

function toggleMode(id) {
  modes.value[id] = modes.value[id] === 'light' ? 'dark' : 'light'
}

const bars = [4, 0, 0, 12, 0, 55, 96] // 最近 7 天柱状 mock
const days = ['08-10', '08-11', '08-12', '08-13', '08-14', '08-15', '08-16']

// 通用小图标（避免依赖图标集）
const Svg = {
  guitar: '<circle cx="12" cy="15.8" r="5.2"/><circle cx="12" cy="15.8" r="1.5"/><path d="M12 10.6V5"/><path d="M9.6 5h4.8"/><path d="M10.6 4.1h2.8"/>',
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.8 20v-5.5h4.4V20"/>',
  plan: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9h17M8 2.5v4M16 2.5v4"/>',
  tools: '<rect x="3.8" y="3.8" width="6.9" height="6.9" rx="0.8"/><rect x="13.3" y="3.8" width="6.9" height="6.9" rx="0.8"/><rect x="3.8" y="13.3" width="6.9" height="6.9" rx="0.8"/><rect x="13.3" y="13.3" width="6.9" height="6.9" rx="0.8"/>',
  music: '<path d="M9.5 17.5V6.8l9.5-2v10.9"/><circle cx="7.2" cy="17.5" r="2.3"/><circle cx="16.7" cy="15.7" r="2.3"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-3.9 3.3-6.2 7.5-6.2s7.5 2.3 7.5 6.2"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
  star: '<path d="M12 3l2.4 5.1 5.6.7-4.1 3.9 1 5.6-4.9-2.7-4.9 2.7 1-5.6L4 8.8l5.6-.7z"/>',
}
</script>

<template>
  <div class="pv-wrap">
    <div class="pv-header">
      <h1>练琴搭子 · 3 款界面风格预览</h1>
      <p class="pv-note">
        同一份首页内容 × 3 种设计语言（均为可切换浅色/深色 · 8px 圆角 · 渐变底 · 信息密度一致 · 主色随主题走）。
        底部有每款的设计说明，看完告诉我编号即可。
      </p>
    </div>

    <div class="pv-grid">
      <div v-for="(s, i) in STYLES" :key="s.id" v-show="!solo || s.id === solo" class="pv-col">
        <div class="pv-col-head">
          <div class="pv-col-title">
            <span class="pv-num">{{ i + 1 }}</span>
            {{ s.name }} <span class="pv-tag">{{ s.tag }}</span>
          </div>
          <div class="pv-chips">
            <button class="pv-chip" :class="{ on: modes[s.id] === 'light' }" @click="modes[s.id] = 'light'">浅色</button>
            <button class="pv-chip" :class="{ on: modes[s.id] === 'dark' }" @click="modes[s.id] = 'dark'">深色</button>
          </div>
        </div>

        <!-- 手机效果框 -->
        <div class="phone" :class="['pv-' + s.id, modes[s.id] === 'dark' ? 'dark' : 'light']">
          <div class="pv-score">
            <div class="pv-clock">18:30</div>
            <div class="pv-battery">● ● ● ●</div>
          </div>

          <div class="pv-page">
            <h2 class="pv-title">
              <span v-if="s.id === 'galaxy'" class="pv-star">✦</span>
              今天练琴了吗？
            </h2>

            <!-- 今日累计卡 -->
            <div class="card hero">
              <div class="hero-main">
                <div class="hero-num">30 分钟</div>
                <div class="dim small">今日累计练习</div>
              </div>
              <div class="hero-side">
                <div class="hero-streak">2 天</div>
                <div class="dim small">连续打卡</div>
              </div>
            </div>

            <div class="btn-primary">开始练习</div>

            <!-- 最近 7 天 -->
            <div class="card">
              <h3>最近 7 天</h3>
              <div class="week-bars">
                <div v-for="(h, j) in bars" :key="j" class="week-bar-wrap">
                  <div class="week-bar" :class="{ today: j === bars.length - 1 }" :style="{ height: Math.max(6, h) + '%' }"></div>
                  <div class="week-label dim">{{ days[j] }}</div>
                </div>
              </div>
            </div>

            <!-- 今日练习包 -->
            <div class="card">
              <h3>今日练习包（弹性）</h3>
              <div class="list-row"><span class="tag">5 分钟</span><span class="pack-link">爬格子</span></div>
              <div class="list-row"><span class="tag">5 分钟</span><span class="pack-link">开放和弦转换</span></div>
              <p class="small note">上周只练了 0 天，这周先恢复习惯——建议量减半，从 10 分钟档开始。</p>
              <p class="small muted">时间不固定？从 10 分钟档开始。看完整计划 →</p>
            </div>

            <!-- 练琴提醒 -->
            <div class="card">
              <h3><Icon name="bell" :size="15" /> 练琴提醒</h3>
              <p class="small muted">未开启 · 去设置</p>
            </div>
          </div>

          <!-- tab 栏 -->
          <nav class="pv-tabbar">
            <span v-for="t in ['home', 'plan', 'tools', 'music', 'user']" :key="t" class="pv-tab" :class="{ on: t === 'home' }">
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="Svg[t]"></svg>
              <span>{{ { home: '首页', plan: '计划', tools: '工具', music: '歌曲', user: '我的' }[t] }}</span>
            </span>
          </nav>

          <!-- 看板娘占位 -->
          <div class="pv-mascot-slot">看板娘位</div>
        </div>

        <div class="pv-desc">
          <p class="pv-desc-line">{{ s.desc }}</p>
          <p class="pv-suit">{{ s.suit }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* 预览页为了不被应用外壳遮挡，直接整屏覆盖展示 */
.pv-wrap {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow-y: auto;
  background: #efe9e4;
  padding: 24px 16px 48px;
  font-family: system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.pv-header { max-width: 1280px; margin: 0 auto 20px; }
.pv-header h1 { font-size: 22px; font-weight: 800; color: #333; }
.pv-note { font-size: 13px; color: #777; margin-top: 6px; max-width: 880px; line-height: 1.6; }

.pv-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  max-width: 1280px;
  margin: 0 auto;
}
@media (min-width: 1100px) { .pv-grid { grid-template-columns: repeat(3, 1fr); align-items: start; } }

.pv-col-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.pv-col-title { font-size: 16px; font-weight: 800; color: #333; display: flex; align-items: center; gap: 6px; }
.pv-num {
  display: inline-flex; width: 22px; height: 22px; border-radius: 50%;
  background: #e30613; color: #fff; font-size: 13px; align-items: center; justify-content: center;
}
.pv-tag { font-size: 12px; font-weight: 600; color: #999; }
.pv-chips { display: flex; gap: 6px; }
.pv-chip {
  border: 1px solid #ccc; background: #fff; border-radius: 999px;
  font-size: 12px; padding: 4px 12px; cursor: pointer; color: #555;
}
.pv-chip.on { background: #333; color: #fff; border-color: #333; }

.phone {
  position: relative;
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.18);
  border: 6px solid #22252b;
}
.pv-score {
  display: flex; justify-content: space-between; padding: 8px 16px 0; font-size: 11px; font-weight: 600; opacity: 0.75;
}
.pv-page { padding: 6px 16px 20px; }
.pv-title { font-size: 19px; font-weight: 800; letter-spacing: -0.3px; margin: 10px 0 12px; }
.pv-star { color: var(--c-gold); margin-right: 2px; }
.pv-mascot-slot {
  position: absolute; right: 12px; top: 300px;
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: rgba(0,0,0,0.35); background: rgba(255,255,255,0.5);
  border: 1px dashed rgba(0,0,0,0.18);
}

/* 卡片与通用元件 */
.pv-page .card {
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
}
.pv-page .card h3 { font-size: 14px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 4px; }
.hero { display: flex; justify-content: space-between; align-items: center; }
.hero-num { font-size: 30px; font-weight: 800; letter-spacing: -0.5px; }
.hero-streak { font-size: 22px; font-weight: 800; }
.hero-side { text-align: right; }
.dim { opacity: 0.55; }
.small { font-size: 12px; line-height: 1.5; }
.note { color: #b23b2e; }
.muted { opacity: 0.6; margin-top: 6px; }
.btn-primary {
  border-radius: 8px;
  text-align: center;
  font-weight: 700;
  font-size: 15px;
  padding: 13px;
  margin-bottom: 12px;
  cursor: default;
}
.week-bars { display: flex; gap: 8px; height: 74px; align-items: flex-end; }
.week-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: 4px; }
.week-bar { width: 100%; max-width: 30px; border-radius: 3px 3px 0 0; }
.week-label { font-size: 10px; opacity: 0.5; }
.list-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.tag {
  font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
}
.pack-link { font-weight: 600; font-size: 13px; }

/* tab 栏（样式与主应用一致风格） */
.pv-tabbar {
  display: flex; justify-content: space-around; align-items: center;
  padding: 7px 8px calc(10px + 6px);
}
.pv-tab { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; opacity: 0.55; font-weight: 600; }
.pv-tab.on { opacity: 1; }

/* ============ 款式 1「星河指挥台」（星铁风） ============ */
.pv-galaxy.light {
  --c-gold: #b98a2f;
  --c-accent: #6f5ae0;
  --c-text: #2b2a33;
  --c-card: rgba(255, 253, 250, 0.82);
  --c-card-edge: #c9a54b;
  color: var(--c-text);
  background: linear-gradient(165deg, #fbf7ef 0%, #f0ecf7 52%, #e2e0f5 100%);
}
.pv-galaxy.dark {
  --c-gold: #d8b25e;
  --c-accent: #9c86ff;
  --c-text: #eceafa;
  --c-card: rgba(26, 28, 48, 0.72);
  --c-card-edge: rgba(217, 178, 94, 0.55);
  color: var(--c-text);
  background: linear-gradient(165deg, #12142a 0%, #1b1f3d 55%, #372d68 100%);
}
.pv-galaxy.light .hero-num { color: var(--c-accent); }
.pv-galaxy.dark .hero-num { color: var(--c-gold); }
.pv-galaxy .hero-streak { color: var(--c-gold); }
.pv-galaxy .card {
  background: var(--c-card);
  border: 1px solid var(--c-card-edge);
  box-shadow: 0 4px 18px rgba(90, 70, 20, 0.10);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.pv-galaxy .btn-primary {
  background: linear-gradient(135deg, var(--c-accent), #8a6ff0);
  color: #fff;
  box-shadow: 0 4px 14px rgba(111, 90, 224, 0.35);
}
.pv-galaxy .week-bar { background: var(--c-accent); opacity: 0.55; }
.pv-galaxy .week-bar.today { background: var(--c-gold); opacity: 1; }
.pv-galaxy .tag { background: rgba(185, 138, 47, 0.15); color: var(--c-gold); }
.pv-galaxy .note { color: var(--c-accent); }
.pv-galaxy .pv-tabbar { background: rgba(26, 28, 48, 0.82); border-top: 1px solid var(--c-card-edge); color: #d6cfe8; }
.pv-galaxy.light .pv-tabbar { background: rgba(255, 253, 250, 0.9); color: #4a4458; }
.pv-galaxy .pv-tab.on { color: var(--c-gold); }

/* ============ 款式 2「冒险打卡站」（多邻国风） ============ */
.pv-quest.light {
  --c-green: #58cc02;
  --c-blue: #1cb0f6;
  --c-text: #3c3c5a;
  --c-card: #ffffff;
  color: var(--c-text);
  background: linear-gradient(170deg, #e8f9df 0%, #d9f3ef 55%, #d3eafd 100%);
}
.pv-quest.dark {
  --c-green: #6ee20e;
  --c-blue: #35b6f0;
  --c-text: #e6f0e8;
  --c-card: #24312b;
  color: var(--c-text);
  background: linear-gradient(170deg, #16241a 0%, #172a30 55%, #14243c 100%);
}
.pv-quest .hero-num { color: var(--c-green); }
.pv-quest .hero-streak { color: var(--c-blue); }
.pv-quest .card {
  background: var(--c-card);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 3px 10px rgba(38, 108, 40, 0.10);
}
.pv-quest .btn-primary {
  background: var(--c-green);
  color: #fff;
  box-shadow: 0 4px 0 #46a302, 0 6px 14px rgba(88, 204, 2, 0.30);
}
.pv-quest .week-bar { background: var(--c-blue); opacity: 0.5; }
.pv-quest .week-bar.today { background: var(--c-green); opacity: 1; }
.pv-quest .tag { background: rgba(88, 204, 2, 0.14); color: #3f9c00; }
.pv-quest.dark .tag { background: rgba(110, 226, 14, 0.16); color: #9be36b; }
.pv-quest .note { color: #b24c37; }
.pv-quest .pack-link { color: var(--c-green); }
.pv-quest .pv-tabbar { background: #fff; border-top: 2px solid #e5e5e5; color: #afafaf; }
.pv-quest.dark .pv-tabbar { background: #1f2b24; border-top-color: #2c3a31; color: #7c8f83; }
.pv-quest .pv-tab.on { color: var(--c-green); }

/* ============ 款式 3「甜品练习室」（可爱二次元） ============ */
.pv-candy.light {
  --c-pink: #f26d8a;
  --c-purple: #9d8cf0;
  --c-text: #5b4a52;
  --c-card: rgba(255, 252, 252, 0.92);
  color: var(--c-text);
  background: linear-gradient(160deg, #ffeef4 0%, #f6eafc 55%, #e6ecff 100%);
}
.pv-candy.dark {
  --c-pink: #ff8fab;
  --c-purple: #b3a3ff;
  --c-text: #f3e9ee;
  --c-card: rgba(58, 44, 58, 0.86);
  color: var(--c-text);
  background: linear-gradient(160deg, #352631 0%, #3a2c4d 55%, #2c2f55 100%);
}
.pv-candy .hero-num { color: var(--c-pink); }
.pv-candy .hero-streak { color: var(--c-purple); }
.pv-candy .card {
  background: var(--c-card);
  border: 1px solid rgba(242, 109, 138, 0.25);
  box-shadow: 0 3px 12px rgba(242, 109, 138, 0.12);
}
.pv-candy .btn-primary {
  background: linear-gradient(135deg, var(--c-pink), var(--c-purple));
  color: #fff;
  box-shadow: 0 4px 14px rgba(242, 109, 138, 0.35);
}
.pv-candy .week-bar { background: var(--c-purple); opacity: 0.5; }
.pv-candy .week-bar.today { background: var(--c-pink); opacity: 1; }
.pv-candy .tag { background: rgba(242, 109, 138, 0.14); color: var(--c-pink); }
.pv-candy .note { color: var(--c-pink); }
.pv-candy .pv-tabbar { background: rgba(255, 252, 252, 0.95); border-top: 1px solid rgba(242, 109, 138, 0.2); color: #b9a7b2; }
.pv-candy.dark .pv-tabbar { background: rgba(46, 36, 50, 0.95); border-top-color: rgba(255, 143, 171, 0.2); color: #8f7d93; }
.pv-candy .pv-tab.on { color: var(--c-pink); }

.pv-desc { max-width: 390px; margin: 12px auto 0; }
.pv-desc-line { font-size: 13px; line-height: 1.8; color: #555; }
.pv-suit { font-size: 12px; line-height: 1.8; color: #9a6a1f; margin-top: 6px; }
</style>
