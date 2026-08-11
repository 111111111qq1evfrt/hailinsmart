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
        <!-- 当前学生KPI统计卡片 -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-num" :style="{ color: currentStudentStats.totalScore >= 80 ? '#1E5AA8' : '#F5A623' }">{{ currentStudentStats.totalScore || '-' }}</span>
            <span class="stat-label">综合评分</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num" style="color: #1E5AA8">{{ currentStudentStats.evaluationCount || '-' }}</span>
            <span class="stat-label">评价次数</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num" :style="{ color: getLevelColor(currentStudentStats.level) }">{{ currentStudentStats.level || '-' }}</span>
            <span class="stat-label">体育等级</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num" :style="{ color: currentStudentStats.improveRate >= 0 ? '#3B82F6' : '#E85D4E' }">
              {{ currentStudentStats.improveRate >= 0 ? '+' : '' }}{{ currentStudentStats.improveRate || '-' }}%
            </span>
            <span class="stat-label">进步率</span>
          </div>
        </div>

        <!-- 五育发展雷达图 -->
        <div class="charts-row">
          <div class="chart-card">
            <div class="card-header">
              <span class="card-title">五育发展雷达图</span>
            </div>
            <div ref="radarChart" class="chart" style="width:100%; height:350px;"></div>
          </div>
          <div class="chart-card">
            <div class="card-header">
              <span class="card-title">评价成绩分布</span>
            </div>
            <div ref="scoreChart" class="chart" style="width:100%; height:350px;"></div>
          </div>
        </div>

        <!-- 智能化评价模块 -->
        <div class="ai-evaluation-section">
          <div class="section-header">
            <span class="section-title">🤖 AI智能评价分析</span>
            <el-tag type="success" size="small">AHP + NLP + LSTM</el-tag>
          </div>
          <div class="ai-content">
            <!-- AHP层次分析法权重 -->
            <div class="ai-card">
              <div class="ai-card-header">
                <span class="ai-card-title"><el-icon :size="16" color="#1E5AA8"><Histogram /></el-icon> AHP层次分析法权重配置</span>
                <el-button text size="small" @click="showAHPConfig = !showAHPConfig">
                  {{ showAHPConfig ? '收起' : '配置' }}
                </el-button>
              </div>
              <div class="ahp-matrix" v-if="showAHPConfig">
                <p class="ahp-desc">请设置各指标的两两比较矩阵（1-9尺度）</p>
                <el-table :data="ahpMatrixData" border size="small">
                  <el-table-column prop="index" label="指标" width="100" />
                  <el-table-column prop="physical" label="体质健康" width="100">
                    <template #default="scope">
                      <el-input-number v-model="scope.row.physical" :min="1" :max="9" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="habit" label="运动习惯" width="100">
                    <template #default="scope">
                      <el-input-number v-model="scope.row.habit" :min="1" :max="9" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="competition" label="体育竞赛" width="100">
                    <template #default="scope">
                      <el-input-number v-model="scope.row.competition" :min="1" :max="9" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="skill" label="技能掌握" width="100">
                    <template #default="scope">
                      <el-input-number v-model="scope.row.skill" :min="1" :max="9" size="small" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="weight" label="权重" width="80">
                    <template #default="scope">
                      <span class="weight-value">{{ scope.row.weight }}%</span>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="ahp-actions">
                  <el-button type="primary" size="small" @click="calculateAHP">重新计算权重</el-button>
                  <el-button size="small" @click="resetAHP">重置</el-button>
                </div>
              </div>
              <div class="weight-display" v-else>
                <div class="weight-item">
                  <span class="weight-label">体质健康</span>
                  <el-progress :percentage="35" :color="'#1E5AA8'" />
                  <span class="weight-val">35%</span>
                </div>
                <div class="weight-item">
                  <span class="weight-label">运动习惯</span>
                  <el-progress :percentage="25" :color="'#3B82F6'" />
                  <span class="weight-val">25%</span>
                </div>
                <div class="weight-item">
                  <span class="weight-label">体育竞赛</span>
                  <el-progress :percentage="20" :color="'#F5A623'" />
                  <span class="weight-val">20%</span>
                </div>
                <div class="weight-item">
                  <span class="weight-label">技能掌握</span>
                  <el-progress :percentage="20" :color="'#3B82F6'" />
                  <span class="weight-val">20%</span>
                </div>
              </div>
            </div>

            <!-- 熵权法修正 -->
            <div class="ai-card">
              <div class="ai-card-header">
                <span class="ai-card-title"><el-icon :size="16" color="#1E5AA8"><ScaleToOriginal /></el-icon> 熵权法修正结果</span>
                <el-tag type="warning" size="small">客观修正</el-tag>
              </div>
              <div class="entropy-result">
                <div class="entropy-info">
                  <div class="entropy-item">
                    <span class="entropy-label">原始权重一致性</span>
                    <span class="entropy-value">{{ aiAnalysisData.entropy.consistency }}</span>
                    <el-progress :percentage="Math.round(aiAnalysisData.entropy.consistency * 100)" :color="'#3B82F6'" :stroke-width="6" />
                  </div>
                  <div class="entropy-item">
                    <span class="entropy-label">熵值离散度</span>
                    <span class="entropy-value">{{ aiAnalysisData.entropy.dispersion }}</span>
                    <el-progress :percentage="Math.round(aiAnalysisData.entropy.dispersion * 100)" :color="'#F5A623'" :stroke-width="6" />
                  </div>
                  <div class="entropy-item">
                    <span class="entropy-label">修正系数</span>
                    <span class="entropy-value good">{{ aiAnalysisData.entropy.correction }}</span>
                    <el-progress :percentage="Math.round(aiAnalysisData.entropy.correction * 100)" :color="'#1E5AA8'" :stroke-width="6" />
                  </div>
                  <div class="entropy-item">
                    <span class="entropy-label">最终权重</span>
                    <span class="entropy-value">已应用 ✓</span>
                    <el-progress :percentage="100" :color="'#1E5AA8'" :stroke-width="6" />
                  </div>
                </div>
              </div>
            </div>

            <!-- NLP情感分析 -->
            <div class="ai-card">
              <div class="ai-card-header">
                <span class="ai-card-title">💬 NLP情感分析评语</span>
                <el-tag type="info" size="small">关键词提取</el-tag>
              </div>
              <div class="nlp-analysis">
                <div class="sentiment-indicator">
                  <div class="sentiment-icon">{{ aiAnalysisData.sentiment.tendency === '积极' ? '😊' : aiAnalysisData.sentiment.tendency === '中性' ? '😐' : '😔' }}</div>
                  <div class="sentiment-info">
                    <span class="sentiment-label">情感倾向</span>
                    <span class="sentiment-value" :class="aiAnalysisData.sentiment.tendency === '积极' ? 'positive' : aiAnalysisData.sentiment.tendency === '中性' ? 'neutral' : 'negative'">{{ aiAnalysisData.sentiment.tendency }}</span>
                  </div>
                  <div class="sentiment-score">
                    <span class="score-num">{{ aiAnalysisData.sentiment.score }}</span>
                    <span class="score-unit">分</span>
                  </div>
                </div>
                <div class="keywords-section">
                  <span class="keywords-label">正面关键词：</span>
                  <div class="keyword-tags">
                    <el-tag size="small" type="success" v-for="kw in aiAnalysisData.keywords.positive" :key="kw">{{ kw }}</el-tag>
                  </div>
                  <span class="keywords-label" style="margin-top: 8px;">待改进：</span>
                  <div class="keyword-tags">
                    <el-tag size="small" type="warning" v-for="kw in aiAnalysisData.keywords.negative" :key="kw">{{ kw }}</el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- LSTM成长预测 -->
            <div class="ai-card lstm-card">
              <div class="ai-card-header">
                <span class="ai-card-title">📈 LSTM成长曲线预测</span>
                <el-tag type="danger" size="small">LSTM模型</el-tag>
              </div>
              <div class="lstm-prediction">
                <div class="prediction-chart">
                  <div ref="lstmChartRef" class="chart" style="width:100%; height:160px;"></div>
                </div>
                <div class="prediction-info">
                  <div class="prediction-item">
                    <span class="pred-label">当前水平</span>
                    <span class="pred-value">{{ currentStudentStats.totalScore || 78 }}分</span>
                  </div>
                  <div class="prediction-item">
                    <span class="pred-label">3月后预测</span>
                    <span class="pred-value good">{{ (currentStudentStats.totalScore || 78) + 4 }}分 ↑</span>
                  </div>
                  <div class="prediction-item">
                    <span class="pred-label">6月后预测</span>
                    <span class="pred-value good">{{ (currentStudentStats.totalScore || 78) + 8 }}分 ↑</span>
                  </div>
                  <div class="prediction-item">
                    <span class="pred-label">年度目标</span>
                    <span class="pred-value">90分</span>
                  </div>
                  <div class="confidence">
                    <span class="confidence-label">模型置信度</span>
                    <el-progress :percentage="92" :color="'#1E5AA8'" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 评价记录表格 -->
        <div class="list-card">
          <ExamTable
            :data="filteredEvaluations"
            :columns="evaluationColumns"
            :title="'评价记录'"
            :searchable="true"
            :searchPlaceholder="'搜索学生姓名'"
            :searchFields="['studentName']"
            :showRefresh="true"
            :showPagination="true"
            :defaultPageSize="12"
            :pageSizes="[8, 12, 16]"
            :actionWidth="180"
            @refresh="refreshData"
          >
            <template #studentName="{ row }">
              <span :class="{ 'name-warning': !row.score || row.score === 0 }">{{ row.studentName }}</span>
            </template>
            <template #type="{ row }">
              <el-tag :type="evalTypeTagType[row.type] || 'info'" size="small">
                {{ evalTypeMap[row.type] || row.type || '-' }}
              </el-tag>
            </template>
            <template #score="{ row }">
              <span class="score-value" :class="getScoreClass(row.score)">{{ row.score || '-' }}</span>
            </template>
            <template #actions="{ row }">
              <el-button text type="primary" size="small" @click="viewDetail(row)">详情</el-button>
              <el-button text type="primary" size="small" @click="generateReport(row)">生成报告</el-button>
            </template>
          </ExamTable>
        </div>
      </el-tab-pane>

      <el-tab-pane label="成绩诊断" name="diagnosis">
        <div class="diagnosis-analysis">
          <!-- 统计卡片 -->
          <div class="stats-row" style="margin-bottom: 20px;">
            <div class="stat-item">
              <span class="stat-num" style="color: #E85D4E">{{ diagnosisStats.warningCount }}</span>
              <span class="stat-label">预警学生</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #3B82F6">{{ diagnosisStats.improveRate }}%</span>
              <span class="stat-label">进步率</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ diagnosisStats.classCount }}</span>
              <span class="stat-label">对比班级</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ diagnosisStats.trainPlan }}</span>
              <span class="stat-label">训练计划</span>
            </div>
          </div>
          
          <!-- 掌握度预警表格 -->
          <div class="list-card">
            <div class="card-header">
              <span class="card-title"><el-icon :size="18" color="#E85D4E"><Warning /></el-icon> 动作掌握度标红预警</span>
              <div class="header-actions">
                <el-button text :icon="Bell" @click="viewAllWarnings">查看全部</el-button>
              </div>
            </div>
            <el-table :data="warningList" stripe class="w-full" :height="250">
              <el-table-column prop="studentName" label="学生姓名" width="120" />
              <el-table-column prop="className" label="班级" width="120" />
              <el-table-column prop="actionName" label="动作名称" width="140" />
              <el-table-column prop="masteryRate" label="掌握度" width="120">
                <template #default="scope">
                  <span :class="getMasteryClass(scope.row.masteryRate)">
                    {{ scope.row.masteryRate }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="预警状态" width="120">
                <template #default="scope">
                  <span class="warning-tag" :class="scope.row.status">
                    {{ scope.row.status === 'high' ? '高危' : scope.row.status === 'medium' ? '中等' : '低危' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="suggestion" label="建议训练" width="140" />
              <el-table-column label="操作" width="180">
                <template #default="scope">
                  <el-button text type="primary" size="small" @click="viewWarningDetail(scope.row)">详情</el-button>
                  <el-button text type="success" size="small" @click="pushTraining(scope.row)">推送训练</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 班级横向对比 -->
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 班级横向对比</span>
              <el-select v-model="compareSubject" placeholder="选择项目" style="width: 140px">
                <el-option label="立定跳远" value="longJump" />
                <el-option label="仰卧起坐" value="sitUp" />
                <el-option label="50米跑" value="run50m" />
                <el-option label="跳绳" value="skipping" />
                <el-option label="引体向上" value="pullUp" />
              </el-select>
            </div>
            <div class="compare-legend">
              <span class="legend-item"><span class="legend-color" style="background: #1E5AA8"></span>优秀(85-100)</span>
              <span class="legend-item"><span class="legend-color" style="background: #3B82F6"></span>良好(70-84)</span>
              <span class="legend-item"><span class="legend-color" style="background: #F5A623"></span>及格(55-69)</span>
              <span class="legend-item"><span class="legend-color" style="background: #E85D4E"></span>不及格(&lt;55)</span>
            </div>
            <div class="compare-chart">
              <div class="compare-bar" v-for="(item, idx) in classCompareData" :key="idx">
                <span class="bar-label">{{ item.className }}</span>
                <div class="bar-container">
                  <div class="bar-fill" :style="{ width: item.score + '%', background: getBarColor(item.score) }"></div>
                </div>
                <span class="bar-value">{{ item.score }}分</span>
              </div>
            </div>
          </div>
          
          <!-- 学期纵向进步率 -->
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title">📈 学期纵向进步率追踪</span>
            </div>
            <div class="progress-tracking">
              <div class="progress-item" v-for="(item, idx) in progressData" :key="idx">
                <div class="progress-header">
                  <span class="progress-name">{{ item.studentName }}</span>
                  <span class="progress-rate" :class="item.rate >= 0 ? 'positive' : 'negative'">
                    {{ item.rate >= 0 ? '+' : '' }}{{ item.rate }}%
                  </span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: Math.abs(item.rate) + '%', background: item.rate >= 0 ? '#1E5AA8' : '#E85D4E' }"></div>
                </div>
                <div class="progress-detail">
                  <span>上学期: {{ item.lastScore }}分</span>
                  <span>本学期: {{ item.currentScore }}分</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="专注力分析" name="focus">
        <div class="focus-analysis">
          <div class="card-header" style="margin-bottom: 16px;">
            <span class="card-title">课堂专注力分析</span>
            <el-select v-model="focusFilter" placeholder="选择班级" filterable style="width: 160px">
              <el-option label="全部班级" value="all" />
              <el-option label="一年级1班" value="1-1" />
              <el-option label="二年级1班" value="2-1" />
              <el-option label="三年级1班" value="3-1" />
              <el-option label="四年级1班" value="4-1" />
              <el-option label="五年级1班" value="5-1" />
              
            </el-select>
          </div>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ focusSummaryStats.avgRate }}%</span>
              <span class="stat-label">平均专注力</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ focusSummaryStats.avgDuration }}分钟</span>
              <span class="stat-label">专注时长</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #E85D4E">{{ focusSummaryStats.totalDistractions }}次</span>
              <span class="stat-label">分散次数</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ focusSummaryStats.level }}</span>
              <span class="stat-label">参与度</span>
            </div>
          </div>
          
          <!-- 专注力热力图 -->
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title"> AI行为分析</span>
              <div class="header-actions">
                <el-button text :icon="Refresh" @click="refreshHeatmap">刷新数据</el-button>
              </div>
            </div>
            <div class="heatmap-container">
              <div class="heatmap-legend">
                <span class="legend-label">专注度:</span>
                <div class="legend-colors">
                  <span class="legend-color" style="background: #1E5AA8"></span>
                  <span class="legend-text">高</span>
                  <span class="legend-color" style="background: #3B82F6"></span>
                  <span class="legend-text">中高</span>
                  <span class="legend-color" style="background: #F5A623"></span>
                  <span class="legend-text">中</span>
                  <span class="legend-color" style="background: #E85D4E"></span>
                  <span class="legend-text">低</span>
                </div>
              </div>
              <div class="heatmap-wrapper">
                <!-- 时间标签 -->
                <div class="time-labels">
                  <div class="time-label-spacer"></div>
                  <span v-for="time in ['0min', '10min', '20min', '30min', '40min', '50min']" :key="time">{{ time }}</span>
                </div>
                
                <!-- 热力图网格 + 学生标签 -->
                <div class="heatmap-body">
                  <!-- 学生标签列 -->
                  <div class="student-labels">
                    <span v-for="(row, idx) in filteredHeatmapData" :key="idx">{{ row[0]?.student || `学生${idx + 1}` }}</span>
                  </div>
                  
                  <!-- 热力图网格 -->
                  <div class="heatmap-grid">
                    <div class="heatmap-row" v-for="(row, rowIdx) in filteredHeatmapData" :key="rowIdx">
                      <div 
                        v-for="(cell, colIdx) in row" 
                        :key="colIdx"
                        class="heatmap-cell"
                        :style="{ background: getHeatmapColor(cell.value) }"
                        @mouseenter="showHeatmapTooltip($event, cell)"
                        @mouseleave="hideHeatmapTooltip"
                      >
                        <span v-if="cell.value >= 70" class="cell-value">{{ cell.value }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title">专注力记录</span>
              <div class="header-actions">
                <el-button text :icon="Refresh" @click="refreshFocusData">刷新</el-button>
              </div>
            </div>
            <el-table :data="filteredFocusRecords" stripe class="w-full" :height="300">
              <el-table-column prop="studentName" label="学生姓名" width="100" />
              <el-table-column prop="class" label="班级" width="100" />
              <el-table-column prop="focusRate" label="专注力" width="180">
                <template #default="scope">
                  <el-progress :percentage="scope.row.focusRate" :color="scope.row.focusRate >= 80 ? '#1E5AA8' : scope.row.focusRate >= 60 ? '#F5A623' : '#E85D4E'" />
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="专注时长" width="100" />
              <el-table-column prop="distractions" label="分散次数" width="100" />
              <el-table-column prop="date" label="记录日期" />
            </el-table>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="教师评价" name="teacher">
        <div class="teacher-evaluation">
          <div class="card-header" style="margin-bottom: 16px;">
            <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Document /></el-icon> 教师课堂表现打分</span>
            <el-button type="primary" :icon="Plus" @click="teacherScoreDialogVisible = true">新建打分</el-button>
          </div>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ teacherStats.avgScore }}</span>
              <span class="stat-label">平均评分</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ teacherStats.totalCourses }}</span>
              <span class="stat-label">已打分课程</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #F5A623">{{ teacherStats.pendingCount }}</span>
              <span class="stat-label">待打分</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ teacherStats.teacherCount }}</span>
              <span class="stat-label">教师数量</span>
            </div>
          </div>
          
          <!-- 拖拽式评分卡 -->
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title">🎯 拖拽式评分卡（1-5星）</span>
              <div class="header-actions">
                <el-button text :icon="Refresh" @click="refreshTeacherScores">刷新</el-button>
              </div>
            </div>
            <div class="drag-score-container">
              <div class="drag-score-card" v-for="(item, idx) in teacherScoreItems" :key="idx">
                <div class="score-card-header">
                  <div class="teacher-info">
                    <el-avatar :size="48" :icon="UserFilled" />
                    <div class="teacher-detail">
                      <span class="teacher-name">{{ item.teacherName }}</span>
                      <span class="teacher-course">{{ item.course }}</span>
                    </div>
                  </div>
                  <span class="score-date">{{ item.date }}</span>
                </div>
                <div class="drag-score-section">
                  <div class="score-criteria">
                    <div class="criteria-item">
                      <span class="criteria-label">教学内容</span>
                      <div class="star-rating">
                        <el-rate 
                          v-model="item.scores.content" 
                          :max="5" 
                          :disabled="false"
                          text-color="#F5A623"
                          :allow-half="true"
                        />
                        <span class="score-value">{{ item.scores.content }}分</span>
                      </div>
                    </div>
                    <div class="criteria-item">
                      <span class="criteria-label">教学方法</span>
                      <div class="star-rating">
                        <el-rate 
                          v-model="item.scores.method" 
                          :max="5" 
                          :disabled="false"
                          text-color="#F5A623"
                          :allow-half="true"
                        />
                        <span class="score-value">{{ item.scores.method }}分</span>
                      </div>
                    </div>
                    <div class="criteria-item">
                      <span class="criteria-label">课堂互动</span>
                      <div class="star-rating">
                        <el-rate 
                          v-model="item.scores.interaction" 
                          :max="5" 
                          :disabled="false"
                          text-color="#F5A623"
                          :allow-half="true"
                        />
                        <span class="score-value">{{ item.scores.interaction }}分</span>
                      </div>
                    </div>
                    <div class="criteria-item">
                      <span class="criteria-label">学生参与</span>
                      <div class="star-rating">
                        <el-rate 
                          v-model="item.scores.participation" 
                          :max="5" 
                          :disabled="false"
                          text-color="#F5A623"
                          :allow-half="true"
                        />
                        <span class="score-value">{{ item.scores.participation }}分</span>
                      </div>
                    </div>
                    <div class="criteria-item">
                      <span class="criteria-label">教学效果</span>
                      <div class="star-rating">
                        <el-rate 
                          v-model="item.scores.effectiveness" 
                          :max="5" 
                          :disabled="false"
                          text-color="#F5A623"
                          :allow-half="true"
                        />
                        <span class="score-value">{{ item.scores.effectiveness }}分</span>
                      </div>
                    </div>
                  </div>
                  <div class="score-summary">
                    <div class="summary-header">
                      <span class="summary-label">综合评分</span>
                      <span class="summary-score">{{ item.totalScore }}</span>
                    </div>
                    <el-rate 
                      v-model="item.totalScore" 
                      :max="5" 
                      :disabled="false"
                      text-color="#F5A623"
                      :allow-half="true"
                      class="summary-rate"
                    />
                    <textarea 
                      v-model="item.comment" 
                      placeholder="请输入评价意见..." 
                      class="comment-input"
                    ></textarea>
                    <div class="score-actions">
                      <el-button type="primary" @click="saveTeacherScore(item)">保存评分</el-button>
                      <el-button @click="resetScore(item)">重置</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 教师评分记录 -->
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title">教师评分记录</span>
            </div>
            <el-table :data="teacherScoreRecords" stripe class="w-full" :height="300">
              <el-table-column prop="teacherName" label="教师姓名" width="120" />
              <el-table-column prop="course" label="课程名称" width="140" />
              <el-table-column prop="className" label="授课班级" width="120" />
              <el-table-column prop="score" label="综合评分" width="120">
                <template #default="scope">
                  <el-rate v-model="scope.row.score" disabled :max="5" text-color="#F5A623" />
                </template>
              </el-table-column>
              <el-table-column prop="date" label="评分日期" width="120" />
              <el-table-column prop="evaluator" label="评分人" width="100" />
              <el-table-column prop="comment" label="评价意见" />
            </el-table>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="数字画像" name="digitalPortrait">
        <div class="digital-portrait">
          <!-- 画像概览卡片 -->
          <div class="portrait-overview">
            <div class="portrait-card main-card">
              <div class="portrait-header">
                <el-avatar :size="80" :icon="UserFilled" class="portrait-avatar" />
                <div class="portrait-info">
                  <h3>{{ currentPortrait.name }}</h3>
                  <p>{{ currentPortrait.className }}</p>
                  <p class="portrait-level">体育等级: <span :class="currentPortrait.levelClass">{{ currentPortrait.level }}</span></p>
                </div>
                <div class="portrait-score">
                  <span class="score-label">综合评分</span>
                  <span class="score-value">{{ currentPortrait.totalScore }}</span>
                </div>
              </div>
            </div>
            
            <div class="portrait-cards">
              <div class="portrait-card">
                <div class="card-icon" style="background: #DCFCE7">💪</div>
                <div class="card-content">
                  <span class="card-value">{{ currentPortrait.physicalScore }}</span>
                  <span class="card-label">体能评分</span>
                </div>
              </div>
              <div class="portrait-card">
                <div class="card-icon" style="background: #DBEAFE">🎯</div>
                <div class="card-content">
                  <span class="card-value">{{ currentPortrait.skillScore }}</span>
                  <span class="card-label">技能评分</span>
                </div>
              </div>
              <div class="portrait-card">
                <div class="card-icon" style="background: #FEF3C7">🔥</div>
                <div class="card-content">
                  <span class="card-value">{{ currentPortrait.interestScore }}</span>
                  <span class="card-label">兴趣评分</span>
                </div>
              </div>
              <div class="portrait-card">
                <div class="card-icon" style="background: #FEE2E2">🏃</div>
                <div class="card-content">
                  <span class="card-value">{{ currentPortrait.activityCount }}</span>
                  <span class="card-label">活动次数</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 能力雷达图 -->
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 能力维度雷达图</span>
            </div>
            <div class="radar-container">
              <div class="radar-chart" id="portraitRadarChart"></div>
            </div>
          </div>
          
          <!-- 成长轨迹 -->
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title">📈 成长轨迹</span>
            </div>
            <div class="growth-timeline">
              <div class="timeline-item" v-for="(item, idx) in currentPortrait.growthHistory" :key="idx">
                <div class="timeline-dot" :style="{ background: item.type === 'improve' ? '#1E5AA8' : '#F5A623' }"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-date">{{ item.date }}</span>
                    <span class="timeline-tag" :class="item.type">{{ item.type === 'improve' ? '进步' : '训练' }}</span>
                  </div>
                  <p class="timeline-desc">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 特长与推荐 -->
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title">🎨 特长分析与推荐</span>
            </div>
            <div class="strengths-section">
              <div class="strengths-list">
                <div class="strength-item" v-for="(item, idx) in currentPortrait.strengths" :key="idx">
                  <span class="strength-tag">{{ item.name }}</span>
                  <span class="strength-level">{{ item.level }}</span>
                </div>
              </div>
              <div class="recommendations">
                <h4>推荐发展方向</h4>
                <ul>
                  <li v-for="(item, idx) in currentPortrait.recommendations" :key="idx">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="家长评价" name="parent">
        <div class="parent-evaluation">
          <div class="card-header" style="margin-bottom: 16px;">
            <span class="card-title">家长月度问卷评价</span>
            <el-button type="primary" :icon="Plus" @click="showParentSurveyDialog">发起问卷</el-button>
          </div>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ parentStatsComputed.sent }}</span>
              <span class="stat-label">已发送问卷</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ parentStatsComputed.completed }}</span>
              <span class="stat-label">已完成</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #F5A623">{{ parentStatsComputed.pending }}</span>
              <span class="stat-label">待填写</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num" style="color: #1E5AA8">{{ parentStatsComputed.photos }}</span>
              <span class="stat-label">照片证据</span>
            </div>
          </div>
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title">家长评价记录</span>
              <div class="header-actions">
                <el-button text :icon="Refresh" @click="refreshParentData">刷新</el-button>
              </div>
            </div>
            <el-table :data="parentEvaluations" stripe class="w-full" :height="300">
              <el-table-column prop="studentName" label="学生姓名" width="100" />
              <el-table-column prop="parentName" label="家长姓名" width="100" />
              <el-table-column prop="month" label="月份" width="100" />
              <el-table-column prop="satisfaction" label="满意度" width="140">
                <template #default="scope">
                  <el-rate v-model="scope.row.satisfaction" disabled text-color="#F5A623" />
                </template>
              </el-table-column>
              <el-table-column prop="photos" label="照片" width="80">
                <template #default="scope">
                  <span v-if="scope.row.photos > 0">📷 {{ scope.row.photos }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="comment" label="家长评语" />
              <el-table-column prop="date" label="评价日期" width="120" />
            </el-table>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="成长日志" name="growth">
        <div class="growth-log">
          <div class="card-header" style="margin-bottom: 16px;">
            <span class="card-title">学生自我反思与成长日志</span>
            <el-button type="primary" :icon="Plus" @click="showGrowthLogDialog">撰写日志</el-button>
          </div>
          <div class="stats-row">
            <div class="stat-item" v-for="(cat, idx) in growthCategoriesComputed" :key="cat.id">
              <span class="stat-num" style="color: #1E5AA8">{{ cat.count }}</span>
              <span class="stat-label">{{ cat.name }}</span>
            </div>
          </div>
          <div class="list-card" style="margin-top: 16px;">
            <div class="card-header">
              <span class="card-title">日志记录</span>
              <div class="header-actions">
                <el-button text :icon="Refresh" @click="refreshGrowthData">刷新</el-button>
              </div>
            </div>
            <el-table :data="growthLogs" stripe class="w-full" :height="300">
              <el-table-column prop="studentName" label="学生姓名" width="100" />
              <el-table-column prop="type" label="日志类型" width="120">
                <template #default="scope">
                  <el-tag size="small">{{ scope.row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="title" label="标题" />
              <el-table-column prop="sports" label="体育活动" width="120" />
              <el-table-column prop="duration" label="时长" width="80" />
              <el-table-column prop="date" label="撰写日期" width="120" />
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button text type="primary" size="small" @click="viewGrowthLog(scope.row)">查看</el-button>
                  <el-button text type="primary" size="small" @click="editGrowthLog(scope.row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
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
import { ref, computed, watch, onMounted, onActivated, nextTick, onBeforeUnmount, reactive } from 'vue'
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

// 获取学校数据（必须在使用 schoolId 之前定义）
const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// API 加载的学生数据（响应式，优先使用）
const apiStudents = ref([])
const loading = ref(false)

// 从大沩API加载学生数据（与学生管理页面相同的逻辑）
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
     

      // 学生数据更新后，强制刷新评价记录（跳过旧缓存）
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

// 搜索和过滤变量
const searchQuery = ref('')
const filterTheme = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(12) // 默认每页12条

// 学生选择相关数据
const allStudents = computed(() => {
  // 优先级：API数据 > sessionStorage > mock数据
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

// 当前选中的学生ID（持久化，三校隔离）
const selectedStudent = usePersistedRef(`smart_pe_selected_student_${schoolId.value}`, null)

const route = useRoute()

const props = defineProps({
  query: {
    type: Object,
    default: () => ({})
  }
})

// 默认选中第一个学生
onMounted(() => {
  // 从大沩API加载学生数据
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

// keep-alive 缓存激活时重新加载API数据
onActivated(() => {
  loading.value = true
  loadDaiweiData()
})

// 监听URL参数变化，动态切换学生
watch(() => route.query.studentName, (newName) => {
  if (newName && allStudents.value.length > 0) {
    const matchedStudent = allStudents.value.find(s => s.name === newName)
    if (matchedStudent) {
      selectedStudent.value = matchedStudent.id
    }
  }
})

// 监听props变化，动态切换学生
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

// 当前选中学生的评价数据
const currentStudentEvaluations = computed(() => {
  if (!selectedStudent.value) return []
  const matched = evaluationRecords.value.filter(e => e.studentId === selectedStudent.value)
 
  return matched
})

// 当前学生的五育分数
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

// 当前学生统计数据
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

// 获取等级样式类
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

// 获取等级颜色
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

// 根据日志类型获取体育活动
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

// AI分析动态数据 - 基于当前学生评价记录
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

// 获取学校数据
const schoolData = computed(() => {
  return getSchoolMockData(schoolId.value)
})

// 学校档案（差异化数据源）
const schoolProfile = computed(() => getSchoolProfile(schoolId.value))

// 替代原 mockData 中按学校区分的常量
const MOCK_FOCUS_RECORDS = computed(() => schoolProfile.value.studentEval.focusRecords)
const MOCK_HEATMAP_DATA = computed(() => schoolProfile.value.studentEval.heatmapData)
const MOCK_PARENT_EVALUATIONS = computed(() => schoolProfile.value.studentEval.parentEvaluations)
const MOCK_GROWTH_LOGS = computed(() => schoolProfile.value.studentEval.growthLogs)

// ---- 以下 computed 替代原 mockData.js 共享常量，实现三校数据差异化 ----
const _teachers = computed(() => mockDB[schoolId.value]?.teachers || [])
// 优先使用真实学生数据，回退到 mock 数据
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

// 教师评分项 — 使用各校教师名
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

// 教师评分记录 — 使用各校教师名
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

// 推荐训练资源 — 三校不同资源类型
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

// 数字画像学生列表 — 使用各校学生名
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

// 家长评价统计 — 按学校规模缩放（保留旧逻辑作为初始数据）
const parentStatsData = computed(() => {
  const ratio = (_students.value.length || 110) / 110
  return {
    sent: Math.round(456 * ratio),
    completed: Math.round(389 * ratio),
    pending: Math.round(67 * ratio),
    photos: Math.round(234 * ratio)
  }
})

// 家长评价统计 — 从表格数据联动计算
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

// 成长日志分类 — 按学校差异化数量（保留旧逻辑作为初始数据）
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

// 成长日志分类统计 — 从表格数据联动计算
const growthCategoriesComputed = computed(() => {
  const logs = growthLogs.value || []
  const categoryDefs = [
    { id: 1, name: '体育活动记录', icon: '🏃', types: ['体能测试', '课堂表现', '体质健康', '体育活动'] },
    { id: 2, name: '技能学习日志', icon: '📚', types: ['技能学习', '技能提升', '学习心得'] },
    { id: 3, name: '比赛心得', icon: '🏆', types: ['比赛心得', '比赛记录'] },
    { id: 4, name: '自我反思', icon: '💭', types: ['自我反思', '自我评价'] }
  ]
  // 按分类映射统计
  return categoryDefs.map(cat => {
    const count = logs.filter(log => cat.types.includes(log.type)).length
    return { id: cat.id, name: cat.name, icon: cat.icon, count }
  })
})

const nationalTestResults = computed(() => schoolData.value?.nationalTestResults || [])

const evaluationRecords = ref([])

// 刷新评价记录：优先读缓存，缓存不匹配则重新生成
// force=true 时跳过缓存，强制从当前学生数据重新生成（API加载后使用）
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

// 监听 schoolId 变化，切换学校时刷新评价记录
watch(schoolId, () => {
  refreshEvaluationRecords()
}, { immediate: true })

watch(evaluationRecords, (newVal) => {
  const persistedKey = `smart_pe_evaluation_records_${schoolId.value}`
  sessionStorage.setItem(persistedKey, JSON.stringify(newVal))
}, { deep: true })

// 评价类型标签映射
const evalTypeMap = { teacher: '教师评价', parent: '家长评价', self: '自我评价', ai: 'AI评价' }
const evalTypeTagType = { teacher: '', parent: 'success', self: 'warning', ai: 'info' }

// 评价记录表格列配置
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

// 过滤后的数据
const filteredEvaluations = computed(() => {
  let result = [...(evaluationRecords.value || [])]
  
  // 如果选中了学生，只显示该学生的评价
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

// 分页后的数据
const paginatedEvaluations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return (filteredEvaluations.value || []).slice(start, end)
})

// 成绩诊断相关数据 — 从 nationalTestResults 动态计算
const compareSubject = ref('longJump')

// 项目字段映射
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
  // 从 evaluationRecords 中按学生统计进步情况（模拟：用五育中 physical 分数作为参考）
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
  // 根据学生的动作掌握度推荐训练资源
  generateRecommendedResources(row)
}

// 个性化资源推送相关
const showResourcePushDialog = ref(false)
const currentPushStudent = ref(null)
const resourcePushForm = ref({
  selectedResources: [],
  customMessage: '',
  pushTime: 'immediate'
})

const recommendedResources = usePersistedRef(`smart_pe_recommended_resources_${schoolId.value}`, [...recommendedResourcesData.value])

const generateRecommendedResources = (student) => {
  // 根据学生的动作掌握度和建议训练，智能推荐训练资源
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

// 资源类型标签颜色
const getResourceTypeTag = (type) => {
  const typeMap = {
    video: 'primary',
    plan: 'success',
    guide: 'warning'
  }
  return typeMap[type] || 'info'
}

// 资源类型文本
const getResourceTypeText = (type) => {
  const typeMap = {
    video: '视频',
    plan: '计划',
    guide: '指南'
  }
  return typeMap[type] || type
}

// 定时推送时间
const scheduledPushTime = ref(null)

// 数字画像相关数据
const portraitStudents = usePersistedRef(`smart_pe_portrait_students_${schoolId.value}`, [...portraitStudentsData.value])

// 数字画像详细数据 — 从 MOCK_PORTRAITS_DATA 导入
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

// 监听学生选择变化
watch(selectedStudent, () => {
  nextTick(() => {
    setTimeout(() => { 
      initPortraitRadarChart() 
      initRadarChart()
      initScoreChart()
    }, 200)
  })
})

// 图表实例引用
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

// 活动列表：从 evaluationRecords 按 theme 分组统计 + 用户新建的额外活动
const userCreatedActivities = usePersistedRef(`smart_pe_user_activities_${schoolId.value}`, [])

// 日期格式化辅助函数
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

// 今日新增评价数 — 从 evaluationRecords 中统计今日记录
const getTodayNewEvaluations = (title) => {
  const today = fmtDate(new Date('2026-07-16T08:00:00'))
  return evaluationRecords.value.filter(r => r.theme === title && r.date === today).length
}

// 评分进度统计相关
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
  // 按班级分组
  const classMap = {}
  records.forEach(r => {
    const cn = r.className || '未知班级'
    if (!classMap[cn]) classMap[cn] = { total: 0, evaluated: 0 }
    classMap[cn].total++
    if (r.score && r.score > 0) classMap[cn].evaluated++
  })
  // 如果数据为空，返回默认班级列表
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
  // 统计每个学生的评价次数
  const studentMap = {}
  records.forEach(r => {
    const key = r.studentId || r.studentName
    if (!studentMap[key]) {
      studentMap[key] = { studentName: r.studentName, className: r.className || '', count: 0, lastDate: '' }
    }
    studentMap[key].count++
    if (r.date > studentMap[key].lastDate) studentMap[key].lastDate = r.date
  })
  // 找出评价次数最少或没有评价的学生
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

// 监听标签页切换，初始化对应标签页的图表
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

// 生成专注力记录数据 - 与学生列表联动
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

// 生成热力图数据 - 与专注力记录联动
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

// 专注力热力图数据 — 持久化（学校隔离）
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

// 专注力过滤映射：filter值 -> 班级名称
const focusFilterClassMap = {
  '1-1': '一年级1班',
  '2-1': '二年级1班',
  '3-1': '三年级1班',
  '4-1': '四年级1班',
  '5-1': '五年级1班'
}

// 过滤后的专注力记录
const filteredFocusRecords = computed(() => {
  if (focusFilter.value === 'all' || !focusFilter.value) {
    return focusRecords.value
  }
  const className = focusFilterClassMap[focusFilter.value]
  if (!className) return focusRecords.value
  return focusRecords.value.filter(r => r.class === className)
})

// 专注力汇总统计 — 从实际数据计算
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

// 过滤后的热力图数据
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

// 获取热力图颜色
const getHeatmapColor = (value) => {
  if (value >= 85) return '#1E5AA8'
  if (value >= 70) return '#3B82F6'
  if (value >= 55) return '#F5A623'
  return '#E85D4E'
}

// 热力图tooltip
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

// 教师评分相关数据
const teacherScoreDialogVisible = ref(false)
const newTeacherScoreForm = ref({ teacherName: '', course: '', classType: '行政班', className: '', date: '' })
const teacherScoreItems = usePersistedRef(`smart_pe_teacher_score_items_${schoolId.value}`, [...teacherScoreItemsData.value])

const teacherScoreRecords = usePersistedRef(`smart_pe_teacher_score_records_${schoolId.value}`, [...teacherScoreRecordsData.value])

// 教师评价统计 — 从表格数据联动计算
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

// 行政班列表（用于教师评分的班级选择）
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
  // 计算平均分作为总分
  const scores = item.scores
  item.totalScore = parseFloat(((scores.content + scores.method + scores.interaction + scores.participation + scores.effectiveness) / 5).toFixed(1))
  // 写入 teacherScoreRecords
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
    // 编辑模式：使用原始索引定位记录，避免因修改标题导致匹配失败
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
  // 导出CSV格式的评价数据
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
  
  // 获取当前学生的五育分数
  const scores = currentStudentFiveEduScores.value
  const personalData = [scores.moral, scores.intellectual, scores.physical, scores.aesthetic, scores.labor]
  
  // 获取当前学生姓名
  const currentStudentName = allStudents.value.find(s => s.id === selectedStudent.value)?.name || '全校平均'
  
  // 计算学校平均
  const allRecords = evaluationRecords.value?.filter(e => e.score > 0) || []
  const avg = (field) => {
    const vals = allRecords.map(r => r[field]).filter(v => v != null && v !== undefined)
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 75
  }
  const schoolData = [avg('moral'), avg('intellectual'), avg('physical'), avg('aesthetic'), avg('labor')]

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
          value: schoolData,
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
  
  // 始终使用全校数据作为主分布
  const allRecords = evaluationRecords.value?.filter(e => e.score > 0) || []
  const schoolDistribution = ranges.map(r => allRecords.filter(e => e.score >= r.min && e.score < r.max).length)
  
  let data = schoolDistribution
  
  // 如果无数据，显示默认分布
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

// LSTM成长曲线预测图表
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

// 监听评价记录变化，重绘图表
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

/* KPI统计卡片 - 参考Dashboard风格 */
.stats-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
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

.stat-value.stat-highlight {
  color: #1E5AA8;
}

.stat-value.stat-positive {
  color: #3B82F6;
}

.stat-value.stat-negative {
  color: #E85D4E;
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

/* AI智能评价模块 */
.ai-evaluation-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
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

.ai-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.ai-card {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 16px;
}

.ai-card.lstm-card {
  grid-column: span 2;
}

.ai-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ai-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.ahp-matrix {
  margin-top: 12px;
}

.ahp-desc {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 8px;
}

.ahp-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.weight-value {
  font-weight: 600;
  color: #1E5AA8;
}

.weight-display {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.weight-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weight-label {
  font-size: 12px;
  color: #6B7280;
  width: 60px;
}

.weight-val {
  font-size: 12px;
  font-weight: 600;
  color: #1A1A2E;
  width: 35px;
}

.entropy-result {
  padding: 8px 0;
}

.entropy-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.entropy-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entropy-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.entropy-label {
  color: #6B7280;
}

.entropy-value {
  font-weight: 600;
  color: #1A1A2E;
}

.entropy-value.good {
  color: #1E5AA8;
}

.nlp-analysis {
  display: flex;
  gap: 16px;
}

.sentiment-indicator {
  width: 120px;
  background: #EEF6FF;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.sentiment-icon {
  font-size: 28px;
}

.sentiment-info {
  text-align: center;
}

.sentiment-label {
  font-size: 11px;
  color: #6B7280;
  display: block;
}

.sentiment-value {
  font-size: 14px;
  font-weight: 600;
}

.sentiment-value.positive {
  color: #1E5AA8;
}

.sentiment-value.negative {
  color: #E85D4E;
}

.sentiment-value.neutral {
  color: #F5A623;
}

.sentiment-score {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score-num {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.score-unit {
  font-size: 12px;
  color: #6B7280;
}

.keywords-section {
  flex: 1;
}

.keywords-label {
  font-size: 12px;
  color: #6B7280;
  display: block;
  margin-bottom: 4px;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.lstm-prediction {
  display: flex;
  gap: 20px;
}

.prediction-chart {
  width: 400px;
  height: 160px;
  background: #F7F8FA;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prediction-info {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.prediction-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #FFFFFF;
  border-radius: 6px;
}

.pred-label {
  font-size: 12px;
  color: #6B7280;
}

.pred-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.pred-value.good {
  color: #1E5AA8;
}

.confidence {
  grid-column: span 2;
  padding: 8px 12px;
  background: #FFFFFF;
  border-radius: 6px;
}

.confidence-label {
  font-size: 12px;
  color: #6B7280;
  display: block;
  margin-bottom: 4px;
}

/* 多维度评价标签页 */
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

/* 活动卡片 */
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

/* 图表区 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  width: 100%;
}

.chart-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.chart-card .card-header {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.chart-card .chart {
  flex: 1;
  min-height: 320px;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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

/* KPI统计行 */
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

.chart {
  height: 350px;
  width: 100%;
  min-height: 300px;
}

/* 分数样式 */
.score-value {
  font-size: 16px;
  font-weight: 600;
}

.score-excellent { color: #1E5AA8; }
.score-good { color: #3B82F6; }
.score-pass { color: #F5A623; }
.score-fail { color: #E85D4E; }

/* 评价详情弹窗样式 */
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

/* 专注力热力图样式 */
.heatmap-container {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.legend-label {
  font-size: 12px;
  color: #6B7280;
}

.legend-colors {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 24px;
  height: 16px;
  border-radius: 4px;
}

.legend-text {
  font-size: 11px;
  color: #6B7280;
  margin-right: 8px;
}

/* 专注力热力图 - Flex布局 */
.heatmap-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 时间标签行 */
.time-labels {
  display: flex;
  gap: 4px;
  padding-left: 60px;
}

.time-label-spacer {
  width: 60px;
  flex-shrink: 0;
}

.time-labels span {
  width: 60px;
  text-align: center;
  font-size: 11px;
  color: #9CA3AF;
}

/* 热力图主体（学生标签 + 网格） */
.heatmap-body {
  display: flex;
  gap: 8px;
}

/* 学生标签列 */
.student-labels {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 60px;
  flex-shrink: 0;
}

.student-labels span {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #9CA3AF;
}

/* 热力图网格 */
.heatmap-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.heatmap-row {
  display: flex;
  gap: 4px;
}

.heatmap-cell {
  width: 60px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.85;
}

.heatmap-cell:hover {
  opacity: 1;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.cell-value {
  font-size: 11px;
  font-weight: 600;
  color: #FFFFFF;
}

/* 热力图tooltip */
.heatmap-tooltip {
  position: fixed;
  background: #1A1A2E;
  color: #FFFFFF;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  pointer-events: none;
}

.heatmap-tooltip div {
  margin-bottom: 4px;
}

.heatmap-tooltip div:last-child {
  margin-bottom: 0;
}

/* 成绩诊断样式 */
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

.compare-chart {
  padding: 16px;
}

.compare-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.bar-label {
  width: 100px;
  font-size: 13px;
  color: #6B7280;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-value {
  width: 60px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.progress-tracking {
  padding: 16px;
}

.progress-item {
  margin-bottom: 20px;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.progress-rate {
  font-size: 14px;
  font-weight: 600;
}

.progress-rate.positive { color: #1E5AA8; }
.progress-rate.negative { color: #E85D4E; }

.progress-bar {
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-detail {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6B7280;
}

/* 数字画像样式 */
.digital-portrait {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.student-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.selector-label {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.portrait-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.portrait-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.portrait-card.main-card {
  grid-column: span 1;
}

.portrait-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.portrait-avatar {
  background: linear-gradient(135deg, #1E5AA8, #3B82F6);
}

.portrait-info {
  flex: 1;
}

.portrait-info h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 4px 0;
}

.portrait-info p {
  font-size: 14px;
  color: #6B7280;
  margin: 4px 0;
}

.portrait-level {
  font-size: 13px !important;
}

.level-excellent { color: #1E5AA8; font-weight: 600; }
.level-good { color: #3B82F6; font-weight: 600; }
.level-pass { color: #F5A623; font-weight: 600; }
.level-fail { color: #E85D4E; font-weight: 600; }

.portrait-score {
  text-align: center;
}

.score-label {
  display: block;
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 4px;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  color: #1E5AA8;
}

.portrait-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.portrait-cards .portrait-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-content .card-value {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.card-content .card-label {
  font-size: 12px;
  color: #6B7280;
}

.radar-container {
  height: 300px;
}

.radar-chart {
  width: 100%;
  height: 100%;
}

.growth-timeline {
  padding: 16px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #F3F4F6;
  margin-bottom: 16px;
}

.timeline-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.timeline-date {
  font-size: 13px;
  color: #9CA3AF;
}

.timeline-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.timeline-tag.improve { background: #EEF6FF; color: #1E5AA8; }
.timeline-tag.training { background: #FEF3C7; color: #92400E; }

.timeline-desc {
  font-size: 14px;
  color: #1A1A2E;
  margin: 0;
}

.strengths-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 16px;
}

.strengths-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.strength-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-tag {
  padding: 6px 12px;
  background: #F7F8FA;
  border-radius: 6px;
  font-size: 13px;
  color: #1A1A2E;
}

.strength-level {
  font-size: 12px;
  color: #6B7280;
}

.recommendations h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 12px 0;
}

.recommendations ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendations li {
  font-size: 13px;
  color: #6B7280;
  padding: 6px 0;
  padding-left: 16px;
  position: relative;
}

.recommendations li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #1E5AA8;
}

/* 教师评分拖拽式评分卡样式 */
.drag-score-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drag-score-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.2s;
}

.drag-score-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.score-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
  margin-bottom: 16px;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.teacher-detail {
  display: flex;
  flex-direction: column;
}

.teacher-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.teacher-course {
  font-size: 13px;
  color: #6B7280;
}

.score-date {
  font-size: 13px;
  color: #9CA3AF;
}

.drag-score-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.score-criteria {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.criteria-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.criteria-label {
  font-size: 14px;
  color: #6B7280;
}

.star-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-summary {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 14px;
  color: #6B7280;
}

.summary-score {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.summary-rate {
  display: flex;
  justify-content: center;
}

.comment-input {
  width: 100%;
  height: 80px;
  padding: 12px;
  border: 1px solid #E8EAED;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
}

.score-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 个性化资源推送弹窗样式 */
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

.mastery-rate.mastery-danger {
  color: #E85D4E;
}

.mastery-rate.mastery-warning {
  color: #F5A623;
}

.mastery-rate.mastery-success {
  color: #1E5AA8;
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

/* 评分进度详情 */
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

/* 预警详情弹窗 */
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

/* 评分进度统计面板 */
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

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E8EAED;
  margin-bottom: 20px;
}

.summary-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A2E;
}

.stat-value.completed {
  color: #1E5AA8;
}

.stat-value.pending {
  color: #F5A623;
}

.stat-value.rate {
  color: #1E5AA8;
}

.stat-label {
  font-size: 12px;
  color: #6B7280;
}

/* 班级进度列表 */
.class-progress-section {
  margin-bottom: 20px;
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

/* 待评分学生列表 */
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

/* 班级横向对比图例 */
.compare-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 8px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid #F1F5F9;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6B7280;
}

.legend-color {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

/* 评价管理页面响应式布局 */
@media screen and (max-width: 992px) {
  .heatmap-container {
    overflow-x: auto;
  }
  
  .heatmap-wrapper {
    min-width: 600px;
  }
  
  .compare-legend {
    gap: 12px;
  }
  
  .legend-item {
    font-size: 11px;
  }
}

@media screen and (max-width: 768px) {
  .activity-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .class-progress-list {
    grid-template-columns: 1fr;
  }
  
  .heatmap-container {
    overflow-x: auto;
    padding: 12px;
  }
  
  .heatmap-wrapper {
    min-width: 500px;
  }
  
  .heatmap-cell {
    width: 50px;
    height: 32px;
  }
  
  .cell-value {
    font-size: 10px;
  }
  
  .heatmap-legend {
    flex-wrap: wrap;
  }
  
  .legend-label {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .compare-legend {
    gap: 8px;
  }
  
  .legend-item {
    font-size: 11px;
  }
  
  .bar-label {
    width: 80px;
    font-size: 12px;
  }
  
  .bar-value {
    width: 50px;
    font-size: 12px;
  }
  
  .compare-bar {
    gap: 8px;
  }
}

@media screen and (max-width: 480px) {
  .heatmap-wrapper {
    min-width: 400px;
  }
  
  .heatmap-cell {
    width: 40px;
    height: 28px;
  }
  
  .cell-value {
    font-size: 9px;
  }
  
  .student-labels {
    min-width: 60px;
  }
  
  .student-labels span {
    font-size: 11px;
  }
  
  .time-labels span {
    font-size: 11px;
  }
  
  .compare-legend {
    flex-direction: column;
    gap: 6px;
  }
  
  .bar-label {
    width: 60px;
    font-size: 11px;
  }
}
</style>
