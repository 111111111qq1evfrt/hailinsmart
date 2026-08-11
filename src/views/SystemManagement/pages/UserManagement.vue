<template>
  <div class="user-management">
    <LoadingOverlay :visible="loading" text="正在同步数据..." subText="请稍候" />
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名/姓名"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterRole" placeholder="选择角色" clearable style="width: 160px">
          <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="账号状态" clearable style="width: 140px">
          <el-option label="正常" value="active" />
          <el-option label="禁用" value="disabled" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Document" @click="viewOperationLogs">操作日志</el-button>
        <el-button :icon="Download" @click="exportUsers">导出用户</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog">新建账号</el-button>
      </div>
    </div>

    <!-- 安全与架构信息栏 -->
    <div class="security-info-bar">
      <div class="security-item">
        <el-icon><Lock /></el-icon>
        <span>敏感数据已脱敏</span>
        <el-tag size="small" type="success">SM4国密</el-tag>
      </div>
      <div class="security-divider"></div>
      <div class="security-item">
        <el-icon><User /></el-icon>
        <span>6级角色权限</span>
        <el-tag size="small" type="primary">RBAC</el-tag>
      </div>
      <div class="security-divider"></div>
      <div class="security-item">
        <el-icon><DocumentChecked /></el-icon>
        <span>等保2.0认证</span>
        <el-tag size="small" type="warning">三级</el-tag>
      </div>
      <div class="security-divider"></div>
      <div class="security-item">
        <el-icon><Timer /></el-icon>
        <span>日志留存180天</span>
        <el-tag size="small" type="info">合规</el-tag>
      </div>
      <div class="security-divider"></div>
      <div class="security-item">
        <el-icon><Connection /></el-icon>
        <span>并发3000+</span>
        <el-tag size="small" type="success">高性能</el-tag>
      </div>
    </div>
    

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ userStats.total }}</span>
        <span class="stat-label">总用户数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ userStats.district }}</span>
        <span class="stat-label">区管理员</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ userStats.schoolAdmin }}</span>
        <span class="stat-label">学校管理员</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ userStats.campus }}</span>
        <span class="stat-label">校园代理</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ userStats.adminTeacher }}</span>
        <span class="stat-label">行政老师</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ userStats.teacher }}</span>
        <span class="stat-label">班主任</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ userStats.classAdmin }}</span>
        <span class="stat-label">班级管理员</span>
      </div>
    </div>

    <!-- 角色层级展示 -->
    <div class="role-hierarchy-bar">
      <div class="hierarchy-title">
        <el-icon><Connection /></el-icon>
        <span>角色权限层级</span>
      </div>
      <div class="hierarchy-levels">
        <div v-for="(role, index) in roleOptions" :key="role.value" class="hierarchy-item">
          <span class="role-tag" :class="getRoleClass(role.value)">{{ role.label }}</span>
          <span v-if="index < roleOptions.length - 1" class="hierarchy-arrow">›</span>
        </div>
      </div>
    </div>

    <!-- 待审批列表 -->
    <div v-if="pendingApprovals.length > 0" class="approval-card">
      <div class="card-header">
        <span class="card-title">待审批申请</span>
        <el-tag type="warning">{{ pendingApprovals.length }}条待处理</el-tag>
      </div>
      <div class="approval-list">
        <div v-for="req in pendingApprovals" :key="req.id" class="approval-item">
          <div class="approval-info">
            <span class="approval-action">{{ req.action }}</span>
            <span class="approval-target">{{ req.targetName }}</span>
            <span class="approval-initiator">发起者：{{ req.initiator }}</span>
            <span class="approval-time">{{ req.createdAt }}</span>
          </div>
          <div class="approval-actions">
            <el-button text type="primary" size="small" @click="approveRequest(req)">通过</el-button>
            <el-button text type="danger" size="small" @click="rejectRequest(req)">拒绝</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">用户列表</span>
        <div class="header-actions">
          <el-button text :icon="Refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>
<el-table 
  :data="paginatedUsers || []" 
  stripe 
  class="w-full" 
  :row-style="{ height: '80px' }"
  @selection-change="handleSelectionChange"
>
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="用户 ID" width="80" />
        <el-table-column label="用户信息" width="200">
          <template #default="scope">
            <div class="user-info-cell">
              <LazyFaceAvatar
                :cimg-url="scope.row.cimgUrl || scope.row.cimg_url || ''"
                :face-photo="scope.row.facePhoto || ''"
                :school-id="currentSchoolId"
                :size="36"
              />
              <div class="user-meta">
                <span class="masked-data" :title="scope.row.name">
                  {{ maskedRows.has(scope.row.id) ? scope.row.name : maskName(scope.row.name) }}
                </span>
                <span class="user-username">@{{ scope.row.username }}</span>
                <el-icon class="mask-icon" @click="toggleMask(scope.row)">
                  <View v-if="maskedRows.has(scope.row.id)" />
                  <Hide v-else />
                </el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="130">
          <template #default="scope">
            <span class="role-tag" :class="getRoleClass(scope.row.role)">
              {{ getRoleLabel(scope.row.role) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="school" label="所属学校" width="180" />
        <el-table-column prop="className" label="管理班级" width="180" />
        <el-table-column label="邮箱" width="160">
          <template #default="scope">
            <span class="masked-data" :title="scope.row.email">
              {{ maskedRows.has(scope.row.id) ? scope.row.email : maskEmail(scope.row.email) }}
            </span>
            <el-icon class="mask-icon" @click="toggleMask(scope.row)">
              <View v-if="maskedRows.has(scope.row.id)" />
              <Hide v-else />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="110">
          <template #default="scope">
            <span class="masked-data" :title="scope.row.phone">
              {{ maskedRows.has(scope.row.id) ? scope.row.phone : maskPhone(scope.row.phone) }}
            </span>
            <el-icon class="mask-icon" @click="toggleMask(scope.row)">
              <View v-if="maskedRows.has(scope.row.id)" />
              <Hide v-else />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <span class="status-tag" :class="scope.row.status === 'active' ? 'status-active' : 'status-disabled'">
              {{ scope.row.status === 'active' ? '正常' : '禁用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="人脸状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.cimg_url ? 'success' : 'warning'" size="small">
              {{ scope.row.cimg_url ? '已录入' : '未录入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatCreateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="420" fixed="right">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="viewUser(scope.row)">详情</el-button>
            <el-button text type="primary" size="small" @click="editUser(scope.row)">编辑</el-button>
            <el-button text type="primary" size="small" @click="staffFaceRegistration(scope.row)">人脸录入</el-button>
            <el-button v-if="scope.row.cimg_url" text type="danger" size="small" @click="deleteFacePhoto(scope.row)">删除人脸</el-button>
            <el-button 
              text 
              :type="scope.row.status === 'active' ? 'danger' : 'primary'" 
              size="small" 
              @click="toggleStatus(scope.row)"
            >
              {{ scope.row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button text type="warning" size="small" @click="resetPassword(scope.row)">重置密码</el-button>
            <el-button text type="danger" size="small" @click="deleteUser(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="(filteredUsers || []).length"
          :page-sizes="[8, 12, 16]"
          layout="total, sizes, prev, pager, next"
          small
        />
      </div>
    </div>

        <!-- 数据安全 -->
    <div class="security-section">
      <div class="section-title">
        <el-icon><Opportunity /></el-icon>
        <span>数据安全</span>
      </div>
      <div class="security-cards">
        <div class="security-card">
          <div class="security-icon success">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="security-body">
            <div class="security-value">每日自动</div>
            <div class="security-label">数据备份</div>
          </div>
          <el-tag type="success" size="small">正常</el-tag>
        </div>
        <div class="security-card">
          <div class="security-icon warning">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="security-body">
            <div class="security-value">1,286</div>
            <div class="security-label">审计日志</div>
          </div>
          <el-tag type="warning" size="small">已启用</el-tag>
        </div>
        <div class="security-card">
          <div class="security-icon primary">
            <el-icon><RefreshLeft /></el-icon>
          </div>
          <div class="security-body">
            <div class="security-value">03:00</div>
            <div class="security-label">恢复点</div>
          </div>
          <el-tag size="small">今日</el-tag>
        </div>
        <div class="security-card">
          <div class="security-icon success">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="security-body">
            <div class="security-value">45ms</div>
            <div class="security-label">同步延迟</div>
          </div>
          <el-tag type="success" size="small">实时</el-tag>
        </div>
      </div>
    </div>

    <!-- 新建账号弹窗 -->
    <ElDialog
      v-model="createDialogVisible"
      :title="isEdit ? '编辑账号' : '新建账号'"
      width="500px"
    >
      <el-form ref="formRef" :model="userForm" :rules="formRules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="2-10位中文姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属学校" prop="school">
          <el-input v-model="userForm.school" placeholder="请输入学校名称" />
        </el-form-item>
        <el-form-item label="管理班级" prop="className">
          <el-input v-model="userForm.className" placeholder="如：一年级(1-4班)，可选" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="如：xxx@school.com，可选" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <div style="display: flex; gap: 8px;">
            <el-select v-model="userForm.phoneCode" placeholder="区号" style="width: 110px">
              <el-option label="+86" value="+86" />
              <el-option label="+852" value="+852" />
              <el-option label="+853" value="+853" />
              <el-option label="+886" value="+886" />
            </el-select>
            <el-input v-model="userForm.phone" placeholder="如 13526541254，同时作为登录用户名" style="width: 250px"/>
          </div>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="初始密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="6-20位，未设置则使用默认密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">{{ isEdit ? '保存修改' : '创建账号' }}</el-button>
      </template>
    </ElDialog>


    
    <!-- 用户详情弹窗 -->
    <ElDialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="550px"
    >
      <div v-if="selectedUser" class="user-detail">
        <div class="detail-header">
          <LazyFaceAvatar
            :cimg-url="selectedUser.cimgUrl || selectedUser.cimg_url || ''"
            :face-photo="selectedUser.facePhoto || ''"
            :school-id="currentSchoolId"
            :size="80"
          />
          <div class="user-info">
            <h3 class="name-wrapper">
              <span>{{ showName ? selectedUser.name : maskName(selectedUser.name) }}</span>
              <el-icon class="eye-icon" @click="showName = !showName">
                <View v-if="showName" />
                <Hide v-else />
              </el-icon>
            </h3>
            <p>@{{ selectedUser.username }}</p>
          </div>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span class="detail-label">角色</span>
            <span class="role-tag" :class="getRoleClass(selectedUser.role)">
              {{ getRoleLabel(selectedUser.role) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">所属学校</span>
            <span class="detail-value">{{ selectedUser.school }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">管理班级</span>
            <span class="detail-value">{{ selectedUser.className || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">邮箱</span>
            <div class="phone-wrapper">
              <span class="detail-value">
                {{ showEmail ? selectedUser.email : maskEmail(selectedUser.email) }}
              </span>
              <el-icon class="eye-icon" @click="showEmail = !showEmail">
                <View v-if="showEmail" />
                <Hide v-else />
              </el-icon>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">手机号</span>
            <div class="phone-wrapper">
              <span class="detail-value">
                {{ showPhone ? selectedUser.phone : maskPhone(selectedUser.phone) }}
              </span>
              <el-icon class="eye-icon" @click="showPhone = !showPhone">
                <View v-if="showPhone" />
                <Hide v-else />
              </el-icon>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="status-tag" :class="selectedUser.status === 'active' ? 'status-active' : 'status-disabled'">
              {{ selectedUser.status === 'active' ? '正常' : '禁用' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">{{ formatCreateTime(selectedUser.createTime) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="editUser(selectedUser)">编辑</el-button>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </ElDialog>

    <!-- 面部信息录入弹窗 -->
    <ElDialog
      v-model="faceDialogVisible"
      title="面部信息录入"
      width="550px"
      :close-on-click-modal="false"
    >
      <div class="face-registration">
        <div class="registration-step">
          <div class="step-indicator">
            <span :class="{ active: faceStep === 1 }">1</span>
            <span class="step-line"></span>
            <span :class="{ active: faceStep === 2 }">2</span>
            <span class="step-line"></span>
            <span :class="{ active: faceStep === 3 }">3</span>
          </div>
          <div class="step-labels">
            <span>选择教职工</span>
            <span>采集图像</span>
            <span>完成录入</span>
          </div>
        </div>

        <!-- 步骤1: 选择教职工 -->
        <div v-if="faceStep === 1" class="step-content">
          <div class="select-student">
            <el-input
              v-model="faceSearchQuery"
              placeholder="搜索教职工姓名"
              clearable
              class="w-full"
              :prefix-icon="Search"
            />
            <div class="filter-options">
              <el-radio-group v-model="faceFilterMode">
                <el-radio label="all">全部</el-radio>
                <el-radio label="unregistered">仅未录入</el-radio>
                <el-radio label="registered">仅已录入</el-radio>
              </el-radio-group>
            </div>
            <div class="student-list">
              <div
                v-for="staff in filteredStaffForFace"
                :key="staff.staff_id || staff.id"
                class="student-item"
                :class="{ selected: selectedFaceStudent?.staff_id === staff.staff_id || selectedFaceStudent?.id === staff.id }"
                @click="selectFaceStudent(staff)"
              >
                <LazyFaceAvatar
                  :cimg-url="staff.cimgUrl || staff.cimg_url || ''"
                  :face-photo="staff.facePhoto || ''"
                  :school-id="currentSchoolId"
                  :size="40"
                />
                <div class="student-info">
                  <span class="student-name">{{ staff.name }}</span>
                  <span class="student-id">{{ getStaffRoleText(staff.identity) }}</span>
                </div>
                <el-tag :type="(staff.cimgUrl || staff.cimg_url) ? 'success' : 'info'" size="small">
                  {{ (staff.cimgUrl || staff.cimg_url) ? '已录入' : '未录入' }}
                </el-tag>
              </div>
              <div v-if="filteredStaffForFace.length === 0" class="empty-hint">
                <el-icon :size="48" color="#9CA3AF"><UserFilled /></el-icon>
                <p>未找到符合条件的教职工</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤2: 采集图像 -->
        <div v-if="faceStep === 2" class="step-content">
          <div class="camera-container">
            <div class="camera-frame">
              <div class="camera-preview">
                <video
                  v-if="!faceCaptured && mediaStream"
                  ref="videoRef"
                  class="video-preview"
                  autoplay
                  playsinline
                  muted
                ></video>
                <div v-else-if="!faceCaptured && !mediaStream" class="preview-placeholder">
                  <el-icon :size="64" color="#9CA3AF"><Camera /></el-icon>
                  <span class="preview-hint">摄像头预览区域</span>
                  <span class="preview-hint-small">{{ cameraStatus }}</span>
                </div>
                <img
                  v-else
                  :src="capturedImageBase64"
                  class="captured-image"
                  alt="已捕获的人脸"
                />
              </div>
              <canvas ref="canvasRef" style="display: none;"></canvas>
              <div class="face-guide" :class="{ scanning: cameraStatus.includes('识别') }">
                <div class="guide-line top"></div>
                <div class="guide-line bottom"></div>
                <div class="guide-line left"></div>
                <div class="guide-line right"></div>
                <div class="guide-text">{{ cameraStatus.includes('识别') ? '正在识别...' : '请将面部置于框内' }}</div>
              </div>
            </div>
            <div class="camera-status">
              <span class="status-indicator" :class="{ active: cameraStatus.includes('就绪') }"></span>
              <span class="status-text">{{ cameraStatus }}</span>
            </div>
          </div>
          <div class="camera-actions">
            <el-button @click="refreshCamera">刷新摄像头</el-button>
            <el-button
              type="primary"
              :icon="faceCaptured ? Refresh : Camera"
              @click="captureFace"
              :disabled="!mediaStream"
            >
              {{ faceCaptured ? '重新拍照' : '拍照采集' }}
            </el-button>
          </div>
        </div>

        <!-- 步骤3: 完成录入 -->
        <div v-if="faceStep === 3" class="step-content">
          <div class="success-content">
            <div class="success-icon">✓</div>
            <h3>面部信息录入成功</h3>
            <div class="student-summary">
              <LazyFaceAvatar
                :cimg-url="selectedFaceStudent?.cimgUrl || ''"
                :face-photo="capturedImageBase64"
                :school-id="currentSchoolId"
                :size="64"
              />
              <div class="summary-info">
                <span class="summary-name">{{ selectedFaceStudent?.name }}</span>
                <span class="summary-id">{{ getStaffRoleText(selectedFaceStudent?.identity) }}</span>
              </div>
            </div>
            <div class="success-details">
              <div class="detail-item">
                <span class="detail-label">录入时间</span>
                <span class="detail-value">{{ new Date().toLocaleString('zh-CN') }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">面部状态</span>
                <span class="detail-value status-success">已录入</span>
              </div>
            </div>
            <p class="success-hint">教职工面部信息已成功录入系统，可用于后续身份识别</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button v-if="faceStep > 1" @click="faceStep--">上一步</el-button>
        <el-button
          v-if="faceStep === 1 && selectedFaceStudent"
          type="primary"
          @click="faceStep++"
        >
          下一步
        </el-button>
        <el-button
          v-if="faceStep === 2 && faceCaptured"
          type="primary"
          @click="faceStep++"
        >
          确认录入
        </el-button>
        <el-button
          v-if="faceStep === 3"
          type="primary"
          @click="completeFaceRegistration"
        >
          完成
        </el-button>
        <el-button @click="closeFaceDialog">取消</el-button>
      </template>
    </ElDialog>

    <!-- 操作日志弹窗 -->
    <ElDialog v-model="operationLogVisible" title="操作日志" width="900px">
      <div class="log-filters">
        <el-input
          v-model="logSearch"
          placeholder="搜索操作人/操作对象"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="logActionFilter" placeholder="操作类型" clearable style="width: 140px">
          <el-option label="全部" value="" />
          <el-option label="创建账号" value="创建账号" />
          <el-option label="修改权限" value="修改权限" />
          <el-option label="禁用账号" value="禁用账号" />
          <el-option label="重置密码" value="重置密码" />
          <el-option label="导出用户" value="导出用户" />
          <el-option label="删除账号" value="删除账号" />
          <el-option label="登录系统" value="登录系统" />
          <el-option label="退出登录" value="退出登录" />
        </el-select>
        <el-select v-model="logResultFilter" placeholder="操作结果" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="成功" value="成功" />
          <el-option label="失败" value="失败" />
          <el-option label="待审批" value="待审批" />
        </el-select>
        <el-button :icon="Refresh" @click="refreshLogs">刷新</el-button>
        <el-button :icon="Download" @click="exportLogs">导出日志</el-button>
      </div>
      <el-table :data="filteredLogs" stripe size="small" max-height="450">
        <el-table-column prop="time" label="操作时间" min-width="180" />
        <el-table-column prop="operator" label="操作人" min-width="100" />
        <el-table-column prop="action" label="操作类型" min-width="120" />
        <el-table-column prop="target" label="操作对象" min-width="120" />
        <el-table-column prop="ip" label="IP地址" min-width="140" />
        <el-table-column prop="device" label="设备" min-width="100" />
        <el-table-column prop="result" label="结果" min-width="80">
          <template #default="scope">
            <el-tag :type="scope.row.result === '成功' ? 'success' : (scope.row.result === '失败' ? 'danger' : 'warning')" size="small">
              {{ scope.row.result }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" min-width="120" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <div class="log-summary">
          <span>共 {{ filteredLogs.length }} 条记录 | 日志留存180天</span>
        </div>
        <el-button @click="operationLogVisible = false">关闭</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import { Search, Download, Plus, Refresh, User, UserFilled, Document, Lock, DocumentChecked, Timer, Connection, View, Hide, Opportunity, CircleCheckFilled, RefreshLeft, Camera } from '@element-plus/icons-vue'
import store from '@/store/global'
import { getDefaultUsersForSchool, getSchoolNameById } from '@/mock/school-data/schoolUsers'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { generateDefaultPassword, addCustomAccount } from '@/mock/passwordUtils'
import { maskPhone, maskEmail, maskName } from '@/utils/mask'
import { generateDeterministicId } from '@/utils/seededRandom'
import { getStaffList, addStaff, changeStaff, deleteStaff, uploadStaffFaceJson, deleteStaffFace } from '@/utils/daiweiApi'
import { isBizSuccess, parseDaweiResponse, getFriendlyErrorMessage } from '@/utils/daweiErrorHandler'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import LazyFaceAvatar from '@/components/charts/LazyFaceAvatar.vue'
import { nameToPinyin } from '@/utils/pinyin'
import { getCachedIP } from '@/utils/clientInfo'

const roleOptions = [
  { value: 'district', label: '区管理员', level: 1 },
  { value: 'school', label: '学校管理员', level: 2 },
  { value: 'campus', label: '校园代理', level: 3 },
  { value: 'admin_teacher', label: '行政老师', level: 4 },
  { value: 'teacher', label: '体育老师', level: 5 },
  { value: 'class', label: '班主任', level: 6 }
]

const currentSchoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const currentSchoolName = computed(() => store.state.school.name || getSchoolNameById(currentSchoolId.value))

const users = usePersistedRef(
  computed(() => `users_${currentSchoolId.value}`),
  getDefaultUsersForSchool(currentSchoolId.value)
)

const approvalRequestsKey = computed(() => `smart_pe_approval_requests_${currentSchoolId.value}`)
const approvalRequests = usePersistedRef(approvalRequestsKey.value, [])

watch(currentSchoolId, () => {
  currentPage.value = 1
  loadStaffList()
})

const loading = ref(true)

const loadStaffList = async () => {
  loading.value = true
  const schoolId = store.state.school?.id || ''

  try {
    const result = await getStaffList({ page: 1, size: 2000 }, schoolId)
    const staffList = result.list || []

    if (staffList.length > 0) {
      // Map API data to our data structure, preserving API field names
      const mappedUsers = staffList.map(s => {
        // Determine system role based on identity
        let role = 'teacher' // default
        if (s.identity?.leadership === 1) role = 'school'
        else if (s.identity?.sport_teacher === 1) role = 'teacher'
        else if (s.identity?.class_adviser === 1) role = 'class'

        return {
          // Keep original API fields
          staff_id: s.staff_id,
          name: s.name,
          phone: (s.phone_number || '').replace(/-/g, ''),
          phone_number: (s.phone_number || '').replace(/-/g, ''),
          identity: s.identity || {},
          cimg_url: s.cimg_url || '',
          cimgUrl: s.cimg_url || '',
          facePhoto: '',
          // System fields (mock where API doesn't provide)
          id: s.staff_id,
          username: (s.phone_number || s.staff_id).replace(/-/g, ''),
          role: role,
          school: currentSchoolName.value,
          className: '',
          email: '',
          status: 'active',
          createTime: new Date().toISOString(),
          password: ''
        }
      })

      users.value = mappedUsers
    } else {
      // 如果大沩返回空列表且当前学校未配置大沩，保留本地数据
      const config = await import('@/config/daiwei').then(m => m.getSchoolConfig(schoolId))
      if (!config && users.value.length === 0) {
        users.value = getDefaultUsersForSchool(schoolId)
      }
    }

    loading.value = false
  } catch (error) {
    // 保留本地数据
    if (users.value.length === 0) {
      users.value = getDefaultUsersForSchool(schoolId)
    }
    loading.value = false
  }
}

onMounted(() => {
  loadStaffList()
})

onUnmounted(() => {
  if (staffMediaStream) {
    staffMediaStream.getTracks().forEach(track => track.stop())
    staffMediaStream = null
    mediaStream.value = null
  }
})

const pendingApprovals = computed(() => {
  return approvalRequests.value.filter(req => req.status === 'pending')
})

const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(12)

const filteredUsers = computed(() => {
  let result = users.value.filter(u => u.school === currentSchoolName.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(u => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
  }
  if (filterRole.value) result = result.filter(u => u.role === filterRole.value)
  if (filterStatus.value) result = result.filter(u => u.status === filterStatus.value)
  return result
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const userStats = computed(() => {
  const schoolUsers = users.value.filter(u => u.school === currentSchoolName.value)
  return {
    total: schoolUsers.length,
    district: schoolUsers.filter(u => u.role === 'district').length,
    schoolAdmin: schoolUsers.filter(u => u.role === 'school').length,
    campus: schoolUsers.filter(u => u.role === 'campus').length,
    adminTeacher: schoolUsers.filter(u => u.role === 'admin_teacher').length,
    teacher: schoolUsers.filter(u => u.role === 'teacher').length,
    classAdmin: schoolUsers.filter(u => u.role === 'class').length
  }
})

const formatDateTime = (date) => {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 将 ISO 字符串（UTC）转换为本地时间显示
const formatCreateTime = (timeStr) => {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  if (isNaN(d.getTime())) return timeStr  // 非 ISO 格式直接返回
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const addUser = (data) => users.value.unshift({
  id: generateDeterministicId('U', data.username || data.name),
  staff_id: data.staff_id || '',
  ...data,
  status: 'active',
  createTime: formatDateTime()
})
const updateUser = (id, data) => {
  const idx = users.value.findIndex(u => u.id === id)
  if (idx > -1) Object.assign(users.value[idx], data)
}
const removeUser = (id) => {
  const idx = users.value.findIndex(u => u.id === id)
  if (idx > -1) users.value.splice(idx, 1)
}
const toggleUserStatus = (id) => {
  const u = users.value.find(u => u.id === id)
  if (u) u.status = u.status === 'active' ? 'disabled' : 'active'
}

const selectedUsers = ref([])

// 弹窗控制
const createDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const operationLogVisible = ref(false)
const selectedUser = ref(null)
const isEdit = ref(false)
const showPhone = ref(false)
const showEmail = ref(false)
const showName = ref(false)

// 人脸录入弹窗控制（3步向导）
const faceDialogVisible = ref(false)
const faceStep = ref(1)
const faceSearchQuery = ref('')
const faceFilterMode = ref('unregistered')
const selectedFaceStudent = ref(null)
const faceCaptured = ref(false)
const capturedImageBase64 = ref('')
const cameraStatus = ref('准备就绪')
const videoRef = ref(null)
const canvasRef = ref(null)
let staffMediaStream = null
const mediaStream = ref(null)

const formRef = ref(null)

const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度为2-10位', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5]+$/, message: '姓名只能包含中文', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  school: [
    { required: true, message: '请输入学校名称', trigger: 'blur' }
  ],
  email: [
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^\+?\d{7,20}$/, message: '请输入正确的手机号（如 +8613526541254）', trigger: 'blur' }
  ],
  password: [
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ]
}

const userForm = reactive({
  id: '',
  username: '',
  name: '',
  role: '',
  school: '',
  className: '',
  email: '',
  phone: '',
  phoneCode: '+86',
  password: '',
  isLeadership: false,
  isSportTeacher: false,
  isClassAdviser: false
})

const handleSelectionChange = (val) => {
  selectedUsers.value = val
}

const refreshData = () => {
  searchQuery.value = ''
  filterRole.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  loadStaffList()
  ElMessage.success('数据已刷新')
}

const exportUsers = () => {
  // 导出CSV格式的用户数据
  const headers = ['用户名', '姓名', '角色', '学校', '班级', '邮箱', '电话', '状态', '创建时间']
  const rows = filteredUsers.value.map(user => [
    user.username,
    user.name,
    getRoleLabel(user.role),
    user.school,
    user.className || '-',
    user.email,
    user.phone,
    user.status === 'active' ? '启用' : '禁用',
    user.createTime
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `用户列表_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  addOperationLog('导出用户', `全部用户(${filteredUsers.value.length}条)`, `导出用户列表，共${filteredUsers.value.length}条`)
  ElMessage.success('用户列表已导出')
}

const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  userForm.school = currentSchoolName.value
  createDialogVisible.value = true
}

const resetForm = () => {
  userForm.id = ''
  userForm.username = ''
  userForm.name = ''
  userForm.role = ''
  userForm.school = currentSchoolName.value
  userForm.className = ''
  userForm.email = ''
  userForm.phone = ''
  userForm.phoneCode = '+86'
  userForm.password = ''
}

const saveUser = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    // 手机号即用户名（大沩API无username字段，phone_number为唯一标识）
    userForm.username = (userForm.phoneCode || '+86') + userForm.phone || ''
    
    // 先调大沩API，成功后再更新本地
    const syncResult = await syncStaffToDaiwei(userForm)
    
    // 大沩API失败，不更新本地，关闭弹窗
    if (!syncResult.success) {
      // 错误提示已由 syncStaffToDaiwei 弹出
      return
    }
    
    // 大沩API成功，更新本地数据
    if (isEdit.value) {
      updateUser(userForm.id, {
        username: userForm.username,
        name: userForm.name,
        role: userForm.role,
        school: userForm.school,
        className: userForm.className,
        email: userForm.email,
        phone: userForm.phoneCode + userForm.phone,
        ...(userForm.password && { password: userForm.password }),
        staff_id: syncResult.staffId
      })
      addOperationLog('修改权限', userForm.name, `修改用户"${userForm.name}"的信息`)
      ElMessage.success('用户信息已更新')
    } else {
      const finalPassword = userForm.password || generateDefaultPassword(currentSchoolId.value)
      addCustomAccount(userForm.username, userForm.role, currentSchoolId.value, finalPassword)
      
      addUser({
        username: userForm.username,
        name: userForm.name,
        role: userForm.role,
        school: userForm.school || currentSchoolName.value,
        className: userForm.className,
        email: userForm.email,
        phone: userForm.phoneCode + userForm.phone,
        password: finalPassword,
        staff_id: syncResult.staffId,
        identity: {
          leadership: userForm.role === 'school' ? 1 : 0,
          leadership_school_list: [],
          sport_teacher: userForm.role === 'teacher' ? 1 : 0,
          sports_teacher_class_list: [],
          class_adviser: userForm.role === 'class' ? 1 : 0,
          class_adviser_class_list: []
        }
      })
      
      if (userForm.password) {
        addOperationLog('创建账号', userForm.name, `创建用户"${userForm.name}"，角色：${getRoleLabel(userForm.role)}`)
        ElMessage.success('账号创建成功')
      } else {
        addOperationLog('创建账号', userForm.name, `创建用户"${userForm.name}"，角色：${getRoleLabel(userForm.role)}，初始密码：${finalPassword}`)
        ElMessage.success(`账号创建成功，初始密码：${finalPassword}`)
      }
    }

    createDialogVisible.value = false
    resetForm()
  })
}

const syncStaffToDaiwei = async (form) => {
  // 拼接区号 + 手机号：表单中 phoneCode 和 phone 是分开的
  // 如果 phone 已经以 + 开头（从API加载的数据），则不再拼接
  let phoneNumber = form.phone || ''
  if (phoneNumber && !phoneNumber.startsWith('+') && form.phoneCode) {
    phoneNumber = form.phoneCode + phoneNumber
  }
  const staffId = form.id ? form.id.replace('_', '') : generateDeterministicId('S', form.name).replace('_', '')

  const apiData = {
    name: form.name,
    phone_number: phoneNumber,
    staff_id: staffId,
    identity: {
      leadership: form.role === 'school' ? 1 : 0,
      leadership_school_list: [],
      sport_teacher: form.role === 'teacher' ? 1 : 0,
      sports_teacher_class_list: [],
      class_adviser: form.role === 'class' ? 1 : 0,
      class_adviser_class_list: []
    }
  }
  
  try {
    let result
    if (form.id) {
      result = await changeStaff(apiData, store.state.school.id)
    } else {
      result = await addStaff(apiData, store.state.school.id)
    }
    
    // 检查业务错误
    if (!isBizSuccess(result)) {
      const errorMsg = getFriendlyErrorMessage(result, form.id ? '修改职工' : '添加职工')
      ElMessage.error(errorMsg)
      return { success: false, staffId: null }
    }
    
    return { success: true, staffId }
  } catch (error) {
    console.warn('同步大沩职工信息失败:', error.message)
    ElMessage.error('网络异常，无法同步数据')
    return { success: false, staffId: null }
  }
}

const viewUser = (user) => {
  selectedUser.value = user
  showPhone.value = false
  showEmail.value = false
  showName.value = false
  detailDialogVisible.value = true
}

const staffFaceRegistration = (user) => {
  faceStep.value = 1
  faceSearchQuery.value = ''
  faceFilterMode.value = 'unregistered'
  selectedFaceStudent.value = user || null
  faceCaptured.value = false
  capturedImageBase64.value = ''
  cameraStatus.value = '准备就绪'
  faceDialogVisible.value = true
  
  if (user) {
    faceStep.value = 2
  }
}

const selectFaceStudent = (staff) => {
  selectedFaceStudent.value = staff
}

const filteredStaffForFace = computed(() => {
  let result = users.value
  if (faceSearchQuery.value) {
    const q = faceSearchQuery.value.toLowerCase()
    result = result.filter(s => s.name.toLowerCase().includes(q) || (s.staff_id || s.id || '').toLowerCase().includes(q))
  }
  if (faceFilterMode.value === 'unregistered') {
    result = result.filter(s => !s.faceRegistered && !s.cimgUrl && !s.cimg_url)
  } else if (faceFilterMode.value === 'registered') {
    result = result.filter(s => s.faceRegistered || s.cimgUrl || s.cimg_url)
  }
  return result.slice(0, 10)
})

watch(faceStep, (newVal) => {
  if (newVal === 2) {
    setTimeout(() => {
      openCamera()
    }, 300)
  }
})

const openCamera = async () => {
  if (staffMediaStream) {
    staffMediaStream.getTracks().forEach(track => track.stop())
  }
  
  try {
    cameraStatus.value = '正在连接摄像头...'
    staffMediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = staffMediaStream
    }
    mediaStream.value = staffMediaStream
    cameraStatus.value = '摄像头已就绪，请对准面部'
  } catch (error) {
    console.error('打开摄像头失败:', error)
    cameraStatus.value = '无法访问摄像头，请检查权限'
    staffMediaStream = null
    mediaStream.value = null
    ElMessage.error('无法访问摄像头，请确保已授权摄像头权限')
  }
}

const refreshCamera = () => {
  openCamera()
}

const captureFace = () => {
  if (faceCaptured.value) {
    faceCaptured.value = false
    capturedImageBase64.value = ''
    cameraStatus.value = '摄像头已就绪，请对准面部'
    return
  }
  
  if (!videoRef.value || !canvasRef.value || !staffMediaStream) {
    ElMessage.error('摄像头未就绪，请先连接摄像头')
    return
  }
  
  cameraStatus.value = '正在捕获图像...'
  
  setTimeout(() => {
    const video = videoRef.value
    const canvas = canvasRef.value
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    capturedImageBase64.value = canvas.toDataURL('image/jpeg', 0.8)
    faceCaptured.value = true
    cameraStatus.value = '图像捕获成功'
  }, 300)
}

const completeFaceRegistration = async () => {
  const staffId = (selectedFaceStudent.value?.staff_id || selectedFaceStudent.value?.id || '').replace('_', '')
  const staffName = selectedFaceStudent.value?.name
  
  if (!capturedImageBase64.value) {
    ElMessage.error('请先拍摄人脸照片')
    return
  }
  
  const imageBase64 = capturedImageBase64.value.split(',')[1]
  
  try {
    const result = await uploadStaffFaceJson({
      staff_id: staffId,
      image: imageBase64
    }, store.state.school.id)
   
    
    if (String(result.code) === '0') {
      const user = users.value.find(u => (u.staff_id || u.id) === staffId || (u.staff_id || u.id) === staffId.replace('_', ''))
      if (user) {
        user.faceRegistered = true
        user.facePhoto = capturedImageBase64.value
        user.cimgUrl = capturedImageBase64.value
      }
      ElMessage.success(`已成功录入 ${staffName} 的面部信息`)
      addOperationLog('人脸录入', staffName, `为教职工"${staffName}"录入面部信息`)
    } else if (String(result.code) === '10900') {
      ElMessage.warning('人脸验证失败，请重新拍摄人脸照片')
      faceCaptured.value = false
      cameraStatus.value = '准备就绪'
      faceStep.value = 2
      return
    } else {
      ElMessage.error(`人脸录入失败: ${result.message || '未知错误'}`)
    }
  } catch (error) {
    console.warn('上传人脸API调用失败:', error.message)
    
    const user = users.value.find(u => (u.staff_id || u.id) === staffId || (u.staff_id || u.id) === staffId.replace('_', ''))
    if (user) {
      user.faceRegistered = true
      user.cimgUrl = capturedImageBase64.value
    }
    ElMessage.success(`已成功录入 ${staffName} 的面部信息`)
    addOperationLog('人脸录入', staffName, `为教职工"${staffName}"录入面部信息`)
  }
  
  faceDialogVisible.value = false
  faceStep.value = 1
  selectedFaceStudent.value = null
}

const deleteFacePhoto = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${user.name}" 的人脸照片吗？删除后需重新录入。`,
      '删除人脸',
      { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
  } catch {
    return  // 用户取消
  }

  const staffId = (user.staff_id || user.id || '').replace('_', '')
  try {
    const result = await deleteStaffFace({ staff_id: staffId }, store.state.school.id)
    
    // 检查业务错误
    if (!isBizSuccess(result)) {
      ElMessage.error(getFriendlyErrorMessage(result, '删除人脸'))
      return  // 业务失败，不更新本地
    }
    
    user.cimg_url = ''
    user.cimgUrl = ''
    user.facePhoto = ''
    user.faceRegistered = false
    ElMessage.success(`已删除 ${user.name} 的人脸照片`)
    addOperationLog('删除人脸', user.name, `删除教职工"${user.name}"的面部信息`)
  } catch (error) {
    console.warn('删除人脸API调用失败:', error.message)
    ElMessage.error('删除人脸失败，请重试')
  }
}

const closeFaceDialog = () => {
  if (staffMediaStream) {
    staffMediaStream.getTracks().forEach(track => track.stop())
    staffMediaStream = null
    mediaStream.value = null
  }
  faceDialogVisible.value = false
  faceStep.value = 1
  selectedFaceStudent.value = null
  faceCaptured.value = false
  capturedImageBase64.value = ''
  cameraStatus.value = '准备就绪'
}

const editUser = (user) => {
  isEdit.value = true
  userForm.id = user.id
  userForm.username = user.username
  userForm.name = user.name
  userForm.role = user.role
  userForm.school = user.school
  userForm.className = user.className
  userForm.email = user.email
  // 从 API 加载的手机号含区号（如 +8613522007845），需要拆分到 phoneCode 和 phone
  const rawPhone = user.phone || ''
  // 精确匹配已知区号，避免贪婪匹配把号码数字吃进区号
  const match = rawPhone.match(/^(\+86|\+852|\+853|\+886)(\d+)$/)
  if (match) {
    userForm.phoneCode = match[1]  // 如 +86
    userForm.phone = match[2]      // 如 13522007845
  } else {
    userForm.phoneCode = '+86'
    userForm.phone = rawPhone
  }
  createDialogVisible.value = true
}

const toggleStatus = (user) => {
  // 检查是否是操作自己
  const currentUserName = store.state.user.name || ''
  
  if (user.name === currentUserName) {
    ElMessage.warning('不能禁用/启用自己的账号')
    return
  }
  
  const action = user.status === 'active' ? '禁用' : '启用'
  
  const existingRequest = approvalRequests.value.find(req => 
    req.targetId === user.id && req.action === action && req.status === 'pending'
  )
  
  if (existingRequest) {
    ElMessage.warning(`该用户的${action}申请已提交，等待另一管理员审批`)
    return
  }
  
  ElMessageBox.confirm(
    `${action}账号属于敏感操作，需要两位管理员审批。确定提交${action}申请吗？`,
    `${action}申请确认`,
    {
      confirmButtonText: '提交申请',
      cancelButtonText: '取消',
      type: user.status === 'active' ? 'warning' : 'info'
    }
  ).then(() => {
    submitApprovalRequest(user, action)
    addOperationLog(action + '账号', user.name, `提交${action}用户"${user.name}"的审批申请，等待另一管理员审批`)
    ElMessage.success(`${action}申请已提交，请等待另一管理员审批`)
  })
}

const submitApprovalRequest = (user, action) => {
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  
  approvalRequests.value.unshift({
    id: generateDeterministicId('APR', user.username + '-' + action),
    targetId: user.id,
    targetName: user.name,
    targetUsername: user.username,
    action,
    initiator: store.state.user.name || '管理员',
    initiatorId: store.state.user.id || 'admin',
    createdAt: timeStr,
    status: 'pending',
    approver: null,
    approvedAt: null,
    module: 'user'
  })
  
  if (approvalRequests.value.length > 100) {
    approvalRequests.value.pop()
  }
}

const approveRequest = (request) => {
  const currentUser = store.state.user.name || '管理员'
  
  if (request.initiator === currentUser && request.initiatorId === (store.state.user.id || 'admin')) {
    ElMessage.warning('不能审批自己发起的申请')
    return
  }
  
  if (request.targetName === currentUser) {
    ElMessage.warning('不能审批针对自己的操作')
    return
  }
  
  ElMessageBox.confirm(
    `确定审批 "${request.action}" 用户 "${request.targetName}" 的申请吗？`,
    '审批确认',
    {
      confirmButtonText: '确认审批',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const idx = approvalRequests.value.findIndex(req => req.id === request.id)
    if (idx > -1) {
      approvalRequests.value[idx].status = 'approved'
      approvalRequests.value[idx].approver = currentUser
      approvalRequests.value[idx].approvedAt = new Date().toLocaleString('zh-CN')
    }
    
    executeApprovedAction(request)
    
    const actionType = request.action === '删除' ? '删除账号' : request.action + '账号'
    addOperationLog(actionType, request.targetName, `${currentUser}审批通过了${request.action}用户"${request.targetName}"的申请，由${request.initiator}发起`)
    ElMessage.success('审批已通过，操作已执行')
  })
}

const rejectRequest = (request) => {
  const currentUser = store.state.user.name || '管理员'
  
  if (request.initiator === currentUser && request.initiatorId === (store.state.user.id || 'admin')) {
    ElMessage.warning('不能拒绝自己发起的申请')
    return
  }
  
  if (request.targetName === currentUser) {
    ElMessage.warning('不能拒绝针对自己的操作')
    return
  }
  
  ElMessageBox.confirm(
    `确定拒绝 "${request.action}" 用户 "${request.targetName}" 的申请吗？`,
    '拒绝审批',
    {
      confirmButtonText: '确定拒绝',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const idx = approvalRequests.value.findIndex(req => req.id === request.id)
    if (idx > -1) {
      approvalRequests.value[idx].status = 'rejected'
      approvalRequests.value[idx].approver = currentUser
      approvalRequests.value[idx].approvedAt = new Date().toLocaleString('zh-CN')
    }
    
    const actionType = request.action === '删除' ? '删除账号' : request.action + '账号'
    addOperationLog(actionType, request.targetName, `${currentUser}拒绝了${request.action}用户"${request.targetName}"的申请，由${request.initiator}发起`)
    ElMessage.success('申请已被拒绝')
  })
}

const executeApprovedAction = async (request) => {
  if (request.action === '禁用') {
    toggleUserStatus(request.targetId)
  } else if (request.action === '启用') {
    toggleUserStatus(request.targetId)
  } else if (request.action === '删除') {
    // 先找到用户信息，调用大沩 API 删除
    const targetUser = users.value.find(u => u.id === request.targetId)
    if (targetUser) {
      const staffId = (targetUser.staff_id || targetUser.id || '').replace('_', '')
      if (staffId) {
        try {
          const result = await deleteStaff({ staff_id: staffId }, currentSchoolId.value)
          
          // 检查业务错误
          if (!isBizSuccess(result)) {
            ElMessage.error(getFriendlyErrorMessage(result, '删除职工'))
            return  // 业务失败，不删除本地
          }
        } catch (e) {
          console.warn('调用大沩删除职工接口失败:', e.message)
        }
      }
    }
    removeUser(request.targetId)
  }
}

const deleteUser = (user) => {
  // 检查是否是删除自己
  const currentUserName = store.state.user.name || ''
  
  if (user.name === currentUserName) {
    ElMessage.warning('不能删除自己的账号')
    return
  }
  
  const existingRequest = approvalRequests.value.find(req => 
    req.targetId === user.id && req.action === '删除' && req.status === 'pending'
  )
  
  if (existingRequest) {
    ElMessage.warning('该用户的删除申请已提交，等待另一管理员审批')
    return
  }
  
  ElMessageBox.confirm(
    '删除账号属于敏感操作，需要两位管理员审批。确定提交删除申请吗？',
    '删除申请确认',
    {
      confirmButtonText: '提交申请',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    submitApprovalRequest(user, '删除')
    addOperationLog('删除账号', user.name, `提交删除用户"${user.name}"的审批申请，等待另一管理员审批`)
    ElMessage.success('删除申请已提交，请等待另一管理员审批')
  })
}

const resetPassword = (user) => {
  ElMessageBox.confirm(
    `确定要重置用户 "${user.name}" 的密码吗？重置后密码将恢复为默认格式：学校简称+123456。`,
    '重置密码确认',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const defaultPassword = generateDefaultPassword(currentSchoolId.value)
    updateUser(user.id, { password: defaultPassword })
    addOperationLog('重置密码', user.name, `重置用户"${user.name}"的密码，新密码：${defaultPassword}`)
    ElMessage.success(`密码已重置，新密码：${defaultPassword}`)
  })
}

const maskedRows = ref(new Set())

const toggleMask = (row) => {
  const rowId = row.staff_id || row.id
  const newSet = new Set(maskedRows.value)
  if (newSet.has(rowId)) {
    newSet.delete(rowId)
  } else {
    newSet.add(rowId)
  }
  maskedRows.value = newSet
}

const logSearch = ref('')
const logActionFilter = ref('')
const logResultFilter = ref('')

const addOperationLog = (action, target, detail = '', result = '成功') => {
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  const operator = store.state.user.name || '管理员'
  const userId = store.state.user.id || 'admin001'

  syncToSystemLogs(timeStr, operator, userId, action, target, detail, result)
}

const syncToSystemLogs = (time, userName, userId, action, target, detail, result) => {
  const sysLogsKey = `smart_pe_sys_operation_logs_${currentSchoolId.value}`
  
  let sysType = 'update'
  let sysModule = 'user'
  
  if (action.includes('创建')) {
    sysType = 'create'
  } else if (action.includes('删除')) {
    sysType = 'delete'
  } else if (action.includes('导出')) {
    sysType = 'export'
  } else if (action.includes('登录')) {
    sysType = 'login'
  } else if (action.includes('退出')) {
    sysType = 'logout'
  } else if (action.includes('重置')) {
    sysType = 'update'
  } else if (action.includes('禁用') || action.includes('启用')) {
    sysType = 'update'
  }
  
  const newLog = {
    id: generateDeterministicId('log', userName + '-' + time),
    time,
    userName,
    userId,
    ip: getCachedIP(),
    module: sysModule,
    type: sysType,
    description: `${action} - ${target}`,
    status: result === '成功' ? 'success' : (result === '失败' ? 'fail' : 'success'),
    data: JSON.stringify({ action, target, detail }),
    error: result === '失败' ? detail : ''
  }
  
  let sysLogs = []
  const storedLogs = sessionStorage.getItem(sysLogsKey)
  if (storedLogs) {
    sysLogs = JSON.parse(storedLogs)
  }
  sysLogs.unshift(newLog)
  if (sysLogs.length > 100) {
    sysLogs.pop()
  }
  sessionStorage.setItem(sysLogsKey, JSON.stringify(sysLogs))
}

const viewOperationLogs = () => {
  operationLogVisible.value = true
}

const filteredLogs = computed(() => {
  const sysLogsKey = `smart_pe_sys_operation_logs_${currentSchoolId.value}`
  let sysLogs = []
  try { sysLogs = JSON.parse(sessionStorage.getItem(sysLogsKey) || '[]') } catch {}
  // Filter to user module logs + login/logout logs from system module
  const moduleLogs = sysLogs.filter(l => l.module === 'user' || (l.module === 'system' && (l.type === 'login' || l.type === 'logout')))
  return moduleLogs.filter(log => {
    const matchSearch = !logSearch.value ||
      (log.userName && log.userName.includes(logSearch.value)) ||
      (log.description && log.description.includes(logSearch.value))
    // 从 description 提取实际操作名（格式: "操作名 - 目标"）
    const actionName = log.description ? log.description.split(' - ')[0] : (log.type || '')
    const matchAction = !logActionFilter.value || actionName === logActionFilter.value
    const resultName = log.status === 'success' ? '成功' : '失败'
    const matchResult = !logResultFilter.value || resultName === logResultFilter.value
    return matchSearch && matchAction && matchResult
  }).map(log => {
    let detail = ''
    try { const d = JSON.parse(log.data || '{}'); detail = d.detail || '' } catch {}
    return {
      time: log.time,
      operator: log.userName,
      action: log.description ? log.description.split(' - ')[0] : log.type,
      target: log.description ? log.description.split(' - ').slice(1).join(' - ') : '',
      ip: log.ip,
      device: 'Windows PC',
      result: log.status === 'success' ? '成功' : '失败',
      detail
    }
  })
})

const refreshLogs = () => {
  ElMessage.info('日志已刷新')
}

const exportLogs = () => {
  const headers = ['操作时间', '操作人', '操作类型', '操作对象', 'IP地址', '设备', '结果', '详情']
  const rows = filteredLogs.value.map(log => [
    log.time,
    log.operator,
    log.action,
    log.target,
    log.ip,
    log.device,
    log.result,
    log.detail
  ])
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `操作日志_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('操作日志已导出')
}

const getRoleLabel = (role) => {
  const found = roleOptions.find(r => r.value === role)
  return found ? found.label : role
}

const getRoleClass = (role) => {
  const classMap = {
    district: 'role-district',
    school: 'role-school',
    campus: 'role-campus',
    admin_teacher: 'role-admin-teacher',
    teacher: 'role-teacher',
    class: 'role-class'
  }
  return classMap[role] || ''
}

const getStaffRoleText = (identity) => {
  if (!identity) return ''
  const roles = []
  if (identity.leadership === 1) roles.push('学校管理员')
  if (identity.sport_teacher === 1) roles.push('体育老师')
  if (identity.class_adviser === 1) roles.push('班主任')
  return roles.length > 0 ? roles.join(' / ') : '普通职工'
}
</script>

<style scoped>
.user-management {
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

/* 安全信息栏 */
.security-info-bar {
  background: #EFF6FF;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1A1A2E;
}

.security-item .el-icon {
  color: #1E5AA8;
  font-size: 16px;
}

.security-divider {
  width: 1px;
  height: 16px;
  background: #E8EAED;
}

/* 数据脱敏 */
.masked-data {
  font-family: monospace;
  color: #1A1A2E;
}

.mask-icon {
  margin-left: 4px;
  font-size: 12px;
  color: #9CA3AF;
  cursor: pointer;
}

.mask-icon:hover {
  color: #1E5AA8;
}

/* 卡片 */
.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* 待审批卡片 */
.approval-card {
  background: #FFFBEB;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #FCD34D;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.approval-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFFFFF;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #FEF3C7;
}

.approval-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.approval-action {
  padding: 4px 12px;
  background: #FEE2E2;
  color: #991B1B;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.approval-target {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.approval-initiator {
  font-size: 12px;
  color: #6B7280;
}

.approval-time {
  font-size: 12px;
  color: #9CA3AF;
}

.approval-actions {
  display: flex;
  gap: 8px;
}

/* 用户信息单元格 */
.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.user-username {
  font-size: 12px;
  color: #9CA3AF;
}

/* 标签 */
.role-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.role-school { background: #DCFCE7; color: #166534; }
.role-teacher { background: #FEF3C7; color: #92400E; }
.role-class { background: #FCE7F3; color: #9D174D; }
.role-district { background: #FEE2E2; color: #DC2626; }
.role-campus { background: #E0E7FF; color: #4338CA; }
.role-admin-teacher { background: #FEF3C7; color: #D97706; }

.status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-active { background: #DCFCE7; color: #166534; }
.status-disabled { background: #F3F4F6; color: #6B7280; }

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 用户详情 */
.user-detail {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E8EAED;
  margin-bottom: 20px;
}

.user-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #1A1A2E;
}

.user-info p {
  margin: 0;
  font-size: 13px;
  color: #6B7280;
}

.detail-body {
  padding: 0 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F7F8FA;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #6B7280;
  font-size: 14px;
}

.detail-value {
  color: #1A1A2E;
  font-weight: 500;
}
.stat-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.security-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 16px;
}

.security-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.security-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 10px;
  border: 1px solid #F3F4F6;
}

.security-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.security-icon.success { background: #DCFCE7; color: #166534; }
.security-icon.warning { background: #FEF3C7; color: #92400E; }
.security-icon.primary { background: #DBEAFE; color: #1E40AF; }

.security-body {
  flex: 1;
  min-width: 0;
}

.security-value {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.security-label {
  font-size: 12px;
  color: #6B7280;
  margin-top: 2px;
}

/* 手机号显示控制 */
.phone-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eye-icon {
  cursor: pointer;
  color: #9CA3AF;
  transition: color 0.2s;
}

.eye-icon:hover {
  color: #1E5AA8;
}

/* 操作日志弹窗样式 */
.log-filters {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.log-summary {
  flex: 1;
  display: flex;
  align-items: center;
  color: #6B7280;
  font-size: 12px;
}

/* 角色层级展示 */
.role-hierarchy-bar {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #E8EAED;
}

.hierarchy-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
  white-space: nowrap;
}

.hierarchy-title .el-icon {
  color: #1E5AA8;
  font-size: 16px;
}

.hierarchy-levels {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.hierarchy-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hierarchy-arrow {
  color: #9CA3AF;
  font-size: 16px;
  font-weight: 600;
  margin: 0 2px;
}

/* 身份角色标签样式 */
.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 身份角色多选框样式 */
.identity-checkboxes {
  display: flex;
  gap: 20px;
}

/* 人脸上传弹窗样式 */
.face-upload-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border: 2px dashed #E8EAED;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #F7F8FA;
}

.upload-area:hover {
  border-color: #1E5AA8;
  background: #EEF6FF;
}

.upload-area p {
  margin: 8px 0 0;
  font-size: 14px;
  color: #6B7280;
}

.upload-tip {
  font-size: 12px !important;
  color: #9CA3AF !important;
}

.upload-input {
  display: none;
}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #E8EAED;
}

.file-name {
  font-size: 12px;
  color: #6B7280;
}

/* ===== 人脸录入向导样式 ===== */

.face-registration {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.registration-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-indicator span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #E8EAED;
  color: #6B7280;
  font-size: 14px;
  font-weight: 600;
}

.step-indicator span.active {
  background: #1E5AA8;
  color: #FFFFFF;
}

.step-line {
  width: 60px;
  height: 2px;
  background: #E8EAED;
}

.step-labels {
  display: flex;
  gap: 40px;
  font-size: 12px;
  color: #6B7280;
}

.step-content {
  min-height: 400px;
}

/* 步骤 1: 选择教职工 */
.select-student {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #E8EAED;
  cursor: pointer;
  transition: all 0.2s;
}

.student-item:hover {
  background: #F7F8FA;
  border-color: #1E5AA8;
}

.student-item.selected {
  background: rgba(30, 90, 168, 0.1);
  border-color: #1E5AA8;
}

.student-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.student-id {
  font-size: 12px;
  color: #6B7280;
}

.face-status {
  font-size: 12px;
  color: #1E5AA8;
  padding: 4px 8px;
  background: rgba(30, 90, 168, 0.1);
  border-radius: 4px;
}

.filter-options {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: #9CA3AF;
}

.empty-hint p {
  margin: 0;
  font-size: 13px;
}

/* 步骤 2: 采集图像 */
.camera-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.camera-frame {
  position: relative;
  width: 320px;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
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

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #6B7280;
}

.preview-placeholder p {
  font-size: 14px;
}

.video-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.captured-image {
  width: 320px;
  height: 400px;
  object-fit: cover;
  border-radius: 12px;
}

.preview-hint {
  font-size: 14px;
  color: #9CA3AF;
}

.preview-hint-small {
  font-size: 12px;
  color: #9CA3AF;
}

.face-guide {
  position: absolute;
  top: 60px;
  left: 60px;
  right: 60px;
  bottom: 60px;
  pointer-events: none;
}

.guide-line {
  position: absolute;
  background: rgba(30, 90, 168, 0.5);
}

.guide-line.top {
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.guide-line.bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.guide-line.left {
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
}

.guide-line.right {
  top: 0;
  bottom: 0;
  right: 0;
  width: 2px;
}

.guide-text {
  position: absolute;
  bottom: -30px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: #1E5AA8;
}

.face-guide.scanning {
  animation: scan 1.5s ease-in-out infinite;
}

@keyframes scan {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.camera-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6B7280;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #E8EAED;
}

.status-indicator.active {
  background: #1E5AA8;
}

.status-indicator.ready {
  background: #1E5AA8;
}

.camera-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.captured-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.captured-hint {
  font-size: 14px;
  color: #1E5AA8;
  font-weight: 500;
}

/* 步骤 3: 完成录入 */
.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 20px;
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #1E5AA8;
  color: #FFFFFF;
  font-size: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
}

.student-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.summary-id {
  font-size: 14px;
  color: #6B7280;
}

.success-hint {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

.status-success {
  color: #1E5AA8;
}
</style>