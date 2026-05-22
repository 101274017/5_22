/**
 * 匿名用户 ID 生成与持久化
 * 使用 localStorage 存储，保证同一浏览器会话内用户 ID 一致
 */
const STORAGE_KEY = 'ancient_encounter_user_id'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `tourist_${timestamp}_${random}`
}

export function getUserId(): string {
  let userId = localStorage.getItem(STORAGE_KEY)
  if (!userId) {
    userId = generateId()
    localStorage.setItem(STORAGE_KEY, userId)
  }
  return userId
}
