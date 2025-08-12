'use server'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withCsrfProtection } from '@/lib/middleware/csrf-protection.middleware';
import { PasswordValidationService, withValidation } from '@/lib/services/password-validation.service';

/**
 * 获取CSRF令牌
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'csrf-token') {
    // 生成并返回CSRF令牌
    const { getCsrfToken } = await import('@/lib/middleware/csrf-protection.middleware');
    return getCsrfToken();
  }
  
  return NextResponse.json({ error: '无效的操作' }, { status: 400 });
}

/**
 * 用户注册
 */
export async function POST(request: NextRequest) {
  return withCsrfProtection(async (req) => {
    return withValidation(req, (data) => {
      const errors = [];
      
      // 验证必填字段
      if (!data.email) errors.push('邮箱不能为空');
      if (!data.password) errors.push('密码不能为空');
      if (!data.name) errors.push('姓名不能为空');
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (data.email && !emailRegex.test(data.email)) {
        errors.push('邮箱格式不正确');
      }
      
      // 验证密码强度
      if (data.password) {
        const passwordValidation = PasswordValidationService.validatePassword(data.password);
        if (!passwordValidation.isValid) {
          errors.push(...passwordValidation.errors);
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        data: errors.length === 0 ? data : undefined
      };
    }, async (req, validatedData) => {
      try {
        const supabase = await createClient();
        
        // 检查邮箱是否已存在
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', validatedData.email)
          .single();
        
        if (existingUser) {
          return NextResponse.json(
            { error: '邮箱已被注册', details: '请使用其他邮箱或尝试找回密码' },
            { status: 409 }
          );
        }
        
        // 创建用户
        const { data: user, error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            data: {
              name: validatedData.name
            }
          }
        });
        
        if (error) {
          console.error('用户注册失败:', error);
          return NextResponse.json(
            { error: '注册失败', details: error.message },
            { status: 500 }
          );
        }
        
        // 创建用户档案
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.user?.id,
            name: validatedData.name,
            email: validatedData.email,
            subscription_level: 'free'
          });
        
        if (profileError) {
          console.error('创建用户档案失败:', profileError);
          // 注册成功但创建档案失败，返回警告
          return NextResponse.json(
            {
              id: user.user?.id,
              email: user.user?.email,
              name: validatedData.name,
              warning: '用户档案创建失败，请联系管理员'
            },
            { status: 201 }
          );
        }
        
        return NextResponse.json(
          {
            id: user.user?.id,
            email: user.user?.email,
            name: validatedData.name
          },
          { status: 201 }
        );
      } catch (error: any) {
        console.error('注册过程中发生错误:', error);
        return NextResponse.json(
          { error: '服务器内部错误', details: error.message || '注册过程中发生未知错误' },
          { status: 500 }
        );
      }
    });
  })(request);
}

/**
 * 用户登录
 */
export async function PUT(request: NextRequest) {
  return withCsrfProtection(async (req) => {
    return withValidation(req, (data) => {
      const errors = [];
      
      // 验证必填字段
      if (!data.email) errors.push('邮箱不能为空');
      if (!data.password) errors.push('密码不能为空');
      
      return {
        isValid: errors.length === 0,
        errors,
        data: errors.length === 0 ? data : undefined
      };
    }, async (req, validatedData) => {
      try {
        const supabase = await createClient();
        
        // 用户登录
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password
        });
        
        if (error) {
          console.error('用户登录失败:', error);
          return NextResponse.json(
            { error: '登录失败', details: error.message },
            { status: 401 }
          );
        }
        
        // 获取用户档案
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError) {
          console.error('获取用户档案失败:', profileError);
          // 登录成功但获取档案失败，返回警告
          return NextResponse.json(
            {
              user: {
                id: authData.user.id,
                email: authData.user.email,
                name: authData.user.user_metadata.name
              },
              token: authData.session.access_token,
              warning: '获取用户档案失败，部分功能可能受限'
            },
            { status: 200 }
          );
        }
        
        return NextResponse.json(
          {
            user: {
              id: authData.user.id,
              email: authData.user.email,
              name: profile.name,
              subscription: {
                level: profile.subscription_level,
                expiresAt: profile.subscription_expires_at
              }
            },
            token: authData.session.access_token
          },
          { status: 200 }
        );
      } catch (error: any) {
        console.error('登录过程中发生错误:', error);
        return NextResponse.json(
          { error: '服务器内部错误', details: error.message || '登录过程中发生未知错误' },
          { status: 500 }
        );
      }
    });
  })(request);
}