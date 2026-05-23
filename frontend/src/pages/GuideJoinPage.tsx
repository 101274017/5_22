/**
 * 游客输入讲解团码加入页
 */
import { useState } from 'react'
import { PageRoute } from '@/types/routes'
import PageHeader from '@/components/PageHeader'

interface Props {
  tenantId: string
  onNavigate: (route: PageRoute) => void
  initialCode?: string
}

export default function GuideJoinPage({ tenantId: _tenantId, onNavigate, initialCode = '' }: Props) {
  const [code, setCode] = useState(initialCode)

  const handleJoin = () => {
    const tourCode = code.trim().toUpperCase()
    if (!tourCode) return
    onNavigate({ page: 'guide-tour-view', tourCode })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <PageHeader title="加入讲解团" onBack={() => onNavigate({ page: 'home' })} />

      <div className="flex-1 px-5 py-8 flex flex-col items-center space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-900/30 rounded-full mx-auto flex items-center justify-center border border-amber-700/40">
            <span className="text-3xl">🎫</span>
          </div>
          <h2 className="text-base font-bold text-stone-100">输入讲解团码</h2>
          <p className="text-xs text-stone-500">请输入导游提供的6位讲解团码</p>
        </div>

        <div className="w-full max-w-[280px] space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="输入6位团码"
            maxLength={6}
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-4 text-center text-xl font-mono font-bold text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700 tracking-[0.3em] uppercase"
          />

          <button
            onClick={handleJoin}
            disabled={code.trim().length < 4}
            className="w-full bg-amber-800 text-amber-100 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-40"
          >
            加入讲解团
          </button>
        </div>
      </div>
    </div>
  )
}
