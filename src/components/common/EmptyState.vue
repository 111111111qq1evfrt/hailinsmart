<template>
  <div class="empty-state">
    <div class="empty-icon">
      <svg viewBox="0 0 100 100" fill="none">
        <path 
          d="M50 10C30.67 10 15 25.67 15 45c0 19.33 15.67 35 35 35s35-15.67 35-35c0-19.33-15.67-35-35-35zm0 60c-13.81 0-25-11.19-25-25S36.19 20 50 20s25 11.19 25 25-11.19 25-25 25z" 
          fill="#E8EAED"
        />
        <path 
          d="M50 35c-8.28 0-15 6.72-15 15s6.72 15 15 15 15-6.72 15-15-6.72-15-15-15zm0 25c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10z" 
          fill="#9CA3AF"
        />
        <path 
          d="M35 65h30v-5h-30v5zm0 10h30v-5h-30v5z" 
          fill="#9CA3AF"
        />
      </svg>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-desc">{{ description }}</p>
    <slot>
      <button 
        v-if="buttonText" 
        class="empty-button"
        @click="$emit('refresh')"
      >
        {{ buttonText }}
      </button>
    </slot>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: '暂无相关数据，请稍后重试'
  },
  buttonText: {
    type: String,
    default: ''
  }
})

defineEmits(['refresh'])
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 200px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 14px;
  color: #9CA3AF;
  margin: 0 0 20px 0;
}

.empty-button {
  padding: 8px 20px;
  background: #1E5AA8;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.empty-button:hover {
  background: #236B3A;
}
</style>