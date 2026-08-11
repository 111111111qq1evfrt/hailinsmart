<template>
  <div class="score-config-container">
    <div class="config-header">
      <h3 class="config-title">自定义评分标准</h3>
      <el-button type="primary" @click="addNewStandard">添加标准</el-button>
    </div>

    <div class="config-content">
      <div class="standard-tabs">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="项目标准" name="items">
            <div class="standard-list">
              <div
                v-for="standard in standards"
                :key="standard.id"
                class="standard-card"
              >
                <div class="card-header">
                  <div class="card-title">
                    <el-input
                      v-model="standard.name"
                      class="item-name-input"
                      placeholder="项目名称"
                    />
                    <el-select
                      v-model="standard.category"
                      class="item-category-select"
                      placeholder="选择类别"
                    >
                      <el-option label="跳跃类" value="跳跃类" />
                      <el-option label="速度类" value="速度类" />
                      <el-option label="力量类" value="力量类" />
                      <el-option label="柔韧性" value="柔韧性" />
                      <el-option label="耐力类" value="耐力类" />
                      <el-option label="其他" value="其他" />
                    </el-select>
                  </div>
                  <div class="card-actions">
                    <el-input
                      v-model="standard.unit"
                      class="unit-input"
                      placeholder="单位"
                      style="width: 80px;"
                    />
                    <el-button text size="small" type="danger" @click="deleteStandard(standard.id)">删除</el-button>
                  </div>
                </div>

                <div class="score-rules">
                  <div class="rule-header">
                    <span class="rule-label">评分规则</span>
                    <span class="gender-filter">
                      <el-radio-group v-model="standard.genderFilter" class="inline-radio">
                        <el-radio label="all">全部</el-radio>
                        <el-radio label="男">男生</el-radio>
                        <el-radio label="女">女生</el-radio>
                      </el-radio-group>
                    </span>
                  </div>

                  <div class="rules-table">
                    <div class="rules-header">
                      <span class="rule-col">等级</span>
                      <span class="rule-col">分数范围</span>
                      <span class="rule-col">标准值</span>
                      <span class="rule-col">操作</span>
                    </div>
                    <div
                      v-for="(rule, index) in standard.rules"
                      :key="index"
                      class="rules-row"
                    >
                      <span class="rule-col">
                        <el-select
                          v-model="rule.level"
                          class="level-select"
                          placeholder="等级"
                        >
                          <el-option label="优秀" value="优秀" />
                          <el-option label="良好" value="良好" />
                          <el-option label="及格" value="及格" />
                          <el-option label="不及格" value="不及格" />
                        </el-select>
                      </span>
                      <span class="rule-col">
                        <el-input v-model.number="rule.scoreMin" style="width: 70px;" />
                        <span> - </span>
                        <el-input v-model.number="rule.scoreMax" style="width: 70px;" />
                        <span>分</span>
                      </span>
                      <span class="rule-col">
                        <el-input v-model.number="rule.minValue" style="width: 90px;" />
                        <span> - </span>
                        <el-input v-model.number="rule.maxValue" style="width: 90px;" />
                        <span>{{ standard.unit }}</span>
                      </span>
                      <span class="rule-col">
                        <el-button text size="small" type="danger" @click="removeRule(standard.id, index)">删除</el-button>
                      </span>
                    </div>
                    <div class="rules-row add-row">
                      <el-button text size="small" @click="addRule(standard.id)">+ 添加规则</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="综合评定" name="composite">
            <div class="composite-settings">
              <div class="setting-section">
                <h4>等级评定标准</h4>
                <div class="grade-config">
                  <div
                    v-for="grade in gradeStandards"
                    :key="grade.level"
                    class="grade-item"
                  >
                    <span class="grade-label">{{ grade.label }}</span>
                    <el-slider
                      v-model="grade.minScore"
                      :min="0"
                      :max="100"
                      :disabled="grade.level === '不及格'"
                    />
                    <span class="grade-value">{{ grade.minScore }}分及以上</span>
                  </div>
                </div>
              </div>

              <div class="setting-section">
                <h4>权重设置</h4>
                <div class="weight-config">
                  <div
                    v-for="item in weightItems"
                    :key="item.name"
                    class="weight-item"
                  >
                    <span class="weight-label">{{ item.name }}</span>
                    <el-slider
                      v-model="item.weight"
                      :min="0"
                      :max="100"
                    />
                    <span class="weight-value">{{ item.weight }}%</span>
                  </div>
                </div>
                <div class="total-weight">
                  总权重: <strong>{{ totalWeight }}%</strong>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { generateDeterministicId } from '@/utils/seededRandom'

const activeTab = ref('items')

const schoolId = localStorage.getItem('current_school_id') || 'hailin-second-primary'
const storageKey = `smart_pe_score_standards_${schoolId}`

const savedStandards = localStorage.getItem(storageKey)
const standards = ref(savedStandards ? JSON.parse(savedStandards) : [
  {
    id: 1,
    name: '立定跳远',
    category: '跳跃类',
    unit: '米',
    genderFilter: 'all',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 2.3, maxValue: 3.0 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 2.0, maxValue: 2.29 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 1.5, maxValue: 1.99 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 1.49 }
    ]
  },
  {
    id: 2,
    name: '50米跑',
    category: '速度类',
    unit: '秒',
    genderFilter: 'all',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 6.5, maxValue: 7.5 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 7.6, maxValue: 8.5 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 8.6, maxValue: 10.0 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 10.1, maxValue: 15.0 }
    ]
  },
  {
    id: 3,
    name: '仰卧起坐',
    category: '力量类',
    unit: '次/分钟',
    genderFilter: '女',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 45, maxValue: 60 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 38, maxValue: 44 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 20, maxValue: 37 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 19 }
    ]
  },
  {
    id: 4,
    name: '引体向上',
    category: '力量类',
    unit: '次',
    genderFilter: '男',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 15, maxValue: 25 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 10, maxValue: 14 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 6, maxValue: 9 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 5 }
    ]
  },
  {
    id: 5,
    name: '坐位体前屈',
    category: '柔韧性',
    unit: '厘米',
    genderFilter: 'all',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 20, maxValue: 35 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 15, maxValue: 19.9 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 8, maxValue: 14.9 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 7.9 }
    ]
  },
  {
    id: 6,
    name: '跳绳',
    category: '耐力类',
    unit: '次/分钟',
    genderFilter: 'all',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 150, maxValue: 200 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 120, maxValue: 149 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 80, maxValue: 119 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 79 }
    ]
  }
])

watch(standards, (newVal) => {
  localStorage.setItem(storageKey, JSON.stringify(newVal))
}, { deep: true })

const gradeStandards = ref([
  { level: '优秀', label: '优秀', minScore: 90 },
  { level: '良好', label: '良好', minScore: 80 },
  { level: '及格', label: '及格', minScore: 60 },
  { level: '不及格', label: '不及格', minScore: 0 }
])

const weightItems = ref([
  { name: '身体素质', weight: 40 },
  { name: '技能水平', weight: 30 },
  { name: '学习态度', weight: 15 },
  { name: '课堂表现', weight: 15 }
])

const totalWeight = computed(() => {
  return weightItems.value.reduce((sum, item) => sum + item.weight, 0)
})

const handleTabChange = (tab) => {
  activeTab.value = tab
}

const addNewStandard = () => {
  const newStandard = {
    id: generateDeterministicId('std', 'new_' + standards.value.length),
    name: '新项目',
    category: '其他',
    unit: '',
    genderFilter: 'all',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 0, maxValue: 0 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 0, maxValue: 0 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 0, maxValue: 0 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 0 }
    ]
  }
  standards.value.push(newStandard)
}

const deleteStandard = (id) => {
  standards.value = standards.value.filter(s => s.id !== id)
}

const addRule = (standardId) => {
  const standard = standards.value.find(s => s.id === standardId)
  if (standard) {
    standard.rules.push({
      level: '及格',
      scoreMin: 60,
      scoreMax: 79,
      minValue: 0,
      maxValue: 0
    })
  }
}

const removeRule = (standardId, index) => {
  const standard = standards.value.find(s => s.id === standardId)
  if (standard && standard.rules.length > 1) {
    standard.rules.splice(index, 1)
  }
}
</script>

<style scoped>
.score-config-container {
  background: var(--bg-card, #fff);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color, #E8EAED);
}

.config-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1A1A2E);
  margin: 0;
}

.config-content {
  padding: 20px;
}

.standard-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.standard-card {
  border: 1px solid var(--border-color, #E8EAED);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-primary, #F7F8FA);
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.item-name-input {
  width: 140px;
}

.item-category-select {
  width: 120px;
}

.unit-input {
  width: 80px;
}

.level-select {
  width: 100px;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.score-rules {
  padding: 16px;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #1A1A2E);
}

.inline-radio :deep(.el-radio) {
  margin-right: 16px;
}

.rules-table {
  border: 1px solid var(--border-color, #E8EAED);
  border-radius: 6px;
  overflow: hidden;
}

.rules-header {
  display: flex;
  background: var(--bg-primary, #F7F8FA);
  padding: 12px 16px;
  gap: 12px;
}

.rules-header .rule-col {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #6B7280);
  text-transform: uppercase;
}

.rules-header .rule-col:first-child {
  flex: 0 0 110px;
}

.rules-header .rule-col:nth-child(2) {
  flex: 0 0 200px;
}

.rules-header .rule-col:nth-child(3) {
  flex: 1 1 auto;
  min-width: 280px;
}

.rules-header .rule-col:last-child {
  flex: 0 0 70px;
}

.rules-row {
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color, #E8EAED);
  align-items: center;
  gap: 12px;
}

.rules-row:first-child {
  border-top: none;
}

.add-row {
  justify-content: center;
}

.rule-col {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary, #1A1A2E);
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.rule-col:first-child {
  flex: 0 0 110px;
}

.rule-col:nth-child(2) {
  flex: 0 0 200px;
}

.rule-col:nth-child(3) {
  flex: 1 1 auto;
  min-width: 280px;
}

.rule-col:last-child {
  flex: 0 0 70px;
}

.level-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.level-优秀 {
  background: #DCFCE7;
  color: #166534;
}

.level-良好 {
  background: #DBEAFE;
  color: #1E40AF;
}

.level-及格 {
  background: #FEF3C7;
  color: #92400E;
}

.level-不及格 {
  background: #FEE2E2;
  color: #991B1B;
}

.composite-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-section {
  border: 1px solid var(--border-color, #E8EAED);
  border-radius: 8px;
  padding: 16px;
}

.setting-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1A1A2E);
  margin: 0 0 16px 0;
}

.grade-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grade-item {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.grade-label {
  width: 60px;
  font-size: 13px;
  color: var(--text-primary, #1A1A2E);
}

.grade-value {
  width: 100px;
  font-size: 13px;
  color: var(--text-secondary, #6B7280);
}

.weight-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weight-item {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.weight-label {
  width: 100px;
  font-size: 13px;
  color: var(--text-primary, #1A1A2E);
}

.weight-value {
  width: 60px;
  font-size: 13px;
  color: var(--text-secondary, #6B7280);
}

.total-weight {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #E8EAED);
  text-align: right;
  font-size: 13px;
  color: var(--text-secondary, #6B7280);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .config-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-title {
    width: 100%;
  }

  .item-name-input,
  .item-category-select {
    width: 100%;
  }

  .rules-header {
    display: none;
  }

  .rules-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .rule-col,
  .rule-col:first-child,
  .rule-col:nth-child(2),
  .rule-col:nth-child(3),
  .rule-col:last-child {
    flex: none;
    width: 100%;
  }

  .grade-item,
  .weight-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .grade-label,
  .grade-value,
  .weight-label,
  .weight-value {
    width: auto;
  }
}
</style>
