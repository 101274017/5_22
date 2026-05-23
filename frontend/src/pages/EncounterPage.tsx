/**
 * 神交页：完整业务闭环
 * 古人降临 -> 出题 -> 作答 -> 赠语+徽章 -> 追问 -> 名片
 */
import { useState, useEffect, useRef } from 'react'
import { PageRoute } from '@/App'
import { summonPoi, answerPoi, chatPoi } from '@/services/encounterEngine'
import { emitTrackingEvent } from '@/utils/tracker'

type Step = 'arriving' | 'summoned' | 'answering' | 'rewarded'

interface AncientData {
  encounter_id: number
  character_name: string
  opening_speech: string
  question: string
}

interface RewardData {
  gift_words: string
  badge_name: string
  badge_icon: string
}

interface ChatItem {
  q: string
  a: string
  ref: string
}

interface Props {
  tenantId: string
  userId: string
  poiName: string
  onNavigate: (route: PageRoute) => void
}

export default function EncounterPage({ tenantId, userId, poiName, onNavigate }: Props) {
  const [step, setStep] = useState<Step>('arriving')
  const [ancientData, setAncientData] = useState<AncientData | null>(null)
  const [rewardData, setRewardData] = useState<RewardData | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatList, setChatList] = useState<ChatItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [chatSending, setChatSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    emitTrackingEvent('view', 'encounter_page', tenantId, { poi: poiName })
    const timer = setTimeout(() => doSummon(), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatList])

  const doSummon = async () => {
    try {
      const enc = await summonPoi(userId, poiName)
      setAncientData({
        encounter_id: enc.id,
        character_name: enc.characterName,
        opening_speech: enc.openingSpeech,
        question: enc.question,
      })
      setStep('summoned')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      emitTrackingEvent('error', 'summon_failed', tenantId, { error: msg })
      alert(msg)
      onNavigate({ page: 'home' })
    }
  }

  const handleSubmitAnswer = async () => {
    if (!ancientData || !userAnswer.trim() || submitting) return
    setSubmitting(true)
    try {
      const data = await answerPoi(ancientData.encounter_id, userAnswer.trim())
      setRewardData({
        gift_words: data.gift_words,
        badge_name: data.badge_name,
        badge_icon: data.badge_icon,
      })
      setStep('rewarded')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChat = async () => {
    if (!ancientData || !chatInput.trim() || chatSending) return
    const question = chatInput.trim()
    setChatInput('')
    setChatSending(true)
    try {
      const data = await chatPoi(ancientData.encounter_id, question)
      setChatList((prev) => [...prev, { q: question, a: data.reply, ref: data.reference }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setChatList((prev) => [...prev, { q: question, a: `[回复失败] ${msg}`, ref: '' }])
    } finally {
      setChatSending(false)
    }
  }

  // 降临动画
  if (step === 'arriving') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-stone-950 to-black px-6">
        <div className="w-20 h-20 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center mb-6 animate-pulse">
          <span className="text-3xl opacity-60">🌫️</span>
        </div>
        <p className="text-sm text-stone-400 tracking-widest animate-pulse">
          时空裂缝正在开启...
        </p>
        <p className="text-[10px] text-stone-600 mt-2">{poiName}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-stone-800/50 px-4 py-3 flex items-center justify-between shrink-0">
        <button onClick={() => onNavigate({ page: 'home' })} className="text-xs text-stone-500">
          ← 返回
        </button>
        <span className="text-xs text-stone-300 tracking-widest">{poiName}</span>
        <div className="w-10" />
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 古人开场白 */}
        {ancientData && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-600 flex items-center justify-center text-base font-bold text-stone-300 shadow-lg shrink-0">
                {ancientData.character_name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-stone-200">{ancientData.character_name}</div>
                <div className="text-[10px] text-stone-500">降临于 {poiName}</div>
              </div>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl rounded-tl-sm p-4 ml-2">
              <p className="text-sm text-stone-300 leading-relaxed italic break-words">
                "{ancientData.opening_speech}"
              </p>
            </div>

            <div className="bg-amber-950/30 border border-amber-900/40 rounded-2xl rounded-tl-sm p-4 ml-2">
              <p className="text-sm text-amber-200/90 leading-relaxed font-medium break-words">
                ❓ {ancientData.question}
              </p>
            </div>
          </div>
        )}

        {/* 用户作答区 */}
        {step === 'summoned' && (
          <div className="space-y-3 pt-2">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="写下你此刻的心声..."
              rows={4}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3.5 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-800 resize-none"
            />
            <button
              onClick={handleSubmitAnswer}
              disabled={!userAnswer.trim() || submitting}
              className="w-full bg-amber-900/50 text-amber-200 py-3 rounded-xl text-sm font-bold border border-amber-800/50 active:scale-95 transition-transform disabled:opacity-40"
            >
              {submitting ? '正在传递...' : '呈递答卷'}
            </button>
          </div>
        )}

        {/* 赠语与徽章 */}
        {step === 'rewarded' && rewardData && (
          <div className="space-y-4 pt-2">
            {/* 用户答案回显 */}
            <div className="bg-stone-800/50 rounded-2xl rounded-tr-sm p-3 mr-2 ml-auto max-w-[85%]">
              <p className="text-xs text-stone-300 leading-relaxed break-words">{userAnswer}</p>
            </div>

            {/* 赠语 */}
            <div className="bg-stone-900/80 border border-amber-900/30 rounded-2xl rounded-tl-sm p-4 ml-2">
              <div className="text-[10px] text-amber-500 font-bold tracking-widest mb-2">故人赠语</div>
              <p className="text-sm text-amber-100/90 leading-relaxed italic break-words">
                "{rewardData.gift_words}"
              </p>
            </div>

            {/* 精神徽章 */}
            <div className="bg-gradient-to-b from-stone-900 to-black border border-amber-600/20 rounded-2xl p-5 text-center space-y-3 mx-4">
              <div className="w-14 h-14 bg-amber-500/5 rounded-full mx-auto flex items-center justify-center border border-amber-500/20">
                <span className="text-2xl">🎑</span>
              </div>
              <div className="text-[10px] text-amber-500/80 tracking-widest font-bold">
                已写入《人生地理志》
              </div>
              <h5 className="font-bold text-stone-200 text-base tracking-wide break-words">
                {rewardData.badge_name}
              </h5>
              <button
                onClick={() => {
                  if (ancientData) {
                    onNavigate({ page: 'share', encounterId: ancientData.encounter_id })
                  }
                }}
                className="mt-2 bg-stone-800 text-stone-300 px-5 py-2 rounded-lg text-xs border border-stone-700 active:scale-95 transition-transform"
              >
                生成精神名片 →
              </button>
            </div>

            {/* 自由追问区 */}
            <div className="border-t border-stone-800 pt-4 space-y-3">
              <div className="text-[11px] text-stone-500 tracking-wider font-bold">
                💬 继续与{ancientData?.character_name}对谈
              </div>

              {chatList.map((chat, i) => (
                <div key={i} className="space-y-2">
                  <div className="bg-stone-800/50 rounded-2xl rounded-tr-sm p-3 mr-2 ml-auto max-w-[80%]">
                    <p className="text-xs text-stone-300 break-words">{chat.q}</p>
                  </div>
                  <div className="bg-stone-900/80 border border-stone-800 rounded-2xl rounded-tl-sm p-3 ml-2 max-w-[85%]">
                    <p className="text-xs text-stone-300 leading-relaxed break-words">{chat.a}</p>
                    {chat.ref && (
                      <span className="text-[9px] text-stone-600 mt-1.5 block break-words">{chat.ref}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* 底部输入栏（追问阶段） */}
      {step === 'rewarded' && (
        <div className="sticky bottom-0 bg-black/90 backdrop-blur-md border-t border-stone-800 px-4 py-3 shrink-0">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
              placeholder="向古人追问..."
              disabled={chatSending}
              className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-stone-500 disabled:opacity-50 min-w-0"
            />
            <button
              onClick={handleChat}
              disabled={!chatInput.trim() || chatSending}
              className="bg-stone-200 text-stone-900 px-4 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-transform disabled:opacity-40 shrink-0"
            >
              {chatSending ? '...' : '发送'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
