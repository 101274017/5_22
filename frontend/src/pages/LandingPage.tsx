/**
 * 落地页（应用启动入口）
 * - 第一部分：产品名称展示
 * - 第二/三部分：游客模式 / 导游模式 两个入口按键
 *
 * 选择导游模式后，首页的"我是导游"入口会高亮且可点击；
 * 选择游客模式后，"我是导游"入口为禁用、置灰状态，不可点击。
 */
import { PageRoute } from '@/types/routes'

export type UserMode = 'tourist' | 'guide'

interface Props {
  onEnter: (mode: UserMode) => void
  onNavigate?: (route: PageRoute) => void
}

export default function LandingPage({ onEnter, onNavigate: _onNavigate }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black px-6 py-10">
      {/* 第一部分：产品名称展示 */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-[11px] text-stone-500 tracking-[0.4em] mb-3">A N C I E N T &nbsp; E N C O U N T E R</p>
        <h1 className="text-4xl font-bold tracking-[0.3em] text-stone-100 mb-3">此地有古人</h1>
        <div className="w-16 h-px bg-amber-700/60 my-3" />
        <p className="text-sm text-stone-400 tracking-[0.2em] italic">跨越千年的时空奇遇</p>
        <p className="text-xs text-stone-600 tracking-wider mt-2">古迹 · 名人 · 对话</p>
      </div>

      {/* 第二/第三部分：模式选择 */}
      <div className="space-y-4 mt-8">
        <p className="text-center text-[11px] text-stone-500 tracking-widest mb-2">— 请选择身份进入 —</p>

        {/* 游客模式 */}
        <button
          onClick={() => onEnter('tourist')}
          className="w-full bg-gradient-to-r from-amber-900/60 to-amber-800/40 border border-amber-700/50 py-5 rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-amber-900/20"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">🎭</span>
            <div className="text-left">
              <div className="text-base font-bold text-amber-100 tracking-wider">游客模式</div>
              <div className="text-[11px] text-amber-300/70 mt-0.5">古迹神交，与名人跨时空对话</div>
            </div>
          </div>
        </button>

        {/* 导游模式 */}
        <button
          onClick={() => onEnter('guide')}
          className="w-full bg-gradient-to-r from-stone-800/80 to-stone-900/60 border border-stone-600/50 py-5 rounded-2xl active:scale-[0.98] transition-transform shadow-lg"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">🎙️</span>
            <div className="text-left">
              <div className="text-base font-bold text-stone-100 tracking-wider">导游模式</div>
              <div className="text-[11px] text-stone-400 mt-0.5">创建讲解团，带领游客同游</div>
            </div>
          </div>
        </button>
      </div>

      {/* 底部说明 */}
      <p className="text-center text-[10px] text-stone-600 mt-6 tracking-wider">
        进入后可在主页随时切换功能
      </p>
    </div>
  )
}
