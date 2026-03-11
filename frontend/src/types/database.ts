export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
          level: number
          experience: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          avatar_url?: string | null
          level?: number
          experience?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          level?: number
          experience?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      words: {
        Row: {
          id: string
          word: string
          pinyin: string
          type: string
          level: string
          definition: string
          etymology: string | null
          examples: string[]
          synonyms: string[]
          antonyms: string[]
          created_at: string
        }
        Insert: {
          id?: string
          word: string
          pinyin: string
          type: string
          level: string
          definition: string
          etymology?: string | null
          examples?: string[]
          synonyms?: string[]
          antonyms?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          word?: string
          pinyin?: string
          type?: string
          level?: string
          definition?: string
          etymology?: string | null
          examples?: string[]
          synonyms?: string[]
          antonyms?: string[]
          created_at?: string
        }
        Relationships: []
      }
      user_words: {
        Row: {
          id: string
          user_id: string
          word_id: string
          status: 'new' | 'learning' | 'mastered'
          review_count: number
          correct_count: number
          last_reviewed: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id: string
          status?: 'new' | 'learning' | 'mastered'
          review_count?: number
          correct_count?: number
          last_reviewed?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string
          status?: 'new' | 'learning' | 'mastered'
          review_count?: number
          correct_count?: number
          last_reviewed?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_records: {
        Row: {
          id: string
          user_id: string
          word_id: string
          correct: boolean
          learned_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id: string
          correct: boolean
          learned_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string
          correct?: boolean
          learned_at?: string
          created_at?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
