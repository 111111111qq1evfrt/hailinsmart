<template>
  <!-- 只在非登录页显示 -->
  <div v-if="!isLoginPage" class="ai-assistant" :style="iconPosition">
    <!-- 机器人图标 - 支持拖动 -->
    <div
      class="ai-icon"
      :class="{ 'pulse': isThinking, 'dragging': isDragging }"
      @mousedown="startDrag"
      @click="handleClick"
    >
      <el-icon :size="32"><ChatDotRound /></el-icon>
    </div>

    <!-- 聊天弹窗 -->
    <el-dialog
      v-model="chatVisible"
      title="智慧体育助手"
      width="800px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <div class="chat-container">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message-item"
            :class="msg.role"
          >
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
          </div>

          <!-- 正在输入状态 -->
          <div v-if="isThinking" class="message-item assistant">
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="input-area">
          <el-input
            v-model="inputMessage"
            placeholder="输入您的问题..."
            :disabled="isThinking"
            @keyup.enter="sendMessage"
            type="textarea"
            :rows="2"
            resize="none"
          />
          <el-button
            type="primary"
            :icon="Promotion"
            :loading="isThinking"
            @click="sendMessage"
            :disabled="!inputMessage.trim() || isThinking"
          >
            发送
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ChatDotRound, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()

const chatVisible = ref(false)
const inputMessage = ref('')
const messages = ref([])
const isThinking = ref(false)
const isDragging = ref(false)
const messageListRef = ref(null)
const clickTimeoutRef = ref(null) // 点击延迟判断定时器

// 图标位置状态
const iconPosition = reactive({
  x: 'auto',
  y: 'auto',
  bottom: '24px',
  right: '24px'
})

// 拖拽状态
const dragState = reactive({
  startX: 0,
  startY: 0,
  startRight: 24,
  startBottom: 24,
  hasMoved: false // 标记是否发生了拖动
})

// 判断是否为登录页
const isLoginPage = computed(() => {
  return route.path === '/'
})

// 初始化欢迎消息
onMounted(() => {
  messages.value.push({
    role: 'assistant',
    content: '你好！我是智慧体育评测教学系统的智能助手。我可以帮你：\n\n• 查询学生体育成绩\n• 推荐运动项目\n• 提供各种帮助\n\n请问有什么可以帮你的吗？',
    time: getCurrentTime()
  })
  
  // 加载保存的位置
  const savedPos = localStorage.getItem('ai-assistant-position')
  if (savedPos) {
    try {
      const pos = JSON.parse(savedPos)
      iconPosition.right = pos.right + 'px'
      iconPosition.bottom = pos.bottom + 'px'
    } catch (e) {
      console.error('加载位置失败:', e)
    }
  }
})

// 开始拖动
const startDrag = (e) => {
  if (e.button !== 0) return // 只响应左键
  
  // 清除点击延迟定时器
  if (clickTimeoutRef.value) {
    clearTimeout(clickTimeoutRef.value)
    clickTimeoutRef.value = null
  }
  
  isDragging.value = true
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.startRight = parseFloat(iconPosition.right) || 24
  dragState.startBottom = parseFloat(iconPosition.bottom) || 24
  dragState.hasMoved = false // 重置拖动标记
  
  // 添加全局事件监听
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 拖动中
const onDrag = (e) => {
  if (!isDragging.value) return
  
  const deltaX = dragState.startX - e.clientX
  const deltaY = dragState.startY - e.clientY
  
  // 判断是否发生了有效拖动（移动超过5像素视为拖动）
  if (!dragState.hasMoved && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
    dragState.hasMoved = true
  }
  
  // 计算新位置（限制在可视区域内）
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const iconSize = 56
  
  let newRight = dragState.startRight + deltaX
  let newBottom = dragState.startBottom + deltaY
  
  // 边界限制
  newRight = Math.max(16, Math.min(windowWidth - iconSize - 16, newRight))
  newBottom = Math.max(16, Math.min(windowHeight - iconSize - 16, newBottom))
  
  // 更新位置
  iconPosition.right = newRight + 'px'
  iconPosition.bottom = newBottom + 'px'
  iconPosition.x = 'auto'
  iconPosition.y = 'auto'
}

// 停止拖动
const stopDrag = () => {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // 保存位置到本地存储
  localStorage.setItem('ai-assistant-position', JSON.stringify({
    right: parseFloat(iconPosition.right),
    bottom: parseFloat(iconPosition.bottom)
  }))
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 处理点击
const handleClick = () => {
  // 如果已经发生了拖动，直接重置状态并返回
  if (dragState.hasMoved) {
    dragState.hasMoved = false
    return
  }
  
  // 使用延迟判断，给拖动事件一个机会来设置 hasMoved
  clickTimeoutRef.value = setTimeout(() => {
    if (!dragState.hasMoved) {
      toggleChat()
    }
    dragState.hasMoved = false
  }, 100)
}

// 切换聊天窗口
const toggleChat = () => {
  chatVisible.value = !chatVisible.value
  if (chatVisible.value) {
    scrollToBottom()
  }
}

// 关闭聊天窗口
const handleClose = () => {
  chatVisible.value = false
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isThinking.value) return

  const userMessage = inputMessage.value.trim()
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userMessage,
    time: getCurrentTime()
  })
  
  inputMessage.value = ''
  scrollToBottom()

  // 设置思考状态
  isThinking.value = true

  try {
    // 使用流式响应
    const response = await fetch('http://localhost:8080/api/ai/assistant/ask/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: userMessage })
    })

    if (!response.ok) {
      throw new Error('请求失败')
    }

    // 创建助手消息占位
    const assistantMessageIndex = messages.value.push({
      role: 'assistant',
      content: '',
      time: getCurrentTime()
    }) - 1

    // 读取流式响应
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个不完整的行

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.substring(5).trim()
          if (data === '[DONE]') {
            break
          }
          try {
            // 尝试解析为JSON
            const event = JSON.parse(data)
            if (event.event === 'message') {
              messages.value[assistantMessageIndex].content += event.data
              scrollToBottom()
            } else if (event.event === 'status') {
            } else if (event.event === 'error') {
              throw new Error(event.data)
            }
          } catch (e) {
            // 如果JSON解析失败，直接将数据作为文本内容添加
            if (data && !data.startsWith('{')) {
              messages.value[assistantMessageIndex].content += data
              scrollToBottom()
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请稍后重试')
    
    // 添加错误消息
    messages.value.push({
      role: 'assistant',
      content: '抱歉，我遇到了一些问题，请稍后重试。',
      time: getCurrentTime()
    })
  } finally {
    isThinking.value = false
    scrollToBottom()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 格式化消息（支持换行）
const formatMessage = (content) => {
  return content.replace(/\n/g, '<br>')
}

// 获取当前时间
const getCurrentTime = () => {
  const now = new Date('2026-07-16T08:00:00')
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  z-index: 9999;
}

.ai-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #1E5AA8 0%, #3B82F6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 4px 12px rgba(30, 90, 168, 0.3);
  transition: all 0.3s ease;
  color: white;
  user-select: none;
  -webkit-user-select: none;
}

.ai-icon:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(30, 90, 168, 0.4);
}

.ai-icon:active {
  cursor: grabbing;
}

.ai-icon.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

.ai-icon.dragging {
  cursor: grabbing;
  opacity: 0.8;
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(30, 90, 168, 0.5);
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(30, 90, 168, 0.4);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(30, 90, 168, 0);
  }
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 16px;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
}

.message-item.user {
  justify-content: flex-end;
}

.message-item.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
}

.message-item.user .message-content {
  background: #1E5AA8;
  color: white;
  padding: 12px 16px;
  border-radius: 12px 12px 0 12px;
}

.message-item.assistant .message-content {
  background: white;
  color: #1A1A2E;
  padding: 12px 16px;
  border-radius: 12px 12px 12px 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.message-text {
  line-height: 1.6;
  word-break: break-word;
}

.message-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
  text-align: right;
}

.message-item.assistant .message-time {
  color: #9CA3AF;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #9CA3AF;
  border-radius: 50%;
  animation: typing 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}

.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-area :deep(.el-textarea) {
  flex: 1;
}

.input-area :deep(.el-textarea__inner) {
  border-radius: 8px;
  resize: none;
}

.input-area :deep(.el-button) {
  height: 56px;
  border-radius: 8px;
}
</style>