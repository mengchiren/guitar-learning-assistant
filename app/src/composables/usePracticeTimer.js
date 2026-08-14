import { ref, computed } from 'vue'

// 练习计时器：开始/暂停/结束，累计秒数（含暂停恢复）
export function usePracticeTimer() {
  const running = ref(false)
  const startedAt = ref(0)
  const accumulated = ref(0) // 秒
  const now = ref(0)
  let timer = null

  const elapsedSec = computed(() => {
    now.value // 显式依赖：每秒 tick 触发重新计算
    return accumulated.value + (running.value ? (Date.now() - startedAt.value) / 1000 : 0)
  })

  function start() {
    if (running.value) return
    running.value = true
    startedAt.value = Date.now()
    timer = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  }

  function pause() {
    if (!running.value) return
    accumulated.value += (Date.now() - startedAt.value) / 1000
    running.value = false
    if (timer) clearInterval(timer)
    timer = null
  }

  function stop() {
    if (running.value) {
      accumulated.value += (Date.now() - startedAt.value) / 1000
      running.value = false
    }
    if (timer) clearInterval(timer)
    timer = null
  }

  function reset() {
    stop()
    accumulated.value = 0
  }

  return { running, elapsedSec, start, pause, stop, reset }
}
