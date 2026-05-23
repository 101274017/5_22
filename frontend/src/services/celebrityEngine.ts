/**
 * 名人对话引擎
 * 整合知识库 + Web 搜索 + MiMo AI，完全本地运行
 */
import { chatCompletion } from './aiClient'
import { searchCelebrityInfo } from './webSearch'
import {
  createCelebrityEncounter,
  getCelebrityEncounter,
  updateCelebrityEncounter,
  type CelebrityEncounter,
} from './localStore'
import { getCharacterKnowledge } from './knowledgeBase'

function buildSystemPrompt(name: string, period?: string): string {
  const k = getCharacterKnowledge(name)
  if (k) {
    const locCtx = k.locationContext
      ? Object.entries(k.locationContext)
          .map(([loc, ctx]) => `【${loc}】${ctx.years}：${ctx.reason}\n${ctx.events.map((e) => '· ' + e).join('\n')}`)
          .join('\n\n')
      : ''

    return `你是${k.dynasty}历史人物${k.fullName}，字${k.courtesyName}，号${k.artName}。
生卒：${k.birthYear}-${k.deathYear}，籍贯：${k.birthPlace}。
性格：${k.personality.join('；')}。
生平大事：${k.lifeEvents.join('；')}。
代表作品：${k.majorWorks.join('；')}。
人生哲学：${k.philosophy.join('；')}。
遭遇的挑战：${k.challenges.join('；')}。
语言风格：${k.speakingStyle}。
${period ? `当前时期：${period}。` : ''}
${locCtx ? `地点相关经历：\n${locCtx}` : ''}

要求：
1. 始终以第一人称"我"回应，完全代入角色。
2. 回答要体现你的性格、人生经历和时代背景。
3. 可适当引用自己的诗词或名言。
4. 对于超出你时代认知的事物，以古人的视角想象或谦逊表示不知。
5. 回答控制在 150 字以内，语气自然如对话。`
  }

  // 未知名人：返回通用提示，由 AI 自行扮演
  return `你是历史/文化名人"${name}"${period ? `（${period}）` : ''}。请以第一人称与用户进行跨时空对话，体现你的性格、成就和时代背景。回答控制在 150 字以内。`
}

export async function startCelebrityChat(
  userId: string,
  name: string,
  period?: string
): Promise<{ encounter: CelebrityEncounter; opening: string }> {
  // 并行：构建提示 + 搜索网络信息
  const [systemPrompt, searchCtx] = await Promise.all([
    Promise.resolve(buildSystemPrompt(name, period)),
    searchCelebrityInfo(name),
  ])

  const fullPrompt = searchCtx ? `${systemPrompt}\n\n${searchCtx}` : systemPrompt

  const opening = await chatCompletion(
    [
      { role: 'system', content: fullPrompt },
      { role: 'user', content: '请用一句简短的开场白向这位来自千年后的访客打招呼，体现你的身份和性格（30-60字）。' },
    ],
    { temperature: 0.8 }
  )

  const identity = period ? `${name} · ${period}` : name

  const encounter = createCelebrityEncounter({
    userId,
    characterName: name,
    identity,
    period,
    messages: [{ role: 'assistant', content: opening }],
    giftWords: null,
    badgeName: null,
    status: 'chatting',
  })

  return { encounter, opening }
}

export async function sendCelebrityMessage(
  encounterId: number,
  message: string
): Promise<string> {
  const enc = getCelebrityEncounter(encounterId)
  if (!enc) throw new Error('对话记录不存在')

  const k = getCharacterKnowledge(enc.characterName)
  const systemPrompt = buildSystemPrompt(enc.characterName, enc.period)
  const searchCtx = k ? '' : await searchCelebrityInfo(enc.characterName)

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: searchCtx ? `${systemPrompt}\n\n${searchCtx}` : systemPrompt },
    ...enc.messages,
    { role: 'user', content: message },
  ]

  const reply = await chatCompletion(messages, { temperature: 0.7 })

  updateCelebrityEncounter(encounterId, {
    messages: [...enc.messages, { role: 'user', content: message }, { role: 'assistant', content: reply }],
  })

  return reply
}

function parseAiJson(raw: string): unknown {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first === -1 || last === -1 || first >= last) return null
  try {
    return JSON.parse(cleaned.slice(first, last + 1))
  } catch {
    return null
  }
}

function isValidCardResult(obj: unknown): obj is { gift_words: string; badge_name: string } {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  return typeof o.gift_words === 'string' && o.gift_words.length > 0 && typeof o.badge_name === 'string' && o.badge_name.length > 0
}

export async function generateCelebrityCard(encounterId: number): Promise<{ giftWords: string; badgeName: string }> {
  const enc = getCelebrityEncounter(encounterId)
  if (!enc) throw new Error('对话记录不存在')

  const systemPrompt = `你是一位擅长提炼精神内核的文人。基于以下对话记录，为用户生成一段"赠语"和一个"精神徽章"。
要求：
1. 赠语：30-60字，富有诗意，体现用户与${enc.characterName}对话中的精神共鸣。
2. 精神徽章：一个4-8字的称号，如"豁达行者"、"千古知音"。
3. 只返回纯 JSON，不要 markdown 代码块，不要任何解释：{"gift_words":"...","badge_name":"..."}`

  const summary = enc.messages.map((m) => `${m.role === 'user' ? '用户' : enc.characterName}：${m.content}`).join('\n')

  let raw = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `对话记录：\n${summary}\n\n请生成 JSON 格式的赠语和精神徽章。` },
    ],
    { temperature: 0.9 }
  )

  let result = parseAiJson(raw)

  if (!isValidCardResult(result)) {
    raw = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `对话记录：\n${summary}\n\n请严格只返回这个JSON格式（不要markdown，不要解释）：{"gift_words":"30-60字赠语","badge_name":"4-8字称号"}` },
      ],
      { temperature: 0.5 }
    )
    result = parseAiJson(raw)
  }

  if (!isValidCardResult(result)) {
    result = {
      gift_words: `与${enc.characterName}的跨时空对话，留下了难忘的精神印记。`,
      badge_name: '千古知音',
    }
  }

  const final = result as { gift_words: string; badge_name: string }

  updateCelebrityEncounter(encounterId, {
    giftWords: final.gift_words,
    badgeName: final.badge_name,
    status: 'completed',
  })

  return { giftWords: final.gift_words, badgeName: final.badge_name }
}

export function getCelebrityDetail(encounterId: number) {
  const enc = getCelebrityEncounter(encounterId)
  if (!enc) return null
  return {
    character_name: enc.characterName,
    identity: enc.identity,
    gift_words: enc.giftWords || '',
    badge_name: enc.badgeName || '',
  }
}
