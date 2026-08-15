import { ref, onUnmounted } from 'vue'

// 响应式媒体查询：窗口缩放时自动更新（客户端应用，无 SSR）
export function useMediaQuery(query) {
  const mq = window.matchMedia(query)
  const matches = ref(mq.matches)
  const onChange = (e) => {
    matches.value = e.matches
  }
  mq.addEventListener('change', onChange)
  onUnmounted(() => mq.removeEventListener('change', onChange))
  return matches
}
