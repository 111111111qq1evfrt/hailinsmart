import { computed } from 'vue'
import store from '@/store/global'
import { generateDeterministicId } from '@/utils/seededRandom'
import { getCachedIP } from '@/utils/clientInfo'

/**
 * 通用操作日志记录 composable
 * 写入系统级操作日志 smart_pe_sys_operation_logs_${schoolId}（供 OperationLog 页面使用）
 */
export function useOperationLog(module = 'system') {
  const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

  const addLog = (action, target, detail = '', result = '成功', typeOverride) => {
    // 过滤不需要记录的操作
    const skipActions = ['加载', '查看', '查询', '浏览', '读取', '获取']
    if (skipActions.some(skip => action.includes(skip))) return

    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const operator = store.state.user.name || '管理员'
    const userId = String(store.state.user.id || 'admin001')

    let sysType = 'update'
    if (action.includes('创建') || action.includes('新建') || action.includes('添加')) sysType = 'create'
    else if (action.includes('删除') || action.includes('移除')) sysType = 'delete'
    else if (action.includes('导出') || action.includes('下载')) sysType = 'export'
    else if (action.includes('登录')) sysType = 'login'
    else if (action.includes('退出')) sysType = 'logout'
    else if (action.includes('导入')) sysType = 'create'
    else if (action.includes('备份')) sysType = 'export'
    else if (action.includes('恢复') || action.includes('还原')) sysType = 'update'
    else if (action.includes('重置')) sysType = 'update'
    else if (typeOverride) sysType = typeOverride

    const sysLog = {
      id: generateDeterministicId('log', action + '_' + target + '_' + userId),
      time: timeStr,
      userName: operator,
      userId,
      ip: getCachedIP(),
      module,
      type: sysType,
      description: `${action} - ${target}`,
      status: result === '成功' ? 'success' : 'fail',
      data: JSON.stringify({ action, target, detail }),
      error: result === '失败' ? detail : ''
    }

    const sysLogsKey = `smart_pe_sys_operation_logs_${schoolId.value}`
    let sysLogs = []
    try { sysLogs = JSON.parse(sessionStorage.getItem(sysLogsKey) || '[]') } catch {}
    sysLogs.unshift(sysLog)
    if (sysLogs.length > 100) sysLogs.pop()
    sessionStorage.setItem(sysLogsKey, JSON.stringify(sysLogs))
  }

  return { addLog }
}
