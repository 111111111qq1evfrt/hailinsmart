import { ref, watch } from 'vue'
import sportsApi, { 
  transformPushList, 
  transformStatistics, 
  transformTodayStats,
  transformRankingList 
} from '@/utils/daiweiPushApi'
import { useGlobalState } from '@/store/global'

export function useSportsData() {
  const { state } = useGlobalState()
  
  const pushList = ref([])
  const statistics = ref(null)
  const todayStats = ref(null)
  const rankingList = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 加载推送数据列表
  async function loadPushList(filters = {}) {
    loading.value = true
    error.value = null
    try {
      const schoolId = state.school?.id || ''
      const res = await sportsApi.getList(schoolId, filters)
      if (res.code === '0') {
        pushList.value = transformPushList(res.data.list)
      } else {
        error.value = res.message
      }
    } catch (e) {
      console.error('加载推送数据失败:', e)
      error.value = '加载失败，请检查服务是否正常'
    } finally {
      loading.value = false
    }
  }

  // 加载统计数据
  async function loadStatistics() {
    loading.value = true
    error.value = null
    try {
      const schoolId = state.school?.id || ''
      const res = await sportsApi.getStatistics(schoolId)
      if (res.code === '0') {
        statistics.value = transformStatistics(res.data)
      } else {
        error.value = res.message
      }
    } catch (e) {
      console.error('加载统计数据失败:', e)
      error.value = '加载失败，请检查服务是否正常'
    } finally {
      loading.value = false
    }
  }

  // 加载今日统计
  async function loadTodayStats() {
    try {
      const schoolId = state.school?.id || ''
      const res = await sportsApi.getTodayStats(schoolId)
      if (res.code === '0') {
        todayStats.value = transformTodayStats(res.data)
      }
    } catch (e) {
      console.error('加载今日统计失败:', e)
    }
  }

  // 加载排行榜
  async function loadRanking(sportType, limit = 100) {
    loading.value = true
    error.value = null
    try {
      const schoolId = state.school?.id || ''
      const res = await sportsApi.getRanking(schoolId, sportType, limit)
      if (res.code === '0') {
        rankingList.value = transformRankingList(res.data.list, sportType)
      } else {
        error.value = res.message
      }
    } catch (e) {
      console.error('加载排行榜失败:', e)
      error.value = '加载失败，请检查服务是否正常'
    } finally {
      loading.value = false
    }
  }

  // 加载所有数据
  async function loadAll(filters = {}) {
    await Promise.all([
      loadPushList(filters),
      loadStatistics(),
      loadTodayStats()
    ])
  }

  // 刷新数据
  async function refresh() {
    await loadAll()
  }

  return {
    pushList,
    statistics,
    todayStats,
    rankingList,
    loading,
    error,
    loadPushList,
    loadStatistics,
    loadTodayStats,
    loadRanking,
    loadAll,
    refresh
  }
}
