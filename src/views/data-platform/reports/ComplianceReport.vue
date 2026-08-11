<template>
  <div class="compliance-report-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-select v-model="reportType" placeholder="选择报表类型" style="width: 180px">
          <el-option label="月度合规报告" value="monthly" />
          <el-option label="学期汇总报告" value="term" />
          <el-option label="安全检查报告" value="safety" />
          <el-option label="器材维护报告" value="equipment" />
          <el-option label="课程进度报告" value="progress" />
        </el-select>
        <el-select v-model="reportPeriod" placeholder="选择周期" style="width: 140px">
          <el-option label="本月" value="thisMonth" />
          <el-option label="上月" value="lastMonth" />
          <el-option label="本季度" value="thisQuarter" />
          <el-option label="本年度" value="thisYear" />
        </el-select>
        <el-select v-model="exportFormat" placeholder="导出格式" style="width: 140px">
          <el-option label="Excel" value="excel" />
          <el-option label="PDF" value="pdf" />
          <el-option label="CSV" value="csv" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button type="primary" @click="generateReport" :icon="Document">生成报表</el-button>
        <el-button type="primary" @click="openCustomReportBuilder" :icon="Grid">自定义报表</el-button>
        <el-button type="primary" :icon="Download" @click="handleExportReport">导出报表</el-button>
        <el-button type="success" @click="exportMinistryReport" :icon="Folder">教育部报表</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalReports }}</span>
        <span class="stat-label">报表总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.complianceRate }}%</span>
        <span class="stat-label">合规率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.exported }}</span>
        <span class="stat-label">已导出</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.alerts }}</span>
        <span class="stat-label">预警项</span>
      </div>
    </div>

    <div class="content-row">
      <div class="report-preview">
        <div class="card-header">
          <span class="card-title">报表预览</span>
          <span class="report-date">生成时间：{{ currentDate }}</span>
        </div>
        <div class="report-content">
          <div class="report-header">
            <h1>{{ reportTitle }}</h1>
            <p>{{ schoolName }}</p>
            <p>报告周期：{{ reportPeriodText }}</p>
          </div>

          <!-- 返回标准报表按钮 -->
          <div v-if="activeCustomReport" class="custom-report-actions">
            <el-button size="small" @click="backToStandardReport">← 返回标准报表</el-button>
            <span class="custom-report-tag">自定义报表</span>
          </div>

          <!-- ===== 标准合规报表内容 ===== -->
          <template v-if="!activeCustomReport">
            <div class="report-section">
              <h2>一、合规概览</h2>
              <div class="overview-grid">
                <div class="overview-item">
                  <span class="overview-value">{{ complianceStats.compliant }}</span>
                  <span class="overview-label">合规项</span>
                </div>
                <div class="overview-item">
                  <span class="overview-value">{{ complianceStats.total }}</span>
                  <span class="overview-label">检查项</span>
                </div>
                <div class="overview-item">
                  <span class="overview-value">{{ stats.complianceRate }}%</span>
                  <span class="overview-label">合规率</span>
                </div>
              </div>
            </div>

            <!-- 二、合规明细 -->
            <div class="report-section">
              <h2>二、合规明细</h2>
              <ExamTable
                :data="complianceItemsWithStatus"
                :columns="complianceColumns"
                :showHeader="false"
                :searchable="false"
                :showPagination="false"
                :showRefresh="false"
                :actionWidth="120"
              >
                <template #status="{ row }">
                  <span :class="['status-badge', row.status]">{{ row.statusText }}</span>
                </template>
              </ExamTable>
            </div>

            <!-- 三、预警事项 -->
            <div class="report-section">
              <h2>三、预警事项</h2>
              <ExamTable
                v-if="alerts.length > 0"
                :data="alerts"
                :columns="alertColumns"
                :showHeader="false"
                :searchable="false"
                :showPagination="false"
                :showRefresh="false"
                :actionWidth="80"
              >
                <template #level="{ row }">
                  <div class="alert-icon" :class="row.level">
                    <el-icon><Warning /></el-icon>
                  </div>
                </template>
                <template #content="{ row }">
                  <div class="alert-content">
                    <span class="alert-title">{{ row.title }}</span>
                    <span class="alert-desc">{{ row.description }}</span>
                  </div>
                </template>
              </ExamTable>
              <div v-else class="no-alert">
                <span>暂无预警事项</span>
              </div>
            </div>
          </template>

          <!-- ===== 自定义报表内容（主页渲染） ===== -->
          <template v-if="activeCustomReport">
            <!-- 自定义统计卡片 -->
            <div v-if="activeCustomReport.showStats && activeCustomStats.length > 0" class="report-section">
              <h2>数据概览</h2>
              <div class="custom-stats-grid">
                <div v-for="(stat, idx) in activeCustomStats" :key="idx" class="custom-stat-item">
                  <span class="custom-stat-value">{{ stat.value }}</span>
                  <span class="custom-stat-label">{{ stat.label }}</span>
                </div>
              </div>
            </div>

            <!-- 自定义数据表格 -->
            <div v-if="activeCustomReport.showTable && activeCustomData.length > 0" class="report-section">
              <h2>数据明细</h2>
              <ExamTable
                :data="activeCustomData"
                :columns="activeCustomColumns"
                :showHeader="true"
                :searchable="true"
                :showPagination="true"
                :defaultPageSize="10"
                :showRefresh="false"
              />
            </div>

            <!-- 自定义图表 -->
            <div v-if="activeCustomReport.chartType" class="report-section">
              <h2>{{ activeCustomReport.chartTitle || '数据图表' }}</h2>
              <div ref="mainPageCustomChart" class="main-page-custom-chart"></div>
            </div>
          </template>
        </div>
      </div>

      <div class="side-panel">
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">合规趋势</span>
          </div>
          <div ref="trendChart" class="chart"></div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">学分排名 TOP10</span>
          </div>
          <div class="ranking-list">
            <div v-for="(item, index) in creditRanking" :key="index" class="ranking-item">
              <span class="rank-num" :class="{ top3: index < 3 }">{{ index + 1 }}</span>
              <div class="rank-info">
                <span class="rank-name">{{ item.name }}</span>
                <span class="rank-class">{{ item.className }}</span>
              </div>
              <span class="rank-score">{{ item.credit }}</span>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">预警学员（需关注）</span>
            <span class="alert-badge">{{ warningStudents.length }}</span>
          </div>
          <div class="warning-list">
            <div v-for="(item, index) in warningStudents" :key="index" class="warning-item">
              <div class="warning-icon" :class="item.type">
                <el-icon><WarningFilled v-if="item.type === 'login'" /><BottomRight v-else /></el-icon>
              </div>
              <div class="warning-info">
                <span class="warning-name">{{ item.name }}</span>
                <span class="warning-desc">{{ item.reason }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">学习进度热力图</span>
          </div>
          <div ref="heatmapChart" class="chart heatmap-mini"></div>
        </div>
      </div>
    </div>

    <!-- 生成报表弹窗 -->
    <el-dialog v-model="showGenerateDialog" title="生成报表" width="500px">
      <el-form :model="generateForm" label-width="110px">
        <el-form-item label="报表类型" required>
          <el-select v-model="generateForm.type" class="w-full">
            <el-option label="月度合规报告" value="monthly" />
            <el-option label="学期汇总报告" value="term" />
            <el-option label="安全检查报告" value="safety" />
            <el-option label="器材维护报告" value="equipment" />
            <el-option label="课程进度报告" value="progress" />
          </el-select>
        </el-form-item>
        <el-form-item label="统计周期" required>
          <el-select v-model="generateForm.period" class="w-full">
            <el-option label="本月" value="thisMonth" />
            <el-option label="上月" value="lastMonth" />
            <el-option label="本季度" value="thisQuarter" />
            <el-option label="本年度" value="thisYear" />
          </el-select>
        </el-form-item>
        <el-form-item label="包含内容">
          <el-checkbox-group v-model="generateForm.include">
            <el-checkbox label="基础统计" value="basic" />
            <el-checkbox label="详细数据" value="detail" />
            <el-checkbox label="预警分析" value="alert" />
            <el-checkbox label="趋势图表" value="trend" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="说明">
          <el-input type="textarea" v-model="generateForm.note" placeholder="输入报表说明（可选）" :rows="3" />
        </el-form-item>
      </el-form>

      <!-- 已保存的自定义报表 -->
      <div v-if="savedCustomReports.length > 0" class="saved-reports-section">
        <h4 class="section-title">已保存的自定义报表</h4>
        <div class="saved-report-list">
          <div
            v-for="(report, idx) in savedCustomReports"
            :key="idx"
            class="saved-report-item"
            @click="loadCustomReport(report)"
          >
            <div class="saved-report-info">
              <span class="saved-report-name">{{ report.reportName }}</span>
              <span class="saved-report-meta">
                {{ availableDataSources.find(s => s.id === report.dataSource)?.name || report.dataSource }}
                · {{ report.createdAt }}
              </span>
            </div>
            <el-button text size="small" type="primary">加载</el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmGenerate">生成报表</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="showExportDialog" title="导出报表" width="450px">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="导出格式" required>
          <el-select v-model="exportForm.format" class="w-full">
            <el-option label="Excel (.xlsx)" value="excel" />
            <el-option label="PDF" value="pdf" />
            <el-option label="CSV" value="csv" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出范围">
          <el-radio-group v-model="exportForm.range">
            <el-radio label="全部报表" value="all" />
            <el-radio label="当前报表" value="current" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="文件命名">
          <el-input v-model="exportForm.filename" placeholder="自定义文件名（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">确认导出</el-button>
      </template>
    </el-dialog>

    <!-- 教育部标准报表导出弹窗 -->
    <el-dialog v-model="showMinistryDialog" title="教育部标准报表导出" width="500px">
      <div class="ministry-report-list">
        <div class="report-option" v-for="(report, index) in ministryReports" :key="index" @click="selectMinistryReport(report)">
          <div class="report-radio">
            <el-radio v-model="selectedMinistryReport" :value="report.id" />
          </div>
          <div class="report-info">
            <span class="report-name">{{ report.name }}</span>
            <span class="report-desc">{{ report.description }}</span>
          </div>
          <div class="report-format">
            <span class="format-tag">Excel</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showMinistryDialog = false">取消</el-button>
        <el-button type="primary" @click="exportMinistrySelected">导出报表</el-button>
      </template>
    </el-dialog>

    <!-- 自定义报表构建器弹窗 -->
    <el-dialog v-model="showCustomBuilderDialog" title="自定义报表构建器" width="850px" top="5vh">
      <el-tabs v-model="customBuilderTab" class="custom-builder-tabs">
        <el-tab-pane label="数据源选择" name="dataSource">
          <div class="builder-section">
            <h4 class="section-title">选择数据源</h4>
            <div class="data-source-grid">
              <div 
                v-for="source in availableDataSources" 
                :key="source.id"
                :class="['source-card', { selected: customReportConfig.dataSource === source.id }]"
                @click="customReportConfig.dataSource = source.id"
              >
                <div class="source-icon">{{ source.icon }}</div>
                <div class="source-info">
                  <span class="source-name">{{ source.name }}</span>
                  <span class="source-desc">{{ source.description }}</span>
                </div>
                <el-radio v-model="customReportConfig.dataSource" :value="source.id" />
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="字段配置" name="fields">
          <div class="builder-section">
            <h4 class="section-title">可用字段</h4>
            <div class="fields-grid">
              <div 
                v-for="field in availableFields" 
                :key="field.id"
                :class="['field-card', { selected: customReportConfig.fields.includes(field.id) }]"
                @click="toggleField(field.id)"
              >
                <el-checkbox :model-value="customReportConfig.fields.includes(field.id)" />
                <span class="field-name">{{ field.name }}</span>
                <span class="field-type">{{ field.type }}</span>
              </div>
            </div>
          </div>
          <div class="builder-section" v-if="customReportConfig.fields.length > 0">
            <h4 class="section-title">字段排序</h4>
            <div class="fields-order">
              <div v-for="(fieldId, idx) in customReportConfig.fields" :key="fieldId" class="order-item">
                <span class="order-num">{{ idx + 1 }}</span>
                <span class="order-name">{{ getFieldName(fieldId) }}</span>
                <el-button text size="small" @click="removeField(fieldId)">移除</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="图表设置" name="chart">
          <div class="builder-section">
            <h4 class="section-title">图表类型</h4>
            <div class="chart-type-grid">
              <div 
                v-for="chart in availableChartTypes" 
                :key="chart.id"
                :class="['chart-type-card', { selected: customReportConfig.chartType === chart.id }]"
                @click="customReportConfig.chartType = chart.id"
              >
                <div class="chart-icon">{{ chart.icon }}</div>
                <span class="chart-name">{{ chart.name }}</span>
              </div>
            </div>
          </div>
          <div class="builder-section">
            <h4 class="section-title">图表参数</h4>
            <el-form :model="customReportConfig" label-width="120px">
              <el-form-item label="图表标题">
                <el-input v-model="customReportConfig.chartTitle" placeholder="输入图表标题" />
              </el-form-item>
              <el-form-item label="X轴字段">
                <el-select v-model="customReportConfig.xAxisField" placeholder="选择X轴字段" class="w-full">
                  <el-option v-for="f in selectedFieldOptions" :key="f.id" :label="f.name" :value="f.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="Y轴字段">
                <el-select v-model="customReportConfig.yAxisField" placeholder="选择Y轴字段" class="w-full">
                  <el-option v-for="f in selectedFieldOptions" :key="f.id" :label="f.name" :value="f.id" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        <el-tab-pane label="报表设置" name="settings">
          <div class="builder-section">
            <h4 class="section-title">报表基本信息</h4>
            <el-form :model="customReportConfig" label-width="100px">
              <el-form-item label="报表名称" required>
                <el-input v-model="customReportConfig.reportName" placeholder="输入报表名称" />
              </el-form-item>
              <el-form-item label="报表描述">
                <el-input type="textarea" v-model="customReportConfig.reportDescription" placeholder="输入报表描述" :rows="3" />
              </el-form-item>
              <el-form-item label="显示统计卡片">
                <el-switch v-model="customReportConfig.showStats" />
              </el-form-item>
              <el-form-item label="显示数据表格">
                <el-switch v-model="customReportConfig.showTable" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        <el-tab-pane label="预览" name="preview">
          <div class="preview-section">
            <div class="preview-header">
              <h3>{{ customReportConfig.reportName || '自定义报表预览' }}</h3>
              <span class="preview-date">生成时间：{{ new Date().toLocaleString('zh-CN') }}</span>
            </div>
            <div v-if="customReportConfig.showStats" class="preview-stats">
              <div class="preview-stat-item" v-for="(stat, idx) in customPreviewStats" :key="idx">
                <span class="preview-stat-num">{{ stat.value }}</span>
                <span class="preview-stat-label">{{ stat.label }}</span>
              </div>
            </div>
            <div v-if="customReportConfig.showTable" class="preview-table">
              <ExamTable
                :data="customPreviewData"
                :columns="customPreviewColumns"
                :showHeader="true"
                :searchable="false"
                :showPagination="true"
                :defaultPageSize="10"
                :showRefresh="false"
              />
            </div>
            <div v-if="customReportConfig.chartType" class="preview-chart">
              <div ref="customPreviewChart" class="chart"></div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="resetCustomBuilder">重置</el-button>
        <el-button @click="saveCustomReport">保存报表</el-button>
        <el-button type="primary" @click="applyCustomReport">应用报表</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Download, Refresh, Document, Grid, Warning, Folder, WarningFilled, BottomRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import echarts from '@/utils/echarts'
import * as XLSX from 'xlsx'
import ExamTable from '../../../components/table/ExamTable.vue'
import store from '../../../store/global'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { useOperationLog } from '@/composables/useOperationLog'

const { addLog } = useOperationLog('data')

const GRADE_NAMES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']

// 确定性伪随机数生成器（基于种子，保证同校同数据源每次结果一致）
const seededRandom = (seed) => {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// 根据学校和数据源生成确定性种子
const getDeterministicSeed = (source, rowIdx) => {
  const schoolSeed = schoolId.value === 'hailin-zirong-primary' ? 317 : schoolId.value === 'linhai-experimental-primary' ? 612 : 1309
  const sourceSeed = { students: 100, testResults: 200, exercise: 300, courses: 400, equipment: 500, attendance: 600 }
  return schoolSeed * 1000 + (sourceSeed[source] || 0) + rowIdx * 37 + 7
}

// 生成确定性ID（基于输入字符串的简单哈希）
const generateDeterministicId = (prefix, name) => {
  let hash = 0
  const str = prefix + '_' + name + '_' + schoolId.value
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash // 转32位整数
  }
  return `${prefix}_${Math.abs(hash).toString(36)}`
}

const reportType = ref('monthly')
const reportPeriod = ref('thisMonth')
const exportFormat = ref('excel')
const showGenerateDialog = ref(false)
const showExportDialog = ref(false)
const showMinistryDialog = ref(false)
const selectedMinistryReport = ref('')

const trendChart = ref(null)
const heatmapChart = ref(null)
let trendChartInstance = null
let heatmapChartInstance = null

// ===== 自定义报表构建器 =====
const showCustomBuilderDialog = ref(false)
const customBuilderTab = ref('dataSource')
const customPreviewChart = ref(null)
let customPreviewChartInstance = null

// 可用数据源
const availableDataSources = [
  { id: 'students', name: '学生数据', description: '学生基本信息、成绩、学分等', icon: '👥' },
  { id: 'testResults', name: '考试成绩', description: '体育考试、国家体测成绩数据', icon: '📊' },
  { id: 'exercise', name: '运动记录', description: '学生运动次数、时长、项目等', icon: '🏃' },
  { id: 'courses', name: '课程数据', description: '课程进度、课堂活跃度等', icon: '📚' },
  { id: 'equipment', name: '器材数据', description: '器材使用、维护、完好率等', icon: '⚽' },
  { id: 'attendance', name: '考勤数据', description: '学生出勤、请假等记录', icon: '✅' }
]

// 可用字段（根据数据源动态变化）
const fieldsBySource = {
  students: [
    { id: 'name', name: '姓名', type: '文本' },
    { id: 'className', name: '班级', type: '文本' },
    { id: 'grade', name: '年级', type: '文本' },
    { id: 'gender', name: '性别', type: '文本' },
    { id: 'credit', name: '学分', type: '数字' },
    { id: 'avgScore', name: '平均成绩', type: '数字' },
    { id: 'passCount', name: '达标次数', type: '数字' }
  ],
  testResults: [
    { id: 'name', name: '姓名', type: '文本' },
    { id: 'className', name: '班级', type: '文本' },
    { id: 'project', name: '项目', type: '文本' },
    { id: 'score', name: '成绩', type: '数字' },
    { id: 'level', name: '等级', type: '文本' },
    { id: 'testDate', name: '测试日期', type: '日期' },
    { id: 'improvement', name: '提升幅度', type: '数字' }
  ],
  exercise: [
    { id: 'name', name: '姓名', type: '文本' },
    { id: 'className', name: '班级', type: '文本' },
    { id: 'project', name: '项目', type: '文本' },
    { id: 'count', name: '运动次数', type: '数字' },
    { id: 'duration', name: '运动时长(分钟)', type: '数字' },
    { id: 'latestDate', name: '最近运动日期', type: '日期' },
    { id: 'calories', name: '消耗卡路里', type: '数字' }
  ],
  courses: [
    { id: 'className', name: '班级', type: '文本' },
    { id: 'courseName', name: '课程名称', type: '文本' },
    { id: 'progress', name: '完成进度(%)', type: '数字' },
    { id: 'activityRate', name: '课堂活跃度', type: '数字' },
    { id: 'teacher', name: '授课教师', type: '文本' },
    { id: 'studentCount', name: '参与人数', type: '数字' }
  ],
  equipment: [
    { id: 'name', name: '器材名称', type: '文本' },
    { id: 'category', name: '分类', type: '文本' },
    { id: 'status', name: '状态', type: '文本' },
    { id: 'usageRate', name: '使用率(%)', type: '数字' },
    { id: 'intactRate', name: '完好率(%)', type: '数字' },
    { id: 'lastMaintain', name: '上次维护日期', type: '日期' },
    { id: 'totalCount', name: '总数', type: '数字' }
  ],
  attendance: [
    { id: 'name', name: '姓名', type: '文本' },
    { id: 'className', name: '班级', type: '文本' },
    { id: 'attendanceRate', name: '出勤率(%)', type: '数字' },
    { id: 'leaveCount', name: '请假次数', type: '数字' },
    { id: 'lateCount', name: '迟到次数', type: '数字' },
    { id: 'absentCount', name: '缺勤次数', type: '数字' },
    { id: 'recentDate', name: '最近出勤日期', type: '日期' }
  ]
}

// 可用图表类型
const availableChartTypes = [
  { id: 'line', name: '折线图', icon: '📈' },
  { id: 'bar', name: '柱状图', icon: '📊' },
  { id: 'pie', name: '饼图', icon: '🥧' },
  { id: 'area', name: '面积图', icon: '📉' },
  { id: 'heatmap', name: '热力图', icon: '🔥' },
  { id: 'scatter', name: '散点图', icon: '⚪' }
]

// 自定义报表配置
const customReportConfig = ref({
  reportName: '',
  reportDescription: '',
  dataSource: '',
  fields: [],
  chartType: 'line',
  chartTitle: '',
  xAxisField: '',
  yAxisField: '',
  showStats: true,
  showTable: true
})

// 当前应用到主页的自定义报表（null表示显示标准报表）
const activeCustomReport = ref(null)
// 主页自定义报表的图表容器和实例
const mainPageCustomChart = ref(null)
let mainPageCustomChartInstance = null

// 可用字段（根据选中的数据源）
const availableFields = computed(() => {
  return fieldsBySource[customReportConfig.value.dataSource] || []
})

// 已选字段选项（用于图表配置）
const selectedFieldOptions = computed(() => {
  return customReportConfig.value.fields.map(id => {
    const field = availableFields.value.find(f => f.id === id)
    return field ? { id: field.id, name: field.name } : { id, name: id }
  })
})

// 获取字段名称
const getFieldName = (fieldId) => {
  const field = availableFields.value.find(f => f.id === fieldId)
  return field ? field.name : fieldId
}

// 切换字段选择
const toggleField = (fieldId) => {
  const idx = customReportConfig.value.fields.indexOf(fieldId)
  if (idx > -1) {
    customReportConfig.value.fields.splice(idx, 1)
  } else {
    customReportConfig.value.fields.push(fieldId)
  }
}

// 移除字段
const removeField = (fieldId) => {
  const idx = customReportConfig.value.fields.indexOf(fieldId)
  if (idx > -1) {
    customReportConfig.value.fields.splice(idx, 1)
  }
}

// 自定义报表预览统计数据（三校独立差异）
const customPreviewStats = computed(() => {
  const source = customReportConfig.value.dataSource
  if (!source) return []
  
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  
  const schoolData = {
    zirong: {
      students: [
        { label: '学生总数', value: 503 },
        { label: '平均学分', value: 128 },
        { label: '预警人数', value: 18 },
        { label: '达标率', value: '90%' }
      ],
      testResults: [
        { label: '测试记录数', value: 892 },
        { label: '优秀率', value: '32%' },
        { label: '良好率', value: '42%' },
        { label: '达标率', value: '88%' }
      ],
      exercise: [
        { label: '运动人次', value: 3256 },
        { label: '本月运动', value: '3256人次' },
        { label: '人均次数', value: '6.5次' },
        { label: '活跃度', value: '85%' }
      ],
      courses: [
        { label: '课程总数', value: 320 },
        { label: '完成率', value: '82.3%' },
        { label: '活跃度', value: '88%' },
        { label: '教师数', value: 16 }
      ],
      equipment: [
        { label: '器材总数', value: 218 },
        { label: '完好率', value: '92%' },
        { label: '使用率', value: '76%' },
        { label: '待维护', value: '12件' }
      ],
      attendance: [
        { label: '应到人数', value: 503 },
        { label: '出勤率', value: '94%' },
        { label: '请假人次', value: '8' },
        { label: '缺勤人次', value: '2' }
      ]
    },
    linhai: {
      students: [
        { label: '学生总数', value: 612 },
        { label: '平均学分', value: 140 },
        { label: '预警人数', value: 12 },
        { label: '达标率', value: '95%' }
      ],
      testResults: [
        { label: '测试记录数', value: 1120 },
        { label: '优秀率', value: '42%' },
        { label: '良好率', value: '48%' },
        { label: '达标率', value: '93%' }
      ],
      exercise: [
        { label: '运动人次', value: 5280 },
        { label: '本月运动', value: '5280人次' },
        { label: '人均次数', value: '8.6次' },
        { label: '活跃度', value: '94%' }
      ],
      courses: [
        { label: '课程总数', value: 410 },
        { label: '完成率', value: '91.5%' },
        { label: '活跃度', value: '96%' },
        { label: '教师数', value: 22 }
      ],
      equipment: [
        { label: '器材总数', value: 286 },
        { label: '完好率', value: '97%' },
        { label: '使用率', value: '88%' },
        { label: '待维护', value: '6件' }
      ],
      attendance: [
        { label: '应到人数', value: 612 },
        { label: '出勤率', value: '98%' },
        { label: '请假人次', value: '5' },
        { label: '缺勤人次', value: '1' }
      ]
    },
    default: {
      students: [
        { label: '学生总数', value: 1309 },
        { label: '平均学分', value: 156 },
        { label: '预警人数', value: 25 },
        { label: '达标率', value: '93%' }
      ],
      testResults: [
        { label: '测试记录数', value: 2356 },
        { label: '优秀率', value: '36%' },
        { label: '良好率', value: '46%' },
        { label: '达标率', value: '91%' }
      ],
      exercise: [
        { label: '运动人次', value: 8650 },
        { label: '本月运动', value: '8650人次' },
        { label: '人均次数', value: '6.6次' },
        { label: '活跃度', value: '92%' }
      ],
      courses: [
        { label: '课程总数', value: 520 },
        { label: '完成率', value: '86.5%' },
        { label: '活跃度', value: '92%' },
        { label: '教师数', value: 28 }
      ],
      equipment: [
        { label: '器材总数', value: 386 },
        { label: '完好率', value: '95%' },
        { label: '使用率', value: '82%' },
        { label: '待维护', value: '16件' }
      ],
      attendance: [
        { label: '应到人数', value: 1309 },
        { label: '出勤率', value: '97%' },
        { label: '请假人次', value: '12' },
        { label: '缺勤人次', value: '3' }
      ]
    }
  }
  
  const data = isZirong ? schoolData.zirong : isLinhai ? schoolData.linhai : schoolData.default
  return data[source] || []
})

// 自定义报表预览数据（三校独立差异）
const customPreviewData = computed(() => {
  const source = customReportConfig.value.dataSource
  const fields = customReportConfig.value.fields
  
  if (!source || fields.length === 0) return []
  
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  
  const schoolConfig = isZirong ? {
    namePool: ['马文博', '李思蕊', '张宇轩', '王雅琴', '赵子豪', '刘欣怡', '孙浩宇', '周雨彤', '吴俊杰', '郑晓萌'],
    classPool: ['一年级1班', '一年级2班', '二年级1班', '二年级2班', '三年级1班', '三年级2班'],
    creditBase: 90, creditRange: 40,
    scoreBase: 65, scoreRange: 25,
    activityBase: 75, activityRange: 15
  } : isLinhai ? {
    namePool: ['杨子墨', '朱雨桐', '林浩宇', '徐梦琪', '高天翔', '何诗涵', '罗嘉伟', '韩雨欣', '唐博文', '曹若曦'],
    classPool: ['一年级1班', '一年级2班', '一年级3班', '二年级1班', '二年级2班', '二年级3班'],
    creditBase: 110, creditRange: 45,
    scoreBase: 75, scoreRange: 20,
    activityBase: 85, activityRange: 12
  } : {
    namePool: ['李明轩', '王思涵', '张浩然', '刘雨萱', '陈雨泽', '赵雅琪', '周子涵', '孙博文', '吴佳怡', '郑艺涵'],
    classPool: ['一年级1班', '一年级2班', '二年级1班', '二年级2班', '三年级1班', '三年级2班', '四年级1班'],
    creditBase: 130, creditRange: 50,
    scoreBase: 70, scoreRange: 28,
    activityBase: 80, activityRange: 18
  }
  
  const mockData = []
  
  for (let i = 0; i < 15; i++) {
    const rng = seededRandom(getDeterministicSeed(source, i))
    const row = {}
    fields.forEach(fieldId => {
      switch (fieldId) {
        case 'name': row[fieldId] = schoolConfig.namePool[i % schoolConfig.namePool.length]
          break
        case 'className': row[fieldId] = schoolConfig.classPool[i % schoolConfig.classPool.length]
          break
        case 'grade': row[fieldId] = ['一年级', '二年级', '三年级'][i % 3]
          break
        case 'gender': row[fieldId] = ['男', '女'][i % 2]
          break
        case 'credit': row[fieldId] = schoolConfig.creditBase + Math.floor(rng() * schoolConfig.creditRange)
          break
        case 'avgScore': row[fieldId] = Math.round(schoolConfig.scoreBase + rng() * schoolConfig.scoreRange)
          break
        case 'passCount': row[fieldId] = Math.floor(rng() * (isZirong ? 8 : isLinhai ? 10 : 12))
          break
        case 'project': row[fieldId] = ['50米跑', '跳绳', '立定跳远', '仰卧起坐', '坐位体前屈'][i % 5]
          break
        case 'score': row[fieldId] = Math.round(schoolConfig.scoreBase + rng() * schoolConfig.scoreRange)
          break
        case 'level': row[fieldId] = ['优秀', '良好', '及格', '不及格'][Math.floor(rng() * 4)]
          break
        case 'testDate': row[fieldId] = `2026-0${Math.floor(rng() * 7) + 1}-${Math.floor(rng() * 28) + 1}`
          break
        case 'improvement': row[fieldId] = (rng() * 15).toFixed(1)
          break
        case 'count': row[fieldId] = Math.floor(rng() * (isZirong ? 15 : isLinhai ? 20 : 18)) + 1
          break
        case 'duration': row[fieldId] = Math.floor(rng() * 60) + 10
          break
        case 'latestDate': row[fieldId] = `2026-0${Math.floor(rng() * 7) + 1}-${Math.floor(rng() * 28) + 1}`
          break
        case 'calories': row[fieldId] = Math.floor(rng() * 300) + 50
          break
        case 'courseName': row[fieldId] = isZirong ? ['排球垫球', '足球运球', '跳绳训练'][i % 3] : isLinhai ? ['游泳课程', '体操训练', '武术套路'][i % 3] : ['田径训练', '篮球基础', '立定跳远训练'][i % 3]
          break
        case 'progress': row[fieldId] = Math.round(schoolConfig.activityBase + rng() * schoolConfig.activityRange)
          break
        case 'activityRate': row[fieldId] = Math.round(schoolConfig.activityBase + rng() * schoolConfig.activityRange)
          break
        case 'teacher': row[fieldId] = isZirong ? ['王老师', '李老师'][i % 2] : isLinhai ? ['张老师', '刘老师'][i % 2] : ['陈老师', '赵老师'][i % 2]
          break
        case 'studentCount': row[fieldId] = Math.floor(rng() * (isZirong ? 30 : isLinhai ? 35 : 40)) + 20
          break
        case 'category': row[fieldId] = ['球类', '田径', '体操', '武术'][i % 4]
          break
        case 'status': row[fieldId] = ['完好', '待维护', '维修中', '报废'][Math.floor(rng() * 4)]
          break
        case 'usageRate': row[fieldId] = Math.round((isZirong ? 65 : isLinhai ? 85 : 75) + rng() * 20)
          break
        case 'intactRate': row[fieldId] = Math.round((isZirong ? 88 : isLinhai ? 96 : 92) + rng() * 8)
          break
        case 'lastMaintain': row[fieldId] = `2026-0${Math.floor(rng() * 7) + 1}-${Math.floor(rng() * 28) + 1}`
          break
        case 'totalCount': row[fieldId] = Math.floor(rng() * (isZirong ? 30 : isLinhai ? 40 : 50)) + 5
          break
        case 'attendanceRate': row[fieldId] = Math.round((isZirong ? 92 : isLinhai ? 97 : 95) + rng() * 5)
          break
        case 'leaveCount': row[fieldId] = Math.floor(rng() * (isZirong ? 4 : isLinhai ? 2 : 3))
          break
        case 'lateCount': row[fieldId] = Math.floor(rng() * (isZirong ? 3 : isLinhai ? 1 : 2))
          break
        case 'absentCount': row[fieldId] = Math.floor(rng() * (isZirong ? 2 : isLinhai ? 1 : 1))
          break
        case 'recentDate': row[fieldId] = `2026-0${Math.floor(rng() * 7) + 1}-${Math.floor(rng() * 28) + 1}`
          break
        default: row[fieldId] = `数据${i + 1}`
      }
    })
    mockData.push(row)
  }
  
  return mockData
})

// 自定义报表预览列配置
const customPreviewColumns = computed(() => {
  const fields = customReportConfig.value.fields
  return fields.map(fieldId => ({
    prop: fieldId,
    label: getFieldName(fieldId),
    minWidth: '100'
  }))
})

// 打开自定义报表构建器
const openCustomReportBuilder = () => {
  showCustomBuilderDialog.value = true
}

// 重置自定义报表构建器
const resetCustomBuilder = () => {
  customReportConfig.value = {
    reportName: '',
    reportDescription: '',
    dataSource: '',
    fields: [],
    chartType: 'line',
    chartTitle: '',
    xAxisField: '',
    yAxisField: '',
    showStats: true,
    showTable: true
  }
  customBuilderTab.value = 'dataSource'
}

// 学校ID（提前定义）
const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// 保存自定义报表
const savedCustomReports = usePersistedRef(computed(() => `smart_pe_custom_reports_${schoolId.value}`), [])

const saveCustomReport = () => {
  if (!customReportConfig.value.reportName) {
    ElMessage.warning('请输入报表名称')
    return
  }
  if (!customReportConfig.value.dataSource) {
    ElMessage.warning('请选择数据源')
    return
  }
  
  const newReport = {
    id: generateDeterministicId('custom_report', customReportConfig.value.reportName),
    ...{ ...customReportConfig.value },
    createdAt: new Date().toLocaleString('zh-CN')
  }
  
  savedCustomReports.value.unshift(newReport)
  ElMessage.success('自定义报表已保存')
}

// 应用自定义报表
const applyCustomReport = () => {
  if (!customReportConfig.value.reportName) {
    ElMessage.warning('请输入报表名称')
    return
  }
  if (!customReportConfig.value.dataSource) {
    ElMessage.warning('请选择数据源')
    return
  }
  
  // 深拷贝配置到 activeCustomReport，主页将渲染此报表
  activeCustomReport.value = JSON.parse(JSON.stringify(customReportConfig.value))
  reportTitle.value = customReportConfig.value.reportName
  statsBase.value = { ...statsBase.value, totalReports: statsBase.value.totalReports + 1 }
  
  ElMessage.success(`自定义报表「${customReportConfig.value.reportName}」已应用`)
  showCustomBuilderDialog.value = false
  
  // 延迟渲染主页自定义图表
  setTimeout(() => renderMainPageCustomChart(), 300)
}

// 从已保存报表列表中加载
const loadCustomReport = (report) => {
  customReportConfig.value = JSON.parse(JSON.stringify(report))
  activeCustomReport.value = JSON.parse(JSON.stringify(report))
  reportTitle.value = report.reportName
  statsBase.value = { ...statsBase.value, totalReports: statsBase.value.totalReports + 1 }
  ElMessage.success(`已加载自定义报表「${report.reportName}」`)
  showGenerateDialog.value = false
  setTimeout(() => renderMainPageCustomChart(), 300)
}

// 返回标准报表视图
const backToStandardReport = () => {
  activeCustomReport.value = null
  reportTitle.value = reportTitleMap[reportType.value] || '合规报告'
  // 清除主页自定义图表实例
  if (mainPageCustomChartInstance) {
    mainPageCustomChartInstance.dispose()
    mainPageCustomChartInstance = null
  }
  // 恢复标准报表数据
  updateDataForSelection()
  ElMessage.info('已返回标准合规报表')
}

// 渲染主页自定义报表图表
const renderMainPageCustomChart = () => {
  if (!mainPageCustomChart.value || !activeCustomReport.value) {
    if (mainPageCustomChartInstance) {
      mainPageCustomChartInstance.dispose()
      mainPageCustomChartInstance = null
    }
    return
  }
  const el = mainPageCustomChart.value
  if (el.clientWidth === 0 || el.clientHeight === 0) return
  if (mainPageCustomChartInstance) mainPageCustomChartInstance.dispose()
  
  mainPageCustomChartInstance = echarts.init(el)
  
  const config = activeCustomReport.value
  const chartType = config.chartType
  const xAxisField = config.xAxisField
  const yAxisField = config.yAxisField
  
  if (!xAxisField || !yAxisField) {
    mainPageCustomChartInstance.dispose()
    mainPageCustomChartInstance = null
    return
  }
  
  // 使用 activeCustomReport 的配置生成数据
  const savedConfig = customReportConfig.value
  customReportConfig.value = { ...config }
  const data = customPreviewData.value
  customReportConfig.value = savedConfig
  
  const xData = data.map(d => String(d[xAxisField]))
  const yData = data.map(d => parseFloat(d[yAxisField]) || 0)
  const chartTitle = config.chartTitle || config.reportName || '数据图表'
  
  const sourceName = availableDataSources.find(s => s.id === config.dataSource)?.name || ''
  
  let option = {}
  
  if (chartType === 'pie') {
    const pieData = data.slice(0, 8).map(d => ({
      name: String(d[xAxisField]),
      value: parseFloat(d[yAxisField]) || 0
    }))
    option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'horizontal', bottom: 10 },
      title: { text: chartTitle, subtext: sourceName, left: 'center', top: 10 },
      series: [{ type: 'pie', radius: ['35%', '65%'], data: pieData, label: { fontSize: 11 } }]
    }
  } else if (chartType === 'heatmap') {
    const heatmapData = data.slice(0, 20).map((d, i) => [
      i % 5, Math.floor(i / 5), parseFloat(d[yAxisField]) || 0
    ])
    option = {
      tooltip: { position: 'top' },
      grid: { top: 50, right: 60, bottom: 30, left: 50 },
      title: { text: chartTitle, subtext: sourceName, left: 'center', top: 10 },
      xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E'] },
      yAxis: { type: 'category', data: ['1', '2', '3', '4'] },
      visualMap: { min: Math.min(...yData), max: Math.max(...yData), calculable: true, orient: 'vertical', right: 10 },
      series: [{ type: 'heatmap', data: heatmapData }]
    }
  } else {
    const seriesMap = {
      line: { type: 'line', smooth: true, symbol: 'circle', symbolSize: 6 },
      bar: { type: 'bar', barWidth: '50%' },
      area: { type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, symbol: 'circle' },
      scatter: { type: 'scatter', symbolSize: 10 }
    }
    const seriesConfig = seriesMap[chartType] || seriesMap.line
    option = {
      tooltip: { trigger: 'axis' },
      grid: { top: 50, right: 20, bottom: 40, left: 50 },
      title: { text: chartTitle, subtext: sourceName, left: 'center', top: 10 },
      xAxis: { type: 'category', data: xData, axisLabel: { rotate: 30, fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
      series: [{ ...seriesConfig, data: yData, name: getFieldName(yAxisField) }]
    }
  }
  
  mainPageCustomChartInstance.setOption(option)
  mainPageCustomChartInstance.resize()
}
const activeCustomData = computed(() => {
  const config = activeCustomReport.value
  if (!config || !config.dataSource || config.fields.length === 0) return []
  
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const source = config.dataSource
  const fields = config.fields
  
  const schoolConfig = isZirong ? {
    namePool: ['马文博', '李思蕊', '张宇轩', '王雅琴', '赵子豪', '刘欣怡', '孙浩宇', '周雨彤', '吴俊杰', '郑晓萌'],
    classPool: ['一年级1班', '一年级2班', '二年级1班', '二年级2班', '三年级1班', '三年级2班'],
    creditBase: 90, creditRange: 40, scoreBase: 65, scoreRange: 25, activityBase: 75, activityRange: 15
  } : isLinhai ? {
    namePool: ['杨子墨', '朱雨桐', '林浩宇', '徐梦琪', '高天翔', '何诗涵', '罗嘉伟', '韩雨欣', '唐博文', '曹若曦'],
    classPool: ['一年级1班', '一年级2班', '一年级3班', '二年级1班', '二年级2班', '二年级3班'],
    creditBase: 110, creditRange: 45, scoreBase: 75, scoreRange: 20, activityBase: 85, activityRange: 12
  } : {
    namePool: ['李明轩', '王思涵', '张浩然', '刘雨萱', '陈雨泽', '赵雅琪', '周子涵', '孙博文', '吴佳怡', '郑艺涵'],
    classPool: ['一年级1班', '一年级2班', '二年级1班', '二年级2班', '三年级1班', '三年级2班', '四年级1班'],
    creditBase: 130, creditRange: 50, scoreBase: 70, scoreRange: 28, activityBase: 80, activityRange: 18
  }
  
  const mockData = []
  for (let i = 0; i < 15; i++) {
    const rng = seededRandom(getDeterministicSeed(source, i))
    const row = {}
    fields.forEach(fieldId => {
      switch (fieldId) {
        case 'name': row[fieldId] = schoolConfig.namePool[i % schoolConfig.namePool.length]; break
        case 'className': row[fieldId] = schoolConfig.classPool[i % schoolConfig.classPool.length]; break
        case 'grade': row[fieldId] = ['一年级', '二年级', '三年级'][i % 3]; break
        case 'gender': row[fieldId] = ['男', '女'][i % 2]; break
        case 'credit': row[fieldId] = schoolConfig.creditBase + Math.floor(rng() * schoolConfig.creditRange); break
        case 'avgScore': row[fieldId] = Math.round(schoolConfig.scoreBase + rng() * schoolConfig.scoreRange); break
        case 'passCount': row[fieldId] = Math.floor(rng() * (isZirong ? 8 : isLinhai ? 10 : 12)); break
        case 'project': row[fieldId] = ['50米跑', '跳绳', '立定跳远', '仰卧起坐', '坐位体前屈'][i % 5]; break
        case 'score': row[fieldId] = Math.round(schoolConfig.scoreBase + rng() * schoolConfig.scoreRange); break
        case 'level': row[fieldId] = ['优秀', '良好', '及格', '不及格'][Math.floor(rng() * 4)]; break
        case 'testDate': row[fieldId] = `2026-0${Math.floor(rng() * 7) + 1}-${Math.floor(rng() * 28) + 1}`; break
        case 'improvement': row[fieldId] = (rng() * 15).toFixed(1); break
        case 'count': row[fieldId] = Math.floor(rng() * (isZirong ? 15 : isLinhai ? 20 : 18)) + 1; break
        case 'duration': row[fieldId] = Math.floor(rng() * 60) + 10; break
        case 'latestDate': row[fieldId] = `2026-0${Math.floor(rng() * 7) + 1}-${Math.floor(rng() * 28) + 1}`; break
        case 'calories': row[fieldId] = Math.floor(rng() * 300) + 50; break
        case 'courseName': row[fieldId] = isZirong ? ['排球垫球', '足球运球', '跳绳训练'][i % 3] : isLinhai ? ['游泳课程', '体操训练', '武术套路'][i % 3] : ['田径训练', '篮球基础', '立定跳远训练'][i % 3]; break
        case 'progress': row[fieldId] = Math.round(schoolConfig.activityBase + rng() * schoolConfig.activityRange); break
        case 'activityRate': row[fieldId] = Math.round(schoolConfig.activityBase + rng() * schoolConfig.activityRange); break
        case 'teacher': row[fieldId] = isZirong ? ['王老师', '李老师'][i % 2] : isLinhai ? ['张老师', '刘老师'][i % 2] : ['陈老师', '赵老师'][i % 2]; break
        case 'studentCount': row[fieldId] = Math.floor(rng() * (isZirong ? 30 : isLinhai ? 35 : 40)) + 20; break
        case 'category': row[fieldId] = ['球类', '田径', '体操', '武术'][i % 4]; break
        case 'status': row[fieldId] = ['完好', '待维护', '维修中', '报废'][Math.floor(rng() * 4)]; break
        case 'usageRate': row[fieldId] = Math.round((isZirong ? 65 : isLinhai ? 85 : 75) + rng() * 20); break
        case 'intactRate': row[fieldId] = Math.round((isZirong ? 88 : isLinhai ? 96 : 92) + rng() * 8); break
        case 'lastMaintain': row[fieldId] = `2026-0${Math.floor(rng() * 7) + 1}-${Math.floor(rng() * 28) + 1}`; break
        case 'totalCount': row[fieldId] = Math.floor(rng() * (isZirong ? 30 : isLinhai ? 40 : 50)) + 5; break
        case 'attendanceRate': row[fieldId] = Math.round((isZirong ? 92 : isLinhai ? 97 : 95) + rng() * 5); break
        case 'leaveCount': row[fieldId] = Math.floor(rng() * (isZirong ? 4 : isLinhai ? 2 : 3)); break
        case 'lateCount': row[fieldId] = Math.floor(rng() * (isZirong ? 3 : isLinhai ? 1 : 2)); break
        case 'absentCount': row[fieldId] = Math.floor(rng() * (isZirong ? 2 : isLinhai ? 1 : 1)); break
        case 'recentDate': row[fieldId] = `2026-0${Math.floor(rng() * 7) + 1}-${Math.floor(rng() * 28) + 1}`; break
        default: row[fieldId] = `数据${i + 1}`
      }
    })
    mockData.push(row)
  }
  return mockData
})

const activeCustomColumns = computed(() => {
  const config = activeCustomReport.value
  if (!config) return []
  return config.fields.map(fieldId => {
    const field = fieldsBySource[config.dataSource]?.find(f => f.id === fieldId)
    return { prop: fieldId, label: field ? field.name : fieldId, minWidth: '100' }
  })
})

const activeCustomStats = computed(() => {
  const config = activeCustomReport.value
  if (!config || !config.dataSource) return []
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const source = config.dataSource
  
  const data = isZirong ? {
    students: [{ label: '学生总数', value: 503 }, { label: '平均学分', value: 128 }, { label: '预警人数', value: 18 }, { label: '达标率', value: '90%' }],
    testResults: [{ label: '测试记录数', value: 892 }, { label: '优秀率', value: '32%' }, { label: '良好率', value: '42%' }, { label: '达标率', value: '88%' }],
    exercise: [{ label: '运动人次', value: 3256 }, { label: '人均次数', value: '6.5次' }, { label: '活跃度', value: '85%' }, { label: '本月运动', value: '3256人次' }],
    courses: [{ label: '课程总数', value: 320 }, { label: '完成率', value: '82.3%' }, { label: '活跃度', value: '88%' }, { label: '教师数', value: 16 }],
    equipment: [{ label: '器材总数', value: 218 }, { label: '完好率', value: '92%' }, { label: '使用率', value: '76%' }, { label: '待维护', value: '12件' }],
    attendance: [{ label: '应到人数', value: 503 }, { label: '出勤率', value: '94%' }, { label: '请假人次', value: '8' }, { label: '缺勤人次', value: '2' }]
  } : isLinhai ? {
    students: [{ label: '学生总数', value: 612 }, { label: '平均学分', value: 140 }, { label: '预警人数', value: 12 }, { label: '达标率', value: '95%' }],
    testResults: [{ label: '测试记录数', value: 1120 }, { label: '优秀率', value: '42%' }, { label: '良好率', value: '48%' }, { label: '达标率', value: '93%' }],
    exercise: [{ label: '运动人次', value: 5280 }, { label: '人均次数', value: '8.6次' }, { label: '活跃度', value: '94%' }, { label: '本月运动', value: '5280人次' }],
    courses: [{ label: '课程总数', value: 410 }, { label: '完成率', value: '91.5%' }, { label: '活跃度', value: '96%' }, { label: '教师数', value: 22 }],
    equipment: [{ label: '器材总数', value: 286 }, { label: '完好率', value: '97%' }, { label: '使用率', value: '88%' }, { label: '待维护', value: '6件' }],
    attendance: [{ label: '应到人数', value: 612 }, { label: '出勤率', value: '98%' }, { label: '请假人次', value: '5' }, { label: '缺勤人次', value: '1' }]
  } : {
    students: [{ label: '学生总数', value: 1309 }, { label: '平均学分', value: 156 }, { label: '预警人数', value: 25 }, { label: '达标率', value: '93%' }],
    testResults: [{ label: '测试记录数', value: 2356 }, { label: '优秀率', value: '36%' }, { label: '良好率', value: '46%' }, { label: '达标率', value: '91%' }],
    exercise: [{ label: '运动人次', value: 8650 }, { label: '人均次数', value: '6.6次' }, { label: '活跃度', value: '92%' }, { label: '本月运动', value: '8650人次' }],
    courses: [{ label: '课程总数', value: 520 }, { label: '完成率', value: '86.5%' }, { label: '活跃度', value: '92%' }, { label: '教师数', value: 28 }],
    equipment: [{ label: '器材总数', value: 386 }, { label: '完好率', value: '95%' }, { label: '使用率', value: '82%' }, { label: '待维护', value: '16件' }],
    attendance: [{ label: '应到人数', value: 1309 }, { label: '出勤率', value: '97%' }, { label: '请假人次', value: '12' }, { label: '缺勤人次', value: '3' }]
  }
  return data[source] || []
})

// 获取字段名称（支持基于 activeCustomReport 的数据源）
const getFieldNameForSource = (dataSource, fieldId) => {
  const field = fieldsBySource[dataSource]?.find(f => f.id === fieldId)
  return field ? field.name : fieldId
}

// 学分排名TOP10 — 各校不同姓名/班级/学分
const creditRankingDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const classCounts = isZirong ? [2,2,2,2,2,2] : isLinhai ? [4,4,4,3,3,4] : [6,5,5,5,5,5]
  const gradeNames = GRADE_NAMES
  const namePool = isZirong
    ? ['马文博','李思蕊','张宇轩','王雅琴','赵子豪','刘欣怡','孙浩宇','周雨彤','吴俊杰','郑晓萌','钱志远','冯佳慧']
    : isLinhai
    ? ['杨子墨','朱雨桐','林浩宇','徐梦琪','高天翔','何诗涵','罗嘉伟','韩雨欣','唐博文','曹若曦','邓瑞阳','彭心怡']
    : ['李明轩','王思涵','张浩然','刘雨萱','陈雨泽','赵雅琪','周子涵','孙博文','吴佳怡','郑艺涵','冯志远','蒋欣妍']
  const result = []
  const baseCredit = isZirong ? 128 : isLinhai ? 140 : 156
  for (let i = 0; i < 10; i++) {
    const gradeIdx = i % 6
    const classIdx = (i * 3 + 1) % classCounts[gradeIdx]
    result.push({
      name: namePool[i],
      className: `${gradeNames[gradeIdx]}${classIdx + 1}班`,
      credit: baseCredit - i * (isZirong ? 6 : isLinhai ? 7 : 8)
    })
  }
  return result
})
const creditRanking = usePersistedRef(computed(() => `smart_pe_compliance_credit_ranking_${schoolId.value}`), creditRankingDefault.value)

// 预警学员 — 各校不同姓名/班级/原因
const warningStudentsDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  if (isZirong) {
    return [
      { name: '马小辉', className: '三年级1班', type: 'login', reason: '连续5天未登录' },
      { name: '李小梅', className: '四年级2班', type: 'credit', reason: '学分低于均值38%' },
      { name: '张小磊', className: '五年级1班', type: 'login', reason: '连续4天未登录' },
      { name: '刘小芳', className: '三年级2班', type: 'credit', reason: '学分低于均值33%' },
      { name: '赵小军', className: '四年级1班', type: 'login', reason: '连续3天未登录' }
    ]
  }
  if (isLinhai) {
    return [
      { name: '杨小明', className: '三年级3班', type: 'login', reason: '连续6天未登录' },
      { name: '朱小红', className: '四年级2班', type: 'credit', reason: '学分低于均值45%' },
      { name: '林小强', className: '五年级1班', type: 'login', reason: '连续4天未登录' },
      { name: '徐小美', className: '二年级4班', type: 'credit', reason: '学分低于均值36%' },
      { name: '高小华', className: '三年级2班', type: 'login', reason: '连续3天未登录' }
    ]
  }
  return [
    { name: '王小明', className: '三年级2班', type: 'login', reason: '连续5天未登录' },
    { name: '李小红', className: '四年级1班', type: 'credit', reason: '学分低于均值42%' },
    { name: '张小强', className: '五年级3班', type: 'login', reason: '连续4天未登录' },
    { name: '刘小美', className: '三年级1班', type: 'credit', reason: '学分低于均值35%' },
    { name: '陈小华', className: '四年级2班', type: 'login', reason: '连续3天未登录' }
  ]
})
const warningStudents = usePersistedRef(computed(() => `smart_pe_compliance_warning_students_${schoolId.value}`), warningStudentsDefault.value)

// 教育部标准报表
const ministryReports = ref([
  { id: 'credit', name: '学分完成率统计表', description: '教育部标准格式，统计各年级学分完成情况', format: 'excel' },
  { id: 'participation', name: '课程参与度分析报告', description: '分析学生课程参与情况与活跃度', format: 'excel' },
  { id: 'passRate', name: '考试通过率趋势图', description: '历年考试通过率统计与趋势分析', format: 'excel' }
])

const generateForm = ref({
  type: 'monthly',
  period: 'thisMonth',
  include: ['basic', 'detail'],
  note: ''
})

const exportForm = ref({
  format: 'excel',
  range: 'current',
  filename: ''
})

const statsBaseDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? { totalReports: 32, complianceRate: 89, exported: 98, alerts: 4 }
    : isLinhai
    ? { totalReports: 41, complianceRate: 94, exported: 128, alerts: 2 }
    : { totalReports: 48, complianceRate: 92, exported: 156, alerts: 3 }
})
const statsBase = usePersistedRef(computed(() => `smart_pe_compliance_stats_${schoolId.value}`), statsBaseDefault.value)

const stats = computed(() => {
  const cs = complianceStats.value
  const rate = cs.total > 0 ? Math.round(cs.compliant / cs.total * 100) : 0
  return {
    totalReports: statsBase.value.totalReports,
    complianceRate: rate,
    exported: statsBase.value.exported,
    alerts: warningStudents.value.length
  }
})

const schoolName = computed(() => store.state.school.name || '海林市第二小学')
const currentDate = ref('2026/7/16 08:00:00')

const reportTitle = ref('月度合规报告')

const reportPeriodText = computed(() => {
  const periodMap = {
    thisMonth: '本月',
    lastMonth: '上月',
    thisQuarter: '本季度',
    thisYear: '本年度'
  }
  return periodMap[reportPeriod.value] || ''
})

const complianceStatsDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? { compliant: 6, total: 12 }
    : isLinhai
    ? { compliant: 10, total: 12 }
    : { compliant: 11, total: 12 }
})
const complianceStats = usePersistedRef(computed(() => `smart_pe_compliance_compliance_stats_${schoolId.value}`), complianceStatsDefault.value)

const complianceItemsDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? [
        { item: '体育课时达标率', standard: '≥95%', actual: '94%', note: '' },
        { item: '器材定期检查', standard: '每月一次', actual: '每月一次', note: '' },
        { item: '安全教育覆盖率', standard: '100%', actual: '100%', note: '' },
        { item: '场地安全设施', standard: '完好率100%', actual: '92%', note: '足球训练区防护垫需更换' },
        { item: '应急预案完备性', standard: '齐全', actual: '齐全', note: '' },
        { item: '课间操出勤率', standard: '≥90%', actual: '88%', note: '三年级出勤偏低' },
        { item: '体测达标率', standard: '≥85%', actual: '82%', note: '' },
        { item: '教师资质合格率', standard: '100%', actual: '100%', note: '' },
        { item: '应急预案演练完成率', standard: '≥每学期1次', actual: '每学期1次', note: '' },
        { item: '器材维护记录', standard: '完整', actual: '完整', note: '' },
        { item: '课程计划完成率', standard: '≥90%', actual: '87%', note: '排球单元进度滞后' },
        { item: '学生出勤率', standard: '≥95%', actual: '93%', note: '' }
      ]
    : isLinhai
    ? [
        { item: '体育课时达标率', standard: '≥95%', actual: '97%', note: '' },
        { item: '器材定期检查', standard: '每月一次', actual: '每月一次', note: '' },
        { item: '安全教育覆盖率', standard: '100%', actual: '100%', note: '' },
        { item: '场地安全设施', standard: '完好率100%', actual: '96%', note: '体操房部分垫子需更新' },
        { item: '应急预案完备性', standard: '齐全', actual: '齐全', note: '' },
        { item: '课间操出勤率', standard: '≥90%', actual: '92%', note: '' },
        { item: '体测达标率', standard: '≥85%', actual: '89%', note: '' },
        { item: '教师资质合格率', standard: '100%', actual: '100%', note: '' },
        { item: '应急预案演练完成率', standard: '≥每学期1次', actual: '每学期2次', note: '' },
        { item: '器材维护记录', standard: '完整', actual: '完整', note: '' },
        { item: '课程计划完成率', standard: '≥90%', actual: '93%', note: '' },
        { item: '学生出勤率', standard: '≥95%', actual: '96%', note: '' }
      ]
    : [
        { item: '体育课时达标率', standard: '≥95%', actual: '98%', note: '' },
        { item: '器材定期检查', standard: '每月一次', actual: '每月一次', note: '' },
        { item: '安全教育覆盖率', standard: '100%', actual: '100%', note: '' },
        { item: '场地安全设施', standard: '完好率100%', actual: '95%', note: '部分防护垫需更换' },
        { item: '应急预案完备性', standard: '齐全', actual: '齐全', note: '' },
        { item: '课间操出勤率', standard: '≥90%', actual: '94%', note: '' },
        { item: '体测达标率', standard: '≥85%', actual: '91%', note: '' },
        { item: '教师资质合格率', standard: '100%', actual: '100%', note: '' },
        { item: '应急预案演练完成率', standard: '≥每学期1次', actual: '每学期2次', note: '' },
        { item: '器材维护记录', standard: '完整', actual: '完整', note: '' },
        { item: '课程计划完成率', standard: '≥90%', actual: '95%', note: '' },
        { item: '学生出勤率', standard: '≥95%', actual: '97%', note: '' }
      ]
})
const complianceItems = usePersistedRef(computed(() => `smart_pe_compliance_items_${schoolId.value}`), [...complianceItemsDefault.value])

const checkCompliance = (standard, actual, note) => {
  // 解析标准中的数值阈值，如 "≥95%"、"100%"、"完好率100%"
  const thresholdMatch = standard.match(/([≥≤><]=?)(\d+(?:\.\d+)?)%?/)
  if (thresholdMatch) {
    const operator = thresholdMatch[1]
    const threshold = parseFloat(thresholdMatch[2])
    const actualValue = parseFloat(actual)
    if (isNaN(actualValue)) return note ? { status: 'warning', statusText: '待整改' } : { status: 'compliant', statusText: '合规' }
    let pass = false
    switch (operator) {
      case '≥': pass = actualValue >= threshold; break
      case '<=': pass = actualValue <= threshold; break
      case '>': pass = actualValue > threshold; break
      case '<': pass = actualValue < threshold; break
      default: pass = actualValue >= threshold
    }
    if (!pass) return { status: 'warning', statusText: '待整改' }
  } else {
    // 文本比较（如 "每月一次"、"齐全"）
    const stdText = standard.replace(/完好率|达标率|覆盖率/g, '').trim()
    const actText = actual.trim()
    if (stdText !== actText && !actText.includes(stdText)) {
      return { status: 'warning', statusText: '待整改' }
    }
  }
  // 有备注但达标 → 标记为待整改（需关注备注内容）
  if (note) return { status: 'warning', statusText: '待整改' }
  return { status: 'compliant', statusText: '合规' }
}

const complianceItemsWithStatus = computed(() => {
  return complianceItems.value.map(item => {
    const { status, statusText } = checkCompliance(item.standard, item.actual, item.note)
    return { ...item, status, statusText }
  })
})

const complianceColumns = ref([
  { prop: 'item', label: '检查项目', minWidth: '130' },
  { prop: 'standard', label: '标准要求', minWidth: '100' },
  { prop: 'actual', label: '实际情况', minWidth: '100' },
  { prop: 'status', label: '状态', slot: 'status', minWidth: '80' },
  { prop: 'note', label: '备注', minWidth: '120' }
])

const alertsDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  if (isZirong) {
    return [
      { level: 'high', title: '五年级1班达标率低于60%', description: '需重点关注并制定提升计划', time: '10分钟前' },
      { level: 'high', title: '体测达标率低于85%标准', description: '全校体测达标率仅82%，低于教育部要求', time: '15分钟前' },
      { level: 'medium', title: '排球垫球设备异常', description: '操场B区设备连接中断', time: '30分钟前' },
      { level: 'medium', title: '课间操三年级出勤偏低', description: '三年级课间操出勤率仅88%，低于90%标准', time: '40分钟前' },
      { level: 'low', title: '足球训练器材磨损', description: '部分足球运球器材已使用超过4年，建议更换', time: '1小时前' },
      { level: 'medium', title: '课程计划排球单元进度滞后', description: '排球教学单元完成率仅87%，落后于学期计划', time: '1小时前' },
      { level: 'medium', title: '器材年检即将到期', description: '部分器材年检时间即将到期，请安排检测', time: '2小时前' },
      { level: 'low', title: '学生出勤率偏低', description: '全校学生出勤率93%，低于95%标准', time: '3小时前' }
    ]
  }
  if (isLinhai) {
    return [
      { level: 'high', title: '四年级3班达标率低于58%', description: '需重点关注并制定提升计划', time: '15分钟前' },
      { level: 'medium', title: '游泳馆设备异常', description: '泳池计时设备连接中断', time: '45分钟前' },
      { level: 'low', title: '体操垫老化', description: '体操训练部分防护垫已使用超过6年，建议尽快更换', time: '1小时前' },
      { level: 'medium', title: '场地安全设施需维护', description: '体操房部分垫子需更新，完好率96%未达100%标准', time: '1小时前' },
      { level: 'medium', title: '武术器材年检即将到期', description: '部分武术套路器材年检时间即将到期，请安排检测', time: '3小时前' },
      { level: 'low', title: '游泳课程换气技巧通过率低', description: '游泳课程换气技巧环节通过率偏低，建议增加练习', time: '3小时前' },
      { level: 'low', title: '体操训练平衡木难度偏高', description: '平衡木环节学生完成度较低，建议调整教学方案', time: '4小时前' },
      { level: 'info', title: '健康数据同步完成', description: '本月学生视力检查数据已同步完成', time: '5小时前' }
    ]
  }
  return [
    { level: 'high', title: '四年级2班达标率低于60%', description: '需重点关注并制定提升计划', time: '10分钟前' },
    { level: 'medium', title: '立定跳远设备异常', description: '操场A区设备连接中断', time: '30分钟前' },
    { level: 'low', title: '场地防护垫老化', description: '田径场部分防护垫已使用超过5年，建议尽快更换', time: '1小时前' },
    { level: 'medium', title: '场地安全设施需维护', description: '部分防护垫需更换，完好率95%未达100%标准', time: '1小时前' },
    { level: 'medium', title: '器材年检即将到期', description: '部分器材年检时间即将到期，请安排检测', time: '2小时前' },
    { level: 'low', title: '田径训练起跑技术待提升', description: '部分学生起跑姿势不规范，建议加强专项训练', time: '3小时前' },
    { level: 'low', title: '篮球投篮姿势纠正', description: '低年级学生投篮姿势错误率较高', time: '4小时前' },
    { level: 'info', title: '本学期第二次应急演练完成', description: '全校应急疏散演练已顺利完成，用时3分42秒', time: '5小时前' }
  ]
})
const alerts = usePersistedRef(computed(() => `smart_pe_compliance_alerts_${schoolId.value}`), alertsDefault.value)

const alertColumns = ref([
  { prop: 'level', label: '级别', slot: 'level', minWidth: '50', align: 'center' },
  { prop: 'content', label: '预警内容', slot: 'content', minWidth: '240' },
  { prop: 'time', label: '时间', minWidth: '80', align: 'center' }
])

// ========== 按报表类型生成差异化数据 ==========
const getSchoolTag = () => {
  const id = schoolId.value
  return id === 'hailin-zirong-primary' ? 'zirong' : id === 'linhai-experimental-primary' ? 'linhai' : 'second'
}

// 各报表类型的合规明细
const getComplianceItemsForType = (type) => {
  const tag = getSchoolTag()
  const suffix = tag === 'zirong' ? '（紫荣校区）' : tag === 'linhai' ? '（临海校区）' : ''
  if (type === 'safety') {
    return [
      { item: '场地安全设施完好率', standard: '≥98%', actual: tag === 'second' ? '97%' : tag === 'linhai' ? '98%' : '95%', note: tag === 'zirong' ? '足球区防护垫需更换' : '' },
      { item: '消防器材有效期', standard: '100%在有效期内', actual: '100%在有效期内', note: '' },
      { item: '安全通道畅通率', standard: '100%', actual: '100%', note: '' },
      { item: '应急照明覆盖率', standard: '100%', actual: tag === 'second' ? '100%' : tag === 'linhai' ? '98%' : '96%', note: tag === 'linhai' ? '游泳馆B区应急灯需检修' : tag === 'zirong' ? '教学楼3层应急灯故障' : '' },
      { item: '安全警示标识完备性', standard: '齐全', actual: '齐全', note: '' },
      { item: '监控摄像头在线率', standard: '≥95%', actual: tag === 'second' ? '98%' : tag === 'linhai' ? '96%' : '93%', note: tag === 'zirong' ? '操场2个摄像头离线' : '' },
      { item: '安全巡查执行率', standard: '每日2次', actual: '每日2次', note: '' },
      { item: '门禁系统正常率', standard: '100%', actual: '100%', note: '' },
      { item: '危化品管理合规率', standard: '100%', actual: '100%', note: '' },
      { item: '安全教育培训覆盖率', standard: '100%', actual: tag === 'second' ? '100%' : tag === 'linhai' ? '100%' : '97%', note: tag === 'zirong' ? '3名新入职教师待培训' : '' },
      { item: '应急演练完成率', standard: '≥每学期1次', actual: '每学期1次', note: '' },
      { item: '事故报告及时率', standard: '24小时内', actual: '24小时内', note: '' }
    ]
  }
  if (type === 'equipment') {
    return [
      { item: '器材定期巡检完成率', standard: '100%', actual: '100%', note: '' },
      { item: '器材完好率', standard: '≥95%', actual: tag === 'second' ? '96%' : tag === 'linhai' ? '94%' : '92%', note: tag === 'zirong' ? '部分足球磨损严重' : tag === 'linhai' ? '体操垫需更换5块' : '' },
      { item: '器材台账完整率', standard: '100%', actual: '100%', note: '' },
      { item: '报废器材处理及时率', standard: '≤7工作日', actual: tag === 'second' ? '5工作日' : tag === 'linhai' ? '6工作日' : '8工作日', note: tag === 'zirong' ? '超期1天' : '' },
      { item: '器材维护保养记录', standard: '完整', actual: '完整', note: '' },
      { item: '新器材采购计划执行率', standard: '≥90%', actual: tag === 'second' ? '95%' : tag === 'linhai' ? '88%' : '85%', note: tag === 'linhai' ? '游泳计时设备采购延迟' : tag === 'zirong' ? '排球器材采购审批中' : '' },
      { item: '器材安全检测合格率', standard: '≥98%', actual: tag === 'second' ? '99%' : tag === 'linhai' ? '97%' : '96%', note: '' },
      { item: '器材存放环境达标率', standard: '100%', actual: tag === 'second' ? '100%' : tag === 'linhai' ? '100%' : '95%', note: tag === 'zirong' ? '器材室湿度偏高' : '' },
      { item: '器材使用培训覆盖率', standard: '100%', actual: '100%', note: '' },
      { item: '器材年检完成率', standard: '100%', actual: tag === 'second' ? '100%' : tag === 'linhai' ? '95%' : '90%', note: tag === 'linhai' ? '3件武术器材待检' : tag === 'zirong' ? '5件器材年检即将到期' : '' },
      { item: '器材维修响应时间', standard: '≤48小时', actual: tag === 'second' ? '24小时' : tag === 'linhai' ? '36小时' : '40小时', note: '' },
      { item: '器材报废率', standard: '≤5%', actual: tag === 'second' ? '3.2%' : tag === 'linhai' ? '4.1%' : '4.8%', note: '' }
    ]
  }
  if (type === 'progress') {
    return [
      { item: '体育课时完成率', standard: '≥95%', actual: tag === 'second' ? '98%' : tag === 'linhai' ? '96%' : '93%', note: tag === 'zirong' ? '排球单元进度滞后' : '' },
      { item: '教学计划执行率', standard: '≥90%', actual: tag === 'second' ? '95%' : tag === 'linhai' ? '93%' : '89%', note: tag === 'zirong' ? '雨天影响2课时' : '' },
      { item: '学分达标率', standard: '≥85%', actual: tag === 'second' ? '91%' : tag === 'linhai' ? '89%' : '82%', note: tag === 'zirong' ? '五年级偏低' : '' },
      { item: '体测项目完成率', standard: '100%', actual: tag === 'second' ? '100%' : tag === 'linhai' ? '100%' : '95%', note: tag === 'zirong' ? '坐位体前屈未测' : '' },
      { item: '课外活动参与率', standard: '≥80%', actual: tag === 'second' ? '86%' : tag === 'linhai' ? '84%' : '78%', note: tag === 'zirong' ? '三年级参与偏低' : '' },
      { item: '技能考核通过率', standard: '≥85%', actual: tag === 'second' ? '92%' : tag === 'linhai' ? '90%' : '86%', note: '' },
      { item: '课程评价满意度', standard: '≥90%', actual: tag === 'second' ? '94%' : tag === 'linhai' ? '92%' : '90%', note: '' },
      { item: '教师教案完成率', standard: '100%', actual: tag === 'second' ? '100%' : tag === 'linhai' ? '100%' : '97%', note: tag === 'zirong' ? '2位教师教案迟交' : '' },
      { item: '学期目标达成率', standard: '≥90%', actual: tag === 'second' ? '93%' : tag === 'linhai' ? '91%' : '87%', note: '' },
      { item: '特色课程开设率', standard: '≥2门/学期', actual: tag === 'second' ? '3门' : tag === 'linhai' ? '4门' : '2门', note: '' },
      { item: '学生体质健康达标率', standard: '≥85%', actual: tag === 'second' ? '91%' : tag === 'linhai' ? '89%' : '83%', note: tag === 'zirong' ? '耐力跑项目偏弱' : '' },
      { item: '教学观摩完成率', standard: '≥每人2次/学期', actual: tag === 'second' ? '每人3次' : tag === 'linhai' ? '每人2次' : '每人2次', note: '' }
    ]
  }
  if (type === 'term') {
    return [
      { item: '学期体育课时总数', standard: '≥72课时', actual: tag === 'second' ? '76课时' : tag === 'linhai' ? '74课时' : '70课时', note: tag === 'zirong' ? '因雨天缺2课时' : '' },
      { item: '学期教学计划完成率', standard: '≥95%', actual: tag === 'second' ? '97%' : tag === 'linhai' ? '95%' : '92%', note: '' },
      { item: '学期体测达标率', standard: '≥85%', actual: tag === 'second' ? '91%' : tag === 'linhai' ? '89%' : '84%', note: tag === 'zirong' ? '五年级需关注' : '' },
      { item: '学期安全事故数', standard: '0起', actual: tag === 'second' ? '0起' : tag === 'linhai' ? '0起' : '1起', note: tag === 'zirong' ? '1起轻微擦伤已处理' : '' },
      { item: '学期教师出勤率', standard: '≥98%', actual: tag === 'second' ? '99%' : tag === 'linhai' ? '98%' : '97%', note: '' },
      { item: '学期教研活动次数', standard: '≥8次', actual: tag === 'second' ? '12次' : tag === 'linhai' ? '10次' : '9次', note: '' },
      { item: '学期家长满意度', standard: '≥90%', actual: tag === 'second' ? '94%' : tag === 'linhai' ? '93%' : '90%', note: '' },
      { item: '学期课外赛事举办', standard: '≥1次', actual: tag === 'second' ? '2次' : tag === 'linhai' ? '3次' : '1次', note: '' },
      { item: '学期器材采购完成率', standard: '≥90%', actual: tag === 'second' ? '95%' : tag === 'linhai' ? '92%' : '88%', note: tag === 'zirong' ? '部分器材延迟到货' : '' },
      { item: '学期培训完成率', standard: '100%', actual: tag === 'second' ? '100%' : tag === 'linhai' ? '100%' : '96%', note: tag === 'zirong' ? '1名教师培训未完成' : '' },
      { item: '学期课程评价优良率', standard: '≥85%', actual: tag === 'second' ? '92%' : tag === 'linhai' ? '90%' : '86%', note: '' },
      { item: '学期工作总结提交率', standard: '100%', actual: '100%', note: '' }
    ]
  }
  // monthly — 使用现有默认数据
  return null // null表示使用现有complianceItemsDefault
}

// 各报表类型的预警事项
const getAlertsForType = (type) => {
  const tag = getSchoolTag()
  if (type === 'safety') {
    if (tag === 'zirong') return [
      { level: 'high', title: '足球场防护垫破损严重', description: '足球训练区多块防护垫已破损，存在安全隐患', time: '5分钟前' },
      { level: 'high', title: '教学楼3层应急灯故障', description: '应急照明灯无法正常启动，需立即维修', time: '20分钟前' },
      { level: 'medium', title: '操场2个监控摄像头离线', description: '操场东侧和南侧摄像头信号中断', time: '30分钟前' },
      { level: 'medium', title: '3名新教师安全培训未完成', description: '新入职教师尚未完成安全教育培训', time: '1小时前' },
      { level: 'low', title: '安全标识部分褪色', description: '操场区域部分安全警示标识需更新', time: '2小时前' }
    ]
    if (tag === 'linhai') return [
      { level: 'high', title: '游泳馆B区应急灯需检修', description: '游泳馆B区应急照明亮度不足，不达标', time: '10分钟前' },
      { level: 'medium', title: '体操房安全出口标识损坏', description: '体操房西侧安全出口指示灯故障', time: '40分钟前' },
      { level: 'medium', title: '游泳馆地面湿滑警告标识不足', description: '需增加防滑警示标识', time: '1小时前' },
      { level: 'low', title: '武术教室通风系统异响', description: '通风管道运行时产生异常声响', time: '3小时前' },
      { level: 'info', title: '本月安全巡查全部达标', description: '本月30天安全巡查均已按时完成', time: '5小时前' }
    ]
    return [
      { level: 'high', title: '部分防护垫老化严重', description: '田径场区域防护垫使用超5年，完好率95%', time: '10分钟前' },
      { level: 'medium', title: '消防栓水压偏低', description: '教学楼2层消防栓水压略低于标准值', time: '30分钟前' },
      { level: 'medium', title: '操场照明灯2盏不亮', description: '操场西侧照明灯故障，影响晚间训练', time: '1小时前' },
      { level: 'low', title: '安全通道堆放杂物', description: '体育器材室旁安全通道有少量杂物', time: '2小时前' },
      { level: 'info', title: '本月应急演练已完成', description: '全校应急疏散演练顺利完成，用时3分42秒', time: '5小时前' }
    ]
  }
  if (type === 'equipment') {
    if (tag === 'zirong') return [
      { level: 'high', title: '5件器材年检即将到期', description: '包括跳高架2副、跨栏架3副，需尽快送检', time: '10分钟前' },
      { level: 'high', title: '足球磨损严重需报废', description: '15个足球使用超3年，表皮磨损严重', time: '30分钟前' },
      { level: 'medium', title: '器材室湿度偏高', description: '器材室湿度达75%，超出60%标准，需除湿', time: '1小时前' },
      { level: 'medium', title: '排球器材采购审批中', description: '新排球30个采购申请已提交，等待审批', time: '2小时前' },
      { level: 'low', title: '跳绳存放架需维修', description: '2个跳绳存放架卡扣松动', time: '3小时前' }
    ]
    if (tag === 'linhai') return [
      { level: 'high', title: '体操垫需更换5块', description: '体操训练区5块防护垫已老化开裂', time: '15分钟前' },
      { level: 'medium', title: '游泳计时设备采购延迟', description: '新计时系统预计延迟2周到货', time: '45分钟前' },
      { level: 'medium', title: '3件武术器材待年检', description: '武术刀、剑、棍各1件年检到期', time: '1小时前' },
      { level: 'low', title: '平衡木表面防滑层磨损', description: '平衡木表面需重新贴防滑层', time: '3小时前' },
      { level: 'info', title: '本月器材巡检已完成', description: '全月器材巡检记录完整，无遗漏', time: '5小时前' }
    ]
    return [
      { level: 'high', title: '立定跳远测试垫破损', description: '操场A区2块测试垫需更换', time: '10分钟前' },
      { level: 'medium', title: '部分器材年检即将到期', description: '计秒器5个、皮尺10把年检时间临近', time: '30分钟前' },
      { level: 'medium', title: '篮球气压不足', description: '8个篮球气压低于标准值，需充气', time: '1小时前' },
      { level: 'low', title: '器材借用登记不完整', description: '部分教师借用器材未及时登记', time: '2小时前' },
      { level: 'info', title: '新器材已入库', description: '本批新购跳绳50根已验收入库', time: '4小时前' }
    ]
  }
  if (type === 'progress') {
    if (tag === 'zirong') return [
      { level: 'high', title: '排球教学单元进度滞后', description: '排球垫球单元完成率仅87%，落后计划1周', time: '15分钟前' },
      { level: 'medium', title: '五年级学分达标率偏低', description: '五年级学分达标率82%，低于85%标准', time: '30分钟前' },
      { level: 'medium', title: '雨天缺2课时影响进度', description: '本月因雨天取消2节室外课，需补课', time: '1小时前' },
      { level: 'low', title: '三年级课外活动参与率偏低', description: '三年级课外活动参与率仅72%', time: '2小时前' },
      { level: 'low', title: '坐位体前屈项目未测试', description: '体测中坐位体前屈尚未安排测试', time: '3小时前' }
    ]
    if (tag === 'linhai') return [
      { level: 'medium', title: '游泳课程换气技巧通过率偏低', description: '游泳换气环节通过率78%，建议增加练习', time: '20分钟前' },
      { level: 'medium', title: '体操平衡木完成度较低', description: '平衡木教学环节学生完成度仅75%', time: '45分钟前' },
      { level: 'low', title: '武术套路连贯性需加强', description: '武术套路最后三段衔接不够流畅', time: '1小时前' },
      { level: 'low', title: '二年级跳绳双摇通过率低', description: '二年级双摇跳绳通过率仅68%', time: '3小时前' },
      { level: 'info', title: '本学期特色课程评价优秀', description: '游泳课程学生满意度达96%', time: '5小时前' }
    ]
    return [
      { level: 'medium', title: '篮球投篮教学进度偏快', description: '投篮单元学生掌握率仅80%，建议放慢', time: '15分钟前' },
      { level: 'medium', title: '田径起跑技术待提升', description: '部分学生起跑姿势不规范', time: '30分钟前' },
      { level: 'low', title: '立定跳远起跳角度需纠正', description: '低年级学生起跳角度偏大', time: '1小时前' },
      { level: 'low', title: '低年级投篮姿势错误率较高', description: '一二年级投篮姿势纠正需加强', time: '2小时前' },
      { level: 'info', title: '本学期教学观摩已完成', description: '全组教师教学观摩均已达标', time: '5小时前' }
    ]
  }
  if (type === 'term') {
    if (tag === 'zirong') return [
      { level: 'high', title: '五年级体测达标率低于85%', description: '五年级体测达标率仅82%，低于学期目标', time: '1小时前' },
      { level: 'medium', title: '学期器材采购完成率88%', description: '未达90%目标，部分器材延迟到货', time: '2小时前' },
      { level: 'medium', title: '1名教师培训未完成', description: '学期培训要求100%完成，尚有1人未达标', time: '3小时前' },
      { level: 'low', title: '雨天缺2课时需安排补课', description: '学期因天气原因缺少2课时', time: '4小时前' }
    ]
    if (tag === 'linhai') return [
      { level: 'medium', title: '学期体测达标率89%接近临界', description: '距离90%优良目标仅差1个百分点', time: '1小时前' },
      { level: 'medium', title: '武术器材年检完成率95%', description: '3件武术器材年检待完成', time: '2小时前' },
      { level: 'low', title: '家长满意度调查回收率偏低', description: '问卷回收率82%，建议加强宣传', time: '4小时前' },
      { level: 'info', title: '学期赛事成功举办3次', description: '超额完成学期赛事目标', time: '5小时前' }
    ]
    return [
      { level: 'medium', title: '1起轻微安全事故已处理', description: '学期发生1起学生擦伤事故，已妥善处理', time: '1小时前' },
      { level: 'low', title: '教师出勤率97%略低于目标', description: '距98%目标差1个百分点', time: '2小时前' },
      { level: 'low', title: '学期器材采购完成率88%', description: '部分采购流程耗时较长', time: '3小时前' },
      { level: 'info', title: '学期教研活动12次超额完成', description: '超过学期8次目标50%', time: '5小时前' }
    ]
  }
  // monthly — 使用现有默认数据
  return null
}

// 各报表类型的合规统计
const getComplianceStatsForType = (type) => {
  const tag = getSchoolTag()
  const base = {
    second:  { monthly: { compliant: 11, total: 12 }, term: { compliant: 10, total: 12 }, safety: { compliant: 10, total: 12 }, equipment: { compliant: 9, total: 12 }, progress: { compliant: 10, total: 12 } },
    zirong:  { monthly: { compliant: 6, total: 12 },  term: { compliant: 7, total: 12 },  safety: { compliant: 5, total: 12 },  equipment: { compliant: 5, total: 12 },  progress: { compliant: 6, total: 12 } },
    linhai:  { monthly: { compliant: 10, total: 12 }, term: { compliant: 9, total: 12 },  safety: { compliant: 8, total: 12 },  equipment: { compliant: 8, total: 12 },  progress: { compliant: 9, total: 12 } }
  }
  return base[tag]?.[type] || base.second.monthly
}

// 周期修正系数：不同周期对数据的微调
const getPeriodAdjustment = (period) => {
  switch (period) {
    case 'lastMonth': return { rateOffset: -2, labelSuffix: '（上月数据）' }
    case 'thisQuarter': return { rateOffset: 1, labelSuffix: '（本季度汇总）' }
    case 'thisYear': return { rateOffset: 3, labelSuffix: '（本年度汇总）' }
    default: return { rateOffset: 0, labelSuffix: '' }
  }
}

// 根据当前选择更新所有显示数据
const updateDataForSelection = () => {
  const type = reportType.value
  const period = reportPeriod.value
  const adj = getPeriodAdjustment(period)

  // 更新合规明细
  const typeItems = getComplianceItemsForType(type)
  if (typeItems) {
    // 根据周期微调actual值
    complianceItems.value = typeItems.map(item => {
      const pctMatch = item.actual.match(/^(\d+(?:\.\d+)?)%$/)
      if (pctMatch && period !== 'thisMonth') {
        const val = parseFloat(pctMatch[1])
        const newVal = Math.max(0, Math.min(100, val + adj.rateOffset))
        return { ...item, actual: `${newVal}%` }
      }
      return { ...item }
    })
  } else {
    complianceItems.value = [...complianceItemsDefault.value]
  }

  // 更新预警事项
  const typeAlerts = getAlertsForType(type)
  if (typeAlerts) {
    alerts.value = typeAlerts
  } else {
    alerts.value = [...alertsDefault.value]
  }

  // 更新合规统计
  const typeStats = getComplianceStatsForType(type)
  const rateAdj = adj.rateOffset
  // 模拟周期对合规数的影响
  let compliant = typeStats.compliant
  let total = typeStats.total
  if (rateAdj > 0 && compliant < total) {
    compliant = Math.min(total, compliant + Math.round(rateAdj / 2))
  } else if (rateAdj < 0 && compliant > 0) {
    compliant = Math.max(0, compliant + rateAdj)
  }
  complianceStats.value = { compliant, total }

  // 更新学分排名（周期影响基准学分）
  const periodCreditOffset = { thisMonth: 0, lastMonth: -5, thisQuarter: 10, thisYear: 20 }
  const offset = periodCreditOffset[period] || 0
  creditRanking.value = creditRankingDefault.value.map(r => ({
    ...r,
    credit: r.credit + offset
  }))

  // 更新预警学员（周期影响原因描述）
  const periodReasonSuffix = { lastMonth: '（上月）', thisQuarter: '（本季度）', thisYear: '（本年度）' }
  const suffix = periodReasonSuffix[period] || ''
  warningStudents.value = warningStudentsDefault.value.map(s => ({
    ...s,
    reason: s.reason + suffix
  }))

  // 更新统计基数（周期影响报表数和导出数）
  const periodStatsMultiplier = { thisMonth: 1, lastMonth: 0.9, thisQuarter: 2.5, thisYear: 8 }
  const mult = periodStatsMultiplier[period] || 1
  const baseDefault = statsBaseDefault.value
  statsBase.value = {
    ...statsBase.value,
    totalReports: Math.round(baseDefault.totalReports * mult),
    exported: Math.round(baseDefault.exported * mult)
  }

  // 重绘图表
  setTimeout(() => {
    initTrendChart()
    initHeatmapChart()
  }, 100)
}

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const initTrendChart = () => {
  if (!trendChart.value) return
  if (trendChartInstance) trendChartInstance.dispose()

  trendChartInstance = echarts.init(trendChart.value)
  trendChartInstance.showLoading()

  // 从 stats.complianceRate 生成月度趋势数据，加入更多变化
  const baseRate = stats.value.complianceRate || 92
  const avgCredit = creditRanking.value.length > 0
    ? Math.round(creditRanking.value.reduce((s, r) => s + r.credit, 0) / creditRanking.value.length / 1.6)
    : 82
  const creditScale = avgCredit / 92

  const chartData = Array.from({ length: 12 }, (_, i) => {
    // 使用多种波形叠加产生更自然的变化
    const seasonal = Math.sin(i * 0.5) * 3
    const trend = i * 0.3
    const variation = Math.cos(i * 1.2) * 2
    return Math.round((baseRate + seasonal + trend + variation - 2) * creditScale)
  })

  // 动态计算 Y 轴范围，确保数据点始终可见
  const dataMin = Math.min(...chartData)
  const dataMax = Math.max(...chartData)
  const yAxisMin = Math.max(0, Math.floor(dataMin / 5) * 5 - 5)
  const yAxisMax = Math.min(100, Math.ceil(dataMax / 5) * 5 + 5)

  const option = {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    grid: {
      top: 20,
      right: 10,
      bottom: 30,
      left: 40,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: yAxisMin,
      max: yAxisMax,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
      axisLabel: { color: '#6B7280', fontSize: 11, formatter: '{value}%' }
    },
    series: [{
      type: 'line',
      data: chartData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#1E5AA8', width: 2.5 },
      itemStyle: { color: '#1E5AA8' },
      areaStyle: {
        color: 'rgba(30, 90, 168, 0.12)'
      },
      animationDelay: (idx) => idx * 50
    }]
  }

  trendChartInstance.setOption(option)
  trendChartInstance.hideLoading()
}

const handleResize = () => {
  trendChartInstance?.resize()
  heatmapChartInstance?.resize()
}

// 初始化学习进度热力图
const initHeatmapChart = () => {
  if (!heatmapChart.value) return
  if (heatmapChartInstance) heatmapChartInstance.dispose()

  heatmapChartInstance = echarts.init(heatmapChart.value)
  heatmapChartInstance.showLoading()

  const hours = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const courses = GRADE_NAMES

  // 从 creditRanking 按年级分组，计算各年级基准值
  const gradeBase = {}
  creditRanking.value.forEach(item => {
    const grade = courses.find(g => (item.className || '').includes(g))
    if (grade) {
      if (!gradeBase[grade]) gradeBase[grade] = []
      gradeBase[grade].push(item.credit)
    }
  })

  // 热力图数据 [hourIndex, courseIndex, value]
  const heatmapData = []
  courses.forEach((course, ci) => {
    const credits = gradeBase[course]
    const baseValue = credits ? Math.round(credits.reduce((a, b) => a + b, 0) / credits.length / 1.6) : 82
    hours.forEach((_, hi) => {
      // 使用确定性伪随机数替代 Math.random()，确保热力图数据稳定
      const seed = ((ci * 31 + hi * 17 + 7) % 100) / 100
      let value = baseValue + Math.floor((seed - 0.5) * 15)
      // 周末降低
      if (hi >= 5) value = Math.max(30, value - 25)
      // 工作日高峰
      if (hi >= 1 && hi <= 3) value = Math.min(100, value + 5)
      heatmapData.push([hi, ci, Math.min(100, Math.max(0, value))])
    })
  })

  const option = {
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    grid: { top: 15, right: 5, bottom: 25, left: 35, containLabel: true },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: { fontSize: 10, color: '#6B7280' },
      axisLine: { lineStyle: { color: '#E8EAED' } }
    },
    yAxis: {
      type: 'category',
      data: courses,
      splitArea: { show: true },
      axisLabel: { fontSize: 10, color: '#6B7280' },
      axisLine: { lineStyle: { color: '#E8EAED' } }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'vertical',
      right: 5,
      top: 'center',
      show: false,
      inRange: {
        color: ['#FEE2E2', '#FED7AA', '#FEF3C7', '#D1FAE5', '#1E5AA8']
      }
    },
    series: [{
      name: '学习进度',
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: true,
        color: '#fff',
        fontSize: 9,
        formatter: '{c}%'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      },
      animationDelay: (idx) => idx * 20
    }]
  }

  heatmapChartInstance.setOption(option)
  heatmapChartInstance.hideLoading()
}

// 教育部报表相关方法
const exportMinistryReport = () => {
  selectedMinistryReport.value = 'credit'
  showMinistryDialog.value = true
}

const selectMinistryReport = (report) => {
  selectedMinistryReport.value = report.id
}

const exportMinistrySelected = () => {
  const report = ministryReports.value.find(r => r.id === selectedMinistryReport.value)
  if (!report) {
    ElMessage.warning('请选择要导出的报表')
    return
  }

  if (selectedMinistryReport.value === 'credit') {
    exportCreditCompletionReport()
  } else if (selectedMinistryReport.value === 'participation') {
    exportParticipationReport()
  } else if (selectedMinistryReport.value === 'passRate') {
    exportPassRateReport()
  }

  showMinistryDialog.value = false
}

// 导出学分完成率统计表
const exportCreditCompletionReport = () => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const gradeNames = GRADE_NAMES
  // 各校各年级学生数
  const gradeStudents = isZirong
    ? [88, 85, 82, 84, 80, 84]   // 503 total
    : isLinhai
    ? [108, 105, 102, 96, 96, 105]  // 612 total
    : [228, 220, 218, 215, 214, 214]  // 1309 total
  // 各校学分完成率基准
  const baseRate = isZirong ? 0.88 : isLinhai ? 0.93 : 0.92

  const worksheetData = []
  worksheetData.push(['学分完成率统计表'])
  worksheetData.push(['学校名称：', schoolName.value])
  worksheetData.push(['统计周期：', reportPeriodText.value])
  worksheetData.push(['生成时间：', currentDate.value])
  worksheetData.push([])

  worksheetData.push(['年级', '学生总数', '已修学分人数', '学分完成率', '备注'])
  let totalStudents = 0, totalPassed = 0
  gradeNames.forEach((grade, i) => {
    const students = gradeStudents[i]
    const rate = Math.min(100, Math.round((baseRate - i * 0.012) * 10000) / 100)
    const passed = Math.round(students * rate / 100)
    const note = rate < 90 ? '部分学生需关注' : ''
    worksheetData.push([grade, String(students), String(passed), `${rate.toFixed(2)}%`, note])
    totalStudents += students
    totalPassed += passed
  })
  worksheetData.push([])
  const totalRate = (totalPassed / totalStudents * 100).toFixed(2)
  worksheetData.push(['合计', String(totalStudents), String(totalPassed), `${totalRate}%`, ''])

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '学分完成率统计')

  worksheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 20 }]

  XLSX.writeFile(workbook, `学分完成率统计表_${new Date().toLocaleDateString()}.xlsx`)
  ElMessage.success('《学分完成率统计表》已导出')
}

// 导出课程参与度分析报告
const exportParticipationReport = () => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const totalStudents = isZirong ? 503 : isLinhai ? 612 : 1309

  // 各校不同课程名称与数据
  const courses = isZirong
    ? [
        { name: '体育基础', participants: 488, rate: 97.02, duration: 42, difficulty: '无' },
        { name: '排球垫球', participants: 412, rate: 95.84, duration: 50, difficulty: '垫球手型' },
        { name: '足球运球', participants: 398, rate: 94.56, duration: 52, difficulty: '运球变向' },
        { name: '跳绳专项', participants: 465, rate: 96.42, duration: 45, difficulty: '双摇技巧' },
        { name: '体能训练', participants: 440, rate: 93.85, duration: 48, difficulty: '耐力训练' }
      ]
    : isLinhai
    ? [
        { name: '体育基础', participants: 598, rate: 97.71, duration: 44, difficulty: '无' },
        { name: '游泳课程', participants: 520, rate: 96.12, duration: 58, difficulty: '换气技巧' },
        { name: '体操训练', participants: 485, rate: 94.60, duration: 46, difficulty: '平衡木' },
        { name: '武术套路', participants: 462, rate: 93.88, duration: 52, difficulty: '套路连贯性' },
        { name: '跳绳专项', participants: 548, rate: 97.15, duration: 42, difficulty: '交叉跳' }
      ]
    : [
        { name: '体育基础', participants: 1275, rate: 97.56, duration: 45, difficulty: '无' },
        { name: '田径训练', participants: 980, rate: 96.48, duration: 52, difficulty: '起跑技术' },
        { name: '篮球基础', participants: 856, rate: 96.24, duration: 48, difficulty: '投篮姿势' },
        { name: '跳绳专项', participants: 1120, rate: 95.82, duration: 44, difficulty: '双摇技巧' },
        { name: '立定跳远训练', participants: 920, rate: 94.35, duration: 50, difficulty: '起跳角度' }
      ]

  const worksheetData = []
  worksheetData.push(['课程参与度分析报告'])
  worksheetData.push(['学校名称：', schoolName.value])
  worksheetData.push(['统计周期：', reportPeriodText.value])
  worksheetData.push(['生成时间：', currentDate.value])
  worksheetData.push([])

  worksheetData.push(['课程名称', '应参与人数', '实际参与人数', '参与率', '平均学习时长(分钟)', '难点章节'])
  courses.forEach(c => {
    worksheetData.push([c.name, String(totalStudents), String(c.participants), `${c.rate.toFixed(2)}%`, String(c.duration), c.difficulty])
  })

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '课程参与度分析')

  worksheet['!cols'] = [{ wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 20 }, { wch: 15 }]

  XLSX.writeFile(workbook, `课程参与度分析报告_${new Date().toLocaleDateString()}.xlsx`)
  ElMessage.success('《课程参与度分析报告》已导出')
}

// 导出考试通过率趋势图数据
const exportPassRateReport = () => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const totalStudents = isZirong ? 503 : isLinhai ? 612 : 1309
  const basePassRate = isZirong ? 0.90 : isLinhai ? 0.95 : 0.93
  const baseExcellentRate = isZirong ? 0.32 : isLinhai ? 0.42 : 0.36

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 9 ? year : year - 1
  const semesters = []
  for (let i = 2; i >= 0; i--) {
    const sy = startYear - i
    semesters.push({ label: `${sy}-${sy + 1}上学期`, studentsOffset: -40 + (2 - i) * 15, passOffset: (2 - i) * 0.015, excellentOffset: (2 - i) * 0.03 })
    semesters.push({ label: `${sy}-${sy + 1}下学期`, studentsOffset: -25 + (2 - i) * 15, passOffset: 0.015 + (2 - i) * 0.015, excellentOffset: 0.03 + (2 - i) * 0.03 })
  }

  const worksheetData = []
  worksheetData.push(['考试通过率趋势图'])
  worksheetData.push(['学校名称：', schoolName.value])
  worksheetData.push(['统计周期：', reportPeriodText.value])
  worksheetData.push(['生成时间：', currentDate.value])
  worksheetData.push([])

  worksheetData.push(['学期', '参考人数', '通过人数', '通过率', '优秀率', '备注'])
  semesters.forEach((sem, idx) => {
    const students = totalStudents + sem.studentsOffset
    const passRate = Math.min(100, Math.round((basePassRate + sem.passOffset) * 10000) / 100)
    const passCount = Math.round(students * passRate / 100)
    const excellentRate = Math.min(100, Math.round((baseExcellentRate + sem.excellentRate) * 1000) / 10)
    const note = idx === semesters.length - 1 ? '当前学期' : ''
    worksheetData.push([sem.label, String(students), String(passCount), `${passRate.toFixed(2)}%`, `${excellentRate.toFixed(1)}%`, note])
  })

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '考试通过率趋势')

  worksheet['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 }]

  XLSX.writeFile(workbook, `考试通过率趋势图_${new Date().toLocaleDateString()}.xlsx`)
  ElMessage.success('《考试通过率趋势图》已导出')
}

const generateReport = () => {
  generateForm.value = {
    type: 'monthly',
    period: 'thisMonth',
    include: ['basic', 'detail'],
    note: ''
  }
  showGenerateDialog.value = true
}

const confirmGenerate = () => {
  addLog('生成报告', '', '生成合规报告')
  const typeName = { monthly: '月度', term: '学期汇总', safety: '安全检查', equipment: '器材维护', progress: '课程进度' }
  const periodName = { thisMonth: '本月', lastMonth: '上月', thisQuarter: '本季度', thisYear: '本年度' }
  const form = generateForm.value
  // 更新报表类型和周期（watcher 会自动调用 updateDataForSelection 并更新标题）
  reportType.value = form.type
  reportPeriod.value = form.period
  // 更新统计：报表数+1
  statsBase.value = { ...statsBase.value, totalReports: statsBase.value.totalReports + 1 }
  // 更新当前日期
  currentDate.value = new Date().toLocaleString('zh-CN')
  ElMessage.success(`已生成${typeName[form.type] || ''}合规报表（${periodName[form.period] || ''}）`)
  showGenerateDialog.value = false
}

const handleExportReport = () => {
  addLog('导出报告', '', '导出合规报告')
  exportForm.value = {
    format: 'excel',
    range: 'current',
    filename: ''
  }
  showExportDialog.value = true
}

const confirmExport = () => {
  const format = exportForm.value.format
  const customFilename = exportForm.value.filename
  
  if (format === 'excel') {
    exportToExcel(customFilename)
  } else if (format === 'pdf') {
    exportToPDF(customFilename)
  } else if (format === 'csv') {
    exportToCSV(customFilename)
  }
  
  showExportDialog.value = false
}

const exportToPDF = (customFilename = '') => {
  addLog('导出PDF', '', '导出PDF报告')
  
  const isCustom = reportType.value === 'custom' && customReportConfig.value.reportName
  const filename = customFilename || `${isCustom ? customReportConfig.value.reportName : reportTitle.value}_${new Date().toLocaleDateString()}`
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    ElMessage.error('无法打开打印窗口，请检查浏览器弹窗设置')
    return
  }

  let htmlContent = ''
  
  if (isCustom) {
    const config = customReportConfig.value
    const fields = config.fields
    const data = customPreviewData.value
    
    const buildStatsRows = () => {
      if (!config.showStats) return ''
      return customPreviewStats.value.map(stat => 
        `<div class="overview-item"><div class="overview-value">${stat.value}</div><div class="overview-label">${stat.label}</div></div>`
      ).join('')
    }
    
    const buildTableRows = () => {
      if (!config.showTable || fields.length === 0) return ''
      return data.slice(0, 10).map(row => {
        const cells = fields.map(f => `<td>${row[f] || ''}</td>`).join('')
        return `<tr>${cells}</tr>`
      }).join('')
    }
    
    const buildTableHeader = () => {
      if (!config.showTable || fields.length === 0) return ''
      return fields.map(f => `<th>${getFieldName(f)}</th>`).join('')
    }
    
    htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${filename}</title>
<style>
  body { font-family: "Microsoft YaHei", Arial, sans-serif; padding: 40px; color: #333; }
  h1 { text-align: center; color: #1E5AA8; margin-bottom: 10px; }
  .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 16px; color: #1A1A2E; border-bottom: 2px solid #1E5AA8; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #F7F8FA; font-weight: 600; }
  .overview { display: flex; gap: 20px; margin: 10px 0; flex-wrap: wrap; }
  .overview-item { flex: 1; min-width: 120px; text-align: center; padding: 12px; background: #F7F8FA; border-radius: 6px; }
  .overview-value { font-size: 24px; font-weight: 700; color: #1E5AA8; }
  .overview-label { font-size: 12px; color: #666; margin-top: 4px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>${config.reportName}</h1>
<p class="subtitle">${schoolName.value} | 生成时间：${new Date().toLocaleString('zh-CN')}</p>
${config.reportDescription ? `<p style="text-align:center;color:#666">${config.reportDescription}</p>` : ''}

${config.showStats ? `<div class="section"><h2>统计概览</h2><div class="overview">${buildStatsRows()}</div></div>` : ''}

${config.showTable && fields.length > 0 ? `<div class="section"><h2>数据明细</h2><table><tr>${buildTableHeader()}</tr>${buildTableRows()}</table></div>` : ''}

${config.chartType && config.xAxisField && config.yAxisField ? `<div class="section"><h2>图表分析</h2><p>${config.chartTitle || '数据图表'}</p></div>` : ''}
</body>
</html>`
  } else {
    const buildComplianceRows = () => {
      let rows = ''
      complianceItemsWithStatus.value.forEach(item => {
        rows += `<tr><td>${item.item}</td><td>${item.standard}</td><td>${item.actual}</td><td class="status-${item.status}">${item.statusText}</td><td>${item.note || ''}</td></tr>`
      })
      return rows
    }

    const buildAlertRows = () => {
      let rows = ''
      alerts.value.forEach(a => {
        const levelMap = { high: '高', medium: '中', low: '低', info: '提示' }
        const levelText = levelMap[a.level] || a.level
        rows += `<tr><td>${levelText}</td><td>${a.title}</td><td>${a.description}</td><td>${a.time}</td></tr>`
      })
      return rows
    }

    htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${filename}</title>
<style>
  body { font-family: "Microsoft YaHei", Arial, sans-serif; padding: 40px; color: #333; }
  h1 { text-align: center; color: #1E5AA8; margin-bottom: 10px; }
  .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 16px; color: #1A1A2E; border-bottom: 2px solid #1E5AA8; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #F7F8FA; font-weight: 600; }
  .status-compliant { color: #166534; font-weight: 600; }
  .status-warning { color: #92400E; font-weight: 600; }
  .overview { display: flex; gap: 20px; margin: 10px 0; }
  .overview-item { flex: 1; text-align: center; padding: 12px; background: #F7F8FA; border-radius: 6px; }
  .overview-value { font-size: 24px; font-weight: 700; color: #1E5AA8; }
  .overview-label { font-size: 12px; color: #666; margin-top: 4px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>${reportTitle.value}</h1>
<p class="subtitle">${schoolName.value} | 报告周期：${reportPeriodText.value} | 生成时间：${currentDate.value}</p>

<div class="section">
<h2>一、合规概览</h2>
<div class="overview">
  <div class="overview-item"><div class="overview-value">${complianceStats.value.compliant}</div><div class="overview-label">合规项</div></div>
  <div class="overview-item"><div class="overview-value">${complianceStats.value.total}</div><div class="overview-label">检查项</div></div>
  <div class="overview-item"><div class="overview-value">${stats.value.complianceRate}%</div><div class="overview-label">合规率</div></div>
</div>
</div>

<div class="section">
<h2>二、合规明细</h2>
<table>
<tr><th>检查项目</th><th>标准要求</th><th>实际情况</th><th>状态</th><th>备注</th></tr>
${buildComplianceRows()}
</table>
</div>

<div class="section">
<h2>三、预警事项</h2>
<table>
<tr><th>级别</th><th>预警标题</th><th>描述</th><th>时间</th></tr>
${buildAlertRows()}
</table>
</div>
</body>
</html>`
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  setTimeout(() => {
    printWindow.print()
  }, 500)
  
  ElMessage.success('PDF导出窗口已打开，请在打印对话框中选择"另存为PDF"')
}

const exportToExcel = (customFilename = '') => {
  const isCustom = reportType.value === 'custom' && customReportConfig.value.reportName
  const config = customReportConfig.value
  const filename = customFilename || `${isCustom ? config.reportName : reportTitle.value}_${new Date().toLocaleDateString()}`
  
  const worksheetData = []
  
  if (isCustom) {
    worksheetData.push(['', '', config.reportName])
    worksheetData.push(['', '', `学校：${schoolName.value}`])
    worksheetData.push(['', '', `生成时间：${new Date().toLocaleString('zh-CN')}`])
    if (config.reportDescription) {
      worksheetData.push(['', '', `描述：${config.reportDescription}`])
    }
    worksheetData.push([])
    
    if (config.showStats) {
      worksheetData.push(['统计概览'])
      worksheetData.push(['指标', '数值'])
      customPreviewStats.value.forEach(stat => {
        worksheetData.push([stat.label, stat.value])
      })
      worksheetData.push([])
    }
    
    if (config.showTable && config.fields.length > 0) {
      worksheetData.push(['数据明细'])
      worksheetData.push(config.fields.map(f => getFieldName(f)))
      customPreviewData.value.forEach(row => {
        worksheetData.push(config.fields.map(f => row[f] || ''))
      })
    }
  } else {
    worksheetData.push(['', '', reportTitle.value])
    worksheetData.push(['', '', `学校：${schoolName.value}`])
    worksheetData.push(['', '', `报告周期：${reportPeriodText.value}`])
    worksheetData.push(['', '', `生成时间：${currentDate.value}`])
    worksheetData.push([])
    
    worksheetData.push(['一、合规概览'])
    worksheetData.push(['项目', '数值'])
    worksheetData.push(['合规项', complianceStats.value.compliant])
    worksheetData.push(['检查项', complianceStats.value.total])
    worksheetData.push(['合规率', stats.value.complianceRate + '%'])
    worksheetData.push([])
    
    worksheetData.push(['二、合规明细'])
    worksheetData.push(['检查项目', '标准要求', '实际情况', '状态', '备注'])
    complianceItemsWithStatus.value.forEach(item => {
      worksheetData.push([
        item.item,
        item.standard,
        item.actual,
        item.statusText,
        item.note || ''
      ])
    })
    worksheetData.push([])
    
    worksheetData.push(['三、预警事项'])
    worksheetData.push(['级别', '预警标题', '描述', '时间'])
    alerts.value.forEach(alert => {
      const levelText = alert.level === 'high' ? '高' : alert.level === 'medium' ? '中' : '低'
      worksheetData.push([levelText, alert.title, alert.description, alert.time])
    })
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, isCustom ? '自定义报表' : '合规报表')
  
  const colCount = Math.max(...worksheetData.map(row => row.length))
  worksheet['!cols'] = Array(colCount).fill({ wch: 15 })
  
  XLSX.writeFile(workbook, `${filename}.xlsx`)
  ElMessage.success(`Excel报表已导出`)
}

const exportToCSV = (customFilename = '') => {
  const isCustom = reportType.value === 'custom' && customReportConfig.value.reportName
  const config = customReportConfig.value
  const filename = customFilename || `${isCustom ? config.reportName : reportTitle.value}_${new Date().toLocaleDateString()}`
  
  const rows = []
  
  if (isCustom) {
    rows.push(`报告标题,${config.reportName}`)
    rows.push(`学校,${schoolName.value}`)
    rows.push(`生成时间,${new Date().toLocaleString('zh-CN')}`)
    if (config.reportDescription) {
      rows.push(`描述,${config.reportDescription}`)
    }
    rows.push('')
    
    if (config.showStats) {
      rows.push('统计概览')
      rows.push('指标,数值')
      customPreviewStats.value.forEach(stat => {
        rows.push(`${stat.label},${stat.value}`)
      })
      rows.push('')
    }
    
    if (config.showTable && config.fields.length > 0) {
      rows.push('数据明细')
      rows.push(config.fields.map(f => getFieldName(f)).join(','))
      customPreviewData.value.forEach(row => {
        rows.push(config.fields.map(f => row[f] || '').join(','))
      })
    }
  } else {
    rows.push(`报告标题,${reportTitle.value}`)
    rows.push(`学校,${schoolName.value}`)
    rows.push(`报告周期,${reportPeriodText.value}`)
    rows.push(`生成时间,${currentDate.value}`)
    rows.push('')
    
    rows.push('一、合规概览')
    rows.push('项目,数值')
    rows.push(`合规项,${complianceStats.value.compliant}`)
    rows.push(`检查项,${complianceStats.value.total}`)
    rows.push(`合规率,${stats.value.complianceRate}%`)
    rows.push('')
    
    rows.push('二、合规明细')
    rows.push('检查项目,标准要求,实际情况,状态,备注')
    complianceItemsWithStatus.value.forEach(item => {
      rows.push(`${item.item},${item.standard},${item.actual},${item.statusText},${item.note || ''}`)
    })
    rows.push('')
    
    rows.push('三、预警事项')
    rows.push('级别,预警标题,描述,时间')
    alerts.value.forEach(alert => {
      const levelText = alert.level === 'high' ? '高' : alert.level === 'medium' ? '中' : '低'
      rows.push(`${levelText},${alert.title},${alert.description},${alert.time}`)
    })
  }
  
  const csvContent = rows.join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`CSV报表已导出`)
}

const handleAlertClick = (alert) => {
  ElMessage.warning(`处理预警: ${alert.title}`)
}

const refreshData = () => {
  // 重新加载所有数据到默认值
  statsBase.value = { ...statsBaseDefault.value }
  complianceStats.value = { ...complianceStatsDefault.value }
  complianceItems.value = [...complianceItemsDefault.value]
  alerts.value = [...alertsDefault.value]
  creditRanking.value = [...creditRankingDefault.value]
  warningStudents.value = [...warningStudentsDefault.value]
  // 重绘图表
  trendChartInstance?.showLoading()
  heatmapChartInstance?.showLoading()
  setTimeout(() => {
    initTrendChart()
    initHeatmapChart()
  }, 200)
  ElMessage.success('数据已刷新')
}

// 渲染自定义报表预览图表
const renderCustomPreviewChart = () => {
  if (!customPreviewChart.value) return
  // 确保容器有实际尺寸再初始化
  const el = customPreviewChart.value
  if (el.clientWidth === 0 || el.clientHeight === 0) return
  if (customPreviewChartInstance) customPreviewChartInstance.dispose()
  
  customPreviewChartInstance = echarts.init(el)
  
  const chartType = customReportConfig.value.chartType
  const xAxisField = customReportConfig.value.xAxisField
  const yAxisField = customReportConfig.value.yAxisField
  const chartTitle = customReportConfig.value.chartTitle || '图表预览'
  
  if (!xAxisField || !yAxisField || !chartType) {
    customPreviewChartInstance.dispose()
    customPreviewChartInstance = null
    return
  }
  
  const data = customPreviewData.value
  const xData = data.map(d => String(d[xAxisField]))
  const yData = data.map(d => parseFloat(d[yAxisField]) || 0)
  
  const seriesMap = {
    line: { type: 'line', smooth: true, symbol: 'circle' },
    bar: { type: 'bar' },
    pie: { type: 'pie', radius: ['40%', '70%'] },
    area: { type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, symbol: 'circle' },
    heatmap: { type: 'heatmap' },
    scatter: { type: 'scatter' }
  }
  
  const seriesType = seriesMap[chartType] || seriesMap.line
  
  let option = {}
  
  if (chartType === 'pie') {
    const pieData = data.slice(0, 8).map(d => ({
      name: String(d[xAxisField]),
      value: parseFloat(d[yAxisField]) || 0
    }))
    option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'horizontal', bottom: 10 },
      title: { text: chartTitle, left: 'center', top: 10 },
      series: [{ ...seriesType, data: pieData }]
    }
  } else if (chartType === 'heatmap') {
    const heatmapData = data.slice(0, 20).map((d, i) => [
      i % 5, Math.floor(i / 5), parseFloat(d[yAxisField]) || 0
    ])
    option = {
      tooltip: { position: 'top' },
      grid: { top: 40, right: 10, bottom: 30, left: 40 },
      title: { text: chartTitle, left: 'center', top: 10 },
      xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E'] },
      yAxis: { type: 'category', data: ['1', '2', '3', '4'] },
      visualMap: { min: Math.min(...yData), max: Math.max(...yData), calculable: true, orient: 'vertical', right: 10 },
      series: [{ ...seriesType, data: heatmapData }]
    }
  } else {
    option = {
      tooltip: { trigger: 'axis' },
      grid: { top: 40, right: 10, bottom: 30, left: 50 },
      title: { text: chartTitle, left: 'center', top: 10 },
      xAxis: { type: 'category', data: xData, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value' },
      series: [{ ...seriesType, data: yData, name: getFieldName(yAxisField) }]
    }
  }
  
  customPreviewChartInstance.setOption(option)
  customPreviewChartInstance.resize()
}
// 监听自定义报表配置变化，更新预览图表
watch([customBuilderTab, customReportConfig], async () => {
  if (customBuilderTab.value === 'preview') {
    await nextTick()
    setTimeout(renderCustomPreviewChart, 200)
  }
}, { deep: true })

const reportTitleMap = {
  monthly: '月度合规报告',
  term: '学期汇总报告',
  safety: '安全检查报告',
  equipment: '器材维护报告',
  progress: '课程进度报告'
}

watch([reportType, reportPeriod], () => {
  // 切换报表类型时自动更新标题（自定义报表激活时不覆盖）
  if (!activeCustomReport.value) {
    reportTitle.value = reportTitleMap[reportType.value] || '合规报告'
  }
  updateDataForSelection()
})

watch([stats, creditRanking, complianceItems], () => {
  setTimeout(() => {
    initTrendChart()
    initHeatmapChart()
  }, 200)
}, { deep: true })

onMounted(() => {
  trendChartInstance?.showLoading()
  heatmapChartInstance?.showLoading()
  // 延迟初始化图表，确保 CSS Grid 布局完成容器尺寸计算
  setTimeout(() => {
    initTrendChart()
    initHeatmapChart()
  }, 300)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChartInstance?.dispose()
  heatmapChartInstance?.dispose()
  customPreviewChartInstance?.dispose()
  mainPageCustomChartInstance?.dispose()
})
</script>

<style scoped>
.compliance-report-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 1200px) {
  .stats-row {
    gap: 16px;
    padding: 16px 20px;
  }
  .stat-divider {
    height: 32px;
  }
}

@media (max-width: 768px) {
  .stat-divider {
    display: none;
  }
}

.content-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

@media (max-width: 1400px) {
  .content-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.report-preview {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 20px;
}

@media (max-width: 1200px) {
  .report-preview {
    padding: 16px;
  }
  .report-content {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .report-preview {
    padding: 12px;
  }
  .report-content {
    padding: 12px;
  }
}

.report-date {
  font-size: 13px;
  color: #9CA3AF;
}

.report-content {
  background: #FFFFFF;
  border: 1px solid #E8EAED;
  border-radius: 8px;
  padding: 20px;
}

.report-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #1E5AA8;
}

.report-header h1 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #1A1A2E;
}

.report-header p {
  margin: 3px 0;
  font-size: 13px;
  color: #6B7280;
}

.report-section {
  margin-bottom: 24px;
}

.report-section:last-child {
  margin-bottom: 0;
}

.report-section h2 {
  font-size: 15px;
  color: #1A1A2E;
  margin: 0 0 12px;
  font-weight: 600;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}

.overview-item {
  text-align: center;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.overview-value {
  display: block;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 700;
  color: #1E5AA8;
}

.overview-label {
  font-size: 13px;
  color: #6B7280;
  margin-top: 4px;
  display: block;
}

@media (max-width: 768px) {
  .overview-item {
    padding: 12px;
  }
}

/* 状态标签样式 */
.status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.compliant { background: #DCFCE7; color: #166534; }
.status-badge.warning { background: #FEF3C7; color: #92400E; }

/* 预警样式 */
.alert-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-icon.high { background: #FEE2E2; color: #991B1B; }
.alert-icon.medium { background: #FEF3C7; color: #92400E; }
.alert-icon.low { background: #DBEAFE; color: #1E40AF; }

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.alert-desc {
  font-size: 13px;
  color: #6B7280;
}

.no-alert {
  text-align: center;
  padding: 20px;
  background: #F7F8FA;
  border-radius: 8px;
  color: #6B7280;
  font-size: 13px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 1200px) {
  .chart-card {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .chart-card {
    padding: 12px;
  }
}

.chart {
  height: 180px;
}

.type-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-fill {
  flex: 1;
  height: 12px;
  border-radius: 6px;
}

.bar-label {
  width: 80px;
  font-size: 13px;
  color: #6B7280;
  flex-shrink: 0;
}

.quick-export {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;      /* 确保子元素拉伸填满宽度 */
}

.quick-export :deep(.el-button) {
  display: flex;             /* 覆盖 inline-flex */
  justify-content: center;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  box-sizing: border-box;   /* 确保 padding 不撑破宽度 */
}

/* 学分排名列表 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.rank-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
}

.rank-num.top3 {
  background: #1E5AA8;
  color: #fff;
}

.rank-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rank-name {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.rank-class {
  font-size: 11px;
  color: #9CA3AF;
}

.rank-score {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
}

/* 预警学员列表 */

.alert-badge {
  background: #FEE2E2;
  color: #991B1B;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #F7F8FA;
  border-radius: 8px;
}

.warning-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon.login {
  background: #FEE2E2;
  color: #991B1B;
}

.warning-icon.credit {
  background: #FEF3C7;
  color: #92400E;
}

.warning-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.warning-name {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.warning-desc {
  font-size: 12px;
  color: #6B7280;
}

/* 热力图迷你版 */
.heatmap-mini {
  height: 160px;
}

/* 教育部报表导出弹窗 */
.ministry-report-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #F7F8FA;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.report-option:hover {
  background: #F0FDF4;
}

.report-radio :deep(.el-radio) {
  margin-right: 0;
}

.report-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.report-desc {
  font-size: 12px;
  color: #6B7280;
}

.report-format {
  flex-shrink: 0;
}

.format-tag {
  background: #DCFCE7;
  color: #166534;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

/* 自定义报表构建器 */
.custom-builder-tabs :deep(.el-tabs__content) {
  padding: 16px 0;
  max-height: 500px;
  overflow-y: auto;
}

.builder-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #1E5AA8;
}

.data-source-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.source-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #F7F8FA;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.source-card:hover {
  background: #EFF6FF;
}

.source-card.selected {
  background: #EFF6FF;
  border-color: #1E5AA8;
}

.source-icon {
  font-size: 24px;
}

.source-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.source-name {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.source-desc {
  font-size: 11px;
  color: #6B7280;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.field-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #F7F8FA;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.field-card:hover {
  background: #EFF6FF;
}

.field-card.selected {
  background: #EFF6FF;
  border-color: #1E5AA8;
}

.field-name {
  font-size: 13px;
  color: #1A1A2E;
}

.field-type {
  font-size: 10px;
  color: #9CA3AF;
  background: #E5E7EB;
  padding: 2px 6px;
  border-radius: 4px;
}

.fields-order {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #F7F8FA;
  border-radius: 6px;
}

.order-num {
  width: 20px;
  height: 20px;
  background: #1E5AA8;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.order-name {
  flex: 1;
  font-size: 13px;
  color: #1A1A2E;
}

.chart-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.chart-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.chart-type-card:hover {
  background: #EFF6FF;
}

.chart-type-card.selected {
  background: #EFF6FF;
  border-color: #1E5AA8;
}

.chart-icon {
  font-size: 28px;
}

.chart-name {
  font-size: 12px;
  color: #1A1A2E;
  font-weight: 500;
}

.w-full {
  width: 100%;
}

/* 自定义报表预览 */
.preview-section {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1A1A2E;
}

.preview-date {
  font-size: 12px;
  color: #6B7280;
}

.preview-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.preview-stat-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
}

.preview-stat-num {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1E5AA8;
}

.preview-stat-label {
  font-size: 12px;
  color: #6B7280;
}

.preview-table {
  margin-bottom: 16px;
}

.preview-chart {
  height: 300px;
}

.preview-chart .chart {
  height: 100%;
}

/* 自定义报表主页显示 */
.custom-report-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: #EFF6FF;
  border-radius: 8px;
  border: 1px solid #BFDBFE;
}

.custom-report-tag {
  font-size: 12px;
  color: #1E5AA8;
  font-weight: 500;
  background: #DBEAFE;
  padding: 2px 10px;
  border-radius: 10px;
}

.custom-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .custom-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .custom-stats-grid {
    grid-template-columns: 1fr;
  }
}

.custom-stat-item {
  text-align: center;
  padding: 14px 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.custom-stat-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #1E5AA8;
}

.custom-stat-label {
  display: block;
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.main-page-custom-chart {
  height: 320px;
  background: #FAFBFC;
  border-radius: 8px;
}

/* 已保存自定义报表列表（生成报表弹窗内） */
.saved-reports-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.saved-report-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.saved-report-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #F7F8FA;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.saved-report-item:hover {
  background: #EFF6FF;
}

.saved-report-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.saved-report-name {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.saved-report-meta {
  font-size: 11px;
  color: #9CA3AF;
}
</style>