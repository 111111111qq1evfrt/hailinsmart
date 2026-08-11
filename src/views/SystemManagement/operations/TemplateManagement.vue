<template>
  <div class="template-management">
    <!-- 顶部操作 -->
    <div class="page-header">
      <div class="header-filters">
        <el-select v-model="filterType" placeholder="选择模板类型" clearable style="width: 160px">
          <el-option label="全部" value="" />
          <el-option label="学生导入模板" value="student" />
          <el-option label="成绩导入模板" value="score" />
          <el-option label="体测模板" value="test" />
          <el-option label="课程模板" value="course" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Upload" @click="showImportDialog = true">导入模板</el-button>
        <el-button type="primary" :icon="Plus" @click="createTemplate">新建模板</el-button>
      </div>
    </div>

    <!-- 模板概览 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ templateStats.total }}</span>
        <span class="stat-label">模板总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ templateStats.student }}</span>
        <span class="stat-label">学生模板</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num score">{{ templateStats.score }}</span>
        <span class="stat-label">成绩模板</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num test">{{ templateStats.test }}</span>
        <span class="stat-label">体测模板</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num course">{{ templateStats.course }}</span>
        <span class="stat-label">课程模板</span>
      </div>
    </div>

    <!-- 预置模板库 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">预置模板库</span>
        <span class="card-subtitle">系统预置的标准模板，可直接使用或作为自定义模板的基础</span>
      </div>
      
      <div v-if="filteredPresetTemplates.length === 0" class="empty-state small">
        <Document />
        <p>当前类型暂无预置模板</p>
      </div>

      <div v-else class="template-grid">
        <div v-for="template in filteredPresetTemplates" :key="template.id" class="template-card preset">
          <div class="template-icon" :class="template.type">
            <component :is="getTemplateIcon(template.type)" />
          </div>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
            <div class="template-meta">
              <span class="template-tag">{{ getTypeLabel(template.type) }}</span>
              <span class="template-version">v{{ template.version }}</span>
            </div>
          </div>
          <div class="template-actions">
            <el-button text size="small" @click="previewTemplate(template)">预览</el-button>
            <el-button text type="primary" size="small" @click="downloadTemplate(template)">下载</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义模板 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">自定义模板</span>
        <el-button text size="small" :icon="Refresh" @click="refreshTemplates">刷新</el-button>
      </div>
      
      <div v-if="filteredCustomTemplates.length === 0" class="empty-state">
        <Document />
        <p>{{ filterType ? '当前类型暂无自定义模板' : '暂无自定义模板' }}</p>
        <el-button v-if="!filterType" type="primary" size="small" @click="createTemplate">创建第一个模板</el-button>
      </div>
      
      <div v-else class="template-list">
        <div v-for="template in filteredCustomTemplates" :key="template.id" class="template-item">
          <div class="template-left">
            <div class="template-icon small" :class="template.type">
              <component :is="getTemplateIcon(template.type)" />
            </div>
            <div class="template-info">
              <h4>{{ template.name }}</h4>
              <p>{{ template.description }}</p>
            </div>
          </div>
          <div class="template-center">
            <span class="template-tag">{{ getTypeLabel(template.type) }}</span>
            <span class="template-update">更新于 {{ template.updateTime }}</span>
          </div>
          <div class="template-right">
            <el-button text size="small" @click="editTemplate(template)">编辑</el-button>
            <el-button text size="small" @click="previewTemplate(template)">预览</el-button>
            <el-button text size="small" @click="downloadTemplate(template)">下载</el-button>
            <el-button text size="small" type="danger" @click="deleteTemplate(template)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量导入候选人 -->
    <div class="list-card import-card">
      <div class="card-header">
        <span class="card-title">批量导入候选人</span>
        <span class="card-subtitle">通过模板导入学生候选人数据</span>
      </div>
      
      <div class="import-section">
        <div class="import-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>选择导入模板</h4>
            <el-select v-model="importForm.templateId" placeholder="请选择导入模板" style="width: 280px" @change="onImportTemplateChange">
              <el-option 
                v-for="template in importableTemplates" 
                :key="template.id" 
                :label="template.name" 
                :value="template.id" 
              />
            </el-select>
          </div>
        </div>
        
        <div class="import-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>上传数据文件</h4>
            <el-upload
              ref="uploadRef"
              action="#"
              :auto-upload="false"
              :limit="1"
              accept=".xlsx,.xls,.csv"
              :file-list="importFileList"
              :on-change="handleFileChange"
              :on-remove="resetImport"
            >
              <el-button type="primary" :icon="Upload">选择文件</el-button>
              <template #tip>
                <div class="el-upload__tip">支持 .xlsx / .xls / .csv 格式</div>
              </template>
            </el-upload>
          </div>
        </div>
        
        <div class="import-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>字段映射</h4>
            <div v-if="importForm.templateId && fileColumns.length > 0" class="field-mapping">
              <div v-for="(field, index) in templateFields" :key="index" class="mapping-item">
                <span class="field-name" :class="{ required: field.required }">{{ field.name }}</span>
                <span class="field-arrow">→</span>
                <el-select v-model="field.mapped" placeholder="选择对应列" style="width: 160px">
                  <el-option label="不导入" value="" />
                  <el-option 
                    v-for="col in fileColumns" 
                    :key="col" 
                    :label="col" 
                    :value="col" 
                  />
                </el-select>
              </div>
            </div>
            <div v-else-if="!importForm.templateId" class="empty-mapping">
              <p>请先选择导入模板</p>
            </div>
            <div v-else class="empty-mapping">
              <p>请先上传数据文件</p>
            </div>
          </div>
        </div>
        
        <div class="import-preview" v-if="importPreview.length > 0">
          <h4>数据预览 <span class="preview-badge">前 {{ importPreview.length }} 条</span></h4>
          <el-table :data="importPreview" stripe size="small" max-height="260">
            <el-table-column 
              v-for="col in previewColumns" 
              :key="col" 
              :prop="col" 
              :label="col"
              min-width="100"
            />
          </el-table>
          <p class="preview-count">共解析 {{ totalPreviewCount }} 条数据</p>
        </div>

        <div v-if="importErrors.length > 0" class="import-errors">
          <h4>数据校验 <span class="error-badge">{{ importErrors.length }} 条异常</span></h4>
          <div v-for="(err, i) in importErrors.slice(0, 5)" :key="i" class="error-item">
            第 {{ err.row }} 行：{{ err.message }}
          </div>
          <div v-if="importErrors.length > 5" class="error-more">还有 {{ importErrors.length - 5 }} 条异常...</div>
        </div>
        
        <div class="import-actions">
          <el-button @click="resetImport">重置</el-button>
          <el-button type="primary" @click="startImport" :disabled="!canImport">
            {{ importing ? '导入中...' : '开始导入' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 新建/编辑模板弹窗 -->
    <el-dialog v-model="showCreateDialog" :title="isEditing ? '编辑模板' : '新建模板'" width="620px" destroy-on-close>
      <el-form :model="newTemplate" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="newTemplate.name" placeholder="如：2025级新生导入模板" />
        </el-form-item>
        <el-form-item label="模板类型" required>
          <el-select v-model="newTemplate.type" style="width: 100%">
            <el-option label="学生导入模板" value="student" />
            <el-option label="成绩导入模板" value="score" />
            <el-option label="体测模板" value="test" />
            <el-option label="课程模板" value="course" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input v-model="newTemplate.description" type="textarea" :rows="2" placeholder="描述模板用途" />
        </el-form-item>
        <el-form-item label="模板字段">
          <div class="field-list">
            <div v-for="(field, index) in newTemplate.fields" :key="index" class="field-row">
              <el-input v-model="field.name" placeholder="字段名称" style="width: 150px" />
              <el-select v-model="field.type" style="width: 110px">
                <el-option label="文本" value="text" />
                <el-option label="数字" value="number" />
                <el-option label="日期" value="date" />
              </el-select>
              <span class="field-required-label">
                <el-switch v-model="field.required" size="small" />
                必填
              </span>
              <el-button text size="small" type="danger" @click="removeField(index)" :disabled="newTemplate.fields.length <= 1">
                删除
              </el-button>
            </div>
            <el-button text size="small" type="primary" @click="addField">+ 添加字段</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">{{ isEditing ? '保存修改' : '创建模板' }}</el-button>
      </template>
    </el-dialog>

    <!-- 导入模板文件弹窗 -->
    <el-dialog v-model="showImportDialog" title="导入模板文件" width="520px" destroy-on-close>
      <div class="import-template-dialog">
        <p class="dialog-desc">上传 Excel 文件，系统自动识别列名作为模板字段，生成新模板。</p>
        <el-form label-width="100px">
          <el-form-item label="模板名称">
            <el-input v-model="importedTemplate.name" placeholder="如：从外部系统导入的模板" />
          </el-form-item>
          <el-form-item label="模板类型">
            <el-select v-model="importedTemplate.type" style="width: 100%">
              <el-option label="学生导入模板" value="student" />
              <el-option label="成绩导入模板" value="score" />
              <el-option label="体测模板" value="test" />
              <el-option label="课程模板" value="course" />
            </el-select>
          </el-form-item>
          <el-form-item label="上传文件">
            <el-upload
              action="#"
              :auto-upload="false"
              :limit="1"
              accept=".xlsx,.xls,.csv"
              :file-list="importTemplateFileList"
              :on-change="handleImportTemplateFile"
              :on-remove="importedTemplate.fields = []"
            >
              <el-button type="primary" :icon="Upload">选择 Excel 文件</el-button>
              <template #tip>
                <div class="el-upload__tip">系统将自动读取第一行列名作为模板字段</div>
              </template>
            </el-upload>
          </el-form-item>
          <el-form-item v-if="importedTemplate.fields.length > 0" label="识别字段">
            <div class="imported-fields">
              <el-tag v-for="(field, i) in importedTemplate.fields" :key="i" closable @close="importedTemplate.fields.splice(i, 1)">
                {{ field.name }}（{{ getFieldTypeLabel(field.type) }}）
              </el-tag>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmImportTemplate" :disabled="!importedTemplate.name || importedTemplate.fields.length === 0">
          确认导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 模板预览弹窗 -->
    <el-dialog v-model="showPreviewDialog" :title="previewTemplateData?.name || '模板预览'" width="700px" destroy-on-close>
      <div v-if="previewTemplateData" class="preview-content">
        <div class="preview-header">
          <div class="preview-title-row">
            <div class="template-icon small" :class="previewTemplateData.type">
              <component :is="getTemplateIcon(previewTemplateData.type)" />
            </div>
            <div>
              <h4>{{ previewTemplateData.name }}</h4>
              <p>{{ previewTemplateData.description }}</p>
            </div>
            <span class="template-tag" style="margin-left: auto">{{ getTypeLabel(previewTemplateData.type) }}</span>
          </div>
        </div>
        <div class="preview-fields">
          <h5>模板字段（{{ previewTemplateData.fields.length }} 个）</h5>
          <table class="preview-table">
            <thead>
              <tr>
                <th style="width: 40px">#</th>
                <th>字段名称</th>
                <th>字段类型</th>
                <th>是否必填</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(field, index) in previewTemplateData.fields" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ field.name }}</td>
                <td>{{ getFieldTypeLabel(field.type) }}</td>
                <td>
                  <el-tag v-if="field.required" type="danger" size="small">必填</el-tag>
                  <el-tag v-else size="small" type="info">选填</el-tag>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 预览弹窗中的示例数据 -->
        <div class="preview-sample" v-if="previewTemplateData.fields.length > 0">
          <h5>示例数据</h5>
          <el-table :data="samplePreviewData" stripe size="small" max-height="180">
            <el-table-column 
              v-for="field in previewTemplateData.fields" 
              :key="field.name" 
              :prop="field.name" 
              :label="field.name"
              min-width="100"
            />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" :icon="Download" @click="previewTemplateData && downloadTemplate(previewTemplateData)">下载模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload, Plus, Refresh, Document, Download,
  User, Trophy, Reading, School
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { MOCK_PRESET_TEMPLATES, MOCK_CUSTOM_TEMPLATES } from '@/data/mockData'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { useOperationLog } from '@/composables/useOperationLog'
import { generateDeterministicId } from '@/utils/seededRandom'
import store from '@/store/global'

const { addLog } = useOperationLog('system')

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// ========== 筛选 ==========
const filterType = ref('')

// ========== 模板数据 ==========
const presetTemplates = ref([...MOCK_PRESET_TEMPLATES])
const customTemplates = usePersistedRef(
  computed(() => `smart_pe_custom_templates_${schoolId.value}`),
  [...MOCK_CUSTOM_TEMPLATES]
)

// 按类型筛选
const filteredPresetTemplates = computed(() => {
  if (!filterType.value) return presetTemplates.value
  return presetTemplates.value.filter(t => t.type === filterType.value)
})

const filteredCustomTemplates = computed(() => {
  if (!filterType.value) return customTemplates.value
  return customTemplates.value.filter(t => t.type === filterType.value)
})

// 模板统计
const templateStats = computed(() => {
  const all = [...presetTemplates.value, ...customTemplates.value]
  return {
    total: all.length,
    student: all.filter(t => t.type === 'student').length,
    score: all.filter(t => t.type === 'score').length,
    test: all.filter(t => t.type === 'test').length,
    course: all.filter(t => t.type === 'course').length
  }
})

// 可导入模板（学生类型）
const importableTemplates = computed(() => {
  return [...presetTemplates.value, ...customTemplates.value].filter(t => t.type === 'student')
})

// ========== 图标与标签 ==========
const getTemplateIcon = (type) => {
  const icons = { student: markRaw(User), score: markRaw(Trophy), test: markRaw(Trophy), course: markRaw(Reading) }
  return icons[type] || markRaw(School)
}

const getTypeLabel = (type) => {
  const labels = { student: '学生模板', score: '成绩模板', test: '体测模板', course: '课程模板' }
  return labels[type] || '其他'
}

const getFieldTypeLabel = (type) => {
  const labels = { text: '文本', number: '数字', date: '日期' }
  return labels[type] || '未知'
}

// ========== 新建/编辑弹窗 ==========
const showCreateDialog = ref(false)
const isEditing = ref(false)
const editingTemplateId = ref(null)
const newTemplate = ref({
  name: '',
  type: 'student',
  description: '',
  fields: [{ name: '', type: 'text', required: false }]
})

const resetNewTemplate = () => {
  newTemplate.value = {
    name: '',
    type: 'student',
    description: '',
    fields: [{ name: '', type: 'text', required: false }]
  }
  isEditing.value = false
  editingTemplateId.value = null
}

const createTemplate = () => {
  resetNewTemplate()
  showCreateDialog.value = true
}

const editTemplate = (template) => {
  isEditing.value = true
  editingTemplateId.value = template.id
  newTemplate.value = {
    name: template.name,
    type: template.type,
    description: template.description || '',
    fields: template.fields.map(f => ({ ...f }))
  }
  showCreateDialog.value = true
}

const addField = () => {
  newTemplate.value.fields.push({ name: '', type: 'text', required: false })
}

const removeField = (index) => {
  if (newTemplate.value.fields.length > 1) {
    newTemplate.value.fields.splice(index, 1)
  }
}

const saveTemplate = () => {
  if (!newTemplate.value.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  const validFields = newTemplate.value.fields.filter(f => f.name.trim())
  if (validFields.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }

  if (isEditing.value) {
    // 编辑模式：更新已有模板
    const idx = customTemplates.value.findIndex(t => t.id === editingTemplateId.value)
    if (idx > -1) {
      customTemplates.value[idx] = {
        ...customTemplates.value[idx],
        name: newTemplate.value.name.trim(),
        type: newTemplate.value.type,
        description: newTemplate.value.description.trim(),
        fields: validFields,
        updateTime: new Date().toLocaleDateString('zh-CN')
      }
    }
    ElMessage.success('模板已更新')
    addLog('修改模板', newTemplate.value.name.trim(), `修改模板"${newTemplate.value.name.trim()}"`)
  } else {
    // 新建模式
    customTemplates.value.unshift({
      id: generateDeterministicId('custom', newTemplate.value.name.trim()),
      name: newTemplate.value.name.trim(),
      type: newTemplate.value.type,
      description: newTemplate.value.description.trim(),
      updateTime: new Date().toLocaleDateString('zh-CN'),
      fields: validFields
    })
    ElMessage.success('模板创建成功')
    addLog('创建模板', newTemplate.value.name.trim(), `创建模板"${newTemplate.value.name.trim()}"`)
  }

  showCreateDialog.value = false
  resetNewTemplate()
}

// ========== 删除模板 ==========
const deleteTemplate = (template) => {
  ElMessageBox.confirm(
    `确定要删除模板「${template.name}」吗？删除后不可恢复。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const index = customTemplates.value.findIndex(t => t.id === template.id)
    if (index > -1) {
      customTemplates.value.splice(index, 1)
      ElMessage.success('模板已删除')
      addLog('删除模板', template.name, `删除模板"${template.name}"`)
    }
  }).catch(() => {})
}

// ========== 预览弹窗 ==========
const showPreviewDialog = ref(false)
const previewTemplateData = ref(null)

const previewTemplate = (template) => {
  previewTemplateData.value = template
  showPreviewDialog.value = true
}

// 预览弹窗中的示例数据
const samplePreviewData = computed(() => {
  if (!previewTemplateData.value || !previewTemplateData.value.fields.length) return []
  const fields = previewTemplateData.value.fields
  const sampleData = {
    '学号': ['2025001', '2025002', '2025003'],
    '姓名': ['张三', '李四', '王五'],
    '性别': ['男', '女', '男'],
    '年级': ['一年级', '二年级', '一年级'],
    '班级': ['1班', '2班', '3班'],
    '出生日期': ['2018-09-01', '2017-08-15', '2018-10-20'],
    'BMI': ['16.5', '15.8', '17.2'],
    '视力': ['5.0', '4.8', '5.1'],
    '50米跑': ['9.8', '10.2', '9.5'],
    '坐位体前屈': ['16.5', '12.3', '18.7'],
    '仰卧起坐': ['36', '42', '38'],
    '立定跳远': ['156', '142', '168'],
    '引体向上': ['8', '12', '6'],
    '成绩': ['85', '92', '78'],
    '项目': ['50米跑', '坐位体前屈', '立定跳远'],
    '等级': ['优秀', '良好', '及格'],
    '课程名称': ['篮球基础', '田径训练', '游泳入门'],
    '授课老师': ['王老师', '李老师', '张老师'],
    '授课班级': ['三年级1班', '四年级2班', '五年级3班'],
    '授课时间': ['周一 14:00', '周三 10:00', '周五 15:00'],
    '场地': ['篮球场', '田径场', '游泳馆'],
    '入学年份': ['2025', '2025', '2024'],
    '名次': ['1', '2', '3'],
    '视力': ['5.0', '4.8', '5.1']
  }
  return [0, 1, 2].map(i => {
    const row = {}
    fields.forEach(f => {
      row[f.name] = sampleData[f.name] ? sampleData[f.name][i] || '-' : '-'
    })
    return row
  })
})

// ========== 下载模板（生成真实 Excel） ==========
const downloadTemplate = (template) => {
  try {
    const fields = template.fields || []
    if (fields.length === 0) {
      ElMessage.warning('该模板没有字段定义')
      return
    }
    // 创建工作表：第一行为字段名，第二行为示例数据
    const headers = fields.map(f => f.name)
    const sampleRow = fields.map(f => {
      if (f.type === 'number') return ''
      if (f.type === 'date') return ''
      return ''
    })
    const wsData = [headers, sampleRow]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // 设置列宽
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length * 2 + 4, 12) }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, template.name.substring(0, 31))

    const fileName = `${template.name}.xlsx`
    XLSX.writeFile(wb, fileName)
    ElMessage.success(`已下载模板: ${template.name}`)
  } catch (e) {
    console.error('下载模板失败:', e)
    ElMessage.error('下载失败，请重试')
  }
}

// ========== 导入模板文件弹窗 ==========
const showImportDialog = ref(false)
const importTemplateFileList = ref([])
const importedTemplate = ref({
  name: '',
  type: 'student',
  description: '',
  fields: []
})

const handleImportTemplateFile = (file) => {
  const raw = file.raw
  if (!raw) return

  importedTemplate.value.name = importedTemplate.value.name || raw.name.replace(/\.(xlsx|xls|csv)$/i, '')

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      if (jsonData.length === 0 || !jsonData[0]) {
        ElMessage.warning('文件为空或格式不正确')
        return
      }

      // 第一行作为字段名
      const headers = jsonData[0].filter(h => h && String(h).trim())
      importedTemplate.value.fields = headers.map(h => ({
        name: String(h).trim(),
        type: guessFieldType(jsonData, headers.indexOf(h)),
        required: true
      }))

      importTemplateFileList.value = [file]
      ElMessage.success(`已识别 ${headers.length} 个字段`)
    } catch (err) {
      console.error('解析文件失败:', err)
      ElMessage.error('文件解析失败，请检查文件格式')
    }
  }
  reader.readAsArrayBuffer(raw)
}

// 猜测字段类型
const guessFieldType = (data, colIndex) => {
  // 检查前几行数据来判断类型
  for (let i = 1; i < Math.min(data.length, 10); i++) {
    const val = data[i]?.[colIndex]
    if (val === undefined || val === null || val === '') continue
    if (typeof val === 'number') return 'number'
    if (typeof val === 'string' && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(val)) return 'date'
    if (typeof val === 'string' && !isNaN(val) && val.trim() !== '') return 'number'
    return 'text'
  }
  return 'text'
}

const confirmImportTemplate = () => {
  if (!importedTemplate.value.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (importedTemplate.value.fields.length === 0) {
    ElMessage.warning('未识别到任何字段')
    return
  }

  customTemplates.value.unshift({
    id: generateDeterministicId('custom', importedTemplate.value.name.trim()),
    name: importedTemplate.value.name.trim(),
    type: importedTemplate.value.type,
    description: importedTemplate.value.description || `从文件导入，包含 ${importedTemplate.value.fields.length} 个字段`,
    updateTime: new Date().toLocaleDateString('zh-CN'),
    fields: importedTemplate.value.fields.map(f => ({ ...f }))
  })

  showImportDialog.value = false
  importTemplateFileList.value = []
  importedTemplate.value = { name: '', type: 'student', description: '', fields: [] }
  ElMessage.success('模板导入成功')
  addLog('导入模板', '', '导入模板数据')
}

// ========== 批量导入候选人 ==========
const uploadRef = ref(null)
const importForm = ref({ templateId: '', file: null })
const importFileList = ref([])
const fileColumns = ref([])
const templateFields = ref([])
const importPreview = ref([])
const totalPreviewCount = ref(0)
const importErrors = ref([])
const importing = ref(false)
const rawImportData = ref([])

const canImport = computed(() => {
  return importForm.value.templateId && importFileList.value.length > 0 && importErrors.value.length === 0
})

const previewColumns = computed(() => {
  if (importPreview.value.length === 0) return []
  return Object.keys(importPreview.value[0])
})

const onImportTemplateChange = () => {
  // 模板变化时重新映射字段
  if (fileColumns.value.length > 0) {
    updateFieldMapping()
  }
}

const handleFileChange = (file, fileList) => {
  if (!file || !file.raw) return
  importForm.value.file = file.raw
  importFileList.value = [file]

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

      if (jsonData.length === 0) {
        ElMessage.warning('文件为空')
        return
      }

      // 提取列名
      fileColumns.value = Object.keys(jsonData[0])
      rawImportData.value = jsonData

      // 预览前 10 条
      importPreview.value = jsonData.slice(0, 10).map(row => {
        const display = {}
        fileColumns.value.forEach(col => { display[col] = row[col] })
        return display
      })
      totalPreviewCount.value = jsonData.length

      // 自动映射字段
      updateFieldMapping()
      // 校验数据
      validateImportData(jsonData)
    } catch (err) {
      console.error('解析文件失败:', err)
      ElMessage.error('文件解析失败，请检查格式')
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

const updateFieldMapping = () => {
  const template = [...presetTemplates.value, ...customTemplates.value].find(t => t.id === importForm.value.templateId)
  if (!template) return

  templateFields.value = template.fields.map(f => {
    // 尝试自动匹配同名列
    const autoMatch = fileColumns.value.find(col =>
      col === f.name || col.includes(f.name) || f.name.includes(col)
    )
    return { ...f, mapped: autoMatch || '' }
  })
}

const validateImportData = (data) => {
  const errors = []
  const template = [...presetTemplates.value, ...customTemplates.value].find(t => t.id === importForm.value.templateId)
  if (!template || templateFields.value.length === 0) {
    importErrors.value = []
    return
  }

  // 检查必填字段
  const requiredFields = templateFields.value.filter(f => f.required && f.mapped)
  data.forEach((row, i) => {
    requiredFields.forEach(f => {
      const val = row[f.mapped]
      if (val === undefined || val === null || String(val).trim() === '') {
        errors.push({ row: i + 2, message: `必填字段「${f.name}」为空` })
      }
    })
  })

  importErrors.value = errors
}

const resetImport = () => {
  importForm.value = { templateId: '', file: null }
  importFileList.value = []
  fileColumns.value = []
  templateFields.value = []
  importPreview.value = []
  totalPreviewCount.value = 0
  importErrors.value = []
  importing.value = false
  rawImportData.value = []
}

const startImport = () => {
  if (!canImport.value) return

  importing.value = true

  // 模拟导入过程
  setTimeout(() => {
    const successCount = totalPreviewCount.value - importErrors.value.length
    importing.value = false
    ElMessage.success(`导入完成！成功 ${successCount} 条，失败 ${importErrors.value.length} 条`)
    resetImport()
  }, 1500)
}

// ========== 刷新 ==========
const refreshTemplates = () => {
  ElMessage.success('模板列表已刷新')
}
</script>

<style scoped>
.template-management {
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-filters {
  display: flex;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 统计栏 */
.stats-row {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.stat-item .stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
}

.stat-item .stat-num.text-primary {
  color: #1E5AA8;
}

.stat-item .stat-num.score {
  color: #3B82F6;
}

.stat-item .stat-num.test {
  color: #F5A623;
}

.stat-item .stat-num.course {
  color: #8B5CF6;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #6B7280;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #E8EAED;
  flex-shrink: 0;
}

/* 卡片 */
.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px 0;
  border-bottom: 1px solid #E8EAED;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.card-subtitle {
  font-size: 13px;
  color: #6B7280;
  margin-left: 12px;
}

/* 预置模板网格 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.template-card {
  background: #F7F8FA;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-card.preset {
  border: 2px solid #E8EAED;
  transition: border-color 0.2s;
}

.template-card.preset:hover {
  border-color: #1E5AA8;
}

.template-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #FFFFFF;
}

.template-icon.small {
  width: 40px;
  height: 40px;
  font-size: 18px;
  border-radius: 10px;
}

.template-icon.student { background: #1E5AA8; }
.template-icon.score { background: #3B82F6; }
.template-icon.test { background: #F5A623; }
.template-icon.course { background: #8B5CF6; }

.template-info {
  flex: 1;
}

.template-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 6px 0;
}

.template-info p {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
  line-height: 1.5;
}

.template-meta {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.template-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: #E8EAED;
  border-radius: 4px;
  color: #6B7280;
}

.template-version {
  font-size: 12px;
  color: #9CA3AF;
}

.template-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 自定义模板列表 */
.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  transition: background 0.2s;
}

.template-item:hover {
  background: #EEF2F7;
}

.template-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.template-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 180px;
}

.template-update {
  font-size: 12px;
  color: #9CA3AF;
}

.template-right {
  display: flex;
  gap: 8px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #9CA3AF;
}

.empty-state.small {
  padding: 24px;
}

.empty-state p {
  margin: 12px 0 16px 0;
}

/* 导入区域 */
.import-card {
  background: #FFFFFF;
}

.import-section {
  padding: 16px;
}

.import-step {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #1E5AA8;
  color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 8px 0;
}

/* 字段映射 */
.field-mapping {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-name {
  font-size: 13px;
  color: #6B7280;
  min-width: 80px;
}

.field-name.required {
  color: #1E5AA8;
  font-weight: 600;
}

.field-arrow {
  color: #9CA3AF;
}

.empty-mapping {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  text-align: center;
  color: #9CA3AF;
}

/* 预览 */
.import-preview {
  margin-top: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.import-preview h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-badge {
  font-size: 12px;
  font-weight: 400;
  padding: 2px 8px;
  background: #E8EAED;
  border-radius: 10px;
  color: #6B7280;
}

.preview-count {
  text-align: right;
  font-size: 12px;
  color: #9CA3AF;
  margin: 8px 0 0 0;
}

/* 校验错误 */
.import-errors {
  margin-top: 12px;
  padding: 16px;
  background: #FFF5F5;
  border-radius: 8px;
  border: 1px solid #FED7D7;
}

.import-errors h4 {
  font-size: 14px;
  font-weight: 600;
  color: #C53030;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-badge {
  font-size: 12px;
  font-weight: 400;
  padding: 2px 8px;
  background: #FED7D7;
  border-radius: 10px;
  color: #C53030;
}

.error-item {
  font-size: 13px;
  color: #742A2A;
  padding: 4px 0;
}

.error-more {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

/* 导入操作 */
.import-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

/* 新建/编辑表单 */
.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-required-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
  white-space: nowrap;
}

/* 导入模板弹窗 */
.import-template-dialog .dialog-desc {
  font-size: 13px;
  color: #6B7280;
  margin: 0 0 20px 0;
}

.imported-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 预览弹窗 */
.preview-content {
  padding: 8px 0;
}

.preview-header {
  margin-bottom: 20px;
}

.preview-title-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.preview-title-row h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
}

.preview-title-row p {
  font-size: 13px;
  color: #6B7280;
  margin: 4px 0 0 0;
}

.preview-fields h5,
.preview-sample h5 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 12px 0;
}

.preview-sample {
  margin-top: 20px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 10px;
  border: 1px solid #E8EAED;
  text-align: left;
  font-size: 13px;
}

.preview-table th {
  background: #F7F8FA;
  font-weight: 600;
  color: #6B7280;
}

.preview-table td:first-child {
  color: #9CA3AF;
  text-align: center;
}
</style>
