<template>
  <div class="data-analysis-center">
    <el-tabs v-model="activeTab" class="tab-container" @tab-change="handleTabChange">
      <el-tab-pane label="健康数据整合" name="health">
        <component :is="activeComponent" v-if="activeTab === 'health'" />
      </el-tab-pane>
      <el-tab-pane label="教学态势" name="trend">
        <component :is="activeComponent" v-if="activeTab === 'trend'" />
      </el-tab-pane>
      <el-tab-pane label="管理效能" name="efficiency">
        <component :is="activeComponent" v-if="activeTab === 'efficiency'" />
      </el-tab-pane>
      <el-tab-pane label="数据统计与决策" name="compliance">
        <component :is="activeComponent" v-if="activeTab === 'compliance'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import HealthDataIntegration from './../media/HealthDataIntegration.vue'
import TeachingTrend from './../reports/TeachingTrend.vue'
import ManagementEfficiency from './../reports/ManagementEfficiency.vue'
import ComplianceReport from './../reports/ComplianceReport.vue'

const activeTab = ref('health')

const componentMap = {
  health: markRaw(HealthDataIntegration),
  trend: markRaw(TeachingTrend),
  efficiency: markRaw(ManagementEfficiency),
  compliance: markRaw(ComplianceReport)
}

const activeComponent = computed(() => componentMap[activeTab.value])

const handleTabChange = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}
</script>

<style scoped>
.data-analysis-center {
  min-height: calc(100vh - 140px);
}

.tab-container {
  min-height: calc(100vh - 140px);
}
</style>