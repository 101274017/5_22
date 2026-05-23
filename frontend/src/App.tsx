import { useState, useCallback, useEffect, useRef } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { PageRoute, POI_TENANT_MAP, UserMode } from '@/types/routes'
import LandingPage from '@/pages/LandingPage'
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
import SettingsPage from '@/pages/SettingsPage'
import { getUserId } from '@/utils/userId'

export { type PageRoute, type UserMode }

export default function App() {
  const [history, setHistory] = useState<PageRoute[]>([{ page: 'landing' }])
  const route = history[history.length - 1]

  const [tenantId, setTenantId] = useState('tenant_huizhou_gov')
  const [demoMode, setDemoMode] = useState(false)
  const [userMode, setUserMode] = useState<UserMode>('tourist')
  const userId = getUserId()
  const exitHintAt = useRef(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === '1') {
      setDemoMode(true)
    }
  }, [])

  const goBack = useCallback((): boolean => {
    let consumed = false
    setHistory((prev) => {
      if (prev.length <= 1) return prev
      consumed = true
      return prev.slice(0, -1)
    })
    return consumed
  }, [])

  const handleNavigate = useCallback((newRoute: PageRoute) => {
    if (newRoute.page === 'encounter' && newRoute.poiName) {
      const mappedTenant = POI_TENANT_MAP[newRoute.poiName]
      if (mappedTenant) {
        setTenantId(mappedTenant)
      }
    }
    setHistory((prev) => {
      const top = prev[prev.length - 1]
      if (top && JSON.stringify(top) === JSON.stringify(newRoute)) return prev
      if (newRoute.page === 'home') return [newRoute]
      return [...prev, newRoute]
    })
  }, [])

  const handleEnterFromLanding = useCallback((mode: UserMode) => {
    setUserMode(mode)
    setHistory([{ page: 'home' }])
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      const onPop = () => {
        const consumed = goBack()
        if (!consumed) {
          window.history.pushState(null, '', window.location.href)
        }
      }
      window.history.pushState(null, '', window.location.href)
      window.addEventListener('popstate', onPop)
      return () => window.removeEventListener('popstate', onPop)
    }

    let cleanup: (() => void) | undefined
    CapacitorApp.addListener('backButton', () => {
      const consumed = goBack()
      if (!consumed) {
        const now = Date.now()
        if (now - exitHintAt.current < 2000) {
          CapacitorApp.exitApp()
        } else {
          exitHintAt.current = now
          const el = document.createElement('div')
          el.textContent = '再次返回退出应用'
          el.style.cssText =
            'position:fixed;left:50%;bottom:8%;transform:translateX(-50%);' +
            'background:rgba(0,0,0,0.85);color:#f5f0e8;padding:10px 18px;' +
            'border-radius:9999px;font-size:13px;z-index:99999;pointer-events:none;'
          document.body.appendChild(el)
          setTimeout(() => el.remove(), 1500)
        }
      }
    }).then((handle) => {
      cleanup = () => handle.remove()
    })
    return () => {
      cleanup?.()
    }
  }, [goBack])

  return (
    <div className={`min-h-screen text-stone-100 ${demoMode ? 'demo-mode' : 'bg-black'}`}>
      {route.page === 'landing' && (
        <LandingPage onEnter={handleEnterFromLanding} onNavigate={handleNavigate} />
      )}
      {route.page === 'home' && (
        <HomePage tenantId={tenantId} userMode={userMode} onNavigate={handleNavigate} />
      )}
      {route.page === 'encounter' && (
        <EncounterPage tenantId={tenantId} userId={userId} poiName={route.poiName} onNavigate={handleNavigate} />
      )}
      {route.page === 'geography' && (
        <GeographyPage tenantId={tenantId} userId={userId} onNavigate={handleNavigate} />
      )}
      {route.page === 'share' && (
        <ShareCardPage tenantId={tenantId} userId={userId} encounterId={route.encounterId} onNavigate={handleNavigate} />
      )}
      {route.page === 'celebrity-entry' && (
        <CelebrityEntryPage tenantId={tenantId} userId={userId} onNavigate={handleNavigate} />
      )}
      {route.page === 'celebrity-chat' && (
        <CelebrityChatPage
          tenantId={tenantId}
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
        <CelebrityCardPage tenantId={tenantId} encounterId={route.encounterId} onNavigate={handleNavigate} />
      )}
      {route.page === 'celebrity-history' && (
        <CelebrityHistoryPage tenantId={tenantId} userId={userId} onNavigate={handleNavigate} />
      )}
      {route.page === 'guide-entry' && (
        <GuideEntryPage tenantId={tenantId} onNavigate={handleNavigate} />
      )}
      {route.page === 'guide-setup' && (
        <GuideSetupPage tenantId={tenantId} userId={userId} guideName={route.guideName} onNavigate={handleNavigate} />
      )}
      {route.page === 'guide-qrcode' && (
        <GuideQRCodePage
          tenantId={tenantId}
          tourId={route.tourId}
          tourCode={route.tourCode}
          celebrityName={route.celebrityName}
          poiName={route.poiName}
          guideName={route.guideName}
          onNavigate={handleNavigate}
        />
      )}
      {route.page === 'guide-tours' && (
        <GuideToursPage tenantId={tenantId} userId={userId} guideName={route.guideName} onNavigate={handleNavigate} />
      )}
      {route.page === 'guide-join' && (
        <GuideJoinPage tenantId={tenantId} initialCode={route.initialCode} onNavigate={handleNavigate} />
      )}
      {route.page === 'guide-tour-view' && (
        <GuideTourViewPage tenantId={tenantId} userId={userId} tourCode={route.tourCode} onNavigate={handleNavigate} />
      )}
      {route.page === 'settings' && (
        <SettingsPage onBack={() => goBack()} onNavigate={handleNavigate} />
      )}
    </div>
  )
}
