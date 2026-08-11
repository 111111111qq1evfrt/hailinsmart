<template>
  <div class="test-terminal">
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <div class="left-section">
        <el-select 
          v-model="currentSport" 
          placeholder="选择运动项目"
          class="sport-selector"
          @change="handleSportChange"
        >
          <el-option 
            v-for="sport in sportList.filter(s => isSportEnabled(s.id))" 
            :key="sport.id" 
            :label="sport.name + '测试'" 
            :value="sport.id"
          />
        </el-select>
        
        <!-- 距离选择器（当项目提供 distanceOptions 时显示） -->
        <el-select 
          v-if="currentConfig.distanceOptions"
          v-model="selectedDistance"
          placeholder="选择距离"
          class="distance-selector"
          @change="handleDistanceChange"
        >
          <el-option 
            v-for="distance in currentConfig.distanceOptions" 
            :key="distance" 
            :label="distance + '米'" 
            :value="distance"
          />
        </el-select>
        
        <span class="system-status" :class="terminalEnabled ? testStatus : 'offline'">{{ getStatusText(testStatus) }}</span>
      </div>
      <div class="center-section">
        <span class="current-time">{{ currentTime }}</span>
      </div>
      <div class="right-section">
        <el-button size="small" @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
        </el-button>
        <el-button size="small" @click="showSettings = true">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧视频区域 -->
      <div class="video-section" ref="videoSectionRef">
        <!-- 视频画面 -->
        <div class="video-container" :class="{ 'violation-blink': hasViolation }">
          <div class="video-placeholder">
            <div class="camera-preview">
              <div class="skeleton-overlay">
                <div class="skeleton-line" style="top: 20%; left: 10%; width: 80%;"></div>
                <div class="skeleton-line" style="top: 40%; left: 15%; width: 70%;"></div>
                <div class="skeleton-line" style="top: 60%; left: 20%; width: 60%;"></div>
              </div>
              <!-- 骨骼点指示 -->
              <div class="pose-indicator" v-if="testStatus === 'testing'">
                <div class="joint" v-for="(joint, index) in skeletonJoints" :key="index"
                  :style="{ top: joint.top, left: joint.left }"></div>
              </div>
            </div>
            <div class="scan-line" v-if="testStatus === 'scanning'"></div>
          </div>
          <div class="video-info">
            <span class="camera-status">{{ cameraStatus }}</span>
            <span class="video-resolution">1080P</span>
          </div>
          
          <!-- 违规提示 -->
          <div class="violation-alert" v-if="hasViolation">
            <span class="alert-icon">⚠</span>
            <span>{{ violationMessage }}</span>
          </div>

          <!-- 发令倒计时覆盖层 -->
          <div class="command-overlay" v-if="commandPhase !== 'none'">
            <div class="command-content" :class="commandPhase">
              <div class="command-text">{{ commandText }}</div>
              <div class="command-countdown" v-if="commandPhase === 'countdown'">{{ commandCountdown }}</div>
              <div class="command-ring" v-if="commandPhase === 'countdown'" :class="{ 'pulse': commandCountdown > 0 }"></div>
            </div>
          </div>
        </div>

        <!-- 功能按钮 -->
        <div class="video-actions">
          <el-button type="primary" @click="startTest" 
            v-if="testStatus === 'idle' || testStatus === 'completed'">
            <VideoPlay />
            {{ testStatus === 'completed' ? '开始下一轮' : '开始测试' }}
          </el-button>
          <el-button type="danger" @click="stopTest" 
            v-if="testStatus === 'testing' || testStatus === 'scanning'">
            <SwitchButton />
            终止测试
          </el-button>
          <el-button @click="openVideoPlayback" 
            :disabled="testStatus === 'testing' || testStatus === 'scanning'">
            <VideoPlay />
            视频回放
          </el-button>
          <el-button @click="openKeyframeAnalysis" 
            :disabled="testStatus === 'testing' || testStatus === 'scanning'">
            <DataLine />
            关键帧分析
          </el-button>
          <el-button @click="showViolationPanel = true" 
            :disabled="testStatus === 'testing' || testStatus === 'scanning'"
            type="warning">
            <Warning />
            违规记录
          </el-button>
          <el-button @click="showProjectManager = true"
            :disabled="testStatus === 'testing' || testStatus === 'scanning'">
            <Monitor />
            项目管理
          </el-button>
          <el-button @click="showScoreCorrection = true"
            :disabled="testStatus === 'testing' || testStatus === 'scanning'">
            <Edit />
            成绩补录
          </el-button>
          <el-button @click="exportTestResults"
            :disabled="testStatus === 'testing' || testStatus === 'scanning'"
            type="success">
            <Download />
            导出成绩
          </el-button>
        </div>

        <!-- 项目特有标记 -->
        <div v-if="currentConfig.showTakeoffLine" class="takeoff-line">
          <span class="line-label">{{ getLineLabel() }}</span>
          <div class="line-indicator"></div>
        </div>
      </div>

      <!-- 右侧成绩面板 -->
      <div class="score-section">
        <div class="panel-content">
          <!-- 多人同测成绩板（跳绳等） -->
          <div v-if="isMultiTest" class="multi-scoreboard">
            <div class="multi-header">
              <el-icon><User /></el-icon>
              <span>多人同测成绩（{{ currentParticipants }}/{{ currentConfig.maxParticipants }}）</span>
              <span v-if="countdownSeconds > 0" class="countdown-badge">{{ countdownSeconds }}s</span>
            </div>
            <div class="multi-grid">
              <div
                v-for="(p, index) in multiParticipants"
                :key="index"
                class="multi-slot"
                :class="{ active: p.status === 'testing', done: p.status === 'done', empty: p.status === 'empty' }"
                @click="openMultiStudentSelector(index)"
              >
                <span class="slot-num">{{ index + 1 }}</span>
                <span class="slot-name">{{ p.name }}</span>
                <span class="slot-score" :style="{ color: currentConfig.color }">{{ p.score }}</span>
                <div v-if="p.status !== 'empty'" class="slot-edit">
                  <el-icon><Edit /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- 学生信息（单人测试时显示） -->
          <div v-if="!isMultiTest" class="student-info-card" @click="openStudentSelector">
            <div class="student-avatar">
              <User />
            </div>
            <div class="student-detail">
              <h3>姓名：{{ currentStudent.name }}</h3>
              <p>班级：{{ currentStudent.class }}</p>
              <p>学号：{{ currentStudent.id }}</p>
            </div>
            <div class="student-status" :class="testStatus">
              {{ getStatusText(testStatus) }}
            </div>
            <div class="edit-icon">
              <el-icon><Edit /></el-icon>
            </div>
          </div>

          <!-- 测试人数信息 -->
          <div class="participants-card">
            <div class="participants-header">
              <el-icon><User /></el-icon>
              <span>测试人数</span>
            </div>
            <div class="participants-info">
              <div class="participants-current">
                <span class="current-num">{{ currentParticipants }}</span>
                <span class="current-label">当前测试</span>
              </div>
              <div class="participants-divider">/</div>
              <div class="participants-max">
                <span class="max-num">{{ currentConfig.maxParticipants || 1 }}</span>
                <span class="max-label">最大人数</span>
              </div>
            </div>
            <div class="participants-bar">
              <div 
                class="participants-fill" 
                :style="{ 
                  width: (currentParticipants / (currentConfig.maxParticipants || 1) * 100) + '%',
                  background: getParticipantsColor()
                }"
              ></div>
            </div>
          </div>

          <!-- 批量测试进度 -->
          <div v-if="testMode === 'batch' && classStudents.length > 0" class="batch-progress-card">
            <div class="batch-progress-header">
              <el-icon><DataLine /></el-icon>
              <span>测试进度</span>
            </div>
            <div class="batch-progress-info">
              <span class="progress-text">
                <template v-if="isMultiTest">
                  第 {{ Math.floor(currentStudentIndex / (currentConfig.maxParticipants || 1)) + 1 }} 批 / 共 {{ Math.ceil(classStudents.length / (currentConfig.maxParticipants || 1)) }} 批
                </template>
                <template v-else>
                  {{ currentStudentIndex + 1 }} / {{ classStudents.length }}
                </template>
              </span>
              <span class="progress-percent">{{ Math.round(Math.min(currentStudentIndex + (isMultiTest ? (currentConfig.maxParticipants || 1) : 1), classStudents.length) / classStudents.length * 100) }}%</span>
            </div>
            <div class="batch-progress-bar">
              <div 
                class="batch-progress-fill" 
                :style="{ width: (Math.min(currentStudentIndex + (isMultiTest ? (currentConfig.maxParticipants || 1) : 1), classStudents.length) / classStudents.length * 100) + '%' }"
              ></div>
            </div>
            <div class="batch-student-list">
              <template v-if="isMultiTest">
                <div 
                  v-for="(student, index) in classStudents.slice(currentStudentIndex, currentStudentIndex + (currentConfig.maxParticipants || 1))" 
                  :key="student.id"
                  class="batch-student-item active"
                >
                  <el-icon><VideoPlay /></el-icon>
                  <span>{{ student.name }}</span>
                </div>
              </template>
              <template v-else>
                <div 
                  v-for="(student, index) in classStudents.slice(0, 5)" 
                  :key="student.id"
                  class="batch-student-item"
                  :class="{ 
                    active: index === currentStudentIndex, 
                    done: index < currentStudentIndex,
                    pending: index > currentStudentIndex 
                  }"
                >
                  <el-icon v-if="index < currentStudentIndex"><Check /></el-icon>
                  <el-icon v-else-if="index === currentStudentIndex"><VideoPlay /></el-icon>
                  <span>{{ student.name }}</span>
                </div>
                <div v-if="classStudents.length > 5" class="batch-student-more">
                  还有 {{ classStudents.length - 5 }} 名学生...
                </div>
              </template>
            </div>
          </div>

          <!-- 当前成绩 -->
          <div class="score-card">
            <div class="score-header">
              <span class="score-label">当前成绩</span>
              <el-button :icon="Refresh" @click="retryTest" v-if="testStatus === 'completed'">重测</el-button>
            </div>
            <div class="score-display">
              <span class="score-value" :style="{ color: currentConfig.color }">{{ currentScore }}</span>
              <span class="score-unit">{{ currentConfig.unit }}</span>
            </div>
            <div class="score-grade" :class="scoreGrade">{{ scoreGradeText }}</div>
          </div>

          <!-- 历史最好成绩 -->
          <div class="history-card">
            <div class="history-header">
              <el-icon><Trophy /></el-icon>
              <span>历史最好成绩</span>
            </div>
            <div class="history-score">
              <span class="history-value">{{ bestScore }}</span>
              <span class="history-unit">{{ currentConfig.unit }}</span>
            </div>
            <div class="history-date">{{ bestScoreDate }}</div>
          </div>

          <!-- 姿态指标 -->
          <div class="metrics-card">
            <div class="metrics-header">
              <el-icon><DataLine /></el-icon>
              <span>姿态指标分析</span>
            </div>
            <div class="metrics-grid">
              <div class="metric-item" v-for="(metric, index) in displayMetrics" :key="index">
                <span class="metric-label">{{ metric.label }}</span>
                <span class="metric-value" :class="{ good: metric.isGood }">{{ metric.value }}</span>
              </div>
            </div>
          </div>

          <!-- 肌群发力分析 -->
          <div class="muscle-card">
            <div class="muscle-header">
              <el-icon><DataLine /></el-icon>
              <span>肌群发力分析</span>
            </div>
            <div class="muscle-bars">
              <div class="muscle-bar-item" v-for="muscle in muscleData" :key="muscle.name">
                <div class="muscle-bar-header">
                  <span class="muscle-bar-name">{{ muscle.name }}</span>
                  <span class="muscle-bar-value">{{ muscle.value }}%</span>
                </div>
                <div class="muscle-bar-track">
                  <div class="muscle-bar-fill" 
                    :style="{ width: muscle.value + '%', background: muscle.color }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频回放弹窗 -->
    <el-dialog 
      v-model="showVideoPlayback" 
      title="视频回放" 
      :width="'80%'"
      :close-on-click-modal="false"
    >
      <div class="playback-modal">
        <VideoPlayer 
          :src="recordedVideo" 
          :markers="videoMarkers"
         
        />
      </div>
    </el-dialog>

    <!-- 关键帧分析弹窗 -->
    <el-dialog 
      v-model="showKeyframeAnalysis" 
      title="关键帧分析" 
      :width="'95%'"
      :close-on-click-modal="false"
      class="keyframe-dialog"
      top="4vh"
    >
      <template #header>
        <div class="dialog-header-content">
          <span class="dialog-title">关键帧分析</span>
          <div class="dialog-actions">
            <el-button text size="small" @click="clearKeyframeAnnotations">清除标注</el-button>
            <el-button text size="small" type="primary" @click="exportKeyframeAnnotations">导出标注</el-button>
          </div>
        </div>
      </template>
      <div class="analysis-modal">
        <KeyframeViewer ref="keyframeViewerRef" :frames="keyframes" />
      </div>
    </el-dialog>

    <!-- 设置弹窗 -->
    <el-dialog 
      v-model="showSettings" 
      title="终端设置" 
      :width="'800px'"
      :close-on-click-modal="false"
      :fullscreen="false"
      class="settings-dialog"
    >
      <TerminalSettings @save="handleSettingsSave" />
    </el-dialog>

    <!-- 违规记录面板弹窗 -->
    <el-dialog 
      v-model="showViolationPanel" 
      title="违规记录与仲裁" 
      :width="'800px'"
      :close-on-click-modal="false"
      class="violation-panel-dialog"
    >
      <div class="violation-panel">
        <!-- 违规统计 -->
        <div class="violation-stats">
          <div class="stat-item">
            <span class="stat-num">{{ violationLogs.filter(l => l.status === 'pending').length }}</span>
            <span class="stat-label">待处理</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ violationLogs.filter(l => l.status === 'confirmed').length }}</span>
            <span class="stat-label">已确认</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ violationLogs.filter(l => l.status === 'appeal').length }}</span>
            <span class="stat-label">申诉中</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ violationLogs.filter(l => l.status === 'dismissed').length }}</span>
            <span class="stat-label">已撤销</span>
          </div>
        </div>

        <!-- 违规日志列表 -->
        <div class="violation-list">
          <div 
            v-for="log in violationLogs" 
            :key="log.id" 
            class="violation-item"
            :class="{ 
              'high-severity': log.severity === 'high',
              'medium-severity': log.severity === 'medium',
              'low-severity': log.severity === 'low',
              'pending': log.status === 'pending',
              'confirmed': log.status === 'confirmed',
              'appeal': log.status === 'appeal',
              'dismissed': log.status === 'dismissed'
            }"
          >
            <div class="violation-icon"><el-icon :size="18" color="#E85D4E"><component :is="log.icon" /></el-icon></div>
            <div class="violation-info">
              <div class="violation-header">
                <span class="violation-name">{{ log.name }}</span>
                <span class="violation-severity" :class="log.severity">{{ getSeverityText(log.severity) }}</span>
                <span class="violation-status" :class="log.status">{{ log.statusLabel || getStatusLabel(log.status) }}</span>
              </div>
              <div class="violation-detail">
                <span class="violation-desc">{{ log.description }}</span>
              </div>
              <div class="violation-meta">
                <span>{{ log.studentName }}</span>
                <span>{{ log.sportName }}</span>
                <span>{{ log.timestamp }}</span>
              </div>
              <div class="violation-impact">
                <span>影响：{{ log.finalImpact || log.scoreImpact }}</span>
              </div>
            </div>
            <div class="violation-actions" v-if="log.status === 'pending'">
              <el-button size="small" type="danger" @click="markViolation(log.id, 'confirm')">
                确认违规
              </el-button>
              <el-button size="small" type="primary" @click="markViolation(log.id, 'dismiss')">
                撤销违规
              </el-button>
              <el-button size="small" @click="markViolation(log.id, 'appeal')">
                申诉
              </el-button>
            </div>
            <div class="violation-actions" v-else-if="log.status === 'appeal'">
              <el-button size="small" type="danger" @click="markViolation(log.id, 'confirm')">
                驳回申诉
              </el-button>
              <el-button size="small" type="primary" @click="markViolation(log.id, 'dismiss')">
                同意申诉
              </el-button>
            </div>
            <div class="violation-actions" v-else-if="log.status === 'confirmed'">
              <el-button size="small" type="primary" @click="markViolation(log.id, 'dismiss')">
                重新审核
              </el-button>
            </div>
          </div>
          <div v-if="violationLogs.length === 0" class="no-violations">
            <el-icon><CircleCheck /></el-icon>
            <span>暂无违规记录</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 底部语音播报 -->
    <div class="bottom-bar">
      <div class="voice-indicator">
        <span class="voice-icon">🔊</span>
        <span class="voice-text">{{ voiceMessage }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%', background: currentConfig.color }"></div>
      </div>
    </div>

    <!-- 学生选择弹窗 -->
    <el-dialog 
      v-model="showStudentSelector" 
      title="选择学生" 
      :width="'600px'"
      :close-on-click-modal="false"
    >
      <div class="student-selector">
        <div class="search-box">
          <el-input 
            v-model="studentSearchText" 
            placeholder="搜索学生姓名或学号"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="student-list">
          <div
            v-for="student in paginatedFilteredStudents"
            :key="student.id"
            class="student-item"
            :class="{ selected: selectedStudentId === student.id }"
            @click="selectStudent(student)"
          >
            <div class="item-avatar">
              <User />
            </div>
            <div class="item-info">
              <span class="item-name">{{ student.name }}</span>
              <span class="item-class">{{ student.class }}</span>
            </div>
            <div class="item-id">{{ student.id }}</div>
            <el-icon v-if="selectedStudentId === student.id" class="check-icon"><Check /></el-icon>
          </div>
        </div>
        <div class="selector-pagination">
          <el-pagination
            v-model:current-page="studentSelectorPage"
            v-model:page-size="studentSelectorPageSize"
            :total="filteredStudents.length"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, prev, pager, next"
            small
          />
        </div>
      </div>
    </el-dialog>

    <!-- 项目管理弹窗 -->
    <el-dialog 
      v-model="showProjectManager" 
      title="测试项目管理" 
      :width="'600px'"
      :close-on-click-modal="false"
      class="project-manager-dialog"
    >
      <div class="project-manager">
        <p class="manager-desc">开启或关闭测试项目，关闭的项目将不会出现在项目选择列表中</p>
        <div class="project-list">
          <div 
            v-for="sport in sportList" 
            :key="sport.id" 
            class="project-item"
            :class="{ disabled: !isSportEnabled(sport.id) }"
          >
            <div class="project-info">
              <span class="project-name">{{ sport.name }}</span>
              <span class="project-status" :class="{ enabled: isSportEnabled(sport.id) }">
                {{ isSportEnabled(sport.id) ? '已开启' : '已关闭' }}
              </span>
            </div>
            <el-switch 
              :model-value="isSportEnabled(sport.id)"
              @change="(val) => toggleSportEnabled(sport.id, val)"
              active-text="开启"
              inactive-text="关闭"
            />
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 成绩补录/修正弹窗 -->
    <el-dialog 
      v-model="showScoreCorrection" 
      title="成绩补录与修正" 
      :width="'800px'"
      :close-on-click-modal="false"
      class="score-correction-dialog"
    >
      <div class="score-correction">
        <!-- 补录新成绩 -->
        <div class="correction-section">
          <h4>补录新成绩</h4>
          <el-form :model="correctionForm" label-width="80px" class="correction-form">
            <el-form-item label="学生">
              <el-select v-model="correctionForm.studentId" placeholder="选择学生" filterable style="width: 100%">
                <el-option 
                  v-for="student in availableStudents" 
                  :key="student.id" 
                  :label="student.name + ' (' + student.class + ')'" 
                  :value="student.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="项目">
              <el-select v-model="correctionForm.event" placeholder="选择项目" style="width: 100%">
                <el-option 
                  v-for="sport in sportList" 
                  :key="sport.id" 
                  :label="sport.name" 
                  :value="sport.name"
                  :disabled="!isSportEnabled(sport.id)"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="成绩">
              <el-input v-model="correctionForm.score" placeholder="输入成绩" style="width: 200px" />
              <span class="score-unit-hint">{{ getUnitByEvent(correctionForm.event) }}</span>
            </el-form-item>
            <el-form-item label="等级">
              <el-tag :type="getCorrectionGradeType(correctionForm.score, correctionForm.event)">
                {{ getCorrectionGrade(correctionForm.score, correctionForm.event) || '未评定' }}
              </el-tag>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="correctionForm.remark" placeholder="补录原因（如：缓考补测）" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitCorrection">确认补录</el-button>
              <el-button @click="resetCorrectionForm">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 已有成绩修正 -->
        <div class="correction-section">
          <h4>已有成绩记录（可修正）</h4>
          <div class="correction-records">
            <div 
              v-for="record in recentTestRecords" 
              :key="record.id" 
              class="correction-record"
            >
              <div class="record-info">
                <span class="record-student">{{ record.studentName }}</span>
                <span class="record-event">{{ record.event }}</span>
                <span class="record-score">{{ record.score }}{{ getUnitByEvent(record.event) }}</span>
                <el-tag size="small" :type="record.grade === '优秀' ? 'success' : record.grade === '良好' ? '' : record.grade === '及格' ? 'warning' : 'danger'">
                  {{ record.grade }}
                </el-tag>
                <span class="record-date">{{ record.date }}</span>
                <el-tag v-if="record.corrected" size="small" type="info">已修正</el-tag>
              </div>
              <div class="record-actions">
                <el-button size="small" @click="editRecord(record)">修正</el-button>
                <el-button size="small" type="danger" @click="deleteRecord(record)">删除</el-button>
              </div>
            </div>
            <div v-if="recentTestRecords.length === 0" class="no-records">
              暂无测试记录
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 修正成绩弹窗 -->
    <el-dialog 
      v-model="showEditRecord" 
      title="修正成绩" 
      :width="'400px'"
      :close-on-click-modal="false"
    >
      <el-form label-width="60px">
        <el-form-item label="学生">
          <span>{{ editingRecord?.studentName }}</span>
        </el-form-item>
        <el-form-item label="项目">
          <span>{{ editingRecord?.event }}</span>
        </el-form-item>
        <el-form-item label="原成绩">
          <span class="old-score">{{ editingRecord?.score }}</span>
        </el-form-item>
        <el-form-item label="新成绩">
          <el-input v-model="editingRecordNewScore" placeholder="输入新成绩" style="width: 200px" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="editingRecordReason" placeholder="修正原因" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditRecord = false">取消</el-button>
        <el-button type="primary" @click="confirmEditRecord">确认修正</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Trophy, DataLine, VideoPlay, SwitchButton, FullScreen, Setting, Edit, Search, Check, Warning, CircleCheck, Refresh, Timer, Download, Monitor, Close, UserFilled, ScaleToOriginal, CircleClose, Tools } from '@element-plus/icons-vue'
import VideoPlayer from '@/components/media/VideoPlayer.vue'
import KeyframeViewer from '@/components/media/KeyframeViewer.vue'
import TerminalSettings from '@/components/config/TerminalSettings.vue'
import { sportConfig, sportList } from '@/config/sport-config.js'
import { getSchoolMockData } from '@/utils/mockDataLoader'
import store from '@/store/global.js'
import { useOperationLog } from '@/composables/useOperationLog'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const route = useRoute()
const { addLog } = useOperationLog('test')

const routeSportMap = {
  LongJump: 'longJump',
  SitUps: 'sitUps',
  SitAndReach: 'sitAndReach',
  RopeSkipping: 'ropeSkipping',
  FiftyMeter: 'fiftyMeter',
  FiftyMeterpointeight: 'fiftyMeter8',
  PullUp: 'pullUp',
  RunningTest: 'running',
  BodyIndex: 'bmi'
}

const eventNameToSportMap = {
  '立定跳远': 'longJump',
  '仰卧起坐': 'sitUps',
  '坐位体前屈': 'sitAndReach',
  '50米跑': 'fiftyMeter',
  '跳绳': 'ropeSkipping',
  '一分钟跳绳': 'ropeSkipping',
  '引体向上': 'pullUp',
  '800米跑': 'running',
  '1000米跑': 'running',
  '长跑': 'running',
  '身高体重': 'bmi',
  'BMI测试': 'bmi',
  '肺活量': 'vitalCapacity',
  '50米*8往返跑': 'fiftyMeter8'
}

const multiParticipantNames = [
  '张宏森', '高芸熙', '张桐昕', '范晨熙', '刘浩宇',
  '陈思语', '赵文博', '冯思琪', '杨子涵', '孙佳怡'
]

// 当前选中的运动项目
const currentSport = ref('longJump')
const currentConfig = computed(() => sportConfig[currentSport.value])
const isMultiTest = computed(() => (currentConfig.value.maxParticipants || 1) > 1)

// 班级学生列表（用于批量测试）
const classStudents = ref([])
const currentStudentIndex = ref(0)
const testMode = ref('single')

// 长跑距离选择
const selectedDistance = ref(800)

// 测试状态
const videoSectionRef = ref(null)
const currentTime = ref('')
const cameraStatus = ref('摄像头正常')
const testStatus = ref('idle')
const hasViolation = ref(false)
const violationMessage = ref('')
const currentScore = ref('--')
const currentParticipants = ref(1)
const countdownSeconds = ref(0)
const multiParticipants = ref([])
const scoreGrade = ref('')
const scoreGradeText = ref('')
const bestScore = ref('--')
const bestScoreDate = ref('--')
const progressPercent = ref(0)
const voiceMessage = ref('请学生站到测试区域准备测试')
const terminalEnabled = ref(true)

const checkTerminalStatus = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'

  // 1. 检查练习模式开关
  const modeKey = `smart_pe_practice_mode_${schoolId}`
  const modeStored = sessionStorage.getItem(modeKey)
  if (modeStored) {
    try {
      const modeData = JSON.parse(modeStored)
      if (modeData.practiceEnabled === false) {
        terminalEnabled.value = false
        return
      }
    } catch { /* fall through */ }
  }

  // 2. 检查设备实际在线状态
  const devicesKey = `smart_pe_devices_${schoolId}`
  const devicesStored = sessionStorage.getItem(devicesKey)
  if (devicesStored) {
    try {
      const deviceList = JSON.parse(devicesStored)
      if (Array.isArray(deviceList) && deviceList.length > 0) {
        const hasOnline = deviceList.some(d => d.status === 'online')
        terminalEnabled.value = hasOnline
        return
      }
    } catch { /* fall through */ }
  }

  // 3. 默认在线
  terminalEnabled.value = true
}

// 违规检测相关
const violationTypes = {
  falseStart: { id: 'falseStart', name: '抢跑', severity: 'high', icon: Warning, description: '在发令前开始动作' },
  outOfBounds: { id: 'outOfBounds', name: '出界', severity: 'high', icon: Close, description: '测试过程中超出规定区域' },
  assist: { id: 'assist', name: '协助犯规', severity: 'high', icon: UserFilled, description: '接受他人协助完成测试' },
  postureViolation: { id: 'postureViolation', name: '姿势违规', severity: 'medium', icon: ScaleToOriginal, description: '动作姿势不符合规范' },
  cheating: { id: 'cheating', name: '作弊', severity: 'high', icon: CircleClose, description: '使用不正当手段获取成绩' },
  equipment: { id: 'equipment', name: '器材违规', severity: 'medium', icon: Tools, description: '使用违规器材或设备' },
  timeout: { id: 'timeout', name: '超时', severity: 'low', icon: Timer, description: '测试时间超过规定时限' },
  interference: { id: 'interference', name: '干扰测试', severity: 'medium', icon: Close, description: '干扰其他学生测试' }
}

const violationLogs = ref([])
const currentViolation = ref(null)
const showViolationPanel = ref(false)

const getSeverityText = (severity) => {
  const map = { high: '严重', medium: '中等', low: '轻微' }
  return map[severity] || severity
}

const getStatusLabel = (status) => {
  const map = { pending: '待处理', confirmed: '已确认', appeal: '申诉中', dismissed: '已撤销' }
  return map[status] || status
}

const detectViolation = () => {
  if (!terminalSettings.value.violationDetection) return
  const random = createSeededRandom(schoolId.value + '_detectViolation')
  
  const sportId = currentSport.value
  const violationMap = {
    longJump: ['falseStart', 'outOfBounds', 'postureViolation'],
    sitUps: ['postureViolation', 'assist', 'timeout'],
    sitAndReach: ['postureViolation', 'assist'],
    ropeSkipping: ['postureViolation', 'equipment'],
    fiftyMeter: ['falseStart', 'outOfBounds', 'interference'],
    fiftyMeter8: ['falseStart', 'outOfBounds', 'interference'],
    pullUp: ['postureViolation', 'assist', 'equipment'],
    running: ['falseStart', 'outOfBounds', 'interference'],
    bmi: [],
    vitalCapacity: ['equipment', 'postureViolation']
  }
  
  const possibleViolations = violationMap[sportId] || []
  if (possibleViolations.length === 0) return
  
  const randomIndex = Math.floor(random() * possibleViolations.length)
  const violationId = possibleViolations[randomIndex]
  
  if (random() > 0.7) {
    triggerViolation(violationId)
  }
}

const triggerViolation = (violationId) => {
  const violation = violationTypes[violationId]
  if (!violation) return
  
  const log = {
    id: generateDeterministicId('viol', currentStudent.value.name + '_' + currentConfig.value.name + '_' + violationId),
    type: violationId,
    name: violation.name,
    severity: violation.severity,
    icon: violation.icon,
    description: violation.description,
    timestamp: new Date().toLocaleTimeString('zh-CN'),
    studentName: currentStudent.value.name,
    sportName: currentConfig.value.name,
    status: 'pending',
    scoreImpact: violation.severity === 'high' ? '无效' : violation.severity === 'medium' ? '扣分' : '警告'
  }
  
  violationLogs.value.unshift(log)
  currentViolation.value = log
  
  setVoiceMessage(`⚠️ 检测到违规：${violation.name}！${violation.description}`)
  
  if (violation.severity === 'high') {
    testStatus.value = 'completed'
    currentScore.value = '--'
    scoreGrade.value = ''
    scoreGradeText.value = ''
    ElMessage.error(`检测到严重违规：${violation.name}，成绩无效！`)
  } else {
    ElMessage.warning(`检测到违规：${violation.name}，${log.scoreImpact}处理`)
  }
}

const markViolation = (logId, action) => {
  const log = violationLogs.value.find(l => l.id === logId)
  if (!log) return
  
  const actionMap = {
    confirm: { status: 'confirmed', label: '已确认', impact: '成绩无效' },
    dismiss: { status: 'dismissed', label: '已撤销', impact: '成绩有效' },
    appeal: { status: 'appeal', label: '申诉中', impact: '待审核' }
  }
  
  const result = actionMap[action]
  if (result) {
    log.status = result.status
    log.statusLabel = result.label
    log.finalImpact = result.impact
    
    if (action === 'confirm' && log.severity === 'high') {
      currentScore.value = '--'
      scoreGrade.value = ''
      scoreGradeText.value = ''
      setVoiceMessage(`违规已确认，${currentStudent.value.name}的${currentConfig.value.name}成绩无效`)
      ElMessage.error(`已确认违规，成绩无效`)
    } else if (action === 'dismiss') {
      if (currentScore.value === '--') {
        simulateTest()
      }
      setVoiceMessage(`违规已撤销，${currentStudent.value.name}的成绩有效`)
      ElMessage.success(`已撤销违规判定`)
    } else if (action === 'appeal') {
      setVoiceMessage(`已提交申诉，请等待审核`)
      ElMessage.info(`已提交申诉`)
    }
  }
}

// 当前学生信息
const currentStudent = ref({
  name: '张宏森',
  class: '一年级4班',
  id: 'stu-7459462805905739776'
})

// 学生选择器相关
const showStudentSelector = ref(false)
const studentSearchText = ref('')
const selectedStudentId = ref('')
const editingSlotIndex = ref(-1)

// 可选学生列表
const availableStudents = computed(() => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  let students = []
  
  const stored = sessionStorage.getItem(`students_${schoolId}`)
  if (stored) {
    try {
      students = JSON.parse(stored)
    } catch {
      students = getSchoolMockData(schoolId).students || []
    }
  } else {
    students = getSchoolMockData(schoolId).students || []
  }
  
  return students.map(s => ({
    id: s.id,
    name: s.name,
    class: `${s.grade || s.itemGrade || ''}${s.class || s.itemClass || ''}`
  })).sort((a, b) => {
    const idA = parseInt((a.id || '').replace('stu-', '')) || 0
    const idB = parseInt((b.id || '').replace('stu-', '')) || 0
    return idA - idB
  })
})

// 过滤后的学生列表
const filteredStudents = computed(() => {
  if (!studentSearchText.value) {
    return availableStudents.value
  }
  const search = studentSearchText.value.toLowerCase()
  return availableStudents.value.filter(s =>
    s.name.toLowerCase().includes(search) ||
    s.id.toLowerCase().includes(search) ||
    s.class.toLowerCase().includes(search)
  )
})

// 学生选择器分页
const studentSelectorPage = ref(1)
const studentSelectorPageSize = ref(20)

const paginatedFilteredStudents = computed(() => {
  const start = (studentSelectorPage.value - 1) * studentSelectorPageSize.value
  return filteredStudents.value.slice(start, start + studentSelectorPageSize.value)
})

watch(studentSearchText, () => {
  studentSelectorPage.value = 1
})

// 打开学生选择器（单人模式）
const openStudentSelector = () => {
  if (testStatus.value === 'testing' || testStatus.value === 'scanning') {
    ElMessage.warning('测试进行中，无法更换学生')
    return
  }
  editingSlotIndex.value = -1
  selectedStudentId.value = currentStudent.value.id
  showStudentSelector.value = true
}

// 打开学生选择器（多人模式）
const openMultiStudentSelector = (index) => {
  if (testStatus.value === 'testing' || testStatus.value === 'scanning') {
    ElMessage.warning('测试进行中，无法更换学生')
    return
  }
  editingSlotIndex.value = index
  const participant = multiParticipants.value[index]
  selectedStudentId.value = participant.name !== '待测' ? 
    availableStudents.value.find(s => s.name === participant.name)?.id || '' : ''
  showStudentSelector.value = true
}

// 选择学生
const selectStudent = (student) => {
  if (editingSlotIndex.value >= 0) {
    // 多人模式
    multiParticipants.value[editingSlotIndex.value].name = student.name
    multiParticipants.value[editingSlotIndex.value].status = 'ready'
    // 如果之前是空位，增加当前测试人数
    if (multiParticipants.value[editingSlotIndex.value].status === 'empty') {
      currentParticipants.value++
    }
    ElMessage.success(`已更换第${editingSlotIndex.value + 1}位学生为 ${student.name}`)
  } else {
    // 单人模式
    currentStudent.value = { ...student }
    loadDefaultBestScore(currentSport.value)
    currentScore.value = '--'
    scoreGrade.value = ''
    scoreGradeText.value = ''
    ElMessage.success(`已选择学生：${student.name}`)
  }
  showStudentSelector.value = false
}

// 姿态指标数据
const displayMetrics = ref([
  { label: '起跳角度', value: '75°', isGood: true },
  { label: '腾空高度', value: '45cm', isGood: true },
  { label: '平均速度', value: '3.2m/s', isGood: false },
  { label: '摆臂幅度', value: '120°', isGood: false },
  { label: '腾空时间', value: '0.65s', isGood: false },
  { label: '屈膝角', value: '125°', isGood: true }
])

// 肌群发力数据
const muscleData = ref([
  { name: '大腿肌群', value: 85, color: '#1E5AA8' },
  { name: '小腿肌群', value: 72, color: '#3B82F6' },
  { name: '核心肌群', value: 68, color: '#F5A623' },
  { name: '上肢肌群', value: 55, color: '#8B5CF6' },
  { name: '臀部肌群', value: 78, color: '#06B6D4' }
])

// 骨骼点数据
const skeletonJoints = ref([
  { top: '25%', left: '30%' },
  { top: '35%', left: '25%' },
  { top: '35%', left: '35%' },
  { top: '50%', left: '30%' },
  { top: '65%', left: '28%' },
  { top: '65%', left: '32%' }
])

// 弹窗控制
const showVideoPlayback = ref(false)
const showKeyframeAnalysis = ref(false)
const showSettings = ref(false)
const keyframeViewerRef = ref(null)

// 需求5：项目管理、成绩补录、导出
const showProjectManager = ref(false)
const showScoreCorrection = ref(false)
const showEditRecord = ref(false)

// 发令倒计时
const commandPhase = ref('none') // none, ready, set, countdown, go
const commandCountdown = ref(0)
const commandText = computed(() => {
  const map = { ready: '各就位', set: '预备', countdown: '预备', go: '跑！' }
  return map[commandPhase.value] || ''
})

// 项目启停状态（持久化到 sessionStorage）
const sportEnabledMap = ref({})
const initSportEnabledMap = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const stored = sessionStorage.getItem(`sport_enabled_${schoolId}`)
  if (stored) {
    try { sportEnabledMap.value = JSON.parse(stored) } catch { sportEnabledMap.value = {} }
  }
  // 默认全部开启
  sportList.forEach(s => {
    if (sportEnabledMap.value[s.id] === undefined) sportEnabledMap.value[s.id] = true
  })
}
const isSportEnabled = (sportId) => {
  return sportEnabledMap.value[sportId] !== false
}
const toggleSportEnabled = (sportId, val) => {
  sportEnabledMap.value[sportId] = val
  const schoolId = store.state.school.id || 'hailin-second-primary'
  sessionStorage.setItem(`sport_enabled_${schoolId}`, JSON.stringify(sportEnabledMap.value))
  ElMessage.success(`${sportConfig[sportId]?.name || sportId} 已${val ? '开启' : '关闭'}`)
}

// 成绩补录表单
const correctionForm = ref({ studentId: '', event: '', score: '', remark: '' })
const editingRecord = ref(null)
const editingRecordNewScore = ref('')
const editingRecordReason = ref('')

// 已有测试记录
const recentTestRecords = computed(() => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  try {
    const records = JSON.parse(sessionStorage.getItem(`exam_results_${schoolId}`) || '[]')
    return records.slice(-50).reverse()
  } catch { return [] }
})

// 终端设置数据
const terminalSettings = ref({
  cameraEnabled: true,
  cameraCount: 2,
  resolution: '1080p',
  frameRate: 30,
  aiEnabled: true,
  aiSensitivity: 7,
  voiceEnabled: true,
  voiceVolume: 80,
  violationDetection: true,
  retestCount: 2
})

// 保存设置
const handleSettingsSave = (settings) => {
  terminalSettings.value = settings
  showSettings.value = false
  ElMessage.success('设置已保存')
  // 应用设置到当前终端
  applySettings(settings)
}

// 应用设置
const applySettings = (settings) => {
  if (!settings.voiceEnabled) {
    voiceMessage.value = ''
  }
  // 其他设置可以在这里应用
}

// 统一设置语音消息（自动检查开关）
const setVoiceMessage = (message) => {
  if (terminalSettings.value.voiceEnabled) {
    voiceMessage.value = message
    speak(message)
  } else {
    voiceMessage.value = ''
  }
}

// Web Speech API 语音合成
const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  }
}

// 视频回放相关
const recordedVideo = ref('')
const videoMarkers = ref([])

// 关键帧数据
const keyframes = ref([])

// 初始化多人测试位
const initMultiParticipants = (count) => {
  const max = currentConfig.value.maxParticipants || 1
  const activeCount = Math.min(count || max, max)
  multiParticipants.value = Array.from({ length: max }, (_, i) => ({
    name: i < activeCount ? multiParticipantNames[i] : '待测',
    score: '--',
    status: i < activeCount ? 'ready' : 'empty'
  }))
  currentParticipants.value = activeCount
}

// 切换运动项目
const handleSportChange = (sportId) => {
  testStatus.value = 'idle'
  currentScore.value = '--'
  scoreGrade.value = ''
  scoreGradeText.value = ''
  progressPercent.value = 0
  countdownSeconds.value = 0
  loadDefaultBestScore(sportId)
  setVoiceMessage(`请${currentConfig.value.name}学生站到测试区域准备`)
  loadKeyframeExamples(sportId)
  updateMetrics(sportId)

  if (isMultiTest.value) {
    const max = currentConfig.value.maxParticipants || 1
    const hasCurrentStudent = currentStudent.value && currentStudent.value.name && currentStudent.value.name !== '选择学生'
    
    if (multiParticipants.value.length === 0) {
      multiParticipants.value = Array.from({ length: max }, (_, i) => ({
        name: i === 0 && hasCurrentStudent ? currentStudent.value.name : '待测',
        score: '--',
        status: i === 0 && hasCurrentStudent ? 'ready' : 'empty'
      }))
      currentParticipants.value = hasCurrentStudent ? 1 : 0
    } else {
      if (!multiParticipants.value[0] || multiParticipants.value[0].name === '待测' || multiParticipants.value[0].status === 'empty') {
        if (hasCurrentStudent) {
          multiParticipants.value[0].name = currentStudent.value.name
          multiParticipants.value[0].status = 'ready'
          currentParticipants.value = Math.max(currentParticipants.value, 1)
        }
      }
      
      const currentLen = multiParticipants.value.length
      if (currentLen < max) {
        for (let i = currentLen; i < max; i++) {
          multiParticipants.value.push({
            name: '待测',
            score: '--',
            status: 'empty'
          })
        }
      } else if (currentLen > max) {
        multiParticipants.value = multiParticipants.value.slice(0, max)
      }
    }
    
    testMode.value = 'multi'
  } else {
    currentParticipants.value = 1
    multiParticipants.value = []
    testMode.value = 'single'
  }

  if (currentConfig.value.distanceOptions) {
    selectedDistance.value = currentConfig.value.distanceOptions[0]
  }
}

// 切换距离（用于长跑和短跑等带距离选项的项目）
const handleDistanceChange = (distance) => {
  setVoiceMessage(`已选择${distance}米测试，请学生准备`)
  // 根据当前项目加载相应的默认成绩 & 指标
  loadDefaultBestScore(currentSport.value)
  updateMetrics(currentSport.value)
  currentScore.value = '--'
  scoreGrade.value = ''
  scoreGradeText.value = ''
  progressPercent.value = 0
}

// 加载默认最佳成绩
const loadDefaultBestScore = (sportId) => {
  const defaults = {
    longJump: { score: '2.35', date: '2026-01-10' },
    sitUps: { score: '52', date: '2026-01-15' },
    sitAndReach: { score: '18.5', date: '2026-01-12' },
    ropeSkipping: { score: '180', date: '2026-01-08' },
    fiftyMeter: { score: '8.25', date: '2026-01-11' },
    fiftyMeter100: { score: '11.00', date: '2026-01-10' },
    fiftyMeter8: { score: '1:45.30', date: '2026-01-09' },
    pullUp: { score: '12', date: '2026-01-14' },
    running800: { score: '2:48.50', date: '2026-01-13' },
    running1000: { score: '3:28.50', date: '2026-01-13' },
    bmi: { score: '19.8', date: '2026-01-17' },
    vitalCapacity: { score: '3500', date: '2026-01-16' }
  }
  
  let key = sportId
  // 对于有距离选项的项目，使用 sportId + 距离 作为 key（例如 running800 或 fiftyMeter100）
  if (currentConfig.value && currentConfig.value.distanceOptions) {
    key = `${sportId}${selectedDistance.value}`
  } else if (sportId === 'running') {
    key = `running${selectedDistance.value}`
  }
  
  const defaultData = defaults[key] || defaults[sportId] || { score: '--', date: '--' }
  bestScore.value = defaultData.score
  bestScoreDate.value = defaultData.date
}

// 加载关键帧示例
const loadKeyframeExamples = (sportId) => {
  const keyframeTemplates = {
    longJump: ['预备姿势', '起跳瞬间', '空中姿态', '落地时刻'],
    sitUps: ['准备躺平', '起身动作', '触膝完成', '回落过程'],
    sitAndReach: ['准备姿势', '前伸动作', '保持姿态', '收回动作'],
    ropeSkipping: ['挥绳动作', '跳跃瞬间', '绳过脚下', '落地时刻'],
    fiftyMeter: ['预备姿势', '起跑瞬间', '途中跑', '冲线时刻'],
    fiftyMeter8: ['预备姿势', '起跑出发', '折返跑', '最终冲线'],
    pullUp: ['悬垂开始', '拉起过程', '过杠完成', '回落过程'],
    running: ['起跑阶段', '途中跑', '冲刺阶段', '冲线时刻'],
    bmi: ['测量准备', '身高测量', '体重测量', '结果显示'],
    vitalCapacity: ['准备吹气', '吹气过程', '持续吹气', '完成测量']
  }
  const templates = keyframeTemplates[sportId] || keyframeTemplates.longJump
  keyframes.value = templates.map(label => generateKeyframeImage(label))
}

// 生成关键帧图片
const generateKeyframeImage = (label) => {
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect fill="%231e293b" width="320" height="240"/><circle cx="160" cy="80" r="20" fill="${encodeURIComponent(currentConfig.value.color)}"/><line x1="160" y1="100" x2="160" y2="180" stroke="${encodeURIComponent(currentConfig.value.color)}" stroke-width="4"/><line x1="160" y1="120" x2="100" y2="160" stroke="${encodeURIComponent(currentConfig.value.color)}" stroke-width="4"/><line x1="160" y1="120" x2="220" y2="160" stroke="${encodeURIComponent(currentConfig.value.color)}" stroke-width="4"/><text x="160" y="220" text-anchor="middle" fill="%239CA3AF" font-size="12">${encodeURIComponent(label)}</text></svg>`
}

// 更新姿态指标
const updateMetrics = (sportId) => {
  const metricsMap = {
    longJump: [
      { label: '起跳角度', value: '75°', isGood: true },
      { label: '腾空高度', value: '45cm', isGood: true },
      { label: '平均速度', value: '3.2m/s', isGood: false },
      { label: '摆臂幅度', value: '120°', isGood: false },
      { label: '腾空时间', value: '0.65s', isGood: false },
      { label: '屈膝角', value: '125°', isGood: true }
    ],
    sitUps: [
      { label: '仰卧速度', value: '45次/分', isGood: true },
      { label: '屈膝角', value: '95°', isGood: true },
      { label: '身体弯曲角', value: '35°', isGood: false },
      { label: '腹部发力', value: '85%', isGood: true },
      { label: '背部发力', value: '65%', isGood: false },
      { label: '颈部发力', value: '45%', isGood: false }
    ],
    sitAndReach: [
      { label: '姿态保持', value: '3.2s', isGood: true },
      { label: '屈膝角', value: '175°', isGood: true },
      { label: '身体弯曲', value: '45°', isGood: false },
      { label: '柔韧性', value: '优秀', isGood: true },
      { label: '伸展幅度', value: '18.5cm', isGood: true },
      { label: '平衡能力', value: '良好', isGood: false }
    ],
    ropeSkipping: [
      { label: '跳绳频率', value: '180次/分', isGood: true },
      { label: '平均速度', value: '2.5m/s', isGood: false },
      { label: '耐力指数', value: '85', isGood: true },
      { label: '协调性', value: '优秀', isGood: true },
      { label: '节奏稳定性', value: '良好', isGood: false },
      { label: '心肺功能', value: '中等', isGood: false }
    ],
    fiftyMeter: [
      { label: '反应时间', value: '0.15s', isGood: true },
      { label: '平均速度', value: '6.2m/s', isGood: true },
      { label: '最高速度', value: '8.5m/s', isGood: true },
      { label: '加速能力', value: '优秀', isGood: true },
      { label: '爆发力', value: '良好', isGood: false },
      { label: '步频', value: '180步/分', isGood: false }
    ],
    fiftyMeter8: [
      { label: '单圈平均', value: '12.8s', isGood: true },
      { label: '总距离', value: '400m', isGood: false },
      { label: '平均速度', value: '5.2m/s', isGood: false },
      { label: '耐力指数', value: '88', isGood: true },
      { label: '折返效率', value: '良好', isGood: false },
      { label: '节奏控制', value: '优秀', isGood: true }
    ],
    pullUp: [
      { label: '悬垂时间', value: '2.5s', isGood: false },
      { label: '拉起速度', value: '1.2m/s', isGood: true },
      { label: '耐力指数', value: '72', isGood: false },
      { label: '背部发力', value: '90%', isGood: true },
      { label: '核心稳定', value: '75%', isGood: false },
      { label: '握力', value: '中等', isGood: false }
    ],
    running: [
      { label: '平均配速', value: '4.2m/s', isGood: true },
      { label: '总距离', value: `${selectedDistance.value}m`, isGood: false },
      { label: '心率变化', value: '150-180', isGood: false },
      { label: '耐力等级', value: '优秀', isGood: true },
      { label: '步幅效率', value: '良好', isGood: false },
      { label: '呼吸节奏', value: '稳定', isGood: true }
    ],
    bmi: [
      { label: '身高', value: '175cm', isGood: false },
      { label: '体重', value: '60kg', isGood: false },
      { label: 'BMI指数', value: '19.8', isGood: true }
    ],
    vitalCapacity: [
      { label: '吹气力度', value: '强', isGood: true },
      { label: '吹气时长', value: '4.5s', isGood: true },
      { label: '肺活量指数', value: '优秀', isGood: true }
    ]
  }
  
  displayMetrics.value = metricsMap[sportId] || metricsMap.longJump
}

// 获取状态文本
const getStatusText = (status) => {
  if (!terminalEnabled.value) {
    return '系统离线'
  }
  const map = {
    idle: '系统在线',
    scanning: '识别中...',
    testing: '测试中',
    completed: '已完成'
  }
  return map[status] || status
}

// 获取起始线标签
const getLineLabel = () => {
  const labels = {
    longJump: '起跳线',
    fiftyMeter: '起跑线',
    fiftyMeter8: '起跑线',
    running: '起跑线'
  }
  return labels[currentSport.value] || '起始线'
}

// 获取当前活动项目名称
const getActiveSportName = () => {
  // 如果当前项目提供距离选项，优先显示所选距离
  if (currentConfig.value && currentConfig.value.distanceOptions) {
    return `${selectedDistance.value}米`
  }
  return currentConfig.value.name
}

// 获取当前活动项目单位
const getActiveSportUnit = () => {
  return currentConfig.value.unit
}

// 获取测试人数颜色
const getParticipantsColor = () => {
  const ratio = currentParticipants.value / (currentConfig.value.maxParticipants || 1)
  if (ratio >= 1) return '#E85D4E'
  if (ratio >= 0.75) return '#F5A623'
  if (ratio >= 0.5) return '#3B82F6'
  return '#1E5AA8'
}

// 开始测试
const startTest = async () => {
  if (!terminalEnabled.value) {
    ElMessage.error('系统离线，无法进行测试！请联系管理员开启设备')
    setVoiceMessage('系统离线，无法进行测试！')
    return
  }
  
  if (isMultiTest.value) {
    countdownSeconds.value = currentConfig.value.timeOptions?.[1] || 60
    multiParticipants.value.forEach(p => {
      if (p.status !== 'empty') p.status = 'testing'
    })
  }

  testStatus.value = 'scanning'
  setVoiceMessage(isMultiTest.value
    ? `检测到 ${currentParticipants.value} 位学生，请看向摄像头识别身份...`
    : '请看向摄像头，正在识别身份...')
  progressPercent.value = 30

  setTimeout(async () => {
    testStatus.value = 'testing'
    if (isMultiTest.value) {
      setVoiceMessage(`识别成功！${currentParticipants.value}位学生，准备开始${getActiveSportName()}测试...`)
      startMultiCountdown()
    } else {
      setVoiceMessage(`识别成功！${currentStudent.value.name}，准备开始${getActiveSportName()}测试...`)
    }
    progressPercent.value = 60

    // 径赛项目需要发令流程
    if (isRaceEvent.value && !isMultiTest.value) {
      await runStartingCommand()
    }

    simulateTest()
  }, 2000)
}

const startMultiCountdown = () => {
  // 清除之前的倒计时定时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  const random = createSeededRandom(schoolId.value + '_multiCountdown')
  
  countdownTimer = setInterval(() => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value--
      multiParticipants.value.forEach((p, i) => {
        if (p.status === 'testing') {
          p.score = Math.floor(random() * countdownSeconds.value * 3 + 50).toString()
        }
      })
    } else {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// 模拟测试
const simulateTest = () => {
  const config = currentConfig.value
  const duration = config.showCountdown ? (config.timeOptions?.[1] || 60) * 100 : 3000
  const random = createSeededRandom(schoolId.value + '_simulateTest')
  
  detectViolation()

  setTimeout(() => {
    let score = '--'
    const activeTypeId = config.id
    
    if (activeTypeId === 'longJump') {
      score = (2.25 + random() * 0.3).toFixed(config.precision)
    } else if (activeTypeId === 'sitUps') {
      score = Math.floor(45 + random() * 15).toString()
    } else if (activeTypeId === 'sitAndReach') {
      score = (15 + random() * 10).toFixed(config.precision)
    } else if (activeTypeId === 'ropeSkipping') {
      score = Math.floor(150 + random() * 50).toString()
    } else if (activeTypeId === 'fiftyMeter') {
      // 短跑根据选择的距离生成不同成绩（50m 与 100m）
      if (selectedDistance.value === 100) {
        score = (11 + random() * 2).toFixed(config.precision)
      } else {
        score = (7.5 + random() * 1.5).toFixed(config.precision)
      }
    } else if (activeTypeId === 'fiftyMeter8') {
      const seconds = Math.floor(90 + random() * 30)
      const mins = Math.floor(seconds / 60)
      const secs = (seconds % 60 + random()).toFixed(2)
      score = `${mins}:${secs.padStart(5, '0')}`
    } else if (activeTypeId === 'pullUp') {
      score = Math.floor(8 + random() * 8).toString()
    } else if (activeTypeId === 'running') {
      const baseSeconds = selectedDistance.value === 800 ? 160 : 200
      const totalSeconds = Math.floor(baseSeconds + random() * 40)
      const mins = Math.floor(totalSeconds / 60)
      const secs = ((totalSeconds % 60) + random()).toFixed(2)
      score = `${mins}:${secs.padStart(5, '0')}`
    } else if (activeTypeId === 'bmi') {
      score = (18.5 + random() * 5).toFixed(1)
    } else if (activeTypeId === 'vitalCapacity') {
      score = Math.floor(3000 + random() * 1500).toString()
    }

    currentScore.value = score
    updateScoreGrade(score)
    testStatus.value = 'completed'
    progressPercent.value = 100
    countdownSeconds.value = 0

    if (isMultiTest.value) {
      multiParticipants.value.forEach(p => {
        if (p.status === 'testing') {
          p.score = Math.floor(120 + random() * 80).toString()
          p.status = 'done'
        }
      })
      
      multiParticipants.value.forEach(p => {
        if (p.status === 'done' && p.id) {
          saveMultiTestRecord(p)
        }
      })
      
      setVoiceMessage(`${getActiveSportName()}测试完成！${multiParticipants.value.filter(p => p.status === 'done').length}位学生的成绩已保存！`)
    } else {
      if (score !== '--') {
        setVoiceMessage(`${getActiveSportName()}测试完成！成绩：${score}${getActiveSportUnit()}，${scoreGradeText.value}！`)
      } else {
        setVoiceMessage(`${getActiveSportName()}测试完成！`)
      }
      updateBestScore(score)
      saveTestRecord()
    }
    
    if (testMode.value === 'batch' && classStudents.value.length > 0) {
      setTimeout(() => {
        if (isMultiTest.value) {
          nextBatch()
        } else {
          nextStudent()
        }
      }, 3000)
    }
  }, duration)
}

const saveMultiTestRecord = (participant) => {
  addLog('批量保存', '', `批量保存测试记录`)
  const today = new Date()
  const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`
  
  const schoolId = store.state.school.id || 'hailin-second-primary'
  try {
    const storedRecords = JSON.parse(sessionStorage.getItem(`exam_results_${schoolId}`) || '[]')
    
    const newRecord = {
      studentId: participant.id,
      studentName: participant.name,
      class: participant.class,
      className: participant.class,
      event: currentConfig.value.name,
      score: participant.score,
      grade: getGradeText(participant.score),
      date: dateStr,
      category: route.query.category || '体育考试',
      status: 'completed'
    }
    
    storedRecords.unshift(newRecord)
    sessionStorage.setItem(`exam_results_${schoolId}`, JSON.stringify(storedRecords))
  } catch (e) {
    console.error('保存考试记录失败:', e)
  }
}

const getGradeText = (score) => {
  const config = currentConfig.value
  const numScore = parseFloat(score) || 0
  
  if (isNaN(numScore)) return '不及格'
  
  if (config.id === 'ropeSkipping') {
    return numScore >= 180 ? '优秀' : numScore >= 150 ? '良好' : numScore >= 100 ? '及格' : '不及格'
  } else if (config.id === 'fiftyMeter') {
    return numScore <= 8.5 ? '优秀' : numScore <= 9.5 ? '良好' : numScore <= 11.0 ? '及格' : '不及格'
  } else {
    return numScore >= 80 ? '优秀' : numScore >= 60 ? '良好' : numScore >= 40 ? '及格' : '不及格'
  }
}

const nextBatch = () => {
  const maxParticipants = currentConfig.value.maxParticipants || 1
  const nextIndex = currentStudentIndex.value + maxParticipants
  
  if (nextIndex < classStudents.value.length) {
    currentStudentIndex.value = nextIndex
    
    const batchStudents = classStudents.value.slice(nextIndex, nextIndex + maxParticipants)
    
    multiParticipants.value = Array.from({ length: maxParticipants }, (_, i) => {
      if (i < batchStudents.length) {
        const student = batchStudents[i]
        return {
          name: student.name,
          class: `${student.grade || student.itemGrade || ''}${student.class || student.itemClass || ''}`,
          id: student.id,
          score: '--',
          status: 'ready'
        }
      }
      return {
        name: '待测',
        class: '',
        id: '',
        score: '--',
        status: 'empty'
      }
    })
    currentParticipants.value = batchStudents.length
    
    const names = batchStudents.map(s => s.name).join('、')
    setVoiceMessage(`请${names}同学站到测试区域准备测试`)
    ElMessage.info(`已切换到下一批学生（第 ${nextIndex + 1}-${Math.min(nextIndex + maxParticipants, classStudents.value.length)} 位）`)
  } else {
    setVoiceMessage(`${currentConfig.value.name}测试全部完成！共测试 ${classStudents.value.length} 名学生`)
    ElMessage.success(`${currentConfig.value.name}测试全部完成！共测试 ${classStudents.value.length} 名学生`)
  }
}

const nextStudent = () => {
  if (currentStudentIndex.value < classStudents.value.length - 1) {
    currentStudentIndex.value++
    const student = classStudents.value[currentStudentIndex.value]
    currentStudent.value = {
      name: student.name,
      class: `${student.grade || student.itemGrade || ''}${student.class || student.itemClass || ''}`,
      id: student.id
    }
    currentScore.value = '--'
    scoreGrade.value = ''
    scoreGradeText.value = ''
    testStatus.value = 'idle'
    progressPercent.value = 0
    loadDefaultBestScore(currentSport.value)
    setVoiceMessage(`请${student.name}同学站到测试区域准备测试`)
    ElMessage.info(`已切换到第 ${currentStudentIndex.value + 1} 位学生：${student.name}`)
  } else {
    setVoiceMessage(`${currentConfig.value.name}测试全部完成！共测试 ${classStudents.value.length} 名学生`)
    ElMessage.success(`${currentConfig.value.name}测试全部完成！共测试 ${classStudents.value.length} 名学生`)
  }
}

// 更新成绩等级
const updateScoreGrade = (score) => {
  const config = currentConfig.value
  let numScore = parseFloat(score.replace(':', '.'))
  
  if (isNaN(numScore)) {
    scoreGrade.value = ''
    scoreGradeText.value = ''
    return
  }

  let grade, gradeText
  const activeTypeId = config.id
  
  if (activeTypeId === 'longJump') {
    grade = numScore >= 2.3 ? 'excellent' : numScore >= 2.0 ? 'good' : numScore >= 1.6 ? 'pass' : 'fail'
    gradeText = numScore >= 2.3 ? '优秀' : numScore >= 2.0 ? '良好' : numScore >= 1.6 ? '及格' : '不及格'
  } else if (activeTypeId === 'sitUps' || activeTypeId === 'pullUp') {
    grade = numScore >= 45 ? 'excellent' : numScore >= 35 ? 'good' : numScore >= 20 ? 'pass' : 'fail'
    gradeText = numScore >= 45 ? '优秀' : numScore >= 35 ? '良好' : numScore >= 20 ? '及格' : '不及格'
  } else if (activeTypeId === 'sitAndReach') {
    grade = numScore >= 18 ? 'excellent' : numScore >= 12 ? 'good' : numScore >= 5 ? 'pass' : 'fail'
    gradeText = numScore >= 18 ? '优秀' : numScore >= 12 ? '良好' : numScore >= 5 ? '及格' : '不及格'
  } else if (activeTypeId === 'ropeSkipping') {
    grade = numScore >= 180 ? 'excellent' : numScore >= 150 ? 'good' : numScore >= 100 ? 'pass' : 'fail'
    gradeText = numScore >= 180 ? '优秀' : numScore >= 150 ? '良好' : numScore >= 100 ? '及格' : '不及格'
  } else if (activeTypeId === 'fiftyMeter') {
    // 短跑采用不同阈值：50m 与 100m
    if (selectedDistance.value === 100) {
      grade = numScore <= 12.0 ? 'excellent' : numScore <= 14.0 ? 'good' : numScore <= 16.5 ? 'pass' : 'fail'
      gradeText = numScore <= 12.0 ? '优秀' : numScore <= 14.0 ? '良好' : numScore <= 16.5 ? '及格' : '不及格'
    } else {
      grade = numScore <= 8.0 ? 'excellent' : numScore <= 9.0 ? 'good' : numScore <= 10.5 ? 'pass' : 'fail'
      gradeText = numScore <= 8.0 ? '优秀' : numScore <= 9.0 ? '良好' : numScore <= 10.5 ? '及格' : '不及格'
    }
  } else if (activeTypeId === 'fiftyMeter8') {
    grade = numScore <= 1.75 ? 'excellent' : numScore <= 2.0 ? 'good' : numScore <= 2.5 ? 'pass' : 'fail'
    gradeText = numScore <= 1.75 ? '优秀' : numScore <= 2.0 ? '良好' : numScore <= 2.5 ? '及格' : '不及格'
  } else if (activeTypeId === 'running') {
    grade = numScore <= 3.0 ? 'excellent' : numScore <= 3.5 ? 'good' : numScore <= 4.5 ? 'pass' : 'fail'
    gradeText = numScore <= 3.0 ? '优秀' : numScore <= 3.5 ? '良好' : numScore <= 4.5 ? '及格' : '不及格'
  } else if (activeTypeId === 'bmi') {
    grade = numScore >= 18.5 && numScore <= 23.9 ? 'excellent' : numScore >= 16 && numScore < 18.5 ? 'good' : numScore > 23.9 && numScore <= 27.9 ? 'good' : numScore < 16 || numScore > 27.9 ? 'fail' : 'pass'
    gradeText = numScore >= 18.5 && numScore <= 23.9 ? '正常' : numScore >= 16 && numScore < 18.5 ? '偏瘦' : numScore > 23.9 && numScore <= 27.9 ? '超重' : numScore < 16 || numScore > 27.9 ? '异常' : '正常'
  } else if (activeTypeId === 'vitalCapacity') {
    grade = numScore >= 3500 ? 'excellent' : numScore >= 3000 ? 'good' : numScore >= 2000 ? 'pass' : 'fail'
    gradeText = numScore >= 3500 ? '优秀' : numScore >= 3000 ? '良好' : numScore >= 2000 ? '及格' : '不及格'
  } else {
    grade = ''
    gradeText = ''
  }

  scoreGrade.value = grade
  scoreGradeText.value = gradeText
}

// 更新历史最好成绩
const updateBestScore = (score) => {
  const config = currentConfig.value
  // 对于需要时间越小越好的项目（如短跑、往返跑、长跑），较小成绩为更好
  if (config.id === 'fiftyMeter' || config.id === 'fiftyMeter8' || config.id === 'running') {
    const currentBest = parseFloat(bestScore.value.replace(':', '.'))
    const newScore = parseFloat(score.replace(':', '.'))
    if (!isNaN(currentBest) && newScore < currentBest) {
      bestScore.value = score
      bestScoreDate.value = new Date().toISOString().split('T')[0]
      ElMessage.success('恭喜！打破个人最好成绩！')
    }
  } else {
    const currentBest = parseFloat(bestScore.value)
    const newScore = parseFloat(score)
    if (!isNaN(currentBest) && newScore > currentBest) {
      bestScore.value = score
      bestScoreDate.value = new Date().toISOString().split('T')[0]
      ElMessage.success('恭喜！打破个人最好成绩！')
    }
  }
}

// 终止测试
const stopTest = () => {
  testStatus.value = 'idle'
  currentScore.value = '--'
  scoreGrade.value = ''
  scoreGradeText.value = ''
  setVoiceMessage('测试已终止，请重新开始')
  progressPercent.value = 0
  ElMessage.info('测试已终止')
}

// 重测
const retryTest = () => {
  startTest()
}

// 全屏切换
const toggleFullscreen = () => {
  const videoSection = videoSectionRef.value
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else if (videoSection) {
    videoSection.requestFullscreen().catch(err => {
      ElMessage.error('全屏失败：' + err.message)
    })
  }
}



// 退出全屏
const exitFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
}

// 打开视频回放
const openVideoPlayback = () => {
  exitFullscreen()
  // 如果没有录制的视频，使用示例视频
  if (!recordedVideo.value) {
    recordedVideo.value = '/示例视频.mp4'
  }
  showVideoPlayback.value = true
}

// 打开关键帧分析
const openKeyframeAnalysis = () => {
  exitFullscreen()
  showKeyframeAnalysis.value = true
}

// 时间更新
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 清除标注
const clearKeyframeAnnotations = () => {
  if (keyframeViewerRef.value) {
    keyframeViewerRef.value.clearAnnotations()
  }
}

// 导出标注
const exportKeyframeAnnotations = () => {
  addLog('导出标注', '', `导出关键帧标注数据`)
  if (keyframeViewerRef.value) {
    keyframeViewerRef.value.exportAnnotations()
  }
}



// 成绩补录相关方法
const getUnitByEvent = (eventName) => {
  const unitMap = { '立定跳远': '米', '50米跑': '秒', '100米跑': '秒', '800米跑': '分', '1000米跑': '分', '50米*8往返跑': '分', '仰卧起坐': '次', '引体向上': '次', '跳绳': '次', '一分钟跳绳': '次', '坐位体前屈': '厘米', 'BMI测试': '', '肺活量': '毫升' }
  return unitMap[eventName] || ''
}

const getCorrectionGrade = (score, eventName) => {
  if (!score || score === '--') return ''
  const numScore = parseFloat(score.replace(':', '.'))
  if (isNaN(numScore)) return ''
  const eventKey = Object.keys(eventNameToSportMap).find(k => eventNameToSportMap[k]) || ''
  const sportId = eventNameToSportMap[eventName] || ''
  if (sportId === 'longJump') return numScore >= 2.3 ? '优秀' : numScore >= 2.0 ? '良好' : numScore >= 1.6 ? '及格' : '不及格'
  if (sportId === 'sitUps' || sportId === 'pullUp') return numScore >= 45 ? '优秀' : numScore >= 35 ? '良好' : numScore >= 20 ? '及格' : '不及格'
  if (sportId === 'sitAndReach') return numScore >= 18 ? '优秀' : numScore >= 12 ? '良好' : numScore >= 5 ? '及格' : '不及格'
  if (sportId === 'ropeSkipping') return numScore >= 180 ? '优秀' : numScore >= 150 ? '良好' : numScore >= 100 ? '及格' : '不及格'
  if (sportId === 'fiftyMeter') return numScore <= 8.0 ? '优秀' : numScore <= 9.0 ? '良好' : numScore <= 10.5 ? '及格' : '不及格'
  if (sportId === 'fiftyMeter8') return numScore <= 1.75 ? '优秀' : numScore <= 2.0 ? '良好' : numScore <= 2.5 ? '及格' : '不及格'
  if (sportId === 'running') return numScore <= 3.0 ? '优秀' : numScore <= 3.5 ? '良好' : numScore <= 4.5 ? '及格' : '不及格'
  if (sportId === 'bmi') return numScore >= 18.5 && numScore <= 23.9 ? '正常' : numScore >= 16 && numScore < 18.5 ? '偏瘦' : numScore > 23.9 && numScore <= 27.9 ? '超重' : '异常'
  if (sportId === 'vitalCapacity') return numScore >= 3500 ? '优秀' : numScore >= 3000 ? '良好' : numScore >= 2000 ? '及格' : '不及格'
  return ''
}

const getCorrectionGradeType = (score, eventName) => {
  const grade = getCorrectionGrade(score, eventName)
  if (grade === '优秀') return 'success'
  if (grade === '良好' || grade === '正常') return ''
  if (grade === '及格' || grade === '偏瘦' || grade === '超重') return 'warning'
  if (grade === '不及格' || grade === '异常') return 'danger'
  return 'info'
}

const submitCorrection = () => {
  if (!correctionForm.value.studentId || !correctionForm.value.event || !correctionForm.value.score) {
    ElMessage.warning('请填写完整的学生、项目和成绩信息')
    return
  }
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const students = availableStudents.value
  const student = students.find(s => s.id === correctionForm.value.studentId)
  const today = new Date()
  const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`
  try {
    const records = JSON.parse(sessionStorage.getItem(`exam_results_${schoolId}`) || '[]')
    records.push({
      studentId: correctionForm.value.studentId,
      studentName: student ? student.name : '未知',
      class: student ? student.class : '未知',
      className: student ? student.class : '未知',
      event: correctionForm.value.event,
      score: correctionForm.value.score,
      grade: getCorrectionGrade(correctionForm.value.score, correctionForm.value.event),
      date: dateStr,
      category: '补录',
      remark: correctionForm.value.remark,
      status: 'completed'
    })
    sessionStorage.setItem(`exam_results_${schoolId}`, JSON.stringify(records))
    addLog('成绩补录', correctionForm.value.studentId, `补录 ${correctionForm.value.event} 成绩: ${correctionForm.value.score}`)
    ElMessage.success('成绩补录成功')
    resetCorrectionForm()
  } catch (e) {
    ElMessage.error('补录失败：' + e.message)
  }
}

const resetCorrectionForm = () => {
  correctionForm.value = { studentId: '', event: '', score: '', remark: '' }
}

const editRecord = (record) => {
  editingRecord.value = record
  editingRecordNewScore.value = ''
  editingRecordReason.value = ''
  showEditRecord.value = true
}

const deleteRecord = (record) => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  try {
    let records = JSON.parse(sessionStorage.getItem(`exam_results_${schoolId}`) || '[]')
    records = records.filter(r => !(r.studentId === record.studentId && r.event === record.event && r.date === record.date && r.score === record.score))
    sessionStorage.setItem(`exam_results_${schoolId}`, JSON.stringify(records))
    addLog('删除记录', record.studentId, `删除 ${record.studentName} 的 ${record.event} 成绩`)
    ElMessage.success('记录已删除')
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const confirmEditRecord = () => {
  if (!editingRecordNewScore.value) {
    ElMessage.warning('请输入新成绩')
    return
  }
  const schoolId = store.state.school.id || 'hailin-second-primary'
  try {
    const records = JSON.parse(sessionStorage.getItem(`exam_results_${schoolId}`) || '[]')
    const idx = records.findIndex(r => r.studentId === editingRecord.value.studentId && r.event === editingRecord.value.event && r.date === editingRecord.value.date && r.score === editingRecord.value.score)
    if (idx >= 0) {
      records[idx].score = editingRecordNewScore.value
      records[idx].grade = getCorrectionGrade(editingRecordNewScore.value, editingRecord.value.event)
      records[idx].corrected = true
      records[idx].correctionReason = editingRecordReason.value
      sessionStorage.setItem(`exam_results_${schoolId}`, JSON.stringify(records))
      addLog('修正成绩', editingRecord.value.studentId, `${editingRecord.value.event}: ${editingRecord.value.score} → ${editingRecordNewScore.value}`)
      ElMessage.success('成绩已修正')
      showEditRecord.value = false
    }
  } catch (e) {
    ElMessage.error('修正失败')
  }
}

// 导出成绩
const exportTestResults = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  try {
    const records = JSON.parse(sessionStorage.getItem(`exam_results_${schoolId}`) || '[]')
    if (records.length === 0) {
      ElMessage.warning('暂无测试记录可导出')
      return
    }
    const headers = ['学生姓名', '班级', '项目', '成绩', '等级', '日期', '类别', '状态']
    const rows = records.map(r => [r.studentName, r.class || r.className, r.event, r.score, r.grade, r.date, r.category || '', r.status || ''].join(','))
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `测试成绩_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    addLog('导出成绩', '', `导出 ${records.length} 条测试记录`)
    ElMessage.success(`已导出 ${records.length} 条记录`)
  } catch (e) {
    ElMessage.error('导出失败：' + e.message)
  }
}

// 发令倒计时逻辑（用于短跑、长跑等径赛项目）
const isRaceEvent = computed(() => ['fiftyMeter', 'fiftyMeter8', 'running'].includes(currentSport.value))

const runStartingCommand = () => {
  return new Promise((resolve) => {
    commandPhase.value = 'ready'
    setVoiceMessage('各就位')
    setTimeout(() => {
      commandPhase.value = 'set'
      setVoiceMessage('预备')
      setTimeout(() => {
        commandPhase.value = 'countdown'
        commandCountdown.value = 3
        const beep = () => {
          if (commandCountdown.value > 0) {
            commandCountdown.value--
            setTimeout(beep, 1000)
          } else {
            commandPhase.value = 'go'
            setVoiceMessage('跑！')
            setTimeout(() => {
              commandPhase.value = 'none'
              resolve()
            }, 500)
          }
        }
        beep()
      }, 1500)
    }, 1500)
  })
}

// 定时器引用
let updateTimer = null
let countdownTimer = null

const loadClassStudents = (className) => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  try {
    let students = []
    
    const stored = sessionStorage.getItem(`students_${schoolId}`)
    if (stored) {
      try {
        students = JSON.parse(stored)
      } catch {
        students = getSchoolMockData(schoolId).students || []
      }
    } else {
      students = getSchoolMockData(schoolId).students || []
    }
    
    const filteredStudents = students.filter(s => {
      const studentClassName = `${s.grade || s.itemGrade || ''}${s.class || s.itemClass || ''}`
      return studentClassName === className
    }).sort((a, b) => {
      const idA = parseInt((a.id || '').replace('stu-', '')) || 0
      const idB = parseInt((b.id || '').replace('stu-', '')) || 0
      return idA - idB
    })
    
    classStudents.value = filteredStudents
    currentStudentIndex.value = 0
    testMode.value = 'batch'
    
    if (isMultiTest.value && filteredStudents.length > 0) {
      const maxParticipants = currentConfig.value.maxParticipants || 1
      const activeCount = Math.min(maxParticipants, filteredStudents.length)
      
      multiParticipants.value = Array.from({ length: maxParticipants }, (_, i) => {
        if (i < activeCount) {
          const student = filteredStudents[i]
          return {
            name: student.name,
            class: `${student.grade || student.itemGrade || ''}${student.class || student.itemClass || ''}`,
            id: student.id,
            score: '--',
            status: 'ready'
          }
        }
        return {
          name: '待测',
          class: '',
          id: '',
          score: '--',
          status: 'empty'
        }
      })
      currentParticipants.value = activeCount
    } else if (filteredStudents.length > 0) {
      currentStudent.value = {
        name: filteredStudents[0].name,
        class: `${filteredStudents[0].grade || filteredStudents[0].itemGrade || ''}${filteredStudents[0].class || filteredStudents[0].itemClass || ''}`,
        id: filteredStudents[0].id
      }
    }
    
    ElMessage.success(`已加载 ${className} 的 ${filteredStudents.length} 名学生，按学号排序`)
  }
  catch (e) {
    console.error('加载班级学生失败:', e)
  }
}

onMounted(() => {
  checkTerminalStatus()
  document.addEventListener('visibilitychange', checkTerminalStatus)
  window.addEventListener('storage', checkTerminalStatus)
  initSportEnabledMap()
  
  const routeSport = routeSportMap[route.name]
  if (routeSport && sportConfig[routeSport]) {
    currentSport.value = routeSport
    handleSportChange(routeSport)
  }

  const queryEvent = route.query.event
  if (queryEvent) {
    const sportKey = eventNameToSportMap[queryEvent]
    if (sportKey && sportConfig[sportKey]) {
      currentSport.value = sportKey
      handleSportChange(sportKey)
      ElMessage.info(`已切换到${queryEvent}测试`)
    }
  }

  const queryClassName = route.query.className
  if (queryClassName) {
    loadClassStudents(queryClassName)
  }

  const queryStudentId = route.query.studentId
  const queryStudentName = route.query.studentName
  const queryStudentClass = route.query.studentClass
  const queryFromRecognition = route.query.fromRecognition
  
  if (queryStudentId && queryStudentName) {
    currentStudent.value = {
      name: queryStudentName,
      class: queryStudentClass || '未知班级',
      id: queryStudentId
    }
    ElMessage.success(`已选择学生：${queryStudentName}`)
    
    if (queryFromRecognition === 'true') {
      ElMessage.info('请选择测试项目，已识别学生将自动添加到测试队列')
    }
  }
  
  if (classStudents.value.length === 0) {
    testMode.value = 'single'
    currentParticipants.value = 1
    multiParticipants.value = []
  }

  updateTime()
  updateTimer = setInterval(updateTime, 1000)
  loadDefaultBestScore(currentSport.value)
  loadKeyframeExamples(currentSport.value)
})

const saveTestRecord = () => {
  addLog('保存测试', '', `保存测试终端记录`)
  if (currentScore.value === '--') return
  
  const today = new Date()
  const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`
  
  const schoolId = store.state.school.id || 'hailin-second-primary'
  try {
    const storedRecords = JSON.parse(sessionStorage.getItem(`exam_results_${schoolId}`) || '[]')
    
    const newRecord = {
      studentId: currentStudent.value.id,
      studentName: currentStudent.value.name,
      class: currentStudent.value.class,
      className: currentStudent.value.class,
      event: currentConfig.value.name,
      score: currentScore.value,
      grade: scoreGradeText.value,
      date: dateStr,
      category: route.query.category || '体育考试',
      status: 'completed'
    }
    
    storedRecords.unshift(newRecord)
    sessionStorage.setItem(`exam_results_${schoolId}`, JSON.stringify(storedRecords))
    
    ElMessage.success('考试记录已保存')
  } catch (e) {
    console.error('保存考试记录失败:', e)
  }
}

onActivated(() => {
  checkTerminalStatus()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', checkTerminalStatus)
  window.removeEventListener('storage', checkTerminalStatus)
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<style scoped>
.test-terminal {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1A1A2E;
  color: #FFFFFF;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.left-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sport-selector {
  width: 180px;
}

.sport-selector :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

.sport-selector :deep(.el-input__inner):focus {
  border-color: #1E5AA8;
}

.sport-selector :deep(.el-select-dropdown) {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sport-selector :deep(.el-option) {
  color: #FFFFFF;
}

.sport-selector :deep(.el-option:hover) {
  background: rgba(45, 125, 70, 0.2);
}

.distance-selector {
  width: 120px;
}

.distance-selector :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

.distance-selector :deep(.el-input__inner):focus {
  border-color: #F97316;
}

.distance-selector :deep(.el-select-dropdown) {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.distance-selector :deep(.el-option) {
  color: #FFFFFF;
}

.distance-selector :deep(.el-option:hover) {
  background: rgba(249, 115, 22, 0.2);
}

.system-status {
  padding: 6px 20px;
  border-radius: 12px;
  font-size: 12px;
}

.system-status.idle {
  background: rgba(45, 125, 70, 0.2);
  color: #22C55E;
}

.system-status.scanning {
  background: rgba(59, 130, 246, 0.2);
  color: #3B82F6;
}

.system-status.testing {
  background: rgba(245, 166, 35, 0.2);
  color: #F5A623;
}

.system-status.completed {
  background: rgba(45, 125, 70, 0.2);
  color: #22C55E;
}

.system-status.offline {
  background: rgba(232, 93, 78, 0.2);
  color: #E85D4E;
}

.center-section {
  font-size: 14px;
  color: #9CA3AF;
}

.right-section {
  display: flex;
  gap: 8px;
}

.main-content {
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

.video-section {
  flex: 7;
  display: flex;
  flex-direction: column;
  position: relative;
}

.video-section:fullscreen {
  width: 100vw;
  height: 100vh;
  background: #000;
}

.video-section:fullscreen .video-container {
  border-radius: 0;
  height: 100%;
}

.video-section:fullscreen .video-actions {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px 24px;
  border-radius: 8px;
}

.video-section:fullscreen .takeoff-line {
  display: none;
}

.video-container {
  flex: 1;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.video-container.violation-blink {
  animation: violation-blink-animation 1s ease-in-out infinite;
}

@keyframes violation-blink-animation {
  0%, 100% {
    border-color: transparent;
    box-shadow: none;
  }
  50% {
    border-color: #E85D4E;
    box-shadow: 0 0 20px rgba(232, 93, 78, 0.6);
  }
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.camera-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.skeleton-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
}

.skeleton-line {
  position: absolute;
  height: 2px;
  background: rgba(45, 125, 70, 0.3);
}

.pose-indicator {
  position: absolute;
  width: 100%;
  height: 100%;
}

.joint {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #1E5AA8;
  border-radius: 50%;
  box-shadow: 0 0 10px #1E5AA8;
}

.joint::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #FFFFFF;
  border-radius: 50%;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, #1E5AA8, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.video-info {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9CA3AF;
}

.violation-alert {
  position: absolute;
  bottom: 48px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(232, 93, 78, 0.9);
  border-radius: 8px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.alert-icon {
  font-size: 20px;
}

.video-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.video-actions el-button {
  flex: 1;
  height: 44px;
  font-size: 14px;
}

.takeoff-line {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-top: 12px;
}

.line-label {
  font-size: 14px;
  color: #F5A623;
}

.line-indicator {
  flex: 1;
  height: 4px;
  background: linear-gradient(90deg, #E85D4E, #F5A623);
  border-radius: 2px;
}

.score-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 8px;
}

.score-section::-webkit-scrollbar {
  width: 6px;
}

.score-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.score-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.student-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.student-avatar {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(45, 125, 70, 0.2);
  border-radius: 50%;
  font-size: 28px;
}

.student-detail h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.student-detail p {
  margin: 0;
  font-size: 13px;
  color: #9CA3AF;
}

.student-status {
  margin-left: auto;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.student-status.idle { background: rgba(156, 163, 175, 0.2); color: #9CA3AF; }
.student-status.scanning { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }
.student-status.testing { background: rgba(245, 166, 35, 0.2); color: #F5A623; }
.student-status.completed { background: rgba(45, 125, 70, 0.2); color: #22C55E; }

.multi-scoreboard {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.multi-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #9CA3AF;
}

.countdown-badge {
  margin-left: auto;
  padding: 2px 10px;
  background: #E85D4E;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.multi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.multi-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s;
}

.multi-slot.active {
  border-color: #F5A623;
  background: rgba(245, 166, 35, 0.1);
}

.multi-slot.done {
  border-color: #22C55E;
  background: rgba(34, 197, 94, 0.1);
}

.slot-num {
  font-size: 11px;
  color: #6B7280;
}

.slot-name {
  font-size: 12px;
  color: #E5E7EB;
  margin: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.slot-score {
  font-size: 16px;
  font-weight: 700;
}

.participants-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.participants-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #9CA3AF;
}

.participants-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
}

.participants-current {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.current-num {
  font-size: 36px;
  font-weight: 700;
  color: #1E5AA8;
}

.current-label {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

.participants-divider {
  font-size: 24px;
  color: #4B5563;
}

.participants-max {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.max-num {
  font-size: 24px;
  font-weight: 600;
  color: #E5E7EB;
}

.max-label {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.participants-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.participants-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background 0.3s ease;
}

.batch-progress-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 16px;
}

.batch-progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #9CA3AF;
}

.batch-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 16px;
  font-weight: 600;
  color: #10B981;
}

.progress-percent {
  font-size: 14px;
  color: #9CA3AF;
}

.batch-progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.batch-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #34D399);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.batch-student-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.batch-student-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  color: #9CA3AF;
}

.batch-student-item.done {
  color: #10B981;
  background: rgba(16, 185, 129, 0.1);
}

.batch-student-item.active {
  color: #F5A623;
  background: rgba(245, 166, 35, 0.1);
  font-weight: 500;
}

.batch-student-item.pending {
  color: #6B7280;
}

.batch-student-more {
  font-size: 11px;
  color: #6B7280;
  text-align: center;
  padding-top: 4px;
}

.score-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.score-label {
  font-size: 14px;
  color: #9CA3AF;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.score-value {
  font-size: 48px;
  font-weight: 700;
}

.score-unit {
  font-size: 20px;
  color: #9CA3AF;
}

.score-grade {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.score-grade.excellent { background: rgba(45, 125, 70, 0.2); color: #22C55E; }
.score-grade.good { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }
.score-grade.pass { background: rgba(245, 166, 35, 0.2); color: #F5A623; }
.score-grade.fail { background: rgba(232, 93, 78, 0.2); color: #E85D4E; }

.history-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.history-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #F5A623;
}

.history-score {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.history-value {
  font-size: 28px;
  font-weight: 600;
}

.history-unit {
  font-size: 14px;
  color: #9CA3AF;
}

.history-date {
  font-size: 12px;
  color: #6B7280;
}

.metrics-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.metrics-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #9CA3AF;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.metric-label {
  font-size: 12px;
  color: #6B7280;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
}

.metric-value.good {
  color: #22C55E;
}

.muscle-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.muscle-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #9CA3AF;
}

.muscle-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.muscle-bar-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.muscle-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.muscle-bar-name {
  font-size: 12px;
  color: #9CA3AF;
}

.muscle-bar-value {
  font-size: 12px;
  font-weight: 600;
}

.muscle-bar-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.muscle-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.bottom-bar {
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.voice-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.voice-icon {
  font-size: 20px;
}

.voice-text {
  font-size: 16px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.playback-modal,
.analysis-modal {
  padding: 16px;
  background: #1e293b;
  border-radius: 8px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.keyframe-dialog :deep(.el-dialog__body) {
  padding: 0;
  overflow: hidden;
  background: #1e293b;
}

.keyframe-dialog :deep(.el-dialog__header) {
  padding: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: #0f172a;
  margin: 0;
}

.dialog-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
}

.dialog-title {
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
}

.dialog-actions {
  display: flex;
  gap: 8px;
}

.keyframe-dialog :deep(.el-dialog__headerbtn) {
  display: none;
}

.keyframe-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 学生信息卡片 - 添加点击效果 */
.student-info-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.student-info-card:hover {
  background: rgba(30, 90, 168, 0.15);
  border-color: rgba(30, 90, 168, 0.3);
}

.student-info-card .edit-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.student-info-card:hover .edit-icon {
  opacity: 1;
}

/* 多人测试位 - 添加点击效果 */
.multi-slot {
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.multi-slot:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.multi-slot.empty {
  opacity: 0.5;
  cursor: not-allowed;
}

.multi-slot.empty:hover {
  transform: none;
  box-shadow: none;
}

.slot-edit {
  position: absolute;
  right: 8px;
  top: 8px;
  color: #9CA3AF;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.multi-slot:hover .slot-edit {
  opacity: 1;
}

/* 学生选择器弹窗样式 */
.student-selector {
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-box {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
}

.student-list {
  flex: 1;
  overflow-y: auto;
  max-height: 320px;
}

.selector-pagination {
  padding: 8px 0;
  border-top: 1px solid #E8EAED;
}

.student-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 12px;
}

.student-item:hover {
  background: rgba(30, 90, 168, 0.1);
}

.student-item.selected {
  background: rgba(30, 90, 168, 0.2);
  border: 1px solid rgba(30, 90, 168, 0.3);
}

.item-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(30, 90, 168, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1E5AA8;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.item-class {
  font-size: 12px;
  color: #6B7280;
}

.item-id {
  font-size: 12px;
  color: #9CA3AF;
  font-family: monospace;
}

.check-icon {
  color: #1E5AA8;
  font-size: 18px;
}

/* 学生选择器弹窗覆盖Element样式 */
.student-selector :deep(.el-dialog__header) {
  background: #FFFFFF;
  border-bottom: 1px solid #E8EAED;
}

.student-selector :deep(.el-dialog__body) {
  padding: 16px;
  background: #FFFFFF;
}

.student-selector :deep(.el-dialog__title) {
  color: #1A1A2E;
  font-weight: 600;
}

.student-selector :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #E8EAED;
}

.student-selector :deep(.el-input__wrapper:focus) {
  border-color: #1E5AA8;
}

/* 设置弹窗样式 */
.settings-dialog :deep(.el-dialog) {
  max-height: 80vh;
  overflow: hidden;
  border-radius: 12px;
}

.settings-dialog :deep(.el-dialog__header) {
  background: #FFFFFF;
  border-bottom: 1px solid #E8EAED;
  padding: 16px 20px;
}

.settings-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.settings-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: #FFFFFF;
  max-height: calc(80vh - 100px);
  overflow: hidden;
}

.settings-dialog :deep(.el-dialog__footer) {
  display: none;
}

.violation-panel-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.violation-panel-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.violation-panel {
  padding: 20px;
}

.violation-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E8EAED;
}

.violation-stats .stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.violation-stats .stat-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1A1A2E;
  margin-bottom: 4px;
}

.violation-stats .stat-label {
  font-size: 12px;
  color: #6B7280;
}

.violation-list {
  max-height: 400px;
  overflow-y: auto;
}

.violation-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #FFFFFF;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #E8EAED;
  transition: all 0.2s;
}

.violation-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.violation-item.high-severity {
  border-left: 3px solid #E85D4E;
}

.violation-item.medium-severity {
  border-left: 3px solid #F5A623;
}

.violation-item.low-severity {
  border-left: 3px solid #3B82F6;
}

.violation-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.violation-info {
  flex: 1;
  min-width: 0;
}

.violation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.violation-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.violation-severity {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.violation-severity.high {
  background: #FEE2E2;
  color: #991B1B;
}

.violation-severity.medium {
  background: #FEF3C7;
  color: #92400E;
}

.violation-severity.low {
  background: #DBEAFE;
  color: #1E40AF;
}

.violation-status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.violation-status.pending {
  background: #FEF3C7;
  color: #92400E;
}

.violation-status.confirmed {
  background: #FEE2E2;
  color: #991B1B;
}

.violation-status.appeal {
  background: #DBEAFE;
  color: #1E40AF;
}

.violation-status.dismissed {
  background: #DCFCE7;
  color: #166534;
}

.violation-detail {
  margin-bottom: 8px;
}

.violation-desc {
  font-size: 13px;
  color: #6B7280;
}

.violation-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.violation-meta span {
  font-size: 12px;
  color: #9CA3AF;
}

.violation-impact {
  font-size: 12px;
  color: #E85D4E;
  font-weight: 500;
}

.violation-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.no-violations {
  text-align: center;
  padding: 40px;
  color: #9CA3AF;
}

.no-violations el-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #1E5AA8;
}

/* 发令倒计时覆盖层 */
.command-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.command-content {
  text-align: center;
  color: #FFFFFF;
}

.command-content.ready .command-text {
  font-size: 48px;
  font-weight: 700;
  color: #F5A623;
  text-shadow: 0 0 20px rgba(245, 166, 35, 0.5);
}

.command-content.set .command-text {
  font-size: 48px;
  font-weight: 700;
  color: #E85D4E;
  text-shadow: 0 0 20px rgba(232, 93, 78, 0.5);
}

.command-content.countdown .command-text {
  font-size: 36px;
  font-weight: 700;
  color: #3B82F6;
}

.command-content.go .command-text {
  font-size: 72px;
  font-weight: 900;
  color: #4ADE80;
  text-shadow: 0 0 30px rgba(74, 222, 128, 0.6);
  animation: goFlash 0.5s ease-out;
}

.command-countdown {
  font-size: 120px;
  font-weight: 900;
  color: #FFFFFF;
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.5);
  margin-top: 20px;
}

.command-ring {
  width: 200px;
  height: 200px;
  border: 4px solid #3B82F6;
  border-radius: 50%;
  margin: 20px auto;
  opacity: 0.5;
}

.command-ring.pulse {
  animation: ringPulse 1s ease-out infinite;
}

@keyframes ringPulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.2); opacity: 0; }
}

@keyframes goFlash {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* 项目管理弹窗 */
.project-manager-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.project-manager {
  padding: 20px;
}

.manager-desc {
  color: #6B7280;
  font-size: 13px;
  margin-bottom: 20px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #F7F8FA;
  border-radius: 8px;
  border: 1px solid #E8EAED;
  transition: all 0.2s;
}

.project-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.project-item.disabled {
  opacity: 0.5;
  background: #FAFAFA;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-name {
  font-size: 15px;
  font-weight: 500;
  color: #1A1A2E;
}

.project-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #FEE2E2;
  color: #DC2626;
}

.project-status.enabled {
  background: #DCFCE7;
  color: #166534;
}

/* 成绩补录弹窗 */
.score-correction-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.score-correction {
  padding: 10px 20px 20px;
}

.correction-section {
  margin-bottom: 24px;
}

.correction-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E8EAED;
}

.correction-form {
  max-width: 600px;
}

.score-unit-hint {
  margin-left: 8px;
  color: #9CA3AF;
  font-size: 13px;
}

.correction-records {
  max-height: 300px;
  overflow-y: auto;
}

.correction-record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #FFFFFF;
  border: 1px solid #E8EAED;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.correction-record:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.record-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.record-student {
  font-weight: 500;
  color: #1A1A2E;
}

.record-event {
  color: #6B7280;
  font-size: 13px;
}

.record-score {
  font-weight: 600;
  color: #1E5AA8;
}

.record-date {
  color: #9CA3AF;
  font-size: 12px;
}

.record-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.no-records {
  text-align: center;
  padding: 30px;
  color: #9CA3AF;
}

.old-score {
  font-weight: 600;
  color: #E85D4E;
  font-size: 16px;
}
</style>