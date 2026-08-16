<script setup>
import { ref, computed } from 'vue'
import { useCourseStore } from '../stores/course'
import Icon from '../components/Icon.vue'

const course = useCourseStore()
const activeId = ref('basic')

const activeCourse = computed(() => course.catalog.find((c) => c.id === activeId.value))
const progress = computed(() => course.progress[activeId.value] || { done: [], current: null })
const summary = computed(() => course.summaryOf(activeId.value))

function isDone(key) {
  return progress.value.done.includes(key)
}
function isCurrent(key) {
  return progress.value.current === key
}
</script>

<template>
  <div>
    <h1 class="page-title">课程进度</h1>

    <p class="muted small" style="margin-bottom: 12px">
      成田电吉他三套课目录（按你电脑里的视频文件名整理）。勾选已学过的课，自动记录学到第几课。零基础阶段建议以基本功 + 入门歌曲为主，课程作为进阶衔接。
    </p>

    <div class="tag-row course-tabs">
      <span
        v-for="c in course.catalog"
        :key="c.id"
        class="tag"
        :class="{ on: activeId === c.id }"
        @click="activeId = c.id"
      >
        {{ c.name }}
      </span>
    </div>

    <div class="card">
      <div class="prog-head">
        <div>
          <div class="prog-name">{{ activeCourse.name }}</div>
          <div class="dim small">已学 {{ summary.done }} / {{ summary.total }} 课 · 进度 {{ summary.percent }}%</div>
        </div>
        <div v-if="summary.currentTitle" class="tag on">学到：{{ summary.currentTitle }}</div>
      </div>
      <div class="prog-track">
        <div class="prog-fill" :style="{ width: summary.percent + '%' }"></div>
      </div>
    </div>

    <div class="card lesson-list">
      <div
        v-for="l in activeCourse.lessons"
        :key="l.key"
        class="lesson-row"
        :class="{ done: isDone(l.key), current: isCurrent(l.key) }"
      >
        <button
          class="check-btn"
          :class="{ on: isDone(l.key) }"
          :aria-label="isDone(l.key) ? `取消已学${l.title}` : `标记已学${l.title}`"
          @click="course.toggleLesson(activeId, l.key)"
        >
          <Icon :name="isDone(l.key) ? 'check-circle' : 'circle'" :size="20" />
        </button>
        <span class="lesson-no dim small">{{ l.no }}</span>
        <span class="lesson-title small">{{ l.title }}</span>
        <button
          v-if="!isCurrent(l.key)"
          class="set-cur-btn"
          @click="course.setCurrent(activeId, l.key)"
        >
          学到这
        </button>
        <span v-else class="tag on" style="font-size: 12px">学到这</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-tabs { margin-bottom: 12px; flex-wrap: wrap; }
.prog-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
.prog-name { font-size: 16px; font-weight: 700; }
.prog-track { height: 8px; background: var(--bg-input); border-radius: 999px; overflow: hidden; }
.prog-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.2s; }

.lesson-list { padding: 8px 10px; }
.lesson-row {
  display: flex; align-items: center; gap: 8px; padding: 8px 6px;
  border-radius: 6px;
}
.lesson-row + .lesson-row { border-top: 1px dashed var(--border); }
.lesson-row.current { background: #fdf1f1; }
.lesson-row.done .lesson-title { color: var(--text-dim); text-decoration: line-through; }
.lesson-no { width: 30px; flex: none; }
.lesson-title { flex: 1; }
.check-btn {
  flex: none; background: none; border: none; padding: 2px;
  color: var(--text-dim); cursor: pointer; display: flex;
}
.check-btn.on { color: var(--ok); }
.set-cur-btn {
  flex: none; border: 1px solid var(--border); background: #fff;
  color: var(--text-dim); font-size: 12px; padding: 2px 8px;
  border-radius: 999px; cursor: pointer;
}
</style>
