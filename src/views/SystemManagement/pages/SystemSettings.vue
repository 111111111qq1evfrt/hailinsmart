<template>
  <div class="system-settings">
    <el-tabs v-model="activeTab" class="tab-container" @tab-change="handleTabChange">
      <el-tab-pane label="系统集成" name="integration">
        <component :is="activeComponent" v-if="activeTab === 'integration'" />
      </el-tab-pane>
      <el-tab-pane label="数据备份" name="backup">
        <component :is="activeComponent" v-if="activeTab === 'backup'" />
      </el-tab-pane>
      <el-tab-pane label="操作日志" name="log">
        <component :is="activeComponent" v-if="activeTab === 'log'" />
      </el-tab-pane>
      <el-tab-pane label="隐私保护" name="privacy">
        <component :is="activeComponent" v-if="activeTab === 'privacy'" />
      </el-tab-pane>
      <el-tab-pane label="模板管理" name="template">
        <component :is="activeComponent" v-if="activeTab === 'template'" />
      </el-tab-pane>
      <el-tab-pane label="数据分析配置" name="config">
        <component :is="activeComponent" v-if="activeTab === 'config'" />
      </el-tab-pane>
      <el-tab-pane label="个人中心" name="profile">
        <component :is="activeComponent" v-if="activeTab === 'profile'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, markRaw, defineAsyncComponent, onMounted } from 'vue'

const IntegrationManagement = defineAsyncComponent(() => import('./../reports/IntegrationManagement.vue'))
const BackupRestore = defineAsyncComponent(() => import('./../operations/BackupRestore.vue'))
const OperationLog = defineAsyncComponent(() => import('./../operations/OperationLog.vue'))
const PrivacyPolicy = defineAsyncComponent(() => import('./../support/PrivacyPolicy.vue'))
const TemplateManagement = defineAsyncComponent(() => import('./../operations/TemplateManagement.vue'))
const DataAnalysisConfig = defineAsyncComponent(() => import('./../reports/DataAnalysisConfig.vue'))
const Profile = defineAsyncComponent(() => import('../../Public/Profile.vue'))

const activeTab = ref('integration')

const componentMap = {
  integration: markRaw(IntegrationManagement),
  backup: markRaw(BackupRestore),
  log: markRaw(OperationLog),
  privacy: markRaw(PrivacyPolicy),
  template: markRaw(TemplateManagement),
  config: markRaw(DataAnalysisConfig),
  profile: markRaw(Profile)
}

const activeComponent = computed(() => componentMap[activeTab.value])

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const tab = urlParams.get('tab')
  if (tab && componentMap[tab]) {
    activeTab.value = tab
  }
})

const handleTabChange = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}
</script>

<style scoped>
.system-settings {
  min-height: calc(100vh - 140px);
}

.tab-container {
  min-height: calc(100vh - 140px);
  overflow: hidden;
}
</style>