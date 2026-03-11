# 智言汉语 - 部署文档

## 目录

1. [环境准备](#环境准备)
2. [Supabase配置](#supabase配置)
3. [前端部署](#前端部署)
4. [后端部署](#后端部署)
5. [完整部署流程](#完整部署流程)

---

## 环境准备

### 必需环境

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0.0 | JavaScript运行时 |
| npm | >= 9.0.0 | 包管理器 |
| Git | 最新版 | 版本控制 |

### 可选工具

| 工具 | 说明 |
|------|------|
| VS Code | 推荐IDE |
| Supabase CLI | 本地开发Supabase |

---

## Supabase配置

### 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 填写项目信息：
   - **Name**: chinese-edu-platform
   - **Database Password**: 设置强密码
   - **Region**: 选择最近的区域（如 Singapore）

### 2. 获取API密钥

项目创建完成后，进入 `Settings > API`：

```
Project URL: https://xxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 创建数据表

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 词汇表
CREATE TABLE words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  type TEXT NOT NULL,
  level TEXT NOT NULL,
  definition TEXT NOT NULL,
  etymology TEXT,
  examples TEXT[] DEFAULT '{}',
  synonyms TEXT[] DEFAULT '{}',
  antonyms TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户词汇关联表
CREATE TABLE user_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  word_id UUID REFERENCES words(id) NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'learning', 'mastered')),
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- 学习记录表
CREATE TABLE learning_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  word_id UUID REFERENCES words(id) NOT NULL,
  correct BOOLEAN NOT NULL,
  learned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 聊天历史表
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS策略
CREATE POLICY "用户可以查看自己的资料" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户可以查看自己的词汇" ON user_words
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加词汇" ON user_words
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新词汇状态" ON user_words
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以查看自己的学习记录" ON learning_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加学习记录" ON learning_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以查看自己的聊天历史" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加聊天记录" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. 配置认证

在 Supabase Dashboard 的 `Authentication > Providers` 中：

1. 启用 **Email** 认证
2. 可选启用 **Google**、**GitHub** 等第三方登录

---

## 前端部署

### 方式一：Vercel部署（推荐）

#### 1. 安装Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录Vercel

```bash
vercel login
```

#### 3. 部署

```bash
cd frontend
vercel
```

#### 4. 配置环境变量

在 Vercel Dashboard 中设置：

| 变量名 | 值 |
|--------|-----|
| VITE_SUPABASE_URL | 你的Supabase URL |
| VITE_SUPABASE_ANON_KEY | 你的Supabase anon key |
| VITE_AI_SERVICE_URL | 后端服务地址 |

### 方式二：Netlify部署

#### 1. 构建项目

```bash
cd frontend
npm run build
```

#### 2. 部署到Netlify

方式A - 通过Netlify CLI：

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

方式B - 通过Netlify网站：

1. 访问 [Netlify](https://netlify.com)
2. 拖拽 `dist` 文件夹到部署区域

#### 3. 配置重定向

创建 `frontend/public/_redirects` 文件：

```
/* /index.html 200
```

### 方式三：静态服务器部署

#### 1. 构建

```bash
cd frontend
npm run build
```

#### 2. 使用Nginx托管

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/chinese-edu-platform/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 后端部署

### 方式一：Railway部署（推荐）

#### 1. 安装Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. 登录并初始化

```bash
railway login
railway init
```

#### 3. 部署

```bash
cd backend
railway up
```

#### 4. 配置环境变量

在 Railway Dashboard 中设置所有 `.env` 变量。

### 方式二：Render部署

#### 1. 创建Render账号

访问 [Render](https://render.com) 注册账号

#### 2. 创建Web Service

1. 连接GitHub仓库
2. 选择 `backend` 目录
3. 设置：
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. 添加环境变量

### 方式三：VPS部署

#### 1. 安装PM2

```bash
npm install -g pm2
```

#### 2. 启动服务

```bash
cd backend
npm install
npm run build
pm2 start dist/index.js --name chinese-edu-api
```

#### 3. 配置Nginx反向代理

```nginx
upstream backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 完整部署流程

### 开发环境

```bash
# 1. 克隆项目
git clone <repository-url>
cd chinese-edu-platform

# 2. 配置前端
cd frontend
cp .env.example .env
# 编辑 .env 填入配置
npm install
npm run dev

# 3. 配置后端（新终端）
cd ../backend
cp .env.example .env
# 编辑 .env 填入配置
npm install
npm run dev
```

### 生产环境（推荐配置）

```
┌─────────────────────────────────────────────────────────────┐
│                     生产环境架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   用户 ──▶ Vercel/Netlify ──▶ Supabase (数据)               │
│              │                                              │
│              └──▶ Railway/Render (AI后端)                   │
│                        │                                    │
│                        └──▶ OpenAI API                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 部署检查清单

#### 前端检查

- [ ] 环境变量已配置
- [ ] 构建无错误
- [ ] 页面正常加载
- [ ] 路由跳转正常
- [ ] API请求正常

#### 后端检查

- [ ] 环境变量已配置
- [ ] 服务正常启动
- [ ] 健康检查端点正常 (`/health`)
- [ ] CORS配置正确
- [ ] API接口响应正常

#### Supabase检查

- [ ] 数据表已创建
- [ ] RLS策略已配置
- [ ] 认证已启用
- [ ] API密钥已获取

---

## 常见问题

### Q: 前端构建报错找不到模块

A: 确保已安装所有依赖：
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Q: 后端无法连接OpenAI

A: 检查：
1. API Key是否正确
2. 是否有网络代理需求
3. API额度是否充足

### Q: Supabase连接失败

A: 检查：
1. URL和Key是否正确
2. 项目是否已暂停
3. 网络是否可访问

### Q: 跨域问题

A: 确保后端CORS配置包含前端域名：
```typescript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:5173']
}))
```

---

## 联系支持

如有部署问题，请提交 Issue 或联系开发团队。
