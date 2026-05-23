/**
 * MiMo API 客户端（OpenAI 兼容格式）
 * 直接调用手机 WiFi 网络，无需后端中转
 */

const MIMO_BASE_URL = 'https://token-plan-cn.xiaomimimo.com/v1'
const MIMO_API_KEY = 'tp-cti7s7lpbavwmd560vie54u91ygn354qwes12j4hontn3vg8'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function chatCompletion(
  messages: ChatMessage[],
  opts?: { temperature?: number; model?: string; maxTokens?: number }
): Promise<string> {
  const res = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MIMO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts?.model || 'mimo-v2.5-pro',
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 2048,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`AI 请求失败 (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('AI 返回了空内容')
  }
  return content.trim()
}
