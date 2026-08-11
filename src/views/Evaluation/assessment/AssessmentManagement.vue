<template>
  <div class="assessment-management">
    <el-tabs v-model="activeTab" class="tab-container" @tab-change="handleTabChange">
      <el-tab-pane label="学生评价" name="evaluation">
        <StudentEvaluation v-if="activeTab === 'evaluation'" :query="routeQuery" />
      </el-tab-pane>
      <el-tab-pane label="投票分析" name="vote">
        <component :is="componentMap['vote']" v-if="activeTab === 'vote'" />
      </el-tab-pane>
      <el-tab-pane label="体育作业" name="homework">
        <component :is="componentMap['homework']" v-if="activeTab === 'homework'" />
      </el-tab-pane>
      <el-tab-pane label="AI智能点评" name="ai-review">
        <component :is="componentMap['ai-review']" v-if="activeTab === 'ai-review'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, markRaw, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import StudentEvaluation from '../student-evaluation/index.vue'
import VoteAnalysis from './VoteAnalysis.vue'
import HomeworkPublish from './HomeworkPublish.vue'
import AiReview from '../ai/AiReview.vue'

const route = useRoute()
const activeTab = ref('evaluation')

const routeQuery = computed(() => route.query)

const componentMap = {
  vote: markRaw(VoteAnalysis),
  homework: markRaw(HomeworkPublish),
  'ai-review': markRaw(AiReview)
}

const handleTabChange = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}

onMounted(() => {
  const queryTab = route.query.tab
  if (queryTab && ['vote', 'homework', 'ai-review'].includes(queryTab)) {
    activeTab.value = queryTab
  }
})
</script>

<style scoped>
.assessment-management {
  min-height: calc(100vh - 140px);
}

.tab-container {
  min-height: calc(100vh - 140px);
}
</style>