<template>
  <!-- 智能分班推荐弹窗 -->
  <ElDialog
    v-model="model"
    title="智能分班推荐"
    width="700px"
    :close-on-click-modal="false"
  >
    <div class="recommend-dialog">
      <el-alert
        title="根据学生体育兴趣智能推荐分项班"
        type="info"
        :closable="false"
        show-icon
        class="recommend-alert"
      >
        <template #default>
          <p>系统将根据学生的体育兴趣（如篮球、足球、田径等），自动推荐适合的分项班，实现因材施教。</p>
        </template>
      </el-alert>

      <div class="recommend-stats">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-num">{{ students.length }}</div>
            <div class="stat-label">学生总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <div class="stat-num">{{ studentsWithInterest.length }}</div>
            <div class="stat-label">有体育兴趣</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✨</div>
          <div class="stat-info">
            <div class="stat-num">{{ getRecommendedCount() }}</div>
            <div class="stat-label">待推荐分班</div>
          </div>
        </div>
      </div>

      <div class="recommend-list">
        <div class="list-header">
          <span>待推荐列表</span>
          <el-button text size="small" :icon="Refresh" @click="generateRecommendations">刷新推荐</el-button>
        </div>
        <div class="recommend-items">
          <div v-for="(rec, index) in recommendations" :key="index" class="recommend-item">
            <div class="item-student">
              <el-avatar :size="36" :icon="UserFilled" />
              <div class="item-info">
                <div class="item-name">{{ rec.student.name }}</div>
                <div class="item-detail">{{ rec.student.grade }}{{ rec.student.class }} · {{ rec.student.sportsInterest }}</div>
              </div>
            </div>
            <div class="item-recommend">
              <el-icon><ArrowRight /></el-icon>
              <span class="recommend-class">{{ rec.recommendedClass }}</span>
              <span v-if="!isClassExists(rec.recommendedClass)" class="new-tag">新建</span>
            </div>
            <div class="item-confidence">
              <span class="confidence-label">匹配度</span>
              <div class="confidence-bar">
                <div class="confidence-fill" :style="{ width: rec.confidence + '%' }"></div>
              </div>
              <span class="confidence-value">{{ rec.confidence }}%</span>
            </div>
            <div class="item-actions">
              <el-button text type="primary" size="small" @click="applyRecommendation(rec)">采纳</el-button>
              <el-button text size="small" @click="skipRecommendation(index)">跳过</el-button>
            </div>
          </div>
          <div v-if="recommendations.length === 0" class="empty-hint">
            <el-icon :size="48" color="#9CA3AF"><Star /></el-icon>
            <p>暂无待推荐学生</p>
          </div>
        </div>
      </div>

      <div v-if="appliedStudents.length > 0" class="recommend-list">
        <div class="list-header">
          <span>已采纳学生</span>
        </div>
        <div class="recommend-items">
          <div v-for="(stu, index) in appliedStudents" :key="index" class="recommend-item applied">
            <div class="item-student">
              <el-avatar :size="36" :icon="UserFilled" />
              <div class="item-info">
                <div class="item-name">{{ stu.name }}</div>
                <div class="item-detail">{{ stu.grade }}{{ stu.class }} · {{ stu.sportsInterest }}</div>
              </div>
            </div>
            <div class="item-recommend">
              <el-icon><CircleCheck /></el-icon>
              <span class="recommend-class">{{ stu.itemClass }}</span>
            </div>
            <div class="item-confidence">
              <span class="applied-badge">已加入</span>
            </div>
            <div class="item-actions">
              <el-button text type="warning" size="small" @click="cancelRecommendation({ student: stu, recommendedClass: stu.itemClass })">取消</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="model = false">关闭</el-button>
      <el-button type="primary" @click="applyAllRecommendations">一键应用所有推荐</el-button>
    </template>
  </ElDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, ArrowRight, Star, UserFilled, CircleCheck } from '@element-plus/icons-vue'
import { createSeededRandom } from '@/utils/seededRandom'

const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  classes: {
    type: Array,
    default: () => []
  },
  schoolId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['add-class'])

// 弹窗可见性（v-model）
const model = defineModel({ type: Boolean, default: false })

// 内部状态
const recommendations = ref([])

// 计算属性
const studentsWithInterest = computed(() => props.students.filter(s => s.sportsInterest?.trim()))
const getRecommendedCount = () => props.students.filter(s => s.sportsInterest?.trim() && !s.itemClass).length
const appliedStudents = computed(() => props.students.filter(s => s.itemClass && s.sportsInterest?.trim()))

// 判断班级是否存在
const isClassExists = (className) => {
  return props.classes.some(c => c.name === className)
}

// 生成推荐列表
const generateRecommendations = () => {
  const random = createSeededRandom(props.schoolId + '_generateRecommendations')
  recommendations.value = props.students
    .filter(s => s.sportsInterest?.trim() && !s.itemClass)
    .slice(0, 10)
    .map(s => {
      const recommendedClass = s.sportsInterest + '分项班'
      const exists = isClassExists(recommendedClass)
      return {
        student: s,
        recommendedClass: recommendedClass,
        confidence: exists ? 90 + Math.floor(random() * 10) : 80 + Math.floor(random() * 15),
        classExists: exists,
        applied: false
      }
    })
}

// 采纳推荐
const applyRecommendation = (rec) => {
  const s = props.students.find(x => x.id === rec.student.id)
  if (s) {
    s.itemClass = rec.recommendedClass
    rec.applied = true

    const existingClass = props.classes.find(c => c.name === rec.recommendedClass)
    if (!existingClass) {
      emit('add-class', {
        name: rec.recommendedClass,
        type: '分项班',
        teacher: '系统自动分配'
      })
    }

    const idx = recommendations.value.findIndex(r => r.student.id === rec.student.id)
    if (idx > -1) {
      recommendations.value.splice(idx, 1)
    }

    ElMessage.success(`${s.name} 已加入 ${rec.recommendedClass}`)
  }
}

// 取消推荐
const cancelRecommendation = (rec) => {
  const s = props.students.find(x => x.id === rec.student.id)
  if (s && s.itemClass === rec.recommendedClass) {
    s.itemClass = ''

    const idx = recommendations.value.findIndex(r => r.student.id === rec.student.id)
    if (idx === -1) {
      const random = createSeededRandom(props.schoolId + '_cancelRecommendation')
      const exists = isClassExists(rec.recommendedClass)
      recommendations.value.push({
        student: s,
        recommendedClass: rec.recommendedClass,
        confidence: exists ? 90 + Math.floor(random() * 10) : 80 + Math.floor(random() * 15),
        classExists: exists,
        applied: false
      })
    }

    ElMessage.info(`${s.name} 已退出 ${rec.recommendedClass}`)
  }
}

// 一键应用所有推荐
const applyAllRecommendations = () => {
  const appliedCount = recommendations.value.length

  recommendations.value.forEach(rec => {
    const s = props.students.find(x => x.id === rec.student.id)
    if (s) {
      s.itemClass = rec.recommendedClass

      const existingClass = props.classes.find(c => c.name === rec.recommendedClass)
      if (!existingClass) {
        emit('add-class', {
          name: rec.recommendedClass,
          type: '分项班',
          teacher: '系统自动分配'
        })
      }
    }
  })

  recommendations.value = []

  ElMessage.success(`已应用 ${appliedCount} 条分班推荐，部分班级已自动创建`)
}

// 跳过推荐
const skipRecommendation = (index) => {
  const rec = recommendations.value[index]
  if (rec) {
    recommendations.value.splice(index, 1)
    ElMessage.info(`已跳过 ${rec.student.name} 的分班推荐`)
  }
}
</script>
