<template>
  <div v-if="visible" class="loading-overlay">
    <div class="loading-content">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring spinner-ring-2"></div>
        <div class="spinner-ring spinner-ring-3"></div>
      </div>
      <p class="loading-text">{{ text || '加载中...' }}</p>
      <p v-if="subText" class="loading-subtext">{{ subText }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: '加载中...'
  },
  subText: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-content {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
}

.spinner-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid rgba(30, 90, 168, 0.1);
  border-top-color: #1E5AA8;
  transform: translate(-50%, -50%);
  animation: spin 1.2s linear infinite;
}

.spinner-ring-2 {
  width: 80%;
  height: 80%;
  animation-delay: 0.15s;
  border-top-color: #3B82F6;
}

.spinner-ring-3 {
  width: 60%;
  height: 60%;
  animation-delay: 0.3s;
  border-top-color: #F5A623;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.loading-text {
  font-size: 16px;
  color: #1A1A2E;
  margin: 0 0 8px;
  font-weight: 500;
}

.loading-subtext {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
}
</style>