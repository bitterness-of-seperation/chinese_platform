# Supabase 初始化（必做）

你当前项目 **不需要传统后端服务器来存用户/词汇数据**，但需要先在 Supabase 创建项目并初始化数据库表。

## 1. 创建 Supabase 项目

- 在 Supabase 控制台新建项目
- 进入项目后，复制：
  - **Project URL**（填到前端 `VITE_SUPABASE_URL`）
  - **anon public key**（填到前端 `VITE_SUPABASE_ANON_KEY`）

## 2. 初始化数据库（SQL）

- Supabase Dashboard -> **SQL Editor**
- 复制并执行 `schema.sql`
  - 可选：再执行 `seed.sql` 导入一小批示例词库，便于立刻跑通前端所有页面

执行后会创建：
- `profiles`（自动与 `auth.users` 绑定，注册时自动创建）
- `words`（词库，默认所有人可读）
- `user_words`、`learning_records`、`chat_history`（均开启 RLS，仅本人可读写）

## 3. 前端环境变量

在 `frontend/.env`（或复制 `frontend/.env.example`）里配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AI_SERVICE_URL`（本地后端默认 `http://localhost:3001`）

## 4. 推荐的 Auth 设置

- Authentication -> Providers：先启用 **Email**
- Authentication -> URL Configuration：
  - Site URL：本地开发可填 `http://localhost:5173`

