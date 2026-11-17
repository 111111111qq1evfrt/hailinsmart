// ============================================================
// 附件 IndexedDB 存储（纯前端，不依赖后端）
// 文件本体以 Blob 形式存 IndexedDB，通知记录里只存元数据
// ============================================================

const DB_NAME = 'smart_pe'
const DB_VERSION = 1
const STORE_NAME = 'attachments'
let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function getStore(mode = 'readonly') {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      const store = tx.objectStore(STORE_NAME)
      tx.oncomplete = () => resolve(store)
      tx.onerror = () => reject(tx.error)
      // 直接返回 store 用，不要等 tx complete
      resolve(store)
    })
  })
}

/** 保存附件，返回附件元数据 { id, name, size, mime, createdAt } */
export async function saveAttachment(file) {
  const id = 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
  const meta = {
    id,
    name: file.name,
    size: file.size,
    mime: file.type || getMime(file.name),
    createdAt: Date.now(),
    blob: file
  }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(meta)
    req.onsuccess = () => {
      const { blob, ...rest } = meta
      resolve(rest)
    }
    req.onerror = () => reject(req.error)
  })
}

/** 获取附件 Blob（用于下载/预览） */
export async function getAttachmentBlob(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result?.blob || null)
    req.onerror = () => reject(req.error)
  })
}

/** 删除附件 */
export async function deleteAttachment(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** 下载附件（从 IndexedDB 取出 Blob 触发浏览器下载） */
export async function downloadAttachment(id, fallbackName) {
  const blob = await getAttachmentBlob(id)
  if (!blob) {
    console.warn('[AttachmentStore] 附件不存在，可能被清理：', id)
    return false
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fallbackName || 'attachment'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return true
}

function getMime(name) {
  const ext = name.split('.').pop().toLowerCase()
  return ({
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    mp4: 'video/mp4', avi: 'video/x-msvideo'
  })[ext] || 'application/octet-stream'
}
