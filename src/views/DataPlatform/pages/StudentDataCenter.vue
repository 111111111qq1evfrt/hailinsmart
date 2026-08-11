<template>
  <div class="student-data-center">
    <el-tabs v-model="activeTab" class="tab-container" @tab-change="handleTabChange">
      <el-tab-pane label="运动数据" name="student">
        <component :is="activeComponent" v-if="activeTab === 'student'" />
      </el-tab-pane>
      <el-tab-pane label="运动风云榜" name="ranking">
        <component :is="activeComponent" v-if="activeTab === 'ranking'" />
      </el-tab-pane>
      <el-tab-pane label="阳光跑数据" name="sunshine">
        <component :is="activeComponent" v-if="activeTab === 'sunshine'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import StudentData from './../reports/StudentData.vue'
import SportsRanking from './../media/SportsRanking.vue'
import SunshineRun from './../media/SunshineRun.vue'
import store from '../../../store/global'
import { usePersistedRef } from '../../../composables/usePersistedRef'

const schoolId = store.state.school.id || 'hailin-second-primary'
const activeTab = usePersistedRef(`smart_pe_student_center_tab_${schoolId}`, 'student')

const componentMap = {
  student: markRaw(StudentData),
  ranking: markRaw(SportsRanking),
  sunshine: markRaw(SunshineRun)
}

const activeComponent = computed(() => componentMap[activeTab.value])

const handleTabChange = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}
</script>

<style scoped>
.student-data-center {
  min-height: calc(100vh - 140px);
}

.tab-container {
  min-height: calc(100vh - 140px);
}
</style>