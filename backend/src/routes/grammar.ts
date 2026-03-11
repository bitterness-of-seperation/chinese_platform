import { Router } from 'express'
import { z } from 'zod'
import { getOpenAI } from '../lib/openai.js'

const router = Router()

const GrammarCheckRequestSchema = z.object({
  text: z.string(),
  level: z.enum(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']).optional(),
})

// 语法检查接口
router.post('/check', async (req, res) => {
  try {
    const openai = getOpenAI()
    const { text, level } = GrammarCheckRequestSchema.parse(req.body)

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的中文语法检查助手。请检查以下句子的语法是否正确。
${level ? `学习者的HSK水平是${level}，请根据这个水平给出合适的建议。` : ''}

请以JSON格式返回结果：
{
  "correct": true/false,
  "errors": [
    {
      "type": "错误类型",
      "position": "错误位置",
      "original": "原文",
      "suggestion": "修改建议",
      "explanation": "解释说明"
    }
  ],
  "correctedSentence": "修改后的句子",
  "explanation": "整体解释"
}`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}')

    res.json({
      success: true,
      original: text,
      level,
      ...result,
    })
  } catch (error) {
    console.error('Grammar check error:', error)
    if (error instanceof Error && (error as any).statusCode) {
      res.status((error as any).statusCode).json({ error: 'Service unavailable', message: error.message })
    } else {
      res.status(500).json({ error: 'Failed to check grammar' })
    }
  }
})

// 语法解释接口
router.post('/explain', async (req, res) => {
  try {
    const openai = getOpenAI()
    const { text } = z.object({ text: z.string() }).parse(req.body)

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的中文语法教学助手。请解释以下中文句子或语法点的用法。
包括：
1. 语法结构分析
2. 关键词汇解释
3. 使用场景
4. 类似句型举例
5. 常见错误提醒`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.5,
    })

    const explanation = completion.choices[0]?.message?.content || ''

    res.json({
      success: true,
      query: text,
      explanation,
    })
  } catch (error) {
    console.error('Grammar explain error:', error)
    if (error instanceof Error && (error as any).statusCode) {
      res.status((error as any).statusCode).json({ error: 'Service unavailable', message: error.message })
    } else {
      res.status(500).json({ error: 'Failed to explain grammar' })
    }
  }
})

export { router as grammarRouter }
