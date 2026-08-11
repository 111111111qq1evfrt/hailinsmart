<template>
  <div class="lazy-image-wrapper" :class="{ loaded: isLoaded, error: hasError }">
    <img
      v-if="isLoaded && !hasError"
      :src="src"
      :alt="alt"
      class="lazy-image"
      :class="{ 'fade-in': fadeIn }"
    />
    <div v-else class="lazy-image-placeholder">
      <div class="placeholder-content">
        <svg v-if="showIcon" viewBox="0 0 100 100" fill="none" class="placeholder-icon">
          <rect x="10" y="20" width="80" height="60" rx="4" stroke="#E8EAED" stroke-width="2" />
          <circle cx="30" cy="50" r="15" fill="#E8EAED" />
          <path d="M55 40 L70 55 L55 70 Z" stroke="#9CA3AF" stroke-width="2" fill="none" />
        </svg>
        <span v-if="showText" class="placeholder-text">{{ placeholderText }}</span>
      </div>
    </div>
    <div v-if="hasError" class="lazy-image-error">
      <svg viewBox="0 0 24 24" fill="none" class="error-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#E85D4E" />
      </svg>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted, onUnmounted } from 'vue';
const props = withDefaults(defineProps({
 src: {
 type: String,
 required: true
 },
 alt: {
 type: String,
 default: ''
 },
 placeholderText: {
 type: String,
 default: '加载中...'
 },
 showIcon: {
 type: Boolean,
 default: true
 },
 showText: {
 type: Boolean,
 default: false
 },
 fadeIn: {
 type: Boolean,
 default: true
 },
 rootMargin: {
 type: String,
 default: '50px'
 },
 threshold: {
 type: Number,
 default: 0.1
 }
}), {});
const isLoaded = ref(false);
const hasError = ref(false);
let observer = null;
const loadImage = () => {
 if (isLoaded.value || hasError.value)
 return;
 const img = new Image();
 img.onload = () => {
 isLoaded.value = true;
 if (observer) {
 observer.disconnect();
 }
 };
 img.onerror = () => {
 hasError.value = true;
 if (observer) {
 observer.disconnect();
 }
 };
 img.src = props.src;
};
onMounted(() => {
 if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
 observer = new IntersectionObserver((entries) => {
 entries.forEach(entry => {
 if (entry.isIntersecting) {
 loadImage();
 }
 });
 }, {
 rootMargin: props.rootMargin,
 threshold: props.threshold
 });
 const wrapper = document.querySelector(`[data-lazy-src="${props.src}"]`);
 if (wrapper) {
 observer.observe(wrapper);
 }
 }
 else {
 loadImage();
 }
});
onUnmounted(() => {
 if (observer) {
 observer.disconnect();
 }
});
</script>

<style scoped>
.lazy-image-wrapper {
  position: relative;
  overflow: hidden;
  background-color: #F7F8FA;
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lazy-image.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.lazy-image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F7F8FA;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.placeholder-icon {
  width: 48px;
  height: 48px;
}

.placeholder-text {
  font-size: 12px;
  color: #9CA3AF;
}

.lazy-image-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon {
  width: 48px;
  height: 48px;
}
</style>