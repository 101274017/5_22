/**
 * 名人对话记录页
 */
import { useState, useEffect } from 'react'
import { PageRoute } from '@/App'
import { celebrityApi } from '@/api/client'

interface Record {
  id: number
  character_name: string
  identity: string
  gift_words: string | null
  badge_name: string | null
  status: string
}

interface Props {
  userId: string
  onNavigate: (route: PageRoute) => void
}

export default function CelebrityHistoryPage({ userId, onNavigate }: Props) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const data = await celebrityApi.getList(userId)
      setRecords(data)
    } catch {
      // 静默处理
    } finally {
      setLoading(false)
    }
  }

  const completedRecords = records.filter((r) => r.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-stone-800/50 px-4 py-3 flex items-center justify-between">
        <button onClick={() => onNavigate({ page: 'celebrity-entry' })} className="text-xs text-stone-500">
          ← 返回
        </button>
        <span className="text-xs text-stone-300 tracking-widest">对话记录</span>
        <div className="w-10" />
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-amber-400">{records.length}</div>
          <div className="text-xs text-stone-500 tracking-wider">次跨时空对话</div>
        </div>

        {completedRecords.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] text-stone-500 tracking-widest font-bold">精神徽章</h3>
            <div className="flex flex-wrap gap-2">
              {completedRecords.map((r) => (
                <div key={r.id} className="bg-stone-900 border border-amber-900/30 rounded-lg px-3 py-2 text-center max-w-[140px]">
                  <div className="text-base mb-0.5">✨</div>
                  <div className="text-[10px] text-amber-300 font-bold truncate">{r.badge_name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-stone-700 border-t-stone-300 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500">加载中...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-3xl opacity-40">💬</div>
            <p className="text-sm text-stone-500">暂无对话记录</p>
            <p className="text-xs text-stone-600">选择一位名人，开始跨时空对话</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-[11px] text-stone-500 tracking-widest font-bold">对话列表</h3>
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
                      <div className="text-[10px] text-stone-500 truncate">{record.identity}</div>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full shrink-0 ${
                    record.status === 'completed'
                      ? 'bg-amber-900/30 text-amber-400'
                      : 'bg-stone-800 text-stone-500'
                  }`}>
                    {record.status === 'completed' ? '已生成名片' : '对话中'}
                  </span>
                </div>

                {record.gift_words && (
                  <p className="text-[11px] text-stone-400 italic leading-relaxed pl-9 break-words">
                    "{record.gift_words}"
                  </p>
                )}

                {record.status === 'completed' && (
                  <button
                    onClick={() => onNavigate({ page: 'celebrity-card', encounterId: record.id })}
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
