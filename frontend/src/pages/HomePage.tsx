/**
 * 首页
 * P2-10: 角色分流（我是游客 / 我是导游）
 */
import { PageRoute } from '@/types/routes'
import { emitTrackingEvent } from '@/utils/tracker'
import { POI_COORDS } from '@/data/poiCoords'

interface Props {
  tenantId: string
  userMode?: 'tourist' | 'guide'
  onNavigate: (route: PageRoute) => void
}

const POI_LIST = POI_COORDS.slice(0, 4)

export default function HomePage({ tenantId, userMode = 'tourist', onNavigate }: Props) {
  const isGuide = userMode === 'guide'

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black px-5 py-8">
      {/* 标题 */}
      <div className="text-center space-y-2 mb-6 relative">
        <h1 className="text-2xl font-bold tracking-widest text-stone-100">此地有古人</h1>
        <p className="text-xs text-stone-500 tracking-wider">跨越千年的时空奇遇</p>
        <button
          onClick={() => onNavigate({ page: 'settings' })}
          aria-label="服务器设置"
          className="absolute right-0 top-0 w-9 h-9 flex items-center justify-center rounded-full bg-stone-900/60 border border-stone-800 text-stone-400 active:bg-stone-800"
        >
          ⚙️
        </button>
      </div>

      {/* P2-10: 双大入口 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => onNavigate({ page: 'celebrity-entry' })}
          className="bg-gradient-to-b from-amber-900/50 to-amber-950/30 border border-amber-700/40 p-4 rounded-2xl active:scale-[0.97] transition-transform text-center space-y-2"
        >
          <div className="w-12 h-12 bg-amber-900/40 rounded-full mx-auto flex items-center justify-center text-xl border border-amber-600/30">
            🎭
          </div>
          <div className="text-sm font-bold text-amber-100">我是游客</div>
          <div className="text-[10px] text-amber-300/60">名人对话 · 古迹神交</div>
        </button>

        <button
          onClick={() => isGuide && onNavigate({ page: 'guide-entry' })}
          disabled={!isGuide}
          aria-disabled={!isGuide}
          className={
            isGuide
              ? 'bg-gradient-to-b from-amber-900/60 to-amber-950/40 border-2 border-amber-500/70 p-4 rounded-2xl active:scale-[0.97] transition-transform text-center space-y-2 shadow-lg shadow-amber-900/40 ring-2 ring-amber-500/30'
              : 'bg-gradient-to-b from-stone-800/40 to-stone-900/30 border border-stone-700/40 p-4 rounded-2xl text-center space-y-2 opacity-50 cursor-not-allowed'
          }
        >
          <div
            className={
              isGuide
                ? 'w-12 h-12 bg-amber-900/50 rounded-full mx-auto flex items-center justify-center text-xl border border-amber-400/50'
                : 'w-12 h-12 bg-stone-700/30 rounded-full mx-auto flex items-center justify-center text-xl border border-stone-600/30 grayscale'
            }
          >
            🎙️
          </div>
          <div className={isGuide ? 'text-sm font-bold text-amber-100' : 'text-sm font-bold text-stone-500'}>
            我是导游
          </div>
          <div className={isGuide ? 'text-[10px] text-amber-300/80' : 'text-[10px] text-stone-600'}>
            {isGuide ? '创建讲解团 · 管理' : '仅导游模式可用'}
          </div>
        </button>
      </div>

      {/* 名人对话入口（突出） */}
      <div className="mb-4">
        <button
          onClick={() => onNavigate({ page: 'celebrity-entry' })}
          className="w-full bg-gradient-to-r from-amber-900/60 to-amber-800/40 border border-amber-700/50 p-4 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-900/40 rounded-full flex items-center justify-center text-xl border border-amber-600/30">
              💬
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-amber-100">名人对话</div>
              <div className="text-[11px] text-amber-300/70 mt-0.5">
                与古今中外任意名人跨时空交流
              </div>
            </div>
            <div className="text-amber-400/60 text-sm">→</div>
          </div>
        </button>
      </div>

      {/* 分隔线 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-stone-800" />
        <span className="text-[10px] text-stone-600">古迹神交</span>
        <div className="flex-1 h-px bg-stone-800" />
      </div>

      {/* 输入团码 */}
      <div className="mb-4">
        <button
          onClick={() => onNavigate({ page: 'guide-join' })}
          className="w-full bg-stone-800 text-stone-200 py-3 rounded-xl font-bold text-sm border border-stone-700 active:scale-95 transition-transform"
        >
          🎫 输入团码加入讲解团
        </button>
      </div>

      {/* 分隔线 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-stone-800" />
        <span className="text-[10px] text-stone-600">手动选择古迹</span>
        <div className="flex-1 h-px bg-stone-800" />
      </div>

      {/* 古迹列表 */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {POI_LIST.map((poi) => (
          <button
            key={poi.name}
            onClick={() => {
              emitTrackingEvent('click', 'manual_select_poi', tenantId, { poi: poi.name })
              onNavigate({ page: 'encounter', poiName: poi.name })
            }}
            className="w-full flex items-center gap-3 bg-stone-900/60 border border-stone-800 p-3 rounded-xl active:bg-stone-800 transition"
          >
            <div className="w-9 h-9 bg-stone-800 rounded-full flex items-center justify-center text-base shrink-0">
              {poi.icon}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-sm text-stone-200 font-bold">{poi.name}</div>
              <div className="text-[10px] text-stone-500">{poi.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* 底部导航 */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          onClick={() => onNavigate({ page: 'geography' })}
          className="text-xs text-amber-500/80 tracking-wider border-b border-amber-500/30 pb-0.5"
        >
          📜 我的人生地理志
        </button>
      </div>
    </div>
  )
}
