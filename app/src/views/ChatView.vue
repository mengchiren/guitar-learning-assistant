<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useChatStore, AI_PROVIDERS, takeAskContext } from '../stores/chat.js'

const chat = useChatStore()
const input = ref('')
const listEl = ref(null)

// 页面内入口带来的上下文（如「问一下这首歌」）
const pendingContext = ref('')
const contextShown = ref(false)

// AI 访问令牌（防刷）：没配置时提示填写；配置后可修改
const tokenInput = ref(chat.token)
const editingToken = ref(false)

const canSend = computed(() => input.value.trim().length > 0 && !chat.busy)

function saveToken() {
  chat.setToken(tokenInput.value)
  editingToken.value = false
}

onMounted(() => {
  pendingContext.value = takeAskContext()
  contextShown.value = Boolean(pendingContext.value)
  scrollToBottom()
})

function scrollToBottom() {
  nextTick(() => {
    listEl.value?.scrollTo({ top: listEl.value.scrollHeight })
  })
}

async function send() {
  const text = input.value.trim()
  if (!text || chat.busy) return
  input.value = ''
  const ctx = pendingContext.value
  pendingContext.value = ''
  contextShown.value = false
  await chat.send(text, ctx)
  scrollToBottom()
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}
</script>

<template>
  <div class="chat-wrap">
    <h1 class="page-title">AI 答疑</h1>

    <div class="card" style="padding: 10px 14px">
      <div class="provider-row">
        <span class="dim small">模型：</span>
        <span
          v-for="p in AI_PROVIDERS"
          :key="p.id"
          class="tag"
          :class="{ on: chat.provider === p.id }"
          @click="chat.setProvider(p.id)"
        >
          {{ p.label }}
        </span>
      </div>
    </div>

    <!-- AI 访问令牌（防刷，v0.5.0）：值在 Cloudflare 后台环境变量 ASK_TOKEN，配一次即可 -->
    <div v-if="!chat.token || editingToken" class="card" style="padding: 12px 14px">
      <label>AI 访问令牌（防刷用，只配一次）</label>
      <input v-model="tokenInput" type="password" placeholder="粘贴 ASK_TOKEN 环境变量的值" />
      <div class="btn-row" style="margin-top: 8px">
        <button class="btn btn-primary" :disabled="!tokenInput.trim()" @click="saveToken">保存令牌</button>
        <button v-if="chat.token" class="btn" @click="editingToken = false; tokenInput = chat.token">取消</button>
      </div>
      <p class="muted small" style="margin-top: 6px">
        令牌怎么来的：Cloudflare 控制台 → Pages → 环境变量 → 添加 <b>ASK_TOKEN</b>（一长串随机字符）→ 重新部署，然后填到这里。
      </p>
    </div>
    <div v-else class="card" style="padding: 10px 14px">
      <div class="provider-row">
        <span class="dim small">AI 访问令牌：</span>
        <span class="dim small">已配置（防刷保护中）</span>
        <button class="btn small-btn" style="margin-left: auto" @click="editingToken = true; tokenInput = chat.token">修改</button>
      </div>
    </div>

    <div ref="listEl" class="msg-list">
      <div v-if="!chat.history.length" class="card muted small" style="text-align: center">
        <p style="margin-bottom: 6px">练琴遇到问题直接问。</p>
        <p>例如：F 和弦按不响怎么办？扫弦总刮到别的弦？这周练习包怎么安排？</p>
      </div>

      <template v-for="(m, i) in chat.history" :key="i">
        <div class="msg-row" :class="m.role">
          <div class="msg-bubble">
            <div class="msg-text">{{ m.content }}</div>
          </div>
        </div>
      </template>

      <div v-if="chat.busy" class="msg-row assistant">
        <div class="msg-bubble">
          <div class="msg-text dim">思考中…</div>
        </div>
      </div>
    </div>

    <div v-if="chat.error" class="card small" style="color: var(--danger); padding: 10px 14px">
      {{ chat.error }}
    </div>

    <div v-if="contextShown" class="small dim" style="margin: 8px 2px 0">
      已带上刚才页面的信息，直接提问即可。
    </div>

    <div class="input-row">
      <textarea
        v-model="input"
        rows="2"
        placeholder="问问你的练琴问题…（Enter 发送，Shift+Enter 换行）"
        @keydown="onKeydown"
      ></textarea>
      <div class="btn-row" style="margin-top: 8px">
        <button class="btn btn-primary" :disabled="!canSend" @click="send">发送</button>
        <button v-if="chat.history.length" class="btn" @click="chat.clear()">清空对话</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-wrap { display: flex; flex-direction: column; height: calc(100dvh - 140px); min-height: 420px; }
.provider-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.msg-list { flex: 1; overflow-y: auto; padding: 8px 2px; display: flex; flex-direction: column; gap: 10px; }
.msg-row { display: flex; }
.msg-row.user { justify-content: flex-end; }
.msg-row.assistant { justify-content: flex-start; }
.msg-bubble { max-width: 88%; padding: 10px 14px; border-radius: 12px; }
.msg-row.user .msg-bubble { background: var(--accent, #e30613); color: #fff; border-bottom-right-radius: 4px; }
.msg-row.assistant .msg-bubble { background: #fff; border: 1px solid var(--line, #e4e2da); border-bottom-left-radius: 4px; }
.msg-text { white-space: pre-wrap; word-break: break-word; font-size: 15px; line-height: 1.6; }
.input-row { margin-top: 10px; }
.input-row textarea { width: 100%; }
.small-btn { padding: 4px 10px; font-size: 13px; }
</style>
