import { getApiBaseUrl } from '@/utils/apiConfig'

export async function request<T>(path: string, opts: {
  method?: string
  body?: unknown
  tenantId?: string
}): Promise<T> {
  const method = opts.method || 'POST'
  const headers: Record<string, string> = {}

  if (opts.tenantId) {
    headers['X-Tenant-ID'] = opts.tenantId
  }
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json'
  }

  const baseUrl = getApiBaseUrl()
  if (!baseUrl) {
    throw new Error(
      '后端服务器地址未配置。\n' +
      '请在首页点击右上角「⚙️」进入服务器设置，\n' +
      '填写电脑在局域网中的 IP 地址（如 http://192.168.1.100:8000）。'
    )
  }
  const fullUrl = `${baseUrl}/api/v1${path}`

  let res: Response
  try {
    res = await fetch(fullUrl, {
      method,
      headers,
      body: opts.body && method !== 'GET' ? JSON.stringify(opts.body) : undefined,
    })
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(
      `无法连接后端服务（${baseUrl}）。\n` +
      `请确认：\n` +
      `1. 手机和电脑在同一 WiFi（或电脑连手机热点）\n` +
      `2. 后端已启动（端口 8000）\n` +
      `3. 在「⚙️ 服务器设置」中填写的 IP 是否正确\n\n` +
      `底层错误：${detail}`
    )
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || err.message || 'API Error')
  }

  return res.json()
}
