<template>
  <div class="student-evaluation">
    <LoadingOverlay :visible="loading" text="正在同步数据..." subText="请稍候" />
    <!-- 顶部操作 -->
    <div class="page-header">
      <div class="header-filters">
        <el-select v-model="selectedStudent" placeholder="选择学生" clearable filterable style="width: 240px">
          <el-option label="全部学生" value="" />
          <el-option v-for="student in allStudents" :key="student.id" :label="`${student.name} - ${student.grade || ''}(${(student.class || '').replace(/班$/, '')})班`" :value="student.id" />
        </el-select>
        <el-select v-model="filterTheme" placeholder="评价主题" clearable style="width: 160px">
          <el-option label="月度体育测评" value="月度体育测评" />
          <el-option label="学期综合评价" value="学期综合评价" />
          <el-option label="课后教学反馈" value="课后教学反馈" />
          <el-option label="心理健康评估" value="心理健康评估" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="活动状态" clearable style="width: 140px">
          <el-option label="进行中" value="进行中" />
          <el-option label="已结束" value="已结束" />
          <el-option label="未开始" value="未开始" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportReport">导出报告</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog">新建评价活动</el-button>
      </div>
    </div>

    <!-- 评价活动卡片 -->
    <div class="activity-cards">
      <div class="activity-card" v-for="(act, idx) in activityList" :key="idx">
        <div class="activity-header">
          <span class="activity-title">{{ act.title }}</span>
          <span class="activity-status" :class="act.status === '进行中' ? 'status-active' : 'status-ended'">{{ act.status }}</span>
        </div>
        <div class="activity-info">
          <div class="info-item">
            <el-icon><Calendar /></el-icon>
            <span>{{ act.date }}</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span class="progress-text">已评 {{ act.evaluated }}/{{ act.participants }}人</span>
          </div>
          <div class="info-item">
            <el-icon><Timer /></el-icon>
            <span>{{ act.deadline }}截止</span>
          </div>
        </div>
        <div class="activity-progress">
          <el-progress :percentage="act.progress" :color="act.progress >= 80 ? '#1E5AA8' : '#3B82F6'" />
        </div>
        <!-- 评分进度详情 -->
        <div class="progress-detail">
          <div class="detail-section">
            <span class="detail-label">未评分人数</span>
            <span class="detail-value warning">{{ act.participants - act.evaluated }}人</span>
          </div>
          <div class="detail-section">
            <span class="detail-label">今日新增</span>
            <span class="detail-value success">{{ getTodayNewEvaluations(act.title) }}人</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 评分进度统计面板 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ overallStats.total }}</span>
        <span class="stat-label">总评价人数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ overallStats.completed }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ overallStats.pending }}</span>
        <span class="stat-label">待评分</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ overallStats.rate }}%</span>
        <span class="stat-label">完成率</span>
      </div>
      <div style="flex: 1"></div>
      <el-select v-model="progressFilterTheme" placeholder="选择评价主题" style="width: 160px">
        <el-option label="全部" value="" />
        <el-option label="月度体育测评" value="月度体育测评" />
        <el-option label="学期综合评价" value="学期综合评价" />
        <el-option label="课后教学反馈" value="课后教学反馈" />
        <el-option label="心理健康评估" value="心理健康评估" />
      </el-select>
    </div>

    <!-- 评分进度详情 -->
    <div class="progress-summary-card">
      <div class="card-header">
        <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 评分进度详情</span>
      </div>
      <div class="progress-summary-content">
        <div class="class-progress-section">
          <div class="section-header">
            <span class="section-title">各班级评分进度</span>
          </div>
          <div class="class-progress-list">
            <div class="class-progress-item" v-for="item in classProgressList" :key="item.className">
              <span class="class-name">{{ item.className }}</span>
              <div class="class-progress-bar">
                <div 
                  class="progress-fill" 
                  :class="{ 'progress-warning': item.rate < 60 }"
                  :style="{ width: item.rate + '%' }"
                ></div>
              </div>
              <span class="class-rate" :class="{ 'rate-warning': item.rate < 60 }">{{ item.rate }}%</span>
            </div>
          </div>
        </div>
        <div class="pending-section">
          <div class="section-header">
            <span class="section-title"><el-icon :size="16" color="#E85D4E"><Warning /></el-icon> 待评分学生TOP5</span>
            <el-button text size="small" @click="viewAllPending">查看全部</el-button>
          </div>
          <div class="pending-list">
            <div class="pending-item" v-for="item in pendingStudents" :key="item.id">
              <div class="pending-info">
                <span class="pending-name">{{ item.studentName }}</span>
                <span class="pending-class">{{ item.className }}</span>
              </div>
              <span class="pending-days">{{ item.pendingDays }}天未评</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 多维度评价标签页 -->
    <el-tabs v-model="activeTab" class="evaluation-tabs">
      <el-tab-pane label="综合评价" name="overview">
        <component :is="OverviewTab" />
      </el-tab-pane>
      <el-tab-pane label="成绩诊断" name="diagnosis">
        <component :is="DiagnosisTab" />
      </el-tab-pane>
      <el-tab-pane label="专注力分析" name="focus">
        <component :is="FocusTab" />
      </el-tab-pane>
      <el-tab-pane label="教师评价" name="teacher">
        <component :is="TeacherTab" />
      </el-tab-pane>
      <el-tab-pane label="数字画像" name="digitalPortrait">
        <component :is="PortraitTab" />
      </el-tab-pane>
      <el-tab-pane label="家长评价" name="parent">
        <component :is="ParentTab" />
      </el-tab-pane>
      <el-tab-pane label="成长日志" name="growth">
        <component :is="GrowthTab" />
      </el-tab-pane>
    </el-tabs>

    <ElDialog v-model="createDialogVisible" title="新建评价活动" width="550px" :close-on-click-modal="false">
      <el-form :model="activityForm" label-width="100px">
        <el-form-item label="活动名称" required>
          <el-input v-model="activityForm.title" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="评价主题" required>
          <el-select v-model="activityForm.theme" placeholder="请选择评价主题" class="w-full">
            <el-option label="月度体育测评" value="月度体育测评" />
            <el-option label="学期综合评价" value="学期综合评价" />
            <el-option label="课后教学反馈" value="课后教学反馈" />
            <el-option label="心理健康评估" value="心理健康评估" />
            <el-option label="自定义主题" value="自定义" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="activityForm.theme === '自定义'" label="自定义主题">
          <el-input v-model="activityForm.customTheme" placeholder="请输入自定义主题名称" />
        </el-form-item>
        <el-form-item label="活动类型" required>
          <el-radio-group v-model="activityForm.type">
            <el-radio label="周期性任务">周期性任务</el-radio>
            <el-radio label="临时任务">临时任务</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开放时间" required>
          <el-date-picker
            v-model="activityForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="参与范围" required>
          <el-checkbox-group v-model="activityForm.scope">
            <el-checkbox label="一年级">一年级</el-checkbox>
            <el-checkbox label="二年级">二年级</el-checkbox>
            <el-checkbox label="三年级">三年级</el-checkbox>
            <el-checkbox label="四年级">四年级</el-checkbox>
            <el-checkbox label="五年级">五年级</el-checkbox>
            <el-checkbox label="六年级">六年级</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="测评模板">
          <el-select v-model="activityForm.template" placeholder="请选择测评模板" class="w-full">
            <el-option label="默认模板" value="default" />
            <el-option label="体育技能评价" value="sports" />
            <el-option label="体能测试评价" value="fitness" />
            <el-option label="综合发展评价" value="comprehensive" />
            <el-option label="自定义模板" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证方式">
          <el-checkbox-group v-model="activityForm.authMethods">
            <el-checkbox label="面部识别">面部识别</el-checkbox>
            <el-checkbox label="学号">学号</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="activityForm.remark" type="textarea" placeholder="请输入备注信息" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateActivity">确认创建</el-button>
      </template>
    </ElDialog>

    <ElDialog v-model="detailDialogVisible" title="评价详情" width="600px">
      <div v-if="selectedEvaluation" class="evaluation-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="grid-item">
              <span class="grid-label">学生姓名</span>
              <span class="grid-value">{{ selectedEvaluation.studentName }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-label">评价主题</span>
              <span class="grid-value">{{ selectedEvaluation.theme }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-label">评价日期</span>
              <span class="grid-value">{{ selectedEvaluation.date }}</span>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4>五育得分</h4>
          <div class="five-edu-scores">
            <div class="edu-item">
              <span class="edu-label">德</span>
              <el-progress :percentage="selectedEvaluation.moral || 85" :color="'#1E5AA8'" />
            </div>
            <div class="edu-item">
              <span class="edu-label">智</span>
              <el-progress :percentage="selectedEvaluation.intellectual || 92" :color="'#3B82F6'" />
            </div>
            <div class="edu-item">
              <span class="edu-label">体</span>
              <el-progress :percentage="selectedEvaluation.physical || 78" :color="'#F5A623'" />
            </div>
            <div class="edu-item">
              <span class="edu-label">美</span>
              <el-progress :percentage="selectedEvaluation.aesthetic || 88" :color="'#3B82F6'" />
            </div>
            <div class="edu-item">
              <span class="edu-label">劳</span>
              <el-progress :percentage="selectedEvaluation.labor || 82" :color="'#3B82F6'" />
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4>综合评价</h4>
          <div class="score-display">
            <span class="big-score">{{ selectedEvaluation.score }}</span>
            <span class="score-label">分</span>
          </div>
        </div>
        <div class="detail-section">
          <h4>评语</h4>
          <div class="comment-box">
            {{ selectedEvaluation.comments || '该学生在本周期内表现良好，体育参与积极，各项体能指标均有提升。' }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="generateReport(selectedEvaluation)">生成报告</el-button>
      </template>
    </ElDialog>

    <!-- 教师评分新建打分弹窗 -->
    <ElDialog v-model="teacherScoreDialogVisible" title="新建教师评分打分项" width="550px" :close-on-click-modal="false">
      <el-form :model="newTeacherScoreForm" label-width="100px">
        <el-form-item label="教师姓名" required>
          <el-input v-model="newTeacherScoreForm.teacherName" placeholder="请输入教师姓名" />
        </el-form-item>
        <el-form-item label="课程名称" required>
          <el-input v-model="newTeacherScoreForm.course" placeholder="如：五年级体育课" />
        </el-form-item>
        <el-form-item label="班级类型" required>
          <el-radio-group v-model="newTeacherScoreForm.classType" @change="newTeacherScoreForm.className = ''">
            <el-radio label="行政班">行政班</el-radio>
            <el-radio label="兴趣班">兴趣班</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="授课班级" required>
          <template v-if="newTeacherScoreForm.classType === '行政班'">
            <el-select v-model="newTeacherScoreForm.className" placeholder="请选择班级" class="w-full">
              <el-option v-for="cls in adminClassesForTeacherScore" :key="cls.name" :label="cls.name" :value="cls.name" />
            </el-select>
          </template>
          <template v-else>
            <el-input v-model="newTeacherScoreForm.className" placeholder="请输入兴趣班名称，如：篮球兴趣班" />
          </template>
        </el-form-item>
        <el-form-item label="评分日期">
          <el-date-picker
            v-model="newTeacherScoreForm.date"
            type="date"
            placeholder="选择日期"
            class="w-full"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="teacherScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmNewTeacherScore">确认新建</el-button>
      </template>
    </ElDialog>

    <!-- 家长评价问卷弹窗 -->
    <ElDialog v-model="parentSurveyVisible" title="发起家长月度问卷评价" width="600px" :close-on-click-modal="false">
      <el-form :model="parentSurveyForm" label-width="100px">
        <el-form-item label="问卷标题" required>
          <el-input v-model="parentSurveyForm.title" placeholder="请输入问卷标题" />
        </el-form-item>
        <el-form-item label="评价月份" required>
          <el-date-picker
            v-model="parentSurveyForm.month"
            type="month"
            placeholder="选择月份"
            class="w-full"
            format="YYYY-MM"
            value-format="YYYY-MM"
          />
        </el-form-item>
        <el-form-item label="评价班级" required>
          <el-select v-model="parentSurveyForm.classes" multiple placeholder="选择班级" class="w-full">
            <el-option label="一年级(2)班" value="1-2" />
            <el-option label="一年级(3)班" value="1-3" />
            <el-option label="一年级(4)班" value="1-4" />
            <el-option label="一年级(5)班" value="1-5" />
            <el-option label="一年级(6)班" value="1-6" />
            <el-option label="二年级(2)班" value="2-2" />
            <el-option label="二年级(3)班" value="2-3" />
            <el-option label="二年级(4)班" value="2-4" />
            <el-option label="二年级(5)班" value="2-5" />
            <el-option label="二年级(6)班" value="2-6" />
            <el-option label="三年级(3)班" value="3-3" />
            <el-option label="三年级(4)班" value="3-4" />
            <el-option label="三年级(5)班" value="3-5" />
            <el-option label="三年级(6)班" value="3-6" />
            <el-option label="四年级(3)班" value="4-3" />
            <el-option label="四年级(4)班" value="4-4" />
            <el-option label="四年级(5)班" value="4-5" />
            <el-option label="五年级(4)班" value="5-4" />
            <el-option label="五年级(5)班" value="5-5" />
            <el-option label="五年级(6)班" value="5-6" />
            <el-option label="六年级(4)班" value="6-4" />
            <el-option label="六年级(5)班" value="6-5" />
            <el-option label="六年级(6)班" value="6-6" />
          </el-select>
        </el-form-item>
        <el-form-item label="问卷说明">
          <el-input v-model="parentSurveyForm.description" type="textarea" :rows="3" placeholder="请输入问卷说明" />
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker
            v-model="parentSurveyForm.deadline"
            type="datetime"
            placeholder="选择截止时间"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="照片证据">
          <el-upload
            v-model:file-list="parentSurveyForm.photos"
            action="#"
            :auto-upload="false"
            :limit="9"
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">最多上传9张照片，支持JPG、PNG格式</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="parentSurveyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitParentSurvey">确认发起</el-button>
      </template>
    </ElDialog>

    <!-- 照片预览弹窗 -->
    <ElDialog v-model="previewVisible" title="照片预览" width="600px">
      <img :src="previewUrl" class="w-full" />
    </ElDialog>

    <!-- 预警详情弹窗 -->
    <ElDialog v-model="warningDetailVisible" title="动作掌握度预警详情" width="550px">
      <div v-if="currentWarning" class="warning-detail">
        <div class="detail-row">
          <span class="detail-label">学生姓名</span>
          <span class="detail-value">{{ currentWarning.studentName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">班级</span>
          <span class="detail-value">{{ currentWarning.className }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">动作名称</span>
          <span class="detail-value">{{ currentWarning.actionName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">掌握度</span>
          <span class="detail-value" :class="getMasteryClass(currentWarning.masteryRate)">
            {{ currentWarning.masteryRate }}%
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">预警状态</span>
          <span class="warning-tag" :class="currentWarning.status">
            {{ currentWarning.status === 'high' ? '高危' : currentWarning.status === 'medium' ? '中等' : '低危' }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">建议训练</span>
          <span class="detail-value">{{ currentWarning.suggestion }}</span>
        </div>
        <div class="detail-divider"></div>
        <div class="detail-actions">
          <el-button type="success" @click="pushTraining(currentWarning)">推送训练资源</el-button>
          <el-button @click="warningDetailVisible = false">关闭</el-button>
        </div>
      </div>
    </ElDialog>

    <!-- 成长日志弹窗 -->
    <ElDialog v-model="growthLogVisible" :title="growthLogMode === 'create' ? '撰写成长日志' : growthLogMode === 'edit' ? '编辑成长日志' : '成长日志详情'" width="600px">
      <el-form v-if="growthLogMode !== 'view'" :model="growthLogForm" label-width="90px">
        <el-form-item label="学生姓名" required>
          <el-input v-model="growthLogForm.studentName" :disabled="growthLogMode === 'edit'" />
        </el-form-item>
        <el-form-item label="日志类型" required>
          <el-select v-model="growthLogForm.type" placeholder="请选择日志类型" style="width: 100%">
            <el-option v-for="opt in growthLogTypeOptions" :key="opt" :label="opt" :value="opt" />
          </el-select>
        </el-form-item>
        <el-form-item label="日志标题" required>
          <el-input v-model="growthLogForm.title" />
        </el-form-item>
        <el-form-item label="日志内容" required>
          <el-input v-model="growthLogForm.content" type="textarea" :rows="5" />
        </el-form-item>
      </el-form>
      <div v-else class="growth-log-view">
        <h4>{{ growthLogForm.title }}</h4>
        <p class="meta">{{ growthLogForm.studentName }} · {{ growthLogForm.type }} · {{ growthLogForm.date }}</p>
        <p class="content">{{ growthLogForm.content }}</p>
      </div>
      <template #footer>
        <el-button @click="growthLogVisible = false">{{ growthLogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button v-if="growthLogMode !== 'view'" type="primary" @click="saveGrowthLog">保存</el-button>
      </template>
    </ElDialog>

    <!-- PDF导出组件 -->
    <PdfExport
      v-if="showReportExport"
      :visible="showReportExport"
      :report-data="reportData"
      @update:visible="showReportExport = $event"
      @export-start="handleReportExportStart"
      @export-end="handleReportExportEnd"
    />

    <!-- 个性化资源推送弹窗 -->
    <ElDialog v-model="showResourcePushDialog" title="个性化训练资源推送" width="800px">
      <div v-if="currentPushStudent" class="resource-push-container">
        <!-- 学生信息 -->
        <div class="push-student-info">
          <el-avatar :size="48" :icon="UserFilled" />
          <div class="student-detail">
            <span class="student-name">{{ currentPushStudent.studentName }}</span>
            <span class="student-class">{{ currentPushStudent.className }}</span>
          </div>
          <div class="action-info">
            <span class="action-name">动作: {{ currentPushStudent.actionName }}</span>
            <span class="mastery-rate" :class="getMasteryClass(currentPushStudent.masteryRate)">
              掌握度: {{ currentPushStudent.masteryRate }}%
            </span>
          </div>
        </div>

        <!-- 推荐训练资源 -->
        <div class="recommended-resources">
          <h4>📚 推荐训练资源</h4>
          <el-checkbox-group v-model="resourcePushForm.selectedResources">
            <div class="resource-list">
              <div
                v-for="resource in recommendedResources"
                :key="resource.id"
                class="resource-item"
                :class="{ selected: resourcePushForm.selectedResources.includes(resource.id) }"
              >
                <el-checkbox :label="resource.id" class="resource-checkbox">
                  <div class="resource-content">
                    <div class="resource-header">
                      <span class="resource-title">{{ resource.title }}</span>
                      <el-tag :type="getResourceTypeTag(resource.type)" size="small">
                        {{ getResourceTypeText(resource.type) }}
                      </el-tag>
                    </div>
                    <div class="resource-meta">
                      <span class="meta-item">
                        <el-icon><Timer /></el-icon>
                        {{ resource.duration }}
                      </span>
                      <span class="meta-item">
                        <el-icon><TrendCharts /></el-icon>
                        {{ resource.difficulty }}
                      </span>
                    </div>
                    <div class="resource-tags">
                      <el-tag
                        v-for="tag in resource.tags"
                        :key="tag"
                        size="small"
                        type="info"
                        class="tag-item"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </el-checkbox>
              </div>
            </div>
          </el-checkbox-group>
        </div>

        <!-- 自定义消息 -->
        <div class="custom-message">
          <h4>💬 推送消息</h4>
          <el-input
            v-model="resourcePushForm.customMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入自定义推送消息（可选）"
          />
        </div>

        <!-- 推送时间 -->
        <div class="push-time">
          <h4>⏰ 推送时间</h4>
          <el-radio-group v-model="resourcePushForm.pushTime">
            <el-radio label="immediate">立即推送</el-radio>
            <el-radio label="scheduled">定时推送</el-radio>
          </el-radio-group>
          <el-date-picker
            v-if="resourcePushForm.pushTime === 'scheduled'"
            v-model="scheduledPushTime"
            type="datetime"
            placeholder="选择推送时间"
            style="margin-left: 16px"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showResourcePushDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPushResource">确认推送</el-button>
      </template>
    </ElDialog>

    <!-- 待评分学生列表弹窗 -->
    <ElDialog v-model="pendingListVisible" title="待评分学生列表" width="500px">
      <div class="pending-list-dialog">
        <el-table :data="allPendingStudents" stripe class="w-full" :height="400" fit>
          <el-table-column prop="studentName" label="学生姓名" />
          <el-table-column prop="className" label="班级" />
          <el-table-column prop="count" label="已评价次数" />
          <el-table-column prop="pendingDays" label="未评天数">
            <template #default="scope">
              <el-tag :type="scope.row.pendingDays > 7 ? 'danger' : scope.row.pendingDays > 3 ? 'warning' : 'info'" size="small">
                {{ scope.row.pendingDays }}天
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </ElDialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onActivated, nextTick, onBeforeUnmount, reactive, provide } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Download, Plus, Refresh, Calendar, User, Timer, TrendCharts, UserFilled, Bell, Document, Histogram, Warning, ScaleToOriginal } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import store from '../../../store/global'
import { getSchoolMockData } from '../../../utils/mockDataLoader'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { mockDB } from '@/mock'
import { MOCK_AHP_MATRIX } from '@/data/mockData'
import PdfExport from '@/components/export/PdfExport.vue'
import ExamTable from '@/components/table/ExamTable.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'
import { getRealStudents, normalizeStudents } from '@/utils/realDataLoader'
import { getTokenData, getClassList, getStudentListV4 } from '@/utils/daiweiApi'
import { daiweiConfig } from '@/config/daiwei'

import OverviewTab from './tabs/OverviewTab.vue'
import DiagnosisTab from './tabs/DiagnosisTab.vue'
import FocusTab from './tabs/FocusTab.vue'
import TeacherTab from './tabs/TeacherTab.vue'
import PortraitTab from './tabs/PortraitTab.vue'
import ParentTab from './tabs/ParentTab.vue'
import GrowthTab from './tabs/GrowthTab.vue'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const apiStudents = ref([])
const loading = ref(false)

const loadDaiweiData = async () => {
  const sid = schoolId.value
  if (!daiweiConfig.enabled) return

  loading.value = true
  try {
    const tokenResult = await getTokenData(sid)
    if (!tokenResult || !tokenResult.token) {
      console.warn('[StudentEval] Token获取失败，使用缓存/mock数据')
      const cached = getRealStudents(sid)
      if (cached.length > 0) apiStudents.value = normalizeStudents(cached)
      loading.value = false
      return
    }

    const classResult = await getClassList({}, sid)
    if (String(classResult.code) !== '0' || !classResult.data) {
      console.warn('[StudentEval] 班级数据获取失败')
      loading.value = false
      return
    }

    const classesMap = {}
    const parseClasses = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 4) {
          classesMap[node.dept_id] = {
            grade: node.name.replace(/\d+班$/, ''),
            className: node.name.replace(/^[一二三四五六]年级/, '')
          }
        }
        if (node.children && node.children.length > 0) {
          parseClasses(node.children)
        }
      })
    }
    parseClasses(classResult.data)

    const result = await getStudentListV4({ page: 1, size: 2000 }, sid)
    const rawStudents = result.list || []

    if (rawStudents.length > 0) {
      const mapped = rawStudents.map(s => {
        const classInfo = classesMap[s.class_id]
        const grade = classInfo?.grade || ''
        const className = classInfo?.className || ''
        const gradeNum = grade ? parseInt(grade.replace('年级', '')) : 0
        const age = gradeNum > 0 ? gradeNum + 6 : 8
        return {
          id: s.student_id,
          name: s.name,
          gender: s.gender === 1 ? '男' : '女',
          grade,
          class: className,
          className: className,
          age,
          faceRegistered: !!s.cimg_url,
          cimgUrl: s.cimg_url || '',
          studentNumber: s.student_number || '-',
          status: '正常'
        }
      })

      apiStudents.value = mapped
      sessionStorage.setItem(`students_${sid}`, JSON.stringify(mapped))
     

      refreshEvaluationRecords(true)
    }
    loading.value = false
  } catch (error) {
    console.warn('[StudentEval] API加载失败:', error.message)
    const cached = getRealStudents(sid)
    if (cached.length > 0) apiStudents.value = normalizeStudents(cached)
    loading.value = false
  }
}

const searchQuery = ref('')
const filterTheme = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(12)

const allStudents = computed(() => {
  let source
  if (apiStudents.value.length > 0) {
    source = apiStudents.value
  } else {
    const realStudents = getRealStudents(schoolId.value)
    const hasValidFormat = realStudents.length > 0 && realStudents.some(s => {
      const c = s.class
      return typeof c === 'string' && c.length > 0 && !/^\d+$/.test(c)
    })
    source = hasValidFormat ? normalizeStudents(realStudents) : (mockDB[schoolId.value]?.students || [])
  }
  return source.map(s => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    class: s.class,
    className: s.className || `${s.grade || ''}${s.class || ''}`
  }))
})

const selectedStudent = usePersistedRef(`smart_pe_selected_student_${schoolId.value}`, null)

const route = useRoute()

const props = defineProps({
  query: {
    type: Object,
    default: () => ({})
  }
})

onMounted(() => {
  loadDaiweiData()

  nextTick(() => {
    setTimeout(() => {
      const queryStudentName = props.query.studentName || route.query.studentName
      const queryTab = props.query.tab || route.query.tab
      
      if (queryStudentName && allStudents.value.length > 0) {
        const matchedStudent = allStudents.value.find(s => s.name === queryStudentName)
        if (matchedStudent) {
          selectedStudent.value = matchedStudent.id
        } else {
          console.warn(`学生 ${queryStudentName} 未找到，使用默认学生`)
          selectedStudent.value = allStudents.value[0].id
        }
      } else if (!selectedStudent.value && allStudents.value.length > 0) {
        selectedStudent.value = allStudents.value[0].id
      }
      
      if (queryTab) {
        activeTab.value = queryTab
      }
    }, 100)
  })
})

onActivated(() => {
  loading.value = true
  loadDaiweiData()
})

watch(() => route.query.studentName, (newName) => {
  if (newName && allStudents.value.length > 0) {
    const matchedStudent = allStudents.value.find(s => s.name === newName)
    if (matchedStudent) {
      selectedStudent.value = matchedStudent.id
    }
  }
})

watch(() => props.query, (newQuery) => {
  if (newQuery.studentName && allStudents.value.length > 0) {
    const matchedStudent = allStudents.value.find(s => s.name === newQuery.studentName)
    if (matchedStudent) {
      selectedStudent.value = matchedStudent.id
    }
  }
  if (newQuery.tab) {
    activeTab.value = newQuery.tab
  }
}, { deep: true })

const currentStudentEvaluations = computed(() => {
  if (!selectedStudent.value) return []
  const matched = evaluationRecords.value.filter(e => e.studentId === selectedStudent.value)
 
  return matched
})

const currentStudentFiveEduScores = computed(() => {
  if (!selectedStudent.value) {
    const allEvals = evaluationRecords.value.filter(e => e.score > 0)
    if (allEvals.length === 0) return { moral: 78, intellectual: 76, physical: 75, aesthetic: 74, labor: 77 }
    
    const avg = (field) => {
      const vals = allEvals.map(r => r[field]).filter(v => v != null && v !== undefined)
      return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 75
    }
    return {
      moral: avg('moral'),
      intellectual: avg('intellectual'),
      physical: avg('physical'),
      aesthetic: avg('aesthetic'),
      labor: avg('labor')
    }
  }
  
  const evals = currentStudentEvaluations.value
  if (evals.length === 0) return { moral: 78, intellectual: 76, physical: 75, aesthetic: 74, labor: 77 }
  
  const latest = evals[0]
  return {
    moral: latest.moral || 75,
    intellectual: latest.intellectual || 75,
    physical: latest.physical || 75,
    aesthetic: latest.aesthetic || 75,
    labor: latest.labor || 75
  }
})

const currentStudentStats = computed(() => {
  const evals = currentStudentEvaluations.value
  const random = createSeededRandom(schoolId.value + '_stuStats_' + (selectedStudent.value || 'none'))
  if (evals.length === 0) {
    return { totalScore: 0, evaluationCount: 0, level: '暂无数据', improveRate: 0 }
  }

  const scores = evals.map(e => e.score).filter(v => v > 0)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  let level = '及格'
  if (avgScore >= 90) level = '优秀'
  else if (avgScore >= 80) level = '良好'
  else if (avgScore < 60) level = '不及格'

  return {
    totalScore: avgScore,
    evaluationCount: evals.length,
    level,
    improveRate: Math.floor(random() * 20) - 5
  }
})

const getLevelClass = (level) => {
  const classMap = {
    '优秀': 'level-excellent',
    '良好': 'level-good',
    '及格': 'level-pass',
    '不及格': 'level-fail',
    '暂无数据': ''
  }
  return classMap[level] || ''
}

const getLevelColor = (level) => {
  const colorMap = {
    '优秀': '#1E5AA8',
    '良好': '#3B82F6',
    '及格': '#F5A623',
    '不及格': '#E85D4E',
    '暂无数据': '#9CA3AF'
  }
  return colorMap[level] || '#6B7280'
}

const getSportsByType = (type) => {
  const sportsMap = {
    '体能测试': '体能测试',
    '课堂表现': '课堂训练',
    '体质健康': '体质监测',
    '技能提升': '技能训练',
    '比赛心得': '比赛活动',
    '自我反思': '综合'
  }
  return sportsMap[type] || '综合'
}

const aiAnalysisData = computed(() => {
  const evals = currentStudentEvaluations.value
  const avgScore = currentStudentStats.value.totalScore || 75
  const random = createSeededRandom(schoolId.value + '_aiAnalysis_' + (selectedStudent.value || 'none'))

  if (evals.length === 0) {
    return {
      entropy: { consistency: 0.89, dispersion: 0.72, correction: 0.95 },
      sentiment: { score: 75 + Math.floor(random() * 20), tendency: avgScore >= 80 ? '积极' : avgScore >= 60 ? '中性' : '消极' },
      keywords: {
        positive: ['参与积极', '态度认真', '遵守纪律'],
        negative: ['需加强练习', '有待提高']
      }
    }
  }

  const comments = evals.map(e => e.comments).filter(c => c && c.length > 0)
  const hasPositive = comments.some(c => /积极|进步|优秀|出色|认真|标准/.test(c))
  const hasNegative = comments.some(c => /不足|需|有待|注意/.test(c))

  const positiveKeywords = []
  const negativeKeywords = []

  if (hasPositive) {
    positiveKeywords.push('积极参与')
    if (avgScore >= 85) positiveKeywords.push('表现优秀')
    if (avgScore >= 80) positiveKeywords.push('进步明显')
    positiveKeywords.push('态度认真')
  } else {
    positiveKeywords.push('态度端正')
    positiveKeywords.push('遵守纪律')
  }

  if (hasNegative) {
    negativeKeywords.push('需加强练习')
    if (avgScore < 70) negativeKeywords.push('基础薄弱')
  } else {
    negativeKeywords.push('继续保持')
  }

  return {
    entropy: {
      consistency: parseFloat((0.85 + random() * 0.1).toFixed(2)),
      dispersion: parseFloat((0.68 + random() * 0.2).toFixed(2)),
      correction: parseFloat((0.92 + random() * 0.06).toFixed(2))
    },
    sentiment: {
      score: avgScore >= 80 ? 80 + Math.floor(random() * 18) : avgScore >= 60 ? 60 + Math.floor(random() * 20) : 40 + Math.floor(random() * 20),
      tendency: avgScore >= 80 ? '积极' : avgScore >= 60 ? '中性' : '消极'
    },
    keywords: {
      positive: positiveKeywords.slice(0, 4),
      negative: negativeKeywords.slice(0, 3)
    }
  }
})

const schoolData = computed(() => {
  return getSchoolMockData(schoolId.value)
})

const schoolProfile = computed(() => getSchoolProfile(schoolId.value))

const MOCK_FOCUS_RECORDS = computed(() => schoolProfile.value.studentEval.focusRecords)
const MOCK_HEATMAP_DATA = computed(() => schoolProfile.value.studentEval.heatmapData)
const MOCK_PARENT_EVALUATIONS = computed(() => schoolProfile.value.studentEval.parentEvaluations)
const MOCK_GROWTH_LOGS = computed(() => schoolProfile.value.studentEval.growthLogs)

const _teachers = computed(() => mockDB[schoolId.value]?.teachers || [])
const _students = computed(() => {
  if (apiStudents.value.length > 0) {
    return apiStudents.value
  }
  const realStudents = getRealStudents(schoolId.value)
  const hasValidFormat = realStudents.length > 0 && realStudents.some(s => {
    const c = s.class
    return typeof c === 'string' && c.length > 0 && !/^\d+$/.test(c)
  })
  if (hasValidFormat) {
    return normalizeStudents(realStudents)
  }
  return mockDB[schoolId.value]?.students || []
})
const _t = (i) => _teachers.value[i % _teachers.value.length]?.name || '教师'
const _s = (i) => _students.value[i % _students.value.length]

const teacherScoreItemsData = computed(() => {
  const sid = schoolId.value
  const courses = sid === 'hailin-zirong-primary'
    ? ['排球体育课', '足球体育课', '田径体育课']
    : sid === 'linhai-experimental-primary'
      ? ['游泳体育课', '体操体育课', '武术体育课']
      : ['篮球体育课', '田径体育课', '跳绳体育课']
  const classNames = sid === 'hailin-zirong-primary'
    ? ['三年级1班', '四年级2班', '五年级1班']
    : sid === 'linhai-experimental-primary'
      ? ['四年级1班', '五年级2班', '六年级1班']
      : ['五年级1班', '三年级2班', '四年级1班']
  const scores = [
    { content: 4.5, method: 4.0, interaction: 4.5, participation: 4.0, effectiveness: 4.5 },
    { content: 4.0, method: 4.5, interaction: 4.0, participation: 4.5, effectiveness: 4.0 },
    { content: 5.0, method: 4.5, interaction: 5.0, participation: 4.5, effectiveness: 5.0 }
  ]
  const totals = [4.3, 4.2, 4.8]
  return [0, 1, 2].map(i => ({
    id: i + 1, teacherName: _t(i), course: courses[i], className: classNames[i], classType: '行政班',
    date: `2026-05-${28 - i}`, scores: scores[i], totalScore: totals[i], comment: ''
  }))
})

const teacherScoreRecordsData = computed(() => {
  const sid = schoolId.value
  const courses = sid === 'hailin-zirong-primary'
    ? ['排球体育课', '足球体育课', '田径体育课']
    : sid === 'linhai-experimental-primary'
      ? ['游泳体育课', '体操体育课', '武术体育课']
      : ['篮球体育课', '田径体育课', '跳绳体育课']
  const classes = sid === 'hailin-zirong-primary'
    ? ['三年级1班', '四年级2班', '五年级1班']
    : sid === 'linhai-experimental-primary'
      ? ['四年级1班', '五年级2班', '六年级1班']
      : ['五年级1班', '三年级2班', '四年级1班']
  const comments = sid === 'hailin-zirong-primary'
    ? ['排球教学规范', '课堂互动积极', '田径训练扎实']
    : sid === 'linhai-experimental-primary'
      ? ['游泳教学出色', '体操动作标准', '武术精神饱满']
      : ['课堂组织有序', '互动性强', '教学效果优秀']
  return [0, 1, 2].map(i => ({
    teacherName: _t(i), course: courses[i], className: classes[i],
    score: [4.3, 4.2, 4.8][i], date: `2026-05-${28 - i}`, evaluator: '教务处', comment: comments[i]
  }))
})

const recommendedResourcesData = computed(() => {
  const sid = schoolId.value
  if (sid === 'hailin-zirong-primary') {
    return [
      { id: 1, title: '排球垫球技巧训练', type: 'video', duration: '15分钟', difficulty: '初级', tags: ['排球', '手臂力量'] },
      { id: 2, title: '足球带球过人训练', type: 'plan', duration: '30分钟', difficulty: '中级', tags: ['足球', '灵活性'] },
      { id: 3, title: '田径起跑姿势纠正', type: 'guide', duration: '10分钟', difficulty: '初级', tags: ['起跑', '姿势'] },
      { id: 4, title: '跳远助跑节奏训练', type: 'video', duration: '12分钟', difficulty: '中级', tags: ['跳远', '节奏'] },
      { id: 5, title: '足球射门练习计划', type: 'plan', duration: '20分钟', difficulty: '初级', tags: ['射门', '准确性'] },
      { id: 6, title: '排球发球专项训练', type: 'plan', duration: '45分钟', difficulty: '高级', tags: ['发球', '力量'] }
    ]
  }
  if (sid === 'linhai-experimental-primary') {
    return [
      { id: 1, title: '游泳自由泳呼吸训练', type: 'video', duration: '15分钟', difficulty: '初级', tags: ['游泳', '呼吸'] },
      { id: 2, title: '体操翻滚动作训练', type: 'plan', duration: '30分钟', difficulty: '中级', tags: ['体操', '协调性'] },
      { id: 3, title: '武术基本功训练指南', type: 'guide', duration: '10分钟', difficulty: '初级', tags: ['武术', '基本功'] },
      { id: 4, title: '游泳转身技巧', type: 'video', duration: '12分钟', difficulty: '中级', tags: ['转身', '技术'] },
      { id: 5, title: '体操平衡训练计划', type: 'plan', duration: '20分钟', difficulty: '初级', tags: ['平衡', '稳定性'] },
      { id: 6, title: '武术套路综合训练', type: 'plan', duration: '45分钟', difficulty: '高级', tags: ['套路', '综合'] }
    ]
  }
  return [
    { id: 1, title: '立定跳远基础训练视频', type: 'video', duration: '15分钟', difficulty: '初级', tags: ['腿部力量', '爆发力'] },
    { id: 2, title: '核心力量训练计划', type: 'plan', duration: '30分钟', difficulty: '中级', tags: ['核心力量', '稳定性'] },
    { id: 3, title: '仰卧起坐动作纠正指南', type: 'guide', duration: '10分钟', difficulty: '初级', tags: ['动作规范', '腹部力量'] },
    { id: 4, title: '50米跑起跑技巧', type: 'video', duration: '12分钟', difficulty: '中级', tags: ['起跑', '速度'] },
    { id: 5, title: '跳绳节奏训练', type: 'plan', duration: '20分钟', difficulty: '初级', tags: ['节奏', '协调性'] },
    { id: 6, title: '综合体能提升训练', type: 'plan', duration: '45分钟', difficulty: '高级', tags: ['综合', '体能'] }
  ]
})

const portraitStudentsData = computed(() => {
  return [0, 1, 2, 3, 4].map(i => {
    const stu = _s(i)
    return { id: i + 1, name: stu?.name || `学生${i + 1}`, className: `${stu?.grade || '五年级'}${stu?.class || '(1)班'}` }
  })
})

const generatePortraitData = (stu, idx) => {
  const random = createSeededRandom(schoolId.value + '_portrait_' + (stu?.id || idx))
  const strengthSets = [
    [{ name: '篮球', level: '优秀' }, { name: '立定跳远', level: '良好' }, { name: '跳绳', level: '优秀' }, { name: '耐力跑', level: '良好' }],
    [{ name: '体操', level: '优秀' }, { name: '柔韧性', level: '优秀' }, { name: '跳绳', level: '良好' }, { name: '舞蹈', level: '良好' }],
    [{ name: '足球', level: '优秀' }, { name: '短跑', level: '优秀' }, { name: '体能', level: '良好' }, { name: '耐力', level: '良好' }],
    [{ name: '游泳', level: '良好' }, { name: '跳绳', level: '及格' }, { name: '耐力', level: '良好' }, { name: '协调性', level: '及格' }],
    [{ name: '艺术体操', level: '优秀' }, { name: '舞蹈', level: '优秀' }, { name: '柔韧性', level: '优秀' }, { name: '协调性', level: '良好' }]
  ]
  const growthDesc = [
    ['立定跳远成绩提升5cm', '完成跳绳专项训练', '50米跑成绩提升0.8秒', '参加篮球兴趣班', '仰卧起坐达标优秀'],
    ['仰卧起坐提升10个', '参加舞蹈训练', '柔韧性测试达标', '体操基础训练', '跳绳成绩提升'],
    ['50米跑达到优秀标准', '参加足球训练', '肺活量提升', '体能强化训练', '立定跳远突破'],
    ['体育成绩达标', '基础体能训练', '跳绳进步明显', '参加游泳课', '自信心提升'],
    ['舞蹈表演获奖', '艺术体操训练', '形体测试优秀', '瑜伽基础训练', '柔韧性提升']
  ]
  const recSets = [
    ['推荐加入校篮球队', '建议参加区运动会田径项目', '可考虑篮球特长生培养'],
    ['推荐参加体操兴趣班', '建议培养舞蹈特长', '可考虑艺术体操方向'],
    ['推荐加入校足球队', '建议参加短跑训练', '可考虑田径特长生'],
    ['建议加强体能训练', '推荐参加游泳兴趣班', '可考虑基础运动技能提升'],
    ['推荐参加艺术体操队', '建议培养舞蹈特长', '可考虑艺术类体育发展']
  ]
  
  const i = idx % strengthSets.length
  const name = stu?.name || `学生${idx + 1}`
  const cls = `${stu?.grade || '五年级'}(${stu?.class || '1'})班`
  
  const stuEvals = evaluationRecords.value.filter(e => e.studentId === stu.id)
  let totalScore = 75
  let physicalScore = 75
  let skillScore = 75
  let interestScore = 75
  let activityCount = 30
  let level = '及格'
  let levelClass = 'level-pass'
  
  if (stuEvals.length > 0) {
    const scores = stuEvals.map(e => e.score).filter(v => v > 0)
    totalScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75
    
    const phys = stuEvals.map(e => e.physical || 0).filter(v => v > 0)
    physicalScore = phys.length > 0 ? Math.round(phys.reduce((a, b) => a + b, 0) / phys.length) : 75
    
    const skill = stuEvals.map(e => e.labor || 0).filter(v => v > 0)
    skillScore = skill.length > 0 ? Math.round(skill.reduce((a, b) => a + b, 0) / skill.length) : 75
    
    const inter = stuEvals.map(e => e.aesthetic || 0).filter(v => v > 0)
    interestScore = inter.length > 0 ? Math.round(inter.reduce((a, b) => a + b, 0) / inter.length) : 75
    
    activityCount = stuEvals.length * 8 + Math.floor(random() * 20)
    
    if (totalScore >= 90) { level = '优秀'; levelClass = 'level-excellent' }
    else if (totalScore >= 80) { level = '良好'; levelClass = 'level-good' }
    else if (totalScore < 60) { level = '不及格'; levelClass = 'level-fail' }
  } else {
    totalScore = 70 + Math.floor(random() * 25)
    physicalScore = 68 + Math.floor(random() * 28)
    skillScore = 65 + Math.floor(random() * 30)
    interestScore = 70 + Math.floor(random() * 25)
    activityCount = 25 + Math.floor(random() * 25)
    if (totalScore >= 90) { level = '优秀'; levelClass = 'level-excellent' }
    else if (totalScore >= 80) { level = '良好'; levelClass = 'level-good' }
    else if (totalScore < 60) { level = '不及格'; levelClass = 'level-fail' }
  }
  
  const radarData = [
    totalScore,
    physicalScore,
    skillScore,
    interestScore,
    Math.floor((totalScore + physicalScore) / 2),
    Math.floor((skillScore + interestScore) / 2)
  ]
  
  return {
    id: stu.id, name, className: cls, level, levelClass,
    totalScore, physicalScore, skillScore, interestScore, activityCount,
    growthHistory: growthDesc[i].map((desc, j) => ({
      date: `2026-05-${20 - j * 5}`, type: j % 2 === 0 ? 'improve' : 'training', description: desc
    })),
    strengths: strengthSets[i], recommendations: recSets[i], radarData
  }
}

const portraitsDataComputed = computed(() => {
  const result = {}
  _students.value.forEach((stu, i) => {
    result[stu.id] = generatePortraitData(stu, i)
  })
  return result
})

const parentStatsData = computed(() => {
  const ratio = (_students.value.length || 110) / 110
  return {
    sent: Math.round(456 * ratio),
    completed: Math.round(389 * ratio),
    pending: Math.round(67 * ratio),
    photos: Math.round(234 * ratio)
  }
})

const parentStatsComputed = computed(() => {
  const evaluations = parentEvaluations.value || []
  const completed = evaluations.filter(e => e.satisfaction && e.satisfaction > 0).length
  const photos = evaluations.reduce((sum, e) => sum + (e.photos || 0), 0)
  return {
    sent: evaluations.length,
    completed,
    pending: evaluations.length - completed,
    photos
  }
})

const growthCategoriesData = computed(() => {
  const sid = schoolId.value
  if (sid === 'hailin-zirong-primary') {
    return [
      { id: 1, name: '体育活动记录', icon: '🏃', count: 98 },
      { id: 2, name: '技能学习日志', icon: '📚', count: 56 },
      { id: 3, name: '比赛心得', icon: '🏆', count: 28 },
      { id: 4, name: '自我反思', icon: '💭', count: 145 }
    ]
  }
  if (sid === 'linhai-experimental-primary') {
    return [
      { id: 1, name: '体育活动记录', icon: '🏃', count: 132 },
      { id: 2, name: '技能学习日志', icon: '📚', count: 78 },
      { id: 3, name: '比赛心得', icon: '🏆', count: 52 },
      { id: 4, name: '自我反思', icon: '💭', count: 198 }
    ]
  }
  return [
    { id: 1, name: '体育活动记录', icon: '🏃', count: 156 },
    { id: 2, name: '技能学习日志', icon: '📚', count: 89 },
    { id: 3, name: '比赛心得', icon: '🏆', count: 45 },
    { id: 4, name: '自我反思', icon: '💭', count: 234 }
  ]
})

const growthCategoriesComputed = computed(() => {
  const logs = growthLogs.value || []
  const categoryDefs = [
    { id: 1, name: '体育活动记录', icon: '🏃', types: ['体能测试', '课堂表现', '体质健康', '体育活动'] },
    { id: 2, name: '技能学习日志', icon: '📚', types: ['技能学习', '技能提升', '学习心得'] },
    { id: 3, name: '比赛心得', icon: '🏆', types: ['比赛心得', '比赛记录'] },
    { id: 4, name: '自我反思', icon: '💭', types: ['自我反思', '自我评价'] }
  ]
  return categoryDefs.map(cat => {
    const count = logs.filter(log => cat.types.includes(log.type)).length
    return { id: cat.id, name: cat.name, icon: cat.icon, count }
  })
})

const nationalTestResults = computed(() => schoolData.value?.nationalTestResults || [])

const evaluationRecords = ref([])

const refreshEvaluationRecords = (force = false) => {
  const persistedKey = `smart_pe_evaluation_records_${schoolId.value}`
  const persisted = sessionStorage.getItem(persistedKey)

  let students = _students.value
  if (!students || students.length === 0) {
    students = mockDB[schoolId.value]?.students || []
  }
  const currentIds = new Set(students.map(s => s.id))

  let loaded = false
  if (!force && persisted) {
    const cached = JSON.parse(persisted)
    const hasMatch = cached.some(r => currentIds.has(r.studentId))
   
    if (hasMatch) {
      evaluationRecords.value = cached
      loaded = true
    } else {
      sessionStorage.removeItem(persistedKey)
    }
  }

  if (!loaded) {
    if (students.length === 0) {
      console.warn('[StudentEval] no students available, cannot generate records')
      return
    }
    const slice = students.slice(0, 20)
    const themes = ['月度体育测评', '学期综合评价', '课后教学反馈', '心理健康评估']
    const random = createSeededRandom(schoolId.value + '_evalRecords')
    const mockRecords = []
    for (let i = 0; i < 50; i++) {
      const student = slice[i % slice.length]
      const moral = Math.floor(65 + random() * 35)
      const intellectual = Math.floor(60 + random() * 38)
      const physical = Math.floor(55 + random() * 40)
      const aesthetic = Math.floor(62 + random() * 35)
      const labor = Math.floor(60 + random() * 38)
      const score = Math.round((moral * 0.2 + intellectual * 0.15 + physical * 0.3 + aesthetic * 0.15 + labor * 0.2))
      const classDisplay = (student.class || '').replace(/班$/, '')
      mockRecords.push({
        id: `eval-${i}`,
        studentId: student.id,
        studentName: student.name,
        className: `${student.grade || ''}(${classDisplay}班)`,
        theme: themes[i % themes.length],
        score,
        moral,
        intellectual,
        physical,
        aesthetic,
        labor,
        type: i % 3 === 0 ? '自评' : i % 3 === 1 ? '互评' : '教师评',
        evaluator: i % 3 === 2 ? _t(i) : student.name,
        date: `2026-0${Math.floor(random() * 6) + 1}-${Math.floor(random() * 28) + 1}`,
        comments: ['表现优秀，积极参与', '动作标准，态度认真', '需要加强练习', '进步明显，继续努力'][Math.floor(random() * 4)]
      })
    }
    evaluationRecords.value = mockRecords
    sessionStorage.setItem(persistedKey, JSON.stringify(mockRecords))
   
  }
}

watch(schoolId, () => {
  refreshEvaluationRecords()
}, { immediate: true })

watch(evaluationRecords, (newVal) => {
  const persistedKey = `smart_pe_evaluation_records_${schoolId.value}`
  sessionStorage.setItem(persistedKey, JSON.stringify(newVal))
}, { deep: true })

const evalTypeMap = { teacher: '教师评价', parent: '家长评价', self: '自我评价', ai: 'AI评价' }
const evalTypeTagType = { teacher: '', parent: 'success', self: 'warning', ai: 'info' }

const evaluationColumns = [
  { prop: 'studentName', label: '学生姓名', slot: 'studentName', width: 100 },
  { prop: 'className', label: '班级', width: 120 },
  { prop: 'theme', label: '评价主题', width: 140 },
  { prop: 'type', label: '评价类型', slot: 'type', width: 110, align: 'center' },
  { prop: 'score', label: '得分', slot: 'score', width: 90, align: 'center' },
  { prop: 'evaluator', label: '评价人', width: 100 },
  { prop: 'date', label: '评价日期', width: 120 },
  { prop: 'comments', label: '评语', minWidth: 180 }
]

const filteredEvaluations = computed(() => {
  let result = [...(evaluationRecords.value || [])]
  
  if (selectedStudent.value) {
    result = result.filter(e => e.studentId === selectedStudent.value)
  }
  
  if (filterTheme.value) {
    result = result.filter(e => e.theme === filterTheme.value)
  }
  if (filterStatus.value) {
    result = result.filter(e => e.status === filterStatus.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(e => e.studentName.includes(q))
  }
  
  return result
})

const paginatedEvaluations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return (filteredEvaluations.value || []).slice(start, end)
})

const compareSubject = ref('longJump')

const subjectFieldMap = {
  longJump: 'longJump',
  sitUp: 'sitUps',
  run50m: 'fiftyMeter',
  skipping: 'sitUps',
  pullUp: 'pullUp'
}
const subjectLabelMap = {
  longJump: '立定跳远',
  sitUp: '仰卧起坐',
  run50m: '50米跑',
  skipping: '跳绳',
  pullUp: '引体向上'
}

const diagnosisStats = computed(() => {
  const tests = nationalTestResults.value || []
  const random = createSeededRandom(schoolId.value + '_diagnosis')
  const warningCount = tests.filter(t => t.totalScore < 60).length
  const totalStudents = tests.length || 1
  const improveCount = tests.filter(t => t.totalScore >= 75).length
  const classSet = new Set(tests.map(t => t.className || t.grade))
  return {
    warningCount,
    improveRate: Math.round((improveCount / totalStudents) * 100),
    classCount: classSet.size || 1,
    trainPlan: warningCount + Math.floor(random() * 5)
  }
})

const warningList = computed(() => {
  const tests = nationalTestResults.value || []
  const subjectField = subjectFieldMap[compareSubject.value] || 'longJump'
  const subjectLabel = subjectLabelMap[compareSubject.value] || '立定跳远'
  const random = createSeededRandom(schoolId.value + '_warningList')
  return tests
    .filter(t => t[subjectField] != null)
    .map(t => {
      const val = parseFloat(t[subjectField])
      const masteryRate = t.totalScore || Math.floor(50 + random() * 30)
      const className = t.className || t.class || `${t.grade || ''}班`
      return {
        id: t.id,
        studentName: t.studentName,
        className,
        actionName: subjectLabel,
        masteryRate,
        status: masteryRate < 50 ? 'high' : masteryRate < 70 ? 'medium' : 'low',
        suggestion: masteryRate < 50 ? '加强基础训练' : masteryRate < 70 ? '针对性练习' : '保持训练'
      }
    })
    .filter(w => w.masteryRate < 75)
    .sort((a, b) => a.masteryRate - b.masteryRate)
    .slice(0, 8)
})

const classCompareData = computed(() => {
  const tests = nationalTestResults.value || []
  const subjectField = subjectFieldMap[compareSubject.value] || 'longJump'
  const classMap = {}
  
  const getScoreValue = (t, field) => {
    const rawVal = parseFloat(t[field])
    if (isNaN(rawVal)) return t.totalScore || 60
    
    switch (field) {
      case 'longJump':
        return Math.round(Math.min(100, (rawVal / 2.5) * 100))
      case 'sitUps':
        return Math.round(Math.min(100, (rawVal / 60) * 100))
      case 'fiftyMeter':
        return Math.round(Math.max(0, 100 - ((rawVal - 6) * 10)))
      case 'vitalCapacity':
        return Math.round(Math.min(100, (rawVal / 4000) * 100))
      case 'sitAndReach':
        return Math.round(Math.min(100, ((rawVal + 10) / 40) * 100))
      case 'enduranceRun':
        return Math.round(Math.max(0, 100 - ((rawVal - 2) * 15)))
      case 'pullUp':
        return Math.round(Math.min(100, (rawVal / 20) * 100))
      default:
        return t.totalScore || 60
    }
  }
  
  tests.forEach(t => {
    let cn = t.className
    if (!cn) {
      const grade = t.grade || ''
      const cls = t.class || ''
      cn = `${grade}${cls}`
      if (!cn || cn === '班') cn = '未知班级'
    }
    if (!classMap[cn]) classMap[cn] = { total: 0, count: 0 }
    const val = getScoreValue(t, subjectField)
    classMap[cn].total += val
    classMap[cn].count++
  })
  
  return Object.entries(classMap).map(([className, data]) => ({
    className,
    score: data.count > 0 ? Math.round(data.total / data.count) : 0
  })).sort((a, b) => b.score - a.score)
})

const progressData = computed(() => {
  const records = evaluationRecords.value || []
  const random = createSeededRandom(schoolId.value + '_progress')
  const studentMap = {}
  records.forEach(r => {
    if (!studentMap[r.studentName]) {
      studentMap[r.studentName] = { scores: [], name: r.studentName }
    }
    if (r.score) studentMap[r.studentName].scores.push(r.score)
  })
  return Object.values(studentMap)
    .filter(s => s.scores.length >= 1)
    .map(s => {
      const avg = Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
      const lastScore = Math.max(60, avg - Math.floor(random() * 15))
      const currentScore = avg
      const rate = lastScore > 0 ? parseFloat(((currentScore - lastScore) / lastScore * 100).toFixed(1)) : 0
      return { studentName: s.name, lastScore, currentScore, rate }
    })
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 6)
})

const getMasteryClass = (rate) => {
  if (rate < 50) return 'mastery-danger'
  if (rate < 70) return 'mastery-warning'
  return 'mastery-success'
}

const getBarColor = (score) => {
  if (score >= 85) return '#1E5AA8'
  if (score >= 70) return '#3B82F6'
  if (score >= 60) return '#F5A623'
  return '#E85D4E'
}

const viewAllWarnings = () => {
  ElMessage.info('查看全部预警')
}

const warningDetailVisible = ref(false)
const currentWarning = ref(null)

const viewWarningDetail = (row) => {
  currentWarning.value = row
  warningDetailVisible.value = true
}

const pushTraining = (row) => {
  showResourcePushDialog.value = true
  currentPushStudent.value = row
  generateRecommendedResources(row)
}

const showResourcePushDialog = ref(false)
const currentPushStudent = ref(null)
const resourcePushForm = ref({
  selectedResources: [],
  customMessage: '',
  pushTime: 'immediate'
})

const recommendedResources = usePersistedRef(`smart_pe_recommended_resources_${schoolId.value}`, [...recommendedResourcesData.value])

const generateRecommendedResources = (student) => {
  const actionTypeMap = {
    '立定跳远': [1, 6],
    '仰卧起坐': [2, 3],
    '50米跑': [4, 6],
    '跳绳': [5, 6]
  }

  const resourceIds = actionTypeMap[student.actionName] || [1, 2, 6]
  resourcePushForm.value.selectedResources = resourceIds
}

const confirmPushResource = () => {
  if (resourcePushForm.value.selectedResources.length === 0) {
    ElMessage.warning('请选择要推送的训练资源')
    return
  }

  const selectedResourceNames = recommendedResources.value
    .filter(r => resourcePushForm.value.selectedResources.includes(r.id))
    .map(r => r.title)
    .join('、')

  ElMessage.success(`已向 ${currentPushStudent.value.studentName} 推送训练资源: ${selectedResourceNames}`)
  showResourcePushDialog.value = false
}

const getResourceTypeTag = (type) => {
  const typeMap = {
    video: 'primary',
    plan: 'success',
    guide: 'warning'
  }
  return typeMap[type] || 'info'
}

const getResourceTypeText = (type) => {
  const typeMap = {
    video: '视频',
    plan: '计划',
    guide: '指南'
  }
  return typeMap[type] || type
}

const scheduledPushTime = ref(null)

const portraitStudents = usePersistedRef(`smart_pe_portrait_students_${schoolId.value}`, [...portraitStudentsData.value])

const portraitsData = computed(() => portraitsDataComputed.value)

const currentPortrait = computed(() => {
  const data = portraitsData.value
  if (!selectedStudent.value) {
    const firstKey = Object.keys(data)[0]
    return data[firstKey] || null
  }
  if (data[selectedStudent.value]) {
    return data[selectedStudent.value]
  }
  const firstKey = Object.keys(data)[0]
  return data[firstKey] || null
})

let portraitRadarChartInstance = null

const initPortraitRadarChart = () => {
  const chartDom = document.getElementById('portraitRadarChart')
  if (!chartDom) return
  
  if (portraitRadarChartInstance) {
    portraitRadarChartInstance.dispose()
  }
  
  portraitRadarChartInstance = echarts.init(chartDom)
  
  const option = {
    radar: {
      indicator: [
        { name: '体能', max: 100 },
        { name: '技能', max: 100 },
        { name: '柔韧性', max: 100 },
        { name: '协调性', max: 100 },
        { name: '耐力', max: 100 },
        { name: '爆发力', max: 100 }
      ],
      center: ['50%', '50%'],
      radius: '65%'
    },
    series: [{
      type: 'radar',
      data: [{
        value: currentPortrait.value.radarData,
        name: currentPortrait.value.name,
        areaStyle: { color: 'rgba(30, 90, 168, 0.2)' },
        lineStyle: { color: '#1E5AA8', width: 2 },
        itemStyle: { color: '#1E5AA8' }
      }]
    }]
  }
  
  portraitRadarChartInstance.setOption(option)
}

watch(selectedStudent, () => {
  nextTick(() => {
    setTimeout(() => { 
      initPortraitRadarChart() 
      initRadarChart()
      initScoreChart()
    }, 200)
  })
})

const radarChart = ref(null)
const scoreChart = ref(null)
let radarChartInstance = null
let scoreChartInstance = null

const createDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const selectedEvaluation = ref(null)

const activityForm = ref({
  title: '',
  theme: '',
  customTheme: '',
  type: '临时任务',
  dateRange: [],
  scope: [],
  template: 'default',
  authMethods: ['面部识别'],
  remark: ''
})

const userCreatedActivities = usePersistedRef(`smart_pe_user_activities_${schoolId.value}`, [])

const fmtDate = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`

const activityList = computed(() => {
  const records = evaluationRecords.value || []
  const themeMap = {}
  const themes = ['月度体育测评', '学期综合评价', '课后教学反馈', '心理健康评估']
  const random = createSeededRandom(schoolId.value + '_activityList')
  const now = new Date('2026-07-16T08:00:00')
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const deadline = fmtDate(monthEnd)
  const today = fmtDate(now)

  themes.forEach(theme => {
    const themeRecords = records.filter(r => r.theme === theme)
    const uniqueStudents = new Set(themeRecords.map(r => r.studentId))
    const evaluated = themeRecords.filter(r => r.score && r.score > 0).length
    const participants = Math.max(uniqueStudents.size, evaluated)
    const progress = participants > 0 ? Math.round((evaluated / participants) * 100) : 0
    themeMap[theme] = {
      title: theme,
      status: progress >= 100 ? '已结束' : '进行中',
      date: today,
      participants: participants > 0 ? participants : 30 + Math.floor(random() * 40),
      evaluated: evaluated > 0 ? evaluated : Math.floor(random() * 25),
      deadline,
      progress: progress > 0 ? Math.min(progress, 100) : 50 + Math.floor(random() * 40)
    }
  })

  const fromData = themes.map(t => themeMap[t])
  fromData.forEach((item, idx) => {
    if (idx === 0 && item.status === '已结束') {
      item.status = '进行中'
      item.progress = Math.min(item.progress, 95)
    }
  })
  return [...fromData, ...(userCreatedActivities.value || [])]
})

const getTodayNewEvaluations = (title) => {
  const today = fmtDate(new Date('2026-07-16T08:00:00'))
  return evaluationRecords.value.filter(r => r.theme === title && r.date === today).length
}

const progressFilterTheme = ref('')

const overallStats = computed(() => {
  let records = evaluationRecords.value || []
  if (progressFilterTheme.value) {
    records = records.filter(r => r.theme === progressFilterTheme.value)
  }
  
  const uniqueStudents = new Set(records.map(r => r.studentId))
  const completed = records.filter(r => r.score && r.score > 0).length
  const total = Math.max(uniqueStudents.size, completed)
  const pending = total - completed
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  
  if (total === 0) {
    return { total: 27, completed: 24, pending: 3, rate: 89 }
  }
  
  return { total, completed, pending, rate }
})

const classProgressList = computed(() => {
  let records = evaluationRecords.value || []
  if (progressFilterTheme.value) {
    records = records.filter(r => r.theme === progressFilterTheme.value)
  }
  const classMap = {}
  records.forEach(r => {
    const cn = r.className || '未知班级'
    if (!classMap[cn]) classMap[cn] = { total: 0, evaluated: 0 }
    classMap[cn].total++
    if (r.score && r.score > 0) classMap[cn].evaluated++
  })
  if (Object.keys(classMap).length === 0) {
    const defaultClasses = ['一年级1班','一年级2班','二年级1班','二年级2班','三年级1班','三年级2班',
      '四年级1班','四年级2班','五年级1班','五年级2班','六年级1班','六年级2班']
    const random = createSeededRandom(schoolId.value + '_classProgress')
    return defaultClasses.map(cn => ({ className: cn, rate: Math.floor(40 + random() * 55) }))
  }
  return Object.entries(classMap).map(([className, data]) => ({
    className,
    rate: data.total > 0 ? Math.round((data.evaluated / data.total) * 100) : 0
  })).sort((a, b) => a.rate - b.rate)
})

const pendingStudents = computed(() => {
  let records = evaluationRecords.value || []
  if (progressFilterTheme.value) {
    records = records.filter(r => r.theme === progressFilterTheme.value)
  }
  const studentMap = {}
  records.forEach(r => {
    const key = r.studentId || r.studentName
    if (!studentMap[key]) {
      studentMap[key] = { studentName: r.studentName, className: r.className || '', count: 0, lastDate: '' }
    }
    studentMap[key].count++
    if (r.date > studentMap[key].lastDate) studentMap[key].lastDate = r.date
  })
  const students = Object.values(studentMap)
  if (students.length === 0) {
    return [
      { id: 1, studentName: '李明', className: '五年级(1)班', pendingDays: 7 },
      { id: 2, studentName: '王芳', className: '四年级(2)班', pendingDays: 5 },
      { id: 3, studentName: '张伟', className: '三年级(1)班', pendingDays: 4 }
    ]
  }
  const now = new Date('2026-07-16T08:00:00')
  return students
    .map((s, idx) => {
      const daysSince = s.lastDate ? Math.max(1, Math.floor((now - new Date(s.lastDate)) / 86400000)) : 99
      return { id: idx + 1, studentName: s.studentName, className: s.className, pendingDays: daysSince, count: s.count }
    })
    .sort((a, b) => a.count - b.count)
    .slice(0, 5)
})

const pendingListVisible = ref(false)

const allPendingStudents = computed(() => {
  let records = evaluationRecords.value || []
  if (progressFilterTheme.value) {
    records = records.filter(r => r.theme === progressFilterTheme.value)
  }
  const studentMap = {}
  records.forEach(r => {
    const key = r.studentId || r.studentName
    if (!studentMap[key]) {
      studentMap[key] = { studentName: r.studentName, className: r.className || '', count: 0, lastDate: '', studentId: r.studentId }
    }
    studentMap[key].count++
    if (r.date > studentMap[key].lastDate) studentMap[key].lastDate = r.date
  })
  const students = Object.values(studentMap)
  if (students.length === 0) {
    return [
      { id: 1, studentName: '李明', className: '五年级(1)班', count: 0, pendingDays: 7 },
      { id: 2, studentName: '王芳', className: '四年级(2)班', count: 0, pendingDays: 5 },
      { id: 3, studentName: '张伟', className: '三年级(1)班', count: 1, pendingDays: 4 },
      { id: 4, studentName: '刘洋', className: '二年级(3)班', count: 0, pendingDays: 9 },
      { id: 5, studentName: '陈静', className: '一年级(1)班', count: 2, pendingDays: 2 }
    ]
  }
  const now = new Date('2026-07-16T08:00:00')
  return students
    .map((s, idx) => {
      const daysSince = s.lastDate ? Math.max(1, Math.floor((now - new Date(s.lastDate)) / 86400000)) : 99
      return { id: idx + 1, studentName: s.studentName, className: s.className, count: s.count, pendingDays: daysSince, studentId: s.studentId }
    })
    .sort((a, b) => a.count - b.count)
})

const viewAllPending = () => {
  pendingListVisible.value = true
}

const activeTab = ref('overview')

watch(activeTab, (newTab) => {
  if (newTab === 'overview') {
    nextTick(() => {
      setTimeout(() => {
        initRadarChart()
        initScoreChart()
        initLstmChart()
      }, 300)
    })
  }
  if (newTab === 'digitalPortrait') {
    nextTick(() => {
      setTimeout(() => { initPortraitRadarChart() }, 300)
    })
  }
})

const focusFilter = ref('all')
const focusHeatmap = ref(null)

const generateFocusRecords = () => {
  const students = _students.value.slice(0, 15)
  const random = createSeededRandom(schoolId.value + '_focusRecords')
  const classMap = {
    '1-1': '一年级1班',
    '2-1': '二年级1班',
    '3-1': '三年级1班',
    '4-1': '四年级1班',
    '5-1': '五年级1班'
  }
  const classKeys = ['1-1', '2-1', '3-1', '4-1', '5-1']
  const records = []

  students.forEach((student, idx) => {
    const classKey = classKeys[idx % classKeys.length]
    const className = classMap[classKey]
    const focusRate = 55 + Math.floor(random() * 40)
    const duration = Math.floor(20 + random() * 25)
    const distractions = Math.floor(3 + random() * 25)

    records.push({
      id: `focus-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      class: className,
      focusRate,
      duration: `${duration}分钟`,
      distractions,
      date: `2026-0${Math.floor(random() * 3) + 4}-${Math.floor(random() * 28) + 1}`
    })
  })
  return records
}

const generateHeatmapData = () => {
  const students = _students.value.slice(0, 15)
  const random = createSeededRandom(schoolId.value + '_heatmap')
  const classMap = {
    '1-1': '一年级1班',
    '2-1': '二年级1班',
    '3-1': '三年级1班',
    '4-1': '四年级1班',
    '5-1': '五年级1班'
  }
  const classKeys = ['1-1', '2-1', '3-1', '4-1', '5-1']
  const timeLabels = ['0-10min', '10-20min', '20-30min', '30-40min', '40-50min', '50-60min']
  const data = []

  students.forEach((student, idx) => {
    const classKey = classKeys[idx % classKeys.length]
    const className = classMap[classKey]
    const baseFocusRate = 55 + Math.floor(random() * 40)

    const row = []
    for (let j = 0; j < 6; j++) {
      const variance = Math.floor(random() * 20) - 10
      const value = Math.max(40, Math.min(95, baseFocusRate + variance))
      row.push({
        value,
        student: student.name,
        time: timeLabels[j],
        studentId: student.id,
        class: className
      })
    }
    data.push(row)
  })
  return data
}

const focusRecords = usePersistedRef(`smart_pe_focus_records_${schoolId.value}`, generateFocusRecords())

const heatmapDataKey = `smart_pe_heatmap_data_${schoolId.value}`
const storedHeatmap = sessionStorage.getItem(heatmapDataKey)
let initialHeatmapData = generateHeatmapData()
if (storedHeatmap) {
  try {
    const parsed = JSON.parse(storedHeatmap)
    if (parsed.length > 0 && parsed[0][0]?.class) {
      initialHeatmapData = parsed
    }
  } catch (e) {
    sessionStorage.removeItem(heatmapDataKey)
  }
}
const heatmapData = usePersistedRef(heatmapDataKey, initialHeatmapData)

const focusFilterClassMap = {
  '1-1': '一年级1班',
  '2-1': '二年级1班',
  '3-1': '三年级1班',
  '4-1': '四年级1班',
  '5-1': '五年级1班'
}

const filteredFocusRecords = computed(() => {
  if (focusFilter.value === 'all' || !focusFilter.value) {
    return focusRecords.value
  }
  const className = focusFilterClassMap[focusFilter.value]
  if (!className) return focusRecords.value
  return focusRecords.value.filter(r => r.class === className)
})

const focusSummaryStats = computed(() => {
  const records = filteredFocusRecords.value
  if (!records || records.length === 0) {
    return { avgRate: 0, avgDuration: 0, totalDistractions: 0, level: '暂无数据' }
  }
  const avgRate = records.reduce((sum, r) => sum + (r.focusRate || 0), 0) / records.length
  const durations = records.map(r => parseFloat(String(r.duration).replace('分钟', '')) || 0)
  const avgDuration = durations.reduce((s, d) => s + d, 0) / durations.length
  const totalDistractions = records.reduce((s, r) => s + (r.distractions || 0), 0)
  const level = avgRate >= 85 ? '优秀' : avgRate >= 70 ? '良好' : avgRate >= 55 ? '一般' : '需关注'
  return {
    avgRate: avgRate.toFixed(1),
    avgDuration: avgDuration.toFixed(1),
    totalDistractions,
    level
  }
})

const filteredHeatmapData = computed(() => {
  const rawData = heatmapData.value
  
  if (!rawData || rawData.length === 0) {
    return generateHeatmapData().slice(0, 12)
  }
  
  if (focusFilter.value === 'all' || !focusFilter.value) {
    return rawData.slice(0, 12)
  }
  
  const className = focusFilterClassMap[focusFilter.value]
  if (!className) return rawData.slice(0, 12)
  
  const filtered = rawData.filter(row => row[0]?.class === className)
  
  if (filtered.length === 0) {
    return generateHeatmapData().filter(row => row[0]?.class === className).slice(0, 8)
  }
  
  return filtered.slice(0, 8)
})

const getHeatmapColor = (value) => {
  if (value >= 85) return '#1E5AA8'
  if (value >= 70) return '#3B82F6'
  if (value >= 55) return '#F5A623'
  return '#E85D4E'
}

const showHeatmapTooltip = (event, cell) => {
  const tooltip = document.createElement('div')
  tooltip.className = 'heatmap-tooltip'
  tooltip.innerHTML = `<div>学生: ${cell.student}</div><div>时段: ${cell.time}</div><div>专注度: ${cell.value}%</div>`
  tooltip.style.left = `${event.clientX + 10}px`
  tooltip.style.top = `${event.clientY + 10}px`
  document.body.appendChild(tooltip)
}

const hideHeatmapTooltip = () => {
  const tooltip = document.querySelector('.heatmap-tooltip')
  if (tooltip) tooltip.remove()
}

const refreshHeatmap = () => {
  const random = createSeededRandom(schoolId.value + '_refreshHeatmap')
  heatmapData.value = heatmapData.value.map(row =>
    row.map(cell => ({
      ...cell,
      value: Math.floor(random() * 30) + 60
    }))
  )
  ElMessage.success('专注力热力图数据已刷新')
}

const teacherScoreDialogVisible = ref(false)
const newTeacherScoreForm = ref({ teacherName: '', course: '', classType: '行政班', className: '', date: '' })
const teacherScoreItems = usePersistedRef(`smart_pe_teacher_score_items_${schoolId.value}`, [...teacherScoreItemsData.value])

const teacherScoreRecords = usePersistedRef(`smart_pe_teacher_score_records_${schoolId.value}`, [...teacherScoreRecordsData.value])

const teacherStats = computed(() => {
  const items = teacherScoreItems.value || []
  const records = teacherScoreRecords.value || []
  const totalScores = items.length > 0 ? items.reduce((sum, item) => sum + (item.totalScore || 0), 0) : 0
  const avgScore = items.length > 0 ? (totalScores / items.length).toFixed(1) : '0.0'
  const teacherSet = new Set([...items.map(i => i.teacherName), ...records.map(r => r.teacherName)])
  return {
    avgScore,
    totalCourses: items.length,
    pendingCount: items.filter(i => !i.totalScore).length || 0,
    teacherCount: teacherSet.size
  }
})

const adminClassesForTeacherScore = computed(() => {
  const classes = schoolData.value?.classes || []
  return classes.filter(c => c && c.type === '行政班')
})

const openTeacherScoreDialog = () => {
  newTeacherScoreForm.value = {
    teacherName: '',
    course: '',
    classType: '行政班',
    className: '',
    date: fmtDate(new Date())
  }
  teacherScoreDialogVisible.value = true
}

const confirmNewTeacherScore = () => {
  if (!newTeacherScoreForm.value.teacherName || !newTeacherScoreForm.value.course) {
    ElMessage.warning('请填写教师姓名和课程')
    return
  }
  if (!newTeacherScoreForm.value.className) {
    ElMessage.warning('请选择或输入授课班级')
    return
  }
  const newItem = {
    id: generateDeterministicId('teacher-score', `${newTeacherScoreForm.value.teacherName}-${newTeacherScoreForm.value.course}`),
    teacherName: newTeacherScoreForm.value.teacherName,
    course: newTeacherScoreForm.value.course,
    className: newTeacherScoreForm.value.className,
    classType: newTeacherScoreForm.value.classType,
    date: newTeacherScoreForm.value.date || fmtDate(new Date()),
    scores: { content: 0, method: 0, interaction: 0, participation: 0, effectiveness: 0 },
    totalScore: 0,
    comment: ''
  }
  teacherScoreItems.value = [...(teacherScoreItems.value || []), newItem]
  teacherScoreDialogVisible.value = false
  ElMessage.success('新建打分项已添加')
}

const saveTeacherScore = (item) => {
  const scores = item.scores
  item.totalScore = parseFloat(((scores.content + scores.method + scores.interaction + scores.participation + scores.effectiveness) / 5).toFixed(1))
  const existing = teacherScoreRecords.value.findIndex(r => r.teacherName === item.teacherName && r.course === item.course)
  const record = {
    teacherName: item.teacherName,
    course: item.course,
    className: item.className || '-',
    score: item.totalScore,
    date: item.date,
    evaluator: '教务处',
    comment: item.comment || ''
  }
  if (existing >= 0) {
    const updated = [...teacherScoreRecords.value]
    updated[existing] = record
    teacherScoreRecords.value = updated
  } else {
    teacherScoreRecords.value = [record, ...(teacherScoreRecords.value || [])]
  }
  ElMessage.success(`已保存对 ${item.teacherName} 的评分`)
}

const resetScore = (item) => {
  item.scores = { content: 0, method: 0, interaction: 0, participation: 0, effectiveness: 0 }
  item.totalScore = 0
  item.comment = ''
}

const refreshTeacherScores = () => {
  ElMessage.success('教师评分数据已刷新')
}

const parentStats = usePersistedRef(`smart_pe_parent_stats_${schoolId.value}`, { ...parentStatsData.value })

const parentEvaluations = usePersistedRef(`smart_pe_parent_evaluations_${schoolId.value}`, [...MOCK_PARENT_EVALUATIONS.value])

const growthCategories = usePersistedRef(`smart_pe_growth_categories_${schoolId.value}`, [...growthCategoriesData.value])

const growthLogs = usePersistedRef(`smart_pe_growth_logs_${schoolId.value}`, [...MOCK_GROWTH_LOGS.value])

const parentSurveyVisible = ref(false)
const previewVisible = ref(false)
const growthLogVisible = ref(false)
const growthLogMode = ref('create')
const growthLogTypeOptions = ['体能测试', '课堂表现', '体质健康', '技能提升', '比赛心得', '自我反思']
const growthLogForm = ref({ studentName: '', type: '', title: '', content: '', date: '' })
const originalGrowthLogIndex = ref(-1)
const previewUrl = ref('')
const showReportExport = ref(false)
const reportData = ref(null)

const parentSurveyForm = ref({
  title: '',
  month: '',
  classes: [],
  description: '',
  deadline: '',
  photos: []
})

const showParentSurveyDialog = () => {
  parentSurveyForm.value = {
    title: `2026年7月家长满意度调查`,
    month: '',
    classes: [],
    description: '请家长对本月学生在校体育活动参与情况进行评价',
    deadline: '',
    photos: []
  }
  parentSurveyVisible.value = true
}

const classCodeToClassName = (code) => {
  const gradeMap = { '1': '一年级', '2': '二年级', '3': '三年级', '4': '四年级', '5': '五年级', '6': '六年级' }
  const [gradeNum, classNum] = code.split('-')
  return `${gradeMap[gradeNum] || gradeNum}(${classNum}班)`
}

const submitParentSurvey = () => {
  if (!parentSurveyForm.value.title) {
    ElMessage.warning('请输入问卷标题')
    return
  }
  if (!parentSurveyForm.value.month) {
    ElMessage.warning('请选择评价月份')
    return
  }
  if (parentSurveyForm.value.classes.length === 0) {
    ElMessage.warning('请选择评价班级')
    return
  }
  
  const newParentRecords = []
  const newEvalRecords = []
  const selectedClassNames = parentSurveyForm.value.classes.map(classCodeToClassName)
  const today = fmtDate(new Date())
  
  schoolData.value?.students?.forEach(student => {
    const studentClassName = `${student.grade}(${student.class})`
    if (selectedClassNames.includes(studentClassName)) {
      newParentRecords.push({
        studentName: student.name,
        parentName: '-',
        month: parentSurveyForm.value.month,
        satisfaction: 0,
        photos: 0,
        comment: `[问卷] ${parentSurveyForm.value.title}`,
        date: today,
        className: studentClassName,
        status: '待填写'
      })
      
      newEvalRecords.push({
        id: `ev-${student.id}-${parentSurveyForm.value.month}`,
        studentId: student.id,
        studentName: student.name,
        className: studentClassName,
        grade: student.grade,
        theme: '综合素质评价',
        type: 'parent',
        score: 0,
        moral: 0,
        intellectual: 0,
        physical: 0,
        aesthetic: 0,
        labor: 0,
        satisfaction: 0,
        parentName: '-',
        teacherName: null,
        evaluator: '-',
        date: today,
        comments: `[问卷] ${parentSurveyForm.value.title}`,
        schoolName: schoolData.value?.schoolInfo?.name || ''
      })
    }
  })
  
  parentEvaluations.value = [...newParentRecords, ...(parentEvaluations.value || [])]
  const currentEvals = [...(evaluationRecords.value || [])]
  evaluationRecords.value = [...newEvalRecords, ...currentEvals]
  parentStats.value.sent += newParentRecords.length
  parentStats.value.pending += newParentRecords.length
  parentSurveyVisible.value = false
  ElMessage.success(`家长问卷已成功发起！已向 ${newParentRecords.length} 名学生发送`)
}

const handlePictureCardPreview = (uploadFile) => {
  previewUrl.value = uploadFile.url
  previewVisible.value = true
}

const showGrowthLogDialog = () => {
  growthLogMode.value = 'create'
  growthLogForm.value = { studentName: '', type: '', title: '', content: '', date: fmtDate(new Date()) }
  growthLogVisible.value = true
}

const viewGrowthLog = (row) => {
  growthLogMode.value = 'view'
  growthLogForm.value = {
    studentName: row.studentName,
    type: row.type || '自我反思',
    title: row.title || `${row.studentName}的成长记录`,
    content: row.content || '该学生在体育方面表现积极，参与度高，体能测试成绩稳步提升。',
    date: row.date || '2026-01-15'
  }
  growthLogVisible.value = true
}

const editGrowthLog = (row) => {
  growthLogMode.value = 'edit'
  originalGrowthLogIndex.value = growthLogs.value.findIndex(l => l.studentName === row.studentName && l.title === row.title && l.date === row.date)
  growthLogForm.value = {
    studentName: row.studentName,
    type: row.type || '自我反思',
    title: row.title || `${row.studentName}的成长记录`,
    content: row.content || '该学生在体育方面表现积极，参与度高，体能测试成绩稳步提升。',
    date: row.date || '2026-01-15'
  }
  growthLogVisible.value = true
}

const saveGrowthLog = () => {
  if (!growthLogForm.value.studentName || !growthLogForm.value.type || !growthLogForm.value.title || !growthLogForm.value.content) {
    ElMessage.warning('请填写完整信息（包括日志类型）')
    return
  }
  if (growthLogMode.value === 'create') {
    const newLog = {
      studentName: growthLogForm.value.studentName,
      type: growthLogForm.value.type,
      title: growthLogForm.value.title,
      content: growthLogForm.value.content,
      sports: getSportsByType(growthLogForm.value.type),
      duration: '-',
      date: growthLogForm.value.date || fmtDate(new Date())
    }
    growthLogs.value = [newLog, ...(growthLogs.value || [])]
    ElMessage.success('成长日志已保存')
  } else {
    const idx = originalGrowthLogIndex.value
    if (idx >= 0 && idx < growthLogs.value.length) {
      const updated = [...growthLogs.value]
      updated[idx] = { 
        ...updated[idx], 
        type: growthLogForm.value.type,
        title: growthLogForm.value.title, 
        content: growthLogForm.value.content, 
        sports: getSportsByType(growthLogForm.value.type),
        date: growthLogForm.value.date || updated[idx].date 
      }
      growthLogs.value = updated
      ElMessage.success('成长日志已更新')
    } else {
      ElMessage.error('未找到对应的日志记录，请重试')
    }
  }
  growthLogVisible.value = false
}

const refreshFocusData = () => {
  ElMessage.success('专注力数据已刷新')
}

const refreshParentData = () => {
  ElMessage.success('家长评价数据已刷新')
}

const refreshGrowthData = () => {
  ElMessage.success('成长日志数据已刷新')
}

const showAHPConfig = ref(false)

const ahpMatrixData = usePersistedRef(`smart_pe_ahp_matrix_${schoolId.value}`, [...MOCK_AHP_MATRIX])

const lstmChartRef = ref(null)
let lstmChartInstance = null

const calculateAHP = () => {
  ElMessage.success('AHP权重已重新计算')
}

const resetAHP = () => {
  ahpMatrixData.value = [...MOCK_AHP_MATRIX]
  ElMessage.success('AHP矩阵已重置')
}

const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-pass'
  return 'score-fail'
}

const refreshData = () => {
  searchQuery.value = ''
  filterTheme.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  nextTick(() => {
    initRadarChart()
    initScoreChart()
    initPortraitRadarChart()
    initLstmChart()
  })
  ElMessage.success('数据已刷新')
}

const exportReport = () => {
  const headers = ['学生姓名', '班级', '评价类型', '评价人', '得分', '满意度', '评价时间', '评价内容']
  const rows = filteredEvaluations.value.map(evalItem => [
    evalItem.studentName,
    evalItem.className || '-',
    evalTypeMap[evalItem.type] || evalItem.type || '-',
    evalItem.evaluator || evalItem.parentName || evalItem.teacherName || '-',
    evalItem.score || '-',
    evalItem.satisfaction ? evalItem.satisfaction + '星' : '-',
    evalItem.date,
    evalItem.comments || '-'
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `学生评价报告_${fmtDate(new Date())}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('评价报告已导出')
}

const handleReportExportStart = (data) => {
}

const handleReportExportEnd = () => {
  ElMessage.success('评价报告导出成功')
}

const showCreateDialog = () => {
  createDialogVisible.value = true
}
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const confirmCreateActivity = () => {
  if (!activityForm.value.title) {
    ElMessage.warning('请输入活动名称')
    return
  }
  if (!activityForm.value.theme) {
    ElMessage.warning('请选择评价主题')
    return
  }
  if (!activityForm.value.dateRange || activityForm.value.dateRange.length === 0) {
    ElMessage.warning('请选择开放时间')
    return
  }
  if (activityForm.value.scope.length === 0) {
    ElMessage.warning('请选择参与范围')
    return
  }
  
  const newActivity = {
    title: activityForm.value.title,
    status: '未开始',
    date: formatDate(activityForm.value.dateRange[0]),
    participants: 0,
    evaluated: 0,
    deadline: formatDate(activityForm.value.dateRange[1]),
    progress: 0
  }
  
  userCreatedActivities.value = [newActivity, ...(userCreatedActivities.value || [])]
  createDialogVisible.value = false
  ElMessage.success('评价活动创建成功')
  
  activityForm.value = {
    title: '',
    theme: '',
    customTheme: '',
    type: '临时任务',
    dateRange: [],
    scope: [],
    template: 'default',
    authMethods: ['面部识别'],
    remark: ''
  }
}

const viewDetail = (row) => {
  selectedEvaluation.value = row
  detailDialogVisible.value = true
}

const generateReport = (row) => {
  if (!row) return
  reportData.value = {
    type: 'evaluation',
    studentName: row.studentName,
    className: '四年级5班',
    studentId: row.id,
    scores: {
      '综合素质': row.score,
      '体育表现': 85,
      '学习态度': 90,
      '团队协作': 88
    },
    recommendation: row.comments || '该生表现优秀，继续保持'
  }
  showReportExport.value = true
}

const initRadarChart = () => {
  if (!radarChart.value) return
  if (radarChartInstance) { radarChartInstance.dispose(); radarChartInstance = null }
  radarChartInstance = echarts.init(radarChart.value)
  
  const scores = currentStudentFiveEduScores.value
  const personalData = [scores.moral, scores.intellectual, scores.physical, scores.aesthetic, scores.labor]
  
  const currentStudentName = allStudents.value.find(s => s.id === selectedStudent.value)?.name || '全校平均'
  
  const allRecords = evaluationRecords.value?.filter(e => e.score > 0) || []
  const avg = (field) => {
    const vals = allRecords.map(r => r[field]).filter(v => v != null && v !== undefined)
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 75
  }
  const schoolDataArr = [avg('moral'), avg('intellectual'), avg('physical'), avg('aesthetic'), avg('labor')]

  const seriesData = selectedStudent.value
    ? [
        {
          value: personalData,
          name: currentStudentName,
          areaStyle: { color: 'rgba(45, 125, 70, 0.2)' },
          lineStyle: { color: '#1E5AA8', width: 2 },
          itemStyle: { color: '#1E5AA8' }
        },
        {
          value: schoolDataArr,
          name: '全校平均',
          areaStyle: { color: 'rgba(59, 130, 246, 0.15)' },
          lineStyle: { color: '#3B82F6', width: 2, type: 'dashed' },
          itemStyle: { color: '#3B82F6' }
        }
      ]
    : [
        {
          value: personalData,
          name: '全校平均',
          areaStyle: { color: 'rgba(45, 125, 70, 0.25)' },
          lineStyle: { color: '#1E5AA8', width: 2 },
          itemStyle: { color: '#1E5AA8' }
        }
      ]

  radarChartInstance.setOption({
    tooltip: {},
    legend: { bottom: 10, textStyle: { color: '#6B7280', fontSize: 12 } },
    radar: {
      indicator: [
        { name: '德', max: 100 },
        { name: '智', max: 100 },
        { name: '体', max: 100 },
        { name: '美', max: 100 },
        { name: '劳', max: 100 }
      ],
      radius: '65%',
      center: ['50%', '45%'],
      axisName: { color: '#6B7280', fontSize: 14 },
      splitArea: { areaStyle: { color: ['#F7F8FA', '#FFFFFF'] } },
      axisLine: { lineStyle: { color: '#E8EAED' } },
      splitLine: { lineStyle: { color: '#E8EAED' } }
    },
    series: [{
      type: 'radar',
      data: seriesData,
      symbolSize: 6
    }]
  })
}

const initScoreChart = () => {
  if (!scoreChart.value) return
  if (scoreChartInstance) { scoreChartInstance.dispose(); scoreChartInstance = null }
  scoreChartInstance = echarts.init(scoreChart.value)
  
  const ranges = [
    { label: '<60', min: 0, max: 60 },
    { label: '60-70', min: 60, max: 70 },
    { label: '70-80', min: 70, max: 80 },
    { label: '80-90', min: 80, max: 90 },
    { label: '90-100', min: 90, max: 101 }
  ]
  
  const allRecords = evaluationRecords.value?.filter(e => e.score > 0) || []
  const schoolDistribution = ranges.map(r => allRecords.filter(e => e.score >= r.min && e.score < r.max).length)
  
  let data = schoolDistribution
  
  if (schoolDistribution.every(v => v === 0)) {
    data = [8, 35, 150, 320, 180]
  }

  const title = selectedStudent.value 
    ? '全校评价成绩分布' 
    : '全校评价成绩分布'

  scoreChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '5%', right: '5%', bottom: '8%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ranges.map(r => r.label),
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280', fontSize: 12 }
    },
    series: [{
      type: 'bar',
      barWidth: '45%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: (params) => {
          const colors = ['#E85D4E', '#F5A623', '#3B82F6', '#1E5AA8', '#1E5AA8']
          return colors[params.dataIndex]
        }
      },
      data
    }]
  })
}

const initLstmChart = () => {
  if (!lstmChartRef.value) return
  if (lstmChartInstance) { lstmChartInstance.dispose(); lstmChartInstance = null }
  lstmChartInstance = echarts.init(lstmChartRef.value)
  lstmChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        return `${data.name}<br/>预测分数: <strong>${data.value}分</strong>`
      }
    },
    grid: { left: '10%', right: '10%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['当前', '1月后', '2月后', '3月后', '4月后', '5月后', '6月后', '9月后', '12月后'],
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280', formatter: '{value}分' }
    },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#1E5AA8', width: 3 },
      itemStyle: { color: '#1E5AA8', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(30, 90, 168, 0.3)' },
          { offset: 1, color: 'rgba(30, 90, 168, 0.05)' }
        ])
      },
      data: [78, 79, 80, 82, 83, 84, 86, 88, 90]
    }, {
      type: 'scatter',
      symbol: 'diamond',
      symbolSize: 10,
      itemStyle: { color: '#F5A623' },
      data: [[0, 78], [3, 82], [6, 86], [11, 90]]
    }]
  })
}

watch(evaluationRecords, () => {
  nextTick(() => {
    initRadarChart()
    initScoreChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      if (activeTab.value === 'overview') {
        initRadarChart()
        initScoreChart()
        initLstmChart()
      }
    }, 300)
  })
  window.addEventListener('resize', handleChartResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
  if (radarChartInstance) radarChartInstance.dispose()
  if (scoreChartInstance) scoreChartInstance.dispose()
  if (portraitRadarChartInstance) portraitRadarChartInstance.dispose()
  if (lstmChartInstance) lstmChartInstance.dispose()
})

const handleChartResize = () => {
  if (radarChartInstance) radarChartInstance.resize()
  if (scoreChartInstance) scoreChartInstance.resize()
  if (portraitRadarChartInstance) portraitRadarChartInstance.resize()
  if (lstmChartInstance) lstmChartInstance.resize()
}

provide('evalContext', reactive({
  loading,
  apiStudents,
  searchQuery,
  filterTheme,
  filterStatus,
  currentPage,
  pageSize,
  allStudents,
  selectedStudent,
  currentStudentEvaluations,
  currentStudentFiveEduScores,
  currentStudentStats,
  getLevelClass,
  getLevelColor,
  getSportsByType,
  aiAnalysisData,
  schoolData,
  schoolProfile,
  MOCK_FOCUS_RECORDS,
  MOCK_HEATMAP_DATA,
  MOCK_PARENT_EVALUATIONS,
  MOCK_GROWTH_LOGS,
  _teachers,
  _students,
  teacherScoreItemsData,
  teacherScoreRecordsData,
  recommendedResourcesData,
  portraitStudentsData,
  generatePortraitData,
  portraitsDataComputed,
  parentStatsData,
  parentStatsComputed,
  growthCategoriesData,
  growthCategoriesComputed,
  nationalTestResults,
  evaluationRecords,
  refreshEvaluationRecords,
  evalTypeMap,
  evalTypeTagType,
  evaluationColumns,
  filteredEvaluations,
  paginatedEvaluations,
  compareSubject,
  subjectFieldMap,
  subjectLabelMap,
  diagnosisStats,
  warningList,
  classCompareData,
  progressData,
  getMasteryClass,
  getBarColor,
  viewAllWarnings,
  warningDetailVisible,
  currentWarning,
  viewWarningDetail,
  pushTraining,
  showResourcePushDialog,
  currentPushStudent,
  resourcePushForm,
  recommendedResources,
  generateRecommendedResources,
  confirmPushResource,
  getResourceTypeTag,
  getResourceTypeText,
  scheduledPushTime,
  portraitStudents,
  portraitsData,
  currentPortrait,
  initPortraitRadarChart,
  radarChart,
  scoreChart,
  createDialogVisible,
  detailDialogVisible,
  selectedEvaluation,
  activityForm,
  userCreatedActivities,
  activityList,
  getTodayNewEvaluations,
  progressFilterTheme,
  overallStats,
  classProgressList,
  pendingStudents,
  pendingListVisible,
  allPendingStudents,
  viewAllPending,
  activeTab,
  focusFilter,
  focusHeatmap,
  generateFocusRecords,
  generateHeatmapData,
  focusRecords,
  heatmapData,
  focusFilterClassMap,
  filteredFocusRecords,
  focusSummaryStats,
  filteredHeatmapData,
  getHeatmapColor,
  showHeatmapTooltip,
  hideHeatmapTooltip,
  refreshHeatmap,
  teacherScoreDialogVisible,
  newTeacherScoreForm,
  teacherScoreItems,
  teacherScoreRecords,
  teacherStats,
  adminClassesForTeacherScore,
  openTeacherScoreDialog,
  confirmNewTeacherScore,
  saveTeacherScore,
  resetScore,
  refreshTeacherScores,
  parentStats,
  parentEvaluations,
  growthCategories,
  growthLogs,
  parentSurveyVisible,
  previewVisible,
  growthLogVisible,
  growthLogMode,
  growthLogTypeOptions,
  growthLogForm,
  originalGrowthLogIndex,
  previewUrl,
  showReportExport,
  reportData,
  parentSurveyForm,
  showParentSurveyDialog,
  classCodeToClassName,
  submitParentSurvey,
  handlePictureCardPreview,
  showGrowthLogDialog,
  viewGrowthLog,
  editGrowthLog,
  saveGrowthLog,
  refreshFocusData,
  refreshParentData,
  refreshGrowthData,
  showAHPConfig,
  ahpMatrixData,
  lstmChartRef,
  calculateAHP,
  resetAHP,
  getScoreClass,
  refreshData,
  exportReport,
  handleReportExportStart,
  handleReportExportEnd,
  showCreateDialog,
  formatDate,
  confirmCreateActivity,
  viewDetail,
  generateReport,
  initRadarChart,
  initScoreChart,
  initLstmChart,
  handleChartResize
}))
</script>

<style scoped>
.student-evaluation {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.upload-tip {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 8px;
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

.progress-text {
  font-weight: 600;
  color: #1E5AA8;
}

.name-warning {
  color: #E85D4E;
  font-weight: 600;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.stat-item {
  padding: 16px;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.stat-item:hover {
  background: #F7F8FA;
  transform: translateY(-2px);
}

.stat-value {
  font-size: clamp(24px, 2vw, 32px);
  font-weight: 700;
  line-height: 1.2;
  color: #1A1A2E;
}

.stat-value.level-excellent {
  color: #1E5AA8;
}

.stat-value.level-good {
  color: #3B82F6;
}

.stat-value.level-pass {
  color: #F5A623;
}

.stat-value.level-fail {
  color: #E85D4E;
}

.stat-label {
  font-size: clamp(12px, 1vw, 14px);
  color: #6B7280;
  white-space: nowrap;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F0F1F5;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.evaluation-tabs {
  margin-bottom: 24px;
}

.evaluation-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.evaluation-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.evaluation-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  color: #6B7280;
}

.evaluation-tabs :deep(.el-tabs__item.is-active) {
  color: #1E5AA8;
  font-weight: 600;
}

.evaluation-tabs :deep(.el-tabs__active-bar) {
  background-color: #1E5AA8;
}

.evaluation-tabs :deep(.el-tabs__content) {
  padding: 20px 0;
}

.activity-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.activity-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.activity-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.activity-title {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A2E;
}

.activity-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-active { background: #EEF6FF; color: #1E5AA8; }
.status-ended { background: #F3F4F6; color: #6B7280; }

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6B7280;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.stats-row .stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.stats-row .stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
  line-height: 1.2;
}

.stats-row .stat-label {
  font-size: 13px;
  color: #6B7280;
}

.stats-row .stat-divider {
  width: 1px;
  height: 32px;
  background: #E8EAED;
}

.score-value {
  font-size: 16px;
  font-weight: 600;
}

.score-excellent { color: #1E5AA8; }
.score-good { color: #3B82F6; }
.score-pass { color: #F5A623; }
.score-fail { color: #E85D4E; }

.evaluation-detail {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E8EAED;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.five-edu-scores {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edu-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edu-label {
  width: 24px;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
  justify-content: center;
  padding: 20px 0;
}

.big-score {
  font-size: 48px;
  font-weight: 700;
  color: #1E5AA8;
}

.score-label {
  font-size: 18px;
  color: #6B7280;
}

.comment-box {
  background: #F7F8FA;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #1A1A2E;
  line-height: 1.6;
}

.mastery-danger { color: #E85D4E; font-weight: 600; }
.mastery-warning { color: #F5A623; font-weight: 600; }
.mastery-success { color: #1E5AA8; font-weight: 600; }

.warning-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.warning-tag.high { background: #FEE2E2; color: #991B1B; }
.warning-tag.medium { background: #FEF3C7; color: #92400E; }
.warning-tag.low { background: #DBEAFE; color: #1E40AF; }

.level-excellent { color: #1E5AA8; font-weight: 600; }
.level-good { color: #3B82F6; font-weight: 600; }
.level-pass { color: #F5A623; font-weight: 600; }
.level-fail { color: #E85D4E; font-weight: 600; }

.resource-push-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.push-student-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.student-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.student-class {
  font-size: 14px;
  color: #6B7280;
}

.action-info {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.action-name {
  font-size: 14px;
  color: #6B7280;
}

.mastery-rate {
  font-size: 14px;
  font-weight: 600;
}

.recommended-resources h4,
.custom-message h4,
.push-time h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.resource-item {
  padding: 12px;
  border: 2px solid #E8EAED;
  border-radius: 8px;
  transition: all 0.3s;
}

.resource-item.selected {
  border-color: #1E5AA8;
  background: #F0FDF4;
}

.resource-checkbox {
  width: 100%;
}

.resource-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resource-title {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.resource-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
}

.resource-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-item {
  font-size: 12px;
}

.custom-message {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.push-time {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-detail {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F3F4F6;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #9CA3AF;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.detail-value.warning {
  color: #E85D4E;
}

.detail-value.success {
  color: #1E5AA8;
}

.warning-detail {
  padding: 16px 0;
}

.warning-detail .detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F3F4F6;
}

.warning-detail .detail-row:last-child {
  border-bottom: none;
}

.warning-detail .detail-label {
  font-size: 14px;
  color: #6B7280;
  font-weight: 500;
}

.warning-detail .detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.warning-detail .detail-divider {
  height: 1px;
  background: #E8EAED;
  margin: 16px 0;
}

.warning-detail .detail-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.progress-summary-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.progress-summary-content {
  margin-top: 16px;
}

.class-progress-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.class-progress-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.class-progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.class-name {
  font-size: 13px;
  color: #1A1A2E;
  width: 100px;
  flex-shrink: 0;
}

.class-progress-bar {
  flex: 1;
  height: 8px;
  background: #E8EAED;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1E5AA8, #3B82F6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.progress-warning {
  background: linear-gradient(90deg, #E85D4E, #F5A623);
}

.class-rate {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
  width: 45px;
  text-align: right;
}

.class-rate.rate-warning {
  color: #E85D4E;
}

.pending-section {
  background: #FEF3C7;
  border-radius: 8px;
  padding: 16px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #FFFFFF;
  border-radius: 6px;
}

.pending-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pending-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.pending-class {
  font-size: 12px;
  color: #6B7280;
}

.pending-days {
  font-size: 12px;
  font-weight: 600;
  color: #E85D4E;
}

@media screen and (max-width: 768px) {
  .activity-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .class-progress-list {
    grid-template-columns: 1fr;
  }
}
</style>