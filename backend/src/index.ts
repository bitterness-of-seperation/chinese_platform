import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { chatRouter } from './routes/chat.js'
import { translateRouter } from './routes/translate.js'
import { grammarRouter } from './routes/grammar.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())

// 路由
app.use('/api/chat', chatRouter)
app.use('/api/translate', translateRouter)
app.use('/api/grammar', grammarRouter)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

app.listen(PORT, () => {
  console.log(`🚀 后端AI服务运行在 http://localhost:${PORT}`)
})
