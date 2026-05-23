/**
 * P1-6: 游客扫码落地页（仪式感）
 * 游客扫码/输入团码后，先进入此页，再进入聊天
 */
import { PageRoute } from '@/App'

interface Props {
  tourInfo: {
    tour_id: number
    guide_name: string
    celebrity_name: string
    celebrity_age?: string
    poi_name: string
    description?: string
  }
  onStart: () => void
  onNavigate: (route: PageRoute) => void
}

export default function GuideLandingPage({ tourInfo, onStart, onNavigate }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black items-center justify-center px-6">
      {/* 古迹名称 */}
      <div className="text-center mb-8">
        <p className="text-xs text-stone-500 tracking-[0.3em] mb-2">📍 名胜古迹</p>
        <h1 className="text-2xl font-bold text-stone-100 tracking-wider">{tourInfo.poi_name}</h1>
      </div>

      {/* 名人画像 */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 bg-amber-900/30 rounded-full flex items-center justify-center border-2 border-amber-700/50 shadow-lg shadow-amber-900/20 mb-4">
          <span className="text-4xl font-bold text-amber-200">{tourInfo.celebrity_name[0]}</span>
        </div>
        <h2 className="text-lg font-bold text-amber-100">{tourInfo.celebrity_name}</h2>
        {tourInfo.celebrity_age && (
          <span className="text-xs text-amber-400/70 mt-1 bg-amber-900/20 px-3 py-1 rounded-full border border-amber-800/30">
            {tourInfo.celebrity_age}
          </span>
        )}
      </div>

      {/* 文案 */}
      <div className="text-center mb-10 space-y-2">
        <p className="text-sm text-stone-300 italic tracking-wider">跨越千年的时空奇遇</p>
        {tourInfo.description && (
          <p className="text-xs text-stone-500">{tourInfo.description}</p>
        )}
        <p className="text-[10px] text-stone-600 mt-3">导游：{tourInfo.guide_name}</p>
      </div>

      {/* 开始对话按钮 */}
      <button
        onClick={onStart}
        className="w-full max-w-[280px] bg-amber-800 text-amber-100 py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform shadow-lg shadow-amber-900/30"
      >
        开始对话
      </button>

      <button
        onClick={() => onNavigate({ page: 'home' })}
        className="mt-4 text-xs text-stone-600"
      >
        返回首页
      </button>
    </div>
  )
}
