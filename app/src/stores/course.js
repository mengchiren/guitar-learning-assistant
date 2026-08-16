import { defineStore } from 'pinia'
import { load, save } from '../utils/storage'
import { COURSE_CATALOG } from '../data/courseCatalog.js'

// 成田课程进度：按套（basic/intermediate/core）记录已学课与当前学到第几课。
// 课程目录为内置数据（由视频教程文件名解析生成），网页无法直接读本地文件路径。
export const useCourseStore = defineStore('course', {
  state: () => ({
    // { basic: { done: [lessonKey], current: lessonKey }, ... }
    progress: load('course-progress', {}),
  }),
  getters: {
    catalog() {
      return COURSE_CATALOG
    },
    // 每套课的进度摘要：{ done, total, percent, currentTitle }
    summaryOf() {
      return (courseId) => {
        const course = COURSE_CATALOG.find((c) => c.id === courseId)
        if (!course) return null
        const p = this.progress[courseId] || { done: [], current: null }
        const done = p.done.length
        const total = course.total
        const current = course.lessons.find((l) => l.key === p.current) || null
        return {
          done,
          total,
          percent: total ? Math.round((done / total) * 100) : 0,
          currentTitle: current ? `${current.no}·${current.title}` : null,
        }
      }
    },
  },
  actions: {
    ensure(courseId) {
      if (!this.progress[courseId]) this.progress[courseId] = { done: [], current: null }
      return this.progress[courseId]
    },
    toggleLesson(courseId, key) {
      const p = this.ensure(courseId)
      const i = p.done.indexOf(key)
      if (i >= 0) p.done.splice(i, 1)
      else p.done.push(key)
      // 勾选即视为学到这；当前课取已学里序号最大者（按课表顺序）
      const course = COURSE_CATALOG.find((c) => c.id === courseId)
      const idx = course.lessons.findIndex((l) => l.key === key)
      const curIdx = p.current ? course.lessons.findIndex((l) => l.key === p.current) : -1
      if (idx > curIdx) p.current = key
      save('course-progress', this.progress)
    },
    setCurrent(courseId, key) {
      const p = this.ensure(courseId)
      p.current = key
      save('course-progress', this.progress)
    },
  },
})
