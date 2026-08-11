import { ref, watch, isRef } from 'vue'

export function usePersistedRef(key, defaultValue) {
  const getKey = () => (isRef(key) ? key.value : key)

  const readFromStorage = () => {
    const k = getKey()
    const stored = sessionStorage.getItem(k)
    if (stored && stored !== 'undefined' && stored !== 'null') {
      try { return JSON.parse(stored) } catch (e) { /* fall through */ }
    }
    return undefined
  }

  const getDefault = () => (typeof defaultValue === 'function' ? defaultValue() : defaultValue)
  const initial = readFromStorage() !== undefined ? readFromStorage() : getDefault()
  const data = ref(initial)

  // Sync data changes to sessionStorage
  watch(data, (v) => {
    sessionStorage.setItem(getKey(), JSON.stringify(v))
  }, { deep: true })

  // If key is reactive, watch for key changes and reload from new storage location
  if (isRef(key)) {
    watch(key, () => {
      const stored = readFromStorage()
      data.value = stored !== undefined ? stored : getDefault()
    })
  }

  return data
}
