import { request } from './request'

export const celebrityApi = {
  checkDisambiguation(tenantId: string, celebrityName: string) {
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
      tenantId,
      body: { celebrity_name: celebrityName },
    })
  },

  start(tenantId: string, userId: string, celebrityName: string) {
    return request<{
      encounter_id: number
      celebrity_name: string
      identity: string
      era: string
      opening: string
    }>('/celebrity/start', {
      tenantId,
      body: { user_id: userId, celebrity_name: celebrityName },
    })
  },

  chat(tenantId: string, encounterId: number, message: string) {
    return request<{ reply: string; message_count: number }>(
      '/celebrity/chat',
      { tenantId, body: { encounter_id: encounterId, message } }
    )
  },

  generateCard(tenantId: string, encounterId: number) {
    return request<{
      gift_words: string
      badge_name: string
      celebrity_name: string
      identity: string
      era: string
    }>('/celebrity/generate-card', {
      tenantId,
      body: { encounter_id: encounterId },
    })
  },

  getList(tenantId: string, userId: string) {
    return request<Array<{
      id: number
      character_name: string
      identity: string
      gift_words: string | null
      badge_name: string | null
      status: string
    }>>(`/celebrity/list?user_id=${encodeURIComponent(userId)}`, {
      tenantId,
      method: 'GET',
    })
  },

  getDetail(tenantId: string, encounterId: number) {
    return request<{
      id: number
      character_name: string
      identity: string
      gift_words: string
      badge_name: string
      status: string
    }>(`/celebrity/${encounterId}`, {
      tenantId,
      method: 'GET',
    })
  },
}
