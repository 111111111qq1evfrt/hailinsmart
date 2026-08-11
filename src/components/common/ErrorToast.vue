<template>
  <div class="error-toast" :class="{ show: visible }">
    <div class="error-icon">
      <svg viewBox="0 0 24 24" fill="none">
        <path 
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" 
          fill="currentColor"
        />
      </svg>
    </div>
    <span class="error-message">{{ message }}</span>
    <button class="close-btn" @click="$emit('close')">
      <svg viewBox="0 0 24 24" fill="none">
        <path 
          d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" 
          fill="currentColor"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: '操作失败，请稍后重试'
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const show = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    show.value = true
    if (props.duration > 0) {
      setTimeout(() => {
        emit('close')
      }, props.duration)
    }
  } else {
    show.value = false
  }
})
</script>

<style scoped>
.error-toast {
  position: fixed;
  top: 20px;
  right: -400px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #FEE2E2;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transition: right 0.3s ease;
  z-index: 10000;
}

.error-toast.show {
  right: 20px;
}

.error-icon {
  width: 24px;
  height: 24px;
  color: #E85D4E;
  flex-shrink: 0;
}

.error-message {
  font-size: 14px;
  color: #991B1B;
  flex: 1;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.close-btn:hover {
  color: #6B7280;
}
</style>