/**
 * 名人对话页
 * P1-5: 右上角双模式切换（古人对话 ↔ AI导游）
 * P1-8: 语音输入入口
 * P2-11: 聊天页沉浸式增强（历史背景浮层）
 */
import { useState, useEffect, useRef } from 'react'
import { PageRoute } from '@/App'
import { celebrityApi } from '@/api/client'

type ChatMode = 'character' | 'guide'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  mode?: ChatMode
}

interface Props {
  encounterId: number
  celebrityName: string
  opening: string
  identity: string
  poiName?: string
  period?: string
  onNavigate: (route: PageRoute) => void
}

// P2-11: 历史背景时间轴数据
const HISTORY_TIMELINE: Record<string, string[]> = {
  '苏东坡': [
    '1037年 出生于眉州眉山',
    '1057年 与弟苏辙同登进士',
    '1079年 乌台诗案入狱',
    '1080年 贬居黄州，号东坡居士',
    '1094年 再贬惠州',
  ],
  '李白': [
    '701年 出生于碎叶城',
    '725年 仗剑去国，辞亲远游',
    '742年 奉诏入京，供奉翰林',
    '755年 安史之乱爆发',
    '762年 病逝于当涂',
  ],
  '杜甫': [
    '712年 出生于巩县',
    '735年 游历吴越齐赵',
    '755年 安史之乱，携家逃难',
    '759年 入蜀，建草堂',
    '770年 病逝于耒阳',
  ],
}

export default function CelebrityChatPage({
  encounterId,
  celebrityName,
  opening,
  identity,
  poiName,
  period,
  onNavigate,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: opening, mode: 'character' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [userMessageCount, setUserMessageCount] = useState(0)
  const [generatingCard, setGeneratingCard] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('character')
  const [showTimeline, setShowTimeline] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 检测语音识别支持
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

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || sending) return

    setInput('')
    setSending(true)
    setMessages((prev) => [...prev, { role: 'user', content: msg }])

    try {
      const data = await celebrityApi.chat(encounterId, msg)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, mode: chatMode }])
      setUserMessageCount(data.message_count)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `[回复失败] ${errMsg}`, mode: chatMode },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleGenerateCard = async () => {
    if (generatingCard) return
    setGeneratingCard(true)
    try {
      await celebrityApi.generateCard(encounterId)
      onNavigate({ page: 'celebrity-card', encounterId })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      alert(`名片生成失败：${errMsg}`)
    } finally {
      setGeneratingCard(false)
    }
  }

  const handleModeSwitch = (mode: ChatMode) => {
    if (mode === chatMode) return
    setChatMode(mode)
    // 追加系统消息（仅前端展示）
    const modeLabel = mode === 'character' ? '古人对话模式' : '导游模式'
    setMessages((prev) => [...prev, { role: 'system', content: `已切换至${modeLabel}` }])
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

  const timeline = HISTORY_TIMELINE[celebrityName]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      {/* 顶部栏 + P1-5 模式切换 */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-stone-800/50 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <button onClick={() => onNavigate({ page: 'celebrity-entry' })} className="text-xs text-stone-500">
            ← 返回
          </button>
          <div className="text-center min-w-0 px-2">
            <div className="text-sm text-stone-200 font-bold truncate">{celebrityName}</div>
            <div className="text-[10px] text-stone-500 truncate">
              {identity}
              {period && ` · ${period}`}
            </div>
          </div>
          {/* P2-11: 历史背景按钮 */}
          {timeline && (
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="text-base"
              title="历史背景"
            >
              📜
            </button>
          )}
          {!timeline && <div className="w-8" />}
        </div>

        {/* P1-5: 模式切换控件 */}
        <div className="flex mt-2 bg-stone-900/80 rounded-lg p-0.5 border border-stone-800">
          <button
            onClick={() => handleModeSwitch('character')}
            className={`flex-1 text-[11px] py-1.5 rounded-md font-bold transition ${
              chatMode === 'character'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50'
                : 'text-stone-500'
            }`}
          >
            🎭 古人对话
          </button>
          <button
            onClick={() => handleModeSwitch('guide')}
            className={`flex-1 text-[11px] py-1.5 rounded-md font-bold transition ${
              chatMode === 'guide'
                ? 'bg-blue-900/60 text-blue-200 border border-blue-700/50'
                : 'text-stone-500'
            }`}
          >
            🎤 AI导游
          </button>
        </div>
      </div>

      {/* P2-11: 历史背景浮层 */}
      {showTimeline && timeline && (
        <div className="bg-stone-900/90 border-b border-stone-800 px-4 py-3 space-y-1.5 animate-fade-in">
          <div className="text-[10px] text-amber-500 font-bold tracking-wider mb-1">📜 历史背景</div>
          {timeline.map((event, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 shrink-0" />
              <p className="text-[11px] text-stone-400">{event}</p>
            </div>
          ))}
        </div>
      )}

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'system' ? (
              <div className="text-center py-2">
                <span className="text-[10px] text-stone-600 bg-stone-900/50 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            ) : msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-amber-900/30 border border-amber-800/40 rounded-2xl rounded-tr-sm p-3 max-w-[80%] min-w-0">
                  <p className="text-sm text-amber-100/90 leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  {/* P1-5: 视觉区分 */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${
                    msg.mode === 'guide'
                      ? 'bg-blue-900/40 border border-blue-700/40 text-blue-200'
                      : 'bg-stone-800 border border-stone-600 text-stone-300'
                  }`}>
                    {msg.mode === 'guide' ? '🎤' : celebrityName[0]}
                  </div>
                  <div className={`rounded-2xl rounded-tl-sm p-3 min-w-0 ${
                    msg.mode === 'guide'
                      ? 'bg-blue-950/40 border border-blue-800/30 border-dashed'
                      : 'bg-stone-900/80 border border-stone-800'
                  }`}>
                    <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 正在输入指示器 */}
        {sending && (
          <div className="flex gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              chatMode === 'guide'
                ? 'bg-blue-900/40 border border-blue-700/40 text-blue-200'
                : 'bg-stone-800 border border-stone-600 text-stone-300'
            }`}>
              {chatMode === 'guide' ? '🎤' : celebrityName[0]}
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

      {/* 生成名片按钮 */}
      {userMessageCount >= 2 && (
        <div className="px-4 py-2 border-t border-stone-800/50 shrink-0">
          <button
            onClick={handleGenerateCard}
            disabled={generatingCard}
            className="w-full bg-gradient-to-r from-amber-900/50 to-amber-800/50 text-amber-200 py-2.5 rounded-xl text-xs font-bold border border-amber-700/50 active:scale-95 transition-transform disabled:opacity-50"
          >
            {generatingCard ? '正在生成名片...' : `✨ 生成 ${celebrityName} 的精神名片`}
          </button>
        </div>
      )}

      {/* 底部输入栏 + P1-8 语音输入 */}
      <div className="sticky bottom-0 bg-black/90 backdrop-blur-md border-t border-stone-800 px-4 py-3 shrink-0">
        <div className="flex gap-2 items-center">
          {/* P1-8: 语音按钮 */}
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
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={chatMode === 'guide' ? `向AI导游提问${poiName ? `关于${poiName}的问题` : '...'}` : `对 ${celebrityName} 说点什么...`}
            disabled={sending}
            className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-stone-500 disabled:opacity-50 min-w-0"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="bg-stone-200 text-stone-900 px-4 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-transform disabled:opacity-40 shrink-0"
          >
            发送
          </button>
        </div>
        {userMessageCount < 2 && userMessageCount > 0 && (
          <p className="text-[10px] text-stone-600 mt-1.5 text-center">
            再聊 {2 - userMessageCount} 轮即可生成精神名片
          </p>
        )}
      </div>
    </div>
  )
}
