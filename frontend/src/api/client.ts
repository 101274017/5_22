/**
 * 后端 API 客户端
 * 支持两种模式：
 * 1. 古迹神交（多租户，X-Tenant-ID）
 * 2. 名人对话（无租户限制）
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '') + '/api/v1'

async function request<T>(path: string, opts: {
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

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: opts.body && method !== 'GET' ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || err.message || 'API Error')
  }

  return res.json()
}

// ============ 古迹神交 API ============

export const encounterApi = {
  summon(tenantId: string, body: { user_id: string; poi_name: string }) {
    return request<{
      encounter_id: number
      character_name: string
      opening_speech: string
      question: string
    }>('/encounter/summon', { tenantId, body })
  },

  answer(tenantId: string, body: { encounter_id: number; user_answer: string }) {
    return request<{
      gift_words: string
      badge_name: string
      badge_icon: string
    }>('/encounter/answer', { tenantId, body })
  },

  chat(tenantId: string, body: { encounter_id: number; message: string }) {
    return request<{ reply: string; reference: string }>(
      '/encounter/chat',
      { tenantId, body }
    )
  },

  getEncounters(tenantId: string, userId: string) {
    return request<Array<{
      id: number
      character_name: string
      poi_name: string
      question: string
      user_answer: string | null
      gift_words: string | null
      badge_name: string | null
      status: string
    }>>(`/encounter/list?user_id=${encodeURIComponent(userId)}`, {
      tenantId,
      method: 'GET',
    })
  },

  getEncounterDetail(tenantId: string, userId: string, encounterId: number) {
    return request<{
      id: number
      character_name: string
      poi_name: string
      question: string
      user_answer: string
      gift_words: string
      badge_name: string
    }>(`/encounter/${encounterId}?user_id=${encodeURIComponent(userId)}`, {
      tenantId,
      method: 'GET',
    })
  },

  track(tenantId: string, body: { event_type: string; event_key: string; payload: string }) {
    return request<{ success: boolean }>('/track', { tenantId, body })
  },
}

// ============ 导游讲解团 API ============

export const guideApi = {
  createTour(body: {
    guide_id: string
    guide_name: string
    celebrity_name: string
    celebrity_age?: string
    poi_name: string
    description?: string
  }) {
    return request<{
      tour_id: number
      tour_code: string
      qr_content: string
    }>('/guide/create-tour', { body })
  },

  joinTour(body: { user_id: string; tour_code: string }) {
    return request<{
      tour_id: number
      guide_name: string
      celebrity_name: string
      celebrity_age?: string
      poi_name: string
      description?: string
    }>('/guide/join-tour', { body })
  },

  narrate(body: { tour_id: number; user_id: string; message?: string }) {
    return request<{
      narration: string
      celebrity_name: string
      poi_name: string
    }>('/guide/narrate', { body })
  },

  getMyTours(guideId: string) {
    return request<Array<{
      id: number
      celebrity_name: string
      celebrity_age?: string
      poi_name: string
      tour_code: string
      status: string
      participant_count: number
      description?: string
      created_at?: string
      is_expired?: boolean
    }>>(`/guide/my-tours?guide_id=${encodeURIComponent(guideId)}`, { method: 'GET' })
  },

  closeTour(tourId: number, guideId: string) {
    return request<{ success: boolean; message: string }>(
      '/guide/close-tour',
      { body: { tour_id: tourId, guide_id: guideId } }
    )
  },

  checkLink(celebrityName: string, poiName: string) {
    return request<{ is_strong: boolean; message: string | null }>(
      '/guide/check-link',
      { body: { celebrity_name: celebrityName, poi_name: poiName } }
    )
  },
}

// ============ 名人对话 API ============

export const celebrityApi = {
  checkDisambiguation(celebrityName: string) {
    return request<{
      needs_selection: boolean
      candidates: Array<{
        id: string
        name: string
        birth_year: number
        death_year: number
        identity: string
        label: string
        alias?: string
      }> | null
      resolved_name?: string
    }>('/celebrity/check-disambiguation', {
      body: { celebrity_name: celebrityName },
    })
  },

  start(userId: string, celebrityName: string) {
    return request<{
      encounter_id: number
      celebrity_name: string
      identity: string
      era: string
      opening: string
    }>('/celebrity/start', {
      body: { user_id: userId, celebrity_name: celebrityName },
    })
  },

  chat(encounterId: number, message: string) {
    return request<{ reply: string; message_count: number }>(
      '/celebrity/chat',
      { body: { encounter_id: encounterId, message } }
    )
  },

  generateCard(encounterId: number) {
    return request<{
      gift_words: string
      badge_name: string
      celebrity_name: string
      identity: string
      era: string
    }>('/celebrity/generate-card', {
      body: { encounter_id: encounterId },
    })
  },

  getList(userId: string) {
    return request<Array<{
      id: number
      character_name: string
      identity: string
      gift_words: string | null
      badge_name: string | null
      status: string
    }>>(`/celebrity/list?user_id=${encodeURIComponent(userId)}`, { method: 'GET' })
  },

  getDetail(encounterId: number) {
    return request<{
      id: number
      character_name: string
      identity: string
      gift_words: string
      badge_name: string
      status: string
    }>(`/celebrity/${encounterId}`, { method: 'GET' })
  },
}
