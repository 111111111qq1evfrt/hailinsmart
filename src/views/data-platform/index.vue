<template>
  <div class="data-platform">
    <component :is="activeComponent" :key="componentKey" />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, markRaw, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const DataOverview = markRaw(defineAsyncComponent(() => import('./overview/DataPlatform.vue')))
const StudentDataCenter = markRaw(defineAsyncComponent(() => import('./overview/StudentDataCenter.vue')))
const DataAnalysisCenter = markRaw(defineAsyncComponent(() => import('./overview/DataAnalysisCenter.vue')))
const HealthMonitoring = markRaw(defineAsyncComponent(() => import('./overview/HealthMonitoring.vue')))
const MaintenanceAnalysis = markRaw(defineAsyncComponent(() => import('./overview/MaintenanceAnalysis.vue')))


const route = useRoute()

const pathToComponent = {
  '/data/overview': DataOverview,
  '/data/student': StudentDataCenter,
  '/data/analysis': DataAnalysisCenter,
  '/data/health': HealthMonitoring,
  '/data/maintenance': MaintenanceAnalysis
}

// 使用 key 强制重新渲染子组件，确保每次切换路由时 Tab 重置
const componentKey = ref(route.path)

watch(() => route.path, (newPath) => {
  componentKey.value = newPath
})

const activeComponent = computed(() => pathToComponent[route.path] || DataOverview)
</script>

<style scoped>
.data-platform {
  min-height: calc(100vh - 140px);
}
</style>
