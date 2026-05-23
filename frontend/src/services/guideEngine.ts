/**
 * 导游讲解团引擎（本地版）
 * 讲解团数据存储在 localStorage，无需后端
 */
import { chatCompletion } from './aiClient'
import { getCharacterKnowledge } from './knowledgeBase'

const LS_TOURS = 'ancient_guide_tours'

export interface LocalTour {
  id: number
  guideId: string
  guideName: string
  celebrityName: string
  celebrityAge?: string
  poiName: string
  description?: string
  tourCode: string
  status: 'active' | 'closed'
  createdAt: string
}

let tourIdCounter = Date.now() + 10000

function readTours(): LocalTour[] {
  try {
    const raw = localStorage.getItem(LS_TOURS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeTours(tours: LocalTour[]) {
  try {
    localStorage.setItem(LS_TOURS, JSON.stringify(tours))
  } catch {
    // storage full
  }
}

function generateTourCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  // 避免重复
  const existing = readTours().map((t) => t.tourCode)
  if (existing.includes(code)) return generateTourCode()
  return code
}

export function createLocalTour(data: Omit<LocalTour, 'id' | 'tourCode' | 'status' | 'createdAt'>): LocalTour {
  const tour: LocalTour = {
    ...data,
    id: ++tourIdCounter,
    tourCode: generateTourCode(),
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  const all = readTours()
  all.unshift(tour)
  writeTours(all)
  return tour
}

export function getLocalTourByCode(tourCode: string): LocalTour | undefined {
  return readTours().find((t) => t.tourCode === tourCode.toUpperCase())
}

export function listLocalTours(guideId: string): LocalTour[] {
  return readTours()
    .filter((t) => t.guideId === guideId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function closeLocalTour(tourId: number) {
  const all = readTours()
  const idx = all.findIndex((t) => t.id === tourId)
  if (idx >= 0) {
    all[idx] = { ...all[idx], status: 'closed' }
    writeTours(all)
  }
}

export async function generateNarration(
  celebrityName: string,
  poiName: string,
  celebrityAge?: string,
  userMessage?: string,
  history?: string[]
): Promise<string> {
  const k = getCharacterKnowledge(celebrityName)
  const persona = k
    ? `你是${k.dynasty}的${k.fullName}，字${k.courtesyName}，号${k.artName}。性格：${k.personality.join('；')}。语言风格：${k.speakingStyle}。`
    : `你是历史名人${celebrityName}。`

  const locCtx = k?.locationContext?.[poiName]
    ? `你在${poiName}的经历：${k.locationContext[poiName].events.join('；')}。`
    : ''

  const systemPrompt = `${persona}${locCtx ? '\n' + locCtx : ''}
你此刻正站在${poiName}，以第一人称视角为游客进行讲解。讲解要生动、有画面感，融入你的个人经历和情感。控制在 200 字以内。`

  const messages: { role: 'system' | 'user'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ]

  if (history && history.length > 0) {
    history.forEach((h) => {
      messages.push({ role: 'user', content: h })
    })
  }

  const userPrompt = userMessage
    ? `游客提问："${userMessage}"，请回答。`
    : `请开始你在${poiName}的讲解${celebrityAge ? `（${celebrityAge}）` : ''}。`

  messages.push({ role: 'user', content: userPrompt })

  return chatCompletion(messages, { temperature: 0.8 })
}
