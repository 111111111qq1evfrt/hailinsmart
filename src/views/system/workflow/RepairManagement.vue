<template>
  <div class="repair-management-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索设备名称/位置"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterStatus" placeholder="报修状态" clearable style="width: 140px">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
          <el-option label="抢单池" value="claimPool" />
        </el-select>
        <el-select v-model="filterPriority" placeholder="优先级" clearable style="width: 120px">
          <el-option label="紧急" value="high" />
          <el-option label="一般" value="normal" />
          <el-option label="低" value="low" />
        </el-select>
        <el-select v-model="filterType" placeholder="设备类型" clearable style="width: 140px">
          <el-option label="球类器材" value="balls" />
          <el-option label="田径器材" value="athletics" />
          <el-option label="场地设施" value="field" />
          <el-option label="其他" value="other" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
        <el-button :icon="Download" @click="exportData">导出记录</el-button>
        <el-button :icon="Setting" @click="showSettingsDialog = true">维修设置</el-button>
        <el-button type="primary" :icon="Plus" @click="createRepair">提交报修</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.pending }}</span>
        <span class="stat-label">待处理</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ stats.processing }}</span>
        <span class="stat-label">处理中</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ stats.completed }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ stats.total }}</span>
        <span class="stat-label">本月报修</span>
      </div>
    </div>

    <!-- 图表区域：上下堆叠，图表并排 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">报修状态分布</span>
        </div>
        <div ref="statusChart" class="chart"></div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">报修类型统计</span>
        </div>
        <div ref="typeChart" class="chart"></div>
      </div>
    </div>

    <!-- 巡检预警面板（预防性维护） -->
    <div v-if="preventiveInspections.length > 0" class="inspection-panel">
      <div class="inspection-header">
        <span class="inspection-title">🛠️ 预防性巡检提醒</span>
        <span class="inspection-count">{{ preventiveInspections.length }} 台设备需要巡检</span>
      </div>
      <div class="inspection-list">
        <div v-for="item in preventiveInspections" :key="item.equipment" class="inspection-item">
          <div class="inspection-info">
            <span class="inspection-name">{{ item.equipment }}</span>
            <span class="inspection-location">{{ item.location }}</span>
            <span class="inspection-stats">
              累计报修 {{ item.total }} 次
              <span class="inspection-month">本月 {{ item.thisMonth }} 次</span>
            </span>
            <el-tag v-if="item.thisMonth >= preventiveThreshold * 2" type="danger" size="small">高频告警</el-tag>
            <el-tag v-else type="warning" size="small">建议巡检</el-tag>
          </div>
          <div class="inspection-actions">
            <el-button size="small" type="primary" @click="createInspectionTask(item)">创建巡检任务</el-button>
            <el-button size="small" @click="viewEquipmentHistory(item)">查看报修历史</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 抢单池面板 -->
    <div v-if="claimPoolOrders.length > 0" class="claim-pool-panel">
      <div class="pool-header">
        <span class="pool-title">🔔 抢单池</span>
        <span class="pool-count">{{ claimPoolOrders.length }} 个工单等待抢单</span>
      </div>
      <div class="pool-list">
        <div v-for="order in claimPoolOrders" :key="order.id" class="pool-item">
          <div class="pool-item-info">
            <span class="pool-item-id">{{ order.id }}</span>
            <span class="pool-item-name">{{ order.equipmentName }}</span>
            <span class="pool-item-location">{{ order.location }}</span>
            <span class="status-tag" :class="getPriorityClass(order.priority)">{{ getPriorityText(order.priority) }}</span>
          </div>
          <el-button type="warning" size="small" @click="claimOrder(order)">抢单</el-button>
        </div>
      </div>
    </div>

    <!-- 列表区域：在下 -->
    <div class="list-card">
      <ExamTable
        :data="sortedRepairs"
        :columns="repairColumns"
        title="报修申请列表"
        :search-fields="['equipmentName', 'location', 'id']"
        search-placeholder="搜索设备名称/位置"
        :show-pagination="true"
        :default-page-size="12"
        :action-width="'200'"
        :show-refresh="true"
        @refresh="refreshData"
      >
        <template #type="{ row }">
          <span class="status-tag status-info">{{ getTypeText(row.type) }}</span>
        </template>
        <template #priority="{ row }">
          <span class="status-tag" :class="getPriorityClass(row.priority)">
            {{ getPriorityText(row.priority) }}
          </span>
        </template>
        <template #status="{ row }">
          <span class="status-tag" :class="getStatusClass(row.status)">
            {{ getStatusText(row.status) }}
          </span>
          <span v-if="row.claimable && !row.claimed" class="claim-badge">待抢单</span>
          <span v-if="row.escalated" class="escalation-badge">已升级L{{ row.escalationLevel || 1 }}</span>
        </template>
        <template #actions="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
          <el-button v-if="row.claimable && !row.claimed && row.status === 'pending'" type="warning" size="small" @click="claimOrder(row)">抢单</el-button>
          <el-button v-if="row.status === 'pending' && !row.claimable" text type="primary" size="small" @click="startProcess(row)">开始处理</el-button>
          <el-button v-if="row.status === 'processing'" text type="primary" size="small" @click="completeRepair(row)">完成维修</el-button>
        </template>
      </ExamTable>
    </div>

    <el-dialog v-model="showDetail" title="报修详情" width="600px">
      <div v-if="currentRepair" class="detail-content">
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <div class="detail-row">
            <span class="detail-label">设备名称</span>
            <span>{{ currentRepair.equipmentName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">位置</span>
            <span>{{ currentRepair.location }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">设备类型</span>
            <span>{{ getTypeText(currentRepair.type) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">优先级</span>
            <el-tag :type="getPriorityType(currentRepair.priority)" size="small">
              {{ getPriorityText(currentRepair.priority) }}
            </el-tag>
          </div>
          <div class="detail-row">
            <span class="detail-label">问题描述</span>
            <span>{{ currentRepair.description }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">上报人</span>
            <span>{{ currentRepair.reporter }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">提交时间</span>
            <span>{{ currentRepair.submitTime }}</span>
          </div>
          <div v-if="currentRepair.responseTime" class="detail-row">
            <span class="detail-label">响应时间</span>
            <span class="response-time">{{ currentRepair.responseTime }}</span>
          </div>
          <div v-if="currentRepair.overdue" class="overdue-warning">
            <el-icon :size="16" color="#E85D4E"><Warning /></el-icon> 已超时 {{ currentRepair.overdueMinutes }} 分钟未响应，已发送短信/微信提醒
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">处理进度</h4>
          <el-steps :active="currentRepair.progressStep" finish-status="success" align-center>
            <el-step title="待派单" description="" />
            <el-step title="已派单" :description="currentRepair.dispatchTime || '待派单'" />
            <el-step title="维修中" :description="currentRepair.processTime || '待处理'" />
            <el-step title="待验收" :description="currentRepair.pendingAcceptTime || '待验收'" />
            <el-step title="已完成" :description="currentRepair.completeTime || ''" />
          </el-steps>
        </div>

        <div v-if="currentRepair.processSteps && currentRepair.processSteps.length" class="detail-section">
          <h4 class="section-title">全流程跟踪</h4>
          <div class="process-timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(step, idx) in currentRepair.processSteps"
                :key="idx"
                :timestamp="step.time"
                :type="step.type || 'primary'"
                placement="top"
              >
                {{ step.description }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>

        <div v-if="currentRepair.handler" class="detail-section">
          <h4 class="section-title">维修人员</h4>
          <div class="handler-info">
            <div class="handler-avatar"><el-icon :size="24" color="#1E5AA8"><User /></el-icon></div>
            <div class="handler-details">
              <span class="handler-name">{{ currentRepair.handler }}</span>
              <div class="skill-tags">
                <el-tag v-for="skill in currentRepair.skills" :key="skill" size="small" type="info">{{ skill }}</el-tag>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentRepair.processInfo" class="detail-section">
          <h4 class="section-title">维修处理信息</h4>
          <div class="process-info">
            <div v-if="currentRepair.processInfo.photos?.length" class="process-photos">
              <span class="process-label">现场照片</span>
              <div class="photo-list">
                <div v-for="(photo, idx) in currentRepair.processInfo.photos" :key="idx" class="photo-item">
                  <div class="photo-placeholder">📷</div>
                </div>
              </div>
            </div>
            <div v-if="currentRepair.processInfo.parts?.length" class="process-parts">
              <span class="process-label">更换配件条码</span>
              <div class="parts-list">
                <el-tag v-for="(part, idx) in currentRepair.processInfo.parts" :key="idx" size="small">{{ part }}</el-tag>
              </div>
            </div>
            <div v-if="currentRepair.processInfo.signature" class="process-signature">
              <span class="process-label">完工签字确认</span>
              <span class="signature-text">{{ currentRepair.processInfo.signature }}</span>
            </div>
          </div>
        </div>

        <div v-if="getRepairFrequency(currentRepair.equipmentName).thisMonth >= preventiveThreshold" class="detail-section">
          <div class="preventive-alert">
            <span class="alert-icon">🔔</span>
            <div class="alert-content">
              <span class="alert-title">预防性维护提醒</span>
              <span class="alert-desc">
                该设备累计报修 {{ getRepairFrequency(currentRepair.equipmentName).total }} 次，本月 {{ getRepairFrequency(currentRepair.equipmentName).thisMonth }} 次
              </span>
              <span class="alert-desc" v-if="getRepairFrequency(currentRepair.equipmentName).thisMonth >= preventiveThreshold * 2" style="color: #DC2626; font-weight: 600;">
                报修频率过高，强烈建议更换设备或安排专项巡检
              </span>
              <span class="alert-desc" v-else>
                建议进行定期巡检，排查潜在隐患
              </span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <template v-if="currentRepair?.status === 'pending'">
          <el-button type="primary" @click="showDispatchDialog = true">指派维修工</el-button>
        </template>
        <template v-else-if="currentRepair?.status === 'processing'">
          <el-button type="primary" @click="showProcessDialog = true">上报处理情况</el-button>
        </template>
        <template v-else-if="currentRepair?.status === 'awaiting_acceptance'">
          <el-button type="success" @click="acceptRepair(currentRepair)">验收通过</el-button>
        </template>
      </template>
    </el-dialog>

    <el-dialog v-model="showDispatchDialog" title="指派维修工" width="500px">
      <div class="dispatch-form">
        <div class="dispatch-mode">
          <span class="form-label">派单模式</span>
          <el-radio-group v-model="dispatchMode">
            <el-radio label="auto">自动派单</el-radio>
            <el-radio label="manual">手动指派</el-radio>
            <el-radio label="claim">维修工抢单</el-radio>
          </el-radio-group>
        </div>
        <div v-if="dispatchMode !== 'claim'" class="form-item">
          <span class="form-label">选择维修工</span>
          <el-select v-model="selectedWorker" placeholder="请选择维修工" class="w-full">
            <el-option
              v-for="worker in workers"
              :key="worker.id"
              :label="worker.name"
              :value="worker.id"
            >
              <div class="worker-option">
                <span>{{ worker.name }}</span>
                <div class="worker-skills">
                  <el-tag v-for="skill in worker.skills" :key="skill" size="small" type="info">{{ skill }}</el-tag>
                </div>
              </div>
            </el-option>
          </el-select>
        </div>
        <div v-if="dispatchMode !== 'claim' && selectedWorker" class="skill-match">
          <span class="match-label">技能匹配度</span>
          <el-progress :percentage="getSkillMatch()" :stroke-width="8" :color="getSkillMatchColor()" />
        </div>
        <div v-if="dispatchMode === 'claim'" class="claim-mode-note">
          <span class="note-icon"><el-icon :size="16" color="#1E5AA8"><Document /></el-icon></span>
          <div class="note-content">
            <span class="note-title">抢单模式说明</span>
            <span class="note-desc">工单将发布到共享抢单池，所有维修工均可查看并抢单。适合紧急工单需要快速响应的场景。</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDispatchDialog = false">取消</el-button>
        <el-button :type="dispatchMode === 'claim' ? 'warning' : 'primary'" @click="dispatchWorker">
          {{ dispatchMode === 'claim' ? '发布到抢单池' : '确认派单' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showProcessDialog" title="上报处理情况" width="500px">
      <div class="process-form">
        <div class="form-item">
          <span class="form-label">现场处理照片</span>
          <div class="upload-area">
            <el-button :icon="Upload" @click="uploadPhotos">上传照片</el-button>
            <span class="upload-tip">支持JPG/PNG格式，最多4张</span>
          </div>
        </div>
        <div class="form-item">
          <span class="form-label">更换配件条码</span>
          <el-select v-model="selectedParts" multiple placeholder="请选择配件" class="w-full">
            <el-option v-for="part in availableParts" :key="part.code" :label="part.name" :value="part.code">
              <span>{{ part.name }} ({{ part.code }})</span>
            </el-option>
          </el-select>
        </div>
        <div class="form-item">
          <span class="form-label">完工签字确认</span>
          <el-input v-model="signature" placeholder="请输入维修员签字确认" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showProcessDialog = false">取消</el-button>
        <el-button type="primary" @click="submitProcessInfo">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showSettingsDialog" title="维修设置" width="500px">
      <div class="settings-form">
        <div class="setting-item">
          <span class="setting-label">自动派单规则</span>
          <el-switch v-model="autoDispatch" active-text="启用" inactive-text="关闭" />
        </div>
        <div class="setting-item">
          <span class="setting-label">响应超时提醒（分钟）</span>
          <el-input-number v-model="responseTimeout" :min="1" :max="60" />
        </div>
        <div class="setting-item">
          <span class="setting-label">预防性维护阈值</span>
          <span class="setting-hint">设备月报修次数超过此值时触发巡检提醒</span>
          <el-input-number v-model="preventiveThreshold" :min="1" :max="10" />
        </div>
        <div class="setting-item">
          <span class="setting-label">短信/微信提醒</span>
          <el-switch v-model="smsReminder" active-text="启用" inactive-text="关闭" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showSettingsDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showInspectionDialog" title="📋 创建巡检任务" width="500px">
      <div class="inspection-form">
        <div class="form-item">
          <span class="form-label">巡检设备</span>
          <el-input v-model="inspectionForm.equipment" disabled />
        </div>
        <div class="form-item">
          <span class="form-label">设备位置</span>
          <el-input v-model="inspectionForm.location" disabled />
        </div>
        <div class="form-item">
          <span class="form-label">巡检优先级</span>
          <el-radio-group v-model="inspectionForm.priority">
            <el-radio label="high">紧急</el-radio>
            <el-radio label="normal">一般</el-radio>
          </el-radio-group>
        </div>
        <div class="form-item">
          <span class="form-label">指派巡检员</span>
          <el-select v-model="inspectionForm.inspector" placeholder="请选择" class="w-full">
            <el-option v-for="w in workers" :key="w.id" :label="w.name" :value="w.name" />
          </el-select>
        </div>
        <div class="form-item">
          <span class="form-label">计划巡检日期</span>
          <el-date-picker v-model="inspectionForm.planDate" type="date" placeholder="选择日期" class="w-full" />
        </div>
        <div class="form-item">
          <span class="form-label">巡检备注</span>
          <el-input v-model="inspectionForm.notes" type="textarea" :rows="2" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showInspectionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitInspection">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 新建报修弹窗 -->
    <el-dialog v-model="showCreateDialog" title="新建报修申请" width="700px">
      <div class="create-repair-form">
        <!-- 报修方式切换 -->
        <div class="repair-mode-tabs">
          <div :class="['mode-tab', { active: createForm.mode === 'scan' }]" @click="createForm.mode = 'scan'">
            <span class="mode-icon">📱</span>
            <span class="mode-text">扫码报修</span>
          </div>
          <div :class="['mode-tab', { active: createForm.mode === 'manual' }]" @click="createForm.mode = 'manual'">
            <span class="mode-icon"><el-icon :size="16" color="#1E5AA8"><Edit /></el-icon></span>
            <span class="mode-text">手动填报</span>
          </div>
          <div :class="['mode-tab', { active: createForm.mode === 'class' }]" @click="createForm.mode = 'class'">
            <span class="mode-icon">🏫</span>
            <span class="mode-text">班级批量报修</span>
          </div>
        </div>

        <!-- 扫码报修 -->
        <template v-if="createForm.mode === 'scan'">
          <div class="scan-section">
            <div class="qr-scanner">
              <div class="scanner-frame">
                <div class="scan-line"></div>
                <span class="scan-hint">请对准设备二维码</span>
              </div>
              <el-button type="primary" @click="simulateScan">模拟扫码</el-button>
            </div>
            <div v-if="createForm.scanResult" class="scan-result">
              <h4>设备信息</h4>
              <div class="device-info">
                <span>设备名称：{{ createForm.scanResult.equipmentName }}</span>
                <span>位置：{{ createForm.scanResult.location }}</span>
                <span>型号：{{ createForm.scanResult.model }}</span>
                <span>累计报修：{{ createForm.scanResult.repairCount }}次</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 手动填报 -->
        <template v-if="createForm.mode === 'manual' || createForm.mode === 'scan'">
          <el-form :model="createForm" label-width="100px">
            <el-form-item label="设备类型">
              <el-select v-model="createForm.type" placeholder="请选择设备类型" class="w-full">
                <el-option label="球类器材" value="balls" />
                <el-option label="田径器材" value="athletics" />
                <el-option label="场地设施" value="field" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="设备名称">
              <el-input v-model="createForm.equipmentName" placeholder="请输入设备名称" />
            </el-form-item>
            <el-form-item label="位置">
              <el-input v-model="createForm.location" placeholder="请输入设备位置" />
            </el-form-item>
            <el-form-item label="紧急程度">
              <el-radio-group v-model="createForm.priority">
                <el-radio label="high">紧急</el-radio>
                <el-radio label="normal">一般</el-radio>
                <el-radio label="low">低</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="故障现象">
              <el-select v-model="createForm.faultType" placeholder="请选择故障现象" class="w-full">
                <el-option label="设备损坏" value="broken" />
                <el-option label="性能下降" value="degraded" />
                <el-option label="安全隐患" value="safety" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="问题描述">
              <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="请描述故障详情（如：篮筐松动、电线破损、灯光闪烁）" @input="onDescInput" />
            </el-form-item>
            
            <!-- 智能填报 - 关键词实时推送 -->
            <div v-if="matchedKeywords.length > 0" class="knowledge-section">
              <h4>🤖 智能匹配到 {{ matchedKeywords.length }} 个关键词</h4>
              <div class="keyword-tags">
                <el-tag v-for="kw in matchedKeywords" :key="kw.keyword" class="keyword-tag" @click="applyKeyword(kw)" effect="plain">
                  {{ kw.keyword }} → {{ kw.solution }}
                </el-tag>
              </div>
            </div>

            <!-- 智能填报 - 故障知识库（选故障类型后） -->
            <div v-if="createForm.faultType" class="knowledge-section">
              <h4>💡 可能的解决方案</h4>
              <div v-for="(solution, idx) in getFaultSolutions(createForm.faultType)" :key="idx" class="solution-item">
                <span class="solution-number">{{ idx + 1 }}</span>
                <span class="solution-text">{{ solution }}</span>
              </div>
            </div>

            <!-- 历史报修智能联想 -->
            <div v-if="suggestedHistory.length > 0" class="knowledge-section">
              <h4>📚 历史相似报修（点击快速填充）</h4>
              <div class="history-ai-list">
                <div v-for="(record, idx) in suggestedHistory" :key="'h-'+idx" class="history-ai-item" @click="fillFromHistory(record)">
                  <div class="history-ai-main">
                    <span class="history-ai-name">{{ record.equipmentName }}</span>
                    <span class="history-ai-desc">{{ record.description }}</span>
                  </div>
                  <div class="history-ai-meta">
                    <el-tag size="small" :type="record.similarity >= 80 ? 'success' : record.similarity >= 50 ? 'warning' : 'info'">相似度 {{ record.similarity }}%</el-tag>
                    <span class="history-ai-time">{{ record.submitTime }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 多媒体上传 -->
            <el-form-item label="现场照片">
              <div class="upload-area">
                <el-upload drag multiple action="/upload" :auto-upload="false" :file-list="createForm.photos">
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">拖拽或点击上传照片</div>
                  <template #tip>支持JPG/PNG格式，最多4张</template>
                </el-upload>
              </div>
            </el-form-item>
            <el-form-item label="语音描述">
              <div class="voice-recorder">
                <el-button :icon="createForm.recording ? 'Square' : 'Circle'" @click="toggleRecording">
                  {{ createForm.recording ? '停止录音' : '开始录音' }}
                </el-button>
                <span v-if="createForm.voiceDuration">{{ createForm.voiceDuration }}秒</span>
              </div>
            </el-form-item>
          </el-form>
        </template>

        <!-- 班级批量报修 -->
        <template v-if="createForm.mode === 'class'">
          <el-form :model="createForm" label-width="100px">
            <el-form-item label="责任班级">
              <el-select v-model="createForm.responsibleClass" placeholder="请选择班级" class="w-full">
                <el-option label="四年级1班" value="class41" />
                <el-option label="四年级2班" value="class42" />
                <el-option label="五年级1班" value="class51" />
                <el-option label="五年级2班" value="class52" />
                <el-option label="六年级1班" value="class61" />
                <el-option label="六年级2班" value="class62" />
              </el-select>
            </el-form-item>
            <el-form-item label="报修设备列表">
              <div class="equipment-list">
                <div v-for="(item, idx) in createForm.equipmentList" :key="idx" class="equipment-item">
                  <el-input v-model="item.name" placeholder="设备名称" style="width: 150px" />
                  <el-input v-model="item.issue" placeholder="问题描述" style="width: 200px" />
                  <el-button @click="removeEquipment(idx)" type="danger" size="small">删除</el-button>
                </div>
                <el-button @click="addEquipment" type="primary" size="small">+ 添加设备</el-button>
              </div>
            </el-form-item>
            <el-form-item label="统一描述">
              <el-input v-model="createForm.classDescription" type="textarea" :rows="2" placeholder="适用于所有设备的统一问题描述" />
            </el-form-item>
          </el-form>
        </template>

        <!-- 历史记录复用 -->
        <div v-if="userHistory.length > 0" class="history-section">
          <h4><el-icon :size="16" color="#1E5AA8"><Document /></el-icon> 历史报修记录（点击快速填充）</h4>
          <div class="history-list">
            <div v-for="(record, idx) in userHistory" :key="idx" class="history-item" @click="fillFromHistory(record)">
              <span class="history-name">{{ record.equipmentName }}</span>
              <span class="history-location">{{ record.location }}</span>
              <span class="history-time">{{ record.submitTime }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交报修</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { Plus, Download, Search, Refresh, Upload, Warning, User, Document, Edit, Setting } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import echarts from '@/utils/echarts'
import ExamTable from '@/components/table/ExamTable.vue'
import { usePersistedRef } from '@/composables'
import store from '@/store/global'
import { mockDB } from '@/mock'
import { generateDeterministicId } from '@/utils/seededRandom'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const searchQuery = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const filterType = ref('')
const showDetail = ref(false)
const showDispatchDialog = ref(false)
const showProcessDialog = ref(false)
const showSettingsDialog = ref(false)
const dispatchMode = ref('auto')
const selectedWorker = ref('')
const selectedParts = ref([])
const signature = ref('')
const autoDispatch = ref(true)
const responseTimeout = ref(5)
const preventiveThreshold = ref(3)
const smsReminder = ref(true)
const currentRepair = ref(null)
const currentPage = ref(1)
const pageSize = ref(12)
const claimPool = ref([])
const initClaimPool = () => {
  try {
    const raw = sessionStorage.getItem(`claim_pool_${schoolId.value}`)
    claimPool.value = raw ? JSON.parse(raw) : []
  } catch { claimPool.value = [] }
}
const saveClaimPool = () => {
  sessionStorage.setItem(`claim_pool_${schoolId.value}`, JSON.stringify(claimPool.value))
}
watch(claimPool, () => { saveClaimPool() }, { deep: true })
watch(schoolId, () => { initClaimPool() })
let escalationTimer = null
const currentUser = computed(() => ({
  name: schoolId.value === 'hailin-zirong-primary' ? '子荣维修工' : schoolId.value === 'linhai-experimental-primary' ? '林海维修工' : '二小维修工',
  id: 99
}))

// 按学校差异化维修工人
const workers = computed(() => {
  const sid = schoolId.value
  if (sid === 'hailin-zirong-primary') {
    return [
      { id: 1, name: '孙师傅', skills: ['球类器材', '场地设施'] },
      { id: 2, name: '周师傅', skills: ['球类器材', '田径器材'] },
      { id: 3, name: '吴师傅', skills: ['电器维修', '球类器材'] },
    ]
  } else if (sid === 'linhai-experimental-primary') {
    return [
      { id: 1, name: '郑师傅', skills: ['动力设备', '场地设施'] },
      { id: 2, name: '冯师傅', skills: ['电器维修', '动力设备'] },
      { id: 3, name: '陈师傅', skills: ['场地设施', '泳池设备'] },
      { id: 4, name: '褚师傅', skills: ['田径器材', '电器维修'] },
    ]
  }
  return [
    { id: 1, name: '张师傅', skills: ['球类器材', '场地设施'] },
    { id: 2, name: '李师傅', skills: ['田径器材', '动力设备'] },
    { id: 3, name: '王师傅', skills: ['球类器材', '田径器材', '场地设施'] },
    { id: 4, name: '赵师傅', skills: ['电器维修', '动力设备'] },
  ]
})

// 按学校差异化备件库
const availableParts = computed(() => {
  const sid = schoolId.value
  if (sid === 'hailin-zirong-primary') {
    return [
      { code: 'ZR-P001', name: '排球网' },
      { code: 'ZR-P002', name: '足球网' },
      { code: 'ZR-P003', name: '篮球网' },
      { code: 'ZR-P004', name: '跳绳手柄' },
      { code: 'ZR-P005', name: '螺丝配件包' },
    ]
  } else if (sid === 'linhai-experimental-primary') {
    return [
      { code: 'LH-P001', name: '空调滤网' },
      { code: 'LH-P002', name: '泳池滤芯' },
      { code: 'LH-P003', name: '跑道灯管' },
      { code: 'LH-P004', name: '草坪修剪刀片' },
      { code: 'LH-P005', name: '螺丝配件包' },
    ]
  }
  return [
    { code: 'HL-P001', name: '篮球网' },
    { code: 'HL-P002', name: '足球网' },
    { code: 'HL-P003', name: '羽毛球网' },
    { code: 'HL-P004', name: '跳绳手柄' },
    { code: 'HL-P005', name: '跑步机皮带' },
    { code: 'HL-P006', name: '螺丝配件包' },
  ]
})

// 新建报修表单
const showCreateDialog = ref(false)
const createForm = ref({
  mode: 'manual',
  type: '',
  equipmentName: '',
  location: '',
  priority: 'normal',
  faultType: '',
  description: '',
  photos: [],
  recording: false,
  voiceDuration: 0,
  scanResult: null,
  responsibleClass: '',
  equipmentList: [{ name: '', issue: '' }],
  classDescription: ''
})

// 故障知识库（故障类型 → 解决方案）
const faultKnowledgeBase = {
  broken: [
    '检查设备是否有明显破损或断裂',
    '确认是否需要更换配件',
    '联系维修人员进行更换',
    '记录设备编号以便后续跟踪'
  ],
  degraded: [
    '检查设备是否需要润滑',
    '查看使用频率是否过高',
    '建议进行预防性维护',
    '检查是否有零部件松动'
  ],
  safety: [
    '立即停止使用该设备',
    '设置警示标识',
    '通知相关负责人',
    '优先安排紧急维修'
  ],
  other: [
    '详细描述问题现象',
    '提供现场照片',
    '记录问题发生时间',
    '联系维修部门'
  ]
}

// 关键词智能匹配库（关键词 → 解决方案 / 建议）
const keywordKnowledgeBase = [
  { keywords: ['松动', '螺丝', '摇晃', '不牢'], solution: '检查紧固件，建议立即上紧或更换螺丝包', faultType: 'safety' },
  { keywords: ['破损', '破洞', '撕裂', '断裂'], solution: '部件已损坏，需更换配件', faultType: 'broken' },
  { keywords: ['漏电', '触电', '电线', '短路', '冒烟'], solution: '⚠️ 用电安全！立即断电，安排电工紧急处理', faultType: 'safety', priority: 'high' },
  { keywords: ['黑屏', '不亮', '没反应', '故障', '失灵'], solution: '电子设备故障，先断电重启测试，不行送修', faultType: 'degraded' },
  { keywords: ['闪烁', '忽明忽暗'], solution: '接触不良或灯管老化，建议更换灯管/检查线路', faultType: 'degraded' },
  { keywords: ['充气', '气压', '扁', '气不足'], solution: '需充气或更换内胆', faultType: 'broken' },
  { keywords: ['网', '球网', '篮筐', '框'], solution: '球类器材损坏，建议整体更换配件', faultType: 'broken' },
  { keywords: ['计数', '不准', '算错'], solution: '计数器校准或更换电池', faultType: 'degraded' },
  { keywords: ['空调', '制冷', '制热', '漏水'], solution: '空调故障，建议清洗滤网/补充冷媒', faultType: 'degraded' },
  { keywords: ['水压', '漏水', '堵塞', '过滤'], solution: '水管/过滤系统问题，清理或更换滤芯', faultType: 'degraded' },
  { keywords: ['灯', '照明', '灯光'], solution: '照明系统，更换灯管/检查线路', faultType: 'degraded' },
  { keywords: ['锁', '门', '钥匙'], solution: '门锁损坏，更换锁芯或维修', faultType: 'broken' },
  { keywords: ['皮带', '跑', '跑步机'], solution: '运动器材皮带打滑/磨损，需更换皮带', faultType: 'degraded' },
  { keywords: ['噪音', '响', '异响', '震动'], solution: '异常振动/异响，立即停机检查轴承/螺丝', faultType: 'safety' },
  { keywords: ['生锈', '腐蚀', '氧化'], solution: '金属部件锈蚀，除锈刷漆或更换', faultType: 'broken' },
  { keywords: ['滑', '倒', '湿'], solution: '⚠️ 滑倒风险！立即设置警示，擦干地面', faultType: 'safety', priority: 'high' },
]

// 实时匹配到的关键词（前端 DEMO：描述输入时触发）
const matchedKeywords = computed(() => {
  const desc = createForm.value.description || ''
  if (!desc.trim()) return []
  const results = []
  for (const item of keywordKnowledgeBase) {
    const hitKw = item.keywords.find(kw => desc.includes(kw))
    if (hitKw) {
      results.push({ ...item, keyword: hitKw })
    }
  }
  return results.slice(0, 5)
})

// 实时触发：关键词命中时自动建议故障类型
const onDescInput = () => {
  if (matchedKeywords.value.length > 0 && !createForm.value.faultType) {
    const first = matchedKeywords.value[0]
    if (first.faultType) {
      createForm.value.faultType = first.faultType
      if (first.priority) createForm.value.priority = first.priority
      ElMessage.info(`已根据关键词「${first.keyword}」自动设置故障类型`)
    }
  }
}

// 点击关键词应用到描述
const applyKeyword = (kw) => {
  const tip = `【建议】${kw.solution}`
  if (!createForm.value.description.includes(tip)) {
    createForm.value.description = (createForm.value.description + '\n' + tip).trim()
  }
  if (kw.faultType) createForm.value.faultType = kw.faultType
  if (kw.priority) createForm.value.priority = kw.priority
  ElMessage.success('已应用建议')
}

// 历史报修智能联想（相似度计算）
const suggestedHistory = computed(() => {
  const desc = createForm.value.description || ''
  if (!desc.trim()) return []
  const currentKw = matchedKeywords.value.map(k => k.keyword)
  
  const scored = repairs.value
    .filter(r => r.status !== 'pending')  // 排除还没完成的
    .map(r => {
      let score = 0
      // 关键词命中
      if (r.description) {
        for (const kw of currentKw) {
          if (r.description.includes(kw)) score += 30
        }
      }
      // 类型匹配
      if (r.type === createForm.value.type) score += 20
      // 设备名包含
      if (createForm.value.equipmentName && r.equipmentName.includes(createForm.value.equipmentName)) score += 25
      return { ...r, similarity: Math.min(99, score + 10) }
    })
    .filter(r => r.similarity >= 30)
    .sort((a, b) => b.similarity - a.similarity)
  
  return scored.slice(0, 3)
})

// 用户历史报修记录
const userHistory = computed(() => {
  const sid = schoolId.value
  if (sid === 'hailin-zirong-primary') {
    return [
      { equipmentName: '排球架1号', location: '排球场', submitTime: '2026-01-12', type: 'balls', description: '球网破损' },
      { equipmentName: '足球门2号', location: '足球场', submitTime: '2026-01-06', type: 'balls', description: '门框变形' },
      { equipmentName: '跳绳计数器', location: '体测室', submitTime: '2025-12-30', type: 'electronics', description: '计数不准' }
    ]
  } else if (sid === 'linhai-experimental-primary') {
    return [
      { equipmentName: '体育馆空调3号', location: '体育馆', submitTime: '2026-01-15', type: 'electronics', description: '制冷异常' },
      { equipmentName: '泳池过滤系统', location: '游泳馆', submitTime: '2026-01-08', type: 'facility', description: '水压不足' },
      { equipmentName: '跑道照明灯5号', location: '田径场', submitTime: '2025-12-25', type: 'facility', description: '灯光闪烁' }
    ]
  }
  return [
    { equipmentName: '篮球架A区1号', location: '篮球场A区', submitTime: '2026-01-10', type: 'field', description: '篮筐松动' },
    { equipmentName: '乒乓球台3号', location: '乒乓球区', submitTime: '2026-01-05', type: 'balls', description: '台面裂纹' },
    { equipmentName: '跑步机03号', location: '健身房', submitTime: '2025-12-28', type: 'athletics', description: '显示屏故障' }
  ]
})

const getFaultSolutions = (faultType) => {
  return faultKnowledgeBase[faultType] || faultKnowledgeBase.other
}

const simulateScan = () => {
  createForm.value.scanResult = {
    equipmentName: '篮球架A区1号',
    location: '篮球场A区',
    model: 'LQ-2023-A',
    repairCount: 3
  }
  createForm.value.equipmentName = '篮球架A区1号'
  createForm.value.location = '篮球场A区'
  ElMessage.success('扫码成功，已自动填充设备信息')
}

const addEquipment = () => {
  createForm.value.equipmentList.push({ name: '', issue: '' })
}

const removeEquipment = (idx) => {
  if (createForm.value.equipmentList.length > 1) {
    createForm.value.equipmentList.splice(idx, 1)
  }
}

const toggleRecording = () => {
  if (createForm.value.recording) {
    createForm.value.recording = false
    ElMessage.success(`录音完成，时长 ${createForm.value.voiceDuration} 秒`)
  } else {
    createForm.value.recording = true
    createForm.value.voiceDuration = 0
    const timer = setInterval(() => {
      if (createForm.value.recording) {
        createForm.value.voiceDuration++
      } else {
        clearInterval(timer)
      }
    }, 1000)
    ElMessage.info('开始录音...')
  }
}

const fillFromHistory = (record) => {
  createForm.value.equipmentName = record.equipmentName
  createForm.value.location = record.location
  createForm.value.type = record.type
  createForm.value.description = record.description
  ElMessage.success('已从历史记录填充')
}

// 添加流程跟踪步骤
const addProcessStep = (order, description, type = 'primary') => {
  if (!order.processSteps) order.processSteps = []
  order.processSteps.push({
    time: new Date().toLocaleString('zh-CN'),
    description,
    type
  })
}

// 检查超时工单并自动升级
const checkEscalation = () => {
  const now = Date.now()
  repairs.value.forEach(order => {
    if (order.status === 'pending' || order.status === 'assigned') {
      const submitTs = order._submitTs || (order.submitTime ? new Date(order.submitTime).getTime() : now)
      if (!order._submitTs && order.submitTime) {
        order._submitTs = submitTs
      }
      const elapsed = now - submitTs
      const overdueThreshold = order.priority === 'high' ? 5 * 60 * 1000 : 30 * 60 * 1000
      if (elapsed > overdueThreshold && !order.escalated) {
        order.escalated = true
        order.escalationLevel = (order.escalationLevel || 0) + 1
        order.overdue = true
        order.overdueMinutes = Math.floor(elapsed / 60000)
        addProcessStep(order, `工单超时未处理（已超${Math.floor(elapsed / 60000)}分钟），自动升级处理`, 'danger')
        ElMessage.warning(`工单 #${order.id} 已超时，已自动升级处理`)
      } else if (elapsed > overdueThreshold && order.escalated) {
        const level = order.escalationLevel || 1
        const nextThreshold = level * 15 * 60 * 1000
        if (elapsed > nextThreshold + overdueThreshold) {
          order.escalationLevel = level + 1
          addProcessStep(order, `第${order.escalationLevel}次升级，超时${Math.floor(elapsed / 60000)}分钟`, 'danger')
          ElMessage.warning(`工单 #${order.id} 已第${order.escalationLevel}次升级`)
        }
      }
    }
  })
}

// 抢单功能
const claimOrder = (order) => {
  ElMessageBox.confirm(
    `确认抢单：${order.equipmentName}（${order.location}）？抢单后需在30分钟内完成维修。`,
    '抢单确认',
    { confirmButtonText: '确认抢单', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    const repair = repairs.value.find(r => r.id === order.id)
    if (repair) {
      repair.status = 'processing'
      repair.progressStep = 2
      repair.claimed = true
      repair.claimedAt = new Date().toLocaleString('zh-CN')
      repair.handler = currentUser.value.name
      repair.skills = ['综合维修']
      repair.dispatchTime = new Date().toLocaleString('zh-CN')
      repair.responseTime = new Date().toLocaleString('zh-CN')
      addProcessStep(repair, `${currentUser.value.name} 抢单成功，开始维修`, 'success')
      claimPool.value = claimPool.value.filter(o => o.id !== order.id)
      ElMessage.success(`抢单成功！请在30分钟内完成维修`)
    }
  }).catch(() => {})
}

const submitRepair = () => {
  if (!createForm.value.equipmentName || !createForm.value.location) {
    ElMessage.warning('请填写设备名称和位置')
    return
  }
  
  const newRepair = {
    id: generateDeterministicId('BX', createForm.value.equipmentName + '-' + createForm.value.location),
    equipmentName: createForm.value.equipmentName,
    location: createForm.value.location,
    type: createForm.value.type || 'other',
    priority: createForm.value.priority,
    description: createForm.value.description,
    status: 'pending',
    reporter: '当前用户',
    submitTime: new Date().toLocaleString('zh-CN'),
    progressStep: 0,
    processSteps: [{ time: new Date().toLocaleString('zh-CN'), description: '报修提交', type: 'primary' }],
    _submitTs: Date.now()
  }
  
  // 根据当前派单模式处理
  if (dispatchMode.value === 'claim') {
    newRepair.status = 'pending'
    newRepair.claimable = true
    claimPool.value.unshift(newRepair)
    repairs.value.unshift(newRepair)
    ElMessage.success('报修已发布到抢单池，等待维修工抢单')
  } else if (autoDispatch.value && dispatchMode.value === 'auto') {
    const repairType = newRepair.type
    const worker = workers.value.find(w => w.skills.some(skill => getTypeText(repairType).includes(skill) || skill.includes(getTypeText(repairType))))
    if (worker) {
      newRepair.handler = worker.name
      newRepair.skills = worker.skills
      newRepair.status = 'processing'
      newRepair.progressStep = 2
      newRepair.dispatchTime = new Date().toLocaleString('zh-CN')
      newRepair.processSteps.push({ time: new Date().toLocaleString('zh-CN'), description: `系统自动派单给${worker.name}`, type: 'success' })
    }
    repairs.value.unshift(newRepair)
  } else {
    repairs.value.unshift(newRepair)
  }
  showCreateDialog.value = false
  createForm.value = {
    mode: 'manual',
    type: '',
    equipmentName: '',
    location: '',
    priority: 'normal',
    faultType: '',
    description: '',
    photos: [],
    recording: false,
    voiceDuration: 0,
    scanResult: null,
    responsibleClass: '',
    equipmentList: [{ name: '', issue: '' }],
    classDescription: ''
  }
  if (dispatchMode.value !== 'claim') {
    ElMessage.success('报修申请已提交')
  }
}

const createRepair = () => {
  showCreateDialog.value = true
}

const statusChart = ref(null)
const typeChart = ref(null)
let statusChartInstance = null
let typeChartInstance = null

const stats = computed(() => {
  const list = repairs.value || []
  const now = new Date()
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
  const monthList = list.filter(r => r.submitTime && r.submitTime.startsWith(currentMonth))
  const pending = list.filter(r => r.status === 'pending').length
  const processing = list.filter(r => r.status === 'processing').length
  const awaitingAcceptance = list.filter(r => r.status === 'awaiting_acceptance').length
  const completed = list.filter(r => r.status === 'completed').length
  return { pending, processing, awaitingAcceptance, completed, total: monthList.length }
})

const statusDistribution = computed(() => {
  const list = repairs.value || []
  const total = list.length || 1
  const colorMap = { pending: '#F5A623', processing: '#3B82F6', awaiting_acceptance: '#8B5CF6', completed: '#1E5AA8' }
  const nameMap = { pending: '待处理', processing: '处理中', awaiting_acceptance: '待验收', completed: '已完成' }
  const counts = {}
  list.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1 })
  return Object.entries(counts).map(([status, count]) => ({
    name: nameMap[status] || status,
    count,
    percent: +(count / total * 100).toFixed(1),
    color: colorMap[status] || '#999'
  }))
})

const typeStats = computed(() => {
  const list = repairs.value || []
  const counts = {}
  list.forEach(r => {
    const label = getTypeText(r.type)
    counts[label] = (counts[label] || 0) + 1
  })
  return Object.entries(counts).map(([name, count]) => ({ name, count }))
})

const repairColumns = ref([
  { prop: 'id', label: '报修编号', minWidth: '140' },
  { prop: 'equipmentName', label: '设备名称', minWidth: '140' },
  { prop: 'location', label: '位置', minWidth: '120' },
  { slot: 'type', label: '设备类型', minWidth: '120' },
  { slot: 'priority', label: '优先级', minWidth: '100' },
  { prop: 'description', label: '问题描述' },
  { slot: 'status', label: '状态', minWidth: '100' },
  { prop: 'submitTime', label: '提交时间', minWidth: '140' },
])

const defaultRepairs = computed(() => {
  const sid = store.state.school.id || 'hailin-second-primary'
  const teachers = mockDB[sid]?.teachers || []
  const t = (i) => teachers[i % teachers.length]?.name || '张老师'

  if (sid === 'hailin-zirong-primary') {
    // 子荣小学：球类器材为主
    return [
      { id: 'BX-ZR-001', equipmentName: '排球网A区', location: '排球场', type: 'balls', priority: 'high', description: '排球网中间破洞，无法使用', status: 'pending', reporter: t(0), submitTime: '2026-01-16 08:00', progressStep: 0 },
      { id: 'BX-ZR-002', equipmentName: '足球门1号', location: '足球场', type: 'balls', priority: 'normal', description: '球门网脱落需要重新安装', status: 'pending', reporter: t(1), submitTime: '2026-01-15 14:30', progressStep: 0 },
      { id: 'BX-ZR-003', equipmentName: '篮球5号球', location: '体育器材室', type: 'balls', priority: 'normal', description: '3个篮球气压不足，需充气', status: 'processing', reporter: t(2), submitTime: '2026-01-15 10:00', progressStep: 2, handler: '器材管理员' },
      { id: 'BX-ZR-004', equipmentName: '羽毛球拍套装', location: '羽毛球场', type: 'balls', priority: 'normal', description: '拍线断裂2副', status: 'completed', reporter: t(3), submitTime: '2026-01-14 09:00', progressStep: 4, handler: '张师傅', completeTime: '2026-01-14 15:00' },
      { id: 'BX-ZR-005', equipmentName: '乒乓球发球机', location: '乒乓球室', type: 'balls', priority: 'high', description: '发球机卡球，电机异响', status: 'processing', reporter: t(0), submitTime: '2026-01-14 11:00', progressStep: 2, handler: '李师傅' },
    ]
  } else if (sid === 'linhai-experimental-primary') {
    // 林海实验小学：场地设施为主
    return [
      { id: 'BX-LH-001', equipmentName: '体育馆空调', location: '体育馆', type: 'field', priority: 'high', description: '空调制热功能失效，无法正常使用', status: 'pending', reporter: t(0), submitTime: '2026-01-16 07:30', progressStep: 0, overdue: true, overdueMinutes: 24 },
      { id: 'BX-LH-002', equipmentName: '跑道照明灯', location: '田径场', type: 'field', priority: 'normal', description: '西侧3盏照明灯不亮', status: 'pending', reporter: t(1), submitTime: '2026-01-15 16:00', progressStep: 0 },
      { id: 'BX-LH-003', equipmentName: '看台座椅', location: '田径场', type: 'field', priority: 'normal', description: '12排有5个座椅松动', status: 'processing', reporter: t(2), submitTime: '2026-01-15 09:00', progressStep: 2, handler: '王师傅' },
      { id: 'BX-LH-004', equipmentName: '广播系统', location: '操场', type: 'field', priority: 'high', description: '广播喇叭有2个无声音', status: 'completed', reporter: t(3), submitTime: '2026-01-13 08:00', progressStep: 4, handler: '电工班', completeTime: '2026-01-13 16:00' },
      { id: 'BX-LH-005', equipmentName: '泳池过滤系统', location: '游泳馆', type: 'field', priority: 'high', description: '过滤泵压力不足，水质浑浊', status: 'pending', reporter: t(0), submitTime: '2026-01-16 10:00', progressStep: 0 },
      { id: 'BX-LH-006', equipmentName: '更衣室门锁', location: '游泳馆', type: 'field', priority: 'normal', description: '3号更衣室门锁损坏', status: 'completed', reporter: t(1), submitTime: '2026-01-12 14:00', progressStep: 4, handler: '维修组', completeTime: '2026-01-12 17:00' },
    ]
  } else {
    // 海林市第二小学：田径器材为主
    return [
      { id: 'BX-HL-001', equipmentName: '篮球架A区1号', location: '篮球场A区', type: 'field', priority: 'high', description: '篮筐松动，存在安全隐患', status: 'pending', reporter: t(0), submitTime: '2026-01-15 09:30', progressStep: 0, overdue: true, overdueMinutes: 8 },
      { id: 'BX-HL-002', equipmentName: '足球门B区2号', location: '足球场B区', type: 'field', priority: 'normal', description: '球门网破损', status: 'pending', reporter: t(1), submitTime: '2026-01-15 10:15', progressStep: 0 },
      { id: 'BX-HL-003', equipmentName: '跑步机03号', location: '健身房', type: 'athletics', priority: 'high', description: '显示屏黑屏，无法启动', status: 'processing', reporter: t(3), submitTime: '2026-01-14 14:20', progressStep: 2, handler: '李师傅' },
      { id: 'BX-HL-004', equipmentName: '单杠2号', location: '田径场', type: 'athletics', priority: 'normal', description: '杠铃片松动', status: 'completed', reporter: t(1), submitTime: '2026-01-14 09:00', progressStep: 4, handler: '王师傅', completeTime: '2026-01-14 14:30' },
      { id: 'BX-HL-005', equipmentName: '铅球投掷架', location: '田径场', type: 'athletics', priority: 'normal', description: '支架螺丝松动', status: 'completed', reporter: t(0), submitTime: '2026-01-13 10:30', progressStep: 4, handler: '维修组', completeTime: '2026-01-13 14:00' },
    ]
  }
})

// 使用持久化存储，每个学校独立数据
const repairs = usePersistedRef(computed(() => `repairs_${schoolId.value}`), defaultRepairs.value)

const filteredRepairs = computed(() => {
  return repairs.value.filter(repair => {
    const matchSearch = !searchQuery.value ||
      repair.equipmentName.includes(searchQuery.value) ||
      repair.location.includes(searchQuery.value)
    const matchStatus = !filterStatus.value ||
      (filterStatus.value === 'claimPool' ? (repair.claimable && !repair.claimed && repair.status === 'pending') : repair.status === filterStatus.value)
    const matchPriority = !filterPriority.value || repair.priority === filterPriority.value
    const matchType = !filterType.value || repair.type === filterType.value
    return matchSearch && matchStatus && matchPriority && matchType
  })
})

// 抢单池中的工单列表
const claimPoolOrders = computed(() => {
  return repairs.value.filter(r => r.claimable && !r.claimed && r.status === 'pending')
})

// 按优先级和时间排序（分级响应）
const sortedRepairs = computed(() => {
  return [...filteredRepairs.value].sort((a, b) => {
    const priorityWeight = { high: 0, normal: 1, low: 2 }
    const statusWeight = (item) => {
      if (item.status === 'pending' && item.escalated) return 0
      if (item.status === 'pending') return 1
      if (item.status === 'processing') return 2
      if (item.status === 'awaiting_acceptance') return 3
      return 4
    }
    const sw = statusWeight(a) - statusWeight(b)
    if (sw !== 0) return sw
    const pw = (priorityWeight[a.priority] || 1) - (priorityWeight[b.priority] || 1)
    if (pw !== 0) return pw
    return 0
  })
})

// 获取设备维修频率（预防性维护）
const getRepairFrequency = (equipmentName) => {
  const count = repairs.value.filter(r => r.equipmentName === equipmentName).length
  const thisMonth = repairs.value.filter(r => {
    if (r.equipmentName !== equipmentName) return false
    const d = new Date(r.submitTime)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  return { total: count, thisMonth }
}

// 全局巡检预警：统计所有高频损坏设备
const preventiveInspections = computed(() => {
  // 按设备名聚合报修次数
  const equipmentMap = {}
  repairs.value.forEach(r => {
    if (!equipmentMap[r.equipmentName]) {
      equipmentMap[r.equipmentName] = {
        equipment: r.equipmentName,
        location: r.location,
        type: r.type,
        total: 0,
        thisMonth: 0,
        lastRepair: r.submitTime
      }
    }
    equipmentMap[r.equipmentName].total++
    const d = new Date(r.submitTime)
    const now = new Date()
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      equipmentMap[r.equipmentName].thisMonth++
    }
    if (r.submitTime > equipmentMap[r.equipmentName].lastRepair) {
      equipmentMap[r.equipmentName].lastRepair = r.submitTime
    }
  })
  
  // 筛选本月报修 >= 阈值 的设备
  const result = Object.values(equipmentMap)
    .filter(item => item.thisMonth >= preventiveThreshold.value)
    .sort((a, b) => b.thisMonth - a.thisMonth || b.total - a.total)
  
  return result
})

// 预防性维护弹窗
const showInspectionDialog = ref(false)
const inspectionForm = ref({
  equipment: '',
  location: '',
  priority: 'normal',
  inspector: '',
  planDate: '',
  notes: ''
})

const createInspectionTask = (item) => {
  inspectionForm.value = {
    equipment: item.equipment,
    location: item.location,
    priority: item.thisMonth >= preventiveThreshold.value * 2 ? 'high' : 'normal',
    inspector: workers.value[0]?.name || '',
    planDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: `本月报修 ${item.thisMonth} 次，累计 ${item.total} 次。建议全面排查潜在隐患。`
  }
  showInspectionDialog.value = true
}

const submitInspection = () => {
  ElMessage.success(`巡检任务已创建：${inspectionForm.value.equipment} → ${inspectionForm.value.inspector} 负责`)
  showInspectionDialog.value = false
}

const viewEquipmentHistory = (item) => {
  // 筛选该设备所有报修记录
  const history = repairs.value.filter(r => r.equipmentName === item.equipment)
  ElMessageBox.alert(
    history.map(h => `[${h.submitTime}] ${getStatusText(h.status)} - ${h.description}`).join('\n'),
    `${item.equipment} 报修历史（共 ${history.length} 条）`,
    { confirmButtonText: '关闭' }
  )
}

const getTypeText = (type) => {
  const map = { balls: '球类器材', athletics: '田径器材', field: '场地设施', other: '其他' }
  return map[type] || type
}

const getPriorityType = (priority) => {
  if (priority === 'high') return 'danger'
  if (priority === 'normal') return 'warning'
  return 'info'
}

const getPriorityText = (priority) => {
  if (priority === 'high') return '紧急'
  if (priority === 'normal') return '一般'
  return '低'
}

const getStatusClass = (status) => {
  if (status === 'pending') return 'status-warning'
  if (status === 'processing') return 'status-primary'
  if (status === 'completed') return 'status-success'
  return 'status-info'
}

const getPriorityClass = (priority) => {
  if (priority === 'high') return 'status-danger'
  if (priority === 'normal') return 'status-warning'
  return 'status-info'
}

const getStatusText = (status) => {
  if (status === 'pending') return '待处理'
  if (status === 'processing') return '处理中'
  if (status === 'completed') return '已完成'
  return '已取消'
}

const initStatusChart = () => {
  if (!statusChart.value) return
  if (statusChartInstance) { statusChartInstance.dispose(); statusChartInstance = null }
  statusChartInstance = echarts.init(statusChart.value)

  // 从 repairs 数据动态统计各状态数量
  const statusCount = { pending: 0, processing: 0, awaiting_acceptance: 0, completed: 0 }
  repairs.value.forEach(r => {
    if (statusCount[r.status] !== undefined) statusCount[r.status]++
    else statusCount.pending++
  })

  statusChartInstance.setOption({
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#6B7280' } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      animationType: 'expansion',
      animationDurationUpdate: 500,
      data: [
        { value: statusCount.pending, name: '待处理', itemStyle: { color: '#F5A623' } },
        { value: statusCount.processing, name: '处理中', itemStyle: { color: '#3B82F6' } },
        { value: statusCount.completed, name: '已完成', itemStyle: { color: '#1E5AA8' } }
      ]
    }]
  })
}

const initTypeChart = () => {
  if (!typeChart.value) return
  if (typeChartInstance) { typeChartInstance.dispose(); typeChartInstance = null }
  typeChartInstance = echarts.init(typeChart.value)

  // 从 repairs 数据动态统计各类型数量
  const typeCount = {}
  repairs.value.forEach(r => {
    const typeText = getTypeText(r.type)
    typeCount[typeText] = (typeCount[typeText] || 0) + 1
  })
  const typeColors = { '球类器材': '#F5A623', '田径器材': '#3B82F6', '场地设施': '#1E5AA8', '其他': '#9CA3AF' }
  const typeEntries = Object.entries(typeCount)
  const categories = typeEntries.length > 0 ? typeEntries.map(([name]) => name) : typeStats.value.map(i => i.name)
  const chartData = categories.map(name => ({
    value: typeCount[name] || typeStats.value.find(t => t.name === name)?.count || 0,
    itemStyle: { color: typeColors[name] || '#9CA3AF' }
  }))

  typeChartInstance.setOption({
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280' },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      barWidth: '50%',
      itemStyle: { borderRadius: [0, 4, 4, 0] },
      animationDelay: (idx) => idx * 100,
      data: chartData
    }]
  })
}

watch([searchQuery, filterStatus, filterPriority, filterType], () => {
  nextTick(() => {
    initStatusChart()
    initTypeChart()
  })
})

watch(repairs, () => {
  nextTick(() => {
    initStatusChart()
    initTypeChart()
  })
}, { deep: true })

onMounted(() => {
  initClaimPool()
  // 加载已保存的维修设置
  const sid = store.state.school.id || 'hailin-second-primary'
  const saved = localStorage.getItem(`repair_settings_${sid}`)
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      if (settings.autoDispatch !== undefined) autoDispatch.value = settings.autoDispatch
      if (settings.responseTimeout !== undefined) responseTimeout.value = settings.responseTimeout
      if (settings.preventiveThreshold !== undefined) preventiveThreshold.value = settings.preventiveThreshold
      if (settings.smsReminder !== undefined) smsReminder.value = settings.smsReminder
    } catch (e) { /* ignore parse errors */ }
  }
  nextTick(() => {
    setTimeout(() => { initStatusChart(); initTypeChart() }, 200)
  })

  // 为现有待处理工单初始化时间戳（用于超时检测）
  repairs.value.forEach(order => {
    if ((order.status === 'pending' || order.status === 'assigned') && !order._submitTs && order.submitTime) {
      order._submitTs = new Date(order.submitTime).getTime()
    }
  })
  // 每3天检查一次超时升级（不立即检查，避免页面加载时全部标记为已升级）
  escalationTimer = setInterval(() => checkEscalation(), 3 * 24 * 60 * 60 * 1000)
})

onBeforeUnmount(() => {
  if (statusChartInstance) statusChartInstance.dispose()
  if (typeChartInstance) typeChartInstance.dispose()
  if (escalationTimer) clearInterval(escalationTimer)
})

const refreshData = () => {
  searchQuery.value = ''
  filterStatus.value = ''
  filterPriority.value = ''
  filterType.value = ''
  currentPage.value = 1
  nextTick(() => {
    initStatusChart()
    initTypeChart()
  })
  ElMessage.info('数据已刷新')
}

const exportData = () => {
  // 导出CSV格式的报修数据
  const headers = ['报修编号', '设备名称', '位置', '类型', '优先级', '状态', '报修人', '提交时间']
  const rows = filteredRepairs.value.map(repair => [
    repair.id,
    repair.equipmentName,
    repair.location,
    repair.type === 'field' ? '场地设施' : repair.type === 'balls' ? '球类器材' : repair.type === 'athletics' ? '田径器材' : '其他',
    repair.priority === 'high' ? '高' : repair.priority === 'normal' ? '中' : '低',
    repair.status === 'pending' ? '待处理' : repair.status === 'processing' ? '处理中' : repair.status === 'awaiting_acceptance' ? '待验收' : '已完成',
    repair.reporter,
    repair.submitTime
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `报修记录_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('报修记录已导出')
}

const viewDetail = (row) => {
  currentRepair.value = row
  selectedWorker.value = ''
  selectedParts.value = []
  signature.value = ''
  // 初始化流程步骤（如果不存在）
  if (!row.processSteps || row.processSteps.length === 0) {
    row.processSteps = []
    row.processSteps.push({ time: row.submitTime || new Date().toLocaleString('zh-CN'), description: '报修提交', type: 'primary' })
    if (row.dispatchTime) row.processSteps.push({ time: row.dispatchTime, description: `派单给${row.handler || '维修工'}`, type: 'success' })
    if (row.claimedAt) row.processSteps.push({ time: row.claimedAt, description: `${row.handler}抢单`, type: 'warning' })
    if (row.processTime) row.processSteps.push({ time: row.processTime, description: '开始维修处理', type: 'primary' })
    if (row.pendingAcceptTime) row.processSteps.push({ time: row.pendingAcceptTime, description: '提交验收', type: 'warning' })
    if (row.completeTime) row.processSteps.push({ time: row.completeTime, description: '维修完成，验收通过', type: 'success' })
    if (row.escalated) row.processSteps.push({ time: row.submitTime, description: `工单超时自动升级（第${row.escalationLevel || 1}级）`, type: 'danger' })
  }
  showDetail.value = true
}

const getSkillMatch = () => {
  if (!selectedWorker.value || !currentRepair.value) return 0
  const worker = workers.value.find(w => w.id === selectedWorker.value)
  if (!worker) return 0
  const typeText = getTypeText(currentRepair.value.type)
  const matchCount = worker.skills.filter(s => s.includes(typeText) || typeText.includes(s)).length
  return Math.min(100, matchCount * 50 + 50)
}

const getSkillMatchColor = () => {
  const match = getSkillMatch()
  if (match >= 80) return '#1E5AA8'
  if (match >= 50) return '#F5A623'
  return '#E85D4E'
}

const dispatchWorker = () => {
  let workerToAssign = null

  if (dispatchMode.value === 'auto') {
    // 自动派单逻辑：根据设备类型匹配技能，选择第一个匹配的维修工
    const repairType = currentRepair.value.type
    workerToAssign = workers.value.find(w => w.skills.some(skill => getTypeText(repairType).includes(skill) || skill.includes(getTypeText(repairType))))
    if (!workerToAssign) {
      ElMessage.warning('未能找到匹配技能的维修工，请尝试手动指派或稍后重试。')
      return
    }
  } else if (dispatchMode.value === 'manual') {
    if (!selectedWorker.value) {
      ElMessage.warning('请选择维修工')
      return
    }
    workerToAssign = workers.value.find(w => w.id === selectedWorker.value)
  } else if (dispatchMode.value === 'claim') {
    // 抢单模式：将工单放入抢单池
    const repair = repairs.value.find(r => r.id === currentRepair.value?.id)
    if (repair) {
      repair.claimable = true
      repair.status = 'pending'
      repair.claimed = false
      if (!repair._submitTs) repair._submitTs = Date.now()
      repair.processSteps = repair.processSteps || []
      repair.processSteps.push({ time: new Date().toLocaleString('zh-CN'), description: '工单已发布到抢单池，等待维修工抢单', type: 'warning' })
      if (!claimPool.value.find(o => o.id === repair.id)) {
        claimPool.value.unshift(repair)
      }
    }
    showDispatchDialog.value = false
    showDetail.value = false
    ElMessage.success('工单已发布到抢单池，等待维修工抢单')
    nextTick(() => { initStatusChart() })
    return
  }

  if (!workerToAssign) {
    ElMessage.error('未能成功指派维修工，请检查设置或手动选择。')
    return
  }

  const repair = repairs.value.find(r => r.id === currentRepair.value?.id)
  if (repair) {
    repair.handler = workerToAssign.name
    repair.skills = workerToAssign.skills
    repair.status = 'processing'
    repair.progressStep = 2
    repair.dispatchTime = new Date().toLocaleString('zh-CN')
    repair.processTime = new Date().toLocaleString('zh-CN')
    repair.responseTime = new Date().toLocaleString('zh-CN')
    repair.overdue = false
    repair.claimable = false
    // 添加流程步骤
    repair.processSteps = repair.processSteps || []
    repair.processSteps.push({
      time: new Date().toLocaleString('zh-CN'),
      description: `${dispatchMode.value === 'auto' ? '系统自动' : '手动'}派单给${workerToAssign.name}`,
      type: 'success'
    })
  }
  showDispatchDialog.value = false
  showDetail.value = false
  ElMessage.success(`已指派 ${workerToAssign.name} 进行维修，维修工将收到派单通知`)
  nextTick(() => { initStatusChart() })
}

const uploadPhotos = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      ElMessage.success(`已选择 ${files.length} 张图片`)
    }
  }
  input.click()
}

const submitProcessInfo = () => {
  if (!signature.value.trim()) {
    ElMessage.warning('请输入完工签字确认')
    return
  }
  const repair = repairs.value.find(r => r.id === currentRepair.value?.id)
  if (repair) {
    repair.status = 'awaiting_acceptance'
    repair.progressStep = 3
    repair.pendingAcceptTime = new Date().toLocaleString('zh-CN')
    repair.processInfo = {
      photos: ['现场照片1', '现场照片2'],
      parts: selectedParts.value,
      signature: signature.value
    }
    addProcessStep(repair, `维修完成，提交验收（签字：${signature.value}）`, 'warning')
  }
  showProcessDialog.value = false
  showDetail.value = false
  ElMessage.success('维修处理信息已提交，等待验收')
  nextTick(() => { initStatusChart() })
}

const acceptRepair = (row) => {
  row.status = 'completed'
  row.progressStep = 4
  row.completeTime = new Date().toLocaleString('zh-CN')
  addProcessStep(row, '验收通过，维修工单关闭', 'success')
  showDetail.value = false
  ElMessage.success('验收通过，报修已完成')
  nextTick(() => { initStatusChart() })
}

const saveSettings = () => {
  const sid = store.state.school.id || 'hailin-second-primary'
  const settings = {
    autoDispatch: autoDispatch.value,
    responseTimeout: responseTimeout.value,
    preventiveThreshold: preventiveThreshold.value,
    smsReminder: smsReminder.value
  }
  localStorage.setItem(`repair_settings_${sid}`, JSON.stringify(settings))
  showSettingsDialog.value = false
  ElMessage.success('维修设置已保存')
}

const startProcess = (row) => {
  currentRepair.value = row
  selectedWorker.value = ''
  // 添加流程步骤
  addProcessStep(row, '开始派单处理', 'primary')
  showDispatchDialog.value = true
}

const completeRepair = (row) => {
  currentRepair.value = row
  selectedParts.value = []
  signature.value = ''
  addProcessStep(row, '准备上报处理情况', 'primary')
  showProcessDialog.value = true
}
</script>

<style scoped>
.repair-management-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-warning {
  background: #FEF3C7;
  color: #92400E;
}

.status-success {
  background: #DCFCE7;
  color: #166534;
}

.status-danger {
  background: #FEE2E2;
  color: #991B1B;
}

.status-info {
  background: #DBEAFE;
  color: #1E40AF;
}

.status-primary {
  background: #DBEAFE;
  color: #1E40AF;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  gap: 12px;
}

.detail-label {
  width: 100px;
  font-size: 13px;
  color: #6B7280;
}

.detail-section {
  padding: 12px 0;
  border-bottom: 1px solid #E8EAED;
}

.detail-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.response-time {
  color: #1E5AA8;
}

.overdue-warning {
  background: #FEE2E2;
  color: #991B1B;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-top: 8px;
}

.handler-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.handler-avatar {
  font-size: 32px;
}

.handler-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.handler-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.skill-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.process-info {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.process-photos,
.process-parts,
.process-signature {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.process-label {
  font-size: 12px;
  color: #6B7280;
}

.photo-list {
  display: flex;
  gap: 8px;
}

.photo-item {
  width: 60px;
  height: 60px;
  background: #E8EAED;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.parts-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.signature-text {
  font-size: 13px;
  color: #1A1A2E;
}

.preventive-alert {
  background: #FEF3C7;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.alert-icon {
  font-size: 24px;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #92400E;
}

.alert-desc {
  font-size: 13px;
  color: #92400E;
}

.dispatch-form,
.process-form,
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dispatch-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  color: #1A1A2E;
  font-weight: 500;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.worker-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.worker-skills {
  display: flex;
  gap: 4px;
}

.skill-match {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.match-label {
  font-size: 13px;
  color: #6B7280;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-tip {
  font-size: 12px;
  color: #9CA3AF;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #E8EAED;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.setting-hint {
  font-size: 12px;
  color: #9CA3AF;
}

.create-repair-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.repair-mode-tabs {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #F7F8FA;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-tab:hover {
  background: #F0FDF4;
}

.mode-tab.active {
  background: #1E5AA8;
  color: #FFFFFF;
}

.mode-icon {
  font-size: 18px;
}

.mode-text {
  font-size: 14px;
  font-weight: 500;
}

.scan-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qr-scanner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.scanner-frame {
  width: 200px;
  height: 200px;
  border: 2px dashed #1E5AA8;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1E5AA8, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.scan-hint {
  font-size: 13px;
  color: #6B7280;
}

.scan-result {
  background: #F0FDF4;
  border-radius: 8px;
  padding: 12px;
}

.scan-result h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-info span {
  font-size: 13px;
  color: #6B7280;
}

.knowledge-section {
  background: #FEF3C7;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.knowledge-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #92400E;
}

.solution-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
}

.solution-number {
  width: 20px;
  height: 20px;
  background: #F5A623;
  color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.solution-text {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
}

.voice-recorder {
  display: flex;
  align-items: center;
  gap: 12px;
}

.voice-recorder span {
  font-size: 13px;
  color: #6B7280;
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-section {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
}

.history-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  background: #FFFFFF;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.history-item:hover {
  background: #F0FDF4;
}

.history-name {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.history-location {
  font-size: 12px;
  color: #6B7280;
}

.history-time {
  font-size: 12px;
  color: #9CA3AF;
  margin-left: auto;
}

.tips {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

.urgent-channels {
  margin-top: 12px;
  padding-left: 100px;
}

/* 抢单标记 */
.claim-badge {
  display: inline-block;
  background: #FEF3C7;
  color: #D97706;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 4px;
  font-weight: 500;
}

/* 升级标记 */
.escalation-badge {
  display: inline-block;
  background: #FEE2E2;
  color: #DC2626;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 4px;
  font-weight: 500;
}

/* 全流程跟踪时间线 */
.process-timeline {
  padding: 12px 16px;
  max-height: 300px;
  overflow-y: auto;
  background: #F9FAFB;
  border-radius: 8px;
}

/* 抢单池面板 */
.claim-pool-panel {
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border: 1px solid #F59E0B;
  border-radius: 12px;
  padding: 16px 20px;
}

.pool-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pool-title {
  font-size: 16px;
  font-weight: 600;
  color: #92400E;
}

.pool-count {
  font-size: 13px;
  color: #B45309;
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 10px;
  border-radius: 12px;
}

.pool-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pool-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
  border-radius: 8px;
  padding: 10px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;
}

.pool-item:hover {
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.pool-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pool-item-id {
  font-size: 12px;
  color: #9CA3AF;
  font-family: monospace;
}

.pool-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.pool-item-location {
  font-size: 12px;
  color: #6B7280;
}

/* 抢单模式说明 */
.claim-mode-note {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: #FEF3C7;
  border-radius: 8px;
  padding: 12px;
}

.note-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.note-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note-title {
  font-size: 14px;
  font-weight: 600;
  color: #92400E;
}

.note-desc {
  font-size: 13px;
  color: #92400E;
  line-height: 1.5;
}

/* ============ 预防性巡检预警面板 ============ */
.inspection-panel {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border: 1px solid #F59E0B;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.inspection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #D97706;
}

.inspection-title {
  font-size: 15px;
  font-weight: 600;
  color: #92400E;
}

.inspection-count {
  font-size: 13px;
  color: #B45309;
  background: #FFFBEB;
  padding: 2px 10px;
  border-radius: 20px;
}

.inspection-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inspection-item {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.2s;
}

.inspection-item:hover {
  background: rgba(255, 255, 255, 0.95);
}

.inspection-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.inspection-name {
  font-weight: 600;
  color: #78350F;
  font-size: 14px;
}

.inspection-location {
  font-size: 13px;
  color: #92400E;
}

.inspection-stats {
  font-size: 13px;
  color: #B45309;
}

.inspection-month {
  margin-left: 8px;
  padding: 1px 6px;
  background: #FEE2E2;
  border-radius: 4px;
  color: #DC2626;
  font-weight: 600;
}

.inspection-actions {
  display: flex;
  gap: 8px;
}

/* ============ 智能填报 关键词 ============ */
.knowledge-section {
  background: #F0F9FF;
  border: 1px solid #BAE6FD;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 8px;
}

.knowledge-section h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #0369A1;
  font-weight: 600;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  border-color: #38BDF8;
  color: #0284C7;
}

.keyword-tag:hover {
  background: #E0F2FE;
  transform: translateY(-1px);
}

/* ============ 历史智能联想 ============ */
.history-ai-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-ai-item {
  background: white;
  border: 1px solid #E0F2FE;
  border-radius: 6px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-ai-item:hover {
  border-color: #38BDF8;
  background: #F0F9FF;
  transform: translateX(4px);
}

.history-ai-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-ai-name {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
}

.history-ai-desc {
  font-size: 12px;
  color: #64748B;
}

.history-ai-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.history-ai-time {
  font-size: 11px;
  color: #94A3B8;
}

/* ============ 巡检任务表单 ============ */
.inspection-form .form-item {
  margin-bottom: 14px;
}

.inspection-form .form-label {
  display: block;
  font-size: 13px;
  color: #475569;
  margin-bottom: 6px;
  font-weight: 500;
}
</style>