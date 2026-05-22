/**
 * 技术埋点 SDK
 */
import { encounterApi } from '@/api/client'

export function emitTrackingEvent(
  eventType: string,
  eventKey: string,
  tenantId: string,
  payload: Record<string, unknown> = {}
) {
  const data = {
    event_type: eventType,
    event_key: eventKey,
    payload: JSON.stringify(payload),
  }

  // 异步上报，不阻塞主流程
  encounterApi.track(tenantId, data).catch(() => {
    // 埋点失败静默处理
  })
}
