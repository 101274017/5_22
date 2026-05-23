/**
 * 古迹神交引擎（POI Encounter）
 * 整合知识库 + MiMo AI，完全本地运行
 */
import { chatCompletion } from './aiClient'
import {
  createPoiEncounter,
  getPoiEncounter,
  updatePoiEncounter,
  type PoiEncounter,
} from './localStore'
import { getPoiConfig, getCharacterKnowledge } from './knowledgeBase'

interface GenericPoiConfig {
  poiName: string
  characterName: string
  openingSpeech: string
  question: string
  systemPrompt: string
}

async function generateGenericPoiConfig(poiName: string): Promise<GenericPoiConfig> {
  const prompt = `你是一位中国历史与文化专家。请为古迹「${poiName}」创作一段沉浸式跨时空对话体验。

要求：
1. characterName：选择一位与该古迹最相关的真实历史人物（或文学人物），给出常用名。
2. openingSpeech：30-60字的第一人称开场白，体现人物身份、性格和与该古迹的关联。
3. question：一个15-30字的开放式问题，引发用户思考。
4. systemPrompt：描述该人物的朝代、性格、语言风格、与该古迹的关系，80-150字，用于指导AI扮演该角色。

只返回纯 JSON，不要 markdown 代码块，不要解释：
{"characterName":"...","openingSpeech":"...","question":"...","systemPrompt":"..."}`

  const raw = await chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.7, maxTokens: 600 })
  const parsed = parseAiJson(raw)

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    typeof (parsed as Record<string, unknown>).characterName === 'string' &&
    typeof (parsed as Record<string, unknown>).openingSpeech === 'string' &&
    typeof (parsed as Record<string, unknown>).question === 'string' &&
    typeof (parsed as Record<string, unknown>).systemPrompt === 'string'
  ) {
    return {
      poiName,
      characterName: (parsed as Record<string, unknown>).characterName as string,
      openingSpeech: (parsed as Record<string, unknown>).openingSpeech as string,
      question: (parsed as Record<string, unknown>).question as string,
      systemPrompt: (parsed as Record<string, unknown>).systemPrompt as string,
    }
  }

  return {
    poiName,
    characterName: '古人',
    openingSpeech: `此处便是${poiName}，千年后竟还有后生来寻我，倒也有趣。`,
    question: '你今日来到此地，心中可有想要探寻的往事？',
    systemPrompt: `你是一位与${poiName}相关的历史人物。请完全代入角色，用第一人称与访客对话，体现你的时代背景和人生经历。`,
  }
}

export async function summonPoi(userId: string, poiName: string): Promise<PoiEncounter> {
  const cfg = getPoiConfig(poiName)

  if (cfg) {
    return createPoiEncounter({
      userId,
      poiName: cfg.poiName,
      characterName: cfg.characterName,
      openingSpeech: cfg.openingSpeech,
      question: cfg.question,
      userAnswer: null,
      giftWords: null,
      badgeName: null,
      badgeIcon: null,
      status: 'summoned',
      chatHistory: [],
    })
  }

  const generic = await generateGenericPoiConfig(poiName)
  return createPoiEncounter({
    userId,
    poiName: generic.poiName,
    characterName: generic.characterName,
    openingSpeech: generic.openingSpeech,
    question: generic.question,
    userAnswer: null,
    giftWords: null,
    badgeName: null,
    badgeIcon: null,
    status: 'summoned',
    chatHistory: [],
    systemPrompt: generic.systemPrompt,
  })
}

function buildPoiSystemPrompt(enc: PoiEncounter): string {
  if (enc.systemPrompt) {
    return `${enc.systemPrompt}你此刻正站在${enc.poiName}，与一位来自千年后的访客对话。请完全代入角色，用第一人称回应。`
  }

  const k = getCharacterKnowledge(enc.characterName)
  const base = k
    ? `你是${k.dynasty}的${k.fullName}，字${k.courtesyName}，号${k.artName}。性格：${k.personality.join('；')}。语言风格：${k.speakingStyle}。`
    : `你是${enc.characterName}。`

  return `${base}你此刻正站在${enc.poiName}，与一位来自千年后的访客对话。请完全代入角色，用第一人称回应。`
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

function isValidAnswerResult(obj: unknown): obj is { response: string; gift_words: string; badge_name: string; badge_icon: string } {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  return (
    typeof o.response === 'string' && o.response.length > 0 &&
    typeof o.gift_words === 'string' && o.gift_words.length > 0 &&
    typeof o.badge_name === 'string' && o.badge_name.length > 0 &&
    typeof o.badge_icon === 'string'
  )
}

export async function answerPoi(encounterId: number, userAnswer: string) {
  const enc = getPoiEncounter(encounterId)
  if (!enc) throw new Error('神交记录不存在')

  const systemPrompt = buildPoiSystemPrompt(enc)
  const prompt = `用户${enc.characterName}在${enc.poiName}听到你的问题「${enc.question}」后，这样回答：
"""${userAnswer}"""

请作为${enc.characterName}，基于你的性格、人生经历和时代背景：
1. 先给一段 30-60 字的回应/点评。
2. 再赠予用户一段 30-60 字的"赠语"，富有诗意。
3. 最后给出一个 4-8 字的"精神徽章"称号，如"西湖知己"、"豁达行者"。

只返回纯 JSON，不要 markdown 代码块，不要任何解释文字：
{"response":"...","gift_words":"...","badge_name":"...","badge_icon":"🎑"}`

  let raw = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.8 }
  )

  let result = parseAiJson(raw)

  if (!isValidAnswerResult(result)) {
    const retryPrompt = `请严格只返回这个JSON格式（不要markdown，不要解释）：{"response":"30-60字回应","gift_words":"30-60字赠语","badge_name":"4-8字称号","badge_icon":"🎑"}`
    raw = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
        { role: 'assistant', content: raw },
        { role: 'user', content: retryPrompt },
      ],
      { temperature: 0.5 }
    )
    result = parseAiJson(raw)
  }

  if (!isValidAnswerResult(result)) {
    result = {
      response: '你的回答让我想起了许多往事...',
      gift_words: `在${enc.poiName}与你的相遇，是千年难得的精神共鸣。`,
      badge_name: '古迹知音',
      badge_icon: '🎑',
    }
  }

  const final = result as { response: string; gift_words: string; badge_name: string; badge_icon: string }

  updatePoiEncounter(encounterId, {
    userAnswer,
    giftWords: final.gift_words,
    badgeName: final.badge_name,
    badgeIcon: final.badge_icon,
    status: 'completed',
  })

  return final
}

export async function chatPoi(encounterId: number, message: string) {
  const enc = getPoiEncounter(encounterId)
  if (!enc) throw new Error('神交记录不存在')

  const k = getCharacterKnowledge(enc.characterName)
  const knowledgeCtx = k
    ? `你的生平：${k.lifeEvents.join('；')}。代表作：${k.majorWorks.join('；')}。哲学：${k.philosophy.join('；')}。`
    : ''

  const systemPrompt = `${buildPoiSystemPrompt(enc)}${knowledgeCtx ? '\n' + knowledgeCtx : ''}

重要规则（RAG 防幻觉）：
- 你只能回答与你本人、${enc.poiName}、你的时代相关的问题。
- 对于超出你认知范围的问题（如现代科技、未来事件），请谦逊地表示"此乃后世之事，老夫/妾身无从得知"。
- 回答控制在 120 字以内。`

  const history = enc.chatHistory
    .flatMap((h) => [
      { role: 'user' as const, content: h.q },
      { role: 'assistant' as const, content: h.a },
    ])

  const reply = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ],
    { temperature: 0.7 }
  )

  const ref = k ? `参考：${k.majorWorks[0] || k.lifeEvents[0] || '个人经历'}` : ''

  updatePoiEncounter(encounterId, {
    chatHistory: [...enc.chatHistory, { q: message, a: reply, ref }],
  })

  return { reply, reference: ref }
}

export function getPoiDetail(encounterId: number) {
  const enc = getPoiEncounter(encounterId)
  if (!enc) return null
  return {
    character_name: enc.characterName,
    poi_name: enc.poiName,
    gift_words: enc.giftWords || '',
    badge_name: enc.badgeName || '',
  }
}
