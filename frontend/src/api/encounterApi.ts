import { request } from './request'

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
