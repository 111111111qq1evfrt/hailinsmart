<template>
  <div class="system-management">
    <UserManagement v-if="route.path === '/system/users'" :key="route.path" />
    <StudentManagement v-else-if="route.path === '/system/students'" :key="route.path" />
    <DeviceManagement v-else-if="route.path === '/system/devices'" :key="route.path" />
    <WorkOrderManagement v-else-if="route.path === '/system/workorders'" :key="route.path" />
    <ResourceManagement v-else-if="route.path === '/system/resources'" :key="route.path" />
    <NotificationCenter v-else-if="route.path === '/system/notifications'" :key="route.path" />
    <SystemSettings v-else-if="route.path === '/system/settings'" :key="route.path" />
    <VersionManagement v-else-if="route.path === '/system/version'" :key="route.path" />
    <FeedbackSupport v-else-if="route.path === '/system/feedback'" :key="route.path" />
    <UserManagement v-else :key="route.path" />
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const UserManagement = defineAsyncComponent(() => import('./user/UserManagement.vue'))
const StudentManagement = defineAsyncComponent(() => import('./user/StudentManagement.vue'))
const DeviceManagement = defineAsyncComponent(() => import('./user/DeviceManagement.vue'))
const WorkOrderManagement = defineAsyncComponent(() => import('./user/WorkOrderManagement.vue'))
const ResourceManagement = defineAsyncComponent(() => import('./user/ResourceManagement.vue'))
const NotificationCenter = defineAsyncComponent(() => import('./user/NotificationCenter.vue'))
const SystemSettings = defineAsyncComponent(() => import('./user/SystemSettings.vue'))
const VersionManagement = defineAsyncComponent(() => import('./user/VersionManagement.vue'))
const FeedbackSupport = defineAsyncComponent(() => import('./user/FeedbackSupport.vue'))

const route = useRoute()
</script>

<style scoped>
.system-management {
  min-height: calc(100vh - 140px);
}
</style>
