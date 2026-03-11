import { Router } from 'express'
import { z } from 'zod'
import { getOpenAI } from '../lib/openai.js'

const router = Router()

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
})

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  context: z.string().optional(),
})

// AI对话接口
router.post('/', async (req, res) => {
  try {
    const openai = getOpenAI()
    const { messages, context } = ChatRequestSchema.parse(req.body)

    // 构建系统提示
    const systemPrompt = `你是一个专业的中文学习助手"智言汉语"。你的任务是帮助用户学习中文，包括：
1. 解答中文语法问题
2. 解释词汇用法
3. 提供例句和练习
4. 纠正语法错误

${context ? `当前学习上下文：${context}` : ''}

请用清晰、友好的方式回答用户的问题。如果用户用英文提问，可以用英文回答，但建议多用中文来帮助用户学习。`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const reply = completion.choices[0]?.message?.content || '抱歉，我无法生成回复。'

    res.json({
      success: true,
      reply,
      usage: completion.usage,
    })
  } catch (error) {
    console.error('Chat error:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors })
    } else if (error instanceof Error && (error as any).statusCode) {
      res.status((error as any).statusCode).json({ error: 'Service unavailable', message: error.message })
    } else {
      res.status(500).json({ error: 'Failed to process chat request' })
    }
  }
})

// 流式对话接口
router.post('/stream', async (req, res) => {
  try {
    const openai = getOpenAI()
    const { messages, context } = ChatRequestSchema.parse(req.body)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const systemPrompt = `你是一个专业的中文学习助手"智言汉语"。${context ? `当前学习上下文：${context}` : ''}`

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
      ],
      temperature: 0.7,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    console.error('Stream chat error:', error)
    if (error instanceof Error && (error as any).statusCode) {
      res.status((error as any).statusCode).json({ error: 'Service unavailable', message: error.message })
    } else {
      res.status(500).json({ error: 'Failed to process stream request' })
    }
  }
})

export { router as chatRouter }
