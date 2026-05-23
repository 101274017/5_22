/**
 * 人生地理志页面
 * 展示用户所有的神交记录与精神徽章
 */
import { useState, useEffect } from 'react'
import { PageRoute } from '@/types/routes'
import { listPoiEncounters } from '@/services/localStore'

interface EncounterRecord {
  id: number
  character_name: string
  poi_name: string
  question: string
  user_answer: string | null
  gift_words: string | null
  badge_name: string | null
  status: string
}

interface Props {
  tenantId: string
  userId: string
  onNavigate: (route: PageRoute) => void
}

export default function GeographyPage({ tenantId: _tenantId, userId, onNavigate }: Props) {
  const [records, setRecords] = useState<EncounterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = () => {
    setError(null)
    try {
      const data = listPoiEncounters(userId)
      setRecords(
        data.map((e) => ({
          id: e.id,
          character_name: e.characterName,
          poi_name: e.poiName,
          question: e.question,
          user_answer: e.userAnswer,
          gift_words: e.giftWords,
          badge_name: e.badgeName,
          status: e.status,
        }))
      )
    } catch (err: unknown) {
      console.error('加载神交记录失败:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(`加载失败：${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const completedRecords = records.filter((r) => r.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-stone-800/50 px-4 py-3 flex items-center justify-between">
        <button onClick={() => onNavigate({ page: 'home' })} className="text-xs text-stone-500">
          ← 返回
        </button>
        <span className="text-xs text-stone-300 tracking-widest">人生地理志</span>
        <div className="w-10" />
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-amber-400">{completedRecords.length}</div>
          <div className="text-xs text-stone-500 tracking-wider">段跨越千年的缘分</div>
        </div>

        {completedRecords.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] text-stone-500 tracking-widest font-bold">精神徽章</h3>
            <div className="flex flex-wrap gap-2">
              {completedRecords.map((r) => (
                <div key={r.id} className="bg-stone-900 border border-amber-900/30 rounded-lg px-3 py-2 text-center max-w-[140px]">
                  <div className="text-base mb-0.5">🎑</div>
                  <div className="text-[10px] text-amber-300 font-bold truncate">{r.badge_name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 text-center space-y-2">
            <p className="text-xs text-red-300">{error}</p>
            <button onClick={loadRecords} className="text-xs text-amber-400 border border-amber-700/50 px-3 py-1.5 rounded-lg">
              重试
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-stone-700 border-t-stone-300 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500">正在翻阅古卷...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-3xl opacity-40">📜</div>
            <p className="text-sm text-stone-500">尚无神交记录</p>
            <p className="text-xs text-stone-600">前往古迹，开启你的第一段时空奇遇</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-[11px] text-stone-500 tracking-widest font-bold">神交记录</h3>
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-stone-900/60 border border-stone-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 bg-stone-800 rounded-full flex items-center justify-center text-xs font-bold text-stone-300 shrink-0">
                      {record.character_name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-200 truncate">{record.character_name}</div>
                      <div className="text-[10px] text-stone-500 truncate">{record.poi_name}</div>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full shrink-0 ${
                    record.status === 'completed'
                      ? 'bg-amber-900/30 text-amber-400'
                      : 'bg-stone-800 text-stone-500'
                  }`}>
                    {record.status === 'completed' ? '已缔结' : '未完成'}
                  </span>
                </div>

                {record.gift_words && (
                  <p className="text-[11px] text-stone-400 italic leading-relaxed pl-9 break-words">
                    "{record.gift_words}"
                  </p>
                )}

                {record.status === 'completed' && (
                  <button
                    onClick={() => onNavigate({ page: 'share', encounterId: record.id })}
                    className="ml-9 text-[10px] text-amber-500/80 border-b border-amber-500/30"
                  >
                    查看精神名片
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
