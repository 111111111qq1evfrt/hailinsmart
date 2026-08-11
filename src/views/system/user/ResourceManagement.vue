<template>
  <div class="resource-management">
    <el-tabs v-model="activeTab" class="tab-container" @tab-change="handleTabChange">
      <el-tab-pane label="资源监看" name="monitoring">
        <component :is="activeComponent" v-if="activeTab === 'monitoring'" />
      </el-tab-pane>
      <el-tab-pane label="视频存储" name="video">
        <component :is="activeComponent" v-if="activeTab === 'video'" />
      </el-tab-pane>
      <el-tab-pane label="防刷票机制" name="vote">
        <component :is="activeComponent" v-if="activeTab === 'vote'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import { usePersistedRef } from '@/composables/usePersistedRef'
import ResourceMonitoring from './../reports/ResourceMonitoring.vue'
import VideoStorage from './../settings/VideoStorage.vue'
import VoteSecurity from './../settings/VoteSecurity.vue'
import store from '@/store/global'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const activeTab = usePersistedRef(computed(() => `smart_pe_resources_activeTab_${schoolId.value}`), 'monitoring')

const componentMap = {
  monitoring: markRaw(ResourceMonitoring),
  video: markRaw(VideoStorage),
  vote: markRaw(VoteSecurity)
}

const activeComponent = computed(() => componentMap[activeTab.value])

const handleTabChange = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}
</script>

<style scoped>
.resource-management {
  min-height: calc(100vh - 140px);
}

.tab-container {
  min-height: calc(100vh - 140px);
}
</style>