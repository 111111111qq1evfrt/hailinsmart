<template>
  <div class="open-class-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索课程名称/教师"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterStatus" placeholder="课程状态" clearable style="width: 140px">
          <el-option label="即将开始" value="upcoming" />
          <el-option label="进行中" value="live" />
          <el-option label="已结束" value="completed" />
          <el-option label="待评课" value="pending" />
        </el-select>
        <el-select v-model="filterSubject" placeholder="课程类型" clearable style="width: 140px">
          <el-option label="篮球" value="篮球" />
          <el-option label="足球" value="足球" />
          <el-option label="田径" value="田径" />
          <el-option label="体操" value="体操" />
          <el-option label="羽毛球" value="羽毛球" />
          <el-option label="游泳" value="游泳" />
        </el-select>
        <el-select v-model="filterAcademicYear" placeholder="学年" clearable style="width: 140px">
          <el-option label="2023-2024学年" value="2023-2024" />
          <el-option label="2024-2025学年" value="2024-2025" />
          <el-option label="2025-2026学年" value="2025-2026" />
          <el-option label="2026-2027学年" value="2026-2027" />
        </el-select>
        <el-select v-model="filterSemester" placeholder="学期" clearable style="width: 120px">
          <el-option label="第一学期" value="first" />
          <el-option label="第二学期" value="second" />
        </el-select>
        <el-select v-model="filterTeachingWeek" placeholder="教学周" clearable style="width: 120px">
          <el-option v-for="week in teachingWeeks" :key="week.value" :label="week.label" :value="week.value" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
        <el-button :icon="Document" @click="showCourseTemplateDownload = true">导入课程模板</el-button>
        <el-button :icon="Calendar" @click="showCalendar = !showCalendar">{{ showCalendar ? '隐藏日历' : '显示日历' }}</el-button>
        <el-button type="primary" :icon="Plus" @click="publishClass">发布公开课</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalClasses }}</span>
        <span class="stat-label">公开课总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.live }}</span>
        <span class="stat-label">进行中</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.completed }}</span>
        <span class="stat-label">已结束</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.upcoming }}</span>
        <span class="stat-label">即将开始</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalViewers }}</span>
        <span class="stat-label">总听课人次</span>
      </div>
    </div>

    <div class="content-row">
      <div class="course-list">
        <div class="card-header">
          <span class="card-title">课程列表</span>
          <span class="total-count">共 {{ filteredCourses.length }} 门课程</span>
        </div>
        <div class="course-cards">
          <div v-for="(course, index) in paginatedCourses" :key="index" class="course-card">
            <div class="course-info">
              <div class="course-header">
                <h3 class="course-title">{{ course.title }}</h3>
                <span class="course-badge" :class="course.status">{{ getStatusText(course.status) }}</span>
              </div>
              <div class="course-meta">
                <span><el-icon><User /></el-icon> {{ course.teacher }}</span>
                <span><el-icon><Calendar /></el-icon> {{ course.date }}</span>
                <span><el-icon><Clock /></el-icon> {{ course.time }}</span>
              </div>
              <div class="course-tags">
                <el-tag size="small">{{ course.subject }}</el-tag>
                <el-tag size="small">{{ course.grade }}</el-tag>
              </div>
            </div>
            <div class="course-actions">
              <el-button size="small" :icon="Grid" @click="viewDetail(course)">查看</el-button>
              <el-button size="small" :icon="Edit" @click="editCourse(course)">编辑</el-button>
              <el-button size="small" :icon="Share" @click="shareCourse(course)">分享</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="deleteCourse(course)">删除</el-button>
              <template v-if="course.status === 'completed'">
                <el-button size="small" type="primary" :icon="Bell" @click="enterReview(course)">评课</el-button>
              </template>
              <template v-else-if="course.status === 'upcoming'">
                <el-button size="small" type="success" @click="enterReview(course)">报名</el-button>
              </template>
              <template v-else-if="course.status === 'live'">
                <el-button size="small" type="primary" :icon="VideoPlay" @click="enterLive(course)">进入</el-button>
              </template>
            </div>
          </div>
        </div>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="filteredCourses.length"
            :page-sizes="[6, 9, 12, 18]"
            layout="total, sizes, prev, pager, next"
            small
          />
        </div>
      </div>

      <div class="side-panel">
        <!-- 日历放在课程统计上面 -->
        <div v-if="showCalendar" class="calendar-section">
          <div class="calendar-header">
            <el-button @click="prevMonth" :icon="ArrowLeft"></el-button>
            <span class="calendar-title">{{ currentMonth }}</span>
            <el-button @click="nextMonth" :icon="ArrowRight"></el-button>
          </div>
          <div class="calendar-grid">
            <div class="calendar-header-row">
              <span v-for="day in weekDays" :key="day">{{ day }}</span>
            </div>
            <div class="calendar-days">
              <div v-for="(day, index) in calendarDays" :key="index" :class="['calendar-day', { 'has-event': day.hasEvent, 'other-month': day.otherMonth, 'today': day.isToday, 'selected': day.dateStr === selectedDate }]" @click="selectDate(day)">
                <span class="day-number">{{ day.day }}</span>
                <div v-if="day.hasEvent" class="event-dot"></div>
              </div>
            </div>
          </div>
          
          <!-- 选中日期的课程列表 -->
          <div v-if="selectedDate && dayCourses.length > 0" class="calendar-courses">
            <div class="calendar-course-header">
              <span>{{ selectedDate }} 的课程</span>
            </div>
            <div v-for="course in dayCourses" :key="course.id" class="calendar-course-item">
              <span class="course-title">{{ course.title }}</span>
              <span :class="['course-status', course.status]">{{ getStatusText(course.status) }}</span>
            </div>
          </div>
          <div v-else-if="selectedDate" class="calendar-courses-empty">
            <span>{{ selectedDate }} 暂无课程</span>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">热门课程类型</span>
          </div>
          <div class="subject-list">
            <div v-for="(item, index) in hotSubjects" :key="index" class="subject-item">
              <span class="subject-name">{{ item.name }}</span>
              <span class="subject-count">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <!-- 群体报告：学科/年级统计 -->
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 群体报告</span>
            <el-select v-model="groupReportType" placeholder="统计维度" style="width: 120px">
              <el-option label="按学科" value="subject" />
              <el-option label="按年级" value="grade" />
            </el-select>
          </div>
          <div class="group-report">
            <div class="report-summary">
              <div class="report-item">
                <span class="report-label">优质课比例</span>
                <span class="report-value high">{{ groupReportData.qualityRate }}%</span>
              </div>
              <div class="report-item">
                <span class="report-label">平均评分</span>
                <span class="report-value rating">{{ groupReportData.avgScore }}</span>
              </div>
              <div class="report-item">
                <span class="report-label">听课人次</span>
                <span class="report-value">{{ groupReportData.totalViewers }}</span>
              </div>
            </div>
            <div class="report-details">
              <div v-for="(item, index) in groupReportData.details" :key="index" class="report-detail-item">
                <span class="detail-name">{{ item.name }}</span>
                <div class="detail-bar-container">
                  <div class="detail-bar-fill" :style="{ width: (item.score / 100 * 100) + '%', background: item.color }"></div>
                </div>
                <span class="detail-score">{{ item.score }}分</span>
              </div>
            </div>
            <div class="report-highlight">
              <span class="highlight-label"><el-icon :size="16" color="#1E5AA8"><Edit /></el-icon> 优质课共性特征：</span>
              <span class="highlight-text">{{ groupReportData.insights }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布公开课 -->
    <el-dialog v-model="publishVisible" title="发布公开课" width="560px">
      <el-form :model="courseForm" label-width="100px">
        <el-form-item label="课程名称" required>
          <el-input v-model="courseForm.title" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="授课教师" required>
          <el-input v-model="courseForm.teacher" placeholder="请输入教师姓名" />
        </el-form-item>
        <el-form-item label="课程类型">
          <el-select v-model="courseForm.subject" class="w-full">
            <el-option label="篮球" value="篮球" />
            <el-option label="足球" value="足球" />
            <el-option label="田径" value="田径" />
            <el-option label="体操" value="体操" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用年级">
          <el-select v-model="courseForm.grade" class="w-full">
            <el-option v-for="g in ['一年级','二年级','三年级','四年级','五年级','六年级']" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="上课时间">
          <el-date-picker v-model="courseForm.date" type="date" placeholder="选择日期" class="w-full" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="时段">
          <el-input v-model="courseForm.time" placeholder="如 10:00-11:30" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPublish">发布</el-button>
      </template>
    </el-dialog>

    <!-- 分享课程 -->
    <el-dialog v-model="shareVisible" title="分享课程" width="500px">
      <div v-if="shareCourseData" class="share-content">
        <div class="share-poster">
          <canvas ref="posterCanvas" width="300" height="400" style="width: 300px; height: 400px; border-radius: 12px;"></canvas>
        </div>
        <div class="share-info">
          <div class="share-link-section">
2            <label>分享链接</label>
            <div class="link-input-group">
              <el-input v-model="shareLink" readonly />
              <el-button @click="DocumentCopyShareLink" :icon="DocumentCopy">复制</el-button>
            </div>
          </div>
          <div class="share-options">
            <span class="share-label">分享权限：</span>
            <el-select v-model="sharePermission" style="width: 150px">
              <el-option label="仅查看" value="view" />
              <el-option label="可评论" value="comment" />
              <el-option label="可评分" value="review" />
            </el-select>
          </div>
          <div class="share-role-section">
            <span class="share-label">分享对象：</span>
            <div class="role-tags">
              <el-tag v-for="role in shareRoles" :key="role.value" :type="shareSelectedRoles.includes(role.value) ? 'primary' : 'info'" @click="toggleShareRole(role.value)" class="role-tag">
                {{ role.label }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="shareVisible = false">取消</el-button>
        <el-button type="primary" @click="generatePoster">生成海报</el-button>
      </template>
    </el-dialog>

    <!-- 课程详情 -->
    <el-dialog v-model="detailVisible" :title="currentCourse?.title || '课程详情'" width="580px">
      <div v-if="currentCourse" class="course-detail">
        <div class="detail-row"><span>授课教师</span><span>{{ currentCourse.teacher }}</span></div>
        <div class="detail-row"><span>课程类型</span><span>{{ currentCourse.subject }}</span></div>
        <div class="detail-row"><span>适用年级</span><span>{{ currentCourse.grade }}</span></div>
        <div class="detail-row"><span>上课时间</span><span>{{ currentCourse.date }} {{ currentCourse.time }}</span></div>
        <div class="detail-row"><span>上课地点</span><span>{{ currentCourse.location || '-' }}</span></div>
        <div class="detail-row"><span>报名人数</span><span>{{ currentCourse.registrations?.length || 0 }} 人</span></div>
        <div class="detail-row"><span>状态</span><el-tag size="small">{{ getStatusText(currentCourse.status) }}</el-tag></div>
        <div v-if="currentCourse.description" class="detail-row">
          <span>课程描述</span>
          <span>{{ currentCourse.description }}</span>
        </div>
      </div>
      <div v-if="currentCourse?.registrations?.length" class="registrations-section">
        <h4>报名列表</h4>
        <el-table :data="currentCourse.registrations" size="small">
          <el-table-column label="姓名" prop="name" />
          <el-table-column label="备注" prop="note" />
          <el-table-column label="报名时间" prop="time">
            <template #default="scope">
              {{ new Date(scope.row.time).toLocaleString() }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button v-if="currentCourse?.status === 'upcoming'" type="primary" @click="enterReview(currentCourse)">报名听课</el-button>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 听评课/报名确认 -->
    <el-dialog v-model="reviewVisible" :title="reviewMode === 'register' ? '报名听课' : '进入听评课'" width="480px">
      <div v-if="currentCourse">
        <p>课程：<strong>{{ currentCourse.title }}</strong></p>
        <p>教师：{{ currentCourse.teacher }} · {{ currentCourse.date }} {{ currentCourse.time }}</p>
        <el-form v-if="reviewMode === 'register'" label-width="80px" style="margin-top: 16px">
          <el-form-item label="姓名"><el-input v-model="reviewForm.name" placeholder="您的姓名" /></el-form-item>
          <el-form-item label="备注"><el-input v-model="reviewForm.note" type="textarea" :rows="2" /></el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReview">{{ reviewMode === 'register' ? '确认报名' : '进入评课' }}</el-button>
      </template>
    </el-dialog>

    <!-- 评课对话框 -->
    <el-dialog v-model="reviewDialogVisible" title="评课" width="550px">
      <div v-if="currentCourse">
        <div class="review-header">
          <h4>{{ currentCourse.title }}</h4>
          <p>授课教师：{{ currentCourse.teacher }}</p>
        </div>
        <el-form :model="reviewFormData" label-width="100px">
          <el-form-item label="教学目标">
            <el-slider v-model="reviewFormData.objective" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="课堂组织">
            <el-slider v-model="reviewFormData.organization" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="师生互动">
            <el-slider v-model="reviewFormData.interaction" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="教学方法">
            <el-slider v-model="reviewFormData.method" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="教学效果">
            <el-slider v-model="reviewFormData.effect" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="综合评语">
            <el-input v-model="reviewFormData.comments" type="textarea" :rows="4" placeholder="请输入评课意见和建议" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交评课</el-button>
      </template>
    </el-dialog>

    <!-- 编辑课程 -->
    <el-dialog v-model="editVisible" title="编辑公开课" width="560px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="课程名称" required>
          <el-input v-model="editForm.title" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="授课教师" required>
          <el-input v-model="editForm.teacher" placeholder="请输入教师姓名" />
        </el-form-item>
        <el-form-item label="课程类型">
          <el-select v-model="editForm.subject" class="w-full">
            <el-option label="篮球" value="篮球" />
            <el-option label="足球" value="足球" />
            <el-option label="田径" value="田径" />
            <el-option label="体操" value="体操" />
            <el-option label="羽毛球" value="羽毛球" />
            <el-option label="游泳" value="游泳" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用年级">
          <el-select v-model="editForm.grade" class="w-full">
            <el-option v-for="g in ['一年级','二年级','三年级','四年级','五年级','六年级']" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="上课时间">
          <el-date-picker v-model="editForm.date" type="date" placeholder="选择日期" class="w-full" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="时段">
          <el-input v-model="editForm.time" placeholder="如 10:00-11:30" />
        </el-form-item>
        <el-form-item label="上课地点">
          <el-input v-model="editForm.location" placeholder="如 体育馆" />
        </el-form-item>
        <el-form-item label="课程描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="简要描述课程内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 直播播放器 - 三分屏 -->
    <el-dialog v-model="playerVisible" :title="playerTitle" width="1200px" destroy-on-close>
      <div class="three-screen-player">
        <div class="main-screen">
          <div class="screen-label">主画面 - 教师授课</div>
          <div class="video-container">
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
        </div>
        <div class="side-screens">
          <div class="side-screen">
            <div class="screen-label">副画面1 - 学生表现</div>
            <div class="video-container small">
              <div class="video-placeholder">
                <el-icon :size="48" color="#9CA3AF"><VideoCamera /></el-icon>
                <span>学生课堂表现</span>
              </div>
            </div>
          </div>
          <div class="side-screen">
            <div class="screen-label">副画面2 - 课件展示</div>
            <div class="video-container small">
              <div class="video-placeholder">
                <el-icon :size="48" color="#9CA3AF"><Document /></el-icon>
                <span>PPT/课件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="currentCourse" class="player-info">
        <div class="info-row">
          <div class="info-item">
            <strong>授课教师:</strong> {{ currentCourse.teacher }}
          </div>
          <div class="info-item">
            <strong>在线人数:</strong> {{ currentCourse.viewers || 0 }}
          </div>
          <div class="info-item">
            <strong>课程类型:</strong> {{ currentCourse.subject }}
          </div>
        </div>
      </div>
      <div class="nlp-analysis-section">
        <el-tabs v-model="nlpActiveTab" type="border-card">
          <el-tab-pane label="NLP分析" name="nlp">
            <div class="nlp-content">
              <div class="nlp-stats">
                <div class="nlp-stat-item">
                  <span class="nlp-stat-label">课堂互动度</span>
                  <span class="nlp-stat-value high">85%</span>
                </div>
                <div class="nlp-stat-item">
                  <span class="nlp-stat-label">学生专注度</span>
                  <span class="nlp-stat-value medium">72%</span>
                </div>
                <div class="nlp-stat-item">
                  <span class="nlp-stat-label">知识点覆盖</span>
                  <span class="nlp-stat-value high">90%</span>
                </div>
                <div class="nlp-stat-item">
                  <span class="nlp-stat-label">语言清晰度</span>
                  <span class="nlp-stat-value high">88%</span>
                </div>
              </div>
              <div class="nlp-timeline">
                <h4>课堂时间线分析</h4>
                <div class="timeline-events">
                  <div class="timeline-item" v-for="(event, idx) in timelineEvents" :key="idx">
                    <div class="timeline-time">{{ event.time }}</div>
                    <div class="timeline-content">
                      <span class="timeline-type" :class="event.type">{{ event.typeLabel }}</span>
                      <span class="timeline-text">{{ event.content }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="关键词云" name="keywords">
            <div class="keyword-cloud">
              <div v-for="(keyword, idx) in keywordCloud" :key="idx" class="keyword-item" :style="{ fontSize: keyword.size + 'px', color: keyword.color }">
                {{ keyword.word }}
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="情感分析" name="emotion">
            <div class="emotion-analysis">
              <div class="emotion-details">
                <div class="emotion-item">
                  <span class="emotion-label">积极</span>
                  <el-progress :percentage="65" :color="'#1E5AA8'" :stroke-width="12" />
                </div>
                <div class="emotion-item">
                  <span class="emotion-label">中性</span>
                  <el-progress :percentage="25" :color="'#F5A623'" :stroke-width="12" />
                </div>
                <div class="emotion-item">
                  <span class="emotion-label">消极</span>
                  <el-progress :percentage="10" :color="'#E85D4E'" :stroke-width="12" />
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 课程模板下载 -->
    <TemplateDownload 
      v-model:visible="showCourseTemplateDownload" 
      template-type="course"
      :custom-templates="customTemplates"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Calendar, Search, ArrowLeft, ArrowRight, User, Clock, Grid, Bell, Refresh, VideoPlay, VideoCamera, Document, Edit, Delete, Share, DocumentCopy, Histogram } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePersistedRef } from '@/composables/usePersistedRef'
import store from '../../../store/global'
import VideoPlayer from '@/components/media/VideoPlayer.vue'
import TemplateDownload from '@/components/export/TemplateDownload.vue'
import { MOCK_CUSTOM_TEMPLATES } from '@/data/mockData'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'
import { schoolCourseRecords } from '@/mock/courseData'

const searchQuery = ref('')
const filterStatus = ref('')
const filterSubject = ref('')
const filterAcademicYear = ref('')
const filterSemester = ref('')
const filterTeachingWeek = ref('')
const dateRange = ref([])
const showCalendar = ref(true)
const currentPage = ref(1)
const pageSize = ref(12)
const selectedDate = ref('')
const publishVisible = ref(false)
const detailVisible = ref(false)
const reviewVisible = ref(false)
const playerVisible = ref(false)
const playerTitle = ref('')
const nlpActiveTab = ref('nlp')
const currentCourse = ref(null)
const reviewMode = ref('register')
const reviewForm = ref({ name: '', note: '' })
const courseForm = ref({ title: '', teacher: '', subject: '篮球', grade: '四年级', date: '', time: '' })

const shareVisible = ref(false)
const shareCourseData = ref(null)
const shareLink = ref('')
const sharePermission = ref('view')
const shareSelectedRoles = ref([])
const shareRoles = ref([
  { label: '评课专家', value: 'expert' },
  { label: '学科组长', value: 'leader' },
  { label: '校领导', value: 'admin' },
  { label: '全体教师', value: 'all' }
])
const posterCanvas = ref(null)

const reviewDialogVisible = ref(false)
const editVisible = ref(false)
const editForm = ref({ title: '', teacher: '', subject: '篮球', grade: '四年级', date: '', time: '', location: '', description: '' })
const showCourseTemplateDownload = ref(false)
const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const customTemplates = usePersistedRef(
  computed(() => `smart_pe_custom_templates_${schoolId.value}`),
  [...MOCK_CUSTOM_TEMPLATES]
)

const reviewFormData = ref({
  objective: 80,
  organization: 85,
  interaction: 75,
  method: 82,
  effect: 88,
  comments: ''
})

const timelineEvents = ref([
  { time: '00:05', type: 'instruction', typeLabel: '指导', content: '教师讲解动作要领' },
  { time: '00:12', type: 'question', typeLabel: '提问', content: '询问学生理解情况' },
  { time: '00:18', type: 'interaction', typeLabel: '互动', content: '学生分组练习' },
  { time: '00:25', type: 'feedback', typeLabel: '反馈', content: '教师纠正学生动作' },
  { time: '00:32', type: 'instruction', typeLabel: '指导', content: '讲解技巧要点' },
  { time: '00:40', type: 'interaction', typeLabel: '互动', content: '学生再次练习' },
  { time: '00:48', type: 'feedback', typeLabel: '反馈', content: '表扬进步明显的学生' },
  { time: '00:55', type: 'summary', typeLabel: '总结', content: '总结本节课重点' }
])

const keywordCloud = ref([
  { word: '动作要领', size: 32, color: '#1E5AA8' },
  { word: '练习', size: 28, color: '#3B82F6' },
  { word: '指导', size: 24, color: '#F5A623' },
  { word: '纠正', size: 20, color: '#1E5AA8' },
  { word: '技巧', size: 26, color: '#3B82F6' },
  { word: '进步', size: 18, color: '#E85D4E' },
  { word: '表扬', size: 22, color: '#1E5AA8' },
  { word: '分组', size: 20, color: '#F5A623' },
  { word: '提问', size: 16, color: '#9CA3AF' },
  { word: '互动', size: 18, color: '#3B82F6' },
  { word: '重点', size: 24, color: '#1E5AA8' },
  { word: '总结', size: 20, color: '#F5A623' },
  { word: '反馈', size: 22, color: '#3B82F6' },
  { word: '理解', size: 18, color: '#1E5AA8' },
  { word: '要点', size: 16, color: '#9CA3AF' }
])

const schoolWeeklyStats = {
  'hailin-second-primary': { thisWeek: 8, thisMonth: 32, pendingReview: 12, avgRating: 4.7 },
  'hailin-zirong-primary': { thisWeek: 5, thisMonth: 18, pendingReview: 8, avgRating: 4.5 },
  'linhai-experimental-primary': { thisWeek: 12, thisMonth: 45, pendingReview: 15, avgRating: 4.8 }
}

const getSchoolWeeklyStats = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolWeeklyStats[schoolId] || schoolWeeklyStats['hailin-second-primary']
}

// 统计数据从实际课程列表动态计算
const stats = computed(() => {
  const allCourses = courses.value
  return {
    totalClasses: allCourses.length,
    live: allCourses.filter(c => c.status === 'live').length,
    completed: allCourses.filter(c => c.status === 'completed').length,
    upcoming: allCourses.filter(c => c.status === 'upcoming').length,
    pending: allCourses.filter(c => c.status === 'pending').length,
    reviewed: allCourses.filter(c => c.hasReview).length,
    totalViewers: allCourses.reduce((sum, c) => sum + (c.viewers || 0), 0)
  }
})

const weeklyStats = usePersistedRef(`smart_pe_openclass_weekly_${store.state.school.id || 'hailin-second-primary'}`, getSchoolWeeklyStats())

// 热门科目从实际课程列表动态计算
const hotSubjects = computed(() => {
  const subjectCount = {}
  courses.value.forEach(c => {
    const subject = c.subject || '其他'
    subjectCount[subject] = (subjectCount[subject] || 0) + 1
  })
  return Object.entries(subjectCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const groupReportType = ref('subject')

const groupReportData = computed(() => {
  const completedCourses = courses.value.filter(c => c.status === 'completed' && c.hasReview)
  
  if (groupReportType.value === 'subject') {
    const subjectStats = {}
    completedCourses.forEach(c => {
      const subject = c.subject || '其他'
      if (!subjectStats[subject]) {
        subjectStats[subject] = { scores: [], viewers: 0 }
      }
      if (c.review) {
        const r = c.review
        subjectStats[subject].scores.push(Math.round((r.objective + r.organization + r.interaction + r.method + r.effect) / 5))
      }
      subjectStats[subject].viewers += c.viewers || 0
    })
    
    const details = Object.entries(subjectStats).map(([name, data]) => ({
      name,
      score: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
      color: ['#1E5AA8', '#3B82F6', '#F5A623', '#E85D4E', '#8B5CF6', '#06B6D4'][Object.keys(subjectStats).indexOf(name) % 6]
    })).sort((a, b) => b.score - a.score)
    
    const totalScore = details.reduce((sum, d) => sum + d.score, 0)
    const avgScore = details.length > 0 ? (totalScore / details.length).toFixed(1) : '0.0'
    const qualityRate = details.filter(d => d.score >= 85).length / Math.max(details.length, 1) * 100
    
    return {
      qualityRate: Math.round(qualityRate),
      avgScore,
      totalViewers: Object.values(subjectStats).reduce((sum, s) => sum + s.viewers, 0),
      details,
      insights: '篮球课程互动性强，体测环节平均得分率≥85%；足球课程战术讲解清晰，学生参与度高'
    }
  } else {
    const gradeStats = {}
    completedCourses.forEach(c => {
      const grade = c.grade || '其他'
      if (!gradeStats[grade]) {
        gradeStats[grade] = { scores: [], viewers: 0 }
      }
      if (c.review) {
        const r = c.review
        gradeStats[grade].scores.push(Math.round((r.objective + r.organization + r.interaction + r.method + r.effect) / 5))
      }
      gradeStats[grade].viewers += c.viewers || 0
    })
    
    const details = Object.entries(gradeStats).map(([name, data]) => ({
      name,
      score: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
      color: ['#1E5AA8', '#3B82F6', '#F5A623', '#E85D4E', '#8B5CF6', '#06B6D4'][Object.keys(gradeStats).indexOf(name) % 6]
    })).sort((a, b) => b.score - a.score)
    
    const totalScore = details.reduce((sum, d) => sum + d.score, 0)
    const avgScore = details.length > 0 ? (totalScore / details.length).toFixed(1) : '0.0'
    const qualityRate = details.filter(d => d.score >= 85).length / Math.max(details.length, 1) * 100
    
    return {
      qualityRate: Math.round(qualityRate),
      avgScore,
      totalViewers: Object.values(gradeStats).reduce((sum, s) => sum + s.viewers, 0),
      details,
      insights: '高年级课程教学设计成熟，互动环节设计合理；低年级课程趣味性强，学生参与热情高'
    }
  }
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const currentDate = ref(new Date('2026-07-16T08:00:00'))

const teachingWeeks = computed(() => {
  const weeks = []
  for (let i = 1; i <= 20; i++) {
    weeks.push({ label: `第${i}周`, value: i })
  }
  return weeks
})

const currentMonth = computed(() => {
  return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDay = firstDay.getDay()
  
  const days = []
  const today = new Date()
  
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const prevMonthNum = month - 1
    const prevYear = prevMonthNum < 0 ? year - 1 : year
    const actualMonth = prevMonthNum < 0 ? 11 : prevMonthNum
    const dateStr = `${prevYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    const hasEvent = courses.value.some(c => c.date === dateStr)
    days.push({ day: dayNum, otherMonth: true, hasEvent, isToday: false, dateStr })
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const hasEvent = courses.value.some(c => c.date === dateStr)
      days.push({ day: i, otherMonth: false, hasEvent, isToday, dateStr })
    }
  
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const nextMonthNum = month + 1
    const nextYear = nextMonthNum > 11 ? year + 1 : year
    const actualMonth = nextMonthNum > 11 ? 0 : nextMonthNum
    const dateStr = `${nextYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const hasEvent = courses.value.some(c => c.date === dateStr)
    days.push({ day: i, otherMonth: true, hasEvent, isToday: false, dateStr })
  }
  
  return days
})

const selectDate = (day) => {
  if (day.dateStr) {
    selectedDate.value = selectedDate.value === day.dateStr ? '' : day.dateStr
  }
}

const dayCourses = computed(() => {
  if (!selectedDate.value) return []
  return courses.value.filter(c => c.date === selectedDate.value)
})

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const getStatusText = (status) => {
  const map = {
    upcoming: '即将开始',
    live: '进行中',
    completed: '已结束',
    pending: '待评课'
  }
  return map[status] || status
}


const getSchoolCourses = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolCourseRecords[schoolId] || schoolCourseRecords['hailin-second-primary']
}

// 公开课数据持久化（学校隔离）
const courses = usePersistedRef(`smart_pe_review_lessons_${store.state.school.id || 'hailin-second-primary'}`, getSchoolCourses())

// 检测缓存数据是否与最新 mock 数据一致，不一致则强制刷新
onMounted(() => {
  const freshData = getSchoolCourses()
  if (courses.value.length !== freshData.length) {
    courses.value = [...freshData]
  }
})

const filteredCourses = computed(() => {
  return courses.value.filter(course => {
    const matchSearch = !searchQuery.value || 
      course.title.includes(searchQuery.value) || 
      course.teacher.includes(searchQuery.value)
    const matchStatus = !filterStatus.value || course.status === filterStatus.value
    const matchSubject = !filterSubject.value || course.subject === filterSubject.value
    const matchAcademicYear = !filterAcademicYear.value || course.academicYear === filterAcademicYear.value
    const matchSemester = !filterSemester.value || course.semester === filterSemester.value
    const matchTeachingWeek = !filterTeachingWeek.value || course.teachingWeek === filterTeachingWeek.value
    
    let matchDate = true
    if (dateRange.value && dateRange.value.length === 2) {
      const courseDate = new Date(course.date)
      const startDate = new Date(dateRange.value[0])
      const endDate = new Date(dateRange.value[1])
      matchDate = courseDate >= startDate && courseDate <= endDate
    }
    
    return matchSearch && matchStatus && matchSubject && matchAcademicYear && matchSemester && matchTeachingWeek && matchDate
  })
})

const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCourses.value.slice(start, start + pageSize.value)
})

const refreshData = () => {
  searchQuery.value = ''
  filterStatus.value = ''
  filterSubject.value = ''
  filterAcademicYear.value = ''
  filterSemester.value = ''
  filterTeachingWeek.value = ''
  dateRange.value = []
  currentPage.value = 1
  ElMessage.success('数据已刷新')
}

const publishClass = () => {
  courseForm.value = { title: '', teacher: '', subject: '篮球', grade: '四年级', date: '', time: '' }
  publishVisible.value = true
}

const shareCourse = (course) => {
  shareCourseData.value = course
  shareLink.value = `${window.location.origin}/#/evaluation/open-class-detail?id=${course.id}`
  sharePermission.value = 'view'
  shareSelectedRoles.value = []
  shareVisible.value = true
  setTimeout(() => {
    generatePoster()
  }, 100)
}

const generatePoster = () => {
  const canvas = posterCanvas.value
  if (!canvas || !shareCourseData.value) return
  
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, 300, 400)
  
  ctx.fillStyle = '#1E5AA8'
  ctx.fillRect(0, 0, 300, 80)
  
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('智慧体育公开课', 150, 40)
  
  ctx.fillStyle = '#E8EAED'
  ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(shareCourseData.value.title, 150, 65)
  
  ctx.fillStyle = '#1A1A2E'
  ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`教师：${shareCourseData.value.teacher}`, 20, 120)
  ctx.fillText(`课程：${shareCourseData.value.subject}`, 20, 150)
  ctx.fillText(`年级：${shareCourseData.value.grade}`, 20, 180)
  ctx.fillText(`时间：${shareCourseData.value.date || '待定'}`, 20, 210)
  ctx.fillText(`时段：${shareCourseData.value.time || '待定'}`, 20, 240)
  
  ctx.fillStyle = '#1E5AA8'
  ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('长按识别二维码', 150, 375)
  
  ctx.fillStyle = '#6B7280'
  ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('扫码预约听课', 150, 392)
  
  ctx.fillStyle = '#F7F8FA'
  ctx.fillRect(100, 270, 100, 100)
  
  ctx.fillStyle = '#1E5AA8'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('QR CODE', 150, 325)
  
  ElMessage.success('海报生成成功')
}

const DocumentCopyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = shareLink.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('DocumentCopy')
    document.body.removeChild(textArea)
    ElMessage.success('链接已复制到剪贴板')
  }
}

const toggleShareRole = (role) => {
  const index = shareSelectedRoles.value.indexOf(role)
  if (index > -1) {
    shareSelectedRoles.value.splice(index, 1)
  } else {
    shareSelectedRoles.value.push(role)
  }
}

const confirmPublish = () => {
  if (!courseForm.value.title || !courseForm.value.teacher) {
    ElMessage.warning('请填写课程名称和授课教师')
    return
  }
  const random = createSeededRandom('open-class-teaching-week')
  courses.value.unshift({
    id: generateDeterministicId('open-class', `${courseForm.value.title}-${courseForm.value.teacher}`),
    title: courseForm.value.title,
    teacher: courseForm.value.teacher,
    subject: courseForm.value.subject,
    grade: courseForm.value.grade,
    date: courseForm.value.date,
    time: courseForm.value.time || '09:00-10:30',
    location: '体育馆',
    duration: 45,
    status: 'upcoming',
    attendance: 0,
    totalStudents: 0,
    viewers: 0,
    rating: 0,
    reviewed: false,
    academicYear: '2025-2026',
    semester: 'first',
    teachingWeek: Math.floor(random() * 20) + 1
  })
  stats.value.totalClasses++
  stats.value.upcoming++
  publishVisible.value = false
  ElMessage.success('公开课发布成功')
}

const viewDetail = (course) => {
  currentCourse.value = course
  detailVisible.value = true
}

const enterLive = (course) => {
  currentCourse.value = course
  playerTitle.value = `直播中 - ${course.title}`
  playerVisible.value = true
}

const enterReview = (course) => {
  currentCourse.value = course
  reviewMode.value = course.status === 'upcoming' ? 'register' : 'review'
  reviewForm.value = { name: '', note: '' }
  if (course.status === 'completed') {
    reviewDialogVisible.value = true
  } else {
    reviewVisible.value = true
  }
  detailVisible.value = false
}

const confirmReview = () => {
  if (reviewMode.value === 'register') {
    if (!reviewForm.value.name) {
      ElMessage.warning('请填写您的姓名')
      return
    }
    if (!currentCourse.value.registrations) {
      currentCourse.value.registrations = []
    }
    currentCourse.value.registrations.push({
      id: generateDeterministicId('registration', `${reviewForm.value.name}-${currentCourse.value.id}`),
      name: reviewForm.value.name,
      note: reviewForm.value.note,
      time: new Date().toISOString(),
      status: 'approved'
    })
    currentCourse.value.attendance++
    reviewVisible.value = false
    ElMessage.success(`已成功报名「${currentCourse.value.title}」`)
  } else {
    reviewVisible.value = false
  }
}

const submitReview = () => {
  if (!reviewFormData.value.comments || !reviewFormData.value.comments.trim()) { ElMessage.warning('请输入综合评语'); return }
  if (currentCourse.value) {
    const courseIndex = courses.value.findIndex(c => c.id === currentCourse.value.id)
    if (courseIndex !== -1) {
      const totalScore = (reviewFormData.value.objective + reviewFormData.value.organization + reviewFormData.value.interaction + reviewFormData.value.method + reviewFormData.value.effect) / 5
      courses.value[courseIndex] = {
        ...courses.value[courseIndex],
        review: {
          ...reviewFormData.value,
          totalScore: Math.round(totalScore),
          submitTime: new Date().toISOString(),
          submitter: '教师'
        },
        hasReview: true,
        rating: Math.round(totalScore)
      }
      currentCourse.value = courses.value[courseIndex]
    }
  }
  reviewDialogVisible.value = false
  ElMessage.success('评课提交成功')
  reviewFormData.value = {
    objective: 80,
    organization: 85,
    interaction: 75,
    method: 82,
    effect: 88,
    comments: ''
  }
}

const editCourse = (course) => {
  currentCourse.value = course
  editForm.value = {
    title: course.title,
    teacher: course.teacher,
    subject: course.subject || '篮球',
    grade: course.grade || '四年级',
    date: course.date || '',
    time: course.time || '',
    location: course.location || '',
    description: course.description || ''
  }
  editVisible.value = true
}

const confirmEdit = () => {
  if (!editForm.value.title || !editForm.value.teacher) {
    ElMessage.warning('请填写课程名称和授课教师')
    return
  }
  const courseIndex = courses.value.findIndex(c => c.id === currentCourse.value.id)
  if (courseIndex !== -1) {
    courses.value[courseIndex] = {
      ...courses.value[courseIndex],
      ...editForm.value
    }
    currentCourse.value = courses.value[courseIndex]
  }
  editVisible.value = false
  ElMessage.success('课程信息已更新')
}

const deleteCourse = (course) => {
  ElMessageBox.confirm(
    `确定要删除课程「${course.title}」吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const courseIndex = courses.value.findIndex(c => c.id === course.id)
    if (courseIndex !== -1) {
      courses.value.splice(courseIndex, 1)
      stats.value.totalClasses--
      if (course.status === 'upcoming') {
        stats.value.upcoming--
      }
    }
    ElMessage.success('课程已删除')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}
</script>

<style scoped>
.open-class-page {
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

.calendar-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 16px;
  margin-bottom: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
}

.calendar-header-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
  font-size: 12px;
  color: #6B7280;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-top: 10px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
  position: relative;
  min-height: 32px;
}

.calendar-day:hover {
  background: #EEF6FF;
}

.calendar-day.other-month {
  color: #9CA3AF;
}

.calendar-day.today {
  background: #1E5AA8;
  color: #fff;
}

.day-number {
  font-size: 14px;
}

.event-dot {
  position: absolute;
  bottom: 3px;
  width: 4px;
  height: 4px;
  background: #1E5AA8;
  border-radius: 50%;
}

.calendar-day.selected {
  background: #EEF6FF;
  border: 2px solid #1E5AA8;
}

.calendar-day.selected.today {
  background: #1E5AA8;
  color: #fff;
  border-color: #1E5AA8;
}

.calendar-courses {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.calendar-course-header {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 12px;
}

.calendar-course-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #F7F8FA;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 13px;
}

.calendar-course-item:last-child {
  margin-bottom: 0;
}

.course-title {
  color: #1A1A2E;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
}

.course-status.completed {
  background: #EEF6FF;
  color: #1E5AA8;
}

.course-status.live {
  background: #FEF3C7;
  color: #92400E;
}

.course-status.upcoming {
  background: #DBEAFE;
  color: #1E40AF;
}

.calendar-courses-empty {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
  text-align: center;
  color: #9CA3AF;
  font-size: 13px;
}

.content-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.calendar-sidebar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.course-list {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 20px;
}

.total-count {
  font-size: 13px;
  color: #9CA3AF;
}

.course-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.course-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.course-badge.upcoming { background: #FEF3C7; color: #92400E; }
.course-badge.live { background: #DCFCE7; color: #166534; }
.course-badge.completed { background: #E8EAED; color: #6B7280; }
.course-badge.pending { background: #DBEAFE; color: #1E40AF; }

.course-info {
  flex: 1;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.course-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  flex: 1;
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 12px;
}

.course-tags {
  display: flex;
  gap: 8px;
}

.course-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 80px;
  align-items: flex-end;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item .stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.stat-item .stat-value.pending { color: #F5A623; }
.stat-item .stat-value.rating { color: #1E5AA8; }

.subject-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subject-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subject-name {
  font-size: 14px;
  color: #1A1A2E;
}

.subject-count {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
}

/* 群体报告样式 */
.group-report {
  padding-top: 8px;
}

.report-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.report-item {
  text-align: center;
  flex: 1;
}

.report-label {
  display: block;
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.report-value {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.report-value.high { color: #1E5AA8; }
.report-value.rating { color: #F5A623; }

.report-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.report-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-name {
  font-size: 13px;
  color: #1A1A2E;
  width: 60px;
  flex-shrink: 0;
}

.detail-bar-container {
  flex: 1;
  height: 8px;
  background: #F0F2F5;
  border-radius: 4px;
  overflow: hidden;
}

.detail-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.detail-score {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
  width: 40px;
  text-align: right;
}

.report-highlight {
  background: #EEF6FF;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
}

.highlight-label {
  color: #1E5AA8;
  font-weight: 500;
}

.highlight-text {
  color: #6B7280;
}

/* 分享弹窗样式 */
.share-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.share-poster {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.share-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.share-link-section label {
  display: block;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 8px;
}

.link-input-group {
  display: flex;
  gap: 8px;
}

.link-input-group .el-input {
  flex: 1;
}

.share-options, .share-role-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.share-label {
  font-size: 13px;
  color: #6B7280;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-tag {
  cursor: pointer;
}

/* 弹窗内容样式 */
.course-detail {
  padding: 8px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #E8EAED;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row span:first-child {
  font-size: 14px;
  color: #6B7280;
  min-width: 100px;
}

.detail-row span:last-child {
  font-size: 14px;
  color: #1A1A2E;
  font-weight: 500;
}

/* 三分屏播放器样式 */
.three-screen-player {
  display: flex;
  gap: 12px;
  height: 500px;
  margin-bottom: 16px;
}

.main-screen {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-screens {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.screen-label {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  padding: 4px 8px;
  background: #F7F8FA;
  border-radius: 4px;
}

.video-container {
  flex: 1;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-container.small {
  min-height: 200px;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9CA3AF;
  gap: 8px;
}

.player-info {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  gap: 24px;
}

.info-item {
  font-size: 14px;
  color: #1A1A2E;
}

/* NLP分析样式 */
.nlp-analysis-section {
  margin-top: 16px;
}

.nlp-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nlp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.nlp-stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.nlp-stat-label {
  font-size: 12px;
  color: #6B7280;
}

.nlp-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1A1A2E;
}

.nlp-stat-value.high { color: #1E5AA8; }
.nlp-stat-value.medium { color: #F5A623; }
.nlp-stat-value.low { color: #E85D4E; }

.nlp-timeline h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.timeline-events {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  background: #FFFFFF;
  border-radius: 6px;
  border-left: 3px solid #E8EAED;
}

.timeline-time {
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
  min-width: 50px;
}

.timeline-content {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
}

.timeline-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.timeline-type.instruction { background: #DBEAFE; color: #1E40AF; }
.timeline-type.question { background: #FEF3C7; color: #92400E; }
.timeline-type.interaction { background: #DCFCE7; color: #166534; }
.timeline-type.feedback { background: #FEE2E2; color: #991B1B; }
.timeline-type.summary { background: #E0E7FF; color: #3730A3; }

.timeline-text {
  font-size: 14px;
  color: #1A1A2E;
}

/* 关键词云样式 */
.keyword-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 24px;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.keyword-item {
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.keyword-item:hover {
  transform: scale(1.1);
}

/* 情感分析样式 */
.emotion-analysis {
  padding: 16px;
}

.emotion-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.emotion-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.emotion-label {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  min-width: 60px;
}

.review-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.review-header h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.review-header p {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
}

.registrations-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #E8EAED;
}

.registrations-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
