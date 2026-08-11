<template>
  <div class="skeleton-container">
    <!-- 头部骨架 -->
    <div class="skeleton-header">
      <div class="skeleton-logo"></div>
      <div class="skeleton-nav">
        <div class="skeleton-nav-item" v-for="i in 5" :key="i"></div>
      </div>
      <div class="skeleton-actions">
        <div class="skeleton-action-item"></div>
        <div class="skeleton-action-item"></div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="skeleton-content">
      <!-- 统计卡片区域 -->
      <div class="skeleton-cards">
        <div class="skeleton-card" v-for="i in 4" :key="i">
          <div class="skeleton-card-icon"></div>
          <div class="skeleton-card-title"></div>
          <div class="skeleton-card-value"></div>
          <div class="skeleton-card-trend"></div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="skeleton-charts">
        <div class="skeleton-chart large">
          <div class="skeleton-chart-header">
            <div class="skeleton-chart-title"></div>
            <div class="skeleton-chart-tabs">
              <div class="skeleton-tab" v-for="i in 3" :key="i"></div>
            </div>
          </div>
          <div class="skeleton-chart-body">
            <div class="skeleton-bar" v-for="i in 7" :key="i"></div>
          </div>
        </div>
        <div class="skeleton-chart small">
          <div class="skeleton-chart-header">
            <div class="skeleton-chart-title"></div>
          </div>
          <div class="skeleton-chart-body">
            <div class="skeleton-pie"></div>
            <div class="skeleton-legend">
              <div class="skeleton-legend-item" v-for="i in 4" :key="i"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据列表区域 -->
      <div class="skeleton-list-section">
        <div class="skeleton-section-header">
          <div class="skeleton-section-title"></div>
          <div class="skeleton-section-action"></div>
        </div>
        <div class="skeleton-list">
          <div class="skeleton-list-item" v-for="i in 5" :key="i">
            <div class="skeleton-list-avatar"></div>
            <div class="skeleton-list-content">
              <div class="skeleton-list-title"></div>
              <div class="skeleton-list-desc"></div>
            </div>
            <div class="skeleton-list-meta">
              <div class="skeleton-list-tag"></div>
              <div class="skeleton-list-time"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 骨架屏组件 - 用于首屏加载时的占位显示
</script>

<style scoped>
.skeleton-container {
  min-height: 100vh;
  background-color: #F7F8FA;
}

/* 头部骨架 */
.skeleton-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.skeleton-logo {
  width: 100px;
  height: 36px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 6px;
}

.skeleton-nav {
  display: flex;
  gap: 24px;
}

.skeleton-nav-item {
  width: 60px;
  height: 24px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-actions {
  display: flex;
  gap: 12px;
}

.skeleton-action-item {
  width: 36px;
  height: 36px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 50%;
}

/* 主内容区域 */
.skeleton-content {
  padding: 24px;
}

/* 统计卡片 */
.skeleton-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.skeleton-card {
  background: #FFFFFF;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.skeleton-card-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 8px;
  margin-bottom: 16px;
}

.skeleton-card-title {
  width: 60%;
  height: 14px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-card-value {
  width: 40%;
  height: 32px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-card-trend {
  width: 80px;
  height: 20px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

/* 图表区域 */
.skeleton-charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.skeleton-chart {
  background: #FFFFFF;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.skeleton-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.skeleton-chart-title {
  width: 100px;
  height: 18px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-chart-tabs {
  display: flex;
  gap: 8px;
}

.skeleton-tab {
  width: 50px;
  height: 28px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-chart-body {
  height: 200px;
}

.skeleton-bar {
  display: inline-block;
  width: 12%;
  height: 100%;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-right: 4%;
}

.skeleton-bar:last-child {
  margin-right: 0;
}

.skeleton-pie {
  width: 120px;
  height: 120px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 50%;
  margin: 0 auto 16px;
}

.skeleton-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skeleton-legend-item::before {
  content: '';
  width: 12px;
  height: 12px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 3px;
}

.skeleton-legend-item::after {
  content: '';
  width: 60%;
  height: 14px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

/* 数据列表区域 */
.skeleton-list-section {
  background: #FFFFFF;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.skeleton-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.skeleton-section-title {
  width: 120px;
  height: 18px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-section-action {
  width: 60px;
  height: 28px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.skeleton-list-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-list-title {
  width: 60%;
  height: 16px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-list-desc {
  width: 40%;
  height: 14px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-list-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.skeleton-list-tag {
  width: 50px;
  height: 20px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-list-time {
  width: 80px;
  height: 14px;
  background: linear-gradient(90deg, #E8EAED 25%, #F3F4F6 50%, #E8EAED 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

/* 骨架屏动画 */
@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 响应式适配 */
@media (max-width: 991px) {
  .skeleton-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .skeleton-charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .skeleton-cards {
    grid-template-columns: 1fr;
  }
  
  .skeleton-nav {
    display: none;
  }
}
</style>