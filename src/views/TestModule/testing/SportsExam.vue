<template>
  <div class="sports-exam" v-loading="pageLoading" element-loading-text="加载考试数据中..." element-loading-background="rgba(255, 255, 255, 0.9)">
    <div class="mode-switch-container">
      <div class="mode-switch-wrapper">
        <span class="mode-label">考试模式</span>
        <el-switch v-model="examMode" @change="toggleExamMode"  />
      </div>
    </div>

    <div v-if="examMode" class="mode-banner">
      <el-alert title="体育考试模式已开启 — 移动端任务成绩将自动归属于体育考试成绩" type="warning" :closable="false" show-icon />
    </div>

    <div class="page-header">
      <div class="header-filters">
        <el-select v-model="filterBatch" placeholder="选择批次" clearable style="width: 160px">
          <el-option v-for="batch in examBatches" :key="batch.id" :label="batch.name" :value="batch.id" />
        </el-select>
        <el-select v-model="filterSemester" placeholder="选择学期" clearable style="width: 140px">
          <el-option label="2026春季学期" value="2026-spring" />
          <el-option label="2026秋季学期" value="2026-autumn" />
          <el-option label="2023春季学期" value="2023-spring" />
          <el-option label="2023秋季学期" value="2023-autumn" />
        </el-select>
        <el-select v-model="filterGrade" placeholder="选择年级" clearable style="width: 120px">
          <el-option label="全部年级" value="all" />
          <el-option label="一年级" value="一年级" />
          <el-option label="二年级" value="二年级" />
          <el-option label="三年级" value="三年级" />
          <el-option label="四年级" value="四年级" />
          <el-option label="五年级" value="五年级" />
          <el-option label="六年级" value="六年级" />
        </el-select>
        <el-select v-model="filterEvent" placeholder="选择项目" clearable style="width: 160px">
          <el-option label="立定跳远" value="立定跳远" />
          <el-option label="仰卧起坐" value="仰卧起坐" />
          <el-option label="坐位体前屈" value="坐位体前屈" />
          <el-option label="50米跑" value="50米跑" />
          <el-option label="一分钟跳绳" value="一分钟跳绳" />
          <el-option label="引体向上" value="引体向上" />
          <el-option label="800米跑" value="800米跑" />
          <el-option label="1000米跑" value="1000米跑" />
          <el-option label="肺活量" value="肺活量" />
          <el-option label="身高体重" value="身高体重" />
        </el-select>
        <el-select v-model="filterClass" placeholder="选择班级" clearable style="width: 140px">
          <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
        </el-select>
        <el-input v-model="filterStudentId" placeholder="学号搜索" clearable style="width: 140px" />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportResults">导出成绩</el-button>
        <el-button :icon="Document" @click="showScoreTemplateDownload = true">导入成绩模板</el-button>
        <el-button :icon="Warning" @click="showViolationDialog = true">违规记录</el-button>
        <el-button :icon="Document" @click="openReportExport">生成运动处方报告</el-button>
        <el-button :icon="Refresh" @click="openMigration">成绩迁移</el-button>
        <el-button :icon="Histogram" @click="showSummaryReport = true">汇总报表</el-button>
        <el-button :icon="FolderAdd" @click="showBatchManager = true">批次管理</el-button>
        <el-button :icon="Setting" @click="showScoreConfig = true">评分标准</el-button>
        <el-button type="primary" @click="showArchiveDialog = true">成绩归档</el-button>
        <el-button type="primary" :icon="User" @click="startFaceRecognition">面部识别</el-button>
        <el-button type="primary" :icon="VideoPlay" @click="startExam">快速开始</el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ examStats.total }}</span>
        <span class="stat-label">考试总人数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ examStats.excellent }}</span>
        <span class="stat-label">优秀人数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ examStats.good }}</span>
        <span class="stat-label">良好人数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ examStats.pass }}</span>
        <span class="stat-label">及格人数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #E85D4E">{{ examStats.fail }}</span>
        <span class="stat-label">不及格人数</span>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">成绩分布</span>
        </div>
        <div ref="gradeChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">项目进度</span>
        </div>
        <div ref="progressChart" class="chart"></div>
      </div>
    </div>

    <ExamTable
      :data="filteredExams"
      :columns="examColumns"
      title="考试记录"
      search-placeholder="搜索学生姓名/学号"
      :search-fields="['studentName', 'studentId']"
      @refresh="refreshData"
      @cell-edit="handleCellEdit"
    >
      <template #studentName="{ row }">
        <div class="student-name-cell">
          <span :class="{ 'name-warning': row.grade === '不及格' }">{{ row.studentName }}</span>
          <el-tag v-if="row.grade === '不及格'" size="small" type="danger" class="makeup-tag">需补测</el-tag>
          <el-tag v-if="hasViolation(row.studentId, row.event)" size="small" type="danger" effect="dark" class="violation-badge">违规</el-tag>
        </div>
      </template>

      <template #schoolGrade="{ row }">
        <span>{{ (row.class || '').match(/^[一二三四五六]年级/) ? (row.class || '').match(/^[一二三四五六]年级/)[0] : '' }}</span>
      </template>

      <template #schoolClass="{ row }">
        <span>{{ (row.class || '').replace(/^[一二三四五六]年级/, '') }}</span>
      </template>

      <template #category="{ row }">
        <el-tag size="small" :type="getCategoryType(row.category)" :effect="row.category ? 'dark' : 'plain'">
          {{ row.category || '未分类' }}
        </el-tag>
      </template>

      <template #rank="{ row }">
        <span class="rank-value">{{ getRank(row) }}</span>
      </template>

      <template #score="{ row }">
        <span class="score-value">{{ row.score }}</span>
      </template>

      <template #grade="{ row }">
        <span class="grade-tag" :class="getGradeClass(row.grade)">{{ row.grade }}</span>
      </template>

      <template #bestScore="{ row }">
        <span class="best-score">{{ getBestScore(row.studentId, row.event) }}</span>
      </template>

      <template #actions="{ row }">
        <el-button text type="primary" size="small" @click="viewExamDetail(row)">详情</el-button>
        <el-button text type="primary" size="small" @click="playVideo(row)">视频回放</el-button>
        <el-button text type="danger" size="small" @click="markViolation(row)">标记违规</el-button>
      </template>
    </ExamTable>

    <ElDialog
      v-model="detailDialogVisible"
      title="考试详情"
      width="700px"
    >
      <div v-if="selectedExam" class="exam-detail">
        <div class="detail-section">
          <h4>学生信息</h4>
          <div class="detail-grid">
            <div class="grid-item">
              <span class="grid-label" >学号</span>
              <span class="grid-value">{{ selectedExam.studentId }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-label">姓名</span>
              <span class="grid-value">{{ selectedExam.studentName }}</span>
            </div>
         
            <div class="grid-item">
              <span class="grid-label">考试项目</span>
              <span class="grid-value">{{ selectedExam.event }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>考试进度</h4>
          <div class="progress-container">
            <div class="progress-header">
              <span>已考项目: {{ getStudentExamCount(selectedExam.studentId) }} / {{ totalExamEvents.length }}</span>
              <span>完成率: {{ getStudentExamProgress(selectedExam.studentId) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getStudentExamProgress(selectedExam.studentId) + '%' }"></div>
            </div>
            <div class="progress-events">
              <div v-for="event in totalExamEvents" :key="event" :class="['event-tag', isExamCompleted(selectedExam.studentId, event) ? 'completed' : 'pending']">
                {{ event }}
              </div>
            </div>
          </div>
        </div>

        <!-- 考试项目汇总列表 -->
        <div class="detail-section">
          <h4>考试项目汇总</h4>
          <div class="exam-summary-table">
            <div class="summary-header">
              <span class="summary-col event-col">项目名称</span>
              <span class="summary-col score-col">本次成绩</span>
              <span class="summary-col best-col">历史最好</span>
              <span class="summary-col grade-col">评分等级</span>
            </div>
            <div v-for="record in studentExamRecords" :key="record.event" class="summary-row">
              <span class="summary-col event-col">{{ record.event }}</span>
              <span class="summary-col score-col">{{ record.score }}{{ getUnit(record.event) }}</span>
              <span class="summary-col best-col">{{ getBestScore(selectedExam.studentId, record.event) }}{{ getUnit(record.event) }}</span>
              <span class="summary-col grade-col">
                <span :class="['grade-badge', getGradeClass(record.grade)]">{{ record.grade }}</span>
              </span>
            </div>
            <div v-if="studentExamRecords.length === 0" class="summary-empty">
              暂无考试记录
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>考试成绩</h4>
          <div class="score-display">
            <div class="score-main">
              <span class="score-value">{{ selectedExam.score }}</span>
              <span class="score-unit">{{ selectedExam.unit }}</span>
            </div>
            <div class="score-grade" :class="getGradeClass(selectedExam.grade)">
              {{ selectedExam.grade }}
            </div>
          </div>
          <div class="best-score">
            <span>历史最好成绩: {{ getBestScore(selectedExam.studentId, selectedExam.event) }} {{ selectedExam.unit }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>姿态指标</h4>
          <div class="posture-grid">
            <div class="posture-item">
              <span class="posture-label">起跳角度</span>
              <span class="posture-value good">75°</span>
            </div>
            <div class="posture-item">
              <span class="posture-label">腾空高度</span>
              <span class="posture-value good">45cm</span>
            </div>
            <div class="posture-item">
              <span class="posture-label">落地稳定性</span>
              <span class="posture-value warning">一般</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>肌群分析</h4>
          <div class="muscle-bars">
            <div class="muscle-item">
              <span class="muscle-label">下肢肌群</span>
              <el-progress :percentage="85" :color="'#1E5AA8'" :show-text="false" style="width: 120px" />
              <span class="muscle-value">85%</span>
            </div>
            <div class="muscle-item">
              <span class="muscle-label">核心肌群</span>
              <el-progress :percentage="72" :color="'#3B82F6'" :show-text="false" style="width: 120px" />
              <span class="muscle-value">72%</span>
            </div>
            <div class="muscle-item">
              <span class="muscle-label">爆发力</span>
              <el-progress :percentage="68" :color="'#F5A623'" :show-text="false" style="width: 120px" />
              <span class="muscle-value">68%</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>运动点评及建议</h4>
          <div class="comment-box">
            <div class="comment-item">
              <span class="comment-icon positive">✓</span>
              <span>起跳有力，腾空动作标准</span>
            </div>
            <div class="comment-item">
              <span class="comment-icon warning">!</span>
              <span>落地时重心偏前，建议加强平衡训练</span>
            </div>
          </div>
          <div class="suggestion-box">
            <div class="suggestion-title">个性化建议：</div>
            <div class="suggestion-content">
              1. 每天进行3组深蹲训练，增强下肢力量<br/>
              2. 练习单脚站立平衡，每次30秒<br/>
              3. 跳绳练习可以有效提升协调性
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>动作关键帧</h4>
          <div class="keyframe-list">
            <div class="keyframe-item">
              <div class="keyframe-thumb">📍</div>
              <span class="keyframe-label">准备</span>
            </div>
            <div class="keyframe-item">
              <div class="keyframe-thumb">📍</div>
              <span class="keyframe-label">起跳</span>
            </div>
            <div class="keyframe-item">
              <div class="keyframe-thumb">📍</div>
              <span class="keyframe-label">腾空</span>
            </div>
            <div class="keyframe-item">
              <div class="keyframe-thumb">📍</div>
              <span class="keyframe-label">落地</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>考试时间</h4>
          <span>{{ selectedExam.date }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="playVideo(selectedExam)">视频回放</el-button>
        <el-button @click="generateReport(selectedExam)">生成运动处方</el-button>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </ElDialog>

    <!-- 视频回放弹窗 -->
    <el-dialog
      v-model="replayVisible"
      title="考试视频回放"
      width="900px"
      destroy-on-close
    >
      <div v-if="selectedExam" class="replay-content">
        <div class="video-player-wrapper">
          <VideoPlayer
            src="/示例视频.mp4"
            :autoplay="true"
            :show-controls="true"
            :show-timeline="true"
            :show-volume="true"
            :show-fullscreen="true"
            :show-playback-rate="true"
          />
        </div>
        <div class="replay-info">
          <p><strong>学生姓名:</strong> {{ selectedExam.studentName }}</p>
          
          <p><strong>考试项目:</strong> {{ selectedExam.event }}</p>
          <p><strong>考试时间:</strong> {{ selectedExam.date }}</p>
          <p><strong>测试地点:</strong> 田径场A区</p>
          <p><strong>监考老师:</strong> 王建国</p>
          <p><strong>设备编号:</strong> T-2025-001</p>
        </div>
      </div>
    </el-dialog>

    <!-- 违规记录弹窗 -->
    <ElDialog
      v-model="showViolationDialog"
      title="违规记录"
      width="900px"
    >
      <div class="violation-dialog-header">
        <span class="violation-count">共 {{ violationRecords.length }} 条违规记录</span>
      </div>
      <ExamTable
        :data="violationRecords"
        :columns="violationColumns"
        :title="''"
        :show-header="false"
        :searchable="false"
        :show-refresh="false"
        :show-pagination="false"
        :show-selection="false"
      >
        <template #violationType="{ row }">
          <el-tag :type="getViolationTagType(row.violationType)" size="small" effect="plain">{{ row.violationType }}</el-tag>
        </template>
        <template #status="{ row }">
          <span :class="['violation-status', row.status === '已撤销' ? 'revoked' : 'active']">{{ row.status || '有效' }}</span>
        </template>
        <template #actions="{ row }">
          <el-button text type="primary" size="small" @click="viewViolationDetail(row)">查看详情</el-button>
          <el-button text type="danger" size="small" @click="removeViolation(row)">撤销</el-button>
        </template>
      </ExamTable>
      <template #footer>
        <el-button @click="showViolationDialog = false">关闭</el-button>
      </template>
    </ElDialog>

    <!-- 标记违规弹窗 -->
    <ElDialog
      v-model="showViolationMarkDialog"
      title="标记违规"
      width="520px"
    >
      <div v-if="violationMarkTarget" class="violation-mark-student">
        <span class="vm-label">学生:</span>
        <span class="vm-value">{{ violationMarkTarget.studentName }}（{{ violationMarkTarget.studentId }}）</span>
        <span class="vm-label" style="margin-left: 16px">项目:</span>
        <span class="vm-value">{{ violationMarkTarget.event }}</span>
      </div>
      <el-form :model="violationMarkForm" label-width="100px" style="margin-top: 16px">
        <el-form-item label="违规类型" required>
          <el-select v-model="violationMarkForm.violationType" placeholder="请选择违规类型" class="w-full">
            <el-option v-for="vt in currentViolationTypes" :key="vt.value" :label="vt.label" :value="vt.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-radio-group v-model="violationMarkForm.severity">
            <el-radio label="轻微">轻微</el-radio>
            <el-radio label="一般">一般</el-radio>
            <el-radio label="严重">严重</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="违规描述" required>
          <el-input
            v-model="violationMarkForm.description"
            type="textarea"
            :rows="3"
            placeholder="请描述违规行为..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showViolationMarkDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmMarkViolation">确认标记</el-button>
      </template>
    </ElDialog>

    <!-- 违规详情弹窗 -->
    <ElDialog
      v-model="showViolationDetailDialog"
      title="违规详情"
      width="600px"
    >
      <div v-if="selectedViolation" class="violation-detail">
        <div class="vd-header">
          <div class="vd-student">
            <h3>{{ selectedViolation.studentName }}</h3>
            <p>学号: {{ selectedViolation.studentId }} | 项目: {{ selectedViolation.event }}</p>
          </div>
          <el-tag :type="getViolationTagType(selectedViolation.violationType)" effect="plain">{{ selectedViolation.violationType }}</el-tag>
        </div>
        <div class="vd-info-grid">
          <div class="vd-info-item">
            <span class="vd-info-label">违规时间</span>
            <span class="vd-info-value">{{ selectedViolation.date }}</span>
          </div>
          <div class="vd-info-item">
            <span class="vd-info-label">严重程度</span>
            <span :class="['severity-tag', 'severity-' + (selectedViolation.severity || '一般')]">{{ selectedViolation.severity || '一般' }}</span>
          </div>
          <div class="vd-info-item">
            <span class="vd-info-label">标记人</span>
            <span class="vd-info-value">{{ selectedViolation.markedBy || '管理员' }}</span>
          </div>
          <div class="vd-info-item">
            <span class="vd-info-label">状态</span>
            <span :class="['violation-status', selectedViolation.status === '已撤销' ? 'revoked' : 'active']">{{ selectedViolation.status || '有效' }}</span>
          </div>
        </div>
        <div class="vd-description">
          <span class="vd-info-label">违规描述</span>
          <p>{{ selectedViolation.description || '无描述' }}</p>
        </div>
        <div v-if="selectedViolation.evidence" class="vd-evidence">
          <span class="vd-info-label">证据材料</span>
          <div class="evidence-list">
            <span class="evidence-tag" v-for="(e, i) in selectedViolation.evidence" :key="i">{{ e }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showViolationDetailDialog = false">关闭</el-button>
        <el-button v-if="selectedViolation && selectedViolation.status !== '已撤销'" type="danger" @click="removeViolation(selectedViolation); showViolationDetailDialog = false">撤销此记录</el-button>
      </template>
    </ElDialog>

    <ElDialog
      v-model="startExamDialogVisible"
      title="开始考试"
      width="450px"
      :close-on-click-modal="false"
    >
      <div class="start-exam-form">
        <el-form :model="examConfig" label-width="100px">
          <el-form-item label="考试项目">
            <el-select v-model="examConfig.event" placeholder="请选择项目">
          <el-option label="立定跳远" value="立定跳远" />
          <el-option label="仰卧起坐" value="仰卧起坐" />
          <el-option label="坐位体前屈" value="坐位体前屈" />
          <el-option label="50米跑" value="50米跑" />
          <el-option label="一分钟跳绳" value="一分钟跳绳" />
          <el-option label="引体向上" value="引体向上" />
          <el-option label="800米跑" value="800米跑" />
          <el-option label="1000米跑" value="1000米跑" />
          <el-option label="肺活量" value="肺活量" />
          <el-option label="身高体重" value="身高体重" />
            </el-select>
          </el-form-item>
          <el-form-item label="考试班级">
            <el-select v-model="examConfig.class" placeholder="请选择班级">
              <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="考试分类">
            <el-select v-model="examConfig.category" placeholder="请选择分类">
              <el-option label="体育考试" value="体育考试" />
              <el-option label="体育课堂" value="体育课堂" />
              <el-option label="运动会" value="运动会" />
              <el-option label="体育中考" value="体育中考" />
            </el-select>
          </el-form-item>
          <el-form-item label="考试模式">
            <el-radio-group v-model="examConfig.mode" disabled>
              <el-radio label="批量测试" />
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="startExamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStartExam">开始考试</el-button>
      </template>
    </ElDialog>

    <!-- 运动处方报告导出 -->
    <PdfExport 
      v-model:visible="showReportExport" 
      :report-data="reportData"
      @export-start="handleReportExportStart"
      @export-end="handleReportExportEnd"
    />

    <!-- 成绩导入模板下载 -->
    <TemplateDownload 
      v-model:visible="showScoreTemplateDownload" 
      template-type="score"
      :custom-templates="customTemplates"
    />

    <!-- 成绩迁移配置 -->
    <ElDialog 
      v-model="showMigration"
      title="成绩迁移" 
      width="600px"
    >
      <ScoreMigration />
      <template #footer>
        <el-button @click="showMigration = false">关闭</el-button>
      </template>
    </ElDialog>

    <!-- 面部识别开启考试对话框 -->
    <ElDialog
      v-model="faceRecognitionVisible"
      title="面部识别开启考试"
      width="550px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="face-recognition-container">
        <div class="camera-frame">
          <div class="camera-preview">
            <div v-if="recognitionStatus === 'success' && recognizedStudent" class="recognized-face">
              <img :src="recognizedStudent.avatar" :alt="recognizedStudent.name" class="face-image" />
            </div>
            <div v-else-if="recognitionStatus === 'scanning'" class="scanning-animation">
              <div class="scan-circle"></div>
            </div>
            <el-icon v-else :size="64" color="#9CA3AF"><User /></el-icon>
            <p>{{ recognitionStatusText }}</p>
          </div>
          <div v-if="recognitionStatus === 'scanning'" class="scan-line"></div>
          <div v-if="recognitionStatus === 'scanning'" class="scan-border"></div>
        </div>
        <div class="recognition-status-bar">
          <span :class="['status-dot', recognitionStatus]"></span>
          <span>{{ recognitionStatusText }}</span>
          <span v-if="recognitionStatus === 'success'" class="recognition-time">识别耗时: {{ recognitionTime }}ms</span>
        </div>
        <div v-if="recognizedStudent" class="recognized-student">
          <img :src="recognizedStudent.avatar" :alt="recognizedStudent.name" class="student-avatar" />
          <div class="student-info">
            <h4>{{ recognizedStudent.name }}</h4>
            <p>{{ recognizedStudent.class }} · {{ recognizedStudent.studentId }}</p>
          </div>
        </div>
        <div v-if="recognizedStudent" class="recognition-actions">
          <el-button size="small" @click="saveRecognitionSnapshot">保存识别截图</el-button>
          <el-button size="small" type="primary" @click="viewRecognitionRecords">查看识别记录</el-button>
        </div>
      </div>
      <template #footer>
        <el-button v-if="recognitionStatus !== 'success' && recognitionStatus !== 'scanning'" @click="faceRecognitionVisible = false">取消</el-button>
        <el-button v-if="recognitionStatus === 'idle'" type="primary" :loading="recognitionStatus === 'scanning'" @click="startRecognitionProcess">开始识别</el-button>
        <el-button v-if="recognitionStatus === 'scanning'" disabled>识别中...</el-button>
        <el-button v-if="recognitionStatus === 'success'" type="primary" @click="confirmExamWithFace">确认开始考试</el-button>
      </template>
    </ElDialog>

    <!-- 识别记录对话框 -->
    <ElDialog
      v-model="recognitionRecordsVisible"
      title="面部识别记录"
      width="700px"
    >
      <div class="records-container">
        <div class="records-filter">
          <el-input v-model="recordsSearch" placeholder="搜索学生姓名/学号" style="width: 200px" />
          <el-select v-model="recordsStatus" placeholder="筛选状态">
            <el-option label="全部" value="" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </div>
        <ExamTable
          :data="filteredRecognitionRecords"
          :columns="recognitionColumns"
          :searchable="false"
          :show-pagination="true"
          :default-page-size="10"
        >
          <template #status="{ row }">
            <span :class="['status-tag', row.status]">{{ row.status === 'success' ? '成功' : '失败' }}</span>
          </template>
          <template #actions="{ row }">
            <el-button v-if="row.snapshot" size="small" @click="viewSnapshot(row)">查看截图</el-button>
            <span v-else>无截图</span>
          </template>
        </ExamTable>
      </div>
    </ElDialog>

    <!-- 截图查看对话框 -->
    <ElDialog
      v-model="snapshotVisible"
      title="识别截图"
      width="500px"
    >
      <div class="snapshot-viewer">
        <div class="snapshot-image-container">
          <img v-if="currentSnapshot" :src="currentSnapshot.image" alt="识别截图" class="snapshot-image" />
          <div class="snapshot-info">
            <p>学生: {{ currentSnapshot?.studentName }}</p>
            <p>学号: {{ currentSnapshot?.studentId }}</p>
            <p>时间: {{ currentSnapshot?.time }}</p>
          </div>
        </div>
        <div class="certification-badge">
          <span>✓ 第三方检验检测机构认证</span>
        </div>
      </div>
    </ElDialog>

    <!-- 批次管理对话框 -->
    <ElDialog
      v-model="showBatchManager"
      title="考试批次管理"
      width="700px"
    >
      <div class="batch-manager">
        <div class="batch-actions">
          <el-button type="primary" @click="showAddBatch = true">新建批次</el-button>
          <el-button @click="refreshBatches">刷新</el-button>
        </div>
        <ExamTable
          :data="examBatches"
          :columns="batchColumns"
          :searchable="false"
          :show-pagination="false"
        >
          <template #status="{ row }">
            <span :class="['batch-status', row.status]">{{ getBatchStatusText(row.status) }}</span>
          </template>
          <template #actions="{ row }">
            <el-button size="small" @click="editBatch(row)">编辑</el-button>
            <el-button size="small" type="primary" @click="viewBatchDetail(row)">详情</el-button>
            <el-button v-if="row.status !== 'completed'" size="small" type="danger" @click="deleteBatch(row)">删除</el-button>
          </template>
        </ExamTable>
      </div>
    </ElDialog>

    <!-- 新建/编辑批次对话框 -->
    <ElDialog
      v-model="showAddBatch"
      :title="editingBatch ? '编辑批次' : '新建批次'"
      width="500px"
    >
      <div class="batch-form">
        <el-form :model="batchForm" label-width="100px">
          <el-form-item label="批次名称" required>
            <el-input v-model="batchForm.name" placeholder="请输入批次名称" />
          </el-form-item>
          <el-form-item label="考试场景" required>
            <el-select v-model="batchForm.scene">
              <el-option label="体育课堂" value="class" />
              <el-option label="运动会" value="sportsmeeting" />
              <el-option label="体育考试" value="exam" />
              <el-option label="体育中考" value="highschool" />
            </el-select>
          </el-form-item>
          <el-form-item label="学期" required>
            <el-select v-model="batchForm.semester">
              <el-option label="2026春季学期" value="2026-spring" />
              <el-option label="2026秋季学期" value="2026-autumn" />
            </el-select>
          </el-form-item>
          <el-form-item label="考试项目">
            <el-select v-model="batchForm.events" multiple placeholder="请选择考试项目">
              <el-option label="立定跳远" value="立定跳远" />
              <el-option label="仰卧起坐" value="仰卧起坐" />
              <el-option label="坐位体前屈" value="坐位体前屈" />
              <el-option label="50米跑" value="50米跑" />
              <el-option label="跳绳" value="跳绳" />
              <el-option label="引体向上" value="引体向上" />
              <el-option label="800米跑" value="800米跑" />
              <el-option label="1000米跑" value="1000米跑" />
            </el-select>
          </el-form-item>
          <el-form-item label="关联班级">
            <el-select v-model="batchForm.classes" multiple placeholder="请选择班级">
              <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showAddBatch = false">取消</el-button>
        <el-button type="primary" @click="saveBatch">保存</el-button>
      </template>
    </ElDialog>

    <!-- 评分标准配置对话框 -->
    <ElDialog
      v-model="showScoreConfig"
      title="评分标准配置"
      width="800px"
      max-height="85vh"
    >
      <ScoreConfig />
    </ElDialog>

    <!-- 汇总报表对话框 -->
    <ElDialog
      v-model="showSummaryReport"
      title="成绩汇总报表"
      width="900px"
      max-height="80vh"
      @opened="onSummaryDialogOpened"
    >
      <div class="summary-report">
        <div class="report-filters">
          <el-select v-model="reportBatch" placeholder="选择批次">
            <el-option v-for="batch in examBatches" :key="batch.id" :label="batch.name" :value="batch.id" />
          </el-select>
          <el-select v-model="reportSemester" placeholder="选择学期">
            <el-option label="全部" value="" />
            <el-option label="2026春季学期" value="2026-spring" />
            <el-option label="2026秋季学期" value="2026-autumn" />
          </el-select>
          <el-button type="primary" @click="generateSummaryReport">生成报表</el-button>
          <el-button @click="exportSummaryReport">导出报表</el-button>
        </div>
        
        <div class="report-stats">
          <div class="report-stat-card">
            <span class="report-stat-num blue">{{ summaryData.totalStudents }}</span>
            <span class="report-stat-label">参考人数</span>
          </div>
          <div class="report-stat-card">
            <span class="report-stat-num light-blue">{{ summaryData.completedStudents }}</span>
            <span class="report-stat-label">已完成人数</span>
          </div>
          <div class="report-stat-card">
            <span :class="['report-stat-num', getRateColorClass(summaryData.excellentRate)]">{{ summaryData.excellentRate }}%</span>
            <span class="report-stat-label">优秀率</span>
          </div>
          <div class="report-stat-card">
            <span :class="['report-stat-num', getRateColorClass(summaryData.goodRate)]">{{ summaryData.goodRate }}%</span>
            <span class="report-stat-label">良好率</span>
          </div>
          <div class="report-stat-card">
            <span :class="['report-stat-num', getRateColorClass(summaryData.passRate)]">{{ summaryData.passRate }}%</span>
            <span class="report-stat-label">及格率</span>
          </div>
          <div class="report-stat-card">
            <span :class="['report-stat-num', getRateColorClass(summaryData.failRate)]">{{ summaryData.failRate }}%</span>
            <span class="report-stat-label">不及格率</span>
          </div>
        </div>

        <div class="report-charts">
          <div class="chart-section">
            <h4>各项目成绩分布</h4>
            <div ref="summaryChart" class="summary-chart"></div>
          </div>
          <div class="chart-section">
            <h4>各班级完成率</h4>
            <div ref="classChart" class="summary-chart"></div>
          </div>
        </div>

        <div class="report-table-section">
          <h4>各项目成绩详情</h4>
          <ExamTable
            :data="summaryDetail"
            :columns="summaryDetailColumns"
            :searchable="false"
            :show-pagination="false"
          />
        </div>
      </div>
    </ElDialog>

    <!-- 实时考试监控面板 -->
    <ElDialog
      v-model="examMonitorVisible"
      title="考试监控"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="exam-monitor">
        <div class="monitor-left">
          <div class="video-container">
            <div class="video-wrapper">
              <el-icon :size="128" color="#333"><VideoCamera /></el-icon>
              <div class="video-overlay">
                <div class="skeleton-overlay">
                  <div class="skeleton-line" style="top: 20%; left: 30%; width: 40%;"></div>
                  <div class="skeleton-line" style="top: 40%; left: 20%; width: 60%;"></div>
                  <div class="skeleton-line" style="top: 60%; left: 25%; width: 50%;"></div>
                </div>
              </div>
              <div v-if="isViolationDetected" class="violation-warning">
                <span class="warning-icon">⚠️</span>
                <span>{{ violationMessage }}</span>
              </div>
            </div>
            <div class="video-controls">
              <el-button size="small" :icon="VideoPlay" @click="toggleRecording">
                {{ isRecording ? '暂停' : '开始' }}
              </el-button>
              <el-button size="small" :icon="Refresh" @click="resetDetection">重置</el-button>
            </div>
          </div>
        </div>
        <div class="monitor-right">
          <div class="monitor-section">
            <h4>当前考生</h4>
            <div v-if="currentExamStudent" class="current-student">
              <img :src="currentExamStudent.avatar" :alt="currentExamStudent.name" class="mini-avatar" />
              <div class="student-detail">
                <span class="student-name">{{ currentExamStudent.name }}</span>
                <span class="student-class">{{ currentExamStudent.class }}</span>
              </div>
            </div>
          </div>
          <div class="monitor-section">
            <h4>实时成绩</h4>
            <div class="real-time-score">
              <span class="score-number">{{ currentScore }}</span>
              <span class="score-unit">米</span>
            </div>
          </div>
          <div class="monitor-section">
            <h4>动作分析</h4>
            <div class="action-analysis">
              <div class="analysis-item">
                <span class="analysis-label">姿态角度</span>
                <span class="analysis-value good">75°</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">速度</span>
                <span class="analysis-value good">3.2m/s</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">腾空高度</span>
                <span class="analysis-value warning">42cm</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">落地稳定性</span>
                <span class="analysis-value good">稳定</span>
              </div>
            </div>
          </div>
          <div class="monitor-section">
            <h4>违规检测</h4>
            <div class="violation-detection">
              <div :class="['detection-item', isViolationDetected ? 'violation' : 'normal']">
                <span class="detection-icon">{{ isViolationDetected ? '✗' : '✓' }}</span>
                <span>{{ isViolationDetected ? violationMessage : '检测正常' }}</span>
              </div>
            </div>
            <div class="violation-types">
              <h5>违规类型</h5>
              <div class="violation-tags">
                <span v-for="type in violationTypes" :key="type.value" 
                      :class="['violation-tag', selectedViolationType === type.value ? 'selected' : '']"
                      @click="selectedViolationType = type.value">
                  {{ type.label }}
                </span>
              </div>
            </div>
          </div>
          <div class="monitor-actions">
            <el-button type="danger" @click="markCurrentViolation">标记违规</el-button>
            <el-button type="primary" @click="finishCurrentExam">完成测试</el-button>
          </div>
        </div>
      </div>
    </ElDialog>

    <!-- 成绩归档弹窗 -->
    <el-dialog v-model="showArchiveDialog" title="成绩归档管理" width="800px" :close-on-click-modal="false">
      <div class="archive-manager">
        <div class="archive-actions">
          <el-button type="primary" @click="archiveScores">将非考试成绩归档到考试成绩</el-button>
          <el-button @click="loadArchiveRecords">刷新</el-button>
        </div>
        <el-table :data="archiveRecords" style="width: 100%; margin-top: 16px" max-height="400">
          <el-table-column prop="studentName" label="学生" width="100" />
          <el-table-column prop="class" label="班级" width="120" />
          <el-table-column prop="event" label="项目" width="120" />
          <el-table-column prop="score" label="成绩" width="100" />
          <el-table-column prop="grade" label="等级" width="80" />
          <el-table-column prop="originalCategory" label="原始类别" width="120" />
          <el-table-column prop="archivedDate" label="归档日期" width="120" />
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeArchive(scope.$index)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="archiveRecords.length === 0" style="text-align: center; padding: 30px; color: #9CA3AF;">
          暂无归档记录
        </div>
      </div>
    </el-dialog>
    
    <!-- 数据加载蒙版 -->
    <LoadingOverlay 
      :visible="pushLoading" 
      text="正在加载考试数据..." 
      subText="首次加载可能需要几秒"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import { Download, VideoPlay, Document, User, Refresh, Histogram, FolderAdd, VideoCamera, Setting, Warning } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import echarts from '@/utils/echarts'
import store from '../../store/global'
import { getSchoolMockData } from '../../utils/mockDataLoader'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { isInterestClass, getMatchingStudentIds } from '@/utils/interestClassFilter'
import PdfExport from '@/components/export/PdfExport.vue'
import TemplateDownload from '@/components/export/TemplateDownload.vue'
import ExamTable from '../../components/table/ExamTable.vue'
import ScoreMigration from '@/components/config/ScoreMigration.vue'
import VideoPlayer from '@/components/media/VideoPlayer.vue'
import ScoreConfig from '@/components/config/ScoreConfig.vue'
import { useOperationLog } from '@/composables/useOperationLog'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { MOCK_CUSTOM_TEMPLATES } from '@/data/mockData'
import { createSeededRandom } from '@/utils/seededRandom'
import { useSportsData } from '@/composables/useSportsData'
import sportsApi, { transformPushList } from '@/utils/daiweiPushApi'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'

const { addLog } = useOperationLog('exam')

// 获取学校数据
const schoolData = computed(() => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return getSchoolMockData(schoolId)
})

const schoolProfile = computed(() => getSchoolProfile(store.state.school.id || 'hailin-second-primary'))
const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// 运动推送数据
const sportsData = useSportsData()
const pushData = ref([])
const pushLoading = ref(true)
const pushDataLoaded = ref(false)
const pageLoading = ref(true)

// Mock 数据兜底
const mockExamData = computed(() => {
  const mockData = getSchoolMockData(schoolId.value)
  const students = mockData.students || []
  const results = []
  for (let i = 0; i < Math.min(30, students.length); i++) {
    const s = students[i]
    const score = 60 + Math.floor(Math.random() * 40)
    results.push({
      id: `mock_exam_${i}`,
      personId: s.id,
      score: score,
      duration: Math.floor(Math.random() * 120 + 60),
      sportType: [1, 2, 6, 7, 10, 11][Math.floor(Math.random() * 6)],
      receivedAt: Date.now() - Math.random() * 7 * 86400000,
      studentName: s.name,
      className: s.grade + '班',
      gender: s.gender
    })
  }
  return results
})

// 加载推送数据
const loadPushData = async () => {
  pushLoading.value = true
  try {
    const schoolIdVal = schoolId.value
    const res = await sportsApi.getList(schoolIdVal, { limit: 500 })
    if (res.code === '0' && res.data?.list?.length > 0) {
      pushData.value = transformPushList(res.data.list)
      pushDataLoaded.value = true
    } else {
      // API 返回空，使用 Mock 数据
      pushData.value = mockExamData.value
      pushDataLoaded.value = false
    }
  } catch (e) {
    console.warn('推送服务不可用，使用本地Mock数据')
    pushData.value = mockExamData.value
    pushDataLoaded.value = false
  } finally {
    pushLoading.value = false
    pageLoading.value = false
  }
}

const customTemplates = usePersistedRef(
  computed(() => `smart_pe_custom_templates_${schoolId.value}`),
  [...MOCK_CUSTOM_TEMPLATES]
)

// 将推送数据转换为考试记录格式
const transformPushDataToExamResults = () => {
  const studentsArr = schoolData.value?.students || []
  const result = []
  let idx = 0
  
  for (const record of pushData.value) {
    for (const item of (record.items || [])) {
      const student = studentsArr.find(s => s.id === item.personId) || studentsArr[idx % Math.max(1, studentsArr.length)]
      const score = item.score || Math.floor(Math.random() * 30 + 60)
      const grade = score >= 85 ? '优秀' : score >= 70 ? '良好' : score >= 60 ? '及格' : '不及格'
      const eventName = record.sportTypeName || '综合运动'
      const classInfo = student?.class || '未知班级'
      
      result.push({
        id: `push_${record.id}_${item.personId}_${idx}`,
        studentId: student?.id || item.personId || `2026${String(idx + 1).padStart(3, '0')}`,
        studentName: student?.name || `学生${idx + 1}`,
        class: classInfo,
        event: eventName,
        category: record.modeName || '考试',
        score: `${score}`,
        grade,
        unit: record.sportTypeUnit || '分',
        date: record.receivedAt || new Date().toISOString(),
        semester: '2026春季学期',
        batch: '2026年第一次考试',
        bestScore: `${score}`,
        rank: 0,
        duration: item.duration || 0,
        violation: false
      })
      idx++
    }
  }
  
  return result
}

const examResults = computed(() => {
  const base = schoolData.value?.examResults || []
  
  let migrated = []
  try {
    const raw = sessionStorage.getItem('smart_pe_migrated_records')
    if (raw) {
      migrated = JSON.parse(raw).filter(m => m.type === 'exam').map(m => m.record)
    }
  } catch { /* ignore */ }
  
  let generated = []
  try {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const raw = sessionStorage.getItem(`exam_results_${schoolId}`)
    if (raw) {
      generated = JSON.parse(raw)
    }
  } catch { /* ignore */ }
  
  // 如果有推送数据，优先使用推送数据
  const pushResults = pushDataLoaded.value ? transformPushDataToExamResults() : []
  
  return [...base, ...migrated, ...pushResults, ...generated]
})





const filterEvent = usePersistedRef(`sports_exam_filter_event_${store.state.school.id || 'hailin-second-primary'}`, '')
const filterClass = usePersistedRef(`sports_exam_filter_class_${store.state.school.id || 'hailin-second-primary'}`, '')
const dateRange = usePersistedRef(`sports_exam_date_range_${store.state.school.id || 'hailin-second-primary'}`, [])
const gradeChart = ref(null)
const progressChart = ref(null)
let gradeChartInstance = null
let progressChartInstance = null

const detailDialogVisible = ref(false)
const selectedExam = ref(null)
const startExamDialogVisible = ref(false)
const router = useRouter()
const showReportExport = ref(false)
const showMigration = ref(false)
const replayVisible = ref(false)
const showScoreConfig = ref(false)
const showViolationDialog = ref(false)
const showScoreTemplateDownload = ref(false)

// 违规记录表格列配置
const violationColumns = ref([
  { prop: 'studentName', label: '学生姓名', minWidth: '100' },
  { prop: 'studentId', label: '学号', minWidth: '120' },
  { prop: 'event', label: '考试项目', minWidth: '100' },
  { prop: 'violationType', label: '违规类型', minWidth: '110', slot: 'violationType' },
  { prop: 'date', label: '违规时间', minWidth: '140' },
  { prop: 'status', label: '状态', minWidth: '70', slot: 'status' },
  { prop: 'description', label: '违规描述', minWidth: '180' },
])

// 违规记录数据
const violationRecords = usePersistedRef(`sports_exam_violation_records_${store.state.school.id || 'hailin-second-primary'}`,
  (schoolProfile.value.sportsExam.violationRecords || []).map(r => ({
    studentName: r.studentName,
    studentId: r.studentId,
    event: '',
    violationType: r.type,
    date: r.time,
    description: r.description,
    severity: '一般',
    status: r.status === '已处理' ? '有效' : r.status,
    markedBy: r.handler || '管理员'
  }))
)

// 标记违规弹窗状态
const showViolationMarkDialog = ref(false)
const violationMarkTarget = ref(null)
const violationMarkForm = ref({ violationType: '', severity: '一般', description: '' })

// 违规详情弹窗状态
const showViolationDetailDialog = ref(false)
const selectedViolation = ref(null)

// 根据考试项目动态返回违规类型选项
const currentViolationTypes = computed(() => {
  const event = violationMarkTarget.value?.event || ''
  const eventViolationMap = {
    '立定跳远': [{ value: 'line', label: '踩线' }, { value: 'singleFoot', label: '单脚跳' }, { value: 'outOfBounds', label: '出界' }],
    '仰卧起坐': [{ value: 'noHands', label: '未抱头' }, { value: 'noTouchKnee', label: '未触膝' }, { value: 'noLieFlat', label: '未躺平' }],
    '坐位体前屈': [{ value: 'legBend', label: '腿弯曲' }, { value: 'singleHand', label: '单手前驱' }, { value: 'rush', label: '加速冲击' }],
    '50米跑': [{ value: 'line', label: '踩线' }, { value: 'falseStart', label: '抢跑' }, { value: 'outOfLane', label: '串道' }],
    '一分钟跳绳': [{ value: 'stepJump', label: '垫脚跳' }, { value: 'singleHandRope', label: '单手甩绳' }, { value: 'cheat', label: '作弊' }],
    '引体向上': [{ value: 'swing', label: '摆动借力' }, { value: 'noOverBar', label: '未过杠' }],
    '800米跑': [{ value: 'falseStart', label: '抢跑' }, { value: 'outOfLane', label: '串道' }],
    '1000米跑': [{ value: 'falseStart', label: '抢跑' }, { value: 'outOfLane', label: '串道' }],
    '肺活量': [{ value: 'other', label: '其他' }],
    '身高体重': [{ value: 'other', label: '其他' }]
  }
  return eventViolationMap[event] || [
    { value: 'line', label: '踩线' }, { value: 'falseStart', label: '抢跑' },
    { value: 'noHands', label: '未抱头' }, { value: 'singleFoot', label: '单脚跳' },
    { value: 'outOfBounds', label: '出界' }, { value: 'cheat', label: '作弊' },
    { value: 'other', label: '其他' }
  ]
})

// 判断某学生某项目是否有有效违规记录
const hasViolation = (studentId, event) => {
  return violationRecords.value.some(r =>
    r.studentId === studentId && r.event === event && r.status !== '已撤销'
  )
}

// 获取违规类型标签颜色
const getViolationTagType = (type) => {
  const map = {
    '踩线': 'warning', '抢跑': 'danger', '未抱头': 'warning', '单脚跳': 'warning',
    '出界': 'danger', '作弊': 'danger', '动作不标准': 'warning', '未触膝': 'warning',
    '未躺平': 'warning', '腿弯曲': 'warning', '单手前驱': 'warning', '加速冲击': 'info',
    '垫脚跳': 'warning', '单手甩绳': 'warning', '摆动借力': 'warning', '未过杠': 'warning',
    '串道': 'danger', '其他': 'info'
  }
  return map[type] || 'info'
}

// 标记违规 — 打开表单弹窗
const markViolation = (exam) => {
  violationMarkTarget.value = exam
  violationMarkForm.value = { violationType: '', severity: '一般', description: '' }
  showViolationMarkDialog.value = true
}

// 确认标记违规 — 持久化记录
const confirmMarkViolation = () => {
  if (!violationMarkForm.value.violationType) {
    ElMessage.warning('请选择违规类型')
    return
  }
  if (!violationMarkForm.value.description.trim()) {
    ElMessage.warning('请填写违规描述')
    return
  }
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  violationRecords.value.unshift({
    studentName: violationMarkTarget.value.studentName,
    studentId: violationMarkTarget.value.studentId,
    event: violationMarkTarget.value.event,
    violationType: violationMarkForm.value.violationType,
    date: dateStr,
    description: violationMarkForm.value.description,
    severity: violationMarkForm.value.severity,
    status: '有效',
    markedBy: '管理员'
  })
  showViolationMarkDialog.value = false
  addLog('标记违规', '', `标记考试违规`)
  ElMessage.success(`已标记 ${violationMarkTarget.value.studentName} 的考试为违规`)
}

// 查看违规详情
const viewViolationDetail = (row) => {
  selectedViolation.value = row
  showViolationDetailDialog.value = true
}

// 撤销违规标记（改为标记已撤销，不删除数据）
const removeViolation = (row) => {
  ElMessageBox.confirm(
    `确定要撤销 ${row.studentName} 的违规标记吗？撤销后记录仍会保留但标记为"已撤销"。`,
    '撤销确认',
    {
      confirmButtonText: '确定撤销',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = '已撤销'
    ElMessage.success('违规标记已撤销')
  }).catch(() => { ElMessage.error('撤销违规标记失败，请重试') })
}

const openReportExport = () => {
  reportData.value = {
    studentName: '陈思语',
    className: '四年级5班',
    studentId: '2023045',
    scores: {
      '立定跳远': '2.35米',
      '50米跑': '7.8秒',
      '坐位体前屈': '15.2厘米',
      '仰卧起坐': '45个'
    },
    recommendation: '根据您的测试成绩，建议加强下肢力量训练，每天进行3组深蹲练习，每组15次。同时注意柔韧性训练，每周进行2次瑜伽或拉伸练习。'
  }
  showReportExport.value = true
}

const openMigration = () => {

  showMigration.value = true
 
}
// 分页
const currentPage = usePersistedRef(`sports_exam_current_page_${store.state.school.id || 'hailin-second-primary'}`, 1)
const pageSize = usePersistedRef(`sports_exam_page_size_${store.state.school.id || 'hailin-second-primary'}`, 12)

const examConfig = usePersistedRef(`sports_exam_config_${store.state.school.id || 'hailin-second-primary'}`, {
  event: '',
  class: '',
  category: '',
  mode: '批量测试'
})

// 面部识别相关
const faceRecognitionVisible = ref(false)
const recognitionStatus = ref('idle')
const recognitionStatusText = ref('等待识别')
const recognizedStudent = ref(null)
const recognitionTime = ref(0)
const recognitionRecordsVisible = ref(false)
const recordsSearch = ref('')
const recordsStatus = ref('')
const snapshotVisible = ref(false)
const currentSnapshot = ref(null)

// 模拟识别记录数据
const _recogRandom = createSeededRandom((store.state.school.id || 'hailin-second-primary') + '_recognitionRecords')
const recognitionRecords = usePersistedRef(`sports_exam_recognition_records_${store.state.school.id || 'hailin-second-primary'}`,
  (schoolProfile.value.sportsExam.recognitionRecords || []).map(r => ({
    id: r.id,
    time: r.time,
    studentName: r.studentName,
    studentId: '',
    className: r.className,
    status: r.status === 'warning' ? 'failed' : r.status,
    duration: Math.floor(_recogRandom() * 800 + 1700),
    snapshot: r.status === 'success'
  }))
)

const filteredRecognitionRecords = computed(() => {
  let result = [...recognitionRecords.value]
  if (recordsSearch.value) {
    const search = recordsSearch.value.toLowerCase()
    result = result.filter(r => r.studentName.toLowerCase().includes(search) || r.studentId.includes(search))
  }
  if (recordsStatus.value) {
    result = result.filter(r => r.status === recordsStatus.value)
  }
  return result
})

const recognitionColumns = ref([
  { prop: 'time', label: '识别时间', minWidth: '160' },
  { prop: 'studentName', label: '学生姓名' },
  { prop: 'studentId', label: '学号',minWidth:'240' },
  { prop: 'className', label: '班级' },
  { slot: 'status', label: '状态', minWidth: '100' },
  { prop: 'duration', label: '耗时(ms)', minWidth: '100' },
])

// 考试监控相关
const examMonitorVisible = ref(false)
const currentExamStudent = ref(null)
const isRecording = ref(false)
const isViolationDetected = ref(false)
const violationMessage = ref('')
const currentScore = ref(0)
const selectedViolationType = ref('')
let scoreInterval = null

// 违规类型
const violationTypes = [
  { value: 'line', label: '踩线' },
  { value: 'falseStart', label: '抢跑' },
  { value: 'noHands', label: '未抱头' },
  { value: 'singleFoot', label: '单脚跳' },
  { value: 'outOfBounds', label: '出界' },
  { value: 'cheat', label: '作弊' },
  { value: 'other', label: '其他' }
]

// 批次管理相关
const showBatchManager = ref(false)
const showAddBatch = ref(false)
const editingBatch = ref(null)
const examBatches = ref(
  (schoolProfile.value.sportsExam.examBatches || []).map(b => ({
    id: b.id,
    name: b.name,
    scene: 'exam',
    semester: '2026-spring',
    status: b.status,
    studentCount: b.totalStudents,
    completedCount: b.completedStudents,
    createTime: b.startTime || ''
  }))
)

const batchForm = ref({
  name: '',
  scene: 'exam',
  semester: '2026-spring',
  events: [],
  classes: []
})

const batchColumns = ref([
  { prop: 'name', label: '批次名称' },
  { prop: 'scene', label: '考试场景' },
  { prop: 'semester', label: '学期' },
  { slot: 'status', label: '状态', minWidth: '100' },
  { prop: 'studentCount', label: '参考人数', minWidth: '100' },
  { prop: 'completedCount', label: '已完成', minWidth: '100' },
  { prop: 'createTime', label: '创建时间', minWidth: '160' },
])

const summaryDetailColumns = ref([
  { prop: 'event', label: '考试项目' },
  { prop: 'total', label: '参考人数' },
  { prop: 'excellent', label: '优秀' },
  { prop: 'good', label: '良好' },
  { prop: 'pass', label: '及格' },
  { prop: 'fail', label: '不及格' },
  { prop: 'avgScore', label: '平均分' },
  { prop: 'maxScore', label: '最高分' },
])

// 汇总报表相关
const showSummaryReport = ref(false)
const reportBatch = ref('')
const reportSemester = ref('')
const summaryChart = ref(null)
const classChart = ref(null)
let summaryChartInstance = null
let classChartInstance = null

const summaryData = ref({
  totalStudents: schoolProfile.value.sportsExam.summaryData?.totalStudents || 0,
  completedStudents: schoolProfile.value.sportsExam.summaryData?.completedStudents || 0,
  excellentRate: schoolProfile.value.sportsExam.summaryData?.excellentRate || 0,
  goodRate: Math.round((schoolProfile.value.sportsExam.summaryData?.passRate || 0) - (schoolProfile.value.sportsExam.summaryData?.excellentRate || 0)) * 0.6,
  passRate: schoolProfile.value.sportsExam.summaryData?.passRate || 0,
  failRate: Math.round(100 - (schoolProfile.value.sportsExam.summaryData?.passRate || 0))
})

const summaryDetail = computed(() =>
  (schoolProfile.value.sportsExam.summaryDetail || []).map(d => {
    const passedNonExcellent = d.passed - d.excellent
    const good = Math.round(passedNonExcellent * 0.6)
    const pass = passedNonExcellent - good
    return {
      event: d.event,
      total: d.total,
      excellent: d.excellent,
      good,
      pass,
      fail: d.total - d.passed,
      avgScore: 0,
      maxScore: 0
    }
  })
)

// 筛选相关
const filterBatch = ref('')
const filterSemester = ref('')
const filterGrade = ref('')
const filterStudentId = ref('')

const reportData = ref({
  studentName: '',
  className: '',
  studentId: '',
  scores: {},
  recommendation: ''
})

const classList = computed(() => {
  const stored = sessionStorage.getItem(`classes_${schoolId.value}`)
  let names = []
  if (stored) {
    try {
      const classes = JSON.parse(stored)
      names = classes.map(c => c.name)
    } catch {
      names = (schoolProfile.value.sportsExam.classList || []).map(c => c.name)
    }
  } else {
    names = (schoolProfile.value.sportsExam.classList || []).map(c => c.name)
  }
  // 确保分项班/兴趣班在列表中
  const interestClasses = (schoolData.value?.classes || []).filter(c => c.type === '分项班').map(c => c.name)
  interestClasses.forEach(name => {
    if (!names.includes(name)) names.push(name)
  })
  return names
})
const examColumns = [
  { prop: 'studentId', label: '学号', minWidth: '200', fixed: 'left' },
  { prop: 'studentName', label: '姓名', minWidth: '120', slot: 'studentName' },
  { label: '年级', minWidth: '90', slot: 'schoolGrade' },
  { label: '班级', minWidth: '90', slot: 'schoolClass' },
  { prop: 'category', label: '考试分类', minWidth: '120', slot: 'category' },
  { prop: 'event', label: '考试项目', minWidth: '120' },
  { prop: 'score', label: '成绩', minWidth: '100', slot: 'score', editable: true, sortable: true },
  { prop: 'grade', label: '等级', minWidth: '90', slot: 'grade' },
  { label: '历史最好', minWidth: '100', slot: 'bestScore' },
  { label: '班级排名', minWidth: '90', slot: 'rank' },
  { prop: 'date', label: '考试日期', minWidth: '120', sortable: true }
]





const examStats = computed(() => {
  const data = examResults.value || []
  const total = data.length
  if (total === 0) return { total: 0, excellent: 0, good: 0, pass: 0, fail: 0, violationCount: 0, avgScore: 0, bestScore: 0, worstScore: 0 }
  let excellent = 0, good = 0, pass = 0, fail = 0, scoreSum = 0, best = 0, worst = 100
  data.forEach(e => {
    const score = parseFloat(e.score) || 0
    scoreSum += score
    if (score > best) best = score
    if (score < worst) worst = score
    if (e.grade === '优秀') excellent++
    else if (e.grade === '良好') good++
    else if (e.grade === '及格') pass++
    else fail++
  })
  const activeViolations = violationRecords.value.filter(r => r.status !== '已撤销').length
  return {
    total,
    excellent,
    excellentRate: ((excellent / total) * 100).toFixed(1),
    good,
    goodRate: ((good / total) * 100).toFixed(1),
    pass,
    passRate: ((pass / total) * 100).toFixed(1),
    fail,
    failRate: ((fail / total) * 100).toFixed(1),
    completed: total,
    completedRate: '100.0',
    avgScore: (scoreSum / total).toFixed(1),
    bestScore: best,
    worstScore: worst,
    avgDuration: '45分钟',
    violationCount: activeViolations
  }
})

// 所有考试项目
const totalExamEvents = ['立定跳远', '跳绳', '50米跑', '仰卧起坐', '坐位体前屈', '1000米跑', '50*8往返跑', '引体向上']

const filteredExams = computed(() => {
  let result = [...(examResults.value || [])]
  if (filterGrade.value && filterGrade.value !== 'all') {
    result = result.filter(e => e.class.includes(filterGrade.value))
  }
  if (filterEvent.value) {
    result = result.filter(e => e.event === filterEvent.value)
  }
  if (filterClass.value) {
    if (isInterestClass(filterClass.value)) {
      const allStudents = schoolData.value?.students || []
      const matchingIds = getMatchingStudentIds(filterClass.value, allStudents)
      result = result.filter(e => matchingIds.has(e.studentId))
    } else {
      result = result.filter(e => e.class === filterClass.value)
    }
  }
  if (filterStudentId.value) {
    result = result.filter(e => e.studentId.includes(filterStudentId.value))
  }
  // TODO: filterBatch/filterSemester 需要考试记录关联批次/学期字段后才能启用
  // 当前考试记录数据不含 batch/semester 属性，直接过滤会导致结果为空
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    result = result.filter(e => {
      if (!e.date) return false
      const t = new Date(e.date).getTime()
      return t >= startTime && t <= endTime
    })
  }
  return result
})



const getGradeClass = (grade) => {
  const map = { '优秀': 'grade-excellent', '良好': 'grade-good', '及格': 'grade-pass', '不及格': 'grade-fail' }
  return map[grade] || ''
}

const getBestScore = (studentId, event) => {
  const records = (examResults.value || []).filter(e => e.studentId === studentId && e.event === event)
  if (records.length === 0) return '-'
  return Math.max(...records.map(r => r.score))
}

const getCategoryType = (category) => {
  const map = { '体育考试': 'primary', '体育课堂': 'success', '运动会': 'warning', '体育中考': 'danger' }
  return map[category] || ''
}

const getRank = (row) => {
  const records = (examResults.value || []).filter(e => e.event === row.event && e.class === row.class)
  if (records.length === 0) return '-'
  const sorted = [...records].sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
  const rank = sorted.findIndex(r => r.studentId === row.studentId && r.score === row.score) + 1
  return rank || '-'
}

// 获取学生所有考试记录
const studentExamRecords = computed(() => {
  if (!selectedExam.value) return []
  return (examResults.value || []).filter(e => e.studentId === selectedExam.value.studentId)
})

// 获取项目单位
const getUnit = (event) => {
  const units = {
    '立定跳远': 'm',
    '跳绳': '次',
    '50米跑': 's',
    '仰卧起坐': '次',
    '坐位体前屈': 'cm',
    '1000米跑': 'min',
    '50*8往返跑': 's',
    '引体向上': '次'
  }
  return units[event] || ''
}

const refreshData = () => {
  filterGrade.value = ''
  filterStudentId.value = ''
  filterEvent.value = ''
  filterClass.value = ''
  dateRange.value = []
  nextTick(() => {
    initGradeChart()
    initProgressChart()
    initSummaryCharts()
  })
  ElMessage.success('数据已刷新')
}

// 处理单元格编辑事件（快速补录成绩）
const handleCellEdit = ({ row, field, value, action }) => {
  if (action === 'save' && field === 'score') {
    // 验证成绩是否为有效数字
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      ElMessage.error('请输入有效的成绩数值')
      return
    }
    
    // 根据项目类型验证成绩范围
    const event = row.event
    let isValid = true
    let message = ''
    
    switch (event) {
      case '立定跳远':
        isValid = numValue >= 0 && numValue <= 5
        message = '立定跳远成绩应在 0-5 米之间'
        break
      case '仰卧起坐':
        isValid = numValue >= 0 && numValue <= 100
        message = '仰卧起坐成绩应在 0-100 次之间'
        break
      case '坐位体前屈':
        isValid = numValue >= -20 && numValue <= 40
        message = '坐位体前屈成绩应在 -20 至 40 厘米之间'
        break
      case '50米跑':
        isValid = numValue >= 0 && numValue <= 30
        message = '50米跑成绩应在 0-30 秒之间'
        break
      case '一分钟跳绳':
        isValid = numValue >= 0 && numValue <= 300
        message = '一分钟跳绳成绩应在 0-300 次之间'
        break
      case '引体向上':
        isValid = numValue >= 0 && numValue <= 50
        message = '引体向上成绩应在 0-50 次之间'
        break
      case '800米跑':
      case '1000米跑':
        isValid = numValue >= 0 && numValue <= 120
        message = '长跑成绩应在 0-120 秒之间'
        break
      case '肺活量':
        isValid = numValue >= 0 && numValue <= 10000
        message = '肺活量成绩应在 0-10000 ml 之间'
        break
      case '身高体重':
        isValid = true
        break
    }
    
    if (!isValid) {
      ElMessage.error(message)
      // 恢复原始值
      row[field] = row._originalScore || row[field]
      return
    }
    
    // 保存原始值以便校验失败时恢复
    row._originalScore = row[field]
    row[field] = numValue
    
    // 根据成绩自动计算等级
    row.grade = calculateGrade(event, numValue)
    
    ElMessage.success(`成绩已更新：${row.studentName} - ${event}：${numValue}`)
  }
}

// 根据项目和成绩计算等级
const calculateGrade = (event, score) => {
  // 简单的等级计算逻辑，实际应从评分标准配置中读取
  if (event === '立定跳远') {
    if (score >= 2.0) return '优秀'
    if (score >= 1.7) return '良好'
    if (score >= 1.4) return '及格'
    return '不及格'
  }
  if (event === '仰卧起坐') {
    if (score >= 45) return '优秀'
    if (score >= 35) return '良好'
    if (score >= 25) return '及格'
    return '不及格'
  }
  if (event === '坐位体前屈') {
    if (score >= 15) return '优秀'
    if (score >= 10) return '良好'
    if (score >= 5) return '及格'
    return '不及格'
  }
  if (event === '50米跑') {
    if (score <= 8.5) return '优秀'
    if (score <= 9.5) return '良好'
    if (score <= 11) return '及格'
    return '不及格'
  }
  if (event === '一分钟跳绳') {
    if (score >= 150) return '优秀'
    if (score >= 120) return '良好'
    if (score >= 80) return '及格'
    return '不及格'
  }
  if (event === '引体向上') {
    if (score >= 15) return '优秀'
    if (score >= 10) return '良好'
    if (score >= 6) return '及格'
    return '不及格'
  }
  return '及格'
}

const getRateColorClass = (rate) => {
  if (rate >= 80) return 'blue'
  if (rate >= 60) return 'light-blue'
  if (rate >= 40) return 'orange'
  return 'red'
}

const exportResults = () => {
  // 导出CSV格式的成绩数据
  const headers = ['学号', '姓名', '班级', '考试项目', '成绩', '等级', '考试日期', '状态']
  const rows = filteredExams.value.map(exam => [
    exam.studentId,
    exam.studentName,
    exam.class,
    exam.event,
    exam.score,
    exam.grade,
    exam.date,
    exam.status === 'completed' ? '已完成' : '未完成'
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `考试成绩_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  addLog('导出成绩', '', `导出体育考试成绩`)
  ElMessage.success('考试成绩已导出')
}

const startExam = () => {
  startExamDialogVisible.value = true
}

const confirmStartExam = () => {
  if (!examConfig.value.event) {
    ElMessage.warning('请选择考试项目')
    return
  }
  if (!examConfig.value.category) {
    ElMessage.warning('请选择考试分类')
    return
  }
  
  startExamDialogVisible.value = false
  addLog('开始考试', '', `开始体育考试`)
  router.push({ 
    path: '/test-terminal', 
    query: { 
      event: examConfig.value.event, 
      mode: examConfig.value.mode,
      category: examConfig.value.category,
      className: examConfig.value.class
    } 
  })
}

const viewExamDetail = (exam) => {
  selectedExam.value = exam
  detailDialogVisible.value = true
}

const playVideo = (exam) => {
  selectedExam.value = exam
  replayVisible.value = true
}

const generateReport = (exam) => {
  reportData.value = {
    studentName: exam.studentName,
    className: exam.class,
    studentId: exam.studentId,
    scores: {
      [exam.event]: exam.score
    },
    recommendation: '根据您的测试成绩，建议加强下肢力量训练，每天进行3组深蹲练习。'
  }
  showReportExport.value = true
}

const handleReportExportStart = (data) => {
}

const handleReportExportEnd = () => {
  ElMessage.success('运动处方报告导出成功')
}

// 面部识别开启考试
const startFaceRecognition = () => {
  faceRecognitionVisible.value = true
  recognitionStatus.value = 'idle'
  recognitionStatusText.value = '等待识别'
  recognizedStudent.value = null
}

// 开始识别
const startRecognitionProcess = () => {
  recognitionStatus.value = 'scanning'
  recognitionStatusText.value = '正在识别...'
  const startTime = Date.now()
  const random = createSeededRandom(schoolId.value + '_startRecognition')
  setTimeout(() => {
    const examData = examResults.value || []
    if (examData.length === 0) {
      recognitionStatus.value = 'failed'
      recognitionStatusText.value = '未找到考试数据'
      return
    }
    
    const randomIndex = Math.floor(random() * examData.length)
    const student = examData[randomIndex]
    
    recognizedStudent.value = {
      name: student.studentName,
      class: student.class,
      studentId: student.studentId,
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
    }
    recognitionStatus.value = 'success'
    recognitionStatusText.value = '识别成功'
    recognitionTime.value = Date.now() - startTime
    
    saveRecognitionRecord(student, 'success', recognitionTime.value)
    
    router.push({ 
      path: '/test-terminal', 
      query: { 
        event: student.event || '立定跳远', 
        mode: '单人模式',
        category: 'exam',
        studentId: student.studentId,
        studentName: student.studentName,
        studentClass: student.class,
        fromRecognition: 'true'
      } 
    })
  }, 2500)
}

// 保存识别记录
const saveRecognitionRecord = (student, status, duration) => {
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  
  recognitionRecords.value.unshift({
    id: 'R' + String(recognitionRecords.value.length + 1).padStart(3, '0'),
    time: timeStr,
    studentName: student.studentName,
    studentId: student.studentId,
    className: student.class,
    status: status,
    duration: duration,
    snapshot: status === 'success'
  })
}

// 保存识别截图
const saveRecognitionSnapshot = () => {
  ElMessage.success('识别截图已保存，可在识别记录中查看')
}

// 查看识别记录
const viewRecognitionRecords = () => {
  faceRecognitionVisible.value = false
  recognitionRecordsVisible.value = true
}

// 查看截图
const viewSnapshot = (record) => {
  currentSnapshot.value = {
    image: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    studentName: record.studentName,
    studentId: record.studentId,
    time: record.time
  }
  snapshotVisible.value = true
}

// 考试进度相关方法
const getStudentExamCount = (studentId) => {
  const studentExams = (examResults.value || []).filter(e => e.studentId === studentId)
  const completedEvents = new Set(studentExams.map(e => e.event))
  return completedEvents.size
}

const getStudentExamProgress = (studentId) => {
  const count = getStudentExamCount(studentId)
  return Math.round((count / totalExamEvents.length) * 100)
}

const isExamCompleted = (studentId, event) => {
  return (examResults.value || []).some(e => e.studentId === studentId && e.event === event)
}

// 批次管理方法
const getBatchStatusText = (status) => {
  const map = { pending: '待开始', in_progress: '进行中', completed: '已完成' }
  return map[status] || status
}

const refreshBatches = () => {
  ElMessage.success('批次列表已刷新')
}

const editBatch = (batch) => {
  editingBatch.value = batch
  batchForm.value = {
    name: batch.name,
    scene: batch.scene,
    semester: batch.semester,
    events: [],
    classes: []
  }
  showAddBatch.value = true
}

const viewBatchDetail = (batch) => {
  ElMessage.info(`查看批次详情: ${batch.name}`)
}

const deleteBatch = (batch) => {
  ElMessageBox.confirm(
    `确定要删除批次 "${batch.name}" 吗？`,
    '删除批次',
    { type: 'warning' }
  ).then(() => {
    const index = examBatches.value.findIndex(b => b.id === batch.id)
    if (index > -1) {
      examBatches.value.splice(index, 1)
      addLog('删除批次', '', `删除考试批次`)
      ElMessage.success('批次已删除')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const saveBatch = () => {
  if (!batchForm.value.name) {
    ElMessage.warning('请输入批次名称')
    return
  }
  
  if (editingBatch.value) {
    const index = examBatches.value.findIndex(b => b.id === editingBatch.value.id)
    if (index > -1) {
      examBatches.value[index].name = batchForm.value.name
      examBatches.value[index].scene = batchForm.value.scene
      examBatches.value[index].semester = batchForm.value.semester
    }
    ElMessage.success('批次已更新')
  } else {
    const newBatch = {
      id: 'B' + String(examBatches.value.length + 1).padStart(3, '0'),
      name: batchForm.value.name,
      scene: batchForm.value.scene,
      semester: batchForm.value.semester,
      status: 'pending',
      studentCount: 0,
      completedCount: 0,
      createTime: new Date().toLocaleString('zh-CN')
    }
    examBatches.value.unshift(newBatch)
    ElMessage.success('批次已创建')
  }
  
  showAddBatch.value = false
  editingBatch.value = null
  batchForm.value = { name: '', scene: 'exam', semester: '2026-spring', events: [], classes: [] }
  addLog('保存批次', '', `保存考试批次数据`)
}

// 汇总报表方法
const generateSummaryReport = () => {
  // 根据选择的批次和学期重新计算统计数据
  if (reportBatch.value) {
    const batch = examBatches.value.find(b => b.id === reportBatch.value)
    if (batch) {
      const random = createSeededRandom(schoolId.value + '_summaryReport')
      summaryData.value = {
        totalStudents: batch.studentCount,
        completedStudents: Math.floor(batch.studentCount * 0.92),
        excellentRate: Math.floor(random() * 15 + 20),
        goodRate: Math.floor(random() * 20 + 35),
        passRate: Math.floor(random() * 15 + 25),
        failRate: Math.floor(random() * 8 + 5)
      }
    }
  }
  ElMessage.success('报表已生成')
  nextTick(() => {
    initSummaryCharts()
  })
}

const exportSummaryReport = () => {
  // 生成完整的汇总报表CSV
  let csvContent = ''
  
  // 报表标题
  csvContent += '成绩汇总报表\n'
  csvContent += `生成时间,${new Date().toLocaleString()}\n`
  csvContent += `选择批次,${reportBatch.value ? examBatches.value.find(b => b.id === reportBatch.value)?.name || '未选择' : '全部批次'}\n`
  csvContent += `选择学期,${reportSemester.value || '全部学期'}\n\n`
  
  // 总体统计
  csvContent += '总体统计\n'
  csvContent += '统计项,数值\n'
  csvContent += `参考人数,${summaryData.value.totalStudents}\n`
  csvContent += `已完成人数,${summaryData.value.completedStudents}\n`
  csvContent += `优秀率,${summaryData.value.excellentRate}%\n`
  csvContent += `良好率,${summaryData.value.goodRate}%\n`
  csvContent += `及格率,${summaryData.value.passRate}%\n`
  csvContent += `不及格率,${summaryData.value.failRate}%\n\n`
  
  // 各项目成绩详情
  csvContent += '各项目成绩详情\n'
  csvContent += '考试项目,参考人数,优秀人数,良好人数,及格人数,不及格人数,平均分,最高分\n'
  summaryDetail.value.forEach(item => {
    csvContent += `${item.event},${item.total},${item.excellent},${item.good},${item.pass},${item.fail},${item.avgScore},${item.maxScore}\n`
  })
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const batchName = reportBatch.value ? examBatches.value.find(b => b.id === reportBatch.value)?.name || '全部' : '全部'
  a.download = `汇总报表_${batchName}_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('汇总报表已导出')
}

const onSummaryDialogOpened = () => {
  nextTick(() => {
    initSummaryCharts()
  })
}

const initSummaryCharts = () => {
  // 成绩分布图表 - 从 summaryDetail 动态获取数据
  if (summaryChart.value && summaryDetail.value.length > 0) {
    if (summaryChartInstance) summaryChartInstance.dispose()
    summaryChartInstance = echarts.init(summaryChart.value)
    const events = summaryDetail.value.map(d => d.event)
    summaryChartInstance.setOption({
      animation: true,
      animationDuration: 1200,
      animationEasing: 'elasticOut',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0, data: ['优秀', '良好', '及格', '不及格'] },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: events, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value' },
      series: [
        { name: '优秀', type: 'bar', stack: 'total', barWidth: '45%', itemStyle: { color: '#1E5AA8' }, data: summaryDetail.value.map(d => d.excellent), animationDelay: function(idx) { return idx * 150 } },
        { name: '良好', type: 'bar', stack: 'total', barWidth: '45%', itemStyle: { color: '#3B82F6' }, data: summaryDetail.value.map(d => d.good), animationDelay: function(idx) { return idx * 150 } },
        { name: '及格', type: 'bar', stack: 'total', barWidth: '45%', itemStyle: { color: '#F5A623' }, data: summaryDetail.value.map(d => d.pass), animationDelay: function(idx) { return idx * 150 } },
        { name: '不及格', type: 'bar', stack: 'total', barWidth: '45%', itemStyle: { color: '#E85D4E' }, data: summaryDetail.value.map(d => d.fail), animationDelay: function(idx) { return idx * 150 } }
      ]
    })
  }

  // 班级完成率图表 - 从 examResults 按年级计算完成率
  if (classChart.value) {
    if (classChartInstance) classChartInstance.dispose()
    classChartInstance = echarts.init(classChart.value)
    const gradeOrder = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
    const data = examResults.value || []
    const gradeRates = {}
    data.forEach(e => {
      const grade = gradeOrder.find(g => (e.class || '').startsWith(g))
      if (grade) {
        if (!gradeRates[grade]) gradeRates[grade] = { total: 0, passed: 0 }
        gradeRates[grade].total++
        if (e.grade !== '不及格') gradeRates[grade].passed++
      }
    })
    const existingGrades = gradeOrder.filter(g => gradeRates[g])
    const grades = existingGrades.length > 0 ? existingGrades : gradeOrder
    const chartData = grades.map(g => {
      if (gradeRates[g] && gradeRates[g].total > 0) {
        return Math.round((gradeRates[g].passed / gradeRates[g].total) * 100)
      }
      return 85
    })
    classChartInstance.setOption({
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: grades },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      series: [{
        type: 'bar',
        data: chartData,
        itemStyle: { color: '#1E5AA8', borderRadius: [4, 4, 0, 0] },
        animationDelay: function(idx) { return idx * 100 }
      }]
    })
  }
}

// 确认面部识别开始考试
const confirmExamWithFace = () => {
  faceRecognitionVisible.value = false
  currentExamStudent.value = recognizedStudent.value
  examMonitorVisible.value = true
  startExamRecording()
}

// 开始考试录制
const startExamRecording = () => {
  isRecording.value = true
  currentScore.value = 0
  isViolationDetected.value = false
  violationMessage.value = ''
  
  // 清除之前的 interval
  if (scoreInterval) {
    clearInterval(scoreInterval)
    scoreInterval = null
  }
  
  // 模拟成绩检测过程
  let score = 0
  const random = createSeededRandom(schoolId.value + '_examRecording')
  scoreInterval = setInterval(() => {
    score += random() * 0.5
    currentScore.value = score.toFixed(2)
    
    // 随机检测违规
    if (random() > 0.95 && !isViolationDetected.value) {
      isViolationDetected.value = true
      violationMessage.value = '检测到疑似违规动作'
    }
    
    if (score >= 2.5) {
      clearInterval(scoreInterval)
      scoreInterval = null
    }
  }, 300)
}

// 切换录制状态
const toggleRecording = () => {
  isRecording.value = !isRecording.value
  if (isRecording.value) {
    ElMessage.info('已开始录制')
  } else {
    ElMessage.info('已暂停录制')
  }
}

// 重置检测
const resetDetection = () => {
  currentScore.value = 0
  isViolationDetected.value = false
  violationMessage.value = ''
}

// 标记当前违规（从考试监控弹窗）
const markCurrentViolation = () => {
  ElMessageBox.confirm(
    `确定要标记 ${currentExamStudent.value?.name} 的考试为违规吗？`,
    '标记违规',
    {
      confirmButtonText: '确定标记',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    isViolationDetected.value = true
    violationMessage.value = '已人工标记违规'

    // 持久化违规记录
    const student = currentExamStudent.value
    if (student) {
      const now = new Date()
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const vType = selectedViolationType.value || '其他'
      const vTypeLabel = violationTypes.find(v => v.value === vType)?.label || vType || '其他'

      violationRecords.value.unshift({
        studentName: student.name,
        studentId: student.id,
        event: examConfig.value?.event || '未知项目',
        violationType: vTypeLabel,
        date: dateStr,
        description: '实时监控中人工标记违规',
        severity: '一般',
        status: '有效',
        markedBy: '管理员'
      })
    }
    ElMessage.success('已标记违规')
  }).catch(() => {
    ElMessage.info('已取消标记')
  })
}

// 完成当前考试
const finishCurrentExam = () => {
  examMonitorVisible.value = false
  isRecording.value = false
  if (scoreInterval) {
    clearInterval(scoreInterval)
    scoreInterval = null
  }
  ElMessage.success(`考试完成！成绩：${currentScore.value}米`)
}

// 监听识别状态变化，自动开始识别流程
watch(recognitionStatus, (newVal, oldVal) => {
  if (newVal === 'idle' && faceRecognitionVisible.value) {
    setTimeout(() => {
      startRecognitionProcess()
    }, 500)
  }
})

const initGradeChart = () => {
  if (!gradeChart.value) return
  if (gradeChartInstance) { gradeChartInstance.dispose(); gradeChartInstance = null }
  gradeChartInstance = echarts.init(gradeChart.value)
  gradeChartInstance.showLoading()

  gradeChartInstance.setOption({
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#6B7280', fontSize: 12 } },
    series: [{
      name: '成绩分布',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      animationType: 'expansion',
      animationDurationUpdate: 500,
      data: [
        { value: examStats.excellent || 12, name: '优秀', itemStyle: { color: '#1E5AA8' } },
        { value: examStats.good || 15, name: '良好', itemStyle: { color: '#3B82F6' } },
        { value: examStats.pass || 15, name: '及格', itemStyle: { color: '#F5A623' } },
        { value: examStats.fail || 14, name: '不及格', itemStyle: { color: '#E85D4E' } }
      ]
    }]
  })
  gradeChartInstance.hideLoading()
}

const initProgressChart = () => {
  if (!progressChart.value) return
  if (progressChartInstance) { progressChartInstance.dispose(); progressChartInstance = null }
  progressChartInstance = echarts.init(progressChart.value)

  // 从 examResults 动态统计各项目已完成/未完成数量
  const events = ['立定跳远', '跳绳', '50米跑', '仰卧起坐', '坐位体前屈', '1000米跑', '50*8往返跑', '引体向上']
  const data = examResults.value || []
  const totalCount = data.length || 56
  const completedByEvent = {}
  data.forEach(e => {
    const event = e.event || ''
    completedByEvent[event] = (completedByEvent[event] || 0) + 1
  })
  const completedData = events.map(ev => completedByEvent[ev] || Math.round(totalCount / events.length * 0.8))
  const uncompletedData = events.map((ev, i) => Math.max(0, totalCount - completedData[i]))

  progressChartInstance.setOption({
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['已完成', '未完成'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: events,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: {
        color: '#6B7280',
        fontSize: 11,
        interval: 0,
        rotate: 25
      },
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280' }
    },
    series: [
      {
        name: '已完成',
        type: 'bar',
        stack: 'total',
        barWidth: '40%',
        itemStyle: { color: '#1E5AA8', borderRadius: [4, 4, 0, 0] },
        data: completedData,
        animationDelay: function(idx) { return idx * 100 }
      },
      {
        name: '未完成',
        type: 'bar',
        stack: 'total',
        barWidth: '40%',
        itemStyle: { color: '#E8EAED', borderRadius: [4, 4, 0, 0] },
        data: uncompletedData,
        animationDelay: function(idx) { return idx * 100 }
      }
    ]
  })
}

watch(examStats, () => {
  nextTick(() => {
    initGradeChart()
    initProgressChart()
  })
}, { deep: true })

watch(schoolData, () => {
  nextTick(() => {
    initGradeChart()
    initProgressChart()
  })
}, { deep: true })

// 当学校切换时，重新从 schoolProfile 初始化 ref 数据
watch(schoolProfile, (newProfile) => {
  if (!newProfile) return
  const se = newProfile.sportsExam || {}

  examBatches.value = (se.examBatches || []).map(b => ({
    id: b.id,
    name: b.name,
    scene: 'exam',
    semester: '2026-spring',
    status: b.status,
    studentCount: b.totalStudents,
    completedCount: b.completedStudents,
    createTime: b.startTime || ''
  }))

  summaryData.value = {
    totalStudents: se.summaryData?.totalStudents || 0,
    completedStudents: se.summaryData?.completedStudents || 0,
    excellentRate: se.summaryData?.excellentRate || 0,
    goodRate: Math.round((se.summaryData?.passRate || 0) - (se.summaryData?.excellentRate || 0)) * 0.6,
    passRate: se.summaryData?.passRate || 0,
    failRate: Math.round(100 - (se.summaryData?.passRate || 0))
  }
}, { deep: true })

watch([filterGrade, filterEvent, filterClass, filterStudentId], () => {
  nextTick(() => {
    initProgressChart()
    initSummaryCharts()
  })
})

// 考试模式切换
const examMode = ref(false)
const initExamMode = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const stored = sessionStorage.getItem(`exam_mode_${schoolId}`)
  examMode.value = stored === 'true'
}
const toggleExamMode = (val) => {
  examMode.value = val
  const schoolId = store.state.school.id || 'hailin-second-primary'
  sessionStorage.setItem(`exam_mode_${schoolId}`, val ? 'true' : 'false')
  ElMessage.success(val ? '已开启体育考试模式，移动端任务成绩将归属于体育考试成绩' : '已关闭体育考试模式')
}

// 成绩归档
const showArchiveDialog = ref(false)
const archiveRecords = ref([])
const archiveFilter = ref({ dateRange: [], className: '' })

const loadArchiveRecords = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  try {
    const records = JSON.parse(sessionStorage.getItem(`exam_archive_${schoolId}`) || '[]')
    archiveRecords.value = records
  } catch { archiveRecords.value = [] }
}

const archiveScores = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  try {
    const examResultsData = JSON.parse(sessionStorage.getItem(`exam_results_${schoolId}`) || '[]')
    const archiveData = examResultsData.filter(r => r.category !== '体育考试').map(r => ({
      ...r,
      archivedDate: new Date().toISOString().split('T')[0],
      originalCategory: r.category,
      archived: true
    }))
    if (archiveData.length === 0) {
      ElMessage.warning('没有可归档的非考试成绩记录')
      return
    }
    const existing = JSON.parse(sessionStorage.getItem(`exam_archive_${schoolId}`) || '[]')
    existing.push(...archiveData)
    sessionStorage.setItem(`exam_archive_${schoolId}`, JSON.stringify(existing))
    ElMessage.success(`已归档 ${archiveData.length} 条成绩记录到考试成绩`)
    loadArchiveRecords()
  } catch (e) {
    ElMessage.error('归档失败：' + e.message)
  }
}

const removeArchive = (index) => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  archiveRecords.value.splice(index, 1)
  sessionStorage.setItem(`exam_archive_${schoolId}`, JSON.stringify(archiveRecords.value))
  ElMessage.success('归档记录已移除')
}

onMounted(async () => {
  initExamMode()
  loadArchiveRecords()
  
  // 加载推送数据
  await loadPushData()
  
  const tryInit = () => {
    if (gradeChart.value && gradeChart.value.clientWidth > 0) {
      initGradeChart()
      initProgressChart()
    } else {
      requestAnimationFrame(tryInit)
    }
  }
  requestAnimationFrame(tryInit)
  window.addEventListener('resize', handleChartResize)
})

// 监听学校切换，重新加载数据
watch(schoolId, async () => {
  pageLoading.value = true
  pushDataLoaded.value = false
  pushData.value = []
  await loadPushData()
  nextTick(() => {
    initGradeChart()
    initProgressChart()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
  if (gradeChartInstance) gradeChartInstance.dispose()
  if (progressChartInstance) progressChartInstance.dispose()
  if (summaryChartInstance) summaryChartInstance.dispose()
  if (classChartInstance) classChartInstance.dispose()
  if (scoreInterval) clearInterval(scoreInterval)
})

// 监听考试监控对话框关闭，防止 scoreInterval 泄漏
watch(examMonitorVisible, (visible) => {
  if (!visible && scoreInterval) {
    clearInterval(scoreInterval)
    scoreInterval = null
  }
})

const handleChartResize = () => {
  if (gradeChartInstance) gradeChartInstance.resize()
  if (progressChartInstance) progressChartInstance.resize()
}

// 监听汇总报表对话框显示，自动初始化图表
watch(showSummaryReport, (newVal) => {
  if (newVal) {
    nextTick(() => {
      setTimeout(initSummaryCharts, 200)
    })
  }
})
</script>

<style scoped>
/* 学生姓名单元格样式 */
.student-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name-warning {
  color: #E85D4E;
  font-weight: 600;
}

.makeup-tag {
  margin-left: 4px;
}

.violation-badge {
  margin-left: 4px;
  animation: violation-pulse 2s ease-in-out infinite;
}

@keyframes violation-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 违规记录弹窗 */
.violation-dialog-header {
  padding: 0 0 12px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid #E8EAED;
}

.violation-count {
  font-size: 13px;
  color: #6B7280;
}

.violation-status.active {
  color: #16A34A;
  font-weight: 500;
  font-size: 12px;
}

.violation-status.revoked {
  color: #9CA3AF;
  font-size: 12px;
  text-decoration: line-through;
}

/* 标记违规弹窗 */
.violation-mark-student {
  padding: 10px 14px;
  background: #FEF2F2;
  border-radius: 8px;
  border-left: 3px solid #E85D4E;
}

.vm-label {
  font-size: 13px;
  color: #6B7280;
}

.vm-value {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

/* 违规详情弹窗 */
.violation-detail {
  padding: 4px;
}

.vd-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.vd-student h3 {
  margin: 0;
  font-size: 18px;
  color: #1A1A2E;
}

.vd-student p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #6B7280;
}

.vd-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.vd-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #F9FAFB;
  border-radius: 8px;
}

.vd-info-label {
  font-size: 13px;
  color: #6B7280;
}

.vd-info-value {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.vd-description {
  margin-bottom: 16px;
  padding: 12px 14px;
  background: #F9FAFB;
  border-radius: 8px;
}

.vd-description p {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #1A1A2E;
  line-height: 1.5;
}

/* 严重程度标签 */
.severity-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.severity-轻微 { background: #FEF3C7; color: #92400E; }
.severity-一般 { background: #FED7AA; color: #9A3412; }
.severity-严重 { background: #FEE2E2; color: #991B1B; }

/* 证据标签 */
.vd-evidence {
  margin-top: 12px;
}

.evidence-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.evidence-tag {
  padding: 4px 10px;
  background: #E8EAED;
  border-radius: 20px;
  font-size: 12px;
  color: #6B7280;
}

.sports-exam {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  padding: 16px 20px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

@media (min-width: 1200px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.mode-switch-container {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.mode-switch-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-switch-wrapper .mode-label {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

/* 场景切换标签样式 */
.scene-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 0;
  border-bottom: 1px solid #E8EAED;
}

.scene-tab {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: #F7F8FA;
  color: #6B7280;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scene-tab:hover {
  background: #EFF6FF;
  color: #1E5AA8;
}

.scene-tab.active {
  background: #1E5AA8;
  color: #FFFFFF;
}

.scene-tab.active:hover {
  background: #174a8a;
}

.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chart {
  height: 260px;
  width: 100%;
  min-height: 260px;
  min-width: 300px;
  flex-shrink: 0;
}

.score-value {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.best-score {
  font-size: 14px;
  color: #1E5AA8;
  font-weight: 500;
}

.grade-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.grade-excellent { background: #DCFCE7; color: #166534; }
.grade-good { background: #DBEAFE; color: #1E40AF; }
.grade-pass { background: #FEF3C7; color: #92400E; }
.grade-fail { background: #FEE2E2; color: #991B1B; }

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

.exam-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.detail-grid {
  display: grid;
  grid-template-columns: 240px 1fr 1fr 1fr;
  gap: 12px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 考试进度样式 */
.progress-container {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
  color: #6B7280;
}

.progress-bar {
  height: 8px;
  background: #E8EAED;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1E5AA8, #3B82F6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-events {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.event-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.event-tag.completed {
  background: #DCFCE7;
  color: #166534;
}

.event-tag.pending {
  background: #F7F8FA;
  color: #9CA3AF;
  border: 1px dashed #E8EAED;
}

.grid-label {
  font-size: 12px;
  color: #6B7280;
}

.grid-value {
  font-size: 14px;
  color: #1A1A2E;
  font-weight: 500;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.score-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-main .score-value {
  font-size: 36px;
  font-weight: 700;
  color: #1A1A2E;
}

.score-main .score-unit {
  font-size: 14px;
  color: #6B7280;
}

.score-grade {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
}

.posture-grid {
  display: flex;
  gap: 24px;
}

.posture-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.posture-label {
  font-size: 12px;
  color: #6B7280;
}

.posture-value {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.posture-value.good { color: #1E5AA8; }
.posture-value.warning { color: #F5A623; }

.muscle-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.muscle-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.muscle-label {
  width: 80px;
  font-size: 13px;
  color: #1A1A2E;
}

.muscle-value {
  width: 40px;
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.comment-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.comment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1A1A2E;
}

.comment-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.comment-icon.positive {
  background: #DCFCE7;
  color: #166534;
}

.comment-icon.warning {
  background: #FEF3C7;
  color: #92400E;
}

.suggestion-box {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 12px;
}

.suggestion-title {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 8px;
}

.suggestion-content {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.6;
}

.keyframe-list {
  display: flex;
  gap: 16px;
}

.keyframe-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.keyframe-thumb {
  width: 48px;
  height: 48px;
  background: #F7F8FA;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.keyframe-label {
  font-size: 12px;
  color: #6B7280;
}

/* 考试项目汇总列表样式 */
.exam-summary-table {
  background: #F7F8FA;
  border-radius: 8px;
  overflow: hidden;
}

.summary-header {
  display: flex;
  background: #FFFFFF;
  padding: 8px 12px;
  border-bottom: 1px solid #E8EAED;
  font-weight: 600;
  font-size: 12px;
  color: #6B7280;
}

.summary-row {
  display: flex;
  padding: 10px 12px;
  border-bottom: 1px solid #E8EAED;
  font-size: 13px;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-col {
  flex: 1;
  min-width: 80px;
}

.summary-col.event-col {
  flex: 1.2;
  color: #1A1A2E;
}

.summary-col.score-col,
.summary-col.best-col {
  text-align: center;
  color: #1A1A2E;
  font-weight: 500;
}

.summary-col.grade-col {
  text-align: right;
}

.grade-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.grade-badge.grade-excellent {
  background: #DCFCE7;
  color: #166534;
}

.grade-badge.grade-good {
  background: #DBEAFE;
  color: #1E40AF;
}

.grade-badge.grade-pass {
  background: #FEF3C7;
  color: #92400E;
}

.grade-badge.grade-fail {
  background: #FEE2E2;
  color: #991B1B;
}

.summary-empty {
  text-align: center;
  padding: 24px;
  color: #9CA3AF;
  font-size: 13px;
}

/* 面部识别相关样式 */
.face-recognition-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.camera-frame {
  width: 320px;
  height: 400px;
  border: 2px dashed #1E5AA8;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background: #F7F8FA;
}

.camera-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.recognized-face {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.face-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #1E5AA8;
  box-shadow: 0 4px 12px rgba(45, 125, 70, 0.3);
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1E5AA8, transparent);
  animation: scan 2s linear infinite;
}

.scan-border {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  border: 2px solid #1E5AA8;
  border-radius: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes scan {
  0% { top: 0; opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.scanning-animation {
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-circle {
  width: 80px;
  height: 80px;
  border: 3px solid rgba(30, 90, 168, 0.3);
  border-top-color: #1E5AA8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.recognition-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #F7F8FA;
  border-radius: 20px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9CA3AF;
}

.status-dot.idle { background: #9CA3AF; }
.status-dot.scanning { background: #3B82F6; animation: blink 1s ease-in-out infinite; }
.status-dot.success { background: #1E5AA8; }
.status-dot.failed { background: #E85D4E; }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.recognition-time {
  margin-left: 8px;
  font-size: 12px;
  color: #6B7280;
}

.recognized-student {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #DCFCE7;
  border-radius: 8px;
}

.student-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #1E5AA8;
}

.student-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.student-info p {
  margin: 0;
  font-size: 12px;
  color: #6B7280;
}

.recognition-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* 识别记录表格样式 */
.records-container {
  padding: 16px 0;
}

.records-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.success {
  background: #DCFCE7;
  color: #166534;
}

.status-tag.failed {
  background: #FEE2E2;
  color: #991B1B;
}

/* 截图查看器样式 */
.snapshot-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.snapshot-image-container {
  position: relative;
}

.snapshot-image {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  border: 2px solid #E8EAED;
}

.snapshot-info {
  margin-top: 12px;
  text-align: center;
}

.snapshot-info p {
  margin: 4px 0;
  font-size: 13px;
  color: #6B7280;
}

.certification-badge {
  padding: 8px 16px;
  background: #DCFCE7;
  border-radius: 4px;
  font-size: 13px;
  color: #166534;
  font-weight: 500;
}

/* 批次管理样式 */
.batch-manager {
  padding: 16px 0;
}

.batch-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.batch-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.batch-status.pending {
  background: #F7F8FA;
  color: #6B7280;
}

.batch-status.in_progress {
  background: #DBEAFE;
  color: #1E40AF;
}

.batch-status.completed {
  background: #DCFCE7;
  color: #166534;
}

/* 汇总报表样式 */
.summary-report {
  padding: 16px 0;
}

.report-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.report-stat-card {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.report-stat-num {
  font-size: 28px;
  font-weight: 700;
}

.report-stat-num.blue { color: #1E5AA8; }
.report-stat-num.light-blue { color: #3B82F6; }
.report-stat-num.orange { color: #F5A623; }
.report-stat-num.red { color: #E85D4E; }

.report-stat-label {
  font-size: 12px;
  color: #6B7280;
}

.report-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-section {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chart-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.summary-chart {
  height: 240px;
}

.report-table-section {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.report-table-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

/* 违规类型样式 */
.violation-types {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.violation-types h5 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
}

.violation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.violation-tag {
  padding: 4px 12px;
  background: #F7F8FA;
  border-radius: 4px;
  font-size: 12px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s;
}

.violation-tag:hover {
  background: #EFF6FF;
  color: #1E5AA8;
}

.violation-tag.selected {
  background: #1E5AA8;
  color: #FFFFFF;
}

/* 视频回放弹窗 */
.replay-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-player-wrapper {
  background: #1A1A2E;
  border-radius: 8px;
  overflow: hidden;
}

.replay-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.replay-info p {
  margin: 0;
  font-size: 13px;
  color: #4B5563;
}

.replay-info strong {
  color: #1A1A2E;
  font-weight: 600;
}

/* 考试模式切换 */
.exam-mode-section {
  margin-bottom: 16px;
}
.mode-switch-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.mode-label {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A2E;
}
.mode-banner {
  margin-bottom: 16px;
}

/* 成绩归档 */
.archive-manager {
  padding: 0 10px;
}
.archive-actions {
  display: flex;
  gap: 12px;
}
</style>