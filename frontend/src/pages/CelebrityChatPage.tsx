/**
 * 名人对话页
 * - 用户发送至少2条消息后显示"生成名片"按钮
 */
import { useState, useEffect, useRef } from 'react'
import { PageRoute } from '@/App'
import { celebrityApi } from '@/api/client'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  encounterId: number
  celebrityName: string
  opening: string
  identity: string
  onNavigate: (route: PageRoute) => void
}

export default function CelebrityChatPage({
  encounterId,
  celebrityName,
  opening,
  identity,
  onNavigate,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: opening },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [userMessageCount, setUserMessageCount] = useState(0)
  const [generatingCard, setGeneratingCard] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || sending) return

    setInput('')
    setSending(true)
    setMessages((prev) => [...prev, { role: 'user', content: msg }])

    try {
      const data = await celebrityApi.chat(encounterId, msg)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      setUserMessageCount(data.message_count)
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
      await celebrityApi.generateCard(encounterId)
      onNavigate({ page: 'celebrity-card', encounterId })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      alert(`名片生成失败：${errMsg}`)
    } finally {
      setGeneratingCard(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-stone-800/50 px-4 py-3 flex items-center justify-between shrink-0">
        <button onClick={() => onNavigate({ page: 'celebrity-entry' })} className="text-xs text-stone-500">
          ← 返回
        </button>
        <div className="text-center min-w-0 px-2">
          <div className="text-sm text-stone-200 font-bold truncate">{celebrityName}</div>
          <div className="text-[10px] text-stone-500 truncate">{identity}</div>
        </div>
        <div className="w-10 shrink-0" />
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-600 flex items-center justify-center text-xs font-bold text-stone-300 shrink-0 mt-1">
                  {celebrityName[0]}
                </div>
                <div className="bg-stone-900/80 border border-stone-800 rounded-2xl rounded-tl-sm p-3 min-w-0">
                  <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap break-words">
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

        {/* 正在输入指示器 */}
        {sending && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-600 flex items-center justify-center text-xs font-bold text-stone-300 shrink-0">
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

      {/* 生成名片按钮（用户发送至少2条消息后显示） */}
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

      {/* 底部输入栏 */}
      <div className="sticky bottom-0 bg-black/90 backdrop-blur-md border-t border-stone-800 px-4 py-3 shrink-0">
        <div className="flex gap-2 items-center">
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
        {userMessageCount < 2 && userMessageCount > 0 && (
          <p className="text-[10px] text-stone-600 mt-1.5 text-center">
            再聊 {2 - userMessageCount} 轮即可生成精神名片
          </p>
        )}
      </div>
    </div>
  )
}
