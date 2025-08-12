'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database-new.types'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']
type Transaction = Tables['transactions']['Row']
type Review = Tables['reviews']['Row']
type Asset = Tables['assets']['Row']
type InvestmentPlan = Tables['investment_plans']['Row']

export class SupabaseDataService {
  private supabase = getSupabaseBrowserClient()

  // 用户档案相关方法
  async getUserProfile(userId: string): Promise<any> {
    try {
      console.log('🔍 开始获取用户档案:', { userId });

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('获取用户档案失败:', {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          userId
        });
        return null
      }

      console.log('✅ 用户档案获取成功:', data);
      return data
    } catch (error: any) {
      console.error('获取用户档案错误:', {
        message: error.message,
        stack: error.stack,
        userId
      });
      return null
    }
  }

  // 投资账户相关方法
  async getAccounts(userId: string): Promise<Account[]> {
    try {
      console.log('🔍 开始查询账户数据:', { userId, userIdType: typeof userId });

      const { data, error } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      console.log('📊 Supabase账户查询结果:', {
        data: data ? `${data.length} 条记录` : 'null',
        error: error ? error.message : 'none',
        userId
      });

      if (error) {
        console.error('❌ 获取投资账户失败:', {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          userId
        });
        return []
      }

      if (data && data.length > 0) {
        console.log('✅ 账户数据查询成功:', data.length, '条记录');
        console.log('📋 第一条记录示例:', data[0]);
      } else {
        console.log('⚠️ 账户数据查询结果为空');
      }

      return data || []
    } catch (error) {
      console.error('❌ 获取投资账户错误:', error)
      return []
    }
  }

  async createAccount(account: Tables['accounts']['Insert']): Promise<{ success: boolean; error?: string; data?: Account }> {
    try {
      console.log('🔄 Supabase创建账户请求:', account);

      const { data, error } = await this.supabase
        .from('accounts')
        .insert(account)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase创建账户失败:', error);
        return {
          success: false,
          error: `数据库错误: ${error.message} (代码: ${error.code || 'unknown'})`
        }
      }

      console.log('✅ Supabase创建账户成功:', data);
      return { success: true, data }
    } catch (error) {
      console.error('💥 创建投资账户异常:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return {
        success: false,
        error: `创建账户失败: ${errorMessage}`
      }
    }
  }

  async updateAccount(id: string, updates: Tables['accounts']['Update']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('更新投资账户错误:', error)
      return { success: false, error: '更新投资账户失败' }
    }
  }

  async deleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('accounts')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('删除投资账户错误:', error)
      return { success: false, error: '删除投资账户失败' }
    }
  }

  // 交易记录相关方法
  async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      console.log('🔍 开始查询交易数据:', { userId, userIdType: typeof userId });

      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })

      console.log('📊 Supabase交易查询结果:', {
        data: data ? `${data.length} 条记录` : 'null',
        error: error ? error.message : 'none',
        userId
      });

      if (error) {
        console.error('❌ 获取交易记录失败:', {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          userId
        });
        return []
      }

      if (data && data.length > 0) {
        console.log('✅ 交易数据查询成功:', data.length, '条记录');
        console.log('📋 第一条记录示例:', data[0]);
      } else {
        console.log('⚠️ 交易数据查询结果为空');
      }

      return data || []
    } catch (error) {
      console.error('❌ 获取交易记录错误:', error)
      return []
    }
  }

  async createTransaction(transaction: Tables['transactions']['Insert']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .insert(transaction)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('创建交易记录错误:', error)
      return { success: false, error: '创建交易记录失败' }
    }
  }

  async updateTransaction(id: string, updates: Tables['transactions']['Update']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('更新交易记录错误:', error)
      return { success: false, error: '更新交易记录失败' }
    }
  }

  async deleteTransaction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('删除交易记录错误:', error)
      return { success: false, error: '删除交易记录失败' }
    }
  }

  // 复盘日志相关方法
  async getReviews(userId: string): Promise<Review[]> {
    try {
      const { data, error } = await this.supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .order('review_date', { ascending: false })

      if (error) {
        console.error('获取复盘日志失败:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('获取复盘日志错误:', error)
      return []
    }
  }

  async createReview(review: Tables['reviews']['Insert']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('reviews')
        .insert(review)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('创建复盘日志错误:', error)
      return { success: false, error: '创建复盘日志失败' }
    }
  }

  async updateReview(id: string, updates: Tables['reviews']['Update']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('reviews')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('更新复盘日志错误:', error)
      return { success: false, error: '更新复盘日志失败' }
    }
  }

  async deleteReview(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('reviews')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('删除复盘日志错误:', error)
      return { success: false, error: '删除复盘日志失败' }
    }
  }

  // 资产相关方法
  async getAssets(userId: string): Promise<Asset[]> {
    try {
      console.log('🔍 开始查询资产数据:', { userId, userIdType: typeof userId });

      const { data, error } = await this.supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      console.log('📊 Supabase资产查询结果:', {
        data: data ? `${data.length} 条记录` : 'null',
        error: error ? error.message : 'none',
        userId
      });

      if (error) {
        console.error('❌ 获取资产失败:', {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          userId
        });
        return []
      }

      if (data && data.length > 0) {
        console.log('✅ 资产数据查询成功:', data.length, '条记录');
        console.log('📋 第一条记录示例:', data[0]);
      } else {
        console.log('⚠️ 资产数据查询结果为空');
      }

      return data || []
    } catch (error) {
      console.error('❌ 获取资产错误:', error)
      return []
    }
  }

  async createAsset(asset: Tables['assets']['Insert']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('assets')
        .insert(asset)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('创建资产错误:', error)
      return { success: false, error: '创建资产失败' }
    }
  }

  async updateAsset(id: string, updates: Tables['assets']['Update']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('assets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('更新资产错误:', error)
      return { success: false, error: '更新资产失败' }
    }
  }

  async deleteAsset(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('assets')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('删除资产错误:', error)
      return { success: false, error: '删除资产失败' }
    }
  }

  // 投资计划相关方法
  async getInvestmentPlans(userId: string): Promise<InvestmentPlan[]> {
    try {
      console.log('正在获取投资计划，用户ID:', userId);

      const { data, error } = await this.supabase
        .from('investment_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取投资计划失败:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`获取投资计划失败: ${error.message}`);
      }

      console.log('成功获取投资计划:', data?.length || 0, '条记录');
      return data || []
    } catch (error) {
      console.error('获取投资计划错误:', error);
      throw error;
    }
  }

  async createInvestmentPlan(planData: Tables['investment_plans']['Insert']): Promise<{ success: boolean; error?: string; data?: InvestmentPlan }> {
    try {
      const { data, error } = await this.supabase
        .from('investment_plans')
        .insert(planData)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('创建投资计划错误:', error)
      return { success: false, error: '创建投资计划失败' }
    }
  }

  async updateInvestmentPlan(id: string, updates: Tables['investment_plans']['Update']): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('investment_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('更新投资计划错误:', error)
      return { success: false, error: '更新投资计划失败' }
    }
  }

  async deleteInvestmentPlan(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('investment_plans')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('删除投资计划错误:', error)
      return { success: false, error: '删除投资计划失败' }
    }
  }
}

export const supabaseDataService = new SupabaseDataService()
