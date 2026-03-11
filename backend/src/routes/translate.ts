import { Router } from 'express'
import { z } from 'zod'
import { getOpenAI } from '../lib/openai.js'

const router = Router()

const TranslateRequestSchema = z.object({
  text: z.string(),
  sourceLang: z.enum(['zh', 'en']).default('zh'),
  targetLang: z.enum(['zh', 'en']).default('en'),
})

// 翻译接口
router.post('/', async (req, res) => {
  try {
    const openai = getOpenAI()
    const { text, sourceLang, targetLang } = TranslateRequestSchema.parse(req.body)

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的翻译助手。请将以下${sourceLang === 'zh' ? '中文' : '英文'}翻译成${targetLang === 'zh' ? '中文' : '英文'}。
只返回翻译结果，不要添加任何解释或注释。`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    })

    const translation = completion.choices[0]?.message?.content || ''

    res.json({
      success: true,
      original: text,
      translation,
      sourceLang,
      targetLang,
    })
  } catch (error) {
    console.error('Translate error:', error)
    if (error instanceof Error && (error as any).statusCode) {
      res.status((error as any).statusCode).json({ error: 'Service unavailable', message: error.message })
    } else {
      res.status(500).json({ error: 'Failed to translate' })
    }
  }
})

export { router as translateRouter }
