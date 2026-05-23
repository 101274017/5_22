import { request } from './request'

export const guideApi = {
  createTour(tenantId: string, body: {
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
    }>('/guide/create-tour', { tenantId, body })
  },

  joinTour(tenantId: string, body: { user_id: string; tour_code: string }) {
    return request<{
      tour_id: number
      guide_name: string
      celebrity_name: string
      celebrity_age?: string
      poi_name: string
      description?: string
    }>('/guide/join-tour', { tenantId, body })
  },

  narrate(tenantId: string, body: { tour_id: number; user_id: string; message?: string }) {
    return request<{
      narration: string
      celebrity_name: string
      poi_name: string
    }>('/guide/narrate', { tenantId, body })
  },

  getMyTours(tenantId: string, guideId: string) {
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
    }>>(`/guide/my-tours?guide_id=${encodeURIComponent(guideId)}`, {
      tenantId,
      method: 'GET',
    })
  },

  closeTour(tenantId: string, tourId: number, guideId: string) {
    return request<{ success: boolean; message: string }>(
      '/guide/close-tour',
      { tenantId, body: { tour_id: tourId, guide_id: guideId } }
    )
  },

  checkLink(tenantId: string, celebrityName: string, poiName: string) {
    return request<{ is_strong: boolean; message: string | null }>(
      '/guide/check-link',
      { tenantId, body: { celebrity_name: celebrityName, poi_name: poiName } }
    )
  },
}
