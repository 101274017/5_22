/**
 * localStorage 持久化层
 * 替代后端 SQLite，存储神交记录和名人对话记录
 */

const LS_CELEBRITY = 'ancient_celebrity_encounters'
const LS_POI = 'ancient_poi_encounters'

let idCounter = Date.now()
function nextId() {
  return ++idCounter
}

export interface CelebrityEncounter {
  id: number
  userId: string
  characterName: string
  identity: string
  period?: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  giftWords: string | null
  badgeName: string | null
  status: 'chatting' | 'completed'
  createdAt: string
}

export interface PoiEncounter {
  id: number
  userId: string
  poiName: string
  characterName: string
  openingSpeech: string
  question: string
  userAnswer: string | null
  giftWords: string | null
  badgeName: string | null
  badgeIcon: string | null
  status: 'summoned' | 'answered' | 'completed'
  chatHistory: { q: string; a: string; ref: string }[]
  systemPrompt?: string
  createdAt: string
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // storage full or unavailable
  }
}

// Celebrity
export function createCelebrityEncounter(data: Omit<CelebrityEncounter, 'id' | 'createdAt'>): CelebrityEncounter {
  const enc: CelebrityEncounter = { ...data, id: nextId(), createdAt: new Date().toISOString() }
  const all = read<CelebrityEncounter>(LS_CELEBRITY)
  all.unshift(enc)
  write(LS_CELEBRITY, all)
  return enc
}

export function getCelebrityEncounter(id: number): CelebrityEncounter | undefined {
  return read<CelebrityEncounter>(LS_CELEBRITY).find((e) => e.id === id)
}

export function updateCelebrityEncounter(id: number, patch: Partial<CelebrityEncounter>) {
  const all = read<CelebrityEncounter>(LS_CELEBRITY)
  const idx = all.findIndex((e) => e.id === id)
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patch }
    write(LS_CELEBRITY, all)
  }
}

export function listCelebrityEncounters(userId: string): CelebrityEncounter[] {
  return read<CelebrityEncounter>(LS_CELEBRITY).filter((e) => e.userId === userId)
}

// POI
export function createPoiEncounter(data: Omit<PoiEncounter, 'id' | 'createdAt'>): PoiEncounter {
  const enc: PoiEncounter = { ...data, id: nextId(), createdAt: new Date().toISOString() }
  const all = read<PoiEncounter>(LS_POI)
  all.unshift(enc)
  write(LS_POI, all)
  return enc
}

export function getPoiEncounter(id: number): PoiEncounter | undefined {
  return read<PoiEncounter>(LS_POI).find((e) => e.id === id)
}

export function updatePoiEncounter(id: number, patch: Partial<PoiEncounter>) {
  const all = read<PoiEncounter>(LS_POI)
  const idx = all.findIndex((e) => e.id === id)
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patch }
    write(LS_POI, all)
  }
}

export function listPoiEncounters(userId: string): PoiEncounter[] {
  return read<PoiEncounter>(LS_POI).filter((e) => e.userId === userId)
}
