<template>
  <div class="privacy-policy-page">
    <div class="page-header">
      <h2>隐私保护与数据安全</h2>
      <p class="subtitle">保护学生隐私，确保数据安全</p>
    </div>

    <div class="security-levels">
      <div class="level-card high">
        <div class="level-card-header">
          <div class="level-icon">
            <Lock />
          </div>
          <h4>数据加密</h4>
        </div>
        <p>采用国密算法SM4进行数据加密传输和存储</p>
        <div class="level-badge">高安全</div>
      </div>
      <div class="level-card high">
        <div class="level-card-header">
          <div class="level-icon">
            <Hide />
          </div>
          <h4>访问控制</h4>
        </div>
        <p>基于角色的细粒度权限管理，6级角色控制体系</p>
        <div class="level-badge">高安全</div>
      </div>
      <div class="level-card medium">
        <div class="level-card-header">
          <div class="level-icon">
            <Timer />
          </div>
          <h4>操作审计</h4>
        </div>
        <p>完整的操作日志记录，支持追溯和审计</p>
        <div class="level-badge">中安全</div>
      </div>
      <div class="level-card high">
        <div class="level-card-header">
          <div class="level-icon">
            <Monitor />
          </div>
          <h4>数据备份</h4>
        </div>
        <p>自动+手动备份机制，支持一键恢复</p>
        <div class="level-badge">高安全</div>
      </div>
    </div>

    <div class="content-section">
      <div class="policy-card">
        <div class="card-header">
          <h3>
            <Document />
            隐私保护策略
          </h3>
        </div>
        <div class="policy-content">
          <div class="policy-section">
            <h4>1. 数据收集原则</h4>
            <ul>
              <li><strong>最小化原则：</strong>仅收集实现服务所需的最少数据</li>
              <li><strong>明示同意：</strong>收集个人信息前取得用户明确同意</li>
              <li><strong>合法合规：</strong>严格遵守《个人信息保护法》等法律法规</li>
            </ul>
          </div>
          <div class="policy-section">
            <h4>2. 数据使用范围</h4>
            <ul>
              <li>学生体育成绩评估与分析</li>
              <li>教学质量监控与改进</li>
              <li>数据统计与报表生成</li>
              <li>安全审计与合规检查</li>
            </ul>
          </div>
          <div class="policy-section">
            <h4>3. 数据存储与保护</h4>
            <ul>
              <li>数据存储于国内合规数据中心</li>
              <li>传输过程采用TLS 1.3加密</li>
              <li>定期进行安全漏洞扫描</li>
              <li>数据留存期限符合法规要求</li>
            </ul>
          </div>
          <div class="policy-section">
            <h4>4. 用户权利</h4>
            <ul>
              <li>访问个人数据的权利</li>
              <li>更正错误信息的权利</li>
              <li>删除个人数据的权利</li>
              <li>撤回同意的权利</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="security-card">
        <div class="card-header">
          <h3>
            <WarnTriangleFilled />
            数据安全等级标识
          </h3>
        </div>
        <div class="security-grid">
          <div class="security-item critical">
            <div class="security-dot"></div>
            <div class="security-info">
              <span class="security-label">Critical</span>
              <span class="security-desc">敏感个人信息（身份证号、生物特征）</span>
            </div>
          </div>
          <div class="security-item high">
            <div class="security-dot"></div>
            <div class="security-info">
              <span class="security-label">High</span>
              <span class="security-desc">个人身份信息（姓名、学号、联系方式）</span>
            </div>
          </div>
          <div class="security-item medium">
            <div class="security-dot"></div>
            <div class="security-info">
              <span class="security-label">Medium</span>
              <span class="security-desc">体育成绩数据、运动记录</span>
            </div>
          </div>
          <div class="security-item low">
            <div class="security-dot"></div>
            <div class="security-info">
              <span class="security-label">Low</span>
              <span class="security-desc">公开统计数据、系统配置信息</span>
            </div>
          </div>
        </div>
        <div class="certification-section">
          <h4>安全认证</h4>
          <div class="certification-list">
            <div class="cert-item">
              <Trophy />
              <span>等保三级认证</span>
            </div>
            <div class="cert-item">
              <Trophy />
              <span>ISO 27001认证</span>
            </div>
            <div class="cert-item">
              <Trophy />
              <span>SM4国密算法认证</span>
            </div>
          </div>
        </div>
      </div>

      <div class="desensitization-card">
        <div class="card-header">
          <h3>
            <View />
            敏感数据脱敏展示规则
          </h3>
        </div>
        <div class="desensitization-rules">
          <div class="rule-item">
            <div class="rule-header">
              <span class="rule-label">身份证号</span>
              <span class="rule-example">110101********1234</span>
            </div>
            <p>保留前6位行政区划代码和后4位校验码，中间8位脱敏</p>
          </div>
          <div class="rule-item">
            <div class="rule-header">
              <span class="rule-label">手机号</span>
              <span class="rule-example">138****5678</span>
            </div>
            <p>保留前3位运营商号段和后4位，中间4位脱敏</p>
          </div>
          <div class="rule-item">
            <div class="rule-header">
              <span class="rule-label">姓名</span>
              <span class="rule-example">张**</span>
            </div>
            <p>保留姓氏，名字部分脱敏（两个字及以上显示第一个字）</p>
          </div>
          <div class="rule-item">
            <div class="rule-header">
              <span class="rule-label">邮箱</span>
              <span class="rule-example">z***@example.com</span>
            </div>
            <p>保留用户名首字符和域名，中间部分脱敏</p>
          </div>
        </div>
      </div>

      <div class="compliance-card">
        <div class="card-header">
          <h3>
            <DocumentChecked />
            合规声明
          </h3>
        </div>
        <div class="compliance-content">
          <div class="compliance-item">
            <CircleCheck />
            <span>符合《中华人民共和国个人信息保护法》要求</span>
          </div>
          <div class="compliance-item">
            <CircleCheck />
            <span>符合《数据安全法》相关规定</span>
          </div>
          <div class="compliance-item">
            <CircleCheck />
            <span>通过网络安全等级保护三级认证</span>
          </div>
          <div class="compliance-item">
            <CircleCheck />
            <span>采用国家密码管理局认可的国产密码算法</span>
          </div>
          <div class="compliance-item">
            <CircleCheck />
            <span>建立完整的数据安全管理制度</span>
          </div>
          <div class="compliance-item">
            <CircleCheck />
            <span>定期开展数据安全培训和应急演练</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Lock, Hide, Timer, Monitor, 
  Document, WarnTriangleFilled, View, Trophy, DocumentChecked, CircleCheck 
} from '@element-plus/icons-vue'
</script>

<style scoped>
.privacy-policy-page {
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1A1A2E;
}

.subtitle {
  margin: 0;
  color: #6B7280;
  font-size: 14px;
}

.security-levels {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.level-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.level-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.level-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.level-icon :deep(.el-icon),
.level-icon :deep(svg) {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
}

.level-card.high .level-icon {
  background: #E8F5E9;
  color: #1E5AA8;
}

.level-card.medium .level-icon {
  background: #FEF3C7;
  color: #F5A623;
}

.level-card h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.level-card p {
  margin: 0;
  font-size: 12px;
  color: #6B7280;
  line-height: 1.5;
  margin-bottom: 10px;
}

.level-badge {
  display: inline-block;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.level-card.high .level-badge {
  background: #E8F5E9;
  color: #1E5AA8;
}

.level-card.medium .level-badge {
  background: #FEF3C7;
  color: #F5A623;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.policy-card,
.security-card,
.desensitization-card,
.compliance-card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.card-header :deep(.el-icon),
.card-header :deep(svg) {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  color: #1E5AA8;
}

.policy-content {
  padding: 20px;
}

.policy-section {
  margin-bottom: 20px;
}

.policy-section:last-child {
  margin-bottom: 0;
}

.policy-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.policy-section ul {
  margin: 0;
  padding-left: 20px;
}

.policy-section li {
  margin-bottom: 8px;
  color: #6B7280;
  font-size: 13px;
  line-height: 1.6;
}

.security-grid {
  padding: 20px;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 8px;
}

.security-item:last-child {
  margin-bottom: 0;
}

.security-item.critical {
  background: #FEF2F2;
}

.security-item.high {
  background: #FEF3C7;
}

.security-item.medium {
  background: #DBEAFE;
}

.security-item.low {
  background: #E8F5E9;
}

.security-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.security-item.critical .security-dot {
  background: #E85D4E;
}

.security-item.high .security-dot {
  background: #F5A623;
}

.security-item.medium .security-dot {
  background: #3B82F6;
}

.security-item.low .security-dot {
  background: #1E5AA8;
}

.security-label {
  font-weight: 600;
  font-size: 14px;
  color: #1A1A2E;
}

.security-desc {
  font-size: 12px;
  color: #6B7280;
  margin-left: 8px;
}

.certification-section {
  padding: 20px;
  border-top: 1px solid #E8EAED;
}

.certification-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.certification-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.cert-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #F7F8FA;
  padding: 6px 12px;
  border-radius: 6px;
  color: #6B7280;
  font-size: 12px;
}

.cert-item :deep(.el-icon),
.cert-item :deep(svg) {
  font-size: 12px !important;
  width: 12px !important;
  height: 12px !important;
  color: #F5A623;
}

.desensitization-rules {
  padding: 20px;
}

.rule-item {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 12px;
}

.rule-item:last-child {
  margin-bottom: 0;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rule-label {
  font-weight: 600;
  font-size: 14px;
  color: #1A1A2E;
}

.rule-example {
  font-family: monospace;
  background: #FFFFFF;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #1E5AA8;
  border: 1px solid #E8EAED;
}

.rule-item p {
  margin: 0;
  font-size: 13px;
  color: #6B7280;
}

.compliance-content {
  padding: 20px;
}

.compliance-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #F3F4F6;
}

.compliance-item:last-child {
  border-bottom: none;
}

.compliance-item :deep(.el-icon),
.compliance-item :deep(svg) {
  font-size: 14px !important;
  width: 14px !important;
  height: 14px !important;
  color: #1E5AA8;
}

.compliance-item span {
  color: #6B7280;
  font-size: 14px;
}
</style>