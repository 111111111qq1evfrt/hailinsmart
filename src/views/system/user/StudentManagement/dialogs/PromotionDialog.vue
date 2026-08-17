<template>
  <!-- 自动升学弹窗 -->
  <ElDialog
    v-model="model"
    title="自动升学"
    width="560px"
    :close-on-click-modal="false"
  >
    <div class="promotion-form">
      <!-- 开学季说明 -->
      <div class="auto-info">
        <div class="auto-icon"><el-icon :size="24" color="#1E5AA8"><Reading /></el-icon></div>
        <div class="auto-text">
          <strong>新学年自动升学</strong>
          <p>一键完成全校学生年级升级，毕业班自动清出，无需教务老师逐个修改</p>
        </div>
      </div>

      <!-- 自动升学开关 -->
      <div class="form-item">
        <label class="form-label">自动升学设置</label>
        <div class="auto-toggle">
          <el-switch
            v-model="autoPromotionEnabled"
            active-text="开启"
            inactive-text="关闭"
            inline-prompt
          />
          <span class="toggle-desc">开启后，系统将在每学年开学时自动执行全校升学</span>
        </div>
      </div>

      <!-- 指定年级升学 -->
      <div class="form-item">
        <label class="form-label">指定年级升学</label>
        <div class="single-promotion">
          <div class="promotion-selects">
            <el-select v-model="promotionSourceGrade" placeholder="选择年级" style="width: 140px">
              <el-option label="一年级" value="一年级" />
              <el-option label="二年级" value="二年级" />
              <el-option label="三年级" value="三年级" />
              <el-option label="四年级" value="四年级" />
              <el-option label="五年级" value="五年级" />
              <el-option label="六年级" value="六年级" />
            </el-select>
            <span class="arrow">→</span>
            <el-select v-model="promotionTargetGrade" placeholder="升入年级" style="width: 140px" :disabled="!promotionSourceGrade">
              <el-option label="二年级" value="二年级" />
              <el-option label="三年级" value="三年级" />
              <el-option label="四年级" value="四年级" />
              <el-option label="五年级" value="五年级" />
              <el-option label="六年级" value="六年级" />
              <el-option label="已毕业" value="毕业" />
            </el-select>
          </div>
          <el-button
            type="primary"
            size="small"
            @click="executeSinglePromotion"
            :disabled="!promotionSourceGrade || !promotionTargetGrade"
          >
            执行升学
          </el-button>
        </div>
      </div>

      <!-- 指定学生升学 -->
      <div class="form-item">
        <label class="form-label">指定学生升学</label>
        <div class="student-promotion">
          <el-select-v2
            v-model="selectedStudentForPromotion"
            :options="studentOptions"
            placeholder="搜索并选择学生"
            style="width: 280px"
            filterable
            clearable
          />
          <el-select v-model="studentTargetGrade" placeholder="升入年级" style="width: 140px" :disabled="!selectedStudentForPromotion">
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
            <el-option label="六年级" value="六年级" />
            <el-option label="已毕业" value="毕业" />
          </el-select>
          <el-button
            type="primary"
            size="small"
            @click="handleStudentPromotion"
            :disabled="!selectedStudentForPromotion || !studentTargetGrade"
          >
            执行升学
          </el-button>
        </div>
      </div>

      <!-- 升学选项 -->
      <div class="form-item">
        <label class="form-label">升学选项</label>
        <el-checkbox-group v-model="promotionOptions">
          <el-checkbox label="sync-class">班级自动升级（如一(1)班→二(1)班）</el-checkbox>
          <el-checkbox label="backup">升学前自动备份数据</el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- 全校升学预览 -->
      <div class="promotion-preview">
        <div class="preview-header">📊 全校升学预览</div>
        <div class="preview-content">
          <div class="preview-stats">
            <div class="stat-item">
              <span class="stat-num">{{ getAutoPromotionCount() }}</span>
              <span class="stat-label">名学生升级</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ getGraduateCount() }}</span>
              <span class="stat-label">名学生毕业</span>
            </div>
          </div>
          <p class="preview-detail">一年级→二年级，二年级→三年级... 六年级学生自动标记为已毕业</p>
          <p v-if="promotionOptions.includes('sync-class')" class="preview-note">✓ 班级将同步升级（如一(1)班→二(1)班）</p>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="model = false">关闭</el-button>
      <el-button type="primary" @click="handleAutoPromotion">立即执行全校升学</el-button>
    </template>
  </ElDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Reading } from '@element-plus/icons-vue'

const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  schoolId: {
    type: String,
    default: ''
  }
})

// 弹窗可见性（v-model）
const model = defineModel({ type: Boolean, default: false })

// 自动升学相关状态
const autoPromotionEnabled = ref(true) // 自动升学开关，默认开启
const promotionSourceGrade = ref('')
const promotionTargetGrade = ref('')
const promotionOptions = ref(['sync-class', 'backup'])
const selectedStudentForPromotion = ref('')
const studentTargetGrade = ref('')

// 计算属性：学生选项列表（供 el-select-v2 使用）
const studentOptions = computed(() =>
  props.students.map(s => ({
    value: s.id,
    label: `${s.name} (${s.grade}${s.class})`
  }))
)

// 获取自动升学的学生数量（排除六年级）
const getAutoPromotionCount = () => {
  return props.students.filter(s => s.grade !== '六年级').length
}

// 获取毕业班学生数量
const getGraduateCount = () => {
  return props.students.filter(s => s.grade === '六年级').length
}

// 获取指定年级的学生数量
const getGradeStudentCount = (grade) => {
  return props.students.filter(s => s.grade === grade).length
}

// 执行全校自动升学
const handleAutoPromotion = () => {
  const upgradeCount = getAutoPromotionCount()
  const graduateCount = getGraduateCount()

  let confirmMsg = `确定要执行全校自动升学吗？\n\n` +
    `• ${upgradeCount} 名学生将升入下一年级（一→二、二→三...五→六）\n` +
    `• ${graduateCount} 名六年级学生将标记为已毕业`

  if (promotionOptions.value.includes('sync-class')) {
    confirmMsg += '\n• 班级将同步升级（如一(1)班→二(1)班）'
  }

  if (promotionOptions.value.includes('backup')) {
    confirmMsg += '\n\n（系统将在升学前自动备份数据）'
  }

  ElMessageBox.confirm(
    confirmMsg,
    '全校升学确认',
    {
      confirmButtonText: '确认升学',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    executeAutoPromotion()
    ElMessage.success(`✓ 全校升学完成！\n${upgradeCount} 名学生已升级，${graduateCount} 名学生已毕业`)
    model.value = false
  }).catch(() => {
    ElMessage.info('已取消升学')
  })
}

// 执行指定年级升学
const executeSinglePromotion = () => {
  if (!promotionSourceGrade.value || !promotionTargetGrade.value) {
    ElMessage.warning('请选择升学年级和目标年级')
    return
  }

  const studentCount = getGradeStudentCount(promotionSourceGrade.value)

  let confirmMsg = `确定要将 ${promotionSourceGrade.value} 的 ${studentCount} 名学生升入 ${promotionTargetGrade.value} 吗？`

  if (promotionOptions.value.includes('backup')) {
    confirmMsg += '\n\n（系统将在升学前自动备份数据）'
  }

  ElMessageBox.confirm(
    confirmMsg,
    '指定年级升学确认',
    {
      confirmButtonText: '确认升学',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    executePromotion(promotionSourceGrade.value, promotionTargetGrade.value)
    ElMessage.success(`${promotionSourceGrade.value} 的 ${studentCount} 名学生已成功升入 ${promotionTargetGrade.value}`)
    // 重置选择
    promotionSourceGrade.value = ''
    promotionTargetGrade.value = ''
  }).catch(() => {
    ElMessage.info('已取消升学')
  })
}

// 执行指定学生升学
const handleStudentPromotion = () => {
  if (!selectedStudentForPromotion.value || !studentTargetGrade.value) {
    ElMessage.warning('请选择学生和目标年级')
    return
  }

  const student = props.students.find(s => s.id === selectedStudentForPromotion.value)
  if (!student) {
    ElMessage.error('未找到该学生')
    return
  }

  let confirmMsg = `确定要将学生 "${student.name}" (${student.grade}${student.class}) 升入 ${studentTargetGrade.value} 吗？`

  if (promotionOptions.value.includes('backup')) {
    confirmMsg += '\n\n（系统将在升学前自动备份数据）'
  }

  ElMessageBox.confirm(
    confirmMsg,
    '学生升学确认',
    {
      confirmButtonText: '确认升学',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    const student = props.students.find(s => s.id === selectedStudentForPromotion.value)
    if (student) {
      student.grade = studentTargetGrade.value
    }
    ElMessage.success(`学生 "${student.name}" 已成功升入 ${studentTargetGrade.value}`)
    // 重置选择
    selectedStudentForPromotion.value = ''
    studentTargetGrade.value = ''
  }).catch(() => {
    ElMessage.info('已取消升学')
  })
}

// 执行指定年级升学（核心逻辑）
const executePromotion = (src, tgt) => {
  if (promotionOptions.value.includes('backup')) {
    backupBeforePromotion('single', src, tgt)
  }

  props.students.forEach(s => {
    if (s.grade === src) {
      s.grade = tgt
      if (tgt !== '毕业') s.class = s.class.replace(src, tgt)
    }
  })

  saveStudentData()
}

// 执行全校自动升学（核心逻辑）
const executeAutoPromotion = () => {
  if (promotionOptions.value.includes('backup')) {
    backupBeforePromotion('auto', '全校', '升学')
  }

  const order = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  props.students.forEach(s => {
    const i = order.indexOf(s.grade)
    if (i >= 0 && i < order.length - 1) {
      s.grade = order[i + 1]
      s.class = s.class.replace(order[i], order[i + 1])
    } else if (i === order.length - 1) s.grade = '毕业'
  })

  saveStudentData()
}

// 升学前备份数据
const backupBeforePromotion = (type, source, target) => {
  const now = new Date()
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

  const backupKey = `smart_pe_student_backup_${props.schoolId}_${timestamp}`
  const backupData = {
    type: type,
    source: source,
    target: target,
    timestamp: now.toLocaleString('zh-CN'),
    students: JSON.parse(JSON.stringify(props.students))
  }

  sessionStorage.setItem(backupKey, JSON.stringify(backupData))

  const backupListKey = `smart_pe_backup_list_${props.schoolId}`
  let backupList = []
  try {
    const stored = sessionStorage.getItem(backupListKey)
    if (stored) backupList = JSON.parse(stored)
  } catch {}

  backupList.unshift({
    id: timestamp,
    type: type === 'auto' ? '全校自动升学' : '指定年级升学',
    source,
    target,
    timestamp: now.toLocaleString('zh-CN'),
    studentCount: props.students.length,
    key: backupKey
  })

  if (backupList.length > 10) backupList.pop()
  sessionStorage.setItem(backupListKey, JSON.stringify(backupList))

  ElMessage.info(`✓ 升学数据已备份（保留最近10份）`)
}

// 保存学生数据到 sessionStorage
const saveStudentData = () => {
  sessionStorage.setItem(`smart_pe_students_${props.schoolId}`, JSON.stringify(props.students))
}
</script>
