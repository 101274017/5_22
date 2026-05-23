/**
 * 名人对话页
 * P1-5: 右上角双模式切换（古人对话 ↔ AI导游）
 * P1-8: 语音输入入口
 * P2-11: 聊天页沉浸式增强（历史背景浮层）
 */
import { useState, useEffect, useRef } from 'react'
import { PageRoute } from '@/types/routes'
import { sendCelebrityMessage, generateCelebrityCard } from '@/services/celebrityEngine'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface Props {
  tenantId: string
  encounterId: number
  celebrityName: string
  opening: string
  identity: string
  poiName?: string
  period?: string
  onNavigate: (route: PageRoute) => void
}

export default function CelebrityChatPage({
  tenantId: _tenantId,
  encounterId,
  celebrityName,
  opening,
  identity,
  poiName: _poiName,
  period,
  onNavigate,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: opening },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [generatingCard, setGeneratingCard] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      const reply = await sendCelebrityMessage(encounterId, msg)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `[回复失败] ${errMsg}` },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleGenerateCard = async () => {
    if (generatingCard) return
    setGeneratingCard(true)
    try {
      await generateCelebrityCard(encounterId)
      onNavigate({ page: 'celebrity-card', encounterId })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      alert(`名片生成失败：${errMsg}`)
    } finally {
      setGeneratingCard(false)
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
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
          <div className="w-8" />
        </div>
      </div>

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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 bg-stone-800 border border-stone-600 text-stone-300">
                    {celebrityName[0]}
                  </div>
                  <div className="rounded-2xl rounded-tl-sm p-3 min-w-0 bg-stone-900/80 border border-stone-800">
                    <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-stone-800 border border-stone-600 text-stone-300">
              {celebrityName[0]}
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

      {messages.filter((m) => m.role === 'user').length >= 2 && (
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
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={`对 ${celebrityName} 说点什么...`}
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
        {(() => {
          const userCount = messages.filter((m) => m.role === 'user').length
          return userCount < 2 && userCount > 0 ? (
            <p className="text-[10px] text-stone-600 mt-1.5 text-center">
              再聊 {2 - userCount} 轮即可生成精神名片
            </p>
          ) : null
        })()}
      </div>
    </div>
  )
}
