/**
 * 导游入口页：导游身份确认 + 功能入口
 */
import { useState } from 'react'
import { PageRoute } from '@/App'
import PageHeader from '@/components/PageHeader'

interface Props {
  onNavigate: (route: PageRoute) => void
}

export default function GuideEntryPage({ onNavigate }: Props) {
  const [guideName, setGuideName] = useState(() => {
    return localStorage.getItem('guide_name') || ''
  })
  const [inputName, setInputName] = useState(guideName)
  const [confirmed, setConfirmed] = useState(!!guideName)

  const handleConfirm = () => {
    const name = inputName.trim()
    if (!name) return
    localStorage.setItem('guide_name', name)
    setGuideName(name)
    setConfirmed(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <PageHeader title="导游中心" onBack={() => onNavigate({ page: 'home' })} />

      <div className="flex-1 px-5 py-6 space-y-6">
        {/* 导游身份确认 */}
        {!confirmed ? (
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 bg-amber-900/30 rounded-full mx-auto flex items-center justify-center border border-amber-700/40">
                <span className="text-3xl">🎙️</span>
              </div>
              <h2 className="text-lg font-bold text-stone-100">导游身份确认</h2>
              <p className="text-xs text-stone-500">请输入您的姓名以开始使用导游功能</p>
            </div>

            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder="请输入您的姓名..."
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700"
            />

            <button
              onClick={handleConfirm}
              disabled={!inputName.trim()}
              className="w-full bg-amber-800 text-amber-100 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-40"
            >
              确认身份
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 导游信息 */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-900/30 rounded-full flex items-center justify-center border border-amber-700/40">
                <span className="text-xl">🎙️</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-stone-200">{guideName}</div>
                <div className="text-[10px] text-stone-500">导游身份已确认</div>
              </div>
              <button
                onClick={() => {
                  setConfirmed(false)
                  setInputName(guideName)
                }}
                className="text-[10px] text-stone-500 border border-stone-700 px-2 py-1 rounded"
              >
                修改
              </button>
            </div>

            {/* 创建讲解团 */}
            <button
              onClick={() => onNavigate({ page: 'guide-setup', guideName })}
              className="w-full bg-gradient-to-r from-amber-900/60 to-amber-800/40 border border-amber-700/50 p-4 rounded-2xl active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-900/40 rounded-full flex items-center justify-center text-xl border border-amber-600/30">
                  ➕
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-bold text-amber-100">创建讲解团</div>
                  <div className="text-[11px] text-amber-300/70 mt-0.5">
                    设定名人、古迹，生成二维码邀请游客
                  </div>
                </div>
                <div className="text-amber-400/60 text-sm">→</div>
              </div>
            </button>

            {/* 我的讲解团 */}
            <button
              onClick={() => onNavigate({ page: 'guide-tours', guideName })}
              className="w-full bg-stone-900/60 border border-stone-800 p-4 rounded-2xl active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center text-xl border border-stone-700">
                  📋
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-bold text-stone-200">我的讲解团</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    查看已创建的讲解团和二维码
                  </div>
                </div>
                <div className="text-stone-600 text-sm">→</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
