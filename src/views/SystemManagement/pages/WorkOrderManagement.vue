<template>
  <div class="workorder-management">
    <el-tabs v-model="activeTab" class="tab-container" @tab-change="handleTabChange">
      <el-tab-pane label="请假审批" name="leave">
        <component :is="activeComponent" v-if="activeTab === 'leave'" />
      </el-tab-pane>
      <el-tab-pane label="报修管理" name="repair">
        <component :is="activeComponent" v-if="activeTab === 'repair'" />
      </el-tab-pane>
      <el-tab-pane label="举报记录" name="report">
        <component :is="activeComponent" v-if="activeTab === 'report'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import LeaveApproval from './../operations/LeaveApproval.vue'
import RepairManagement from './../operations/RepairManagement.vue'
import ReportManagement from './../reports/ReportManagement.vue'

const activeTab = ref('leave')

const componentMap = {
  leave: markRaw(LeaveApproval),
  repair: markRaw(RepairManagement),
  report: markRaw(ReportManagement)
}

const activeComponent = computed(() => componentMap[activeTab.value])

const handleTabChange = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}
</script>

<style scoped>
.workorder-management {
  min-height: calc(100vh - 140px);
}

.tab-container {
  min-height: calc(100vh - 140px);
}
</style>