'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { AuthUser } from './supabase-auth.service'

/**
 * Supabase认证服务修复版本
 * 解决认证错误和空对象返回问题
 */
export class SupabaseAuthFixService {
  private supabase = getSupabaseBrowserClient()

  /**
   * 获取当前用户 - 修复版本
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log('🔧 [修复版] 开始获取当前用户...');
      
      // 首先检查Supabase连接
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError) {
        console.error('🔧 [修复版] 获取会话失败:', sessionError);
        return null;
      }

      if (!session || !session.user) {
        console.log('🔧 [修复版] 没有活跃会话');
        return null;
      }

      console.log('🔧 [修复版] 会话获取成功:', { 
        userId: session.user.id, 
        email: session.user.email 
      });

      // 获取用户档案
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('🔧 [修复版] 获取用户档案失败:', profileError);
        
        // 如果档案不存在，创建默认档案
        if (profileError.code === 'PGRST116') {
          console.log('🔧 [修复版] 创建默认用户档案...');
          
          const defaultProfile = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || 'user',
            full_name: session.user.user_metadata?.full_name || '',
            subscription_type: 'free' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: newProfile, error: insertError } = await this.supabase
            .from('profiles')
            .insert(defaultProfile)
            .select()
            .single()

          if (insertError) {
            console.error('🔧 [修复版] 创建档案失败:', insertError);
            // 返回基本用户信息
            return {
              id: session.user.id,
              email: session.user.email || '',
              username: defaultProfile.username,
              subscription_type: 'free'
            };
          }

          console.log('🔧 [修复版] 默认档案创建成功');
          return {
            id: newProfile.id,
            email: newProfile.email,
            username: newProfile.username,
            full_name: newProfile.full_name,
            avatar_url: newProfile.avatar_url,
            subscription_type: newProfile.subscription_type || 'free',
            subscription_expires_at: newProfile.subscription_expires_at
          };
        }

        // 其他错误，返回基本信息
        return {
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.email?.split('@')[0] || 'user',
          subscription_type: 'free'
        };
      }

      console.log('🔧 [修复版] 用户档案获取成功');
      return {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        subscription_type: profile.subscription_type || 'free',
        subscription_expires_at: profile.subscription_expires_at
      };

    } catch (error: any) {
      console.error('🔧 [修复版] 获取用户异常:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return null;
    }
  }

  /**
   * 测试Supabase连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 [修复版] 测试Supabase连接...');
      
      // 测试基本连接
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('🔧 [修复版] 连接测试失败:', error);
        return {
          success: false,
          message: `连接失败: ${error.message}`
        };
      }

      console.log('🔧 [修复版] Supabase连接正常');
      return {
        success: true,
        message: 'Supabase连接正常'
      };

    } catch (error: any) {
      console.error('🔧 [修复版] 连接测试异常:', error);
      return {
        success: false,
        message: `连接异常: ${error.message}`
      };
    }
  }

  /**
   * 修复认证状态
   */
  async fixAuthState(): Promise<{ success: boolean; user: AuthUser | null; message: string }> {
    try {
      console.log('🔧 [修复版] 开始修复认证状态...');

      // 1. 测试连接
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        return {
          success: false,
          user: null,
          message: connectionTest.message
        };
      }

      // 2. 获取当前用户
      const user = await this.getCurrentUser();
      
      if (user) {
        console.log('🔧 [修复版] 认证状态修复成功');
        return {
          success: true,
          user,
          message: '认证状态正常'
        };
      } else {
        console.log('🔧 [修复版] 用户未登录');
        return {
          success: true,
          user: null,
          message: '用户未登录'
        };
      }

    } catch (error: any) {
      console.error('🔧 [修复版] 修复认证状态异常:', error);
      return {
        success: false,
        user: null,
        message: `修复失败: ${error.message}`
      };
    }
  }
}

export const supabaseAuthFixService = new SupabaseAuthFixService();