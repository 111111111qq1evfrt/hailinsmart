/**
 * 客户端信息工具
 * 获取客户端 IP 地址
 */

const IP_STORAGE_KEY = 'smart_pe_client_ip'

/**
 * 通过 WebRTC 获取浏览器本地 IP
 * 这是最可靠的方式，不需要网络请求，不会被 CORS 阻止
 */
const getLocalIP = () => {
  return new Promise((resolve) => {
    const RTCPeerConnection = window.RTCPeerConnection || 
                              window.webkitRTCPeerConnection || 
                              window.mozRTCPeerConnection
    
    if (!RTCPeerConnection) {
      resolve(null)
      return
    }
    
    let resolved = false
    
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      pc.createDataChannel('')
      
      pc.onicecandidate = (event) => {
        if (resolved) return
        if (!event.candidate) return
        
        const candidate = event.candidate.candidate
        // 提取所有 IPv4 IP
        const ips = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/g)
        if (ips && ips.length > 0) {
          resolved = true
          pc.close()
          // 返回第一个 IP（通常是本地 IP）
          resolve(ips[0])
        }
      }
      
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => resolve(null))
      
      // 5秒超时
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          try { pc.close() } catch(e) {}
          resolve(null)
        }
      }, 5000)
    } catch (e) {
      resolve(null)
    }
  })
}

/**
 * 获取客户端 IP
 * @returns {Promise<string>} IP 地址
 */
export const getClientIP = async () => {
  // 1. 读缓存
  const cached = sessionStorage.getItem(IP_STORAGE_KEY)
  if (cached) return cached

  // 2. 通过 WebRTC 获取
  const ip = await getLocalIP()
  if (ip) {
    sessionStorage.setItem(IP_STORAGE_KEY, ip)
    return ip
  }

  // 3. 都失败了，返回一个默认值
  return '0.0.0.0'
}

/**
 * 同步读取缓存的 IP
 * @returns {string}
 */
export const getCachedIP = () => {
  return sessionStorage.getItem(IP_STORAGE_KEY) || '0.0.0.0'
}

/**
 * 清除 IP 缓存
 */
export const clearIPCache = () => {
  sessionStorage.removeItem(IP_STORAGE_KEY)
}
