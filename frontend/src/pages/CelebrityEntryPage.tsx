/**
 * 名人对话入口页：搜索或选择名人
 */
import { useState } from 'react'
import { PageRoute } from '@/App'
import { celebrityApi } from '@/api/client'

interface Props {
  userId: string
  onNavigate: (route: PageRoute) => void
}

const PRESET_CELEBRITIES = [
  { name: '苏东坡', desc: '北宋文豪，豪放旷达', icon: '📜' },
  { name: '李白', desc: '唐代诗仙，浪漫不羁', icon: '🍷' },
  { name: '乔布斯', desc: 'Apple创始人，改变世界', icon: '🍎' },
  { name: '爱因斯坦', desc: '物理学家，相对论之父', icon: '🧪' },
  { name: '比尔·盖茨', desc: '微软创始人，科技先驱', icon: '💻' },
  { name: '拿破仑', desc: '法兰西皇帝，军事天才', icon: '⚔️' },
  { name: '达·芬奇', desc: '文艺复兴全才', icon: '🎨' },
  { name: '孔子', desc: '至圣先师，儒学创始人', icon: '📖' },
  { name: '特斯拉', desc: '交流电之父，天才发明家', icon: '⚡' },
  { name: '曹操', desc: '三国枭雄，文武双全', icon: '🗡️' },
  { name: '富兰克林', desc: '美国国父之一，博学多才', icon: '🪁' },
  { name: '麦克阿瑟', desc: '五星上将，太平洋战争', icon: '🎖️' },
]

export default function CelebrityEntryPage({ userId, onNavigate }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingName, setLoadingName] = useState('')

  const startChat = async (name: string) => {
    if (loading) return
    setLoading(true)
    setLoadingName(name)

    try {
      const data = await celebrityApi.start(userId, name)
      onNavigate({
        page: 'celebrity-chat',
        encounterId: data.encounter_id,
        celebrityName: data.celebrity_name,
        opening: data.opening,
        identity: data.identity,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`启动对话失败：${msg}`)
    } finally {
      setLoading(false)
      setLoadingName('')
    }
  }

  const handleSearch = () => {
    const name = searchInput.trim()
    if (!name) return
    startChat(name)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black px-5 py-8">
      {/* 加载遮罩 */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 border-2 border-stone-700 border-t-amber-400 rounded-full animate-spin mb-4" />
          <p className="text-sm text-stone-300 text-center">正在研究 {loadingName} 的生平资料...</p>
          <p className="text-xs text-stone-500 mt-2 text-center">AI 正在搜索并构建人物画像</p>
        </div>
      )}

      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => onNavigate({ page: 'home' })} className="text-xs text-stone-500">
          ← 返回
        </button>
        <span className="text-xs text-stone-300 tracking-widest">名人对话</span>
        <div className="w-10" />
      </div>

      {/* 搜索框 */}
      <div className="mb-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入任意名人名字..."
            className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700 min-w-0"
          />
          <button
            onClick={handleSearch}
            disabled={!searchInput.trim() || loading}
            className="bg-amber-800 text-amber-100 px-4 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-40 shrink-0"
          >
            开始
          </button>
        </div>
        <p className="text-[10px] text-stone-600 mt-2 ml-1">
          支持中外名人：马斯克、武则天、莎士比亚...
        </p>
      </div>

      {/* 分隔线 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-stone-800" />
        <span className="text-[10px] text-stone-600">推荐名人</span>
        <div className="flex-1 h-px bg-stone-800" />
      </div>

      {/* 预设名人列表 */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {PRESET_CELEBRITIES.map((celeb) => (
          <button
            key={celeb.name}
            onClick={() => startChat(celeb.name)}
            disabled={loading}
            className="w-full flex items-center gap-3 bg-stone-900/60 border border-stone-800 p-3 rounded-xl active:bg-stone-800 transition disabled:opacity-50"
          >
            <div className="w-9 h-9 bg-stone-800 rounded-full flex items-center justify-center text-base shrink-0">
              {celeb.icon}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-sm text-stone-200 font-bold truncate">{celeb.name}</div>
              <div className="text-[10px] text-stone-500 truncate">{celeb.desc}</div>
            </div>
            <div className="text-stone-600 text-xs shrink-0">→</div>
          </button>
        ))}
      </div>

      {/* 底部 */}
      <div className="mt-5 text-center">
        <button
          onClick={() => onNavigate({ page: 'celebrity-history' })}
          className="text-xs text-amber-500/80 tracking-wider border-b border-amber-500/30 pb-0.5"
        >
          📜 我的对话记录
        </button>
      </div>
    </div>
  )
}
