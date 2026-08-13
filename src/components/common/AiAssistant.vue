<template>
  <!-- 只在非登录页、非全屏页显示 -->
  <div v-if="showAssistant" class="ai-assistant" :style="iconPosition">
    <!-- 机器人图标 - 支持拖动 -->
    <div
      class="ai-icon"
      :class="{ 'dragging': isDragging, 'bounce': isBouncing, 'wiggle': isWiggling, 'walking': walkState.walking }"
      @mousedown="startDrag"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <img
        ref="robotImgRef"
        src="/robot.png"
        alt="AI助手"
        class="robot-img"
      />

      <!-- 走动状态指示器 -->
      <div v-if="walkState.walking" class="walk-indicator" title="双击停止走动">
        <span class="walk-dot"></span>
      </div>

      <!-- 悬浮提示 -->
      <transition name="tooltip">
        <div v-if="showTooltip" class="tooltip">
          <div class="tooltip-title">你好，我是AI智能体育助手 👋</div>
          <div class="tooltip-desc">{{ currentPageIntro }}</div>
          <div class="tooltip-arrow"></div>
        </div>
      </transition>

      <!-- 双击提示气泡（首次显示） -->
      <transition name="tooltip">
        <div v-if="showDoubleClickHint" class="tooltip dblclick-hint">
          <div class="tooltip-title">💡 双击让我走动</div>
          <div class="tooltip-desc">双击图标可以让我走起来，再次双击停止</div>
          <div class="tooltip-arrow"></div>
        </div>
      </transition>

      <!-- 思考时的指示器 -->
      <transition name="fade">
        <div v-if="isThinking" class="thinking-indicator">
          <span></span><span></span><span></span>
        </div>
      </transition>
    </div>

    <!-- 聊天弹窗 -->
    <el-dialog
      v-model="chatVisible"
      title="智慧体育 AI 助手"
      width="800px"
      :close-on-click-modal="false"
      @close="handleClose"
      class="ai-dialog"
    >
      <div class="chat-container">
        <!-- 欢迎区 -->
        <div class="welcome-section" v-if="messages.length <= 1">
          <div class="welcome-robot">
            <img src="/robot.png" alt="AI" />
          </div>
          <div class="welcome-text">
            <div class="welcome-greeting">你好！我是AI智能体育助手 🤖</div>
            <div class="welcome-intro">{{ currentPageIntro }}</div>
            <div class="welcome-tips">我可以帮你：查询成绩、分析数据、解答体育教学问题</div>
          </div>
        </div>

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

        <!-- 快捷问题 -->
        <div class="quick-questions" v-if="messages.length <= 1">
          <div class="quick-label">试试问我：</div>
          <div class="quick-btns">
            <el-tag
              v-for="(q, i) in quickQuestions"
              :key="i"
              class="quick-tag"
              @click="askQuick(q)"
            >{{ q }}</el-tag>
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
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import gsap from 'gsap'

const route = useRoute()

const chatVisible = ref(false)
const inputMessage = ref('')
const messages = ref([])
const isThinking = ref(false)
const isDragging = ref(false)
const isBouncing = ref(false)
const isWiggling = ref(false)
const showTooltip = ref(false)
const showDoubleClickHint = ref(false)
const messageListRef = ref(null)
const clickTimeoutRef = ref(null)
const bounceTimer = ref(null)
const robotImgRef = ref(null)

// GSAP 旋转状态
let spinTween = null     // 持续旋转补间
let isHovering = false   // 是否 hover 中
let isLongPress = false  // 是否长按中
let longPressTimer = null
let longPressTriggered = false  
let spinSpeedTween = null  // 加在 spinTween 旁边

const startSpin = () => {
  if (!robotImgRef.value) return
  if (spinTween) { spinTween.kill(); spinTween = null }
  if (spinSpeedTween) { spinSpeedTween.kill(); spinSpeedTween = null }

  gsap.set(robotImgRef.value, { rotation: 0, scaleX: walkState.facing })

  // 1. 基础旋转：匀速无限循环，保证每圈衔接丝滑
  spinTween = gsap.to(robotImgRef.value, {
    rotation: '+=360',
    duration: 1.2,
    ease: 'none',
    repeat: -1,
    transformOrigin: '50% 50%'
  })

  // 2. 持续加速：让整个旋转越转越快，不会每圈重置
  spinSpeedTween = gsap.to(spinTween, {
    timeScale: 8,
    duration: 6,
    ease: 'power2.in'
  })
}

const stopSpin = () => {
  if (spinSpeedTween) { spinSpeedTween.kill(); spinSpeedTween = null }
  if (spinTween) { spinTween.kill(); spinTween = null }
  if (robotImgRef.value) {
    gsap.to(robotImgRef.value, {
      rotation: 0,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: true,
      onComplete: () => {
        gsap.set(robotImgRef.value, { scaleX: walkState.facing })
      }
    })
  }
}

// 更新图片朝向（走动时调用）
const updateFacing = (facing) => {
  walkState.facing = facing
  // 如果没在旋转，直接设置 scaleX
  if (!spinTween && robotImgRef.value) {
    gsap.set(robotImgRef.value, { scaleX: facing })
  }
}

// 图标位置 - 用 left/bottom 方便走动
const iconPosition = reactive({
  left: window.innerWidth - 88 + 'px',
  bottom: '24px'
})

// 走动状态
const walkState = reactive({
  walking: false,
  facing: 1, // 图片朝向：1 面右，-1 面左
  walkTween: null, // GSAP 补间
  idleTimer: null  // 下一次走动的定时器
})

// GSAP 随机游走
const startWalking = () => {
  if (walkState.walking) return
  walkState.walking = true
  scheduleNextWalk()
}

const stopWalking = () => {
  walkState.walking = false
  if (walkState.walkTween) {
    walkState.walkTween.kill()
    walkState.walkTween = null
  }
  if (walkState.idleTimer) {
    clearTimeout(walkState.idleTimer)
    walkState.idleTimer = null
  }
}

// 规划下一次走动
const scheduleNextWalk = () => {
  if (!walkState.walking || isDragging.value || chatVisible.value) return

  // 随机停留 1.5-4 秒后再走
  const idleDuration = 1500 + Math.random() * 2500
  walkState.idleTimer = setTimeout(() => {
    doWalk()
  }, idleDuration)
}

// 执行一次走动
const doWalk = () => {
  if (!walkState.walking || isDragging.value || chatVisible.value) return

  const iconSize = 64
  const margin = 24
  const currentLeft = parseFloat(iconPosition.left) || (window.innerWidth - 88)
  const currentBottom = parseFloat(iconPosition.bottom) || 24

  // 活动范围：以当前位置为中心，半径 80-200px
  const radius = 80 + Math.random() * 120
  const angle = Math.random() * Math.PI * 2 // 任意方向

  let targetLeft = currentLeft + Math.cos(angle) * radius
  let targetBottom = currentBottom + Math.sin(angle) * radius * 0.6 // 上下幅度小一些

  // 限制不超出屏幕
  const minLeft = margin
  const maxLeft = window.innerWidth - iconSize - margin
  const minBottom = 16
  const maxBottom = window.innerHeight * 0.5 // 最多到屏幕中部

  targetLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft))
  targetBottom = Math.max(minBottom, Math.min(maxBottom, targetBottom))

  // 设置朝向
  if (targetLeft < currentLeft - 5) {
    updateFacing(-1)
  } else if (targetLeft > currentLeft + 5) {
    updateFacing(1)
  }

  // 走动耗时根据距离计算
  const dist = Math.sqrt((targetLeft - currentLeft) ** 2 + (targetBottom - currentBottom) ** 2)
  const duration = Math.max(0.8, dist / 120) // 速度约 120px/s

  // GSAP 补间走动
  const proxy = { left: currentLeft, bottom: currentBottom }
  walkState.walkTween = gsap.to(proxy, {
    left: targetLeft,
    bottom: targetBottom,
    duration: duration,
    ease: 'sine.inOut',
    onUpdate: () => {
      iconPosition.left = proxy.left + 'px'
      iconPosition.bottom = proxy.bottom + 'px'
    },
    onComplete: () => {
      walkState.walkTween = null
      scheduleNextWalk()
    }
  })
}

// 拖拽时暂停走动
const pauseWalking = () => {
  stopWalking()
}

const resumeWalking = () => {
  startWalking()
}

// 拖拽状态
const dragState = {
  startX: 0,
  startY: 0,
  startLeft: 0,
  startBottom: 24,
  hasMoved: false
}

// 全屏页列表
const fullscreenPages = ['/data/visualization']

// 是否显示助手
const showAssistant = computed(() => {
  const isLogin = route.path === '/'
  const isFullscreen = fullscreenPages.includes(route.path)
  return !isLogin && !isFullscreen
})

// 路由 -> 页面介绍映射
const routeIntroMap = {
  '/home': '当前在【系统概览】页面，可以查看学校整体数据统计、运动趋势和预警信息。',
  '/profile': '当前在【个人中心】页面，可以查看和修改个人信息、密码等。',
  '/system/users': '当前在【用户管理】页面，可以管理系统用户账号、分配角色权限。',
  '/system/students': '当前在【学生管理】页面，可以管理学生档案、班级信息、人脸采集等。',
  '/system/devices': '当前在【设备管理】页面，可以查看和管理体育测试设备。',
  '/system/workorders': '当前在【工单管理】页面，可以处理请假审批、教学申请等工单。',
  '/system/resources': '当前在【资源管理】页面，可以管理教学资源和视频资源。',
  '/system/notifications': '当前在【通知中心】页面，可以查看系统通知和消息。',
  '/system/settings': '当前在【系统设置】页面，可以配置学校信息、系统参数。',
  '/system/version': '当前在【版本管理】页面，可以查看系统版本信息。',
  '/system/feedback': '当前在【客服反馈】页面，可以提交使用反馈和问题报告。',
  '/exam': '当前在【体育考试】页面，可以组织和管理体育考试流程。',
  '/national-test': '当前在【国家体测】页面，可以查看国家学生体质健康标准测试数据。',
  '/practice': '当前在【自由练习】页面，可以让学生自由选择项目进行练习。',
  '/test-terminal': '当前在【测试终端】页面，可以在大屏终端上进行体育测试。',
  '/teaching-videos': '当前在【教学视频】页面，可以观看体育教学视频资源。',
  '/evaluation/assessment': '当前在【评价管理】页面，可以查看学生综合评价、AI点评和成长档案。',
  '/evaluation/teaching': '当前在【教学管理】页面，可以管理教学计划、课程安排。',
  '/evaluation/leader': '当前在【校领导面板】页面，可以查看学校整体评价数据和统计分析。',
  '/evaluation/ai-review': '当前在【AI智能点评】页面，可以查看AI生成的学生体育表现点评。',
  '/data/overview': '当前在【数据总览】页面，可以查看全学校的体育数据汇总。',
  '/data/student': '当前在【学生数据中心】页面，可以查看学生个体的详细体育数据。',
  '/data/analysis': '当前在【数据分析中心】页面，可以进行多维度数据分析和对比。',
  '/data/health': '当前在【健康监测看板】页面，可以监测学生健康状况和体测异常。',
  '/data/maintenance': '当前在【维修数据分析】页面，可以查看设备维修数据。'
}

// 当前页面介绍
const currentPageIntro = computed(() => {
  return routeIntroMap[route.path] || '我可以帮你查询体育成绩、分析运动数据、解答教学相关问题。'
})

// 快捷问题
const quickQuestions = computed(() => {
  const base = ['如何查看学生成绩？', '如何组织体育考试？', '如何导出数据？']
  const routeSpecific = {
    '/home': ['今日有多少学生达标？', '最近运动趋势如何？', '有哪些预警需要处理？'],
    '/evaluation/assessment': ['如何评价一个学生？', 'AI点评怎么生成？', '如何发布作业？'],
    '/evaluation/ai-review': ['AI点评标准是什么？', '如何批量生成点评？', '点评可以修改吗？'],
    '/data/overview': ['全校达标率是多少？', '哪个年级成绩最好？', '如何提升及格率？'],
    '/system/students': ['如何批量导入学生？', '如何采集人脸？', '如何分班？'],
    '/exam': ['如何创建考试？', '考试成绩怎么录入？', '如何发布考试？']
  }
  return routeSpecific[route.path] || base
})

// 悬浮事件
const handleMouseEnter = () => {
  isHovering = true
  showTooltip.value = true
  if (chatVisible.value) return
  triggerBounce()
  // hover 时启动旋转
  startSpin()
}

const handleMouseLeave = () => {
  isHovering = false
  showTooltip.value = false
  clearTimeout(autoTooltipTimer)
  // 如果不在长按，停止旋转
  if (!isLongPress) {
    stopSpin()
  }
}

// 触发弹跳动效
const triggerBounce = () => {
  isBouncing.value = true
  clearTimeout(bounceTimer.value)
  bounceTimer.value = setTimeout(() => {
    isBouncing.value = false
  }, 600)
}

// 自动 tooltip 定时器
let autoTooltipTimer = null

// 延迟显示 tooltip，等页面渲染完成
const delayedShowTooltip = (delay = 800, duration = 4000) => {
  nextTick(() => {
    setTimeout(() => {
      showTooltip.value = true
      clearTimeout(autoTooltipTimer)
      autoTooltipTimer = setTimeout(() => {
        showTooltip.value = false
      }, duration)
    }, delay)
  })
}

// 随机 wiggle 定时器
let wiggleTimer = null

const startRandomWiggle = () => {
  const doWiggle = () => {
    isWiggling.value = true
    setTimeout(() => {
      isWiggling.value = false
      // 随机 5-12 秒后再摇头
      const nextDelay = 5000 + Math.random() * 7000
      wiggleTimer = setTimeout(doWiggle, nextDelay)
    }, 800)
  }
  // 首次 3 秒后开始
  wiggleTimer = setTimeout(doWiggle, 3000)
}

// 初始化
onMounted(() => {
  messages.value.push({
    role: 'assistant',
    content: '你好！我是智慧体育评测教学系统的AI智能助手 🤖\n\n' + currentPageIntro.value + '\n\n请问有什么可以帮你的吗？',
    time: getCurrentTime()
  })

  // 等页面渲染完成后再显示欢迎提示
  delayedShowTooltip(1500, 4000)

  // 启动随机 wiggle 动画
  startRandomWiggle()

  // 加载保存的位置
  const savedPos = localStorage.getItem('ai-assistant-position')
  if (savedPos) {
    try {
      const pos = JSON.parse(savedPos)
      if (pos.left != null) {
        iconPosition.left = pos.left + 'px'
        iconPosition.bottom = pos.bottom + 'px'
      }
    } catch (e) {
      // ignore
    }
  }

  // 初始化图片朝向（默认静止，不走动）
  nextTick(() => {
    if (robotImgRef.value) {
      gsap.set(robotImgRef.value, { scaleX: walkState.facing })
    }
  })

  // 显示双击提示（首次使用时）
  const hintShown = sessionStorage.getItem('ai-assistant-dblclick-hint-shown')
  if (!hintShown) {
    setTimeout(() => {
      showDoubleClickHint.value = true
      setTimeout(() => {
        showDoubleClickHint.value = false
        sessionStorage.setItem('ai-assistant-dblclick-hint-shown', '1')
      }, 5000)
    }, 3000)
  }
})

onBeforeUnmount(() => {
  clearTimeout(wiggleTimer)
  clearTimeout(autoTooltipTimer)
  clearTimeout(longPressTimer)
  stopWalking()
  if (spinTween) {
    spinTween.kill()
    spinTween = null
  }
})

// 路由变化时：等页面渲染完成后再显示 tooltip
watch(() => route.path, () => {
  delayedShowTooltip(800, 4000)

  if (messages.value.length > 1 && !chatVisible.value) {
    messages.value.push({
      role: 'assistant',
      content: `已切换到新页面。${currentPageIntro.value}`,
      time: getCurrentTime()
    })
  }
})

// 开始拖动
const startDrag = (e) => {
  if (e.button !== 0) return
  if (clickTimeoutRef.value) {
    clearTimeout(clickTimeoutRef.value)
    clickTimeoutRef.value = null
  }
  stopWalking()
  isDragging.value = true
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.startLeft = parseFloat(iconPosition.left) || 0
  dragState.startBottom = parseFloat(iconPosition.bottom) || 24
  dragState.hasMoved = false
  longPressTriggered = false 

  // 长按 500ms 后启动旋转（如果没移动）
  clearTimeout(longPressTimer)
  longPressTimer = setTimeout(() => {
    if (!dragState.hasMoved) {
      isLongPress = true
      longPressTriggered = true
      startSpin()
    }
  }, 500)

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return

  const deltaX = dragState.startX - e.clientX
  const deltaY = dragState.startY - e.clientY

  if (!dragState.hasMoved && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
    dragState.hasMoved = true
    // 移动了就取消长按旋转
    clearTimeout(longPressTimer)
    if (!isLongPress) {
      clearTimeout(longPressTimer)
    }

  }

  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const iconSize = 64

  let newLeft = dragState.startLeft - deltaX
  let newBottom = dragState.startBottom + deltaY

  newLeft = Math.max(16, Math.min(windowWidth - iconSize - 16, newLeft))
  newBottom = Math.max(16, Math.min(windowHeight - iconSize - 16, newBottom))

  iconPosition.left = newLeft + 'px'
  iconPosition.bottom = newBottom + 'px'
}

const stopDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false
  clearTimeout(longPressTimer)

  // 松开时停止长按旋转
  if (isLongPress) {
    isLongPress = false
    if (!isHovering) stopSpin()
  }

  localStorage.setItem('ai-assistant-position', JSON.stringify({
    left: parseFloat(iconPosition.left),
    bottom: parseFloat(iconPosition.bottom)
  }))

  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)

  // 如果之前在走动，松开后恢复走动；否则保持静止
  if (walkState.walking) {
    startWalking()
  }
}

// 双击标记：双击时阻止 click 事件打开聊天
let dblclickTriggered = false

const handleClick = () => {
  if (dragState.hasMoved) {
    dragState.hasMoved = false
    return
  }
  if (longPressTriggered) {
    longPressTriggered = false
    return
  }
  // 清除之前可能残留的 timeout
  if (clickTimeoutRef.value) {
    clearTimeout(clickTimeoutRef.value)
    clickTimeoutRef.value = null
  }
  clickTimeoutRef.value = setTimeout(() => {
    // 如果是双击触发的 click，跳过 toggleChat
    if (!dblclickTriggered && !dragState.hasMoved) {
      toggleChat()
    }
    dblclickTriggered = false
    dragState.hasMoved = false
  }, 280)
}

// 双击切换走动状态
const handleDoubleClick = () => {
  // 标记双击，阻止 click 事件执行
  dblclickTriggered = true
  // 立即清除待执行的点击
  if (clickTimeoutRef.value) {
    clearTimeout(clickTimeoutRef.value)
    clickTimeoutRef.value = null
  }
  
  showDoubleClickHint.value = false
  
  if (walkState.walking) {
    stopWalking()
    ElMessage.info('已停止走动，双击可以让我再次走起来', 2000)
  } else {
    startWalking()
    ElMessage.success('开始走动～双击可以让我停止', 2000)
  }
}

const toggleChat = () => {
  chatVisible.value = !chatVisible.value
  if (chatVisible.value) {
    scrollToBottom()
  }
}

const handleClose = () => {
  chatVisible.value = false
}

const askQuick = (question) => {
  inputMessage.value = question
  sendMessage()
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isThinking.value) return

  const userMessage = inputMessage.value.trim()
  const token = localStorage.getItem('smart_pe_token') || ''

  messages.value.push({
    role: 'user',
    content: userMessage,
    time: getCurrentTime()
  })

  inputMessage.value = ''
  scrollToBottom()
  isThinking.value = true

  try {
    const response = await fetch('/api/ai/assistant/ask/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message: userMessage })
    })

    if (!response.ok) {
      throw new Error('请求失败')
    }

    const assistantMessageIndex = messages.value.push({
      role: 'assistant',
      content: '',
      time: getCurrentTime()
    }) - 1

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.substring(5).trim()
          if (data === '[DONE]') break
          try {
            const event = JSON.parse(data)
            if (event.event === 'message') {
              messages.value[assistantMessageIndex].content += event.data
              scrollToBottom()
            }
          } catch (e) {
            if (data && !data.startsWith('{')) {
              messages.value[assistantMessageIndex].content += data
              scrollToBottom()
            }
          }
        }
      }
    }

  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，我暂时无法回复。您可以尝试其他问题，或稍后重试。',
      time: getCurrentTime()
    })
  } finally {
    isThinking.value = false
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const formatMessage = (content) => {
  return content.replace(/\n/g, '<br>')
}

const getCurrentTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  z-index: 9999;
}

.ai-icon {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  position: relative;
  animation: walkBob 0.6s ease-in-out infinite;
}

.robot-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  /* scaleX 翻转由 inline style 控制 */
}

@keyframes walkBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}

/* hover 时 - 正常上下浮动 */
.ai-icon:hover {
  animation: hoverBounce 1s ease-in-out infinite;
}

@keyframes hoverBounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

.ai-icon:active {
  cursor: grabbing;
}

.ai-icon.dragging {
  cursor: grabbing;
  animation: none;
}

/* 旋转动画由 GSAP 控制，无需 CSS */

/* 随机 wiggle */
.ai-icon.wiggle {
  animation: robotWiggle 0.8s ease-in-out;
}

@keyframes robotWiggle {
  0%   { transform: rotate(0deg) scale(1); }
  25%  { transform: rotate(-20deg) scale(1.06); }
  50%  { transform: rotate(15deg) scale(1.04); }
  75%  { transform: rotate(-10deg) scale(1.02); }
  100% { transform: rotate(0deg) scale(1); }
}

.ai-icon.bounce {
  animation: bounceFun 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounceFun {
  0%   { transform: scale(1) translateY(0); }
  30%  { transform: scale(0.85) translateY(0); }
  50%  { transform: scale(1.25) translateY(-20px); }
  70%  { transform: scale(0.95) translateY(0); }
  100% { transform: scale(1) translateY(0); }
}

/* 悬浮提示 */
.tooltip {
  position: absolute;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  background: #FFFFFF;
  border: 1px solid #E8EAED;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
  pointer-events: none;
  z-index: 10000;
}

.tooltip-title {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
  margin-bottom: 4px;
}

.tooltip-desc {
  font-size: 12px;
  color: #6B7280;
  max-width: 260px;
  white-space: normal;
  line-height: 1.5;
}

.tooltip-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  background: #FFFFFF;
  border-right: 1px solid #E8EAED;
  border-bottom: 1px solid #E8EAED;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

/* 走动状态下的图标样式 */
.ai-icon.walking {
  animation: walkBob 0.6s ease-in-out infinite;
}

/* 走动指示器 - 小蓝点 */
.walk-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background: #1E5AA8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(30, 90, 168, 0.5);
  cursor: pointer;
  pointer-events: auto;
}

.walk-dot {
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  animation: walkDotPulse 1s ease-in-out infinite;
}

@keyframes walkDotPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.7; }
}

/* 双击提示特殊样式 */
.dblclick-hint {
  background: linear-gradient(135deg, #FFF7E6 0%, #FFF 100%);
  border-color: #FFD666;
  animation: hintBounce 0.5s ease-out;
}

.dblclick-hint .tooltip-title {
  color: #F5A623;
}

@keyframes hintBounce {
  0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
  50% { transform: translateX(-50%) scale(1.05); }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
}

/* 思考指示器 */
.thinking-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  display: flex;
  gap: 2px;
  background: #1E5AA8;
  border-radius: 10px;
  padding: 4px 6px;
  box-shadow: 0 2px 8px rgba(30, 90, 168, 0.4);
}

.thinking-indicator span {
  width: 5px;
  height: 5px;
  background: #FFFFFF;
  border-radius: 50%;
  animation: thinking 1.2s ease-in-out infinite;
}

.thinking-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking {
  0%, 60%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  30% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 聊天弹窗 */
:deep(.ai-dialog) {
  border-radius: 16px;
}

:deep(.ai-dialog .el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #E8EAED;
  margin: 0;
}

:deep(.ai-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

:deep(.ai-dialog .el-dialog__body) {
  padding: 0;
  height: 580px;
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 欢迎区 */
.welcome-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #EEF6FF 0%, #F7F8FA 100%);
  border-bottom: 1px solid #E8EAED;
}

.welcome-robot img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.welcome-text {
  flex: 1;
}

.welcome-greeting {
  font-size: 16px;
  font-weight: 600;
  color: #1E5AA8;
  margin-bottom: 4px;
}

.welcome-intro {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
  margin-bottom: 4px;
}

.welcome-tips {
  font-size: 12px;
  color: #9CA3AF;
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: #FFFFFF;
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
  border-radius: 16px 16px 0 16px;
}

.message-item.assistant .message-content {
  background: #F7F8FA;
  color: #1A1A2E;
  padding: 12px 16px;
  border-radius: 16px 16px 16px 0;
  border: 1px solid #E8EAED;
}

.message-text {
  line-height: 1.6;
  word-break: break-word;
  font-size: 14px;
}

.message-time {
  font-size: 11px;
  margin-top: 4px;
}

.message-item.user .message-time {
  color: rgba(255, 255, 255, 0.7);
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

/* 快捷问题 */
.quick-questions {
  padding: 12px 24px 0;
  border-top: 1px solid #F0F2F5;
}

.quick-label {
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 8px;
}

.quick-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #DBEAFE;
  background: #EEF6FF;
  color: #1E5AA8;
  font-size: 12px;
}

.quick-tag:hover {
  background: #1E5AA8;
  color: #FFFFFF;
  border-color: #1E5AA8;
}

/* 输入区 */
.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  padding: 12px 24px 20px;
  background: #FFFFFF;
  border-top: 1px solid #F0F2F5;
}

.input-area :deep(.el-textarea) {
  flex: 1;
}

.input-area :deep(.el-textarea__inner) {
  border-radius: 10px;
  resize: none;
  border-color: #E8EAED;
  transition: border-color 0.2s ease;
}

.input-area :deep(.el-textarea__inner:focus) {
  border-color: #1E5AA8;
}

.input-area :deep(.el-button) {
  height: 56px;
  border-radius: 10px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
