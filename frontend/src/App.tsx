import { useState, useCallback, useEffect } from 'react'
import HomePage from '@/pages/HomePage'
import EncounterPage from '@/pages/EncounterPage'
import GeographyPage from '@/pages/GeographyPage'
import ShareCardPage from '@/pages/ShareCardPage'
import CelebrityEntryPage from '@/pages/CelebrityEntryPage'
import CelebrityChatPage from '@/pages/CelebrityChatPage'
import CelebrityCardPage from '@/pages/CelebrityCardPage'
import CelebrityHistoryPage from '@/pages/CelebrityHistoryPage'
import GuideEntryPage from '@/pages/GuideEntryPage'
import GuideSetupPage from '@/pages/GuideSetupPage'
import GuideQRCodePage from '@/pages/GuideQRCodePage'
import GuideToursPage from '@/pages/GuideToursPage'
import GuideJoinPage from '@/pages/GuideJoinPage'
import GuideTourViewPage from '@/pages/GuideTourViewPage'
import { getUserId } from '@/utils/userId'

export type PageRoute =
  | { page: 'home' }
  | { page: 'encounter'; poiName: string }
  | { page: 'geography' }
  | { page: 'share'; encounterId: number }
  | { page: 'celebrity-entry' }
  | { page: 'celebrity-chat'; encounterId: number; celebrityName: string; opening: string; identity: string; poiName?: string; period?: string }
  | { page: 'celebrity-card'; encounterId: number }
  | { page: 'celebrity-history' }
  // 导游系统路由
  | { page: 'guide-entry' }
  | { page: 'guide-setup'; guideName: string }
  | { page: 'guide-qrcode'; tourId: number; tourCode: string; celebrityName: string; poiName: string; guideName: string }
  | { page: 'guide-tours'; guideName: string }
  | { page: 'guide-join'; initialCode?: string }
  | { page: 'guide-tour-view'; tourCode: string }

// POI 到租户的映射
const POI_TENANT_MAP: Record<string, string> = {
  '惠州西湖': 'tenant_huizhou_gov',
  '罗浮山': 'tenant_huizhou_gov',
  '断桥': 'tenant_hangzhou_gov',
  '西湖苏堤': 'tenant_hangzhou_gov',
}

export default function App() {
  const [route, setRoute] = useState<PageRoute>({ page: 'home' })
  const [tenantId, setTenantId] = useState('tenant_huizhou_gov')
  const [demoMode, setDemoMode] = useState(false)
  const userId = getUserId()

  // P2-12: 演示模式检测
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === '1') {
      setDemoMode(true)
    }
  }, [])

  const handleNavigate = useCallback((newRoute: PageRoute) => {
    if (newRoute.page === 'encounter' && newRoute.poiName) {
      const mappedTenant = POI_TENANT_MAP[newRoute.poiName]
      if (mappedTenant) {
        setTenantId(mappedTenant)
      }
    }
    setRoute(newRoute)
  }, [])

  return (
    <div className={`min-h-screen text-stone-100 ${demoMode ? 'demo-mode' : 'bg-black'}`}>
      {route.page === 'home' && (
        <HomePage tenantId={tenantId} onNavigate={handleNavigate} />
      )}
      {route.page === 'encounter' && (
        <EncounterPage
          tenantId={tenantId}
          userId={userId}
          poiName={route.poiName}
          onNavigate={handleNavigate}
        />
      )}
      {route.page === 'geography' && (
        <GeographyPage
          tenantId={tenantId}
          userId={userId}
          onNavigate={handleNavigate}
        />
      )}
      {route.page === 'share' && (
        <ShareCardPage
          tenantId={tenantId}
          userId={userId}
          encounterId={route.encounterId}
          onNavigate={handleNavigate}
        />
      )}
      {route.page === 'celebrity-entry' && (
        <CelebrityEntryPage userId={userId} onNavigate={handleNavigate} />
      )}
      {route.page === 'celebrity-chat' && (
        <CelebrityChatPage
          encounterId={route.encounterId}
          celebrityName={route.celebrityName}
          opening={route.opening}
          identity={route.identity}
          poiName={route.poiName}
          period={route.period}
          onNavigate={handleNavigate}
        />
      )}
      {route.page === 'celebrity-card' && (
        <CelebrityCardPage encounterId={route.encounterId} onNavigate={handleNavigate} />
      )}
      {route.page === 'celebrity-history' && (
        <CelebrityHistoryPage userId={userId} onNavigate={handleNavigate} />
      )}

      {/* 导游系统页面 */}
      {route.page === 'guide-entry' && (
        <GuideEntryPage onNavigate={handleNavigate} />
      )}
      {route.page === 'guide-setup' && (
        <GuideSetupPage userId={userId} guideName={route.guideName} onNavigate={handleNavigate} />
      )}
      {route.page === 'guide-qrcode' && (
        <GuideQRCodePage
          tourId={route.tourId}
          tourCode={route.tourCode}
          celebrityName={route.celebrityName}
          poiName={route.poiName}
          guideName={route.guideName}
          onNavigate={handleNavigate}
        />
      )}
      {route.page === 'guide-tours' && (
        <GuideToursPage userId={userId} guideName={route.guideName} onNavigate={handleNavigate} />
      )}
      {route.page === 'guide-join' && (
        <GuideJoinPage initialCode={route.initialCode} onNavigate={handleNavigate} />
      )}
      {route.page === 'guide-tour-view' && (
        <GuideTourViewPage userId={userId} tourCode={route.tourCode} onNavigate={handleNavigate} />
      )}
    </div>
  )
}
