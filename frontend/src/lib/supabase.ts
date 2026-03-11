import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase配置缺失，请检查环境变量')
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// 认证相关方法
export const auth = {
  // 注册
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // 登录
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // 登出
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 获取当前用户
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 监听认证状态变化
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// 用户数据相关方法
export const users = {
  // 获取用户资料
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // 更新用户资料
  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    return { data, error }
  },
}

// 词汇相关方法
export const vocabulary = {
  // 获取用户词汇列表
  getUserWords: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_words')
      .select(`
        *,
        words (*)
      `)
      .eq('user_id', userId)
    return { data, error }
  },

  // 添加单词到生词本
  addWord: async (userId: string, wordId: string) => {
    const { data, error } = await supabase
      .from('user_words')
      .insert({
        user_id: userId,
        word_id: wordId,
        status: 'new',
      })
    return { data, error }
  },

  // 更新单词学习状态
  updateWordStatus: async (userWordId: string, status: 'new' | 'learning' | 'mastered') => {
    const { data, error } = await supabase
      .from('user_words')
      .update({ status })
      .eq('id', userWordId)
    return { data, error }
  },
}

// 学习记录相关方法
export const learning = {
  // 记录学习进度
  recordProgress: async (userId: string, wordId: string, correct: boolean) => {
    const { data, error } = await supabase
      .from('learning_records')
      .insert({
        user_id: userId,
        word_id: wordId,
        correct,
        learned_at: new Date().toISOString(),
      })
    return { data, error }
  },

  // 获取今日学习统计
  getTodayStats: async (userId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('learning_records')
      .select('*')
      .eq('user_id', userId)
      .gte('learned_at', today)
    return { data, error }
  },
}

export default supabase
