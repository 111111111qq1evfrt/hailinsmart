export default {
  schoolName: '海林市第二小学',
  totalStudents: 1309,
  totalTeachers: 38,
  totalClasses: 42,
  onlineStudents: 896,
  examCompleted: 1256,
  nationalTestCompleted: 890,
  excellentRate: 28.5,
  goodRate: 38.2,
  passRate: 25.6,
  failRate: 7.7,
  attendanceRate: 98.5,
  leaveRate: 1.2,
  examCount: 12,
  testCount: 356,
  exerciseMinutes: 45,
  excellentStudents: 374,
  warningStudents: 101,
  testChartData: [85.6, 62.3, 88.5, 78.2, 82.1, 75.8, 90.2, 84.5],
  monthlyData: [120, 145, 132, 168, 155, 189, 201, 195, 210, 188, 225, 240],
  scoreDistribution: [28, 35, 25, 12],
  activityStats: { monthlyActive: 1256, avgFrequency: 8.6, participationRate: 92.3, avgDistance: 12.5, improvementRate: 12.8, exerciseRate: 8.5, activeRateChange: 3.2, distanceRate: 15.3 },
  analysis: {
    monthPassRate: 83.3,
    monthIncrease: 5.2,
    improveCount: 156,
    excellentCount: 374,
    highestScore: 96.5,
    topStudent: '李明轩',
    recordInfo: '打破校运会记录',
    suggestion: '二年级3班的坐位体前屈项目达标率较低，建议加强柔韧性训练'
  },
  progressStats: {
    overallRate: 82.5,
    onSchedule: 28,
    delayed: 4
  },
  progressList: [
    { className: '一年级1班', rate: 95, progress: 38, total: 40 },
    { className: '一年级2班', rate: 88, progress: 35, total: 40 },
    { className: '二年级1班', rate: 75, progress: 30, total: 40 },
    { className: '二年级2班', rate: 65, progress: 26, total: 40 },
    { className: '三年级1班', rate: 90, progress: 36, total: 40 },
    { className: '三年级2班', rate: 82, progress: 33, total: 40 }
  ],
  warnings: [
    { level: 'danger', title: '成绩异常波动', description: '四年级3班立定跳远平均成绩较上周下降15%，建议关注教学质量', time: '10分钟前' },
    { level: 'warning', title: '课程进度滞后', description: '二年级2班体育课程完成率仅65%，落后于预期进度', time: '30分钟前' },
    { level: 'info', title: '设备维护提醒', description: '体测室A区摄像头需要定期维护，建议安排时间检修', time: '1小时前' },
    { level: 'warning', title: '数据同步延迟', description: '部分班级体测数据同步延迟超过24小时', time: '2小时前' }
  ]
}