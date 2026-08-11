<template>
  <div class="template-download-container">
    <el-dialog 
      title="下载模板" 
      :model-value="visible"
      width="500px"
      @update:model-value="(val) => emit('update:visible', val)"
    >
      <div class="template-list">
        <div 
          v-for="template in displayTemplates" 
          :key="template.id"
          class="template-item"
          @click="downloadTemplate(template)"
        >
          <div class="template-icon">
            <component :is="template.icon" class="icon" />
          </div>
          <div class="template-info">
            <h4 class="template-name">{{ template.name }}</h4>
            <p class="template-desc">{{ template.description }}</p>
            <span class="template-size">{{ template.size || '未知大小' }}</span>
          </div>
          <el-button text type="primary" class="download-btn">
            <Download />
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="handleClose">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import { 
  Document, DataBoard, User, Trophy, Reading, School,
  Download 
} from '@element-plus/icons-vue'
import { MOCK_PRESET_TEMPLATES, MOCK_CUSTOM_TEMPLATES } from '@/data/mockData'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  templateType: {
    type: String,
    default: ''
  },
  customTemplates: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible'])

const getTemplateIcon = (type) => {
  const icons = { 
    student: markRaw(User), 
    score: markRaw(Trophy), 
    test: markRaw(DataBoard), 
    course: markRaw(Reading) 
  }
  return icons[type] || markRaw(School)
}

const displayTemplates = computed(() => {
  let allTemplates = [
    ...MOCK_PRESET_TEMPLATES.map(t => ({
      ...t,
      icon: getTemplateIcon(t.type),
      size: `${t.fields.length * 15 + 20} KB`,
      fileName: `${t.name}.xlsx`
    })),
    ...props.customTemplates.map(t => ({
      ...t,
      icon: getTemplateIcon(t.type),
      size: `${t.fields.length * 15 + 20} KB`,
      fileName: `${t.name}.xlsx`
    }))
  ]
  
  if (props.templateType) {
    allTemplates = allTemplates.filter(t => t.type === props.templateType)
  }
  
  return allTemplates.length > 0 ? allTemplates : fallbackTemplates
})

const fallbackTemplates = ref([
  {
    id: 'fallback-1',
    name: '国家体测标准表格',
    description: '包含所有体测项目评分标准的Excel模板',
    size: '125 KB',
    icon: DataBoard,
    fileName: 'national_test_standard.xlsx',
    type: 'test',
    fields: [
      { name: '学号', type: 'text', required: true },
      { name: '姓名', type: 'text', required: true },
      { name: '年级', type: 'text', required: true },
      { name: '班级', type: 'text', required: true },
      { name: '性别', type: 'text', required: true },
      { name: '身高(cm)', type: 'number', required: true },
      { name: '体重(kg)', type: 'number', required: true },
      { name: 'BMI', type: 'number', required: true },
      { name: '左眼视力', type: 'number', required: true },
      { name: '右眼视力', type: 'number', required: true },
      { name: '坐位体前屈(cm)', type: 'number', required: true },
      { name: '仰卧起坐(个)', type: 'number', required: true },
      { name: '50米跑(秒)', type: 'number', required: true },
      { name: '立定跳远(m)', type: 'number', required: true },
      { name: '引体向上(个)', type: 'number', required: false },
      { name: '耐力跑(分:秒)', type: 'text', required: false },
      { name: '肺活量(ml)', type: 'number', required: true },
      { name: '总分', type: 'number', required: false },
      { name: '综合等级', type: 'text', required: false },
      { name: '测试日期', type: 'date', required: true }
    ]
  },
  {
    id: 'fallback-2',
    name: '学生成绩记录模板',
    description: '用于记录学生体育成绩的表格模板',
    size: '89 KB',
    icon: Document,
    fileName: 'student_scores.xlsx',
    type: 'score',
    fields: [
      { name: '学号', type: 'text', required: true },
      { name: '姓名', type: 'text', required: true },
      { name: '年级', type: 'text', required: false },
      { name: '班级', type: 'text', required: false },
      { name: '项目', type: 'text', required: true },
      { name: '成绩', type: 'number', required: true },
      { name: '得分', type: 'number', required: false },
      { name: '等级', type: 'text', required: false },
      { name: '测试日期', type: 'date', required: false }
    ]
  },
  {
    id: 'fallback-3',
    name: '运动处方模板',
    description: '专业运动处方报告模板',
    size: '156 KB',
    icon: Document,
    fileName: 'exercise_prescription.xlsx',
    type: 'score',
    fields: [
      { name: '学号', type: 'text', required: true },
      { name: '姓名', type: 'text', required: true },
      { name: '年级', type: 'text', required: true },
      { name: '班级', type: 'text', required: true },
      { name: '评估日期', type: 'date', required: true },
      { name: 'BMI等级', type: 'text', required: false },
      { name: '心肺功能', type: 'text', required: false },
      { name: '柔韧性', type: 'text', required: false },
      { name: '力量素质', type: 'text', required: false },
      { name: '运动建议', type: 'text', required: false },
      { name: '注意事项', type: 'text', required: false }
    ]
  },
  {
    id: 'fallback-4',
    name: '课程评价表模板',
    description: '体育课教学评价表模板',
    size: '67 KB',
    icon: Document,
    fileName: 'course_evaluation.xlsx',
    type: 'course',
    fields: [
      { name: '课程名称', type: 'text', required: true },
      { name: '授课老师', type: 'text', required: true },
      { name: '授课班级', type: 'text', required: true },
      { name: '评价维度', type: 'text', required: true },
      { name: '评分', type: 'number', required: true },
      { name: '评价内容', type: 'text', required: false },
      { name: '评价日期', type: 'date', required: true }
    ]
  },
  {
    id: 'fallback-5',
    name: '比赛计分表模板',
    description: '体育比赛计分统计表格',
    size: '45 KB',
    icon: DataBoard,
    fileName: 'match_score.xlsx',
    type: 'score',
    fields: [
      { name: '项目', type: 'text', required: true },
      { name: '年级', type: 'text', required: true },
      { name: '班级', type: 'text', required: true },
      { name: '姓名', type: 'text', required: true },
      { name: '成绩', type: 'text', required: true },
      { name: '排名', type: 'number', required: false },
      { name: '备注', type: 'text', required: false }
    ]
  },
  {
    id: 'fallback-6',
    name: '训练计划模板',
    description: '周训练计划安排表',
    size: '72 KB',
    icon: Document,
    fileName: 'training_plan.xlsx',
    type: 'course',
    fields: [
      { name: '星期', type: 'text', required: true },
      { name: '时间段', type: 'text', required: true },
      { name: '训练内容', type: 'text', required: true },
      { name: '训练目标', type: 'text', required: true },
      { name: '强度', type: 'text', required: false },
      { name: '备注', type: 'text', required: false }
    ]
  }
])

const handleClose = () => {
  emit('update:visible', false)
}

const downloadTemplate = (template) => {
  const fields = template.fields || []
  if (fields.length === 0) {
    downloadSimpleTemplate(template)
    return
  }
  
  downloadRealTemplate(template)
}

const downloadRealTemplate = (template) => {
  const headers = template.fields.map(f => f.name)
  const exampleRow = template.fields.map(f => getExampleValue(f))
  const content = [headers.join(','), exampleRow.join(',')].join('\n')
  
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = template.fileName
  a.click()
  URL.revokeObjectURL(url)
}

const getExampleValue = (field) => {
  const examples = {
    '学号': '2026001',
    '姓名': '张三',
    '性别': '男',
    '年级': '一年级',
    '班级': '1班',
    '出生日期': '2018-09-01',
    '身高': '120.5',
    '体重': '25.3',
    'BMI': '17.6',
    '左眼视力': '5.0',
    '右眼视力': '5.0',
    '坐位体前屈': '15.2',
    '坐位体前屈(cm)': '15.2',
    '仰卧起坐': '35',
    '仰卧起坐(个)': '35',
    '50米跑': '9.5',
    '50米跑(秒)': '9.5',
    '立定跳远': '1.55',
    '立定跳远(m)': '1.55',
    '引体向上': '8',
    '引体向上(个)': '8',
    '耐力跑': '3:20',
    '耐力跑(分:秒)': '3:20',
    '肺活量': '2000',
    '肺活量(ml)': '2000',
    '总分': '85',
    '综合等级': '良好',
    '测试日期': '2026/5/20',
    '项目': '立定跳远',
    '成绩': '85',
    '得分': '85',
    '等级': '良好',
    '课程名称': '篮球基础',
    '授课老师': '王老师',
    '授课班级': '三年级1班',
    '授课时间': '周一 14:00',
    '场地': '篮球场',
    '联系电话': '13800138000',
    '周次': '1',
    '课时数': '2',
    '课程类型': '必修',
    '排名': '1',
    '星期': '周一',
    '时间段': '14:00-15:30',
    '训练内容': '篮球运球练习',
    '训练目标': '提高运球稳定性',
    '强度': '中等',
    '评估日期': '2026/5/20',
    'BMI等级': '正常',
    '心肺功能': '良好',
    '柔韧性': '一般',
    '力量素质': '良好',
    '运动建议': '每周运动3次',
    '注意事项': '运动前热身',
    '评价维度': '教学态度',
    '评价内容': '教学认真负责'
  }
  
  if (examples[field.name]) {
    return examples[field.name]
  }
  
  if (field.type === 'number') return ''
  if (field.type === 'date') return ''
  return ''
}

const downloadSimpleTemplate = (template) => {
  const content = `模板文件: ${template.name}

描述: ${template.description}
大小: ${template.size}
格式: ${template.fileName.split('.').pop().toUpperCase()}

此模板用于${template.description}。

使用说明:
1. 下载后使用相应软件打开
2. 根据实际情况填写数据
3. 保存并打印或分享

智慧体育评估系统`

  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = template.fileName
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.template-download-container {
  /* el-dialog teleports to body */
}

.template-list {
  max-height: 400px;
  overflow-y: auto;
}

.template-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #E8EAED;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-item:hover {
  border-color: #1E5AA8;
  background: #EEF6FF;
}

.template-icon {
  width: 48px;
  height: 48px;
  background: #F7F8FA;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.template-icon .icon {
  font-size: 24px;
  color: #1E5AA8;
}

.template-info {
  flex: 1;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 4px 0;
}

.template-desc {
  font-size: 12px;
  color: #6B7280;
  margin: 0 0 4px 0;
}

.template-size {
  font-size: 11px;
  color: #9CA3AF;
}

.download-btn {
  padding: 8px 12px;
}
</style>
