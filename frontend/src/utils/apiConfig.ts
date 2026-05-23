/**
 * 后端 API 地址：支持运行时修改并持久化到 localStorage，
 * 这样用户在手机上换 WiFi / 后端服务器换 IP 时，不需要重新打包 APK。
 *
 * 优先级：localStorage > VITE_API_BASE_URL > 留空（出错时由 client.ts 提示）
 */

const STORAGE_KEY = 'ancient_api_base_url'

export function getApiBaseUrl(): string {
  try {
    const fromLs = localStorage.getItem(STORAGE_KEY)
    if (fromLs && fromLs.trim()) return fromLs.trim().replace(/\/+$/, '')
  } catch {
    // localStorage 不可用时忽略
  }
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''
  return fromEnv.trim().replace(/\/+$/, '')
}

export function setApiBaseUrl(url: string) {
  try {
    if (url.trim()) {
      localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // 静默
  }
}
