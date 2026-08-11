<template>
  <div class="teaching-management">
    <el-tabs v-model="activeTab" class="tab-container" @tab-change="handleTabChange">
      <el-tab-pane label="听评课" name="review">
        <component :is="activeComponent" v-if="activeTab === 'review'" />
      </el-tab-pane>
      <el-tab-pane label="公开课管理" name="openclass">
        <component :is="activeComponent" v-if="activeTab === 'openclass'" />
      </el-tab-pane>
      <el-tab-pane label="直播与回放" name="live">
        <component :is="activeComponent" v-if="activeTab === 'live'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import LessonReview from './LessonReview.vue'
import OpenClassManagement from './OpenClassManagement.vue'
import LivePlayback from './LivePlayback.vue'

const activeTab = ref('review')

const componentMap = {
  review: markRaw(LessonReview),
  openclass: markRaw(OpenClassManagement),
  live: markRaw(LivePlayback)
}

const activeComponent = computed(() => componentMap[activeTab.value])

const handleTabChange = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}
</script>

<style scoped>
.teaching-management {
  min-height: calc(100vh - 140px);
}

.tab-container {
  min-height: calc(100vh - 140px);
}
</style>