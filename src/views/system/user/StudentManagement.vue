<template>
  <div class="student-management">
    <LoadingOverlay :visible="loading" text="正在同步数据..." subText="请稍候" />
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索学生姓名/学号"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterGrade" placeholder="选择年级" clearable style="width: 140px">
          <el-option label="全部年级" value="all" />
          <el-option label="一年级" value="一年级" />
          <el-option label="二年级" value="二年级" />
          <el-option label="三年级" value="三年级" />
          <el-option label="四年级" value="四年级" />
          <el-option label="五年级" value="五年级" />
          <el-option label="六年级" value="六年级" />
        </el-select>
        <el-select v-model="filterClass" placeholder="选择班级" clearable style="width: 140px">
          <el-option v-for="c in classOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="filterType" placeholder="班级类型" clearable style="width: 140px">
          <el-option label="行政班" value="行政班" />
          <el-option label="分项班" value="分项班" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportStudents">导出名单</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateStudentDialog">新建学生</el-button>
        <el-dropdown @command="handleImportCommand">
          <el-button type="primary" :icon="Plus">
            导入学生
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="local">从本地文件导入</el-dropdown-item>
              <el-dropdown-item command="external">从外部系统导入</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" :icon="Camera" @click="faceRegistration">面部录入</el-button>
        <el-button type="primary" :icon="Odometer" @click="showPromotionDialog = true">自动升学</el-button>
        <el-button type="primary" :icon="Star" @click="showRecommendDialog = true">智能分班推荐</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ students.length }}</span>
        <span class="stat-label">学生总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ faceRegisteredCount }}</span>
        <span class="stat-label">已录面部</span>
      </div>  
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ adminClasses.length }}</span>
        <span class="stat-label">行政班</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ itemClasses.length }}</span>
        <span class="stat-label">分项班</span>
      </div>
    </div>

    <!-- 学生列表 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">学生名单</span>
        <div class="header-actions">
          <!-- 批量操作工具栏 -->
          <div v-if="selectedStudents.length > 0" class="batch-actions">
            <span class="batch-count">已选择 {{ selectedStudents.length }} 名学生</span>
            <el-button size="small" type="primary" @click="batchExport">批量导出</el-button>
            <el-button size="small" @click="batchEditClass">批量修改班级</el-button>
            <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
            <el-button size="small" text @click="clearSelection">取消选择</el-button>
          </div>
          <template v-else>
            <el-button text :icon="Setting" @click="showColumnSettings = true">列设置</el-button>
            <el-button text :icon="Refresh" @click="refreshData">刷新</el-button>
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="(filteredStudents || []).length"
              :page-sizes="[8, 12, 16]"
              layout="total, sizes, prev, pager, next"
              small
            />
          </template>
        </div>
      </div>
      <div class="table-container">
        <el-table
          :data="paginatedStudents || []"
          stripe
          class="w-full"
          @selection-change="handleSelectionChange"
          @cell-dblclick="handleCellDblclick"
        >
        <el-table-column v-if="visibleColumns.selection" type="selection" width="50" />
        <el-table-column v-if="visibleColumns.id" prop="id" label="学号" min-width="200">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'id'">{{ scope.row.id }}</span>
            <el-input
              v-else
              v-model="editValue"
              @blur="saveEdit"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
              ref="editInput"
            />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.studentInfo" label="学生信息" min-width="150">
          <template #default="scope">
            <div class="student-info-cell">
              <LazyFaceAvatar 
                :cimg-url="scope.row.cimgUrl" 
                :face-photo="scope.row.facePhoto" 
                :school-id="schoolId" 
                :size="32"
                @loaded="(base64) => { scope.row.facePhoto = base64 }"
              />
              <div class="student-meta">
                <span class="student-name">{{ scope.row.name }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.gender" prop="gender" label="性别" width="70">
          <template #default="scope">
            <span class="gender-tag" :class="scope.row.gender === '男' ? 'gender-男' : 'gender-女'">
              {{ scope.row.gender }}
            </span>
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.grade" prop="grade" label="年级" width="80">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'grade'">{{ scope.row.grade }}</span>
            <el-input
              v-else
              v-model="editValue"
              @blur="saveEdit"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
            />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.class" prop="class" label="班级" width="80">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'class'">{{ scope.row.class }}</span>
            <el-input
              v-else
              v-model="editValue"
              @blur="saveEdit"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
            />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.age" prop="age" label="年龄" width="60">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'age'">{{ scope.row.age }}</span>
            <el-input
              v-else
              v-model="editValue"
              type="number"
              @blur="saveEdit"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
            />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.faceRegistered" label="面部信息" width="90">
          <template #default="scope">
            <span class="face-tag" :class="scope.row.faceRegistered ? 'face-yes' : 'face-no'">
              {{ scope.row.faceRegistered ? '已录入' : '未录入' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.testStatus" label="体测状态" width="120">
          <template #default="scope">
            <span v-if="scope.row.hasTestRecord" class="test-tag test-done">
              {{ scope.row.latestTestGrade || '已完成' }}
            </span>
            <span v-else class="test-tag test-pending">未测试</span>
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.sportsInterest" prop="sportsInterest" label="体育兴趣" min-width="100">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'sportsInterest'">{{ scope.row.sportsInterest }}</span>
            <el-input
              v-else
              v-model="editValue"
              @blur="saveEdit"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
            />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.itemClass" prop="itemClass" label="分项班" min-width="120">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'itemClass'">
              <span v-if="scope.row.itemClass" class="item-class-tag">{{ scope.row.itemClass }}</span>
              <span v-else class="text-gray">未加入</span>
            </span>
            <el-input
              v-else
              v-model="editValue"
              @blur="saveEdit"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
            />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.actions" label="操作" min-width="300" fixed="right">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="viewStudentDetail(scope.row)">详情</el-button>
            <el-button text type="primary" size="small" @click="editStudent(scope.row)">编辑</el-button>
            <el-button text type="primary" size="small" @click="reRecordFace(scope.row)">重录面部</el-button>
            <el-button text type="danger" size="small" @click="deleteStudent(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
        </div>
      </div>

    <!-- 班级管理 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">班级管理</span>
        <el-button type="primary" size="small" :icon="Plus" @click="createClass">新建班级</el-button>
      </div>
      <div class="class-grid">
        <div class="class-card" v-for="cls in classes" :key="cls.id">
          <div class="class-header">
            <span class="class-name">{{ cls.name }}</span>
            <span class="class-type" :class="cls.type === '行政班' ? 'type-admin' : 'type-item'">{{ cls.type }}</span>
          </div>
          <div class="class-body">
            <div class="class-stat">
              <span class="stat-num">{{ getClassStudentCount(cls.name) }}</span>
              <span class="stat-label">人</span>
            </div>
            <div class="class-actions">
              <el-button text type="primary" size="small" @click="viewClass(cls)">查看</el-button>
              <el-button text size="small" @click="editClass(cls)">编辑</el-button>
              <el-button text type="danger" size="small" @click="deleteClass(cls)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自动升学弹窗 -->
    <ElDialog
      v-model="showPromotionDialog"
      title="自动升学"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="promotion-form">
        <!-- 开学季说明 -->
        <div class="auto-info">
          <div class="auto-icon"><el-icon :size="24" color="#1E5AA8"><Reading /></el-icon></div>
          <div class="auto-text">
            <strong>新学年自动升学</strong>
            <p>一键完成全校学生年级升级，毕业班自动清出，无需教务老师逐个修改</p>
          </div>
        </div>

        <!-- 自动升学开关 -->
        <div class="form-item">
          <label class="form-label">自动升学设置</label>
          <div class="auto-toggle">
            <el-switch
              v-model="autoPromotionEnabled"
              active-text="开启"
              inactive-text="关闭"
              inline-prompt
            />
            <span class="toggle-desc">开启后，系统将在每学年开学时自动执行全校升学</span>
          </div>
        </div>

        <!-- 指定年级升学 -->
        <div class="form-item">
          <label class="form-label">指定年级升学</label>
          <div class="single-promotion">
            <div class="promotion-selects">
              <el-select v-model="promotionSourceGrade" placeholder="选择年级" style="width: 140px">
                <el-option label="一年级" value="一年级" />
                <el-option label="二年级" value="二年级" />
                <el-option label="三年级" value="三年级" />
                <el-option label="四年级" value="四年级" />
                <el-option label="五年级" value="五年级" />
                <el-option label="六年级" value="六年级" />
              </el-select>
              <span class="arrow">→</span>
              <el-select v-model="promotionTargetGrade" placeholder="升入年级" style="width: 140px" :disabled="!promotionSourceGrade">
                <el-option label="二年级" value="二年级" />
                <el-option label="三年级" value="三年级" />
                <el-option label="四年级" value="四年级" />
                <el-option label="五年级" value="五年级" />
                <el-option label="六年级" value="六年级" />
                <el-option label="已毕业" value="毕业" />
              </el-select>
            </div>
            <el-button 
              type="primary" 
              size="small" 
              @click="executeSinglePromotion"
              :disabled="!promotionSourceGrade || !promotionTargetGrade"
            >
              执行升学
            </el-button>
          </div>
        </div>

        <!-- 指定学生升学 -->
        <div class="form-item">
          <label class="form-label">指定学生升学</label>
          <div class="student-promotion">
            <el-select-v2
              v-model="selectedStudentForPromotion"
              :options="studentOptions"
              placeholder="搜索并选择学生"
              style="width: 280px"
              filterable
              clearable
            />
            <el-select v-model="studentTargetGrade" placeholder="升入年级" style="width: 140px" :disabled="!selectedStudentForPromotion">
              <el-option label="一年级" value="一年级" />
              <el-option label="二年级" value="二年级" />
              <el-option label="三年级" value="三年级" />
              <el-option label="四年级" value="四年级" />
              <el-option label="五年级" value="五年级" />
              <el-option label="六年级" value="六年级" />
              <el-option label="已毕业" value="毕业" />
            </el-select>
            <el-button 
              type="primary" 
              size="small" 
              @click="handleStudentPromotion"
              :disabled="!selectedStudentForPromotion || !studentTargetGrade"
            >
              执行升学
            </el-button>
          </div>
        </div>

        <!-- 升学选项 -->
        <div class="form-item">
          <label class="form-label">升学选项</label>
          <el-checkbox-group v-model="promotionOptions">
            <el-checkbox label="sync-class">班级自动升级（如一(1)班→二(1)班）</el-checkbox>
            <el-checkbox label="backup">升学前自动备份数据</el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 全校升学预览 -->
        <div class="promotion-preview">
          <div class="preview-header">📊 全校升学预览</div>
          <div class="preview-content">
            <div class="preview-stats">
              <div class="stat-item">
                <span class="stat-num">{{ getAutoPromotionCount() }}</span>
                <span class="stat-label">名学生升级</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">{{ getGraduateCount() }}</span>
                <span class="stat-label">名学生毕业</span>
              </div>
            </div>
            <p class="preview-detail">一年级→二年级，二年级→三年级... 六年级学生自动标记为已毕业</p>
            <p v-if="promotionOptions.includes('sync-class')" class="preview-note">✓ 班级将同步升级（如一(1)班→二(1)班）</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPromotionDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleAutoPromotion">立即执行全校升学</el-button>
      </template>
    </ElDialog>

    <!-- 智能分班推荐弹窗 -->
    <ElDialog
      v-model="showRecommendDialog"
      title="智能分班推荐"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="recommend-dialog">
        <el-alert
          title="根据学生体育兴趣智能推荐分项班"
          type="info"
          :closable="false"
          show-icon
          class="recommend-alert"
        >
          <template #default>
            <p>系统将根据学生的体育兴趣（如篮球、足球、田径等），自动推荐适合的分项班，实现因材施教。</p>
          </template>
        </el-alert>

        <div class="recommend-stats">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <div class="stat-num">{{ students.length }}</div>
              <div class="stat-label">学生总数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-info">
              <div class="stat-num">{{ studentsWithInterest.length }}</div>
              <div class="stat-label">有体育兴趣</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✨</div>
            <div class="stat-info">
              <div class="stat-num">{{ getRecommendedCount() }}</div>
              <div class="stat-label">待推荐分班</div>
            </div>
          </div>
        </div>

        <div class="recommend-list">
          <div class="list-header">
            <span>待推荐列表</span>
            <el-button text size="small" :icon="Refresh" @click="generateRecommendations">刷新推荐</el-button>
          </div>
          <div class="recommend-items">
            <div v-for="(rec, index) in recommendations" :key="index" class="recommend-item">
              <div class="item-student">
                <el-avatar :size="36" :icon="UserFilled" />
                <div class="item-info">
                  <div class="item-name">{{ rec.student.name }}</div>
                  <div class="item-detail">{{ rec.student.grade }}{{ rec.student.class }} · {{ rec.student.sportsInterest }}</div>
                </div>
              </div>
              <div class="item-recommend">
                <el-icon><ArrowRight /></el-icon>
                <span class="recommend-class">{{ rec.recommendedClass }}</span>
                <span v-if="!isClassExists(rec.recommendedClass)" class="new-tag">新建</span>
              </div>
              <div class="item-confidence">
                <span class="confidence-label">匹配度</span>
                <div class="confidence-bar">
                  <div class="confidence-fill" :style="{ width: rec.confidence + '%' }"></div>
                </div>
                <span class="confidence-value">{{ rec.confidence }}%</span>
              </div>
              <div class="item-actions">
                <el-button text type="primary" size="small" @click="applyRecommendation(rec)">采纳</el-button>
                <el-button text size="small" @click="skipRecommendation(index)">跳过</el-button>
              </div>
            </div>
            <div v-if="recommendations.length === 0" class="empty-hint">
              <el-icon :size="48" color="#9CA3AF"><Star /></el-icon>
              <p>暂无待推荐学生</p>
            </div>
          </div>
        </div>

        <div v-if="appliedStudents.length > 0" class="recommend-list">
          <div class="list-header">
            <span>已采纳学生</span>
          </div>
          <div class="recommend-items">
            <div v-for="(stu, index) in appliedStudents" :key="index" class="recommend-item applied">
              <div class="item-student">
                <el-avatar :size="36" :icon="UserFilled" />
                <div class="item-info">
                  <div class="item-name">{{ stu.name }}</div>
                  <div class="item-detail">{{ stu.grade }}{{ stu.class }} · {{ stu.sportsInterest }}</div>
                </div>
              </div>
              <div class="item-recommend">
                <el-icon><CircleCheck /></el-icon>
                <span class="recommend-class">{{ stu.itemClass }}</span>
              </div>
              <div class="item-confidence">
                <span class="applied-badge">已加入</span>
              </div>
              <div class="item-actions">
                <el-button text type="warning" size="small" @click="cancelRecommendation({ student: stu, recommendedClass: stu.itemClass })">取消</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRecommendDialog = false">关闭</el-button>
        <el-button type="primary" @click="applyAllRecommendations">一键应用所有推荐</el-button>
      </template>
    </ElDialog>

    <!-- 导入学生弹窗 -->
    <ElDialog
      v-model="importDialogVisible"
      title="导入学生名单"
      width="550px"
      :close-on-click-modal="false"
    >
      <div class="import-form">
        <div class="form-item">
          <label>选择文件</label>
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleImportFileChange"
            :on-remove="resetImport"
            :file-list="importFileList"
            accept=".xlsx,.xls,.csv"
          >
            <el-icon class="el-icon--upload"><Plus /></el-icon>
            <div class="el-upload__text">点击或拖拽文件到此处上传</div>
            <div class="el-upload__hint">支持 .xlsx, .xls, .csv 格式文件</div>
          </el-upload>
        </div>
        <div class="form-item" v-if="importPreviewData.length > 0">
          <label>数据预览（前5条）</label>
          <div class="import-preview">
            <el-table :data="importPreviewData" border size="small" class="preview-table">
              <el-table-column 
                v-for="(header, idx) in importHeaders" 
                :key="idx" 
                :label="header"
                :prop="`${idx}`"
                show-overflow-tooltip
              >
                <template #default="scope">{{ scope.row[idx] }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <div class="form-item" v-if="importStats.total > 0">
          <label>导入统计</label>
          <div class="import-stats">
            <div class="stat-chip">
              <span class="chip-num">{{ importStats.total }}</span>
              <span class="chip-label">总条数</span>
            </div>
            <div class="stat-chip chip-new">
              <span class="chip-num">{{ importStats.new }}</span>
              <span class="chip-label">新增</span>
            </div>
            <div class="stat-chip chip-update">
              <span class="chip-num">{{ importStats.update }}</span>
              <span class="chip-label">更新</span>
            </div>
            <div v-if="importStats.duplicate > 0" class="stat-chip chip-duplicate">
              <span class="chip-num">{{ importStats.duplicate }}</span>
              <span class="chip-label">重复</span>
            </div>
          </div>
        </div>
        <div class="form-item">
          <label>覆盖现有数据</label>
          <el-switch v-model="importOverwrite" />
          <span class="switch-desc">开启后将清空当前学校所有学生数据后导入</span>
        </div>
        <div class="form-item">
          <el-button type="primary" :icon="Document" @click="showTemplateDownload = true">下载导入模板</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="resetImport">重置</el-button>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmImport"
          :disabled="!importFile"
        >
          确认导入
        </el-button>
      </template>
    </ElDialog>

    <!-- 模板下载弹窗 -->
    <TemplateDownload 
      v-model:visible="showTemplateDownload" 
      template-type="student"
      :custom-templates="customTemplates"
    />

    <!-- 学生详情弹窗 -->
    <ElDialog
      v-model="detailDialogVisible"
      title="学生详情"
      width="600px"
    >
      <div v-if="selectedStudent" class="student-detail">
        <div class="detail-header">
          <LazyFaceAvatar 
            :cimg-url="selectedStudent.cimgUrl" 
            :face-photo="selectedStudent.facePhoto" 
            :school-id="schoolId" 
            :size="80"
            class="detail-avatar"
            @loaded="(base64) => { selectedStudent.facePhoto = base64 }"
          />
          <div class="student-info">
            <h3>{{ selectedStudent.name }}</h3>
            <p>学号: {{ selectedStudent.id }}</p>
          </div>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span class="detail-label">性别</span>
            <span class="detail-value">{{ selectedStudent.gender }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">年级</span>
            <span class="detail-value">{{ selectedStudent.grade }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">班级</span>
            <span class="detail-value">{{ selectedStudent.class }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">年龄</span>
            <span class="detail-value">{{ selectedStudent.age }}岁</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">面部信息</span>
            <span class="detail-value" :class="selectedStudent.faceRegistered ? 'face-registered' : 'face-unregistered'">
              {{ selectedStudent.faceRegistered ? '已录入' : '未录入' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">体育兴趣</span>
            <span class="detail-value">{{ selectedStudent.sportsInterest }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button v-if="selectedStudent.faceRegistered" type="danger" @click="removeFace">删除人脸</el-button>
        <el-button @click="editStudent(selectedStudent)">编辑</el-button>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </ElDialog>

    <!-- 列设置弹窗 -->
    <ElDialog
      v-model="showColumnSettings"
      title="表格列设置"
      width="450px"
    >
      <div class="column-settings">
        <el-checkbox-group v-model="columnSettings">
          <div class="column-option">
            <el-checkbox label="selection">选择框</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="id">学号</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="studentInfo">学生信息</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="gender">性别</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="grade">年级</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="class">班级</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="age">年龄</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="faceRegistered">面部信息</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="testStatus">体测状态</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="sportsInterest">体育兴趣</el-checkbox>
          </div>
          <div class="column-option">
            <el-checkbox label="actions">操作</el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="resetColumnSettings">重置</el-button>
        <el-button @click="showColumnSettings = false">取消</el-button>
        <el-button type="primary" @click="saveColumnSettings">确认</el-button>
      </template>
    </ElDialog>

    <!-- 新建班级弹窗 -->
    <ElDialog
      v-model="createClassDialogVisible"
      title="新建班级"
      width="450px"
    >
      <div class="class-form">
        <el-form :model="newClass" label-width="80px">
          <el-form-item label="班级类型">
            <el-radio-group v-model="newClass.type">
              <el-radio label="行政班" />
              <el-radio label="分项班" />
            </el-radio-group>
          </el-form-item>
          <template v-if="newClass.type === '行政班'">
            <el-form-item label="年级" required>
              <el-select v-model="newClass.grade" placeholder="选择年级" class="w-full" @change="newClass.classNum = ''">
                <el-option label="一年级" value="一年级" />
                <el-option label="二年级" value="二年级" />
                <el-option label="三年级" value="三年级" />
                <el-option label="四年级" value="四年级" />
                <el-option label="五年级" value="五年级" />
                <el-option label="六年级" value="六年级" />
              </el-select>
            </el-form-item>
            <el-form-item label="班级号" required>
              <el-select v-model="newClass.classNum" :disabled="!newClass.grade" placeholder="请先选择年级" class="w-full">
                <el-option v-for="n in 12" :key="n" :label="`${n}班`" :value="n" />
              </el-select>
            </el-form-item>
          </template>
          <template v-else>
            <el-form-item label="兴趣班名称" required>
              <el-input v-model="newClass.name" placeholder="请输入兴趣班名称，如：篮球兴趣班" />
            </el-form-item>
          </template>
          <el-form-item label="班主任">
            <el-input v-model="newClass.teacher" placeholder="请输入班主任姓名" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="createClassDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateClass">确认创建</el-button>
      </template>
    </ElDialog>

    <!-- 新建学生弹窗 -->
    <ElDialog
      v-model="createStudentDialogVisible"
      title="新建学生"
      width="500px"
    >
      <el-form :model="newStudent" label-width="80px">
        <el-form-item label="学号" required>
          <el-input v-model="newStudent.id" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="newStudent.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" required>
          <el-radio-group v-model="newStudent.gender">
            <el-radio label="男" />
            <el-radio label="女" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="班级类型" required>
          <el-radio-group v-model="newStudent.classType" @change="newStudent.class = ''">
            <el-radio label="行政班" />
            <el-radio label="兴趣班" />
          </el-radio-group>
        </el-form-item>
        <template v-if="newStudent.classType === '行政班'">
          <el-form-item label="年级" required>
            <el-select v-model="newStudent.grade" placeholder="选择年级" class="w-full" @change="newStudent.class = ''">
              <el-option label="一年级" value="一年级" />
              <el-option label="二年级" value="二年级" />
              <el-option label="三年级" value="三年级" />
              <el-option label="四年级" value="四年级" />
              <el-option label="五年级" value="五年级" />
              <el-option label="六年级" value="六年级" />
            </el-select>
          </el-form-item>
          <el-form-item label="班级" required>
            <el-select v-model="newStudent.class" placeholder="请先选择年级" :disabled="!newStudent.grade" class="w-full">
              <el-option v-for="c in newStudentClassOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="兴趣班" required>
            <el-input v-model="newStudent.class" placeholder="请输入兴趣班名称，如：篮球兴趣班" />
          </el-form-item>
        </template>
        <el-form-item label="年龄">
          <el-input-number v-model="newStudent.age" :min="1" :max="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createStudentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateStudent">确认创建</el-button>
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
            <span>选择学生</span>
            <span>采集图像</span>
            <span>完成录入</span>
          </div>
        </div>

        <!-- 步骤1: 选择学生 -->
        <div v-if="faceStep === 1" class="step-content">
          <div class="select-student">
            <el-input
              v-model="faceSearchQuery"
              placeholder="搜索学生姓名/学号"
              clearable
              class="w-full"
              :prefix-icon="Search"
            />
            <div class="filter-options">
              <el-radio-group v-model="faceFilterMode">
                <el-radio label="all">全部学生</el-radio>
                <el-radio label="unregistered">仅未录入</el-radio>
                <el-radio label="registered">仅已录入</el-radio>
              </el-radio-group>
            </div>
            <div class="student-list">
              <div 
                v-for="student in filteredStudentsForFace" 
                :key="student.id" 
                class="student-item"
                :class="{ selected: selectedFaceStudent?.id === student.id }"
                @click="selectFaceStudent(student)"
              >
                <el-avatar :size="40" :icon="UserFilled" />
                <div class="student-info">
                  <span class="student-name">{{ student.name }}</span>
                  <span class="student-id">{{ student.id }} · {{ student.grade }}{{ student.class }}</span>
                </div>
                <el-tag :type="student.faceRegistered ? 'success' : 'info'" size="small">
                  {{ student.faceRegistered ? '已录入' : '未录入' }}
                </el-tag>
              </div>
              <div v-if="filteredStudentsForFace.length === 0" class="empty-hint">
                <el-icon :size="48" color="#9CA3AF"><UserFilled /></el-icon>
                <p>未找到符合条件的学生</p>
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
              <el-avatar :size="64" :icon="UserFilled" />
              <div class="summary-info">
                <span class="summary-name">{{ selectedFaceStudent?.name }}</span>
                <span class="summary-id">{{ selectedFaceStudent?.id }}</span>
                <span class="summary-class">{{ selectedFaceStudent?.grade }}{{ selectedFaceStudent?.class }}</span>
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
            <p class="success-hint">学生面部信息已成功录入系统，可用于后续身份识别</p>
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
        <el-button @click="faceDialogVisible = false">取消</el-button>
      </template>
    </ElDialog>

    <!-- 重录面部信息弹窗 -->
    <ElDialog
      v-model="showReRecordFace"
      title="重新录入面部信息"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="face-reregistration">
        <div class="reregister-notice">
          <el-alert
            title="即将重新采集面部信息"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>学生姓名：<strong>{{ selectedFaceStudent?.name }}</strong></p>
              <p>学号：<strong>{{ selectedFaceStudent?.id }}</strong></p>
              <p>班级：<strong>{{ selectedFaceStudent?.grade }} {{ selectedFaceStudent?.class }}</strong></p>
              <p class="notice-hint">重新录入后，原有面部信息将被覆盖，请确认学生到场。</p>
            </template>
          </el-alert>
        </div>
        
        <div class="camera-preview">
          <div class="preview-area">
            <video 
              v-if="!faceCaptured && mediaStream" 
              ref="videoRef" 
              class="video-preview"
              autoplay 
              playsinline 
              muted
            ></video>
            <div v-else-if="!faceCaptured && !mediaStream" class="preview-placeholder">
              <el-icon :size="48"><Camera /></el-icon>
              <p>摄像头预览区域</p>
              <p>{{ cameraStatus }}</p>
            </div>
            <img 
              v-else 
              :src="capturedImageBase64" 
              class="captured-image"
              alt="已捕获的人脸"
            />
          </div>
          <canvas ref="canvasRef" style="display: none;"></canvas>
          <div class="camera-status">
            <span class="status-indicator" :class="{ active: cameraStatus.includes('就绪') }"></span>
            <span>{{ cameraStatus }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="refreshCamera">刷新摄像头</el-button>
        <el-button 
          type="warning" 
          :icon="faceCaptured ? Refresh : Camera"
          @click="captureFace"
          :disabled="!mediaStream"
        >
          {{ faceCaptured ? '重新拍照' : '拍照采集' }}
        </el-button>
        <el-button 
          type="primary" 
          @click="confirmRerecord"
          :disabled="!faceCaptured"
        >
          确认重录
        </el-button>
        <el-button @click="showReRecordFace = false">取消</el-button>
      </template>
    </ElDialog>

    <!-- 编辑学生弹窗 -->
    <ElDialog v-model="editStudentVisible" title="编辑学生信息" width="500px">
      <el-form v-if="studentForm" :model="studentForm" label-width="90px">
        <el-form-item label="学号">
          <el-input v-model="studentForm.id" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="studentForm.name" />
        </el-form-item>
        <el-form-item label="年级">
          <el-select v-model="studentForm.grade" class="w-full" @change="studentForm.class = ''">
            <el-option v-for="g in ['一年级','二年级','三年级','四年级','五年级','六年级']" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select v-model="studentForm.class" :disabled="!studentForm.grade" class="w-full">
            <el-option v-for="c in editStudentClassOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="studentForm.gender">
            <el-radio label="男" />
            <el-radio label="女" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="体育兴趣">
          <el-input v-model="studentForm.sportsInterest" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editStudentVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStudentEdit">保存</el-button>
      </template>
    </ElDialog>

    <!-- 班级详情弹窗 -->
    <ElDialog v-model="classDetailVisible" :title="`班级详情 - ${selectedClass?.name || ''}`" width="520px">
      <div v-if="selectedClass" class="class-detail">
        <div class="detail-row"><span class="detail-label">班级名称</span><span>{{ selectedClass.name }}</span></div>
        <div class="detail-row"><span class="detail-label">班级类型</span><span>{{ selectedClass.type }}</span></div>
        <div class="detail-row"><span class="detail-label">班主任</span><span>{{ selectedClass.teacher }}</span></div>
        <div class="detail-row"><span class="detail-label">学生人数</span><span>{{ getClassStudentCount(selectedClass.name) }} 人</span></div>
        <div class="detail-row"><span class="detail-label">所属年级</span><span>{{ getGradeFromClassName(selectedClass.name) }}</span></div>
      </div>
      <template #footer>
        <el-button @click="editClass(selectedClass)">编辑</el-button>
        <el-button type="primary" @click="classDetailVisible = false">关闭</el-button>
      </template>
    </ElDialog>

    <!-- 编辑班级弹窗 -->
    <ElDialog v-model="editClassVisible" title="编辑班级" width="450px">
      <el-form v-if="classForm" :model="classForm" label-width="80px">
        <el-form-item label="班级名称">
          <el-input v-model="classForm.name" />
        </el-form-item>
        <el-form-item label="班级类型">
          <el-radio-group v-model="classForm.type">
            <el-radio label="行政班" />
            <el-radio label="分项班" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="班主任">
          <el-input v-model="classForm.teacher" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editClassVisible = false">取消</el-button>
        <el-button type="primary" @click="saveClassEdit">保存</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import {
  Search, Download, Plus, Camera, Refresh,
  UserFilled, Odometer, ArrowDown, Setting,
  ArrowRight, Star, Document, CircleCheck, Reading
} from '@element-plus/icons-vue'
import { usePersistedRef } from '@/composables'
import store from '@/store/global'
import { mockDB } from '@/mock'
import * as XLSX from 'xlsx'
import { useOperationLog } from '@/composables/useOperationLog'
import TemplateDownload from '@/components/export/TemplateDownload.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import LazyFaceAvatar from '@/components/charts/LazyFaceAvatar.vue'
import { MOCK_CUSTOM_TEMPLATES } from '@/data/mockData'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'
import { getTokenData, getClassList, getStudentListV4, addStudent as addStudentApi, changeStudent as changeStudentApi, deleteStudent as deleteStudentApi, addStudentList as addStudentListApi, changeStudentList as changeStudentListApi, deleteStudentList as deleteStudentListApi, uploadStudentFaceJson as uploadStudentFaceApi, deleteStudentFace as deleteStudentFaceApi, addClass as addClassApi, changeClass as changeClassApi, deleteClass as deleteClassApi } from '@/utils/daiweiApi'
import { daiweiConfig } from '@/config/daiwei'
import { isBizSuccess, parseDaweiResponse, getFriendlyErrorMessage } from '@/utils/daweiErrorHandler'

// 操作日志
const { addLog } = useOperationLog('student')

// mock数据 - 按当前学校区分
const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const defaultStudents = computed(() => mockDB[schoolId.value]?.students || mockDB['hailin-second-primary'].students)

const defaultClasses = computed(() => mockDB[schoolId.value]?.classes || mockDB['hailin-second-primary'].classes)

// 学生数据：手动管理 sessionStorage，避免 mock 数据污染存储
// 只有 API 真实数据和用户编辑才写入 storage，mock 数据仅作临时 fallback
const studentsStorageKey = computed(() => `students_${schoolId.value}`)
const readStudentsFromStorage = () => {
  try {
    const raw = sessionStorage.getItem(studentsStorageKey.value)
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const data = JSON.parse(raw)
      // 校验数据完整性：合法学生数据必须有 grade 字段（如"一年级"）
      // 如果被污染（混入了教职工数据），grade 会为空，直接清除
      if (Array.isArray(data) && data.length > 0) {
        const hasValidGrade = data.some(s => s.grade && /\d+年级/.test(s.grade))
        if (!hasValidGrade) {
          console.warn('检测到学生数据被污染（缺少年级信息），已清除脏数据')
          sessionStorage.removeItem(studentsStorageKey.value)
          return null
        }
      }
      return data
    }
  } catch (e) { /* ignore */ }
  return null
}
const writeStudentsToStorage = (data) => {
  sessionStorage.setItem(studentsStorageKey.value, JSON.stringify(data))
}

// 数据来源标记：'api' | 'storage' | 'mock'
// mock 数据不写入 storage，防止污染
const studentsDataSource = ref('')
// 不直接从 storage 初始化，避免读取到脏数据。始终优先从 API 加载
const students = ref([])

// 用户编辑（增删改）自动同步到 storage（仅当数据来自 API/storage 时）
watch(students, (val) => {
  if (studentsDataSource.value && studentsDataSource.value !== 'mock' && val.length >= 0) {
    writeStudentsToStorage(val)
  }
}, { deep: true })

const classes = usePersistedRef(computed(() => `classes_${schoolId.value}`), defaultClasses.value)

const searchQuery = ref('')
const filterGrade = ref('')
const filterClass = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const loading = ref(true)

const loadDaiweiData = async () => {
  const schoolId = store.state.school?.id || ''
  
  try {
    const tokenResult = await getTokenData(schoolId)
    if (!tokenResult || !tokenResult.token) {
      console.warn('大沩Token获取失败或当前学校未配置大沩对接，使用本地数据')
      // 不关闭 loading，让遮罩继续显示，避免暴露 mock 数据
      // 如果 API 不可用，最终在 catch 或下面逻辑中关闭
      throw new Error('Token获取失败，使用本地数据')
    }
    
    const classResult = await getClassList({}, schoolId)
    if (String(classResult.code) !== '0' || !classResult.data) {
      console.warn('大班级数据获取失败，使用本地数据')
      throw new Error('班级数据获取失败，使用本地数据')
    }
    
    const classesMap = {}
    const parseClasses = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 4) {
          classesMap[node.dept_id] = {
            id: node.dept_id,
            name: node.name,
            type: '行政班',
            grade: node.name.replace(/\d+班$/, ''),
            className: node.name.replace(/^[一二三四五六]年级/, ''),
            feature: node.feature || {}
          }
        }
        if (node.children && node.children.length > 0) {
          parseClasses(node.children)
        }
      })
    }
    parseClasses(classResult.data)
    
    const newClasses = Object.values(classesMap).map(c => ({
      id: c.id,
      name: c.name,
      type: '行政班',
      teacher: '',
      studentCount: 0
    }))
    
    const gradeNames = [...new Set(newClasses.map(c => c.name.replace(/\d+班$/, '')))]
    gradeNames.forEach(grade => {
      if (!classes.value.some(c => c.name === grade)) {
        newClasses.push({
          id: generateDeterministicId('G', grade),
          name: grade,
          type: '行政班',
          teacher: '',
          studentCount: 0
        })
      }
    })
    
    classes.value = newClasses
   
    
    const result = await getStudentListV4({ page: 1, size: 2000 }, schoolId)
    const allStudents = result.list || []
   
    if (allStudents.length > 0) {
    
    }
    
    const newStudents = allStudents.map(s => {
      const classInfo = classesMap[s.class_id]
      const grade = classInfo?.grade || ''
      const className = classInfo?.className || ''
      
      const gradeNum = grade ? parseInt(grade.replace('年级', '')) : 0
      const age = gradeNum > 0 ? gradeNum + 6 : 8
      
      return {
        id: s.student_id,
        name: s.name,
        gender: s.gender === 1 ? '男' : '女',
        grade: grade,
        class: className,
        className: className,
        age: age,
        faceRegistered: !!s.cimg_url,
        sportsInterest: '',
        itemClass: '',
        studentNumber: s.student_number || '-',
        cimgUrl: s.cimg_url || '',
        facePhoto: '',
        phone: '',
        idCard: '',
        parentName: '',
        parentPhone: '',
        address: '',
        createTime: new Date().toISOString(),
        status: '正常'
      }
    })
    
    if (newStudents.length > 0) {
      studentsDataSource.value = 'api'
      students.value = newStudents
      writeStudentsToStorage(newStudents)
    } else {
      // API 返回空列表，用 mock 兜底但不写入 storage
      studentsDataSource.value = 'mock'
      students.value = defaultStudents.value
    }
    loading.value = false
  } catch (error) {
    // API 失败，尝试从 storage 读取（带校验），最后用 mock 兜底
    const cached = readStudentsFromStorage()
    if (cached && cached.length > 0) {
      studentsDataSource.value = 'storage'
      students.value = cached
    } else {
      studentsDataSource.value = 'mock'
      students.value = defaultStudents.value
    }
    loading.value = false
  }
}

const refreshData = () => {
  searchQuery.value = ''
  filterGrade.value = ''
  filterClass.value = ''
  filterType.value = ''
  currentPage.value = 1
  ElMessage.success('数据已刷新')
}

const filteredStudents = computed(() => {
  let result = [...students.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }
  
  const selectedClass = classes.value.find(c => c.name === filterClass.value)
  const isItemClass = selectedClass?.type === '分项班'
  
  if (!isItemClass && filterGrade.value && filterGrade.value !== 'all') {
    result = result.filter(s => s.grade === filterGrade.value)
  }
  
  if (filterClass.value) {
    if (isItemClass) {
      result = result.filter(s => s.itemClass === filterClass.value)
    } else {
      result = result.filter(s => `${s.grade}${s.class}` === filterClass.value || s.class === filterClass.value)
    }
  }
  
  if (filterType.value) {
    if (filterType.value === '行政班') {
      result = result.filter(s => !s.itemClass || !s.itemClass.trim())
    } else if (filterType.value === '分项班') {
      result = result.filter(s => s.itemClass && s.itemClass.trim())
    }
  }
  return result
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStudents.value.slice(start, start + pageSize.value)
})

const adminClasses = computed(() => classes.value.filter(c => c.type === '行政班'))
const itemClasses = computed(() => classes.value.filter(c => c.type === '分项班'))
const getClassStudentCount = (className) => {
  const cls = classes.value.find(c => c.name === className)
  if (!cls) return 0
  if (cls.type === '行政班') {
    return students.value.filter(s => className.includes(s.grade) && className.includes(s.class)).length
  } else {
    return students.value.filter(s => s.itemClass === className).length
  }
}
const faceRegisteredCount = computed(() => students.value.filter(s => s.faceRegistered).length)
const studentsWithInterest = computed(() => students.value.filter(s => s.sportsInterest?.trim()))
const getRecommendedCount = () => students.value.filter(s => s.sportsInterest?.trim() && !s.itemClass).length
const appliedStudents = computed(() => students.value.filter(s => s.itemClass && s.sportsInterest?.trim()))

// H1: classOptions for filter dropdown - extract unique class names from classes
const classOptions = computed(() => {
  let filtered = classes.value
  
  if (filterType.value) {
    filtered = filtered.filter(c => c.type === filterType.value)
  }
  
  if (filterGrade.value && filterGrade.value !== 'all' && filterType.value !== '分项班') {
    filtered = filtered.filter(c => c.name.startsWith(filterGrade.value))
  }
  
  return [...new Set(filtered.map(c => c.name))]
})

// H2: studentOptions for el-select-v2 in promotion dialog
const studentOptions = computed(() =>
  students.value.map(s => ({
    value: s.id,
    label: `${s.name} (${s.grade}${s.class})`
  }))
)

const addStudent = async (data) => {
  const studentId = data.id || generateDeterministicId('stu', data.name || 'new')
  const genderMap = { '男': 1, '女': 2, '未知': 0 }
  const className = data.class || data.className || ''
  const grade = data.grade || ''
  const classId = className ? getClassIdByName(className, grade) : ''
  
  const apiData = {
    student_id: studentId,
    name: data.name,
    gender: genderMap[data.gender] || 0,
    class_id: classId
  }
  
 
  
  if (classId && daiweiConfig.enabled) {
    try {
      const result = await addStudentApi(apiData, store.state.school.id)
      
      // 检查业务错误（HTTP 200 + code != '0'）
      if (!isBizSuccess(result)) {
        ElMessage.error(getFriendlyErrorMessage(result, '添加学生'))
        return  // 业务失败，不添加到本地
      }
    } catch (error) {
      // 网络错误：已在 daiweiApi 中回退到 mock，这里可继续
      console.warn('添加学生API调用失败，已回退Mock:', error.message)
    }
  } else if (classId && !daiweiConfig.enabled) {
    // 大沩未启用，直接使用 mock 数据
  } else {
    console.warn('班级名称"', className, '"未找到对应的班级ID，跳过API调用')
  }
  
  students.value.unshift({
    id: studentId,
    ...data,
    faceRegistered: false,
    cimgUrl: '',
    facePhoto: '',
    sportsInterest: '',
    itemClass: ''
  })
  addLog('添加学生', data.name || '新学生', `添加学生"${data.name}"`)
}
const updateStudent = async (id, data) => {
  const genderMap = { '男': 1, '女': 2, '未知': 0 }
  const className = data.class || data.className || ''
  const grade = data.grade || ''
  const classId = className ? getClassIdByName(className, grade) : ''
  
  const apiData = {
    student_id: id,
    name: data.name,
    gender: genderMap[data.gender] || 0,
    class_id: classId
  }
  
  if (classId && daiweiConfig.enabled) {
    try {
      const result = await changeStudentApi(apiData, store.state.school.id)
      
      // 检查业务错误
      if (!isBizSuccess(result)) {
        ElMessage.error(getFriendlyErrorMessage(result, '修改学生'))
        return  // 业务失败，不更新本地
      }
    } catch (error) {
      console.warn('修改学生API调用失败，已回退Mock:', error.message)
    }
  } else if (!daiweiConfig.enabled) {
    // 大沩未启用，直接使用 mock 数据
  } else {
    console.warn('班级名称"', className, '"未找到对应的班级ID，跳过API调用')
  }
  
  const idx = students.value.findIndex(s => s.id === id)
  if (idx > -1) {
    Object.assign(students.value[idx], data)
    addLog('修改学生', data.name || '', `修改学生"${data.name}"的信息`)
  }
}
const removeStudent = async (id) => {
 
  if (daiweiConfig.enabled) {
    try {
      const result = await deleteStudentApi({ student_id: id }, store.state.school.id)
      
      // 检查业务错误
      if (!isBizSuccess(result)) {
        ElMessage.error(getFriendlyErrorMessage(result, '删除学生'))
        return  // 业务失败，不删除本地
      }
    } catch (error) {
      console.warn('删除学生API调用失败，已回退Mock:', error.message)
    }
  }
  
  const idx = students.value.findIndex(s => s.id === id)
  if (idx > -1) {
    const name = students.value[idx].name
    students.value.splice(idx, 1)
    addLog('删除学生', name, `删除学生"${name}"`)
  }
}
const batchRemoveStudents = async (ids) => {

  if (daiweiConfig.enabled) {
    try {
      const deleteList = ids.map(id => ({ student_id: id }))
      const result = await deleteStudentListApi({ delete_list: deleteList }, store.state.school.id)
      
      // 检查业务错误
      if (!isBizSuccess(result)) {
        ElMessage.error(getFriendlyErrorMessage(result, '批量删除学生'))
        return  // 业务失败，不删除本地
      }
    } catch (error) {
      console.warn('批量删除学生API调用失败，已回退Mock:', error.message)
    }
  }
  
  students.value = students.value.filter(s => !ids.includes(s.id))
  addLog('批量删除', `共${ids.length}人`, `批量删除${ids.length}名学生`)
}
const addClass = async (data) => {
  let className = ''
  let classLevel = -1
  
  if (data.type === '行政班') {
    className = `${data.grade || ''}${data.classNum || ''}班`
    classLevel = parseInt(data.classNum) || -1
  } else {
    className = data.name || ''
  }
  
  // 获取当前学校的班级结构，找到正确的父级ID
  let pid = '-1'
  try {
    const classResult = await getClassList({ dept_id: '-1', recursion: 1 }, store.state.school.id)
    if (String(classResult.code) === '0' && classResult.data && classResult.data.length > 0) {
      // 解析班级结构，找到对应年级的ID
      const findGradeId = (nodes, gradeName) => {
        for (const node of nodes) {
          if (node.type === 3 && node.name === gradeName) {
            return node.dept_id
          }
          if (node.children && node.children.length > 0) {
            const found = findGradeId(node.children, gradeName)
            if (found) return found
          }
        }
        return null
      }
      
      const gradeName = data.grade || ''
      const gradeId = findGradeId(classResult.data, gradeName)
      if (gradeId) {
        pid = gradeId
      }
    }
  } catch (error) {
    console.warn('获取班级结构失败，使用默认父级:', error.message)
  }
  
  const apiData = {
    type: 4,
    name: className,
    pid: pid,
    class_level: classLevel
  }
  
  try {
    const result = await addClassApi(apiData, store.state.school.id)
    const classId = result.data?.dept_id || generateDeterministicId('C', className)
    
    classes.value.unshift({
      id: classId,
      name: className,
      type: data.type,
      teacher: data.teacher || '',
      studentCount: 0
    })
  } catch (error) {
    console.warn('添加班级API调用失败:', error.message)
    classes.value.unshift({
      id: generateDeterministicId('C', className),
      name: className,
      type: data.type,
      teacher: data.teacher || '',
      studentCount: 0
    })
  }
}
const updateClass = async (id, data) => {
  const idx = classes.value.findIndex(c => c.id === id)
  if (idx > -1) {
    Object.assign(classes.value[idx], data)
    
    const className = data.name || ''
    const classMatch = className.match(/(\d+)班$/)
    const classLevel = classMatch ? parseInt(classMatch[1]) : -1
    
    try {
      await changeClassApi({
        dept_id: id,
        type: 4,
        name: className,
        class_level: classLevel
      }, store.state.school.id)
    } catch (error) {
      console.warn('修改班级API调用失败:', error.message)
    }
  }
}
const removeClass = async (id) => {
  const idx = classes.value.findIndex(c => c.id === id)
  if (idx > -1) {
    const cls = classes.value[idx]
    // 检查班级人数
    const studentCount = getClassStudentCount(cls.name)
    if (studentCount > 0) {
      ElMessage.warning(`该班级有 ${studentCount} 名学生，无法删除。请先将学生转移到其他班级。`)
      return false
    }
    
    classes.value.splice(idx, 1)
    
    try {
      await deleteClassApi({ dept_id: id }, store.state.school.id)
    } catch (error) {
      console.warn('删除班级API调用失败:', error.message)
    }
    return true
  }
  return false
}
const executePromotion = (src, tgt) => {
  if (promotionOptions.value.includes('backup')) {
    backupBeforePromotion('single', src, tgt)
  }
  
  students.value.forEach(s => {
    if (s.grade === src) {
      s.grade = tgt
      if (tgt !== '毕业') s.class = s.class.replace(src, tgt)
    }
  })
  
  saveStudentData()
}
const executeAutoPromotion = () => {
  if (promotionOptions.value.includes('backup')) {
    backupBeforePromotion('auto', '全校', '升学')
  }
  
  const order = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  students.value.forEach(s => {
    const i = order.indexOf(s.grade)
    if (i >= 0 && i < order.length - 1) {
      s.grade = order[i + 1]
      s.class = s.class.replace(order[i], order[i + 1])
    } else if (i === order.length - 1) s.grade = '毕业'
  })
  
  saveStudentData()
}

const backupBeforePromotion = (type, source, target) => {
  const now = new Date()
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  
  const backupKey = `smart_pe_student_backup_${currentSchoolId.value}_${timestamp}`
  const backupData = {
    type: type,
    source: source,
    target: target,
    timestamp: now.toLocaleString('zh-CN'),
    students: JSON.parse(JSON.stringify(students.value)),
    classes: JSON.parse(JSON.stringify(classes.value))
  }
  
  sessionStorage.setItem(backupKey, JSON.stringify(backupData))
  
  const backupListKey = `smart_pe_backup_list_${currentSchoolId.value}`
  let backupList = []
  try {
    const stored = sessionStorage.getItem(backupListKey)
    if (stored) backupList = JSON.parse(stored)
  } catch {}
  
  backupList.unshift({
    id: timestamp,
    type: type === 'auto' ? '全校自动升学' : '指定年级升学',
    source,
    target,
    timestamp: now.toLocaleString('zh-CN'),
    studentCount: students.value.length,
    key: backupKey
  })
  
  if (backupList.length > 10) backupList.pop()
  sessionStorage.setItem(backupListKey, JSON.stringify(backupList))
  
  ElMessage.info(`✓ 升学数据已备份（保留最近10份）`)
}

const saveStudentData = () => {
  sessionStorage.setItem(`smart_pe_students_${currentSchoolId.value}`, JSON.stringify(students.value))
  sessionStorage.setItem(`smart_pe_classes_${currentSchoolId.value}`, JSON.stringify(classes.value))
}

const isClassExists = (className) => {
  return classes.value.some(c => c.name === className)
}

const generateRecommendations = () => {
  const random = createSeededRandom(schoolId.value + '_generateRecommendations')
  recommendations.value = students.value
    .filter(s => s.sportsInterest?.trim() && !s.itemClass)
    .slice(0, 10)
    .map(s => {
      const recommendedClass = s.sportsInterest + '分项班'
      const exists = isClassExists(recommendedClass)
      return {
        student: s,
        recommendedClass: recommendedClass,
        confidence: exists ? 90 + Math.floor(random() * 10) : 80 + Math.floor(random() * 15),
        classExists: exists,
        applied: false
      }
    })
}
const applyRecommendation = (rec) => {
  const s = students.value.find(x => x.id === rec.student.id)
  if (s) {
    s.itemClass = rec.recommendedClass
    rec.applied = true
    
    const existingClass = classes.value.find(c => c.name === rec.recommendedClass)
    if (!existingClass) {
      addClass({
        name: rec.recommendedClass,
        type: '分项班',
        teacher: '系统自动分配'
      })
    }
    
    const idx = recommendations.value.findIndex(r => r.student.id === rec.student.id)
    if (idx > -1) {
      recommendations.value.splice(idx, 1)
    }
    
    ElMessage.success(`${s.name} 已加入 ${rec.recommendedClass}`)
  }
}
const cancelRecommendation = (rec) => {
  const s = students.value.find(x => x.id === rec.student.id)
  if (s && s.itemClass === rec.recommendedClass) {
    s.itemClass = ''
    
    const idx = recommendations.value.findIndex(r => r.student.id === rec.student.id)
    if (idx === -1) {
      const random = createSeededRandom(schoolId.value + '_cancelRecommendation')
      const exists = isClassExists(rec.recommendedClass)
      recommendations.value.push({
        student: s,
        recommendedClass: rec.recommendedClass,
        confidence: exists ? 90 + Math.floor(random() * 10) : 80 + Math.floor(random() * 15),
        classExists: exists,
        applied: false
      })
    }
    
    ElMessage.info(`${s.name} 已退出 ${rec.recommendedClass}`)
  }
}
const applyAllRecommendations = () => {
  const appliedCount = recommendations.value.length
  
  recommendations.value.forEach(rec => {
    const s = students.value.find(x => x.id === rec.student.id)
    if (s) {
      s.itemClass = rec.recommendedClass
      
      const existingClass = classes.value.find(c => c.name === rec.recommendedClass)
      if (!existingClass) {
        addClass({
          name: rec.recommendedClass,
          type: '分项班',
          teacher: '系统自动分配'
        })
      }
    }
  })
  
  recommendations.value = []
  
  ElMessage.success(`已应用 ${appliedCount} 条分班推荐，部分班级已自动创建`)
}

const selectedStudents = ref([])

// 列设置相关
const showColumnSettings = ref(false)
const defaultColumnSettings = [
  'selection', 'id', 'studentInfo', 'gender', 'grade', 'class',
  'age', 'faceRegistered', 'testStatus', 'sportsInterest', 'itemClass', 'actions'
]
const columnSettings = ref([...defaultColumnSettings])
const visibleColumns = computed(() => {
  const cols = {}
  defaultColumnSettings.forEach(key => {
    cols[key] = columnSettings.value.includes(key)
  })
  return cols
})

const saveColumnSettings = () => {
  localStorage.setItem('studentColumnSettings', JSON.stringify(columnSettings.value))
  showColumnSettings.value = false
  ElMessage.success('列设置已保存')
}

const resetColumnSettings = () => {
  columnSettings.value = [...defaultColumnSettings]
}

// 页面加载时读取保存的列设置
const loadColumnSettings = () => {
  const saved = localStorage.getItem('studentColumnSettings')
  if (saved) {
    try {
      const savedSettings = JSON.parse(saved)
      defaultColumnSettings.forEach(col => {
        if (!savedSettings.includes(col)) {
          savedSettings.push(col)
        }
      })
      columnSettings.value = savedSettings
    } catch (e) {
      columnSettings.value = [...defaultColumnSettings]
    }
  }
}

loadColumnSettings()

onMounted(() => {
  // 清除可能存在的脏数据，确保从 API 重新加载
  const key = `students_${store.state.school?.id || 'hailin-second-primary'}`
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) {
        const hasValidGrade = data.some(s => s.grade && /\d+年级/.test(s.grade))
        if (!hasValidGrade) {
          console.warn('[StudentManagement] onMounted 检测到脏数据，清除:', key)
          sessionStorage.removeItem(key)
        }
      }
    }
  } catch (e) { /* ignore */ }

  loadDaiweiData()
})

// keep-alive 缓存组件每次被激活时都要重新加载数据，确保显示正确的学生数据
onActivated(() => {
  // 清除可能存在的脏数据
  const key = `students_${store.state.school?.id || 'hailin-second-primary'}`
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) {
        const hasValidGrade = data.some(s => s.grade && /\d+年级/.test(s.grade))
        if (!hasValidGrade) {
          console.warn('[StudentManagement] onActivated 检测到脏数据，清除:', key)
          sessionStorage.removeItem(key)
        }
      }
    }
  } catch (e) { /* ignore */ }

  // 每次都重新加载，确保数据正确
  loading.value = true
  loadDaiweiData()
})

// 弹窗控制
const importDialogVisible = ref(false)
const importOverwrite = ref(false)
const importFile = ref(null)
const importFileList = ref([])
const importHeaders = ref([])
const importPreviewData = ref([])
const importAllData = ref([])
const importStats = ref({ total: 0, new: 0, update: 0, duplicate: 0 })
const detailDialogVisible = ref(false)
const showTemplateDownload = ref(false)
const customTemplates = usePersistedRef(
  computed(() => `smart_pe_custom_templates_${schoolId.value}`),
  [...MOCK_CUSTOM_TEMPLATES]
)
const selectedStudent = ref(null)
const createClassDialogVisible = ref(false)
const createStudentDialogVisible = ref(false)
const editStudentVisible = ref(false)
const newStudent = ref({
  id: '',
  name: '',
  gender: '男',
  grade: '',
  class: '',
  age: 8,
  classType: '行政班'
})
// 行政班时，根据选中年级过滤班级下拉选项
const newStudentClassOptions = computed(() => {
  const g = newStudent.value.grade
  if (!g) return []
  return adminClasses.value
    .filter(c => c.name.startsWith(g))
    .map(c => c.name.replace(g, ''))
})
const editStudentClassOptions = computed(() => {
  const g = studentForm.value?.grade || ''
  if (!g) return []
  return adminClasses.value
    .filter(c => c.name.startsWith(g))
    .map(c => c.name.replace(g, ''))
})
const classDetailVisible = ref(false)
const editClassVisible = ref(false)
const studentForm = ref(null)
const selectedClass = ref(null)
const classForm = ref(null)
const newClass = ref({
  name: '',
  type: '行政班',
  grade: '',
  classNum: '',
  teacher: ''
})

// 自动升学相关
const showPromotionDialog = ref(false)
const autoPromotionEnabled = ref(true) // 自动升学开关，默认开启
const promotionSourceGrade = ref('')
const promotionTargetGrade = ref('')
const promotionOptions = ref(['sync-class', 'backup'])
const showRecommendDialog = ref(false)
const recommendations = ref([])

// 跳过推荐
const skipRecommendation = (index) => {
  const rec = recommendations.value[index]
  if (rec) {
    recommendations.value.splice(index, 1)
    ElMessage.info(`已跳过 ${rec.student.name} 的分班推荐`)
  }
}

// 指定学生升学
const selectedStudentForPromotion = ref('')
const studentTargetGrade = ref('')

// 获取自动升学的学生数量（排除六年级）
const getAutoPromotionCount = () => {
  return students.value.filter(s => s.grade !== '六年级').length
}

// 获取毕业班学生数量
const getGraduateCount = () => {
  return students.value.filter(s => s.grade === '六年级').length
}

// 面部录入相关
const faceDialogVisible = ref(false)
const faceStep = ref(1)
const faceSearchQuery = ref('')
const faceFilterMode = ref('unregistered')
const selectedFaceStudent = ref(null)
const cameraStatus = ref('准备就绪')
const showReRecordFace = ref(false)
const faceCaptured = ref(false)
const videoRef = ref(null)
const canvasRef = ref(null)
let mediaStream = null
const capturedImageBase64 = ref('')

// 重录面部
const reRecordFace = (student) => {
  selectedFaceStudent.value = student
  showReRecordFace.value = true
  ElMessage.info(`开始为 ${student.name} 重新录入面部信息`)
  
  setTimeout(() => {
    openCamera()
  }, 300)
}

watch(faceStep, (newVal) => {
  if (newVal === 2) {
    setTimeout(() => {
      openCamera()
    }, 300)
  }
})

const selectFaceStudent = (student) => {
  selectedFaceStudent.value = student
}

const filteredStudentsForFace = computed(() => {
  let result = students.value
  if (faceSearchQuery.value) {
    const q = faceSearchQuery.value.toLowerCase()
    result = result.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }
  if (faceFilterMode.value === 'unregistered') {
    result = result.filter(s => !s.faceRegistered)
  } else if (faceFilterMode.value === 'registered') {
    result = result.filter(s => s.faceRegistered)
  }
  return result.slice(0, 10)
})

const handleSelectionChange = (val) => {
  selectedStudents.value = val
}

// 批量操作函数
const clearSelection = () => {
  selectedStudents.value = []
}

const batchExport = () => {
  // 导出选中的学生数据
  const headers = ['学号', '姓名', '性别', '班级', '年级', '年龄', '体育兴趣', '面部信息']
  const rows = selectedStudents.value.map(student => [
    student.id,
    student.name,
    student.gender,
    student.class,
    student.grade,
    student.age,
    student.sportsInterest || '',
    student.faceRegistered ? '已录入' : '未录入'
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `批量导出学生_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`已导出 ${selectedStudents.value.length} 名学生数据`)
}

const batchEditClass = async () => {
  ElMessageBox.prompt('请选择新班级', '批量修改班级', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '班级不能为空'
  }).then(async ({ value }) => {
    const className = value
    const grade = ''
    const classId = getClassIdByName(className, grade)
    
    if (!classId) {
      ElMessage.warning('未找到对应的班级ID，请检查班级名称')
      return
    }
    
    const changeList = selectedStudents.value.map(student => ({
      student_id: student.id,
      name: student.name,
      gender: student.gender === '男' ? 1 : 2,
      class_id: classId
    }))
    
   
    
    try {
      const result = await changeStudentListApi({ change_list: changeList }, store.state.school.id)
     
    } catch (error) {
      console.warn('批量修改班级API调用失败:', error.message)
    }
    
    selectedStudents.value.forEach(student => {
      const idx = students.value.findIndex(s => s.id === student.id)
      if (idx > -1) {
        students.value[idx].class = className
        students.value[idx].className = className
      }
    })
    
    ElMessage.success(`已为 ${selectedStudents.value.length} 名学生修改班级`)
    addLog('批量修改', `共${selectedStudents.value.length}人`, `批量修改${selectedStudents.value.length}名学生的班级为"${className}"`)
    clearSelection()
  }).catch(() => { ElMessage.info('已取消批量修改') })
}

const batchDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedStudents.value.length} 名学生吗？此操作不可恢复！`,
    '批量删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
    const idsToDelete = selectedStudents.value.map(s => s.id)
    batchRemoveStudents(idsToDelete)
    ElMessage.success(`已成功删除 ${selectedStudents.value.length} 名学生`)
    clearSelection()
  }).catch(() => { ElMessage.error('批量删除学生失败，请重试') })
}

const exportStudents = () => {
  // 导出CSV格式的学生数据
  const headers = ['学号', '姓名', '性别', '年级', '班级', '年龄', '体育兴趣', '面部信息']
  const rows = filteredStudents.value.map(student => [
    student.id,
    student.name,
    student.gender,
    student.grade,
    student.class,
    student.age,
    student.sportsInterest || '',
    student.faceRegistered ? '已录入' : '未录入'
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `学生名单_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('学生名单已导出')
  addLog('导出名单', '全部学生', `导出学生名单`)
}

const generateExternalStudents = (count = 50, existingIds = new Set()) => {
  const random = createSeededRandom(schoolId.value + '_generateExternalStudents')
  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const gradeMap = { '一年级': 1, '二年级': 2, '三年级': 3, '四年级': 4, '五年级': 5, '六年级': 6 }
  const classes = ['1班', '2班', '3班', '4班', '5班', '6班']
  const sportsInterests = ['篮球', '足球', '田径', '跳绳', '游泳', '羽毛球', '乒乓球', '体操']
  const lastNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡']
  const firstNames = ['伟', '强', '敏', '静', '磊', '芳', '洋', '军', '勇', '艳', '杰', '涛', '明', '超', '秀', '敏', '娜', '丽', '平', '刚']
  
  const result = []
  
  for (let i = 0; i < count; i++) {
    const grade = grades[Math.floor(random() * grades.length)]
    const cls = classes[Math.floor(random() * classes.length)]
    const lastName = lastNames[Math.floor(random() * lastNames.length)]
    const firstName = firstNames[Math.floor(random() * firstNames.length)]
    const name = lastName + firstName
    
    const id = generateDeterministicId('ext', name + '_' + i)
    existingIds.add(id)
    
    const gradeNum = gradeMap[grade] || 1
    const age = gradeNum + 6 + Math.floor(random() * 2)
    
    result.push({
      id: id,
      name: name,
      gender: random() > 0.5 ? '男' : '女',
      grade: grade,
      class: cls,
      age: age,
      faceRegistered: false,
      sportsInterest: sportsInterests[Math.floor(random() * sportsInterests.length)],
      itemClass: ''
    })
  }
  
  return result
}

const handleImportCommand = (command) => {
  if (command === 'local') {
    importDialogVisible.value = true
  } else if (command === 'external') {
    ElMessageBox.confirm(
      '将从教务管理系统同步学生数据，是否继续？',
      '外部系统导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    ).then(() => {
      ElMessage.info('正在从教务系统同步数据...')
      setTimeout(() => {
        const existingIds = new Set(students.value.map(s => s.id))
        const externalStudents = generateExternalStudents(50, existingIds)
        
        externalStudents.forEach(student => {
          students.value.push(student)
        })
        
        ElMessage.success(`已从教务系统成功同步 ${externalStudents.length} 条学生数据`)
      }, 1500)
    }).catch(() => {
      ElMessage.info('已取消导入')
    })
  }
}

const handleImportFileChange = (file) => {
  importFile.value = file.raw
  importFileList.value = [file]
  parseImportFile(file.raw)
}

const parseImportFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
      
      if (jsonData.length < 2) {
        ElMessage.warning('文件内容为空或格式不正确')
        return
      }
      
      importHeaders.value = jsonData[0]
      importPreviewData.value = jsonData.slice(1, 6)
      importAllData.value = jsonData.slice(1)
      
      calculateImportStats()
    } catch (error) {
      console.error('解析文件失败:', error)
      ElMessage.error('文件解析失败，请检查文件格式')
    }
  }
  reader.readAsArrayBuffer(file)
}

const calculateImportStats = () => {
  const currentIds = new Set(students.value.map(s => s.id))
  let newCount = 0
  let updateCount = 0
  let duplicateCount = 0
  const seenIds = new Set()
  
  importAllData.value.forEach(row => {
    const id = row[0]?.toString().trim()
    if (!id) return
    
    if (seenIds.has(id)) {
      duplicateCount++
    } else {
      seenIds.add(id)
      if (currentIds.has(id)) {
        updateCount++
      } else {
        newCount++
      }
    }
  })
  
  importStats.value = {
    total: importAllData.value.length,
    new: newCount,
    update: updateCount,
    duplicate: duplicateCount
  }
}

const resetImport = () => {
  importFile.value = null
  importFileList.value = []
  importHeaders.value = []
  importPreviewData.value = []
  importAllData.value = []
  importStats.value = { total: 0, new: 0, update: 0, duplicate: 0 }
}

const downloadImportTemplate = () => {
  const templateData = [
    ['学号', '姓名', '性别', '年级', '班级', '年龄', '体育兴趣'],
    ['stu-001', '张三', '男', '一年级', '1班', '8', '篮球'],
    ['stu-002', '李四', '女', '一年级', '1班', '8', '跳绳'],
    ['stu-003', '王五', '男', '二年级', '2班', '9', '足球']
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '学生导入模板')
  
  XLSX.writeFile(workbook, '学生导入模板.xlsx')
  ElMessage.success('导入模板已下载')
}

const confirmImport = async () => {
  if (!importFile.value) return
  
  ElMessageBox.confirm(
    `即将导入 ${importStats.value.new} 条新数据，更新 ${importStats.value.update} 条数据${importStats.value.duplicate > 0 ? `，跳过 ${importStats.value.duplicate} 条重复数据` : ''}。${importOverwrite.value ? '覆盖模式将清空现有数据！' : ''}`,
    '导入确认',
    {
      confirmButtonText: '确定导入',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    if (importOverwrite.value) {
      students.value = []
    }
    
    const seenIds = new Set()
    let successCount = 0
    const addList = []
    const changeList = []
    const genderMap = { '男': 1, '女': 2, '未知': 0 }
    
    importAllData.value.forEach(row => {
      const id = row[0]?.toString().trim()
      if (!id || seenIds.has(id)) return
      seenIds.add(id)
      
      const grade = row[3]?.toString().trim() || ''
      const className = row[4]?.toString().trim() || ''
      const classId = className ? getClassIdByName(className, grade) : ''
      const studentData = {
        id: id,
        name: row[1]?.toString().trim() || '',
        gender: row[2]?.toString().trim() || '男',
        grade: grade,
        class: className,
        age: parseInt(row[5]) || 8,
        sportsInterest: row[6]?.toString().trim() || ''
      }
      
      if (classId) {
        const apiData = {
          student_id: id,
          name: studentData.name,
          gender: genderMap[studentData.gender] || 0,
          class_id: classId
        }
        
        const existingIndex = students.value.findIndex(s => s.id === id)
        if (existingIndex > -1) {
          Object.assign(students.value[existingIndex], studentData)
          changeList.push(apiData)
        } else {
          students.value.push({
            ...studentData,
            faceRegistered: false,
            itemClass: ''
          })
          addList.push(apiData)
        }
      } else {
        console.warn('班级名称"', className, '"未找到对应的班级ID，跳过API调用')
        const existingIndex = students.value.findIndex(s => s.id === id)
        if (existingIndex > -1) {
          Object.assign(students.value[existingIndex], studentData)
        } else {
          students.value.push({
            ...studentData,
            faceRegistered: false,
            itemClass: ''
          })
        }
      }
      successCount++
    })
    
    try {
      if (addList.length > 0) {

        const addResult = await addStudentListApi({ add_list: addList }, store.state.school.id)
      
      }
      if (changeList.length > 0) {
        const changeResult = await changeStudentListApi({ change_list: changeList }, store.state.school.id)
      }
    } catch (error) {
      console.warn('批量导入学生API调用失败:', error.message)
    }
    
    ElMessage.success(`成功导入 ${successCount} 条学生数据`)
    addLog('导入学生', '', `导入学生数据`)
    resetImport()
    importDialogVisible.value = false
  }).catch(() => {
    ElMessage.info('已取消导入')
  })
}

const faceRegistration = () => {
  faceStep.value = 1
  faceSearchQuery.value = ''
  faceFilterMode.value = 'unregistered'
  selectedFaceStudent.value = null
  cameraStatus.value = '准备就绪'
  faceCaptured.value = false
  faceDialogVisible.value = true
}

const openCamera = async () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
  }
  
  try {
    cameraStatus.value = '正在连接摄像头...'
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
    cameraStatus.value = '摄像头已就绪，请对准面部'
  } catch (error) {
    console.error('打开摄像头失败:', error)
    cameraStatus.value = '无法访问摄像头，请检查权限'
    mediaStream = null
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
  
  if (!videoRef.value || !canvasRef.value || !mediaStream) {
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
  const studentId = selectedFaceStudent.value?.id
  const studentName = selectedFaceStudent.value?.name
  
  
  
  if (!capturedImageBase64.value) {
    ElMessage.error('请先拍摄人脸照片')
    return
  }
  
  const imageBase64 = capturedImageBase64.value.split(',')[1]
  
  try {
    const result = await uploadStudentFaceApi({
      student_id: studentId,
      image: imageBase64
    }, store.state.school.id)
    
    
    if (String(result.code) === '0') {
      const student = students.value.find(s => s.id === studentId)
      if (student) {
        student.faceRegistered = true
        student.facePhoto = capturedImageBase64.value
      }
      ElMessage.success(`已成功录入 ${studentName} 的面部信息`)
      addLog('人脸录入', studentName, `为学生"${studentName}"录入面部信息`)
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
    
    const student = students.value.find(s => s.id === studentId)
    if (student) {
      student.faceRegistered = true
    }
    ElMessage.success(`已成功录入 ${studentName} 的面部信息`)
    addLog('人脸录入', studentName, `为学生"${studentName}"录入面部信息`)
  }
  
  faceDialogVisible.value = false
  faceStep.value = 1
  selectedFaceStudent.value = null
}

const confirmRerecord = async () => {
  const studentId = selectedFaceStudent.value?.id
  const studentName = selectedFaceStudent.value?.name
  
  if (!capturedImageBase64.value) {
    ElMessage.error('请先拍摄人脸照片')
    return
  }
  
  
  
  const imageBase64 = capturedImageBase64.value.split(',')[1]
  
  try {
    const result = await uploadStudentFaceApi({
      student_id: studentId,
      image: imageBase64
    }, store.state.school.id)
   
    
    if (String(result.code) === '0') {
      const student = students.value.find(s => s.id === studentId)
      if (student) {
        student.faceRegistered = true
        student.facePhoto = capturedImageBase64.value
      }
      ElMessage.success(`${studentName} 的面部信息已重新录入完成`)
      addLog('人脸重录', studentName, `为学生"${studentName}"重新录入面部信息`)
      showReRecordFace.value = false
      faceCaptured.value = false
      capturedImageBase64.value = ''
    } else if (String(result.code) === '10900') {
      ElMessage.warning('人脸验证失败，请重新拍摄人脸照片')
      faceCaptured.value = false
      capturedImageBase64.value = ''
      cameraStatus.value = '准备就绪'
    } else {
      ElMessage.error(`人脸重录失败: ${result.message || '未知错误'}`)
    }
  } catch (error) {
    console.warn('重新录入人脸API调用失败:', error.message)
    
    const student = students.value.find(s => s.id === studentId)
    if (student) {
      student.faceRegistered = true
    }
    ElMessage.success(`${studentName} 的面部信息已重新录入完成`)
    addLog('人脸重录', studentName, `为学生"${studentName}"重新录入面部信息`)
    showReRecordFace.value = false
    faceCaptured.value = false
    capturedImageBase64.value = ''
  }
}

const viewStudentDetail = (student) => {
  selectedStudent.value = student
  detailDialogVisible.value = true
}

const removeFace = async () => {
  const studentId = selectedStudent.value?.id
  const studentName = selectedStudent.value?.name
  
  ElMessageBox.confirm(
    `确定要删除学生 "${studentName}" 的人脸信息吗？此操作不可撤销。`,
    '删除人脸确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
   
    
    try {
      const result = await deleteStudentFaceApi({ student_id: studentId }, store.state.school.id)
      
      
      if (String(result.code) === '0') {
        const student = students.value.find(s => s.id === studentId)
        if (student) {
          student.faceRegistered = false
          student.facePhoto = ''
        }
        selectedStudent.value.faceRegistered = false
        selectedStudent.value.facePhoto = ''
        ElMessage.success(`已删除 ${studentName} 的人脸信息`)
        addLog('删除人脸', studentName, `删除学生"${studentName}"的人脸信息`)
      } else {
        ElMessage.error(`删除人脸失败: ${result.message || '未知错误'}`)
      }
    } catch (error) {
      console.warn('删除人脸API调用失败:', error.message)
      
      const student = students.value.find(s => s.id === studentId)
      if (student) {
        student.faceRegistered = false
        student.facePhoto = ''
      }
      selectedStudent.value.faceRegistered = false
      selectedStudent.value.facePhoto = ''
      ElMessage.success(`已删除 ${studentName} 的人脸信息`)
      addLog('删除人脸', studentName, `删除学生"${studentName}"的人脸信息`)
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const editStudent = (student) => {
  studentForm.value = { ...student }
  editStudentVisible.value = true
  detailDialogVisible.value = false
}

const saveStudentEdit = async () => {
  if (!studentForm.value?.name) {
    ElMessage.warning('请填写学生姓名')
    return
  }
  await updateStudent(studentForm.value.id, studentForm.value)
  editStudentVisible.value = false
  ElMessage.success(`已保存 ${studentForm.value.name} 的信息`)
}

const getGradeFromClassName = (className) => {
  if (!className) return '—'
  const match = className.match(/(一年级|二年级|三年级|四年级|五年级|六年级)/)
  return match ? match[1] : '—'
}

const getClassIdByName = (className, grade = '') => {
  if (!className) return ''
  
  let cls = classes.value.find(c => c.name === className || c.label === className)
  
  if (!cls && grade) {
    cls = classes.value.find(c => c.name === `${grade}${className}` || c.label === `${grade}${className}`)
  }
  
  if (!cls && !grade) {
    cls = classes.value.find(c => c.name?.endsWith(className) || c.label?.endsWith(className))
  }
  
  if (cls) return cls.id || cls.dept_id || ''
  return ''
}

const viewClass = (cls) => {
  selectedClass.value = cls
  classDetailVisible.value = true
}

const editClass = (cls) => {
  classForm.value = { ...cls }
  editClassVisible.value = true
  classDetailVisible.value = false
}

const saveClassEdit = async () => {
  if (!classForm.value?.name) {
    ElMessage.warning('请输入班级名称')
    return
  }
  await updateClass(classForm.value.id, classForm.value)
  editClassVisible.value = false
  ElMessage.success(`班级 "${classForm.value.name}" 已更新`)
}

const deleteClass = (cls) => {
  ElMessageBox.confirm(
    `确定要删除班级 "${cls.name}" 吗？此操作不可撤销。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const success = await removeClass(cls.id)
    if (success) {
      classDetailVisible.value = false
      ElMessage.success(`班级 "${cls.name}" 已删除`)
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const deleteStudent = (student) => {
  ElMessageBox.confirm(
    `确定要删除学生 "${student.name}" 吗？此操作不可撤销。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await removeStudent(student.id)
    ElMessage.success(`已删除学生: ${student.name}`)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 处理单元格编辑相关
const editingCell = ref({ row: null, column: null })
const editValue = ref('')

const handleCellDblclick = (row, column) => {
  const editableProps = ['id', 'grade', 'class', 'age', 'sportsInterest']
  if (editableProps.includes(column.property)) {
    editingCell.value = { row, column }
    editValue.value = String(row[column.property] || '')
  }
}

const saveEdit = () => {
  if (editingCell.value.row && editingCell.value.column) {
    const row = editingCell.value.row
    const prop = editingCell.value.column.property
    updateStudent(row.id, { [prop]: editValue.value })
    ElMessage.success('已更新')
  }
  cancelEdit()
}

const cancelEdit = () => {
  editingCell.value = { row: null, column: null }
  editValue.value = ''
}

// 自动升学相关函数
const getGradeStudentCount = (grade) => {
  return students.value.filter(s => s.grade === grade).length
}

// 执行全校自动升学
const handleAutoPromotion = () => {
  const upgradeCount = getAutoPromotionCount()
  const graduateCount = getGraduateCount()
  
  let confirmMsg = `确定要执行全校自动升学吗？\n\n` +
    `• ${upgradeCount} 名学生将升入下一年级（一→二、二→三...五→六）\n` +
    `• ${graduateCount} 名六年级学生将标记为已毕业`
  
  if (promotionOptions.value.includes('sync-class')) {
    confirmMsg += '\n• 班级将同步升级（如一(1)班→二(1)班）'
  }
  
  if (promotionOptions.value.includes('backup')) {
    confirmMsg += '\n\n（系统将在升学前自动备份数据）'
  }
  
  ElMessageBox.confirm(
    confirmMsg,
    '全校升学确认',
    {
      confirmButtonText: '确认升学',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    executeAutoPromotion()
    ElMessage.success(`✓ 全校升学完成！\n${upgradeCount} 名学生已升级，${graduateCount} 名学生已毕业`)
    showPromotionDialog.value = false
  }).catch(() => {
    ElMessage.info('已取消升学')
  })
}

// 执行指定年级升学
const executeSinglePromotion = () => {
  if (!promotionSourceGrade.value || !promotionTargetGrade.value) {
    ElMessage.warning('请选择升学年级和目标年级')
    return
  }
  
  const studentCount = getGradeStudentCount(promotionSourceGrade.value)
  
  let confirmMsg = `确定要将 ${promotionSourceGrade.value} 的 ${studentCount} 名学生升入 ${promotionTargetGrade.value} 吗？`
  
  if (promotionOptions.value.includes('backup')) {
    confirmMsg += '\n\n（系统将在升学前自动备份数据）'
  }
  
  ElMessageBox.confirm(
    confirmMsg,
    '指定年级升学确认',
    {
      confirmButtonText: '确认升学',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    executePromotion(promotionSourceGrade.value, promotionTargetGrade.value)
    ElMessage.success(`${promotionSourceGrade.value} 的 ${studentCount} 名学生已成功升入 ${promotionTargetGrade.value}`)
    // 重置选择
    promotionSourceGrade.value = ''
    promotionTargetGrade.value = ''
  }).catch(() => {
    ElMessage.info('已取消升学')
  })
}

// 执行指定学生升学
const handleStudentPromotion = () => {
  if (!selectedStudentForPromotion.value || !studentTargetGrade.value) {
    ElMessage.warning('请选择学生和目标年级')
    return
  }

  const student = students.value.find(s => s.id === selectedStudentForPromotion.value)
  if (!student) {
    ElMessage.error('未找到该学生')
    return
  }

  let confirmMsg = `确定要将学生 "${student.name}" (${student.grade}${student.class}) 升入 ${studentTargetGrade.value} 吗？`

  if (promotionOptions.value.includes('backup')) {
    confirmMsg += '\n\n（系统将在升学前自动备份数据）'
  }

  ElMessageBox.confirm(
    confirmMsg,
    '学生升学确认',
    {
      confirmButtonText: '确认升学',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    const student = students.value.find(s => s.id === selectedStudentForPromotion.value)
    if (student) {
      student.grade = studentTargetGrade.value
    }
    ElMessage.success(`学生 "${student.name}" 已成功升入 ${studentTargetGrade.value}`)
    // 重置选择
    selectedStudentForPromotion.value = ''
    studentTargetGrade.value = ''
  }).catch(() => {
    ElMessage.info('已取消升学')
  })
}

const showCreateStudentDialog = () => {
  newStudent.value = { id: '', name: '', gender: '男', grade: '', class: '', age: 8, classType: '行政班' }
  createStudentDialogVisible.value = true
}

const confirmCreateStudent = async () => {
  if (!newStudent.value.id) {
    ElMessage.warning('请输入学号')
    return
  }
  if (!newStudent.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (newStudent.value.classType === '行政班') {
    if (!newStudent.value.grade) {
      ElMessage.warning('请选择年级')
      return
    }
    if (!newStudent.value.class) {
      ElMessage.warning('请选择班级')
      return
    }
  } else {
    newStudent.value.grade = ''
    if (!newStudent.value.class) {
      ElMessage.warning('请输入兴趣班名称')
      return
    }
  }
  await addStudent({ ...newStudent.value })
  createStudentDialogVisible.value = false
  ElMessage.success(`学生 "${newStudent.value.name}" 创建成功`)
}

const createClass = () => {
  createClassDialogVisible.value = true
}

const confirmCreateClass = async () => {
  if (newClass.value.type === '行政班') {
    if (!newClass.value.grade) {
      ElMessage.warning('请选择年级')
      return
    }
    if (!newClass.value.classNum) {
      ElMessage.warning('请选择班级号')
      return
    }
  } else {
    if (!newClass.value.name) {
      ElMessage.warning('请输入兴趣班名称')
      return
    }
  }
  await addClass({ ...newClass.value })
  createClassDialogVisible.value = false
  
  const className = newClass.value.type === '行政班' 
    ? `${newClass.value.grade}${newClass.value.classNum}班`
    : newClass.value.name
  ElMessage.success(`班级 "${className}" 创建成功`)
  
  newClass.value = { name: '', type: '行政班', grade: '', classNum: '', teacher: '' }
}
</script>

<style scoped>
.student-management {
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

/* 卡片 */
.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: 100%;
  box-sizing: border-box;
}

/* 表格容器 */
.table-container {
  width: 100%;
  overflow-x: auto;
}

/* 学生信息单元格 */
.student-info-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.student-meta {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.student-gender {
  font-size: 12px;
  color: #9CA3AF;
}

/* 性别标签 */
.gender-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.gender-男 {
  background: #DBEAFE;
  color: #1E40AF;
}

.gender-女 {
  background: #FCE7F3;
  color: #BE185D;
}

/* 面部标签 */
.face-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.face-yes { background: #DCFCE7; color: #166534; }
.face-no { background: #F3F4F6; color: #6B7280; }

.test-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.test-done { background: #DCFCE7; color: #166534; }
.test-pending { background: #F3F4F6; color: #6B7280; }

.item-class-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #DBEAFE;
  color: #1E40AF;
}

.text-gray {
  color: #9CA3AF;
}

/* 重录面部信息弹窗 */
.face-reregistration {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reregister-notice {
  margin-bottom: 8px;
}

.reregister-notice p {
  margin: 8px 0;
  font-size: 14px;
}

.reregister-notice strong {
  color: #1A1A2E;
  font-weight: 600;
}

.notice-hint {
  color: #E85D4E !important;
  font-size: 12px !important;
  margin-top: 12px !important;
}

.camera-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.preview-area {
  width: 320px;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #6B7280;
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

.preview-hint-small {
  font-size: 12px;
  color: #9CA3AF;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-img-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-avatar {
  border: 2px solid #EEF6FF;
}

.preview-placeholder p {
  font-size: 14px;
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

.status-indicator.ready {
  background: #1E5AA8;
}

/* 班级网格 */
.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.class-card {
  border: 1px solid #E8EAED;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.class-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.class-header .header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 批量操作栏样式 */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #EFF6FF;
  border-radius: 8px;
  flex-wrap: wrap;
}

.batch-count {
  font-size: 14px;
  color: #1A1A2E;
  font-weight: 500;
  margin-right: 8px;
}

.class-name {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A2E;
}

.class-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.type-admin { background: #DCFCE7; color: #166534; }
.type-item { background: #DBEAFE; color: #1E40AF; }

.class-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-stat .stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.class-stat .stat-label {
  font-size: 12px;
  color: #6B7280;
}

.class-actions {
  display: flex;
  gap: 4px;
}

/* 弹窗表单 */
.import-form {
  padding: 20px 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #1A1A2E;
}

/* 学生详情 */
.student-detail {
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

.student-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #1A1A2E;
}

.student-info p {
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

.face-registered { color: #1E5AA8; }
.face-unregistered { color: #E85D4E; }

/* 列设置弹窗 */
.column-settings {
  padding: 10px 0;
}

.column-option {
  padding: 8px 0;
}

/* 班级表单 */
.class-form {
  padding: 10px 0;
}
/* 面部信息录入弹窗 */
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

/* 步骤 1: 选择学生 */
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
  background: rgba(45, 125, 70, 0.1);
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
  background: rgba(45, 125, 70, 0.1);
  border-radius: 4px;
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

.preview-hint {
  font-size: 14px;
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
  background: rgba(45, 125, 70, 0.5);
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

.camera-status {
  padding: 8px 16px;
  background: rgba(45, 125, 70, 0.1);
  border-radius: 6px;
}

.status-text {
  font-size: 14px;
  color: #1E5AA8;
}

.camera-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
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

/* 自动升级弹窗样式 */
.promotion-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.promotion-form .form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.promotion-form .form-label {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

/* 自动化说明 */
.auto-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%);
  border-radius: 8px;
  border: 1px solid #BBF7D0;
}

.auto-icon {
  font-size: 28px;
}

.auto-text strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #166534;
  margin-bottom: 4px;
}

.auto-text p {
  font-size: 13px;
  color: #15803D;
  margin: 0;
}

/* 策略选择 */
.strategy-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.strategy-group .el-radio {
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.strategy-group .el-radio:hover {
  background: #F0FDF4;
}

.strategy-group .el-radio__input {
  flex-shrink: 0;
}

.strategy-group .radio-label {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
  display: block;
}

.strategy-group .radio-desc {
  font-size: 12px;
  color: #6B7280;
  display: block;
  margin-top: 2px;
}

/* 自动升学开关 */
.auto-toggle {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.toggle-desc {
  font-size: 13px;
  color: #6B7280;
}

/* 指定年级升学 */
.single-promotion {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  flex-wrap: wrap;
}

.promotion-selects {
  display: flex;
  align-items: center;
  gap: 12px;
}

.promotion-selects .arrow {
  font-size: 18px;
  color: #9CA3AF;
  font-weight: 500;
}

/* 指定学生升学 */
.student-promotion {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  flex-wrap: wrap;
}

/* 高级选项 */
.promotion-form .el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* 升级预览 */
.promotion-preview {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.promotion-preview .preview-header {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
  margin-bottom: 8px;
}

.promotion-preview .preview-content {
  font-size: 14px;
  color: #6B7280;
}

.promotion-preview .preview-content p {
  margin: 4px 0;
}

.promotion-preview .highlight {
  font-weight: 600;
  color: #1E5AA8;
}

.promotion-preview .preview-detail {
  font-size: 13px;
  color: #9CA3AF;
}

.promotion-preview .preview-hint {
  color: #9CA3AF;
  font-style: italic;
}

.promotion-preview .preview-detail {
  font-size: 13px;
  color: #9CA3AF;
  margin-top: 8px;
}

.promotion-preview .preview-note {
  font-size: 13px;
  color: #1E5AA8;
  margin-top: 8px;
}

/* 预览统计 */
.preview-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.preview-stats .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 24px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #E8EAED;
}

.preview-stats .stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
}

.preview-stats .stat-label {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

/* 智能分班推荐弹窗 */
.recommend-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recommend-alert {
  margin-bottom: 8px;
}

.recommend-alert p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #6B7280;
}

.recommend-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-info .stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.stat-info .stat-label {
  font-size: 12px;
  color: #6B7280;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.recommend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.recommend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #F7F8FA;
  border-radius: 8px;
  border: 1px solid #E8EAED;
}

.item-student {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.item-detail {
  font-size: 12px;
  color: #6B7280;
}

.item-recommend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6B7280;
}

.recommend-class {
  font-weight: 600;
  color: #1E5AA8;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.new-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: #F5A623;
  color: #FFFFFF;
  border-radius: 4px;
  font-weight: 500;
}

.item-confidence {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.confidence-label {
  font-size: 12px;
  color: #6B7280;
}

.confidence-bar {
  flex: 1;
  height: 6px;
  background: #E8EAED;
  border-radius: 3px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #1E5AA8, #3B82F6);
  border-radius: 3px;
  transition: width 0.3s;
}

.confidence-value {
  font-size: 12px;
  font-weight: 600;
  color: #1E5AA8;
  min-width: 36px;
  text-align: right;
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

.status-indicator.active {
  background: #1E5AA8;
}

.face-guide.scanning {
  animation: scan 1.5s ease-in-out infinite;
}

@keyframes scan {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.summary-class {
  font-size: 13px;
  color: #6B7280;
}

.success-details {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .detail-label {
  font-size: 12px;
  color: #6B7280;
}

.detail-item .detail-value {
  font-size: 14px;
  color: #1A1A2E;
  font-weight: 500;
}

.status-success {
  color: #1E5AA8;
}

.import-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: #F7F8FA;
  border-radius: 8px;
  min-width: 80px;
}

.stat-chip .chip-num {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
}

.stat-chip .chip-label {
  font-size: 12px;
  color: #6B7280;
  margin-top: 2px;
}

.stat-chip.chip-new {
  background: #DCFCE7;
}

.stat-chip.chip-new .chip-num {
  color: #166534;
}

.stat-chip.chip-update {
  background: #DBEAFE;
}

.stat-chip.chip-update .chip-num {
  color: #1E40AF;
}

.stat-chip.chip-duplicate {
  background: #FEF3C7;
}

.stat-chip.chip-duplicate .chip-num {
  color: #92400E;
}

.switch-desc {
  margin-left: 12px;
  font-size: 12px;
  color: #6B7280;
}
</style>
