import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

// 认证状态类型
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

// 注册用户
export async function signUp(email: string, password: string, userData?: {
  full_name?: string
  username?: string
}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) throw error

    // 如果注册成功，创建用户档案
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: userData?.full_name || null,
          username: userData?.username || null
        })

      if (profileError) {
        console.error('创建用户档案失败:', profileError)
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('注册失败:', error)
    return { data: null, error }
  }
}

// 用户登录
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('登录失败:', error)
    return { data: null, error }
  }
}

// 用户登出
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('登出失败:', error)
    return { error }
  }
}

// 发送密码重置邮件
export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('发送重置密码邮件失败:', error)
    return { data: null, error }
  }
}

// 更新密码
export async function updatePassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('更新密码失败:', error)
    return { data: null, error }
  }
}

// 获取当前用户
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    console.error('获取当前用户失败:', error)
    return { user: null, error }
  }
}

// 获取当前会话
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error) {
    console.error('获取当前会话失败:', error)
    return { session: null, error }
  }
}

// 获取用户档案
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取用户档案失败:', error)
    return { data: null, error }
  }
}

// 更新用户档案
export async function updateUserProfile(userId: string, updates: {
  full_name?: string
  username?: string
  avatar_url?: string
  phone?: string
  location?: string
  bio?: string
}) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('更新用户档案失败:', error)
    return { data: null, error }
  }
}

// OAuth登录
export async function signInWithOAuth(provider: 'google' | 'github' | 'apple') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error(`${provider} OAuth登录失败:`, error)
    return { data: null, error }
  }
}

// 监听认证状态变化
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}