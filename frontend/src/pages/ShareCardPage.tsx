/**
 * 精神名片分享页（古迹神交）
 */
import { useState, useEffect } from 'react'
import { PageRoute } from '@/App'
import { encounterApi } from '@/api/client'

interface Props {
  tenantId: string
  userId: string
  encounterId: number
  onNavigate: (route: PageRoute) => void
}

export default function ShareCardPage({ tenantId, userId, encounterId, onNavigate }: Props) {
  const [detail, setDetail] = useState<{
    character_name: string
    poi_name: string
    gift_words: string
    badge_name: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    loadDetail()
  }, [])

  const loadDetail = async () => {
    try {
      const data = await encounterApi.getEncounterDetail(tenantId, userId, encounterId)
      setDetail(data)
    } catch {
      // 静默处理
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (!detail) return
    const text = `【此地有古人】我在${detail.poi_name}与${detail.character_name}缔结了千年之约。\n"${detail.gift_words}"\n——${detail.badge_name}`

    if (navigator.share) {
      navigator.share({
        title: `我在${detail.poi_name}与${detail.character_name}缔结了千年之约`,
        text,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-stone-700 border-t-stone-300 rounded-full animate-spin" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6">
        <p className="text-sm text-stone-500">未找到此段缘分记录</p>
        <button onClick={() => onNavigate({ page: 'home' })} className="mt-4 text-xs text-amber-500">
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 to-black flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between shrink-0">
        <button onClick={() => onNavigate({ page: 'home' })} className="text-xs text-stone-500">
          ← 返回
        </button>
        <span className="text-xs text-stone-400 tracking-widest">精神名片</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm bg-gradient-to-b from-stone-900 via-stone-950 to-black border border-stone-700/50 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="text-center">
            <div className="text-[10px] text-stone-600 tracking-[0.3em]">此地有古人 · 精神名片</div>
          </div>

          <div className="flex items-center gap-3 bg-stone-900/50 rounded-xl p-3 border border-stone-800">
            <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center text-lg font-bold text-stone-300 border border-stone-600 shrink-0">
              {detail.character_name[0]}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-stone-200 truncate">{detail.character_name}</div>
              <div className="text-[10px] text-stone-500 truncate">{detail.poi_name}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] text-amber-500/80 tracking-widest font-bold">赠语</div>
            <p className="text-sm text-amber-100/80 leading-relaxed italic break-words">
              "{detail.gift_words}"
            </p>
          </div>

          <div className="text-center py-3 border-t border-stone-800">
            <div className="text-2xl mb-1">🎑</div>
            <div className="text-sm font-bold text-stone-200 break-words">{detail.badge_name}</div>
            <div className="text-[9px] text-stone-600 mt-1">永久记入《人生地理志》</div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-3 shrink-0">
        <button
          onClick={handleShare}
          className="w-full bg-stone-100 text-stone-900 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform"
        >
          {shared ? '✓ 已复制到剪贴板' : '分享精神名片'}
        </button>
        <button
          onClick={() => onNavigate({ page: 'geography' })}
          className="w-full text-xs text-stone-500 py-2"
        >
          查看人生地理志 →
        </button>
      </div>
    </div>
  )
}
