/**
 * 导游讲解团码展示页：展示讲解团码供游客输入加入
 */
import { useState } from 'react'
import { PageRoute } from '@/types/routes'
import PageHeader from '@/components/PageHeader'

interface Props {
  tenantId: string
  tourId: number
  tourCode: string
  celebrityName: string
  poiName: string
  guideName: string
  onNavigate: (route: PageRoute) => void
}

export default function GuideQRCodePage({
  tenantId: _tenantId,
  tourCode,
  celebrityName,
  poiName,
  guideName,
  onNavigate,
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(tourCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const input = document.createElement('input')
      input.value = tourCode
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleShare = async () => {
    const shareText = `🎙️ ${guideName}导游邀请您加入讲解团\n\n📍 ${poiName}\n👤 ${celebrityName} 为您讲解\n\n讲解团码：${tourCode}\n\n打开「此地有古人」App，输入讲解团码即可加入。`

    if (navigator.share) {
      try {
        await navigator.share({ title: '导游讲解团邀请', text: shareText })
      } catch {
        // 用户取消分享
      }
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('分享内容已复制到剪贴板')
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <PageHeader title="讲解团码" onBack={() => onNavigate({ page: 'guide-entry' })} />

      <div className="flex-1 px-5 py-6 flex flex-col items-center space-y-6">
        {/* 成功提示 */}
        <div className="text-center space-y-1">
          <div className="text-2xl mb-2">✅</div>
          <h2 className="text-base font-bold text-stone-100">讲解团创建成功</h2>
          <p className="text-xs text-stone-500">让游客输入下方讲解团码加入</p>
        </div>

        {/* 团码卡片 */}
        <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-3xl p-6 shadow-2xl space-y-4 w-full max-w-[300px]">
          <div className="text-center">
            <div className="text-xs text-stone-600 font-bold tracking-wider">此地有古人 · 导游讲解</div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-sm font-bold text-stone-800">{celebrityName} × {poiName}</div>
            <div className="text-xs text-stone-600">导游：{guideName}</div>
          </div>

          {/* 讲解团码 */}
          <div className="bg-white/80 rounded-xl p-3 text-center">
            <div className="text-[10px] text-stone-500 mb-1">讲解团码</div>
            <div className="text-xl font-mono font-bold text-stone-800 tracking-[0.3em]">{tourCode}</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="w-full max-w-[300px] space-y-3">
          <button
            onClick={handleCopyCode}
            className="w-full bg-stone-800 text-stone-200 py-3 rounded-xl text-sm font-bold border border-stone-700 active:scale-95 transition-transform"
          >
            {copied ? '✓ 已复制' : '📋 复制讲解团码'}
          </button>

          <button
            onClick={handleShare}
            className="w-full bg-amber-800 text-amber-100 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          >
            📤 分享给游客
          </button>

          <button
            onClick={() => onNavigate({ page: 'guide-entry' })}
            className="w-full text-xs text-stone-500 py-2"
          >
            返回导游中心
          </button>
        </div>
      </div>
    </div>
  )
}
