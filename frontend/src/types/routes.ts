export type UserMode = 'tourist' | 'guide'

export type PageRoute =
  | { page: 'landing' }
  | { page: 'home' }
  | { page: 'encounter'; poiName: string }
  | { page: 'geography' }
  | { page: 'share'; encounterId: number }
  | { page: 'celebrity-entry' }
  | { page: 'celebrity-chat'; encounterId: number; celebrityName: string; opening: string; identity: string; poiName?: string; period?: string }
  | { page: 'celebrity-card'; encounterId: number }
  | { page: 'celebrity-history' }
  | { page: 'guide-entry' }
  | { page: 'guide-setup'; guideName: string }
  | { page: 'guide-qrcode'; tourId: number; tourCode: string; celebrityName: string; poiName: string; guideName: string }
  | { page: 'guide-tours'; guideName: string }
  | { page: 'guide-join'; initialCode?: string }
  | { page: 'guide-tour-view'; tourCode: string }
  | { page: 'settings' }

// POI 到租户的映射
export const POI_TENANT_MAP: Record<string, string> = {
  '惠州西湖': 'tenant_huizhou_gov',
  '罗浮山': 'tenant_huizhou_gov',
  '断桥': 'tenant_hangzhou_gov',
  '西湖苏堤': 'tenant_hangzhou_gov',
  '黄鹤楼': 'tenant_wuhan_gov',
  '岳阳楼': 'tenant_yueyang_gov',
  '滕王阁': 'tenant_nanchang_gov',
  '寒山寺': 'tenant_suzhou_gov',
  '杜甫草堂': 'tenant_chengdu_gov',
}
