/**
 * 首页：两大功能入口
 * 1. 此地有古人（地理围栏/扫码 -> 古迹神交）
 * 2. 名人对话（搜索任意名人 -> AI 模拟对话）
 */
import { useState } from 'react'
import { PageRoute } from '@/App'
import { emitTrackingEvent } from '@/utils/tracker'

interface Props {
  tenantId: string
  onNavigate: (route: PageRoute) => void
}

const POI_LIST = [
  { name: '惠州西湖', desc: '苏东坡谪居之地', icon: '🏛️' },
  { name: '断桥', desc: '许仙白娘子相遇处', icon: '🌉' },
  { name: '罗浮山', desc: '苏东坡游历之山', icon: '⛰️' },
  { name: '西湖苏堤', desc: '苏东坡筑堤之处', icon: '🌿' },
]

export default function HomePage({ tenantId, onNavigate }: Props) {
  const [scanning, setScanning] = useState(false)

  const handleScan = () => {
    emitTrackingEvent('click', 'scan_qrcode', tenantId)
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      onNavigate({ page: 'encounter', poiName: '惠州西湖' })
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black px-5 py-8">
      {/* 标题 */}
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold tracking-widest text-stone-100">此地有古人</h1>
        <p className="text-xs text-stone-500 tracking-wider">跨越千年的时空奇遇</p>
      </div>

      {/* 功能区一：名人对话（新功能，突出展示） */}
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

      {/* 功能区：导游讲解 */}
      <div className="mb-6">
        <button
          onClick={() => onNavigate({ page: 'guide-entry' })}
          className="w-full bg-gradient-to-r from-stone-800/80 to-stone-700/40 border border-stone-600/50 p-4 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-stone-700/40 rounded-full flex items-center justify-center text-xl border border-stone-600/30">
              🎙️
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-bold text-stone-100">导游讲解</div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                导游创建讲解团，名人视角带你游古迹
              </div>
            </div>
            <div className="text-stone-500 text-sm">→</div>
          </div>
        </button>
      </div>

      {/* 分隔线 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-stone-800" />
        <span className="text-[10px] text-stone-600">古迹神交</span>
        <div className="flex-1 h-px bg-stone-800" />
      </div>

      {/* 功能区二：扫码/定位 */}
      <div className="space-y-3 mb-5">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="w-full bg-stone-100 text-stone-900 py-3 rounded-xl font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {scanning ? '正在识别时空坐标...' : '📷 扫描古迹二维码'}
        </button>

        <button
          onClick={() => {
            emitTrackingEvent('click', 'geo_locate', tenantId)
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                () => onNavigate({ page: 'encounter', poiName: '惠州西湖' }),
                () => alert('无法获取位置信息，请手动选择古迹')
              )
            } else {
              alert('当前浏览器不支持定位')
            }
          }}
          className="w-full bg-stone-800 text-stone-200 py-3 rounded-xl font-bold text-sm tracking-wide border border-stone-700 active:scale-95 transition-transform"
        >
          📍 使用地理定位寻觅古迹
        </button>
      </div>

      {/* 分隔线 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-stone-800" />
        <span className="text-[10px] text-stone-600">或手动选择</span>
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
        <span className="text-stone-700">|</span>
        <button
          onClick={() => onNavigate({ page: 'guide-join' })}
          className="text-xs text-amber-500/80 tracking-wider border-b border-amber-500/30 pb-0.5"
        >
          🎫 输入讲解团码
        </button>
      </div>
    </div>
  )
}
