
---

## 三、31 个待重构文件清单与降行目标

### 第一梯队：超特大文件（3000 行以上 / 6 个）

| # | 文件名 | 当前行数 | 策略 | 目标行数 |
|---|--------|---------|------|---------|
| 1 | `StudentManagement.vue` | 3876 | 抽SCSS + 抽字典 + 抽4个弹窗 | < 400 |
| 2 | `TestTerminal.vue` | 3407 | 抽SCSS + 抽测试配置 + 抽弹窗 | < 450 |
| 3 | `SportsExam.vue` | 3343 | 抽SCSS + 抽规则 + 抽项目弹窗 | < 400 |
| 4 | `student-evaluation/index.vue` | 3214 | 抽SCSS + 抽指标 + 抽评价弹窗 | < 400 |
| 5 | `ComplianceReport.vue` | 3169 | 抽SCSS + 抽模板 + 抽预览弹窗 | < 350 |
| 6 | `LivePlayback.vue` | 3079 | 抽SCSS + 抽配置 + 抽剪辑弹窗 | < 350 |

### 第二梯队：高频大文件（2000 ~ 3000 行 / 8 个）

| # | 文件名 | 当前行数 | 策略 | 目标行数 |
|---|--------|---------|------|---------|
| 7 | `Login.vue` | 2956 | 抽SCSS + 抽Rules + 抽协议弹窗 | < 300 |
| 8 | `NationalTest.vue` | 2443 | 抽SCSS + 抽静态配置 + 抽弹窗 | < 350 |
| 9 | `StudentData.vue` | 2392 | 抽SCSS + 抽图表配置 + 抽弹窗 | < 350 |
| 10 | `UserManagement.vue` | 2350 | 抽SCSS + 抽Rules + 抽用户弹窗 | < 300 |
| 11 | `AiReview.vue` | 2242 | 抽SCSS + 抽审核字典 + 抽弹窗 | < 350 |
| 12 | `LeaderDashboard.vue` | 2196 | 抽SCSS + 抽看板配置 + 抽弹窗 | < 400 |
| 13 | `RepairManagement.vue` | 1928 | 抽SCSS + 抽类型 + 抽工单弹窗 | < 300 |
| 14 | `LessonReview.vue` | 1918 | 抽SCSS + 抽点评配置 + 抽弹窗 | < 300 |

### 第三梯队：中型膨胀文件（1000 ~ 1900 行 / 17 个）

| # | 文件名 | 当前行数 | 策略 | 目标行数 |
|---|--------|---------|------|---------|
| 15 | `FreePractice.vue` | 1899 | 抽SCSS + 抽练习配置 | < 400 |
| 16 | `SportsRanking.vue` | 1819 | 抽SCSS + 抽榜单Columns | < 300 |
| 17 | `ResourceMonitoring.vue` | 1774 | 抽SCSS + 抽监控配置 | < 350 |
| 18 | `OpenClassManagement.vue` | 1722 | 抽SCSS + 抽预约弹窗 | < 300 |
| 19 | `App.vue` | 1463 | 抽全局SCSS + 抽监听配置 | < 250 |
| 20 | `LeaveApproval.vue` | 1448 | 抽SCSS + 抽审批弹窗 | < 300 |
| 21 | `Dashboard.vue` | 1443 | 抽SCSS + 抽图表Config | < 350 |
| 22 | `DataPlatform.vue` | 1376 | 抽SCSS + 抽平台字典 | < 300 |
| 23 | `VoteAnalysis.vue` | 1349 | 抽SCSS + 抽投票选项Config | < 300 |
| 24 | `VisualizationScreen.vue` | 1274 | 抽大屏SCSS + 抽图表配置 | < 400 |
| 25 | `TemplateManagement.vue` | 1236 | 抽SCSS + 抽编辑弹窗 | < 300 |
| 26 | `TeachingTrend.vue` | 1195 | 抽SCSS + 抽趋势图配置 | < 300 |
| 27 | `TestSettings.vue` | 1177 | 抽SCSS + 抽设置表单Rules | < 250 |
| 28 | `MaintenanceAnalysis.vue` | 1134 | 抽SCSS + 抽分析指标Config | < 300 |
| 29 | `SunshineRun.vue` | 1128 | 抽SCSS + 抽跑步规则配置 | < 300 |
| 30 | `HomeworkPublish.vue` | 1072 | 抽SCSS + 抽发布弹窗 | < 250 |
| 31 | `AiAssistant.vue` | 1067 | 抽SCSS + 抽快捷语Config | < 250 |

---

## 四、验收标准

1. 31 个目标文件单文件代码量全部低于 1000 行。
2. 页面功能、样式、组件通信逻辑与重构前 100% 保持一致。
3. 编辑器打开及格式化文件无卡顿现象。
先做最基础的下面的暂时不管（
第四步：抽业务 Hooks
第五步：抽子模块组件
如果有公共组件可以抽出来 ）
