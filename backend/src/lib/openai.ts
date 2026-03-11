import OpenAI from 'openai'

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY 未配置。请在 backend/.env 中设置 OPENAI_API_KEY 后重启后端。')
    ;(err as any).statusCode = 503
    throw err
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  })
}

