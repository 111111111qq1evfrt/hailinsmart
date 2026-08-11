 <template>
  <div class="national-test">
    <LoadingOverlay :visible="loading" text="正在同步数据..." subText="请稍候" />
    <div class="mode-switch-container">
      <div class="mode-switch-wrapper">
        <span class="mode-label">体测模式</span>
        <el-switch v-model="nationalTestMode" @change="toggleNationalTestMode"  />
      </div>
    </div>

    <div v-if="nationalTestMode" class="mode-banner">
      <el-alert title="国家体测模式已开启 — 移动端任务成绩将自动归属于国家体测成绩" type="warning" :closable="false" show-icon />
    </div>

    <div class="page-header">
      <div class="header-filters">
        <el-select v-model="filterGrade" placeholder="选择年级" clearable style="width: 120px" @change="handleGradeChange">
          <el-option label="全部年级" value="all" />
          <el-option label="一年级" value="一年级" />
          <el-option label="二年级" value="二年级" />
          <el-option label="三年级" value="三年级" />
          <el-option label="四年级" value="四年级" />
          <el-option label="五年级" value="五年级" />
          <el-option label="六年级" value="六年级" />
        </el-select>
        <el-select v-model="filterClass" placeholder="选择班级" clearable style="width: 120px">
          <el-option v-for="cls in classOptions" :key="cls" :label="cls" :value="cls" />
        </el-select>
        <el-select v-model="filterYear" placeholder="选择学年" clearable style="width: 120px">
          <el-option v-for="opt in academicYearOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
          clearable
        />
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="downloadTemplate">下载标准模板</el-button>
        <el-button :icon="Setting" @click="showSettings = true">体测设置</el-button>
        <el-button type="primary" :icon="Upload" @click="importResults">导入成绩</el-button>
        <el-dropdown>
          <el-button type="primary" :icon="Document">
            导出数据
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click.native="exportCurrentPage">当前页数据</el-dropdown-item>
              <el-dropdown-item @click.native="exportAll">全部数据</el-dropdown-item>
              <el-dropdown-item @click.native="exportSelected" :disabled="selectedRows.length === 0">选中数据</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 体测概览 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ testStats.total }}</span>
        <span class="stat-label">体测总人数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ testStats.excellentRate }}%</span>
        <span class="stat-label">优秀率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ testStats.goodRate }}%</span>
        <span class="stat-label">良好率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ testStats.passRate }}%</span>
        <span class="stat-label">及格率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #E85D4E">{{ testStats.failRate }}%</span>
        <span class="stat-label">不及格率</span>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">各年级体测达标情况</span>
        </div>
        <div ref="gradeChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">项目合格率对比</span>
        </div>
        <div ref="projectChart" class="chart"></div>
      </div>
    </div>

    <!-- 体测任务概览 -->
    <div class="task-overview-card">
      <div class="card-header">
        <span class="card-title">体测任务管理</span>
        <div class="task-header-actions">
          <el-button type="primary" size="small" @click="showAddTaskDialog = true">
            <Plus /> 添加任务
          </el-button>
          <el-button size="small" @click="showSettings = true">
            任务管理设置
          </el-button>
        </div>
      </div>
      <!-- 任务统计摘要 -->
      <div class="task-stats-row">
        <div class="task-stat-item">
          <span class="task-stat-num">{{ taskOverviewStats.total }}</span>
          <span class="task-stat-label">本学年任务总数</span>
        </div>
        <div class="task-stat-divider"></div>
        <div class="task-stat-item">
          <span class="task-stat-num text-primary">{{ taskOverviewStats.active }}</span>
          <span class="task-stat-label">进行中</span>
        </div>
        <div class="task-stat-divider"></div>
        <div class="task-stat-item">
          <span class="task-stat-num" style="color: #F5A623">{{ taskOverviewStats.pending }}</span>
          <span class="task-stat-label">未开始</span>
        </div>
        <div class="task-stat-divider"></div>
        <div class="task-stat-item">
          <span class="task-stat-num" style="color: #9CA3AF">{{ taskOverviewStats.completed }}</span>
          <span class="task-stat-label">已结束</span>
        </div>
      </div>
      <!-- 任务时间线 -->
      <div class="task-timeline-bar">
        <div class="timeline-label">学年任务时间线</div>
        <div class="timeline-track">
          <span class="track-segment autumn">秋季学期</span>
          <span class="track-segment winter">寒假</span>
          <span class="track-segment spring">春季学期</span>
          <div v-for="(task, idx) in taskList" :key="idx" class="timeline-dot-wrapper" :style="getTimelinePos(task)">
            <div :class="['timeline-dot', getTaskDotClass(task.status)]" :title="task.name"></div>
          </div>
        </div>
      </div>
      <!-- 当前任务列表 -->
      <div class="current-tasks">
        <div v-for="(task, idx) in taskList.filter(t => t.status !== '已结束').slice(0, 4)" :key="idx" class="current-task-item">
          <div class="task-dot-indicator" :class="getTaskDotClass(task.status)"></div>
          <div class="task-item-info">
            <div class="task-item-name">{{ task.name }}</div>
            <div class="task-item-meta">{{ task.dateRange }} | {{ task.grade }}</div>
          </div>
          <span :class="['task-status-tag', getTaskDotClass(task.status)]">{{ task.status }}</span>
        </div>
      </div>
    </div>

    <ExamTable
      ref="examTableRef"
      :data="filteredResults"
      :columns="testColumns"
      title="体测成绩明细"
      search-placeholder="搜索姓名/学号"
      :search-fields="['studentName', 'studentId']"
      :show-selection="true"
      @refresh="refreshData"
      @cell-edit="handleCellEdit"
      @selection-change="handleSelectionChange"
    >
      <template #classWithProgress="{ row }">
        <div class="class-cell">
          <span class="class-name">{{ row.grade }}{{ row.class }}</span>
          <div class="class-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :class="{ 'progress-warning': isClassWarning(row.grade + row.class) }"
                :style="{ width: getClassProgressPercent(row) + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ getClassCompleted(row) }}/{{ getClassTotalStudents(row.grade, row.class) }}</span>
          </div>
        </div>
      </template>

      <template #rank="{ row }">
        <span class="rank-value">{{ getRank(row) }}</span>
      </template>

      <template #bmi="{ row, editing, value }">
        <span :class="getBmiClass(row.bmi)">
          <template v-if="editing">
            <el-input
              v-model.number="examTableRef.editingValue"
              size="small"
              @blur="saveBmi(row)"
              @keyup.enter="saveBmi(row)"
              @keyup.esc="examTableRef.cancelEdit()"
              type="number"
              step="0.1"
            />
          </template>
          <template v-else>{{ row.bmi }}</template>
        </span>
      </template>

      <template #vision="{ row }">
        <div @dblclick="handleVisionDoubleClick(row)">
          <template v-if="editingVision.row === row">
            <div class="vision-inputs">
              <el-input v-model.number="editingVision.left" size="small" placeholder="左" type="number" style="width: 80px" />
              <span>/</span>
              <el-input v-model.number="editingVision.right" size="small" placeholder="右" type="number" style="width: 80px" />
            </div>
            <el-button size="small" type="primary" @click="saveVision(row)">保存</el-button>
            <el-button size="small" text @click="cancelVisionEdit">取消</el-button>
          </template>
          <template v-else>{{ row.visionLeft }}/{{ row.visionRight }}</template>
        </div>
      </template>

      <template #overallGrade="{ row }">
        <span class="grade-tag" :class="getGradeClass(row)">{{ getOverallGrade(row) }}</span>
      </template>

      <template #actions="{ row }">
        <el-button text type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
        <el-button text type="primary" size="small" @click="viewReplay(row)">查看回放</el-button>
        <el-button text type="danger" size="small" @click="openArbitration(row)">成绩仲裁</el-button>
      </template>
    </ExamTable>

    <!-- 标准模板下载 -->
    <TemplateDownload 
      v-model:visible="showTemplateDownload" 
      template-type="test"
      :custom-templates="customTemplates"
    />

    <!-- 体测设置 -->
    <ElDialog 
      v-model="showSettings"
      title="体测设置" 
      width="800px"
    >
      <TestSettings />
      <template #footer>
        <el-button @click="showSettings = false">关闭</el-button>
      </template>
    </ElDialog>

    <!-- 查看详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="体测详情"
      width="700px"
    >
      <div v-if="selectedStudent" class="detail-content">
        <div class="detail-header">
          <div class="student-info">
            <h3>{{ selectedStudent.studentName }}</h3>
            <p>{{ selectedStudent.grade }} {{ selectedStudent.class }} | 学号: {{ selectedStudent.studentId }}</p>
          </div>
          <div class="overall-grade">
            <span class="grade-tag" :class="getGradeClass(selectedStudent)">{{ getOverallGrade(selectedStudent) }}</span>
            <div class="total-score">总分: {{ selectedStudent.totalScore }}</div>
          </div>
        </div>
        <!-- 身体形态 -->
        <div class="detail-section-title">身体形态</div>
        <div class="detail-items">
          <div class="detail-item">
            <span class="item-label">身高</span>
            <span class="item-value">{{ selectedStudent.height }} cm</span>
          </div>
          <div class="detail-item">
            <span class="item-label">体重</span>
            <span class="item-value">{{ selectedStudent.weight }} kg</span>
          </div>
          <div class="detail-item">
            <span class="item-label">BMI</span>
            <span :class="getBmiClass(selectedStudent.bmi)">{{ selectedStudent.bmi }}</span>
          </div>
          <div class="detail-item">
            <span class="item-label">肺活量</span>
            <span class="item-value">{{ selectedStudent.vitalCapacity }} mL</span>
          </div>
        </div>
        <!-- 视力 -->
        <div class="detail-section-title">视力</div>
        <div class="detail-items">
          <div class="detail-item">
            <span class="item-label">左眼</span>
            <span class="item-value">{{ selectedStudent.visionLeft }}</span>
          </div>
          <div class="detail-item">
            <span class="item-label">右眼</span>
            <span class="item-value">{{ selectedStudent.visionRight }}</span>
          </div>
        </div>
        <!-- 运动项目 -->
        <div class="detail-section-title">运动项目</div>
        <div class="detail-items">
          <div class="detail-item">
            <span class="item-label">50米跑</span>
            <span class="item-value">{{ selectedStudent.fiftyMeter }} 秒</span>
          </div>
          <div class="detail-item">
            <span class="item-label">坐位体前屈</span>
            <span class="item-value">{{ selectedStudent.sitAndReach }} cm</span>
          </div>
          <div class="detail-item">
            <span class="item-label">仰卧起坐</span>
            <span class="item-value">{{ selectedStudent.sitUps }} 个</span>
          </div>
          <div class="detail-item">
            <span class="item-label">立定跳远</span>
            <span class="item-value">{{ selectedStudent.longJump }} m</span>
          </div>
          <div class="detail-item">
            <span class="item-label">引体向上</span>
            <span class="item-value">{{ selectedStudent.pullUp }} 个</span>
          </div>
          <div class="detail-item">
            <span class="item-label">耐力跑(800/1000m)</span>
            <span class="item-value">{{ selectedStudent.enduranceRun }} 分</span>
          </div>
        </div>
        <div class="detail-test-info">
          <span>测试日期: {{ selectedStudent.testDate }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- 查看回放弹窗 -->
    <el-dialog
      v-model="replayVisible"
      title="测试回放"
      width="900px"
      destroy-on-close
    >
      <div v-if="selectedStudent" class="replay-content">
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
          <p><strong>测试时间:</strong> {{ selectedStudent.testDate || '2025-05-20' }}</p>
          <p><strong>测试地点:</strong> 田径场A区</p>
          <p><strong>监考老师:</strong> 卜琳娜</p>
          <p><strong>设备编号:</strong> T-2025-001</p>
        </div>
      </div>
    </el-dialog>

    <!-- 成绩仲裁弹窗 -->
    <el-dialog
      v-model="arbitrationVisible"
      title="成绩仲裁"
      width="800px"
    >
      <div v-if="selectedStudent" class="arbitration-content">
        <!-- 标签页 -->
        <el-tabs v-model="arbitrationTab" type="card">
          <!-- 申请仲裁 -->
          <el-tab-pane label="申请仲裁" name="apply">
            <div class="arbitration-student">
              <h4>{{ selectedStudent.studentName }} ({{ selectedStudent.studentId }})</h4>
              <p>当前成绩: <span class="grade-tag" :class="getGradeClass(selectedStudent)">{{ getOverallGrade(selectedStudent) }}</span></p>
            </div>
            <el-form :model="arbitrationForm" label-width="100px">
              <el-form-item label="仲裁项目">
                <el-checkbox-group v-model="arbitrationForm.projects">
                  <el-checkbox label="50米跑" />
                  <el-checkbox label="立定跳远" />
                  <el-checkbox label="仰卧起坐" />
                  <el-checkbox label="坐位体前屈" />
                  <el-checkbox label="引体向上" />
                  <el-checkbox label="BMI" />
                  <el-checkbox label="视力" />
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="仲裁原因">
                <el-select v-model="arbitrationForm.reasonType" placeholder="请选择仲裁原因类型">
                  <el-option label="成绩录入错误" value="input_error" />
                  <el-option label="设备故障" value="device_error" />
                  <el-option label="对评分标准有异议" value="standard_dispute" />
                  <el-option label="其他原因" value="other" />
                </el-select>
              </el-form-item>
              <el-form-item label="详细说明">
                <el-input 
                  v-model="arbitrationForm.reason" 
                  type="textarea" 
                  :rows="4" 
                  placeholder="请详细描述仲裁原因..."
                />
              </el-form-item>
              <el-form-item label="证据材料">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :limit="3"
                  list-type="picture-card"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          
          <!-- 成绩溯源 -->
          <el-tab-pane label="成绩溯源" name="trace">
            <div class="trace-content">
              <!-- 基本信息 -->
              <div class="trace-section">
                <div class="section-header">
                  <VideoCamera class="section-icon" />
                  <h4 class="section-title">测试基本信息</h4>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">测试时间</span>
                    <span class="info-value">{{ selectedStudent.testTime || '2025-05-20 14:30:25' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">测试地点</span>
                    <span class="info-value">{{ selectedStudent.testLocation || '田径场A区' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">监考老师</span>
                    <span class="info-value">{{ selectedStudent.proctor || '卜琳娜' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">设备编号</span>
                    <span class="info-value">{{ selectedStudent.deviceId || 'T-2025-001' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">测试时长</span>
                    <span class="info-value">{{ selectedStudent.duration || '180' }} 秒</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">测试模式</span>
                    <span class="info-value">AI智能判定</span>
                  </div>
                </div>
              </div>

              <!-- AI判定依据 -->
              <div class="trace-section">
                <div class="section-header">
                  <CircleCheck class="section-icon" />
                  <h4 class="section-title">AI判定依据</h4>
                </div>
                <div class="ai-judgment">
                  <div v-for="(item, index) in aiJudgments" :key="index" class="judgment-card" :class="{ 'has-warning': item.hasWarning }">
                    <div class="judgment-header">
                      <span class="judgment-project">{{ item.project }}</span>
                      <span class="judgment-result" :class="item.resultClass">{{ item.result }}</span>
                    </div>
                    <div class="judgment-details">
                      <div class="detail-row">
                        <span class="detail-label">原始数据:</span>
                        <span class="detail-value">{{ item.rawData }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">判定算法:</span>
                        <span class="detail-value">{{ item.algorithm }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">置信度:</span>
                        <span class="detail-value"><span class="confidence-bar"><span :style="{ width: item.confidence + '%' }"></span></span> {{ item.confidence }}%</span>
                      </div>
                      <div v-if="item.hasWarning" class="warning-tip">
                        <WarnTriangleFilled />
                        <span>{{ item.warningMsg }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 操作日志 -->
              <div class="trace-section">
                <div class="section-header">
                  <Clock class="section-icon" />
                  <h4 class="section-title">操作日志</h4>
                </div>
                <div class="timeline">
                  <div v-for="(log, index) in traceLogs" :key="index" class="timeline-item">
                    <div class="timeline-dot" :class="{ 'is-system': log.operator === '系统' }"></div>
                    <div class="timeline-content">
                      <div class="timeline-time">{{ log.time }}</div>
                      <div class="timeline-action">{{ log.action }}</div>
                      <div class="timeline-operator">操作人: {{ log.operator }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 视频回放 -->
              <div class="trace-section">
                <div class="section-header">
                  <VideoPlay class="section-icon" />
                  <h4 class="section-title">测试视频</h4>
                </div>
                <div class="video-section">
                  <div class="video-player-container">
                    <div class="video-cover">
                      <div class="play-btn" @click="playTestVideo">
                        <VideoPlay />
                      </div>
                      <div class="video-info">
                        <span>测试视频</span>
                        <span>时长: 03:00</span>
                      </div>
                    </div>
                  </div>
                  <div class="video-tags">
                    <span class="video-tag">50米跑</span>
                    <span class="video-tag">立定跳远</span>
                    <span class="video-tag">仰卧起坐</span>
                    <span class="video-tag">坐位体前屈</span>
                  </div>
                </div>
              </div>

              <!-- 原始数据文件 -->
              <div class="trace-section">
                <div class="section-header">
                  <Document class="section-icon" />
                  <h4 class="section-title">原始数据文件</h4>
                </div>
                <div class="file-list">
                  <div class="file-item">
                    <Document />
                    <span>测试原始数据.json</span>
                    <ArrowRight />
                  </div>
                  <div class="file-item">
                    <Document />
                    <span>AI判定报告.pdf</span>
                    <ArrowRight />
                  </div>
                  <div class="file-item">
                    <Document />
                    <span>设备日志.txt</span>
                    <ArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <!-- 仲裁历史 -->
          <el-tab-pane label="仲裁历史" name="history">
            <div v-if="arbitrationHistory.length === 0" class="empty-history">
              <Clock />
              <p>暂无仲裁记录</p>
            </div>
            <div v-else class="history-list">
              <div v-for="(record, index) in arbitrationHistory" :key="index" class="history-item">
                <div class="history-header">
                  <span class="history-date">{{ record.date }}</span>
                  <span class="history-status" :class="record.status">{{ record.status }}</span>
                </div>
                <p class="history-reason">{{ record.reason }}</p>
                <div class="history-result">
                  <span class="result-label">处理结果:</span>
                  <span class="result-value">{{ record.result }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="arbitrationVisible = false">取消</el-button>
        <el-button v-if="arbitrationTab === 'apply'" type="primary" @click="submitArbitration">提交仲裁</el-button>
        <el-button v-if="arbitrationTab === 'trace'" type="primary" @click="viewReplay(selectedStudent)">查看回放</el-button>
      </template>
    </el-dialog>
    <!-- 导入成绩弹窗 -->
    <el-dialog
      v-model="importVisible"
      title="导入体测成绩"
      width="520px"
    >
      <el-form label-width="100px">
        <el-form-item label="选择文件">
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls,.csv"
            @change="handleImportFileChange"
          >
            <el-button type="primary">选择 Excel 文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 .xlsx / .xls / .csv 格式，请先下载标准模板填写</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="目标学年">
          <el-select v-model="importYear" placeholder="选择学年" class="w-full">
            <el-option v-for="opt in academicYearOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>
    <!-- 添加体测任务弹窗 -->
    <el-dialog v-model="showAddTaskDialog" title="添加体测任务" width="560px">
      <el-form :model="newTaskForm" label-width="100px">
        <el-form-item label="任务名称" required>
          <el-input v-model="newTaskForm.name" placeholder="如：2026年春季体测" />
        </el-form-item>
        <el-form-item label="学年">
          <el-select v-model="newTaskForm.academicYear" class="w-full">
            <el-option v-for="opt in academicYearOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="学期">
          <el-select v-model="newTaskForm.semester" class="w-full">
            <el-option label="秋季学期" value="autumn" />
            <el-option label="春季学期" value="spring" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用年级">
          <el-select v-model="newTaskForm.grade" multiple class="w-full">
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
            <el-option label="六年级" value="六年级" />
          </el-select>
        </el-form-item>
        <el-form-item label="测试日期">
          <el-date-picker v-model="newTaskForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="addNewTask">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Upload, Setting, VideoPlay, VideoCamera, Plus, Clock, Document, ArrowRight, WarnTriangleFilled, ArrowDown, CircleCheck } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import store from '../../store/global'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { getSchoolMockData } from '../../utils/mockDataLoader'
import { isInterestClass, getMatchingStudentIds } from '@/utils/interestClassFilter'
import TemplateDownload from '@/components/export/TemplateDownload.vue'
import ExamTable from '../../components/table/ExamTable.vue'
import TestSettings from '@/components/config/TestSettings.vue'
import VideoPlayer from '@/components/media/VideoPlayer.vue'
import { useOperationLog } from '@/composables/useOperationLog'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { MOCK_CUSTOM_TEMPLATES } from '@/data/mockData'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'
import { getTokenData, getClassList, getStudentListV4 } from '@/utils/daiweiApi'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'

const { addLog } = useOperationLog('test')

// 加载状态
const loading = ref(true)

const filterGrade = ref('')
const filterClass = ref('')
const filterYear = ref('')
const dateRange = ref([])
const gradeChart = ref(null)
const projectChart = ref(null)
const examTableRef = ref(null)
let gradeChartInstance = null
let projectChartInstance = null

// 国家体测模式切换
const nationalTestMode = ref(false)
const initNationalTestMode = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const stored = sessionStorage.getItem(`national_test_mode_${schoolId}`)
  nationalTestMode.value = stored === 'true'
}
const toggleNationalTestMode = (val) => {
  nationalTestMode.value = val
  const schoolId = store.state.school.id || 'hailin-second-primary'
  sessionStorage.setItem(`national_test_mode_${schoolId}`, val ? 'true' : 'false')
  ElMessage.success(val ? '已开启国家体测模式，移动端任务成绩将归属于国家体测成绩' : '已关闭国家体测模式')
}

// 学校档案数据
const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const schoolProfile = computed(() => getSchoolProfile(schoolId.value))

const customTemplates = usePersistedRef(
  computed(() => `smart_pe_custom_templates_${schoolId.value}`),
  [...MOCK_CUSTOM_TEMPLATES]
)

// 动态生成学年选项（基于当前日期）
const academicYearOptions = computed(() => {
  const now = new Date('2026-07-16T08:00:00')
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 9 ? year : year - 1
  const options = []
  for (let i = 0; i < 4; i++) {
    const sy = startYear - i
    options.push({ label: `${sy}-${sy + 1}学年`, value: `${sy}-${sy + 1}` })
  }
  return options
})

// 当前学年默认值
const currentAcademicYear = computed(() => academicYearOptions.value[0]?.value || '2025-2026')

// 获取学校数据
const schoolData = computed(() => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return getSchoolMockData(schoolId)
})

// 班级数据存储 - 从大沩接口获取
const classTotalMap = ref({}) // { "一年级4班": 20, ... }

// 加载班级数据（从大沩接口）
const loadClassData = async () => {
  const currentSchoolId = store.state.school?.id || ''
  loading.value = true

  try {
    const tokenResult = await getTokenData(currentSchoolId)
    if (!tokenResult || !tokenResult.token) {
      console.warn('大沩Token获取失败，使用本地数据')
      throw new Error('Token获取失败')
    }

    // 获取班级结构
    const classResult = await getClassList({}, currentSchoolId)
    if (String(classResult.code) !== '0' || !classResult.data) {
      console.warn('大沩班级数据获取失败，使用本地数据')
      throw new Error('班级数据获取失败')
    }

    // 解析班级结构
    const classesMap = {}
    const parseClasses = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 4) {
          const grade = node.name.replace(/\d+班$/, '')
          const className = node.name.replace(/^[一二三四五六]年级/, '')
          const key = `${grade}${className}`
          classesMap[key] = {
            id: node.dept_id,
            name: node.name,
            grade,
            className
          }
        }
        if (node.children && node.children.length > 0) {
          parseClasses(node.children)
        }
      })
    }
    parseClasses(classResult.data)

    // 获取学生列表并统计各班级人数
    const studentResult = await getStudentListV4({ page: 1, size: 5000 }, currentSchoolId)
    const students = studentResult.list || []

    // 构建 class_id -> { grade, className } 映射
    const classIdToInfo = {}
    Object.values(classesMap).forEach(c => {
      classIdToInfo[c.id] = { grade: c.grade, className: c.className }
    })

    // 统计每个班级的学生人数
    const counts = {}
    students.forEach(s => {
      const classInfo = classIdToInfo[s.class_id]
      if (classInfo) {
        const key = `${classInfo.grade}${classInfo.className}`
        counts[key] = (counts[key] || 0) + 1
      }
    })

    classTotalMap.value = counts
    loading.value = false
  } catch (error) {
    console.warn('大沩接口调用失败，使用本地数据:', error.message)
    // 使用本地 mock 数据作为 fallback
    const allStudents = schoolData.value?.students || []
    const counts = {}
    allStudents.forEach(s => {
      const key = `${s.grade}${s.class}`
      counts[key] = (counts[key] || 0) + 1
    })
    classTotalMap.value = counts
    loading.value = false
  }
}

const nationalTestResults = computed(() => {
  const base = schoolData.value?.nationalTestResults || []
  let migrated = []
  try {
    const raw = sessionStorage.getItem('smart_pe_migrated_records')
    if (raw) {
      migrated = JSON.parse(raw).filter(m => m.type === 'test').map(m => m.record)
    }
  } catch { /* ignore */ }
  
  let imported = []
  try {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const raw = sessionStorage.getItem(`smart_pe_imported_national_test_${schoolId}`)
    if (raw) {
      imported = JSON.parse(raw)
    }
  } catch { /* ignore */ }
  
  return [...base, ...migrated, ...imported]
})

// 视力编辑状态
const editingVision = ref({ row: null, left: null, right: null })

// 选中行数据
const selectedRows = ref([])

// 处理选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 处理组件的cell-edit事件
const handleCellEdit = ({ row, field, editable, value, action, isEditing }) => {
  if (action === 'save') {
    ElMessage.success('成绩已更新')
  }
}

// 保存BMI
const saveBmi = (row) => {
  if (examTableRef.value && examTableRef.value.editingValue !== null) {
    row.bmi = examTableRef.value.editingValue
    ElMessage.success('BMI已更新')
    examTableRef.value.cancelEdit()
  }
}

// 处理视力双击
const handleVisionDoubleClick = (row) => {
  editingVision.value = {
    row,
    left: row.visionLeft,
    right: row.visionRight
  }
}

// 保存视力
const saveVision = (row) => {
  if (editingVision.value.left !== null) {
    row.visionLeft = editingVision.value.left
  }
  if (editingVision.value.right !== null) {
    row.visionRight = editingVision.value.right
  }
  ElMessage.success('视力已更新')
  cancelVisionEdit()
}

// 取消视力编辑
const cancelVisionEdit = () => {
  editingVision.value = { row: null, left: null, right: null }
}

// 班级选项（根据年级动态生成，包含分项班/兴趣班）
const classOptions = computed(() => {
  const baseClasses = ['1班', '2班', '3班', '4班', '5班', '6班']
  let classes = baseClasses
  // 追加分项班/兴趣班
  const schoolData = getSchoolMockData(schoolId.value)
  const interestClasses = (schoolData?.classes || []).filter(c => c.type === '分项班').map(c => c.name)
  if (interestClasses.length > 0) {
    classes = [...classes, ...interestClasses]
  }
  return classes
})

// 年级变更时清空班级筛选
const handleGradeChange = () => {
  filterClass.value = ''
}

// 分页
const currentPage = ref(1)
const pageSize = ref(12)

const showSettings = ref(false)
const showTemplateDownload = ref(false)
const importVisible = ref(false)
const importYear = ref('')
const importFile = ref(null)
const showAddTaskDialog = ref(false)

// 体测任务列表数据（需要 ref 因为会通过 push 添加新任务）
const TASK_STATUS_MAP = {
  pending: '未开始',
  active: '进行中',
  completed: '已结束',
  paused: '已暂停',
  in_progress: '进行中'
}

const normalizeTask = (task) => {
  const start = task.startTime?.split?.('T')?.[0] || task.date || task.dateRange?.split?.(' ')?.[0] || ''
  const end = task.endTime?.split?.('T')?.[0] || task.endDate || start
  const dateRange = task.dateRange || (start ? `${start} 至 ${end || start}` : '')
  const status = TASK_STATUS_MAP[task.status] || task.status || '未开始'
  return {
    ...task,
    dateRange,
    status,
    grade: task.grade || '全体年级',
    academicYear: task.academicYear || currentAcademicYear.value
  }
}

const taskList = ref(schoolProfile.value.nationalTest.taskList.map(normalizeTask))
watch(schoolProfile, () => {
  taskList.value = schoolProfile.value.nationalTest.taskList.map(normalizeTask)
})

// 新增任务表单
const newTaskForm = ref({
  name: '',
  academicYear: currentAcademicYear.value,
  semester: 'spring',
  grade: [],
  dateRange: ''
})

// 任务概览统计
const taskOverviewStats = computed(() => {
  const currentYearTasks = taskList.value.filter(t => !t.academicYear || t.academicYear === currentAcademicYear.value)
  return {
    total: currentYearTasks.length,
    active: currentYearTasks.filter(t => t.status === '进行中').length,
    pending: currentYearTasks.filter(t => t.status === '未开始').length,
    completed: currentYearTasks.filter(t => t.status === '已结束').length
  }
})

// 任务时间线位置
const getTimelinePos = (task) => {
  const raw = task?.dateRange || task?.date || ''
  const dateStr = String(raw).split(' ')[0]
  if (!dateStr || !dateStr.includes('-')) {
    return { left: '50%' }
  }
  const month = parseInt(dateStr.split('-')[1], 10)
  if (Number.isNaN(month)) {
    return { left: '50%' }
  }
  let position
  if (month >= 9 && month <= 12) {
    position = ((month - 9) / 3) * 45 + 2
  } else if (month >= 1 && month <= 2) {
    position = 52 + ((month - 1) / 2) * 6
  } else if (month >= 3 && month <= 6) {
    position = 60 + ((month - 3) / 3) * 38
  } else {
    position = 50
  }
  return { left: `${position}%` }
}

// 任务状态样式类
const getTaskDotClass = (status) => {
  switch (status) {
    case '进行中': return 'dot-active'
    case '已暂停': return 'dot-paused'
    case '已结束': return 'dot-completed'
    default: return 'dot-pending'
  }
}

const addNewTask = () => {
  if (!newTaskForm.value.name) {
    ElMessage.warning('请输入任务名称')
    return
  }
  taskList.value.unshift(normalizeTask({
    name: newTaskForm.value.name,
    dateRange: newTaskForm.value.dateRange ? `${newTaskForm.value.dateRange[0]} 至 ${newTaskForm.value.dateRange[1]}` : '',
    grade: newTaskForm.value.grade.join('、') || '全体年级',
    status: '未开始',
    academicYear: newTaskForm.value.academicYear,
    semester: newTaskForm.value.semester
  }))
  newTaskForm.value = { name: '', academicYear: currentAcademicYear.value, semester: 'spring', grade: [], dateRange: '' }
  showAddTaskDialog.value = false
  addLog('新建体测任务', '', `创建新的体测任务`)
  ElMessage.success('体测任务已创建')
}

// 弹窗控制
const detailVisible = ref(false)
const replayVisible = ref(false)
const arbitrationVisible = ref(false)
const selectedStudent = ref(null)

// 仲裁表单
const arbitrationForm = ref({
  projects: [],
  reasonType: '',
  reason: ''
})

// 仲裁标签页
const arbitrationTab = ref('apply')

// 成绩溯源日志
const traceLogs = computed(() => schoolProfile.value.nationalTest.traceLogs)

// AI判定依据数据
const aiJudgments = computed(() => schoolProfile.value.nationalTest.aiJudgments)

// 播放测试视频
const playTestVideo = () => {
  viewReplay(selectedStudent.value)
}

// 仲裁历史
const arbitrationHistory = computed(() => schoolProfile.value.nationalTest.arbitrationHistory)

const testStats = computed(() => {
  const data = filteredResults.value
  const total = data.length
  if (total === 0) return { total: 0, excellentRate: 0, goodRate: 0, passRate: 0, failRate: 0 }
  let excellent = 0, good = 0, pass = 0, fail = 0
  data.forEach(row => {
    const grade = getOverallGrade(row)
    if (grade === '优秀') excellent++
    else if (grade === '良好') good++
    else if (grade === '及格') pass++
    else fail++
  })
  return {
    total,
    excellentRate: ((excellent / total) * 100).toFixed(1),
    goodRate: ((good / total) * 100).toFixed(1),
    passRate: ((pass / total) * 100).toFixed(1),
    failRate: ((fail / total) * 100).toFixed(1)
  }
})

const filteredResults = computed(() => {
  let result = [...(nationalTestResults.value || [])]
  if (filterGrade.value && filterGrade.value !== 'all') {
    result = result.filter(r => r.grade === filterGrade.value)
  }
  if (filterClass.value) {
    if (isInterestClass(filterClass.value)) {
      const allStudents = schoolData.value?.students || []
      const matchingIds = getMatchingStudentIds(filterClass.value, allStudents)
      result = result.filter(r => matchingIds.has(r.studentId))
    } else {
      result = result.filter(r => r.class === filterClass.value)
    }
  }
  if (filterYear.value) {
    result = result.filter(r => r.year === filterYear.value)
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = new Date(dateRange.value[0])
    const endDate = new Date(dateRange.value[1])
    result = result.filter(r => {
      const recordDate = new Date(r.date)
      return recordDate >= startDate && recordDate <= endDate
    })
  }
  return result
})



// 班级进度统计数据
const classProgress = computed(() => schoolProfile.value.nationalTest.classProgress)

// 进度预警阈值（低于此值标红）
const progressWarningThreshold = 60

// 计算班级总人数（从学生数据中获取）
const getClassTotalStudents = (grade, className) => {
  const key = `${grade}${className}`
  // 优先使用接口返回的数据
  if (classTotalMap.value[key] !== undefined) {
    return classTotalMap.value[key]
  }
  // fallback: 使用本地数据
  const allStudents = schoolData.value?.students || []
  const classKey = className.replace(/班$/, '')
  return allStudents.filter(s => s.grade === grade && 
    (s.class === className || s.class?.replace(/班$/, '') === classKey)
  ).length
}

// 计算班级已完成测试的人数
const getClassCompleted = (row) => {
  const records = (filteredResults.value || []).filter(r => r.grade === row.grade && r.class === row.class)
  return records.length
}

// 计算班级进度百分比
const getClassProgressPercent = (row) => {
  const total = getClassTotalStudents(row.grade, row.class)
  if (total === 0) return 0
  const completed = getClassCompleted(row)
  return Math.round((completed / total) * 100)
}

// 获取班级进度信息
const getClassProgress = (className) => {
  return classProgress.value[className] || { completed: 0, total: 0, rate: 0 }
}

// 判断班级是否需要预警
const isClassWarning = (className) => {
  const progress = getClassProgress(className)
  return progress.rate < progressWarningThreshold
}

const testColumns = [
  { prop: 'studentId', label: '学号', minWidth: '120', fixed: 'left' },
  { prop: 'studentName', label: '姓名', minWidth: '90' },
  { prop: 'grade', label: '年级', minWidth: '80' },
  { prop: 'class', label: '班级', minWidth: '120', slot: 'classWithProgress' },
  { label: '班级排名', minWidth: '90', slot: 'rank', sortable: true },
  { prop: 'bmi', label: 'BMI', minWidth: '100', slot: 'bmi', editable: true, sortable: true },
  { label: '视力', minWidth: '140', slot: 'vision' },
  { prop: 'fiftyMeter', label: '50米跑', minWidth: '100', editable: true, inputType: 'number', sortable: true },
  { prop: 'sitAndReach', label: '坐位体前屈', minWidth: '120', editable: true, inputType: 'number', sortable: true },
  { prop: 'sitUps', label: '仰卧起坐', minWidth: '100', editable: true, inputType: 'number', sortable: true },
  { prop: 'longJump', label: '立定跳远', minWidth: '100', editable: true, inputType: 'number', sortable: true },
  { prop: 'pullUp', label: '引体向上', minWidth: '100', editable: true, inputType: 'number', sortable: true },
  { label: '综合等级', minWidth: '100', slot: 'overallGrade' },
  { prop: 'testDate', label: '测试日期', minWidth: '110', sortable: true },
]

const getBmiClass = (bmi) => {
  if (bmi >= 14 && bmi <= 18) return 'bmi-normal'
  return 'bmi-warning'
}

const gradeScoreMap = { '优秀': 100, '良好': 80, '及格': 60, '不及格': 40 }

const getRank = (row) => {
  const gradeClass = (filteredResults.value || []).filter(r => r.grade === row.grade && r.class === row.class)
  if (gradeClass.length === 0) return '-'
  const sorted = [...gradeClass].sort((a, b) => {
    const gradeA = getOverallGrade(a)
    const gradeB = getOverallGrade(b)
    return (gradeScoreMap[gradeB] || 0) - (gradeScoreMap[gradeA] || 0)
  })
  const rank = sorted.findIndex(r => r.studentId === row.studentId) + 1
  // 只返回排名数字
  return rank
}

const getOverallGrade = (row) => {
  const bmi = Number(row.bmi) || 0
  const visionLeft = Number(row.visionLeft) || 0
  const fiftyMeter = Number(row.fiftyMeter) || 0
  const sitAndReach = Number(row.sitAndReach) || 0
  const sitUps = Number(row.sitUps) || 0
  const longJump = Number(row.longJump) || 0

  const bmiScore = bmi >= 14 && bmi <= 18.5 ? 100 : bmi >= 12 && bmi <= 20 ? 80 : 60
  const visionScore = visionLeft >= 5.0 ? 100 : visionLeft >= 4.8 ? 80 : visionLeft >= 4.5 ? 60 : 40
  const fiftyMeterScore = fiftyMeter <= 8.0 ? 100 : fiftyMeter <= 9.0 ? 80 : fiftyMeter <= 10.0 ? 60 : 40
  const sitAndReachScore = sitAndReach >= 20 ? 100 : sitAndReach >= 15 ? 80 : sitAndReach >= 10 ? 60 : 40
  const sitUpsScore = sitUps >= 50 ? 100 : sitUps >= 40 ? 80 : sitUps >= 30 ? 60 : 40
  const longJumpScore = longJump >= 2.0 ? 100 : longJump >= 1.8 ? 80 : longJump >= 1.6 ? 60 : 40
  
  const avg = (bmiScore + visionScore + fiftyMeterScore + sitAndReachScore + sitUpsScore + longJumpScore) / 6
  
  if (avg >= 85) return '优秀'
  if (avg >= 70) return '良好'
  if (avg >= 55) return '及格'
  return '不及格'
}

const getGradeClass = (row) => {
  const grade = getOverallGrade(row)
  const map = { '优秀': 'grade-excellent', '良好': 'grade-good', '及格': 'grade-pass', '不及格': 'grade-fail' }
  return map[grade] || ''
}

// 查看详情
const viewDetail = (row) => {
  selectedStudent.value = row
  detailVisible.value = true
}

// 查看回放
const viewReplay = (row) => {
  selectedStudent.value = row
  replayVisible.value = true
}

// 成绩仲裁
const openArbitration = (row) => {
  selectedStudent.value = row
  arbitrationForm.value = { projects: [], reasonType: '', reason: '' }
  arbitrationTab.value = 'apply'
  arbitrationVisible.value = true
}

// 提交仲裁
const submitArbitration = () => {
  if (arbitrationForm.value.projects.length === 0) {
    ElMessage.warning('请至少选择一个仲裁项目')
    return
  }
  if (!arbitrationForm.value.reason.trim()) {
    ElMessage.warning('请填写仲裁原因')
    return
  }
  ElMessage.success('仲裁申请已提交，等待审核')
  arbitrationVisible.value = false
}

const refreshData = () => {
  filterGrade.value = ''
  filterClass.value = ''
  filterYear.value = ''
  dateRange.value = []
  currentPage.value = 1
  nextTick(() => {
    initGradeChart()
    initProjectChart()
  })
  ElMessage.success('数据已刷新')
}

const downloadTemplate = () => {
  showTemplateDownload.value = true
}

const importResults = () => {
  importFile.value = null
  importVisible.value = true
}

const handleImportFileChange = (file) => {
  importFile.value = file.raw || file
}

const confirmImport = () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    if (content) {
      const importedData = parseImportData(content)
      if (importedData && importedData.length > 0) {
        saveImportedData(importedData)
        updateStudentTestStatus(importedData)
        ElMessage.success(`已成功导入 ${importedData.length} 条体测成绩数据`)
        addLog('导入体测', '', `导入国家体测数据 ${importedData.length} 条`)
      } else {
        ElMessage.warning('文件内容为空或格式不正确')
      }
    }
    importVisible.value = false
  }
  reader.readAsText(importFile.value, 'UTF-8')
}

const parseImportData = (content) => {
  const lines = content.split('\n').filter(row => row.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length >= 4) {
      const row = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] ? values[idx].trim() : ''
      })
      data.push(convertImportRow(row))
    }
  }
  
  return data
}

const parseCSVLine = (line) => {
  const values = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)
  
  return values
}

const convertImportRow = (row) => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const random = createSeededRandom(schoolId + '_import')
  return {
    id: generateDeterministicId('nt-import', (row['学号'] || row['studentId'] || '') + '_' + (row['姓名'] || row['studentName'] || '')),
    studentId: row['学号'] || row['studentId'] || '',
    studentName: row['姓名'] || row['studentName'] || '',
    grade: row['年级'] || row['grade'] || '',
    class: row['班级'] || row['class'] || '',
    gender: row['性别'] || row['gender'] || '',
    height: parseFloat(row['身高(cm)'] || row['身高'] || row['height'] || 0),
    weight: parseFloat(row['体重(kg)'] || row['体重'] || row['weight'] || 0),
    bmi: parseFloat(row['BMI'] || row['bmi'] || 0),
    visionLeft: parseFloat(row['左眼视力'] || row['visionLeft'] || 0),
    visionRight: parseFloat(row['右眼视力'] || row['visionRight'] || 0),
    sitAndReach: parseFloat(row['坐位体前屈(cm)'] || row['坐位体前屈'] || row['sitAndReach'] || 0),
    sitUps: parseInt(row['仰卧起坐(个)'] || row['仰卧起坐'] || row['sitUps'] || 0),
    fiftyMeter: parseFloat(row['50米跑(秒)'] || row['50米跑'] || row['fiftyMeter'] || 0),
    longJump: parseFloat(row['立定跳远(m)'] || row['立定跳远'] || row['longJump'] || 0),
    pullUp: parseInt(row['引体向上(个)'] || row['引体向上'] || row['pullUp'] || 0),
    enduranceRun: row['耐力跑(分:秒)'] || row['耐力跑'] || row['enduranceRun'] || '',
    vitalCapacity: parseInt(row['肺活量(ml)'] || row['肺活量'] || row['vitalCapacity'] || 0),
    totalScore: parseInt(row['总分'] || row['totalScore'] || 0),
    overallGrade: row['综合等级'] || row['overallGrade'] || '',
    testDate: row['测试日期'] || row['testDate'] || formatDate(new Date()),
    year: '2025-2026',
    schoolId,
    imported: true
  }
}

const formatDate = (date) => {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

const saveImportedData = (data) => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const key = `smart_pe_imported_national_test_${schoolId}`
  const existing = JSON.parse(sessionStorage.getItem(key) || '[]')
  const merged = [...existing, ...data]
  sessionStorage.setItem(key, JSON.stringify(merged))
}

const updateStudentTestStatus = (importedData) => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const studentsKey = `smart_pe_students_${schoolId}`
  const students = JSON.parse(sessionStorage.getItem(studentsKey) || '[]')
  
  importedData.forEach(item => {
    const student = students.find(s => s.id === item.studentId || s.name === item.studentName)
    if (student) {
      student.hasTestRecord = true
      student.latestTestScore = item.totalScore
      student.latestTestGrade = item.overallGrade || getOverallGrade(item)
      student.latestTestDate = item.testDate
    }
  })
  
  sessionStorage.setItem(studentsKey, JSON.stringify(students))
}

// 通用导出函数
const exportData = (data, filename) => {
  const headers = ['学号', '姓名', '年级', '班级', '身高', '体重', 'BMI', '左眼视力', '右眼视力', '坐位体前屈', '仰卧起坐', '50米跑', '立定跳远', '引体向上', '耐力跑', '肺活量', '总分', '综合等级', '测试日期']
  const rows = data.map(result => [
    result.studentId,
    result.studentName,
    result.grade,
    result.class,
    result.height,
    result.weight,
    result.bmi,
    result.visionLeft,
    result.visionRight,
    result.sitAndReach,
    result.sitUps,
    result.fiftyMeter,
    result.longJump,
    result.pullUp || '-',
    result.enduranceRun,
    result.vitalCapacity || '-',
    result.totalScore || '-',
    getOverallGrade(result),
    result.testDate || '-'
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 导出全部数据
const exportAll = () => {
  exportData(filteredResults.value, '体测数据_全部')
  addLog('导出体测', '', `导出国家体测数据`)
  ElMessage.success('体测数据已导出')
}

// 导出当前页数据
const exportCurrentPage = () => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  const currentPageData = filteredResults.value.slice(start, end)
  exportData(currentPageData, `体测数据_第${currentPage.value}页`)
  ElMessage.success(`第${currentPage.value}页数据已导出`)
}

// 导出选中数据
const exportSelected = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的数据')
    return
  }
  exportData(selectedRows.value, `体测数据_选中${selectedRows.value.length}条`)
  ElMessage.success(`${selectedRows.value.length}条选中数据已导出`)
}

const initGradeChart = () => {
  if (!gradeChart.value) return
  if (gradeChartInstance) { gradeChartInstance.dispose(); gradeChartInstance = null }
  gradeChartInstance = echarts.init(gradeChart.value)

  // 从实际数据计算各年级的达标情况
  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const data = filteredResults.value
  const gradeStats = grades.map(grade => {
    const gradeData = data.filter(r => r.grade === grade)
    const total = gradeData.length
    if (total === 0) return { excellent: 0, good: 0, pass: 0, fail: 0 }
    let excellent = 0, good = 0, pass = 0, fail = 0
    gradeData.forEach(row => {
      const g = getOverallGrade(row)
      if (g === '优秀') excellent++
      else if (g === '良好') good++
      else if (g === '及格') pass++
      else fail++
    })
    return {
      excellent: Math.round((excellent / total) * 100),
      good: Math.round((good / total) * 100),
      pass: Math.round((pass / total) * 100),
      fail: Math.round((fail / total) * 100)
    }
  })

  gradeChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { color: '#6B7280' } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: grades,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280', formatter: '{value}%' }
    },
    series: [
      { name: '优秀', type: 'bar', stack: 'total', barWidth: '50%', itemStyle: { color: '#1E5AA8', borderRadius: [0, 0, 0, 0] }, data: gradeStats.map(s => s.excellent) },
      { name: '良好', type: 'bar', stack: 'total', barWidth: '50%', itemStyle: { color: '#3B82F6' }, data: gradeStats.map(s => s.good) },
      { name: '及格', type: 'bar', stack: 'total', barWidth: '50%', itemStyle: { color: '#F5A623' }, data: gradeStats.map(s => s.pass) },
      { name: '不及格', type: 'bar', stack: 'total', barWidth: '50%', itemStyle: { color: '#E85D4E', borderRadius: [4, 4, 0, 0] }, data: gradeStats.map(s => s.fail) }
    ]
  })
}

const initProjectChart = () => {
  if (!projectChart.value) return
  if (projectChartInstance) { projectChartInstance.dispose(); projectChartInstance = null }
  projectChartInstance = echarts.init(projectChart.value)

  // 从实际数据计算各项目合格率
  const data = filteredResults.value
  const total = data.length

  const calcPassRate = (fn) => {
    if (total === 0) return 0
    const passed = data.filter(fn).length
    return Math.round((passed / total) * 100)
  }

  const bmiPass = calcPassRate(r => r.bmi >= 14 && r.bmi <= 18.5)
  const visionPass = calcPassRate(r => r.visionLeft >= 4.8)
  const fiftyPass = calcPassRate(r => r.fiftyMeter <= 10.0)
  const longJumpPass = calcPassRate(r => r.longJump >= 1.6)
  const sitUpsPass = calcPassRate(r => r.sitUps >= 30)
  const sitReachPass = calcPassRate(r => r.sitAndReach >= 10)
  const pullUpPass = calcPassRate(r => r.pullUp >= 5)

  projectChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    radar: {
      indicator: [
        { name: 'BMI', max: 100 },
        { name: '视力', max: 100 },
        { name: '50米跑', max: 100 },
        { name: '立定跳远', max: 100 },
        { name: '仰卧起坐', max: 100 },
        { name: '坐位体前屈', max: 100 },
        { name: '引体向上', max: 100 }
      ],
      radius: '65%',
      axisName: { color: '#6B7280', fontSize: 11 },
      splitArea: { areaStyle: { color: ['#F7F8FA', '#FFFFFF'] } },
      axisLine: { lineStyle: { color: '#E8EAED' } },
      splitLine: { lineStyle: { color: '#E8EAED' } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [bmiPass, visionPass, fiftyPass, longJumpPass, sitUpsPass, sitReachPass, pullUpPass],
          name: '合格率',
          areaStyle: { color: 'rgba(45, 125, 70, 0.2)' },
          lineStyle: { color: '#1E5AA8', width: 2 },
          itemStyle: { color: '#1E5AA8' }
        }
      ]
    }]
  })
}

onMounted(async () => {
  initNationalTestMode()
  // 加载班级数据
  await loadClassData()
  nextTick(() => {
    setTimeout(() => { initGradeChart(); initProjectChart() }, 200)
  })
  window.addEventListener('resize', handleChartResize)
})

// 筛选条件变化时重新渲染图表
watch(filteredResults, () => {
  nextTick(() => {
    initGradeChart()
    initProjectChart()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
  if (gradeChartInstance) gradeChartInstance.dispose()
  if (projectChartInstance) projectChartInstance.dispose()
})

const handleChartResize = () => {
  if (gradeChartInstance) gradeChartInstance.resize()
  if (projectChartInstance) projectChartInstance.resize()
}
</script>

<style scoped>
.national-test {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mode-switch-container {
  display: flex;
  align-items: center;
  margin-bottom: 1px;
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

/* 图表区 */
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
  height: 300px;
  width: 100%;
}

/* 班级进度单元格 */
.class-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0;
}

.class-cell .class-name {
  font-size: 13px;
  font-weight: 500;
}

.class-cell .class-progress {
  display: flex;
  align-items: center;
  gap: 6px;
}

.class-cell .progress-bar {
  flex: 1;
  height: 4px;
  background: #F3F4F6;
  border-radius: 2px;
  overflow: hidden;
}

.class-cell .progress-fill {
  height: 100%;
  background: #1E5AA8;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.class-cell .progress-fill.progress-warning {
  background: #F5A623;
}

.class-cell .progress-text {
  font-size: 11px;
  color: #6B7280;
  min-width: 50px;
  text-align: right;
}

/* 进度预警样式 - 无左边框 */
.class-cell.progress-warning .class-name {
  color: #F5A623;
}

.class-cell.progress-warning {
  padding: 2px 6px;
  border-radius: 4px;
}




/* BMI */
.bmi-normal { color: #1E5AA8; font-weight: 500; }
.bmi-warning { color: #F5A623; font-weight: 500; }

/* 视力输入框样式 */
.vision-inputs {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

/* 等级标签 */
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



/* 详情弹窗样式 */
.detail-content {
  padding: 10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.student-info h3 {
  margin: 0;
  font-size: 18px;
  color: #1A1A2E;
}

.student-info p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #6B7280;
}

.overall-grade {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.overall-grade .grade-tag {
  font-size: 16px;
  padding: 4px 12px;
}

.total-score {
  font-size: 13px;
  color: #6B7280;
}

.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
  margin: 16px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #E8EAED;
}

.detail-test-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
  font-size: 13px;
  color: #6B7280;
  text-align: right;
}

.detail-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #F9FAFB;
  border-radius: 8px;
}

.item-label {
  font-size: 13px;
  color: #6B7280;
}

.item-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

/* 回放弹窗 */
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

.video-player {
  background: #F3F4F6;
  border-radius: 8px;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-placeholder {
  text-align: center;
  color: #6B7280;
}

.video-placeholder p {
  margin: 12px 0;
  font-size: 14px;
}

.replay-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.replay-info p {
  margin: 0;
  font-size: 13px;
  color: #4B5563;
}

/* 仲裁弹窗 */
.arbitration-content {
  padding: 10px;
}

.arbitration-student {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.arbitration-student h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1A1A2E;
}

.arbitration-student p {
  margin: 0;
  font-size: 13px;
  color: #6B7280;
}

/* 成绩溯源样式 */
.trace-content {
  padding: 8px;
}

.trace-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: #1E5AA8;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1A1A2E;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #F7F8FA;
  border-radius: 8px;
}

.info-label {
  font-size: 13px;
  color: #6B7280;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

/* AI判定卡片 */
.ai-judgment {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.judgment-card {
  background: #F7F8FA;
  border-radius: 10px;
  padding: 14px;
  border-left: 3px solid #1E5AA8;
}

.judgment-card.has-warning {
  border-left-color: #F5A623;
  background: #FFFBEB;
}

.judgment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.judgment-project {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.judgment-result {
  font-size: 13px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.result-excellent {
  background: #DCFCE7;
  color: #166534;
}

.result-good {
  background: #DBEAFE;
  color: #1E40AF;
}

.result-pass {
  background: #FEF3C7;
  color: #92400E;
}

.result-fail {
  background: #FEE2E2;
  color: #991B1B;
}

.judgment-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.detail-label {
  color: #6B7280;
  min-width: 70px;
}

.detail-value {
  color: #1A1A2E;
}

.confidence-bar {
  display: inline-block;
  width: 80px;
  height: 6px;
  background: #E8EAED;
  border-radius: 3px;
  overflow: hidden;
  vertical-align: middle;
  margin-right: 6px;
}

.confidence-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #1E5AA8, #3B82F6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.warning-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: #FEF3C7;
  border-radius: 6px;
  margin-top: 8px;
  color: #92400E;
  font-size: 12px;
}

.warning-tip svg {
  width: 14px;
  height: 14px;
}

/* 时间线 */
.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #E8EAED;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -17px;
  top: 4px;
  width: 10px;
  height: 10px;
  background: #1E5AA8;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
  box-shadow: 0 0 0 2px rgba(30, 90, 168, 0.2);
}

.timeline-dot.is-system {
  background: #6B7280;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.2);
}

.timeline-content {
  background: #F7F8FA;
  padding: 12px 14px;
  border-radius: 8px;
}

.timeline-time {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.timeline-action {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
  margin-bottom: 4px;
}

.timeline-operator {
  font-size: 12px;
  color: #9CA3AF;
}

/* 视频区域 */
.video-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-player-container {
  background: #1A1A2E;
  border-radius: 8px;
  overflow: hidden;
}

.video-cover {
  position: relative;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1A1A2E 0%, #2D3748 100%);
}

.play-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(30, 90, 168, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.play-btn:hover {
  transform: scale(1.1);
  background: #1E5AA8;
}

.play-btn svg {
  width: 24px;
  height: 24px;
  color: #FFFFFF;
  margin-left: 4px;
}

.video-info {
  display: flex;
  gap: 16px;
  color: #9CA3AF;
  font-size: 12px;
}

.video-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-tag {
  padding: 4px 10px;
  background: #E8EAED;
  border-radius: 20px;
  font-size: 12px;
  color: #6B7280;
}

/* 文件列表 */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #F7F8FA;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.file-item:hover {
  background: #F0FDF4;
}

.file-item svg:first-child {
  width: 18px;
  height: 18px;
  color: #6B7280;
}

.file-item span {
  flex: 1;
  font-size: 13px;
  color: #1A1A2E;
}

.file-item svg:last-child {
  width: 14px;
  height: 14px;
  color: #9CA3AF;
}

/* 空历史状态 */
.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #9CA3AF;
}

.empty-history svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

.empty-history p {
  margin: 0;
  font-size: 14px;
}

/* 历史记录列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 14px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-date {
  font-size: 12px;
  color: #6B7280;
}

.history-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.history-status.已完成 {
  background: #DCFCE7;
  color: #166534;
}

.history-status.处理中 {
  background: #FEF3C7;
  color: #92400E;
}

.history-reason {
  font-size: 13px;
  color: #1A1A2E;
  margin-bottom: 8px;
}

.history-result {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.result-label {
  color: #6B7280;
}

.result-value {
  color: #1E5AA8;
  font-weight: 500;
}

/* ===== 体测任务概览 ===== */
.task-overview-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.task-header-actions {
  display: flex;
  gap: 8px;
}
.task-stats-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 0;
  margin-bottom: 16px;
}
.task-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.task-stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #1A1A2E;
}
.task-stat-label {
  font-size: 12px;
  color: #6B7280;
}
.task-stat-divider {
  width: 1px;
  height: 32px;
  background: #E8EAED;
}
/* 时间线 */
.task-timeline-bar {
  padding: 12px 16px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 16px;
}
.timeline-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 10px;
}
.timeline-track {
  position: relative;
  height: 20px;
  background: #E8EAED;
  border-radius: 10px;
  overflow: visible;
}
.track-segment {
  position: absolute;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #9CA3AF;
}
.track-segment.autumn {
  left: 0;
  width: 45%;
}
.track-segment.winter {
  left: 50%;
  width: 10%;
}
.track-segment.spring {
  left: 60%;
  width: 38%;
}
.timeline-dot-wrapper {
  position: absolute;
  top: -4px;
  transform: translateX(-50%);
}
.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  cursor: pointer;
}
.dot-active { background: #1E5AA8; box-shadow: 0 0 0 3px rgba(30, 90, 168, 0.2); }
.dot-pending { background: #F5A623; box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.2); }
.dot-completed { background: #9CA3AF; }
.dot-paused { background: #E85D4E; }
/* 当前任务列表 */
.current-tasks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.current-task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #F7F8FA;
  border-radius: 8px;
}
.task-dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.task-item-info {
  flex: 1;
}
.task-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 2px;
}
.task-item-meta {
  font-size: 12px;
  color: #6B7280;
}
.task-status-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}
.task-status-tag.dot-active {
  background: #DBEAFE;
  color: #1E40AF;
}
.task-status-tag.dot-pending {
  background: #FEF3C7;
  color: #92400E;
}
.task-status-tag.dot-completed {
  background: #E8EAED;
  color: #6B7280;
}
.task-status-tag.dot-paused {
  background: #FEE2E2;
  color: #991B1B;
}

/* 国家体测页面响应式布局 */
@media screen and (max-width: 992px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-filters {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  
  .stat-divider {
    display: none;
  }
  
  .stat-item {
    padding: 12px 8px;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media screen and (max-width: 768px) {
  .national-test {
    padding: 12px;
    gap: 12px;
  }
  
  .page-header {
    gap: 12px;
  }
  
  .header-filters {
    width: 100%;
    justify-content: flex-start;
  }
  
  .header-filters :deep(.el-select),
  .header-filters :deep(.el-date-picker) {
    width: calc(50% - 4px) !important;
    min-width: 150px;
  }
  
  .header-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    padding: 16px;
    gap: 12px;
  }
  
  .stat-item {
    padding: 10px 8px;
    text-align: center;
  }
  
  .stat-num {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .chart-card {
    padding: 16px;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .chart {
    height: 200px;
  }
  
  .task-stats-row {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .task-stat-divider {
    display: none;
  }
  
  .task-overview-card {
    padding: 16px;
  }
  
  .list-card {
    overflow-x: auto;
  }
  
  .list-card :deep(.el-table) {
    min-width: 800px;
  }
}

@media screen and (max-width: 480px) {
  .national-test {
    padding: 8px;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 12px;
    background: #F7F8FA;
    border-radius: 8px;
  }
  
  .stat-label {
    text-align: right;
  }
  
  .header-filters :deep(.el-select),
  .header-filters :deep(.el-date-picker) {
    width: 100% !important;
  }
  
  .chart {
    height: 160px;
  }
}

/* 国家体测模式切换 */
.national-mode-toggle {
  margin-bottom: 16px;
}
.mode-switch-wrapper {
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
</style>