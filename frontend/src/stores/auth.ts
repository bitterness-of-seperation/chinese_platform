import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase, users } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<any | null>(null)
  const isReady = ref(false)

  const isAuthed = computed(() => !!user.value)

  async function refreshUser() {
    const { data } = await supabase.auth.getUser()
    user.value = data.user
    return user.value
  }

  async function refreshProfile() {
    if (!user.value) {
      profile.value = null
      return null
    }
    const { data } = await users.getProfile(user.value.id)
    profile.value = data ?? null
    return profile.value
  }

  async function init() {
    if (isReady.value) return
    await refreshUser()
    await refreshProfile()

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      await refreshProfile()
    })

    isReady.value = true
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    user.value = data.user
    await refreshProfile()
    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    await refreshProfile()
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
    profile.value = null
  }

  return {
    user,
    profile,
    isReady,
    isAuthed,
    init,
    refreshUser,
    refreshProfile,
    signUp,
    signIn,
    signOut,
  }
})

