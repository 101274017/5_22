/**
 * 导游的讲解团列表页
 */
import { useState, useEffect } from 'react'
import { PageRoute } from '@/App'
import { guideApi } from '@/api/client'
import PageHeader from '@/components/PageHeader'

interface TourItem {
  id: number
  celebrity_name: string
  celebrity_age?: string
  poi_name: string
  tour_code: string
  status: string
  participant_count: number
  description?: string
}

interface Props {
  userId: string
  guideName: string
  onNavigate: (route: PageRoute) => void
}

export default function GuideToursPage({ userId, guideName, onNavigate }: Props) {
  const [tours, setTours] = useState<TourItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTours()
  }, [])

  const loadTours = async () => {
    try {
      const data = await guideApi.getMyTours(userId)
      setTours(data)
    } catch {
      // 静默处理
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async (tourId: number) => {
    if (!confirm('确定要关闭这个讲解团吗？关闭后游客将无法加入。')) return
    try {
      await guideApi.closeTour(tourId, userId)
      setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, status: 'closed' } : t)))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`关闭失败：${msg}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <PageHeader title="我的讲解团" onBack={() => onNavigate({ page: 'guide-entry' })} />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-stone-700 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500">加载中...</p>
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="text-3xl">📋</div>
            <p className="text-sm text-stone-500">暂无讲解团</p>
            <button
              onClick={() => onNavigate({ page: 'guide-setup', guideName })}
              className="text-xs text-amber-500 border-b border-amber-500/30"
            >
              去创建一个 →
            </button>
          </div>
        ) : (
          tours.map((tour) => (
            <div
              key={tour.id}
              className={`bg-stone-900/60 border rounded-2xl p-4 space-y-3 ${
                tour.status === 'active' ? 'border-amber-900/30' : 'border-stone-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-200">{tour.celebrity_name}</span>
                    {tour.celebrity_age && (
                      <span className="text-[10px] text-stone-500">({tour.celebrity_age})</span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400">📍 {tour.poi_name}</div>
                  {tour.description && (
                    <div className="text-[10px] text-stone-500 truncate">{tour.description}</div>
                  )}
                </div>
                <div className={`text-[10px] px-2 py-0.5 rounded-full ${
                  tour.status === 'active'
                    ? 'bg-green-900/30 text-green-400 border border-green-800/30'
                    : 'bg-stone-800 text-stone-500 border border-stone-700'
                }`}>
                  {tour.status === 'active' ? '进行中' : '已关闭'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-stone-500">
                    团码：<span className="font-mono text-stone-300">{tour.tour_code}</span>
                  </span>
                  <span className="text-[10px] text-stone-500">
                    👥 {tour.participant_count} 人
                  </span>
                </div>

                {tour.status === 'active' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate({
                        page: 'guide-qrcode',
                        tourId: tour.id,
                        tourCode: tour.tour_code,
                        celebrityName: tour.celebrity_name,
                        poiName: tour.poi_name,
                        guideName,
                      })}
                      className="text-[10px] text-amber-400 border border-amber-800/40 px-2 py-1 rounded-lg"
                    >
                      二维码
                    </button>
                    <button
                      onClick={() => handleClose(tour.id)}
                      className="text-[10px] text-red-400 border border-red-800/40 px-2 py-1 rounded-lg"
                    >
                      关闭
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
