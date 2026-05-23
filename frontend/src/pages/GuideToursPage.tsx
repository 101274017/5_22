/**
 * P1-9: 导游端数据看板
 * 从纯列表升级为数据卡片
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
  created_at?: string
  is_expired?: boolean
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

  const activeTours = tours.filter((t) => t.status === 'active' && !t.is_expired)
  const totalParticipants = tours.reduce((sum, t) => sum + t.participant_count, 0)

  const getStatusLabel = (tour: TourItem) => {
    if (tour.is_expired || tour.status === 'expired') return '已过期'
    if (tour.status === 'closed') return '已关闭'
    return '进行中'
  }

  const getStatusStyle = (tour: TourItem) => {
    if (tour.is_expired || tour.status === 'expired') return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/30'
    if (tour.status === 'closed') return 'bg-stone-800 text-stone-500 border border-stone-700'
    return 'bg-green-900/30 text-green-400 border border-green-800/30'
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <PageHeader title="我的讲解团" onBack={() => onNavigate({ page: 'guide-entry' })} />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* P1-9: 数据概览 */}
        {!loading && tours.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-2">
            <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-amber-400">{tours.length}</div>
              <div className="text-[10px] text-stone-500">总讲解团</div>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-400">{activeTours.length}</div>
              <div className="text-[10px] text-stone-500">进行中</div>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-blue-400">{totalParticipants}</div>
              <div className="text-[10px] text-stone-500">总参与人</div>
            </div>
          </div>
        )}

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
                tour.status === 'active' && !tour.is_expired ? 'border-amber-900/30' : 'border-stone-800 opacity-70'
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
                <div className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusStyle(tour)}`}>
                  {getStatusLabel(tour)}
                </div>
              </div>

              {/* P1-9: 数据卡片 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-stone-800/50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-stone-200">👥 {tour.participant_count}</div>
                  <div className="text-[9px] text-stone-500">参与人数</div>
                </div>
                <div className="bg-stone-800/50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-stone-200 font-mono">{tour.tour_code}</div>
                  <div className="text-[9px] text-stone-500">团码</div>
                </div>
                <div className="bg-stone-800/50 rounded-lg p-2 text-center">
                  <div className="text-[11px] font-bold text-stone-300">{tour.created_at || '-'}</div>
                  <div className="text-[9px] text-stone-500">创建时间</div>
                </div>
              </div>

              {tour.status === 'active' && !tour.is_expired && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onNavigate({
                      page: 'guide-qrcode',
                      tourId: tour.id,
                      tourCode: tour.tour_code,
                      celebrityName: tour.celebrity_name,
                      poiName: tour.poi_name,
                      guideName,
                    })}
                    className="flex-1 text-[11px] text-amber-400 border border-amber-800/40 px-3 py-2 rounded-lg text-center"
                  >
                    📱 二维码
                  </button>
                  <button
                    onClick={() => handleClose(tour.id)}
                    className="text-[11px] text-red-400 border border-red-800/40 px-3 py-2 rounded-lg"
                  >
                    关闭
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
