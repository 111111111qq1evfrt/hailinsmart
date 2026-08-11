<template>
  <div class="login-page">
    <!-- 教育局入口界面 -->
    <div v-if="showBureauEntry" class="bureau-entry-page">
      <!-- 数字底座：动态网格 + 粒子 + 数据流 -->
      <div class="tech-bg" aria-hidden="true">
        <div class="tech-grid"></div>
        <canvas ref="particleCanvas" class="particle-canvas"></canvas>
        <div class="data-streams">
          <span
            v-for="n in 8"
            :key="'stream-' + n"
            class="data-stream"
            :style="{ '--delay': ((n - 1) * 0.7) + 's', '--left': (6 + n * 11) + '%', '--dur': (4 + (n % 3)) + 's' }"
          ></span>
        </div>
        <div class="tech-orb tech-orb-a"></div>
        <div class="tech-orb tech-orb-b"></div>
      </div>

      <!-- 装饰圆环 -->
      <div class="decorative-ring ring-1"></div>
      <div class="decorative-ring ring-2"></div>
      <div class="decorative-ring ring-3"></div>
      <!-- 装饰圆点 -->
      <div class="decorative-dot dot-1"></div>
      <div class="decorative-dot dot-2"></div>
      <div class="decorative-dot dot-3"></div>
      <div class="decorative-dot dot-4"></div>
      <div class="decorative-dot dot-5"></div>
      <!-- 飘浮几何元素 -->
      <div class="floating-shape shape-square shape-1"></div>
      <div class="floating-shape shape-triangle shape-2"></div>
      <div class="floating-shape shape-circle shape-3"></div>
      <div class="floating-shape shape-hex shape-4"></div>
      
      <div class="bureau-entry-container" ref="bureauContainer">
        <div class="bureau-header" ref="bureauHeader">
          <div class="bureau-badge" ref="bureauBadge" @mouseenter="onBadgeEnter" @mouseleave="onBadgeLeave">
            <span class="ai-pulse" aria-hidden="true">
              <span class="ai-pulse-ring"></span>
              <span class="ai-pulse-core"></span>
            </span>
            <span class="badge-icon">🏛️</span>
            <span class="badge-text">海林市教育局</span>
          </div>
          <h1 class="bureau-title">
            <span class="title-scan-wrap">
              <span class="title-text">智慧体育评测教学系统</span>
              <span class="title-scan" aria-hidden="true"></span>
            </span>
          </h1>
          <p class="bureau-subtitle">
            <span class="subtitle-line"></span>
            SMART PE ASSESSMENT INSTRUCTION SYSTEM
            <span class="subtitle-line"></span>
          </p>
        </div>

        <!-- 统计数据 -->
        <div class="bureau-stats" ref="bureauStats">
          <div class="stat-item" @mouseenter="onStatItemEnter" @mouseleave="onStatItemLeave">
            <div class="stat-glow" aria-hidden="true"></div>
            <div class="stat-value-row">
              <span class="stat-number" data-target="3">0</span>
              <span class="stat-unit">所</span>
            </div>
            <div class="stat-label">覆盖学校</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item" @mouseenter="onStatItemEnter" @mouseleave="onStatItemLeave">
            <div class="stat-glow" aria-hidden="true"></div>
            <div class="stat-value-row">
              <span class="stat-number" data-target="2424">0</span>
              <span class="stat-unit">名</span>
            </div>
            <div class="stat-label">学生受益</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item" @mouseenter="onStatItemEnter" @mouseleave="onStatItemLeave">
            <div class="stat-glow" aria-hidden="true"></div>
            <div class="stat-value-row">
              <span class="stat-number" data-target="98">0</span>
              <span class="stat-unit">位</span>
            </div>
            <div class="stat-label">教师参与</div>
          </div>
        </div>

        <div class="bureau-features">
          <div
            class="feature-card"
            v-for="(feature, idx) in bureauFeatures"
            :key="idx"
            :ref="el => setFeatureCardRef(el, idx)"
            @mousemove="onFeatureCardMove"
            @mouseenter="onFeatureCardEnter"
            @mouseleave="onFeatureCardLeave"
          >
            <div class="feature-border-flow" aria-hidden="true"></div>
            <div class="feature-shine" aria-hidden="true"></div>
            <div class="feature-card-inner">
              <div class="feature-icon-box" :style="{ background: feature.bgColor, color: feature.iconColor }">
                <span>{{ feature.icon }}</span>
              </div>
              <div class="feature-info">
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bureau-enter-section" ref="bureauEnter">
          <p class="enter-hint">选择您所在的学校进入系统</p>
          <div
            class="enter-btn"
            ref="enterBtnRef"
            @click="enterSchoolSelector"
            @mousemove="onEnterBtnMove"
            @mouseenter="onEnterBtnEnter"
            @mousedown="onEnterBtnDown"
            @mouseup="onEnterBtnUp"
            @mouseleave="onEnterBtnLeave"
          >
            <span class="enter-btn-ripple" aria-hidden="true"></span>
            <span class="enter-btn-ripple enter-btn-ripple-delay" aria-hidden="true"></span>
            <span class="enter-text">立即进入系统</span>
            <span class="enter-arrow">>></span>
          </div>
        </div>

        <div class="bureau-footer">
          <p>© 2026 大准科技有限公司</p>
        </div>
      </div>
    </div>

    <!-- 学校选择界面 -->
    <div v-else-if="showSchoolSelector" class="school-selector-page">
      <div class="school-selector-container" ref="schoolSelectorContainer">
        <div class="school-selector-header" ref="schoolSelectorHeader">
          <div class="school-selector-logo">
            <img :src="logoUrl" alt="大准科技" class="company-logo" width="160" height="40" decoding="async" />
          </div>
          <h1 class="school-selector-title">智慧体育评测教学系统</h1>
          <p class="school-selector-subtitle">请选择您所在的学校</p>
        </div>
        
        <div class="school-grid" ref="schoolGrid">
          <div 
            v-for="school in schoolList" 
            :key="school.id"
            class="school-card"
            :ref="el => setSchoolRef(el, school.id)"
            :style="{ '--primary-color': school.primaryColor }"
            @click="selectSchool(school)"
            @mouseenter="onSchoolHover($event, school.id)"
            @mouseleave="onSchoolLeave($event, school.id)"
          >
            <div class="school-card-icon">{{ school.logo }}</div>
            <div class="school-card-name">{{ school.name }}</div>
            <div class="school-card-desc">点击进入系统</div>
          </div>
        </div>
        
        <div class="school-selector-footer">
          <p>© 2026 大准科技有限公司</p>
        </div>
      </div>
    </div>
    
    <!-- 登录界面 -->
    <div v-else class="login-container" :style="schoolThemeStyle" ref="loginContainer">
      <!-- 左侧品牌展示区 -->
      <div class="login-left" ref="loginLeft">
        <div class="brand-section" ref="brandSection">
          <div class="brand-logo" ref="brandLogo">
            <img ref="brandLogoImg" :src="logoUrl" alt="大准科技" class="company-logo" width="160" height="40" decoding="async" />
          </div>
          <div class="brand-info" ref="brandInfo">
            <h1 class="brand-title">智慧体育评测教学系统</h1>
            <p class="brand-subtitle">Smart PE Assessment Instruction System</p>
          </div>
        </div>
        
        <div class="features-section" ref="featuresSection">
          <div class="feature-item" ref="feature1">
            <div class="feature-icon">
              <el-icon :size="22"><CircleCheck /></el-icon>
            </div>
            <div class="feature-content">
              <h3>安全可靠</h3>
              <p>数据加密存储，多重安全防护</p>
            </div>
          </div>
          <div class="feature-item" ref="feature2">
            <div class="feature-icon">
              <el-icon :size="22"><Lightning /></el-icon>
            </div>
            <div class="feature-content">
              <h3>高效便捷</h3>
              <p>智能评测，一键生成报告</p>
            </div>
          </div>
          <div class="feature-item" ref="feature3">
            <div class="feature-icon">
              <el-icon :size="22"><TrendCharts /></el-icon>
            </div>
            <div class="feature-content">
              <h3>数据可视化</h3>
              <p>多维度数据分析，一目了然</p>
            </div>
          </div>
        </div>

        <div class="footer-info" ref="footerInfo">
          <p>© 2026 大准科技有限公司</p>
        </div>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="login-right" ref="loginRight">
        <div class="login-form-wrapper" ref="formWrapper">
          <!-- 当前学校信息 -->
          <div class="current-school-bar" v-if="selectedSchool" ref="currentSchoolBar">
            <div class="current-school-info">
              <span class="current-school-logo">{{ selectedSchool.logo }}</span>
              <span class="current-school-name">{{ selectedSchool.name }}</span>
            </div>
            <button class="back-to-school-btn" @click="backToSchoolSelect">
              <span>切换学校</span>
            </button>
          </div>
          
          <div class="form-header" ref="formHeader">
            <h2>系统登录</h2>
            <p>欢迎使用智慧体育评测教学系统</p>
          </div>

          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="username" ref="formItem1">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入手机号/用户名"
                :prefix-icon="User"
                size="large"
                @focus="onInputFocus"
                @blur="onInputBlur"
              />
            </el-form-item>

            <el-form-item prop="password" ref="formItem2">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                size="large"
                @keyup.enter="handleLogin"
                @focus="onInputFocus"
                @blur="onInputBlur"
              />
            </el-form-item>

            <el-form-item prop="role" ref="formItem3">
              <el-select v-model="loginForm.role" placeholder="选择角色" size="large">
                <el-option label="区管理员" value="district" />
                <el-option label="学校管理员" value="school" />
                <el-option label="校园代理" value="campus" />
                <el-option label="行政老师" value="admin_teacher" />
                <el-option label="班主任" value="teacher" />
                <el-option label="班级管理员" value="class" />
              </el-select>
            </el-form-item>

            <el-form-item class="checkbox-group" ref="formItem4">
              <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
              <span class="forgot-password" @click="showForgotPassword">忘记密码？</span>
            </el-form-item>

            <el-form-item ref="formItem5">
              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="isLoading"
                @click="handleLogin"
                ref="loginBtnRef"
              >
                登 录
              </el-button>
            </el-form-item>
          </el-form>

          <div class="demo-accounts" ref="demoAccounts">
            <div class="demo-title">示例账号</div>
            <div class="demo-list">
              <div 
                class="demo-item" 
                v-for="(demo, index) in demoList" 
                :key="index"
                :ref="el => setDemoRef(el, index)"
                @click="fillDemo(demo.username, demo.password, demo.role)"
                @mouseenter="onDemoHover($event, index)"
                @mouseleave="onDemoLeave($event, index)"
              >
                <span class="demo-avatar" :class="demo.roleClass">{{ demo.avatar }}</span>
                <span class="demo-info">
                  <span class="demo-role">{{ demo.label }}</span>
                  <span class="demo-cred">{{ demo.username }} / {{ demo.password }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="login-footer" ref="loginFooter">
            <span>暂无账号？</span>
            <span class="register-link" @click="showRegister">联系管理员开通</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 忘记密码弹窗 -->
    <ElDialog
      v-model="forgotDialogVisible"
      title="忘记密码"
      width="400px"
    >
      <el-form :model="forgotForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="forgotForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="forgotForm.email" placeholder="请输入注册邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forgotDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="resetPassword">发送验证码</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage, ElDialog } from 'element-plus'
import { 
  User, 
  Lock, 
  CircleCheck, 
  Lightning, 
  TrendCharts,
  School
} from '@element-plus/icons-vue'
import gsap from 'gsap'
import { schoolList } from '@/store/global'
import store from '@/store/global'
import { validateLoginCredentials, generateDefaultPassword } from '@/mock/passwordUtils'
import { getDefaultUsersForSchool } from '@/mock/school-data/schoolUsers'
import { generateDeterministicId } from '@/utils/seededRandom'
import { getStaffList } from '@/utils/daiweiApi'
import { getClientIP, getCachedIP } from '@/utils/clientInfo'

const logoUrl = '/%E5%A4%A7%E5%87%86%E7%A7%91%E6%8A%80LOGO.png'

// ========== 教育局入口状态 ==========
const showBureauEntry = ref(true)
const showSchoolSelector = ref(false)

// 教育局入口功能展示（使用规则色板：主色#1E5AA8、辅色#3B82F6、活力橙#F5A623）
const bureauFeatures = [
  { icon: '📊', title: '数据驱动', desc: '多维度学生体质数据分析', bgColor: 'rgba(59, 130, 246, 0.1)', iconColor: '#1E5AA8' },
  { icon: '🎯', title: '智能评测', desc: 'AI智能动作识别与评分', bgColor: 'rgba(30, 90, 168, 0.1)', iconColor: '#1E5AA8' },
  { icon: '💡', title: '教学助手', desc: '智能教学辅助与资源管理', bgColor: 'rgba(245, 166, 35, 0.1)', iconColor: '#F5A623' }
]

// refs for bureau entry animation
const bureauContainer = ref(null)
const bureauHeader = ref(null)
const bureauBadge = ref(null)
const bureauStats = ref(null)
const bureauEnter = ref(null)
const enterBtnRef = ref(null)
const particleCanvas = ref(null)
const featureCardRefs = ref([])

let particleRaf = 0
let particleResizeHandler = null
let prefersReducedMotion = false

// 设置功能卡片 ref
const setFeatureCardRef = (el, idx) => {
  if (el) featureCardRefs.value[idx] = el
}

// 数字滚动动画（弹性收尾）
function animateNumber(el, target, duration = 1.6) {
  if (!el) return
  const start = 0
  const startTime = performance.now()
  
  const update = (now) => {
    const elapsed = (now - startTime) / 1000
    const progress = Math.min(elapsed / duration, 1)
    // easeOutExpo + 轻微超调感
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    const current = Math.floor(start + (target - start) * eased)
    el.textContent = current
    if (progress < 1) {
      requestAnimationFrame(update)
    } else {
      el.textContent = target
      gsap.fromTo(el, { scale: 1.18 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.45)' })
    }
  }
  requestAnimationFrame(update)
}

// 粒子背景
function startParticleSystem() {
  const canvas = particleCanvas.value
  if (!canvas || prefersReducedMotion) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const particles = []
  const PARTICLE_COUNT = Math.min(48, Math.floor(window.innerWidth / 28))

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const spawn = () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: 1 + Math.random() * 2.2,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -0.15 - Math.random() * 0.45,
    a: 0.15 + Math.random() * 0.45,
    hue: Math.random() > 0.7 ? '245,166,35' : (Math.random() > 0.45 ? '59,130,246' : '30,90,168')
  })

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawn())
  resize()
  particleResizeHandler = resize
  window.addEventListener('resize', resize)

  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.y < -10 || p.x < -20 || p.x > window.innerWidth + 20) {
        Object.assign(p, spawn(), { y: window.innerHeight + 10 })
      }
      ctx.beginPath()
      ctx.fillStyle = `rgba(${p.hue},${p.a})`
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }
    // 近距连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i]
        const b = particles[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.hypot(dx, dy)
        if (dist < 110) {
          ctx.strokeStyle = `rgba(59,130,246,${0.12 * (1 - dist / 110)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
    }
    particleRaf = requestAnimationFrame(tick)
  }
  particleRaf = requestAnimationFrame(tick)
}

function stopParticleSystem() {
  if (particleRaf) cancelAnimationFrame(particleRaf)
  particleRaf = 0
  if (particleResizeHandler) {
    window.removeEventListener('resize', particleResizeHandler)
    particleResizeHandler = null
  }
}

// 装饰元素有机浮动
function startDecorAnimations() {
  const rings = document.querySelectorAll('.decorative-ring')
  rings.forEach((ring, i) => {
    gsap.to(ring, {
      scale: 1.08,
      rotation: i % 2 === 0 ? 8 : -6,
      duration: 5 + i * 1.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  })
  
  const dots = document.querySelectorAll('.decorative-dot')
  dots.forEach((dot, i) => {
    gsap.to(dot, {
      y: -18 - i * 4,
      x: (i % 2 === 0 ? 8 : -10),
      duration: 2.2 + i * 0.35,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  })
  
  const shapes = document.querySelectorAll('.floating-shape')
  shapes.forEach((shape, i) => {
    gsap.to(shape, {
      y: -24 - i * 6,
      x: i % 2 === 0 ? 12 : -14,
      rotation: i % 2 === 0 ? 12 : -10,
      duration: 3.5 + i * 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  })

  gsap.to('.tech-orb-a', {
    x: 40, y: -30, scale: 1.12, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut'
  })
  gsap.to('.tech-orb-b', {
    x: -35, y: 25, scale: 1.08, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut'
  })
}

function stopDecorAnimations() {
  gsap.killTweensOf('.decorative-ring, .decorative-dot, .floating-shape, .tech-orb-a, .tech-orb-b')
  stopParticleSystem()
}

// ========== Hover 覆盖动画（GSAP）==========
const onFeatureCardMove = (e) => {
  if (prefersReducedMotion) return
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  const px = (e.clientX - rect.left) / rect.width
  const py = (e.clientY - rect.top) / rect.height
  const rotY = (px - 0.5) * 14
  const rotX = (0.5 - py) * 12
  card.style.setProperty('--shine-x', `${px * 100}%`)
  card.style.setProperty('--shine-y', `${py * 100}%`)
  gsap.to(card, {
    rotateX: rotX,
    rotateY: rotY,
    y: -8,
    transformPerspective: 900,
    duration: 0.25,
    ease: 'power2.out',
    overwrite: 'auto'
  })
}

const onFeatureCardEnter = (e) => {
  const card = e.currentTarget
  const icon = card.querySelector('.feature-icon-box')
  const shine = card.querySelector('.feature-shine')
  card.classList.add('is-active')
  if (icon) gsap.to(icon, { scale: 1.12, rotation: -6, duration: 0.35, ease: 'back.out(2)' })
  if (shine) gsap.fromTo(shine, { x: '-120%', opacity: 0 }, { x: '120%', opacity: 1, duration: 0.7, ease: 'power2.out' })
}

const onFeatureCardLeave = (e) => {
  const card = e.currentTarget
  const icon = card.querySelector('.feature-icon-box')
  card.classList.remove('is-active')
  gsap.to(card, {
    rotateX: 0,
    rotateY: 0,
    y: 0,
    duration: 0.45,
    ease: 'power3.out',
    overwrite: 'auto'
  })
  if (icon) gsap.to(icon, { scale: 1, rotation: 0, duration: 0.3, ease: 'power2.out' })
}

// 统计数字 hover 效果
const onStatItemEnter = (e) => {
  const item = e.currentTarget
  const num = item.querySelector('.stat-number')
  const glow = item.querySelector('.stat-glow')
  if (num) gsap.to(num, { scale: 1.12, duration: 0.3, ease: 'power2.out' })
  if (glow) gsap.to(glow, { opacity: 1, scale: 1.15, duration: 0.35, ease: 'power2.out' })
}

const onStatItemLeave = (e) => {
  const item = e.currentTarget
  const num = item.querySelector('.stat-number')
  const glow = item.querySelector('.stat-glow')
  if (num) gsap.to(num, { scale: 1, duration: 0.3, ease: 'power2.out' })
  if (glow) gsap.to(glow, { opacity: 0.45, scale: 1, duration: 0.35, ease: 'power2.out' })
}

// 进入按钮：磁吸 + 按压
const onEnterBtnMove = (e) => {
  if (prefersReducedMotion) return
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.18
  const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22
  gsap.to(btn, { x: dx, y: dy, duration: 0.25, ease: 'power2.out', overwrite: 'auto' })
}

const onEnterBtnEnter = (e) => {
  const arrow = e.currentTarget.querySelector('.enter-arrow')
  if (arrow) gsap.to(arrow, { x: 8, duration: 0.35, ease: 'elastic.out(1, 0.4)' })
}

const onEnterBtnDown = (e) => {
  gsap.to(e.currentTarget, { scale: 0.94, duration: 0.1 })
}

const onEnterBtnUp = (e) => {
  gsap.to(e.currentTarget, { scale: 1, duration: 0.35, ease: 'back.out(2)' })
}

const onEnterBtnLeave = (e) => {
  gsap.to(e.currentTarget, { x: 0, y: 0, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
  const arrow = e.currentTarget.querySelector('.enter-arrow')
  if (arrow) gsap.to(arrow, { x: 0, duration: 0.3, ease: 'power2.out' })
}

// 徽章 hover 效果
const onBadgeEnter = (e) => {
  gsap.to(e.currentTarget, { scale: 1.05, duration: 0.3, ease: 'power2.out' })
}

const onBadgeLeave = (e) => {
  gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: 'power2.out' })
}

// 从教育局入口进入学校选择
const enterSchoolSelector = () => {
  stopDecorAnimations()
  showBureauEntry.value = false
  showSchoolSelector.value = true
  animateBureauToSchool()
}

// 教育局到学校选择的切换动画
function animateBureauToSchool() {
  if (!bureauContainer.value) return
  gsap.to(bureauContainer.value, {
    opacity: 0,
    y: -30,
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      // 学校选择页入场动画在 showSchoolSelector 变更后触发
    }
  })
}

// ========== 多租户学校选择 ==========
const selectedSchool = ref(null)

// ========== 认证状态管理 ==========
const authLogin = async (credentials) => {
  // 登录逻辑已在本文件实现，此函数仅保持接口兼容
  return credentials
}

// 获取当前学校主题色
const schoolThemeStyle = computed(() => {
  if (!selectedSchool.value) return {}
  return {
    '--school-primary': selectedSchool.value.primaryColor,
    '--school-secondary': selectedSchool.value.secondaryColor
  }
})

const selectSchool = (school) => {
  selectedSchool.value = school
  // 直接同步设置全局学校状态（store 已在顶部导入）
  store.setSchool(school)
  // 获取真实示例账号
  fetchDemoAccounts()
  // 执行切换动画
  animateSchoolSelect()
}

const backToSchoolSelect = () => {
  showSchoolSelector.value = true
  selectedSchool.value = null
  // 重置动画标志，允许重新播放入场动画
  animationPlayed = false
  entranceTl?.kill()
  entranceTl = null
  // 清除 GSAP 在登录页元素上设置的 inline style（opacity:0 等），防止再次进入时元素不可见
  if (loginContainer.value) gsap.set(loginContainer.value, { clearProps: 'all' })
  if (loginLeft.value) gsap.set(loginLeft.value, { clearProps: 'all' })
  if (loginRight.value) gsap.set(loginRight.value, { clearProps: 'all' })
  if (demoAccounts.value) gsap.set(demoAccounts.value, { clearProps: 'all' })
  if (loginFooter.value) gsap.set(loginFooter.value, { clearProps: 'all' })
  if (formHeader.value) gsap.set(formHeader.value, { clearProps: 'all' })
  // 清空示例账号，确保重新选校后重新获取
  demoList.value = []
}

// 教育局入口动画（戏剧化 stagger 入场）
function animateBureauEntry() {
  if (!bureauContainer.value) return

  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  gsap.set(bureauContainer.value, { opacity: 0, y: 36, scale: 0.97 })
  if (bureauBadge.value) gsap.set(bureauBadge.value, { opacity: 0, y: -28, scale: 0.9 })
  if (bureauHeader.value) {
    const title = bureauHeader.value.querySelector('.bureau-title')
    const subtitle = bureauHeader.value.querySelector('.bureau-subtitle')
    if (title) gsap.set(title, { opacity: 0, y: 28, filter: 'blur(8px)' })
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 16 })
  }
  if (bureauStats.value) {
    const items = bureauStats.value.querySelectorAll('.stat-item')
    gsap.set(bureauStats.value, { opacity: 1 })
    gsap.set(items, { opacity: 0, y: 40, scale: 0.85 })
  }
  if (featureCardRefs.value.length) {
    gsap.set(featureCardRefs.value, { opacity: 0, y: 50, rotateX: 12, transformPerspective: 900 })
  }
  if (bureauEnter.value) gsap.set(bureauEnter.value, { opacity: 0, y: 28 })
  
  const tl = gsap.timeline({ delay: 0.12 })
  
  tl.to(bureauContainer.value, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.65,
    ease: 'power3.out'
  })
  
  if (bureauBadge.value) {
    tl.to(bureauBadge.value, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.55,
      ease: 'back.out(1.6)'
    }, '-=0.4')
  }
  
  if (bureauHeader.value) {
    const title = bureauHeader.value.querySelector('.bureau-title')
    const subtitle = bureauHeader.value.querySelector('.bureau-subtitle')
    if (title) {
      tl.to(title, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.7,
        ease: 'power3.out'
      }, '-=0.3')
    }
    if (subtitle) {
      tl.to(subtitle, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out'
      }, '-=0.35')
    }
  }
  
  if (bureauStats.value) {
    const items = bureauStats.value.querySelectorAll('.stat-item')
    tl.to(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.55,
      ease: 'back.out(1.5)',
      stagger: 0.12
    }, '-=0.2')
    tl.add(() => {
      const numbers = document.querySelectorAll('.stat-number[data-target]')
      numbers.forEach((el, i) => {
        const target = parseInt(el.getAttribute('data-target'))
        setTimeout(() => animateNumber(el, target, 1.6), i * 160)
      })
    }, '-=0.15')
  }
  
  if (featureCardRefs.value.length) {
    tl.to(featureCardRefs.value, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.14
    }, '-=0.25')
  }
  
  if (bureauEnter.value) {
    tl.to(bureauEnter.value, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power3.out'
    }, '-=0.2')
  }
  
  tl.add(() => {
    startParticleSystem()
    if (!prefersReducedMotion) startDecorAnimations()
  })
}

// ========== 数据 ==========
const loginForm = reactive({
  username: '',
  password: '',
  role: '',
  remember: false
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const forgotForm = reactive({
  username: '',
  email: ''
})

const isLoading = ref(false)
const forgotDialogVisible = ref(false)

// 标准化手机号：去掉 +86 前缀、短横线、空格
const normalizePhone = (raw) => {
  let phone = (raw || '').replace(/[-\s]/g, '')
  if (phone.startsWith('+86')) phone = phone.slice(3)
  else if (phone.startsWith('86') && phone.length > 11) phone = phone.slice(2)
  return phone
}

// 统一将用户数据同步到 sessionStorage（API 职工和 mock 用户共用）
const syncUsersToStorage = (items, schoolId, password, source) => {
  const usersKey = `users_${schoolId}`
  const existing = JSON.parse(sessionStorage.getItem(usersKey) || '[]')
  const existingMap = new Map(existing.map(u => [u.username, u]))
  // 同时建一个 phone→user 的索引，方便按手机号去重
  const phoneIndex = new Map()
  existing.forEach(u => { if (u.phone) phoneIndex.set(u.phone, u) })

  const apiRoleMap = { leadership: 'school', sport_teacher: 'teacher', class_adviser: 'class' }

  for (const item of items) {
    let role, phone, name, originalUsername, className, email
    if (source === 'api') {
      const identity = item.identity || {}
      role = 'teacher'
      for (const [key, roleKey] of Object.entries(apiRoleMap)) {
        if (identity[key] === 1) { role = roleKey; break }
      }
      phone = normalizePhone(item.phone_number)
      name = item.name || ''
      originalUsername = phone || item.staff_id || name
      className = ''
      email = ''
    } else {
      role = item.role
      phone = normalizePhone(item.phone)
      name = item.name || ''
      originalUsername = item.username || phone || name
      className = item.className || ''
      email = item.email || ''
    }

    // 用原始 username 作为 key（mock 用户保持 pinyin，API 用户用手机号）
    if (!existingMap.has(originalUsername)) {
      existingMap.set(originalUsername, {
        id: item.staff_id || item.id || `user-${originalUsername}`,
        username: originalUsername,
        name,
        role,
        school: store.state.school?.name || '',
        className,
        email,
        phone,
        password,
        status: 'active',
        createTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
      })
    } else if (source === 'api' && phone) {
      // API 职工可能和 mock 用户重名但手机号不同，补充 phone 字段
      const existingUser = existingMap.get(originalUsername)
      if (!existingUser.phone && phone) {
        existingUser.phone = phone
      }
    }
  }

  sessionStorage.setItem(usersKey, JSON.stringify([...existingMap.values()]))
}

// 从用户列表中提取示例账号（API 职工和 mock 用户共用同一套逻辑）
const extractDemoAccounts = (items, password, source) => {
  const roleLabels = { school: '学校管理员', teacher: '班主任', class: '班级管理员' }
  const roleClasses = { school: 'school', teacher: 'teacher', class: 'class' }
  const apiRoleMap = { leadership: 'school', sport_teacher: 'teacher', class_adviser: 'class' }

  const demos = []
  const seenRoles = new Set()

  for (const item of items) {
    let role, phone, name
    if (source === 'api') {
      const identity = item.identity || {}
      role = null
      for (const [key, roleKey] of Object.entries(apiRoleMap)) {
        if (identity[key] === 1) { role = roleKey; break }
      }
      phone = normalizePhone(item.phone_number)
      name = item.name || ''
    } else {
      role = item.role
      phone = normalizePhone(item.phone)
      name = item.name || ''
    }

    if (!role || !roleLabels[role] || seenRoles.has(role)) continue
    seenRoles.add(role)

    // 示例账号的 username 统一用手机号，用户登录时只需输入手机号
    const demoUsername = phone || item.staff_id || item.username || name
    demos.push({
      username: demoUsername,
      password,
      role,
      roleClass: roleClasses[role],
      label: roleLabels[role],
      avatar: name ? name.charAt(0) : '?'
    })
  }
  return demos
}

const demoList = ref([])

const fetchDemoAccounts = async () => {
  const schoolId = store.state.school.id
 
  if (!schoolId) {
    console.warn('[fetchDemoAccounts] schoolId 为空, 跳过')
    return
  }

  const password = generateDefaultPassword(schoolId)

  // 1. 立即用 mock 数据展示示例账号（同步，保证首次访问就能看到）
  try {
    const mockUsers = getDefaultUsersForSchool(schoolId)
    if (mockUsers && mockUsers.length > 0) {
      const demos = extractDemoAccounts(mockUsers, password, 'mock')
      syncUsersToStorage(mockUsers, schoolId, password, 'mock')
      demoList.value = demos
    }
  } catch (e) {
    console.warn('[fetchDemoAccounts] 加载mock用户失败:', e.message)
  }

  // 2. 后台尝试从 API 同步职工数据到 sessionStorage（用于登录验证匹配手机号）
  //    不阻塞示例账号展示，仅补充 storage 中的用户数据
  try {
    const result = await getStaffList({ page: 1, size: 100 }, schoolId)
    const staffList = result?.list
      || result?.data?.staff_list
      || result?.data?.list
      || (Array.isArray(result?.data) ? result.data : null)
    if (staffList && staffList.length > 0) {
      syncUsersToStorage(staffList, schoolId, password, 'api')
     
    }
  } catch (e) {
    console.warn('[fetchDemoAccounts] API同步失败(非阻塞):', e.message)
  }
}

// 学校卡片 refs
const schoolRefs = ref({})
const setSchoolRef = (el, schoolId) => {
  if (el) schoolRefs.value[schoolId] = el
}

// 学校卡片悬停动画
function onSchoolHover(e, schoolId) {
  const el = e.currentTarget
  gsap.to(el, {
    y: -8,
    scale: 1.02,
    duration: 0.3,
    ease: 'power2.out'
  })
}

function onSchoolLeave(e, schoolId) {
  const el = e.currentTarget
  gsap.to(el, {
    y: 0,
    scale: 1,
    duration: 0.3,
    ease: 'power2.out'
  })
}

// ========== Refs ==========
const loginFormRef = ref(null)
const loginContainer = ref(null)
const loginLeft = ref(null)
const loginRight = ref(null)
const brandSection = ref(null)
const brandLogo = ref(null)
const brandLogoImg = ref(null)
const brandInfo = ref(null)
const feature1 = ref(null)
const feature2 = ref(null)
const feature3 = ref(null)
const footerInfo = ref(null)
const formHeader = ref(null)
const formItem1 = ref(null)
const formItem2 = ref(null)
const formItem3 = ref(null)
const formItem4 = ref(null)
const formItem5 = ref(null)
const loginBtnRef = ref(null)
const demoAccounts = ref(null)
const loginFooter = ref(null)
const schoolSelectorContainer = ref(null)

const demoRefs = ref([])
const setDemoRef = (el, index) => {
  if (el) demoRefs.value[index] = el
}

// ========== GSAP 动画 ==========
let entranceTl = null
let animationPlayed = false

// 等待图片加载完成，避免 GSAP 在图片未加载时记录到 0 尺寸
function waitForImageLoad(imgRef, timeout = 3000) {
  return new Promise((resolve) => {
    const img = imgRef?.value
    if (!img) { resolve(); return }
    if (img.complete && img.naturalWidth > 0) { resolve(); return }
    let timer = null
    const onLoad = () => { clearTimeout(timer); img.removeEventListener('load', onLoad); resolve() }
    const onError = () => { clearTimeout(timer); img.removeEventListener('error', onError); resolve() }
    img.addEventListener('load', onLoad)
    img.addEventListener('error', onError)
    timer = setTimeout(() => { img.removeEventListener('load', onLoad); img.removeEventListener('error', onError); resolve() }, timeout)
  })
}

onMounted(async () => {
  await nextTick()
  // 检查是否有记住的密码
  loadSavedCredentials()

  // 教育局入口页面可见时，播放教育局入口动画
  if (showBureauEntry.value) {
    animateBureauEntry()
  } else if (!showSchoolSelector.value) {
    // 只有登录表单可见时才执行入场动画
    await waitForImageLoad(brandLogoImg)
    initEntranceAnimation()
  }
})

onUnmounted(() => {
  entranceTl?.kill()
  entranceTl = null
  // 停止装饰元素动画
  stopDecorAnimations()
  // 重置动画标志，组件重新挂载时可以重新播放
  animationPlayed = false
})

// 入场动画
function initEntranceAnimation() {
  // 防止重复播放动画
  if (animationPlayed) return

  try {
    // 等待DOM完全渲染
    if (!loginContainer.value) {
      setTimeout(initEntranceAnimation, 100)
      return
    }

    // DOM 已就绪，标记动画已开始播放
    animationPlayed = true
    
    // 初始状态 - 只对存在的元素进行设置
    gsap.set(loginContainer.value, { opacity: 0, scale: 0.95 })
    if (loginLeft.value) gsap.set(loginLeft.value, { x: -60, opacity: 0 })
    if (loginRight.value) gsap.set(loginRight.value, { x: 60, opacity: 0 })
    if (brandSection.value) gsap.set(brandSection.value, { y: 20, opacity: 0 })
    if (brandInfo.value) gsap.set(brandInfo.value, { y: 15, opacity: 0 })
    if (feature1.value && feature2.value && feature3.value) {
      gsap.set([feature1.value, feature2.value, feature3.value], { x: -30, opacity: 0 })
    }
    if (footerInfo.value) gsap.set(footerInfo.value, { y: 15, opacity: 0 })
    if (formHeader.value) gsap.set(formHeader.value, { y: 20, opacity: 0 })
    if (formItem1.value && formItem2.value && formItem3.value && formItem4.value && formItem5.value) {
      gsap.set([formItem1.value, formItem2.value, formItem3.value, formItem4.value, formItem5.value], {
        y: 25, opacity: 0
      })
    }
    if (demoAccounts.value) gsap.set(demoAccounts.value, { y: 20, opacity: 0 })
    if (demoRefs.value.length > 0) gsap.set(demoRefs.value, { x: 20, opacity: 0 })
    if (loginFooter.value) gsap.set(loginFooter.value, { opacity: 0 })
    if (brandLogo.value) gsap.set(brandLogo.value, { scale: 0.5, opacity: 0 })

    // 创建时间轴
    entranceTl = gsap.timeline({ delay: 0.1 })

    // 创建时间轴动画
    entranceTl.to(loginContainer.value, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: 'power2.out'
    })
    
    // 2. 左右面板滑入
    if (loginLeft.value && loginRight.value) {
      entranceTl.to([loginLeft.value, loginRight.value], {
        x: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.08
      }, '-=0.2')
    }
    
    // 3. 品牌区
    if (brandSection.value) {
      entranceTl.to(brandSection.value, {
        y: 0,
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out'
      }, '-=0.2')
    }
    
    // 4. Logo 弹入 + 一次呼吸
    if (brandLogo.value) {
      entranceTl.fromTo(brandLogo.value, 
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.4)' },
        '-=0.2'
      )
      .to(brandLogo.value, {
        scale: 1.06,
        duration: 0.25,
        ease: 'sine.inOut'
      })
      .to(brandLogo.value, {
        scale: 1,
        rotation: 0,
        duration: 0.25,
        ease: 'sine.inOut'
      })
    }
    
    // 5. 品牌文字
    if (brandInfo.value) {
      entranceTl.to(brandInfo.value, {
        y: 0,
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out'
      }, '-=0.3')
    }
    
    // 6. 特性卡片交错入场
    if (feature1.value && feature2.value && feature3.value) {
      entranceTl.to([feature1.value, feature2.value, feature3.value], {
        x: 0,
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.08
      }, '-=0.15')
    }
    
    // 7. 页脚
    if (footerInfo.value) {
      entranceTl.to(footerInfo.value, {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      }, '-=0.25')
    }
    
    // 8. 表单头部
    if (formHeader.value) {
      entranceTl.to(formHeader.value, {
        y: 0,
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out'
      }, '-=0.3')
    }
    
    // 9. 表单元素逐个出现
    if (formItem1.value && formItem2.value && formItem3.value && formItem4.value && formItem5.value) {
      entranceTl.to([formItem1.value, formItem2.value, formItem3.value, formItem4.value, formItem5.value], {
        y: 0,
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out',
        stagger: 0.06
      }, '-=0.2')
    }
    
    // 10. 示例账号区域
    if (demoAccounts.value) {
      entranceTl.to(demoAccounts.value, {
        y: 0,
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out'
      }, '-=0.2')
    }
    
    // 11. 示例账号项
    if (demoRefs.value.length > 0) {
      entranceTl.to(demoRefs.value, {
        x: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.06
      }, '-=0.2')
    }
    
    // 12. 底部链接
    if (loginFooter.value) {
      entranceTl.to(loginFooter.value, {
        opacity: 1,
        duration: 0.25,
        ease: 'power2.out'
      }, '-=0.15')
    }
    
  } catch (error) {
    console.error('GSAP 动画初始化失败:', error)
  }
}

// 学校选择切换动画
function animateSchoolSelect() {
  if (!schoolSelectorContainer.value) return
  
  gsap.to(schoolSelectorContainer.value, {
    opacity: 0,
    scale: 0.95,
    y: 20,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: async () => {
      showSchoolSelector.value = false
      // 等待DOM更新和图片加载后再执行登录页入场动画
      await nextTick()
      await waitForImageLoad(brandLogoImg)
      initEntranceAnimation()
    }
  })
}

// 输入框聚焦动画
function onInputFocus(e) {
  const wrapper = e.target?.closest('.el-input__wrapper') || 
                  e.target?.closest('.el-select__wrapper')
  if (wrapper) {
    gsap.to(wrapper, {
      scale: 1.015,
      duration: 0.2,
      ease: 'power2.out'
    })
  }
}

function onInputBlur(e) {
  const wrapper = e.target?.closest('.el-input__wrapper') || 
                  e.target?.closest('.el-select__wrapper')
  if (wrapper) {
    gsap.to(wrapper, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out'
    })
  }
}

// 示例账号悬停动画
function onDemoHover(e, index) {
  const el = e.currentTarget
  gsap.to(el, {
    x: 5,
    duration: 0.2,
    ease: 'power2.out'
  })
  const avatar = el.querySelector('.demo-avatar')
  if (avatar) {
    gsap.to(avatar, {
      scale: 1.1,
      duration: 0.2,
      ease: 'back.out(1.7)'
    })
  }
}

function onDemoLeave(e, index) {
  const el = e.currentTarget
  gsap.to(el, {
    x: 0,
    duration: 0.2,
    ease: 'power2.out'
  })
  const avatar = el.querySelector('.demo-avatar')
  if (avatar) {
    gsap.to(avatar, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out'
    })
  }
}

// ========== 记住密码相关函数 ==========
function loadSavedCredentials() {
  try {
    const schoolId = store.state.school.id || ''
    const savedData = localStorage.getItem(`smart_pe_login_${schoolId}`)
    if (savedData) {
      const data = JSON.parse(savedData)
      loginForm.username = data.username || ''
      loginForm.role = data.role || ''
      loginForm.remember = true
    }
  } catch (error) {
    console.error('加载记住密码出错:', error)
  }
}

function saveCredentials() {
  const schoolId = store.state.school.id || ''
  if (loginForm.remember) {
    const data = {
      username: loginForm.username,
      role: loginForm.role
    }
    localStorage.setItem(`smart_pe_login_${schoolId}`, JSON.stringify(data))
  } else {
    localStorage.removeItem(`smart_pe_login_${schoolId}`)
  }
}

// ========== 原有方法 ==========
const fillDemo = (username, password, role) => {
  loginForm.username = username
  loginForm.password = password
  loginForm.role = role
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate((valid, fields) => {
      if (valid) {
        doLogin()
      } else {
      }
    })
  } catch (error) {
  }
}

const doLogin = async () => {
  isLoading.value = true
  const schoolId = store.state.school.id || ''

  const btnEl = loginBtnRef.value?.$el
  if (btnEl) {
    gsap.to(btnEl, {
      scale: 0.96,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    })
  }

  try {
    const schoolId = store.state.school.id || ''

    // 先调 API 获取最新职工数据，同步到 sessionStorage 用于登录验证
    try {
      const password = generateDefaultPassword(schoolId)
      const result = await getStaffList({ page: 1, size: 200 }, schoolId)
      const staffList = result?.list || []
      if (staffList.length > 0) {
        syncUsersToStorage(staffList, schoolId, password, 'api')
      }
    } catch (e) {
      console.warn('[登录] API同步失败，使用本地数据:', e.message)
    }

    // 获取客户端 IP 缓存到 sessionStorage，供操作日志使用
    getClientIP()

    const isValid = validateLoginCredentials(loginForm.username, loginForm.password, loginForm.role, schoolId)
    if (!isValid) {
      ElMessage.error('用户名或密码错误')
      isLoading.value = false
      return
    }

    await new Promise(resolve => setTimeout(resolve, 1500))
    
    saveCredentials()
    
    const roleNames = {
      district: '区管理员',
      school: '学校管理员',
      campus: '校园代理',
      admin_teacher: '行政老师',
      teacher: '班主任',
      class: '班级管理员'
    }
    const roleName = roleNames[loginForm.role] || '管理员'
    
    const usersKey = `users_${schoolId}`
    let storedUsers = sessionStorage.getItem(usersKey)
    let realName = loginForm.username
    let realAvatar = loginForm.username.charAt(0)
    
    let users = []
    if (storedUsers) {
      try {
        users = JSON.parse(storedUsers)
      } catch {}
    }
    
    if (users.length === 0) {
      try {
        const { getDefaultUsersForSchool } = await import('@/mock/school-data/schoolUsers')
        users = getDefaultUsersForSchool(schoolId)
      } catch {}
    }
    
    const matchedUser = users.find(u => {
      if (u.username === loginForm.username && u.role === loginForm.role) return true
      // 允许用手机号登录：比较时去掉 +86 前缀和短横线
      const inputPhone = loginForm.username.replace(/^(\+?86)/, '').replace(/-/g, '')
      const userPhone = (u.phone || '').replace(/^(\+?86)/, '').replace(/-/g, '')
      if (userPhone && inputPhone && userPhone === inputPhone && u.role === loginForm.role) return true
      return false
    })
    if (matchedUser) {
      realName = matchedUser.name || loginForm.username
      realAvatar = realName.charAt(0)
    }
    
    const userInfo = {
      id: generateDeterministicId('user', loginForm.username),
      username: loginForm.username,
      name: realName,
      roleName: roleName,
      avatar: realAvatar,
      role: loginForm.role,
      roles: ['admin'],
      permissions: ['*'],
      token: generateDeterministicId('smart-pe-token', loginForm.username)
    }
    
    await authLogin({
      username: loginForm.username,
      password: loginForm.password,
      role: loginForm.role
    })
    
    sessionStorage.setItem(`smart_pe_user_${schoolId}`, JSON.stringify(userInfo))
    sessionStorage.setItem(`smart_pe_token_${schoolId}`, userInfo.token)
    
    recordLoginLog(userInfo, schoolId)
    
    ElMessage.success(`欢迎, ${userInfo.username} (${roleName})!`)
    
    gsap.to(loginContainer.value, {
      opacity: 0,
      scale: 0.92,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        window.location.href = '/home'
      }
    })
  } catch (error) {
    console.error('Login failed:', error)
    ElMessage.error('登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}



const recordLoginLog = (userInfo, schoolId) => {
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  // 确保 schoolId 与 OperationLog 页面一致
  const effectiveSchoolId = schoolId || store.state.school.id || 'hailin-second-primary'

  const sysLog = {
    id: generateDeterministicId('log', userInfo.username + '-' + timeStr),
    time: timeStr,
    userName: userInfo.name,
    userId: String(userInfo.id),
    ip: getCachedIP(),
    module: 'system',
    type: 'login',
    description: `登录系统 - ${userInfo.username}`,
    status: 'success',
    data: JSON.stringify({ action: '登录系统', target: userInfo.username, detail: `用户"${userInfo.name}"登录系统` }),
    error: ''
  }

  const sysLogsKey = `smart_pe_sys_operation_logs_${effectiveSchoolId}`
  let sysLogs = []
  const storedSysLogs = sessionStorage.getItem(sysLogsKey)
  if (storedSysLogs) {
    try {
      sysLogs = JSON.parse(storedSysLogs)
    } catch {}
  }
  sysLogs.unshift(sysLog)
  if (sysLogs.length > 100) {
    sysLogs.pop()
  }
  sessionStorage.setItem(sysLogsKey, JSON.stringify(sysLogs))
}

const showForgotPassword = () => {
  forgotDialogVisible.value = true
}

const resetPassword = () => {
  if (!forgotForm.username) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!forgotForm.email) {
    ElMessage.warning('请输入邮箱')
    return
  }
  forgotDialogVisible.value = false
  ElMessage.success('验证码已发送，请查收邮箱')
}

const showRegister = () => {
  ElMessage.info('请联系学校管理员开通账号')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  height: 100%;
  background: #F7F8FA;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  padding-top: 30px;
  overflow-y: auto;
}

.login-container {
  width: 100%;
  max-width: 1200px;
  min-height: auto;
  max-height: 95vh;
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(30, 90, 168, 0.15);
  display: flex;
  border: 1px solid #E8EAED;
  will-change: transform, opacity;
  overflow-y: auto;
}

/* 左侧品牌展示区 */
.login-left {
  flex: 1;
  min-width: 0;
  background: #FFFFFF;
  padding: clamp(30px, 4vw, 50px);
  display: flex;
  flex-direction: column;
  border-right: 1px solid #E8EAED;
  overflow-y: auto;
}

@media (max-height: 700px) {
  .login-left {
    padding: 24px;
  }
  .brand-section {
    margin-bottom: 20px;
  }
  .features-section {
    gap: 12px;
  }
  .feature-item {
    padding: 12px;
  }
}

.brand-section {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2vw, 24px);
  margin-bottom: clamp(30px, 5vw, 50px);
}

.brand-logo {
  width: clamp(60px, 7vw, 80px);
  height: clamp(60px, 7vw, 80px);
  background: #FFFFFF;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1E5AA8;
  will-change: transform;
  flex-shrink: 0;
  box-shadow: 0 4px 20px rgba(30, 90, 168, 0.1);
}

.company-logo {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

.brand-info {
  flex: 1;
  min-width: 0;
}

.brand-title {
  margin: 0;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 700;
  line-height: 1.3;
  color: #1A1A2E;
}

.brand-subtitle {
  margin: 8px 0 0 0;
  font-size: clamp(12px, 1.3vw, 14px);
  color: #6B7280;
}

.features-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 2.5vw, 24px);
}

.feature-item {
  display: flex;
  gap: clamp(12px, 1.5vw, 18px);
  padding: clamp(14px, 2vw, 22px);
  background: #F7F8FA;
  border-radius: 14px;
  transition: all 0.3s;
  border: 1px solid #E8EAED;
  cursor: default;
  will-change: transform;
}

.feature-item:hover {
  background: #EEF6FF;
  border-color: #1E5AA8;
  transform: translateX(6px);
}

.feature-icon {
  width: clamp(40px, 4.5vw, 48px);
  height: clamp(40px, 4.5vw, 48px);
  background: #1E5AA8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #FFFFFF;
}

.feature-content h3 {
  margin: 0 0 4px 0;
  font-size: clamp(14px, 1.4vw, 16px);
  font-weight: 600;
  color: #1A1A2E;
}

.feature-content p {
  margin: 0;
  font-size: clamp(11px, 1.1vw, 13px);
  color: #6B7280;
  line-height: 1.5;
}

.footer-info {
  margin-top: auto;
}

.footer-info p {
  margin: 4px 0;
  font-size: 12px;
  color: #9CA3AF;
}

/* 右侧登录表单区 */
.login-right {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(30px, 4vw, 50px);
  overflow-y: auto;
}

.login-form-wrapper {
  width: 100%;
  max-width: 360px;
}

/* 响应式调整 - 较小视口时压缩间距 */
@media (max-height: 700px) {
  .login-right {
    padding: 20px;
    align-items: flex-start;
    padding-top: 30px;
  }
  .form-header {
    margin-bottom: 24px;
  }
  .form-header h2 {
    font-size: 24px;
  }
  .login-form :deep(.el-form-item) {
    margin-bottom: 16px;
  }
  .demo-accounts {
    margin-top: 16px;
  }
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h2 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #1A1A2E;
}

.form-header p {
  margin: 10px 0 0 0;
  font-size: 15px;
  color: #6B7280;
}

.login-form {
  padding: 0;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
  will-change: transform;
}

/* 错误提示样式调整 */
.login-form :deep(.el-form-item__error) {
  padding-top: 4px;
  font-size: 12px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid #E8EAED;
  transition: all 0.3s;
  background: #FFFFFF;
  height: 54px;
  will-change: transform;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #1E5AA8;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #1E5AA8;
  box-shadow: 0 0 0 4px rgba(30, 90, 168, 0.1);
}

.login-form :deep(.el-input__inner) {
  font-size: 14px;
}

.login-form :deep(.el-select) {
  width: 100%;
}

.login-form :deep(.el-select__wrapper) {
  border-radius: 12px;
  border: 2px solid #E8EAED;
  height: 54px;
  will-change: transform;
  overflow: hidden;
}

.login-form :deep(.el-select__wrapper:hover) {
  border-color: #1E5AA8;
}

.login-form :deep(.el-select__wrapper.is-focus) {
  border-color: #1E5AA8;
  box-shadow: 0 0 0 4px rgba(30, 90, 168, 0.1);
}

/* 验证失败时的红色边框 */
.login-form :deep(.el-form-item.is-error .el-input__wrapper),
.login-form :deep(.el-form-item.is-error .el-select__wrapper) {
  border-color: #F56C6C;
}

.checkbox-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkbox-group :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #6B7280;
}

.forgot-password {
  font-size: 13px;
  color: #1E5AA8;
  cursor: pointer;
  font-weight: 500;
}

.forgot-password:hover {
  text-decoration: underline;
}

.login-button {
  width: 100%;
  height: 50px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  background: #1E5AA8;
  will-change: transform;
}

.login-button:hover {
  background: #1A4A8A;
}

.demo-accounts {
  margin-top: 24px;
}

.demo-title {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 14px;
  text-align: center;
}

.demo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.demo-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #F7F8FA;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s;
  border: 2px solid transparent;
  will-change: transform;
}

.demo-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  will-change: transform;
  flex-shrink: 0;
}

.demo-avatar.district {
  background: #E85D4E;
}

.demo-avatar.school {
  background: #1E5AA8;
}

.demo-avatar.campus {
  background: #8B5CF6;
}

.demo-avatar.admin_teacher {
  background: #F5A623;
}

.demo-avatar.teacher {
  background: #3B82F6;
}

.demo-avatar.class {
  background: #F5A623;
}

.demo-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.demo-role {
  font-size: 14px;
  color: #1A1A2E;
  font-weight: 600;
}

.demo-cred {
  font-size: 12px;
  color: #6B7280;
  font-family: monospace;
}

.login-footer {
  text-align: center;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #E8EAED;
  font-size: 13px;
  color: #6B7280;
}

.register-link {
  color: #1E5AA8;
  margin-left: 4px;
  cursor: pointer;
  font-weight: 600;
}

.register-link:hover {
  text-decoration: underline;
}

/* ========== 教育局入口页面样式 ========== */
.bureau-entry-page {
  --pe-primary: #1E5AA8;
  --pe-accent: #3B82F6;
  --pe-orange: #F5A623;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59, 130, 246, 0.14), transparent 55%),
    radial-gradient(ellipse 60% 40% at 80% 90%, rgba(30, 90, 168, 0.1), transparent 50%),
    radial-gradient(ellipse 50% 35% at 10% 80%, rgba(245, 166, 35, 0.06), transparent 45%),
    linear-gradient(160deg, #F4F7FB 0%, #EEF6FF 42%, #F7F8FA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  /* 关键：禁止横向滚动，只允许纵向 */
  overflow-x: hidden;
  overflow-y: auto;
  /* 关键：box-sizing 防止 padding 导致宽度溢出 */
  box-sizing: border-box;
  /* 使用 CSS 变量实现整体缩放 */
  font-size: var(--base-font-size, 16px);
}

/* 教育局入口页面内所有元素使用 border-box */
.bureau-entry-page * {
  box-sizing: border-box;
}

/* 根据视口宽度动态调整基础字体大小，实现流式缩放 */
/* 1920x1080 100%缩放时完美 */
@media (min-width: 1600px) {
  .bureau-entry-page {
    --base-font-size: 16px;
  }
}

@media (max-width: 1599px) and (min-width: 1200px) {
  .bureau-entry-page {
    --base-font-size: calc(100vw / 120);
  }
}

@media (max-width: 1199px) {
  .bureau-entry-page {
    --base-font-size: calc(100vw / 96);
  }
}

/* 内容过多时允许滚动 */
@media (max-height: 750px) {
  .bureau-entry-page {
    align-items: flex-start;
    padding-top: 2vh;
  }
}

.tech-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  /* 关键：防止装饰元素溢出 */
  overflow: hidden;
}

.tech-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(30, 90, 168, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 90, 168, 0.07) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%);
  animation: grid-drift 28s linear infinite;
}

@keyframes grid-drift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(48px, 48px); }
}

.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.data-streams {
  position: absolute;
  inset: 0;
}

.data-stream {
  position: absolute;
  top: -20%;
  left: var(--left, 20%);
  width: 1px;
  height: 28%;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(59, 130, 246, 0.55),
    rgba(245, 166, 35, 0.35),
    transparent
  );
  animation: data-fall var(--dur, 5s) linear infinite;
  animation-delay: var(--delay, 0s);
  opacity: 0.7;
}

.data-stream::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 4px;
  height: 4px;
  margin-left: -2px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}

@keyframes data-fall {
  0% { transform: translateY(0); opacity: 0; }
  12% { opacity: 0.75; }
  100% { transform: translateY(420%); opacity: 0; }
}

.tech-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.5;
}

.tech-orb-a {
  width: clamp(160px, 25vw, 280px);
  height: clamp(160px, 25vw, 280px);
  top: 8%;
  right: 8%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.35), transparent 70%);
}

.tech-orb-b {
  width: clamp(130px, 20vw, 220px);
  height: clamp(130px, 20vw, 220px);
  bottom: 12%;
  left: 6%;
  background: radial-gradient(circle, rgba(30, 90, 168, 0.28), transparent 70%);
}

.decorative-dot {
  position: absolute;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.35);
  pointer-events: none;
  z-index: 1;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.25);
}

.dot-1 { width: clamp(4px, 0.6vw, 8px); height: clamp(4px, 0.6vw, 8px); top: 18%; left: 12%; }
.dot-2 { width: clamp(3px, 0.5vw, 6px); height: clamp(3px, 0.5vw, 6px); top: 28%; right: 18%; background: rgba(30, 90, 168, 0.3); }
.dot-3 { width: clamp(5px, 0.8vw, 10px); height: clamp(5px, 0.8vw, 10px); bottom: 22%; left: 22%; background: rgba(59, 130, 246, 0.4); }
.dot-4 { width: clamp(3px, 0.4vw, 5px); height: clamp(3px, 0.4vw, 5px); bottom: 30%; right: 15%; background: rgba(30, 90, 168, 0.3); }
.dot-5 { width: clamp(4px, 0.6vw, 7px); height: clamp(4px, 0.6vw, 7px); top: 55%; right: 28%; background: rgba(245, 166, 35, 0.45); }

.decorative-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(30, 90, 168, 0.14);
  pointer-events: none;
  z-index: 1;
}

/* 关键修复：所有装饰元素都限制在视口内，不使用负定位 */
.ring-1 { 
  width: clamp(180px, 28vw, 320px); 
  height: clamp(180px, 28vw, 320px); 
  top: 5%; 
  right: 2%; 
}
.ring-2 { 
  width: clamp(140px, 22vw, 260px); 
  height: clamp(140px, 22vw, 260px); 
  bottom: 8%; 
  left: 2%; 
  border-color: rgba(59, 130, 246, 0.16); 
}
.ring-3 {
  width: clamp(90px, 14vw, 160px);
  height: clamp(90px, 14vw, 160px);
  top: 42%;
  left: 4%;
  border-color: rgba(245, 166, 35, 0.2);
  border-style: dashed;
}

.floating-shape {
  position: absolute;
  pointer-events: none;
  opacity: 0.55;
  z-index: 1;
}

.shape-square {
  width: clamp(10px, 1.2vw, 18px);
  height: clamp(10px, 1.2vw, 18px);
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: 4px;
}

.shape-triangle {
  width: 0;
  height: 0;
  border-left: clamp(7px, 0.8vw, 11px) solid transparent;
  border-right: clamp(7px, 0.8vw, 11px) solid transparent;
  border-bottom: clamp(10px, 1vw, 18px) solid rgba(30, 90, 168, 0.16);
}

.shape-circle {
  width: clamp(8px, 1vw, 14px);
  height: clamp(8px, 1vw, 14px);
  border: 1px solid rgba(30, 90, 168, 0.22);
  border-radius: 50%;
}

.shape-hex {
  width: clamp(9px, 1vw, 16px);
  height: clamp(9px, 1vw, 16px);
  background: rgba(245, 166, 35, 0.12);
  border: 1px solid rgba(245, 166, 35, 0.35);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.shape-1 { top: 22%; left: 16%; }
.shape-2 { top: 38%; right: 10%; }
.shape-3 { bottom: 28%; left: 26%; }
.shape-4 { top: 62%; right: 22%; }

.bureau-entry-container {
  position: relative;
  z-index: 10;
  width: min(100%, var(--container-width, 1100px));
  max-width: 100%;
  /* 减少水平padding，防止溢出 */
  padding: clamp(16px, 2vh, 40px) clamp(16px, 3vw, 48px);
  text-align: center;
  /* 关键：防止子元素溢出 */
  overflow: hidden;
  box-sizing: border-box;
}

/* 容器宽度根据视口自适应 */
/* 1920x1080屏幕 100%缩放下完美 */
@media (min-width: 1600px) {
  .bureau-entry-container {
    --container-width: 1100px;
  }
}

@media (max-width: 1599px) and (min-width: 1280px) {
  .bureau-entry-container {
    --container-width: 1000px;
  }
}

@media (max-width: 1279px) and (min-width: 1024px) {
  .bureau-entry-container {
    --container-width: 92vw;
  }
}

@media (max-width: 1023px) {
  .bureau-entry-container {
    --container-width: 96vw;
  }
}

.bureau-header {
  margin-bottom: clamp(24px, 4vh, 48px);
}

.bureau-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px 10px 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(30, 90, 168, 0.16);
  border-radius: 50px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  margin-bottom: clamp(16px, 3vh, 32px);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.ai-pulse {
  position: relative;
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-pulse-core {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pe-orange);
  box-shadow: 0 0 8px rgba(245, 166, 35, 0.7);
  animation: ai-core-breathe 2.2s ease-in-out infinite;
  z-index: 1;
}

.ai-pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(245, 166, 35, 0.65);
  animation: ai-ring-pulse 2.2s ease-out infinite;
}

@keyframes ai-core-breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}

@keyframes ai-ring-pulse {
  0% { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(2.2); opacity: 0; }
}

.badge-icon {
  font-size: clamp(14px, 1.2vw, 18px);
}

.badge-text {
  font-size: clamp(13px, 1.2vw, 15px);
  font-weight: 500;
  color: #1E5AA8;
  letter-spacing: 2px;
}

.bureau-title {
  margin: 0 0 clamp(8px, 1.5vh, 16px) 0;
  font-size: clamp(28px, 4.5vw, 56px);
  font-weight: 700;
  color: #1A1A2E;
  letter-spacing: clamp(2px, 0.5vw, 6px);
  line-height: 1.2;
}

.title-scan-wrap {
  position: relative;
  display: inline-block;
}

.title-text {
  background: linear-gradient(120deg, #1A1A2E 0%, #1E5AA8 45%, #3B82F6 70%, #1A1A2E 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: title-shimmer 6s ease-in-out infinite;
}

@keyframes title-shimmer {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.title-scan {
  position: absolute;
  top: 0;
  left: -10%;
  width: 18%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(59, 130, 246, 0.18),
    rgba(255, 255, 255, 0.45),
    rgba(59, 130, 246, 0.18),
    transparent
  );
  animation: title-scan 3.8s ease-in-out infinite;
  pointer-events: none;
  mix-blend-mode: soft-light;
}

@keyframes title-scan {
  0% { transform: translateX(0); opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { transform: translateX(620%); opacity: 0; }
}

.bureau-subtitle {
  margin: 0;
  font-size: clamp(12px, 1.2vw, 16px);
  color: #6B7280;
  letter-spacing: clamp(2px, 0.5vw, 6px);
  font-weight: 300;
  display: inline-flex;
  align-items: center;
  gap: clamp(8px, 1.5vw, 14px);
}

.subtitle-line {
  display: inline-block;
  width: clamp(16px, 2vw, 36px);
  height: 1px;
  background: linear-gradient(90deg, transparent, #3B82F6, transparent);
  opacity: 0.7;
}

.bureau-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(24px, 4vw, 72px);
  margin-bottom: clamp(32px, 5vh, 56px);
  padding: clamp(16px, 2.5vh, 32px) 0;
  position: relative;
}

.bureau-stats::before,
.bureau-stats::after {
  content: '';
  position: absolute;
  left: 18%;
  right: 18%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.35), transparent);
}

.bureau-stats::before { top: 0; }
.bureau-stats::after { bottom: 0; }

.stat-item {
  text-align: center;
  position: relative;
  padding: 8px 12px;
  white-space: nowrap;
}

.stat-glow {
  position: absolute;
  left: 50%;
  top: 30%;
  width: clamp(60px, 7vw, 90px);
  height: clamp(60px, 7vw, 90px);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.28), transparent 70%);
  opacity: 0.45;
  pointer-events: none;
  z-index: 0;
}

.stat-value-row {
  position: relative;
  z-index: 1;
  margin-bottom: clamp(6px, 1vh, 10px);
  display: flex;
  align-items: baseline;
  justify-content: center;
  white-space: nowrap;
}

.stat-number {
  display: inline-block;
  font-size: clamp(28px, 3.5vw, 46px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, #1E5AA8 0%, #3B82F6 55%, #F5A623 130%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 4px 12px rgba(30, 90, 168, 0.18));
  will-change: transform;
}

.stat-unit {
  font-size: clamp(14px, 1.5vw, 20px);
  font-weight: 400;
  color: #3B82F6;
  margin-left: 2px;
}

.stat-label {
  position: relative;
  z-index: 1;
  font-size: clamp(11px, 1vw, 13px);
  color: #6B7280;
  letter-spacing: clamp(1px, 0.3vw, 3px);
  display: block;
  white-space: nowrap;
}

.stat-divider {
  width: 1px;
  height: clamp(30px, 4vh, 50px);
  background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.35), transparent);
}

.bureau-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(12px, 2vw, 24px);
  margin-bottom: clamp(32px, 5vh, 56px);
  perspective: 1200px;
}

.feature-card {
  position: relative;
  border-radius: 16px;
  padding: 2px;
  cursor: default;
  transform-style: preserve-3d;
  will-change: transform;
  background: transparent;
}

.feature-border-flow {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: conic-gradient(
    from var(--border-angle, 0deg),
    rgba(30, 90, 168, 0.15),
    rgba(59, 130, 246, 0.65),
    rgba(245, 166, 35, 0.55),
    rgba(30, 90, 168, 0.15)
  );
  opacity: 0;
  transition: opacity 0.35s ease;
  animation: border-spin 4s linear infinite;
  animation-play-state: paused;
}

.feature-card.is-active .feature-border-flow {
  opacity: 1;
  animation-play-state: running;
}

@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes border-spin {
  to { --border-angle: 360deg; }
}

.feature-card-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(232, 234, 237, 0.9);
  border-radius: 14px;
  padding: clamp(16px, 2vw, 34px) clamp(14px, 1.8vw, 30px);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.feature-card.is-active .feature-card-inner {
  border-color: rgba(30, 90, 168, 0.28);
  box-shadow:
    0 16px 36px rgba(30, 90, 168, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.feature-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 45%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 80%
  );
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  transform: skewX(-12deg);
}

.feature-icon-box {
  width: clamp(44px, 4vw, 64px);
  height: clamp(44px, 4vw, 64px);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(20px, 2.5vw, 32px);
  margin: 0 auto clamp(12px, 1.5vw, 20px);
  flex-shrink: 0;
  will-change: transform;
  box-shadow: 0 8px 20px rgba(30, 90, 168, 0.1);
}

.feature-info {
  text-align: center;
  width: 100%;
}

.feature-info h3 {
  margin: 0 0 clamp(4px, 0.8vh, 8px) 0;
  font-size: clamp(15px, 1.5vw, 20px);
  font-weight: 600;
  color: #1A1A2E;
  letter-spacing: 1px;
}

.feature-info p {
  margin: 0;
  font-size: clamp(12px, 1vw, 14px);
  color: #6B7280;
  line-height: 1.6;
  letter-spacing: 1px;
}

.bureau-enter-section {
  margin-bottom: clamp(24px, 4vh, 40px);
}

.enter-hint {
  font-size: clamp(12px, 1.2vw, 15px);
  color: #6B7280;
  margin-bottom: clamp(16px, 2.5vh, 28px);
  letter-spacing: clamp(1px, 0.3vw, 3px);
}

.enter-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: clamp(8px, 1.2vw, 14px);
  padding: clamp(12px, 1.5vw, 18px) clamp(24px, 4vw, 52px);
  background: linear-gradient(135deg, #1E5AA8 0%, #3B82F6 100%);
  color: #FFFFFF;
  border-radius: 10px;
  cursor: pointer;
  font-size: clamp(13px, 1.3vw, 16px);
  font-weight: 600;
  box-shadow:
    0 8px 24px rgba(30, 90, 168, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  letter-spacing: clamp(1px, 0.3vw, 3px);
  will-change: transform;
  overflow: hidden;
  isolation: isolate;
}

.enter-btn:hover {
  box-shadow:
    0 12px 32px rgba(30, 90, 168, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.enter-btn-ripple {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  animation: btn-ripple 2.4s ease-out infinite;
  pointer-events: none;
  z-index: 0;
}

.enter-btn-ripple-delay {
  animation-delay: 1.2s;
}

@keyframes btn-ripple {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(18); opacity: 0; }
}

.enter-text {
  position: relative;
  z-index: 1;
}

.enter-arrow {
  font-size: clamp(16px, 1.5vw, 20px);
  position: relative;
  z-index: 1;
  display: inline-block;
}

.bureau-footer {
  text-align: center;
}

.bureau-footer p {
  font-size: clamp(11px, 1vw, 13px);
  color: #9CA3AF;
  margin: 0;
  letter-spacing: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .tech-grid,
  .data-stream,
  .title-scan,
  .title-text,
  .ai-pulse-core,
  .ai-pulse-ring,
  .enter-btn-ripple,
  .feature-border-flow {
    animation: none !important;
  }
}

/* 响应式 - 教育局入口 */

/* 超大屏幕 (>1920px) */
@media (min-width: 1920px) {
  .bureau-entry-container {
    --container-width: 1400px;
  }
}

/* 大屏桌面（1280px-1920px）：默认样式 */

/* 中等桌面（1024px-1280px） */
@media (max-width: 1280px) {
  .bureau-stats {
    gap: clamp(32px, 3vw, 56px);
  }
}

/* 平板（768px-1024px） */
@media (max-width: 1024px) {
  .bureau-features {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* 平板隐藏部分装饰 */
  .shape-3,
  .shape-4,
  .ring-3,
  .data-stream:nth-child(n+5) {
    display: none;
  }
}

/* 手机（<768px） */
@media (max-width: 768px) {
  .bureau-entry-page {
    align-items: flex-start;
    overflow-y: auto;
  }
  
  .bureau-stats {
    flex-wrap: wrap;
  }
  
  .stat-item {
    flex: 1 1 40%;
    min-width: 100px;
  }
  
  .stat-divider {
    display: none;
  }
  
  .bureau-features {
    grid-template-columns: 1fr;
  }

  .feature-card-inner {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    gap: 16px;
  }
  
  .feature-icon-box {
    margin: 0;
    flex-shrink: 0;
  }
  
  .feature-info {
    text-align: left;
  }
  
  /* 手机端简化装饰 */
  .ring-1, .ring-2, .ring-3,
  .shape-1, .shape-2, .shape-3, .shape-4,
  .data-streams,
  .tech-orb,
  .particle-canvas,
  .decorative-dot {
    display: none;
  }

  .tech-grid {
    animation: none;
    opacity: 0.5;
  }
}

/* 超小屏幕（<375px） */
@media (max-width: 375px) {
  .bureau-features {
    gap: 12px;
  }
}

/* 横屏手机适配 */
@media (max-width: 900px) and (orientation: landscape) and (max-height: 500px) {
  .bureau-entry-page {
    align-items: flex-start;
    overflow-y: auto;
  }
  
  .bureau-features {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .feature-card-inner {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .feature-icon-box {
    margin: 0 auto;
  }
  
  .feature-info {
    text-align: center;
  }
}

/* 矮屏笔记本（高度 < 700px） */
@media (max-height: 700px) {
  .bureau-header {
    margin-bottom: clamp(16px, 2.5vh, 28px);
  }
  
  .bureau-stats {
    padding: clamp(12px, 1.5vh, 20px) 0;
  }
  
  .bureau-features {
    gap: clamp(10px, 1.5vw, 16px);
  }
}

/* ========== 学校选择页面样式 ========== */
.school-selector-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #F7F8FA 0%, #EEF6FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

@media (max-height: 700px) {
  .school-selector-page {
    padding: 20px;
    align-items: flex-start;
    padding-top: 30px;
  }
}

.school-selector-container {
  width: 100%;
  max-width: 900px;
  text-align: center;
  will-change: transform, opacity;
}

.school-selector-header {
  margin-bottom: 60px;
}

@media (max-height: 700px) {
  .school-selector-header {
    margin-bottom: 30px;
  }
  .school-selector-logo {
    width: 70px;
    height: 70px;
    margin-bottom: 16px;
  }
  .school-selector-logo .company-logo {
    width: 56px;
    height: 56px;
  }
  .school-selector-title {
    font-size: 28px;
  }
  .school-grid {
    gap: 16px;
    margin-bottom: 30px;
  }
  .school-card {
    padding: 24px 16px;
  }
  .school-card-icon {
    font-size: 40px;
    margin-bottom: 10px;
  }
  .school-card-name {
    font-size: 16px;
  }
}

.school-selector-logo {
  width: 100px;
  height: 100px;
  margin: 0 auto 30px;
  background: #FFFFFF;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(30, 90, 168, 0.1);
  border: 2px solid #1E5AA8;
}

.school-selector-logo .company-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.school-selector-title {
  margin: 0 0 12px 0;
  font-size: 36px;
  font-weight: 700;
  color: #1A1A2E;
}

.school-selector-subtitle {
  margin: 0;
  font-size: 16px;
  color: #6B7280;
}

.school-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 60px;
}

.school-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 40px 24px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid #E8EAED;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  will-change: transform;
}

.school-card:hover {
  border-color: var(--primary-color, #1E5AA8);
  box-shadow: 0 8px 24px rgba(30, 90, 168, 0.15);
}

.school-card-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.school-card-name {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 8px;
}

.school-card-desc {
  font-size: 13px;
  color: #6B7280;
}

.school-selector-footer {
  margin-top: 40px;
}

.school-selector-footer p {
  font-size: 12px;
  color: #9CA3AF;
  margin: 0;
}

/* ========== 当前学校信息栏 ========== */
.current-school-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #F7F8FA;
  border-radius: 10px;
  margin-bottom: 24px;
  border: 1px solid #E8EAED;
}

.current-school-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-school-logo {
  font-size: 24px;
}

.current-school-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.back-to-school-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid #E8EAED;
  border-radius: 6px;
  font-size: 13px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s;
}

.back-to-school-btn:hover {
  border-color: #1E5AA8;
  color: #1E5AA8;
  background: #EEF6FF;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .school-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .school-selector-title {
    font-size: 28px;
  }
  
  .school-card {
    padding: 30px 20px;
  }
}

@media (max-width: 992px) {
  .login-page {
    padding: 20px;
  }
  
  .login-container {
    flex-direction: column;
    min-height: auto;
    max-height: none;
    border-radius: 16px;
  }
  
  .login-left {
    width: 100%;
    padding: 40px 30px;
    border-right: none;
    border-bottom: 1px solid #E8EAED;
  }
  
  .brand-section {
    margin-bottom: 30px;
    flex-direction: column;
    text-align: center;
  }
  
  .brand-logo {
    width: 70px;
    height: 70px;
  }
  
  .brand-title {
    font-size: 24px !important;
  }
  
  .brand-subtitle {
    font-size: 13px !important;
  }
  
  .features-section {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 15px;
    justify-content: center;
    margin-bottom: 20px;
  }
  
  .feature-item {
    flex: 0 0 calc(50% - 7.5px);
    padding: 15px;
  }
  
  .feature-item h3 {
    font-size: 14px;
  }
  
  .feature-item p {
    font-size: 12px;
  }
  
  .footer-info {
    display: none;
  }
  
  .login-right {
    width: 100%;
    padding: 40px 30px;
  }
  
  .login-form-wrapper {
    max-width: 100%;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
  
  .form-header p {
    font-size: 13px;
  }
  
  .login-form :deep(.el-input__wrapper),
  .login-form :deep(.el-select__wrapper) {
    height: 48px;
  }
  
  .example-accounts {
    padding: 15px;
  }
  
  .example-account-item {
    padding: 10px 15px;
  }
}

@media (max-width: 600px) {
  .login-page {
    padding: 10px;
  }
  
  .login-left {
    padding: 30px 20px;
  }
  
  .brand-title {
    font-size: 20px !important;
  }
  
  .feature-item {
    flex: 0 0 100%;
  }
  
  .login-right {
    padding: 30px 20px;
  }
  
  .current-school-bar {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .back-to-school-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>