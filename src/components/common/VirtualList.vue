<template>
  <div 
    ref="containerRef"
    class="virtual-list-container"
    :style="{ height: containerHeight }"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-list-scroll-wrapper"
      :style="{ height: totalHeight }"
    >
      <div 
        class="virtual-list-content"
        :style="{ transform: `translateY(${offsetTop}px)` }"
      >
        <div 
          v-for="(item, index) in visibleData"
          :key="item.id || index"
          class="virtual-list-item"
          :style="{ height: itemHeight }"
        >
          <slot :item="item" :index="startIndex + index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
const props = withDefaults(defineProps({
 data: {
 type: Array,
 default: () => []
 },
 itemHeight: {
 type: [Number, String],
 default: 48
 },
 containerHeight: {
 type: String,
 default: '400px'
 },
 overscanCount: {
 type: Number,
 default: 5
 }
}), {});
const containerRef = ref(null);
const scrollTop = ref(0);
const itemHeightNum = computed(() => Number(props.itemHeight));
const totalHeight = computed(() => `${props.data.length * itemHeightNum.value}px`);
const visibleCount = computed(() => {
 if (!containerRef.value)
 return 10;
 const containerHeightNum = containerRef.value.getBoundingClientRect().height;
 return Math.ceil(containerHeightNum / itemHeightNum.value);
});
const startIndex = computed(() => {
 const index = Math.floor(scrollTop.value / itemHeightNum.value);
 return Math.max(0, index - props.overscanCount);
});
const endIndex = computed(() => {
 const index = startIndex.value + visibleCount.value + props.overscanCount * 2;
 return Math.min(props.data.length, index);
});
const visibleData = computed(() => {
 return props.data.slice(startIndex.value, endIndex.value);
});
const offsetTop = computed(() => {
 return startIndex.value * itemHeightNum.value;
});
const handleScroll = (e) => {
 scrollTop.value = e.target.scrollTop;
};
const scrollToIndex = (index) => {
 if (containerRef.value) {
 containerRef.value.scrollTop = index * itemHeightNum.value;
 }
};
defineExpose({
 scrollToIndex
});
watch(() => props.data.length, () => {
 scrollTop.value = 0;
});
onMounted(() => {
 if (containerRef.value) {
 scrollTop.value = containerRef.value.scrollTop;
 }
});
onUnmounted(() => {
 scrollTop.value = 0;
});
</script>

<style scoped>
.virtual-list-container {
  overflow-y: auto;
  position: relative;
  width: 100%;
}

.virtual-list-scroll-wrapper {
  position: relative;
  width: 100%;
}

.virtual-list-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
}

.virtual-list-item {
  width: 100%;
  box-sizing: border-box;
}
</style>