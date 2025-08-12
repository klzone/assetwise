'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database-new.types'
import { User } from '@supabase/supabase-js'
import { InputSanitizationService, ApiSecurityService } from './secure-data.service'

export interface AuthUser {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  // 新增字段
  phone?: string
  location?: string
  bio?: string
  subscription_type: 'free' | 'professional' | 'flagship'
  subscription_expires_at?: string
}

// 创建安全的用户对象，确保所有字段都有默认值
export function createSafeUser(user: Partial<AuthUser> & { id: string; email: string }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username || user.email.split('@')[0] || 'User',
    full_name: user.full_name || user.username || 'User',
    avatar_url: user.avatar_url || '',
    subscription_type: user.subscription_type || 'free',
    subscription_expires_at: user.subscription_expires_at || undefined
  };
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username?: string
  full_name?: string
}

export class SupabaseAuthService {
  private supabase = getSupabaseBrowserClient()

  async signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // 验证输入数据
      if (!InputSanitizationService.validateEmail(data.email)) {
        return { user: null, error: '请输入有效的邮箱地址' };
      }

      const passwordValidation = InputSanitizationService.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        return { user: null, error: passwordValidation.errors.join(', ') };
      }

      // 检查速率限制
      if (!ApiSecurityService.checkRateLimit(data.email)) {
        return { user: null, error: '注册尝试过于频繁，请稍后再试' };
      }

      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: InputSanitizationService.sanitizeText(data.username || ''),
            full_name: InputSanitizationService.sanitizeText(data.full_name || ''),
          }
        }
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: '注册失败，请重试' }
      }

      // 用户档案会通过数据库触发器自动创建
      // 如果需要更新额外信息，可以在这里更新
      if (data.username || data.full_name) {
        const { error: updateError } = await this.supabase
          .from('profiles')
          .update({
            username: InputSanitizationService.sanitizeText(data.username || ''),
            full_name: InputSanitizationService.sanitizeText(data.full_name || '')
          })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('更新用户档案失败:', updateError)
          // 不阻止注册流程，只记录错误
        }
      }

      const user = await this.getCurrentUser()
      return { user, error: null }
    } catch (error) {
      console.error('注册错误:', error)
      return { user: null, error: '注册失败，请重试' }
    }
  }

  async signIn(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // 验证输入
      if (!InputSanitizationService.validateEmail(credentials.email)) {
        return { user: null, error: '请输入有效的邮箱地址' };
      }

      // 检查速率限制
      if (!ApiSecurityService.checkRateLimit(credentials.email)) {
        return { user: null, error: '登录尝试过于频繁，请稍后再试' };
      }

      console.log('🔐 开始Supabase登录流程:', { email: credentials.email });

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        console.error('Supabase登录失败:', {
          message: error.message,
          status: error.status
        });
        return { user: null, error: error.message }
      }

      if (!data.user) {
        console.log('❌ 登录失败：没有用户数据');
        return { user: null, error: '登录失败，请重试' }
      }

      console.log('✅ Supabase认证成功，获取用户档案...');
      const user = await this.getCurrentUser()

      if (!user) {
        console.error('❌ 获取用户档案失败');
        return { user: null, error: '获取用户信息失败，请重试' }
      }

      console.log('✅ 登录流程完成');
      return { user, error: null }
    } catch (error: any) {
      console.error('登录过程异常:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { user: null, error: '登录失败，请重试' }
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      // 清除所有本地存储的敏感数据
      if (typeof window !== 'undefined') {
        // 清除可能的敏感数据
        const keysToRemove = ['assetwise_current_user', 'assetwise_user'];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      const { error } = await this.supabase.auth.signOut()
      if (error) {
        return { error: error.message }
      }
      return { error: null }
    } catch (error) {
      console.error('登出错误:', error)
      return { error: '登出失败，请重试' }
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log('🔍 尝试从Supabase获取用户...');
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()

      if (authError) {
        console.error('Supabase认证错误:', {
          message: authError.message,
          status: authError.status
        });
        return null;
      }

      if (!user) {
        console.log('❌ Supabase中没有认证用户');
        return null
      }

      console.log('✅ Supabase用户获取成功:', { id: user.id, email: user.email });

      // 获取用户档案信息
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select(`
          id,
          email,
          username,
          full_name,
          avatar_url,
          phone,
          location,
          bio,
          subscription_type,
          subscription_expires_at,
          created_at,
          updated_at
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('获取用户档案失败:', {
          error: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          userId: user.id
        });

        // 如果是因为没有找到记录，尝试创建一个默认档案
        if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows')) {
          console.log('🔧 用户档案不存在，尝试创建默认档案...');

          // 从邮箱中提取用户名作为默认用户名
          const defaultUsername = user.email?.split('@')[0] || 'user';

          const { data: newProfile, error: insertError } = await this.supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              username: defaultUsername,
              full_name: defaultUsername,
              subscription_type: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select(`
              id,
              email,
              username,
              full_name,
              avatar_url,
              phone,
              location,
              bio,
              subscription_type,
              subscription_expires_at
            `)
            .single()

          if (insertError) {
            console.error('创建用户档案失败:', {
              error: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            });

            // 即使创建失败，也返回基本用户信息
            return createSafeUser({
              id: user.id,
              email: user.email || '',
              username: defaultUsername
            })
          }

          console.log('✅ 默认用户档案创建成功:', newProfile);
          return createSafeUser({
            id: newProfile.id,
            email: newProfile.email,
            username: newProfile.username,
            full_name: newProfile.full_name,
            avatar_url: newProfile.avatar_url,
            phone: newProfile.phone,
            location: newProfile.location,
            bio: newProfile.bio,
            subscription_type: newProfile.subscription_type || 'free',
            subscription_expires_at: newProfile.subscription_expires_at
          })
        }

        // 其他错误，返回基本用户信息
        return createSafeUser({
          id: user.id,
          email: user.email || '',
          username: user.email?.split('@')[0] || 'user'
        })
      }

      if (!profile) {
        console.log('⚠️ 用户档案为空，返回基本信息');
        return {
          id: user.id,
          email: user.email || '',
          subscription_type: 'free'
        }
      }

      console.log('✅ 用户档案获取成功:', profile);
      return {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        subscription_type: profile.subscription_type,
        subscription_expires_at: profile.subscription_expires_at
      }
    } catch (error: any) {
      console.error('获取当前用户错误:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return null
    }
  }

  async updateProfile(updates: Partial<AuthUser>): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { error: '用户未登录' }
      }

      const { error } = await this.supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('更新档案错误:', error)
      return { error: '更新失败，请重试' }
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('重置密码错误:', error)
      return { error: '重置密码失败，请重试' }
    }
  }

  // 监听认证状态变化
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}

export const supabaseAuthService = new SupabaseAuthService()
