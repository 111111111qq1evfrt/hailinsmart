<template>
  <div class="pdf-export-container">
    <el-dialog 
      title="导出PDF报告" 
      :model-value="visible"
      width="500px"
      @update:model-value="(val) => emit('update:visible', val)"
    >
      <div class="export-form">
        <div class="form-item">
          <label class="form-label">报告标题</label>
          <el-input v-model="config.title" placeholder="请输入报告标题" />
        </div>
        
        <div class="form-item">
          <label class="form-label">报告类型</label>
          <el-select v-model="config.reportType">
            <el-option label="运动处方报告" value="prescription" />
            <el-option label="体测成绩报告" value="test" />
            <el-option label="能力分析报告" value="analysis" />
            <el-option label="成长轨迹报告" value="growth" />
            <el-option label="学生评价报告" value="evaluation" />
            <el-option label="投票分析报告" value="vote" />
          </el-select>
        </div>
        
        <div class="form-item">
          <label class="form-label">包含内容</label>
          <div class="checkbox-group">
            <el-checkbox v-model="config.includeChart">图表</el-checkbox>
            <el-checkbox v-model="config.includeTable">表格数据</el-checkbox>
            <el-checkbox v-model="config.includeRecommendation">建议与评语</el-checkbox>
            <el-checkbox v-model="config.includeSignature">签名栏</el-checkbox>
          </div>
        </div>
        
        <div class="form-item">
          <label class="form-label">纸张大小</label>
          <el-select v-model="config.paperSize">
            <el-option label="A4" value="A4" />
            <el-option label="Letter" value="Letter" />
            <el-option label="A3" value="A3" />
          </el-select>
        </div>
        
        <div class="form-item">
          <label class="form-label">方向</label>
          <el-radio-group v-model="config.orientation">
            <el-radio label="portrait">纵向</el-radio>
            <el-radio label="landscape">横向</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="isExporting" @click="startExport">
          {{ isExporting ? '导出中...' : '导出PDF' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  reportData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'export-start', 'export-end'])

const isExporting = ref(false)

const config = reactive({
  title: '',
  reportType: 'prescription',
  includeChart: true,
  includeTable: true,
  includeRecommendation: true,
  includeSignature: true,
  paperSize: 'A4',
  orientation: 'portrait'
})

const handleClose = () => {
  emit('update:visible', false)
}

const startExport = async () => {
  isExporting.value = true
  emit('export-start', { ...config, data: props.reportData })
  
  // 创建打印窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    isExporting.value = false
    alert('请允许弹出窗口以导出PDF')
    return
  }
  
  // 生成HTML内容
  const htmlContent = generateHtmlContent()
  
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // 等待内容加载完成后打印
  setTimeout(() => {
    printWindow.print()
    isExporting.value = false
    emit('export-end')
    emit('update:visible', false)
  }, 500)
}

const generateHtmlContent = () => {
  const reportTypeMap = {
    'prescription': '运动处方报告',
    'test': '体测成绩报告',
    'analysis': '能力分析报告',
    'growth': '成长轨迹报告',
    'evaluation': '学生评价报告',
    'vote': '投票分析报告'
  }
  
  const scoresHtml = props.reportData.scores 
    ? Object.entries(props.reportData.scores).map(([k, v]) => `
        <tr>
          <td style="padding: 12px; border: 1px solid #E8EAED; background: #F7F8FA; font-weight: 500;">${k}</td>
          <td style="padding: 12px; border: 1px solid #E8EAED; text-align: center;">${v}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="2" style="padding: 12px; text-align: center; color: #9CA3AF;">无数据</td></tr>'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.title || reportTypeMap[config.reportType] || '报告'}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    body {
      font-family: "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif;
      line-height: 1.6;
      color: #1A1A2E;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1E5AA8;
    }
    .header h1 {
      color: #1E5AA8;
      font-size: 28px;
      margin: 0 0 10px 0;
    }
    .header .subtitle {
      color: #6B7280;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1E5AA8;
      margin-bottom: 15px;
      padding-left: 12px;
      border-left: 4px solid #1E5AA8;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      background: #F7F8FA;
      padding: 20px;
      border-radius: 8px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      font-weight: 500;
      color: #1A1A2E;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .recommendation {
      background: #F0FDF4;
      border: 1px solid #1E5AA8;
      border-radius: 8px;
      padding: 20px;
      margin-top: 10px;
    }
    .recommendation-title {
      font-weight: 600;
      color: #1E5AA8;
      margin-bottom: 10px;
    }
    .signature-area {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 200px;
    }
    .signature-line {
      border-bottom: 1px solid #1A1A2E;
      height: 40px;
      margin-bottom: 8px;
    }
    .signature-label {
      font-size: 12px;
      color: #6B7280;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E8EAED;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
    }
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #1E5AA8;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    .print-btn:hover {
      background: #236B3A;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">打印 / 保存为PDF</button>
  
  <div class="header">
    <h1>${config.title || reportTypeMap[config.reportType] || '报告'}</h1>
    <div class="subtitle">智慧体育评估系统 | 生成时间: ${new Date().toLocaleString()}</div>
  </div>
  
  <div class="section">
    <div class="section-title">学生信息</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">姓名</span>
        <span class="info-value">${props.reportData.studentName || '未知'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">班级</span>
        <span class="info-value">${props.reportData.className || '未知'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">学号</span>
        <span class="info-value">${props.reportData.studentId || '未知'}</span>
      </div>
    </div>
  </div>
  
  ${config.includeTable ? `
  <div class="section">
    <div class="section-title">成绩数据</div>
    <table>
      <thead>
        <tr>
          <th style="padding: 12px; border: 1px solid #E8EAED; background: #1E5AA8; color: white; text-align: left;">测试项目</th>
          <th style="padding: 12px; border: 1px solid #E8EAED; background: #1E5AA8; color: white; text-align: center;">成绩</th>
        </tr>
      </thead>
      <tbody>
        ${scoresHtml}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  ${config.includeRecommendation ? `
  <div class="section">
    <div class="section-title">建议与评语</div>
    <div class="recommendation">
      <div class="recommendation-title">运动建议</div>
      <div>${props.reportData.recommendation || '暂无建议'}</div>
    </div>
  </div>
  ` : ''}
  
  ${config.includeSignature ? `
  <div class="section">
    <div class="section-title">签名确认</div>
    <div class="signature-area">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">教师签名</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">日期</div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <div class="footer">
    <div>本报告由智慧体育评估系统自动生成</div>
    <div>© ${new Date().getFullYear()} 智慧体育评估系统</div>
  </div>
</body>
</html>
  `
}
</script>

<style scoped>
.pdf-export-container {
  /* el-dialog handles visibility internally */
}

.export-form {
  padding: 16px 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
  margin-bottom: 8px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.el-radio-group {
  display: flex;
  gap: 24px;
}
</style>