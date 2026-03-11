# 智言汉语 - 中文教育平台

## 项目简介

智言汉语是一个面向中文学习者的在线教育平台，提供AI智能助手、词典查询、词汇学习、练习测试等功能，帮助用户高效学习中文。

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  首页   │ │ AI助手  │ │  词典   │ │ 词汇学习 │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                      │                                      │
│              ┌───────┴───────┐                              │
│              │  Supabase     │  ← 用户认证、数据存储        │
│              │  (BaaS)       │                              │
│              └───────┬───────┘                              │
└──────────────────────┼──────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────┐
│                      ▼                                      │
│              ┌───────────────┐                              │
│              │   后端服务     │  ← AI接口代理               │
│              │   (Express)   │                              │
│              └───────┬───────┘                              │
│                      │                                      │
│              ┌───────┴───────┐                              │
│              │  OpenAI API   │  ← 第三方AI服务              │
│              └───────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

## 项目结构

```
chinese-edu-platform/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/      # 公共组件
│   │   ├── views/           # 页面视图
│   │   ├── router/          # 路由配置
│   │   ├── lib/             # Supabase客户端
│   │   ├── types/           # TypeScript类型定义
│   │   └── assets/          # 静态资源
│   ├── public/              # 公共文件
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # 后端服务
│   ├── src/
│   │   ├── index.ts         # 入口文件
│   │   └── routes/          # API路由
│   │       ├── chat.ts      # AI对话接口
│   │       ├── translate.ts # 翻译接口
│   │       └── grammar.ts   # 语法检查接口
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                # 项目说明文档
```

## 功能模块

### 1. AI智能助手 (Assistant)
- 智能对话问答
- 中文语法解释
- 学习建议生成
- 支持基础/高级模式切换

### 2. 词典查询 (Dictionary)
- 词汇搜索
- 拼音标注
- 词义解释
- 例句展示
- 同义词/反义词

### 3. 词汇学习 (Vocabulary)
- HSK分级词汇
- 学习进度追踪
- 打卡记录
- 生词本管理

### 4. 练习测试 (Exercises)
- 词汇练习
- 语法填空
- 学习效果评估

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件**: Element Plus
- **样式**: SCSS + UnoCSS
- **路由**: Vue Router
- **状态管理**: Pinia
- **后端服务**: Supabase (认证 + 数据库)

### 后端
- **运行时**: Node.js
- **框架**: Express
- **AI服务**: OpenAI API
- **类型验证**: Zod

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 快速开始

### 1. 前端配置
```bash
cd frontend
npm install
cp .env.example .env
# 编辑 .env 文件，填入 Supabase 配置
运行sql导入词典数据
npm run dev
```

### 2. 后端配置
```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 文件，填入 OpenAI API 配置
npm run dev
```

### 4. 访问应用
- 前端: http://localhost:5173
- 后端: http://localhost:3001

## 环境变量说明

### 前端 (.env)
| 变量名 | 说明 |
|--------|------|
| VITE_SUPABASE_URL | Supabase项目URL |
| VITE_SUPABASE_ANON_KEY | Supabase匿名密钥 |
| VITE_AI_SERVICE_URL | 后端AI服务地址 |

### 后端 (.env)
| 变量名 | 说明 |
|--------|------|
| OPENAI_API_KEY | OpenAI API密钥 |
| OPENAI_BASE_URL | OpenAI API地址 |
| OPENAI_MODEL | 使用的模型名称 |
| PORT | 服务端口 |
| FRONTEND_URL | 前端地址(CORS) |
| SUPABASE_URL | Supabase项目URL |
| SUPABASE_SERVICE_KEY | Supabase服务密钥 |

## 开发团队

智言汉语开发团队

## 许可证

MIT License
