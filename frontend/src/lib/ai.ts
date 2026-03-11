export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatResponse {
  success: boolean
  reply: string
  usage?: unknown
}

const baseUrl = (import.meta.env.VITE_AI_SERVICE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3001'

export async function chat(messages: ChatMessage[], context?: string): Promise<ChatResponse> {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, context }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AI服务请求失败 (${res.status}) ${text || res.statusText}`)
  }

  return res.json() as Promise<ChatResponse>
}

