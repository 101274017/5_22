/**
 * 设置页：在手机上修改后端 API 地址
 * 解决 APK 打包后无法连后端（IP 变化、换 WiFi）的问题
 */
import { useState } from 'react'
import { PageRoute } from '@/types/routes'
import PageHeader from '@/components/PageHeader'
import { getApiBaseUrl, setApiBaseUrl } from '@/utils/apiConfig'

interface Props {
  onNavigate: (route: PageRoute) => void
  onBack: () => void
}

export default function SettingsPage({ onBack }: Props) {
  const [url, setUrl] = useState(getApiBaseUrl())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleSave = () => {
    setApiBaseUrl(url)
    setTestResult('✓ 已保存')
  }

  const handleTest = async () => {
    if (testing) return
    setTesting(true)
    setTestResult(null)
    const target = (url.trim() || getApiBaseUrl()).replace(/\/+$/, '')
    if (!target) {
      setTestResult('✗ 请先输入服务器地址')
      setTesting(false)
      return
    }
    try {
      setApiBaseUrl(url)
      const res = await fetch(`${target}/health`, { method: 'GET' })
      if (res.ok) {
        setTestResult('✓ 连接成功！可以正常使用了')
      } else {
        setTestResult(`✗ 服务器返回 ${res.status} ${res.statusText}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setTestResult(`✗ 连接失败：${msg}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <PageHeader title="服务器设置" onBack={onBack} />

      <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto">
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 space-y-1.5">
          <p className="text-xs text-amber-200 font-bold">📡 为什么需要配置服务器地址？</p>
          <p className="text-[11px] text-amber-100/80 leading-relaxed">
            本 App 的 AI 对话、数据存储都运行在电脑上。手机需要知道电脑的局域网地址才能通信。
            只要手机和电脑在同一网络（同 WiFi / 电脑连手机热点），即可连通。
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-stone-400 font-bold tracking-wider">服务器地址</label>
          <input
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://192.168.x.x:8000"
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700 font-mono"
          />
          <p className="text-[10px] text-stone-500">
            格式：http:// + 电脑局域网IP + :8000
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 bg-stone-800 text-stone-100 py-3 rounded-xl font-bold text-sm border border-stone-700 active:scale-95 transition-transform disabled:opacity-50"
          >
            {testing ? '测试中...' : '🔌 测试连接'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-amber-800 text-amber-50 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            💾 保存
          </button>
        </div>

        {testResult && (
          <div
            className={`rounded-xl p-3 text-xs whitespace-pre-line ${
              testResult.startsWith('✓')
                ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-200'
                : 'bg-red-950/40 border border-red-800/40 text-red-200'
            }`}
          >
            {testResult}
          </div>
        )}

        <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-3 space-y-2">
          <p className="text-xs text-stone-300 font-bold">💡 如何获取电脑 IP 地址</p>
          <ol className="text-[11px] text-stone-400 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>确保<strong className="text-stone-300">电脑和手机在同一网络</strong>（连同一个 WiFi，或电脑连手机热点）</li>
            <li>在电脑上按 <span className="font-mono text-stone-300">Win + R</span>，输入 <span className="font-mono text-stone-300">cmd</span> 回车</li>
            <li>输入 <span className="font-mono text-stone-300">ipconfig</span> 回车</li>
            <li>找到「无线局域网适配器 WLAN」下的 <strong className="text-stone-300">IPv4 地址</strong>（如 192.168.1.100）</li>
            <li>把上面的地址填进来，端口固定为 <span className="font-mono text-stone-300">8000</span></li>
          </ol>
        </div>

        <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-3 space-y-1.5">
          <p className="text-xs text-stone-300 font-bold">📶 两种联网方式</p>
          <div className="text-[11px] text-stone-400 space-y-1 leading-relaxed">
            <p><strong className="text-stone-300">方式 A（推荐）：</strong>电脑和手机连同一个 WiFi，App 填写电脑的 WiFi IP。</p>
            <p><strong className="text-stone-300">方式 B：</strong>手机开热点，电脑连手机热点，App 填写电脑在热点中的 IP（通常是 192.168.43.x）。</p>
          </div>
        </div>

        <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-3 space-y-1.5">
          <p className="text-xs text-stone-300 font-bold">🔥 防火墙提示</p>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            如果测试连接失败，请检查电脑防火墙是否允许 Python/uvicorn 通过。Windows 首次运行时通常会弹出防火墙授权窗口，请点击「允许访问」。
          </p>
        </div>
      </div>
    </div>
  )
}
