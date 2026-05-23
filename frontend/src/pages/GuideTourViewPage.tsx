/**
 * 游客讲解团体验页
 * P1-6: 扫码落地页（仪式感）
 * P1-8: 语音输入
 */
import { useState, useEffect, useRef } from 'react'
import { PageRoute } from '@/types/routes'
import { getLocalTourByCode, generateNarration } from '@/services/guideEngine'
import PageHeader from '@/components/PageHeader'
import GuideLandingPage from '@/pages/GuideLandingPage'

interface ChatMessage {
  role: 'narration' | 'user'
  content: string
}

interface Props {
  tenantId: string
  userId: string
  tourCode: string
  onNavigate: (route: PageRoute) => void
}

export default function GuideTourViewPage({ tenantId: _tenantId, userId: _userId, tourCode, onNavigate }: Props) {
  const [tourInfo, setTourInfo] = useState<{
    tour_id: number
    guide_name: string
    celebrity_name: string
    celebrity_age?: string
    poi_name: string
    description?: string
  } | null>(null)
  const [showLanding, setShowLanding] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [narrating, setNarrating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    joinTour()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 语音识别初始化
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      const recognition = new SpeechRecognition()
      recognition.lang = 'zh-CN'
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput((prev) => prev + transcript)
        setIsRecording(false)
      }
      recognition.onerror = () => setIsRecording(false)
      recognition.onend = () => setIsRecording(false)
      recognitionRef.current = recognition
    }
  }, [])

  const joinTour = () => {
    try {
      const tour = getLocalTourByCode(tourCode)
      if (!tour) {
        alert('讲解团不存在或已关闭')
        onNavigate({ page: 'home' })
        return
      }
      setTourInfo({
        tour_id: tour.id,
        guide_name: tour.guideName,
        celebrity_name: tour.celebrityName,
        celebrity_age: tour.celebrityAge,
        poi_name: tour.poiName,
        description: tour.description,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`加入讲解团失败：${msg}`)
      onNavigate({ page: 'home' })
    } finally {
      setLoading(false)
    }
  }

  const startNarration = async () => {
    if (!tourInfo) return
    setShowLanding(false)
    setNarrating(true)
    try {
      const text = await generateNarration(
        tourInfo.celebrity_name,
        tourInfo.poi_name,
        tourInfo.celebrity_age
      )
      setMessages([{ role: 'narration', content: text }])
    } catch (err: unknown) {
      console.error('讲解启动失败:', err)
      setMessages([{ role: 'narration', content: '名人正在赶来的路上，请稍后再试...' }])
    } finally {
      setNarrating(false)
    }
  }

  const handleAsk = async () => {
    const msg = input.trim()
    if (!msg || sending || !tourInfo) return

    setInput('')
    setSending(true)
    setMessages((prev) => [...prev, { role: 'user', content: msg }])

    try {
      const history = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
      const text = await generateNarration(
        tourInfo.celebrity_name,
        tourInfo.poi_name,
        tourInfo.celebrity_age,
        msg,
        history
      )
      setMessages((prev) => [...prev, { role: 'narration', content: text }])
    } catch (err: unknown) {
      console.error('追问失败:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'narration', content: '名人正在思考，请稍后再试...' },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleVoiceStart = () => {
    if (!recognitionRef.current) return
    setIsRecording(true)
    recognitionRef.current.start()
  }

  const handleVoiceStop = () => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setIsRecording(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-stone-950 to-black px-6">
        <div className="w-16 h-16 border-2 border-stone-700 border-t-amber-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-stone-400">正在加入讲解团...</p>
      </div>
    )
  }

  if (!tourInfo) return null

  // P1-6: 落地页
  if (showLanding) {
    return (
      <GuideLandingPage
        tourInfo={tourInfo}
        onStart={startNarration}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <PageHeader
        title={`${tourInfo.celebrity_name} 讲解`}
        subtitle={`📍 ${tourInfo.poi_name} · 导游：${tourInfo.guide_name}`}
        onBack={() => onNavigate({ page: 'home' })}
      />

      {/* 讲解信息卡 */}
      <div className="px-4 py-3 border-b border-stone-800/50">
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-900/30 rounded-full flex items-center justify-center text-lg border border-amber-700/30 shrink-0">
            🎙️
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-amber-200 font-bold">
              {tourInfo.celebrity_name}
              {tourInfo.celebrity_age && (
                <span className="text-amber-400/60 font-normal">（{tourInfo.celebrity_age}）</span>
              )}
              {' '}正在为您讲解
            </div>
            {tourInfo.description && (
              <div className="text-[10px] text-stone-500 mt-0.5 truncate">{tourInfo.description}</div>
            )}
          </div>
        </div>
      </div>

      {/* 讲解内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {narrating && messages.length === 0 && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-900/30 border border-amber-700/30 flex items-center justify-center text-xs shrink-0">
              {tourInfo.celebrity_name[0]}
            </div>
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl rounded-tl-sm p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'narration' && (
              <div className="flex gap-2 max-w-[88%]">
                <div className="w-8 h-8 rounded-full bg-amber-900/30 border border-amber-700/30 flex items-center justify-center text-xs font-bold text-amber-200 shrink-0 mt-1">
                  {tourInfo.celebrity_name[0]}
                </div>
                <div className="bg-stone-900/80 border border-stone-800 rounded-2xl rounded-tl-sm p-3.5 min-w-0">
                  <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap break-words font-serif">
                    {msg.content}
                  </p>
                </div>
              </div>
            )}
            {msg.role === 'user' && (
              <div className="bg-amber-900/30 border border-amber-800/40 rounded-2xl rounded-tr-sm p-3 max-w-[80%] min-w-0">
                <p className="text-sm text-amber-100/90 leading-relaxed break-words">{msg.content}</p>
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-900/30 border border-amber-700/30 flex items-center justify-center text-xs shrink-0">
              {tourInfo.celebrity_name[0]}
            </div>
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl rounded-tl-sm p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 底部追问栏 + P1-8 语音 */}
      <div className="sticky bottom-0 bg-black/90 backdrop-blur-md border-t border-stone-800 px-4 py-3 shrink-0">
        <div className="flex gap-2 items-center">
          {speechSupported && (
            <button
              onMouseDown={handleVoiceStart}
              onMouseUp={handleVoiceStop}
              onTouchStart={handleVoiceStart}
              onTouchEnd={handleVoiceStop}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition ${
                isRecording
                  ? 'bg-red-600 animate-pulse shadow-lg shadow-red-600/30'
                  : 'bg-stone-800 border border-stone-700'
              }`}
            >
              <span className="text-sm">{isRecording ? '🔴' : '🎙️'}</span>
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAsk()}
            placeholder={`向 ${tourInfo.celebrity_name} 提问...`}
            disabled={sending}
            className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-stone-500 disabled:opacity-50 min-w-0"
          />
          <button
            onClick={handleAsk}
            disabled={!input.trim() || sending}
            className="bg-stone-200 text-stone-900 px-4 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-transform disabled:opacity-40 shrink-0"
          >
            提问
          </button>
        </div>
        <p className="text-[10px] text-stone-600 mt-1.5 text-center">
          可以向{tourInfo.celebrity_name}追问关于{tourInfo.poi_name}的任何问题
        </p>
      </div>
    </div>
  )
}
