import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 使用单例模式创建Supabase客户端，避免重复创建
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const createSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }
  return supabaseInstance
}

// 导出默认客户端实例
export const supabase = createSupabaseClient()

// 数据库类型定义 - 基于实际Supabase表结构
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          location: string | null
          bio: string | null
          subscription_type: 'free' | 'professional' | 'flagship'
          subscription_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          subscription_type?: 'free' | 'professional' | 'flagship'
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          subscription_type?: 'free' | 'professional' | 'flagship'
          subscription_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'securities' | 'stock' | 'fund' | 'cash' | 'crypto' | 'bank' | 'futures' | 'forex' | 'commodity' | 'insurance' | 'pension' | 'education' | 'real_estate' | 'p2p' | 'bond' | 'option'
          broker: string | null
          account_number: string | null
          currency: string | null
          balance: number | null
          initial_balance: number | null
          description: string | null
          is_active: boolean | null
          risk_level: 'low' | 'medium' | 'high' | null
          status: 'active' | 'inactive' | 'closed' | 'frozen' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'securities' | 'stock' | 'fund' | 'cash' | 'crypto' | 'bank' | 'futures' | 'forex' | 'commodity' | 'insurance' | 'pension' | 'education' | 'real_estate' | 'p2p' | 'bond' | 'option'
          broker?: string | null
          account_number?: string | null
          currency?: string | null
          balance?: number | null
          initial_balance?: number | null
          description?: string | null
          is_active?: boolean | null
          risk_level?: 'low' | 'medium' | 'high' | null
          status?: 'active' | 'inactive' | 'closed' | 'frozen' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'securities' | 'stock' | 'fund' | 'cash' | 'crypto' | 'bank' | 'futures' | 'forex' | 'commodity' | 'insurance' | 'pension' | 'education' | 'real_estate' | 'p2p' | 'bond' | 'option'
          broker?: string | null
          account_number?: string | null
          currency?: string | null
          balance?: number | null
          initial_balance?: number | null
          description?: string | null
          is_active?: boolean | null
          risk_level?: 'low' | 'medium' | 'high' | null
          status?: 'active' | 'inactive' | 'closed' | 'frozen' | null
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          user_id: string
          symbol: string
          name: string
          type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'real_estate' | 'option' | 'futures'
          exchange: string | null
          currency: string | null
          current_price: number | null
          market_cap: number | null
          description: string | null
          is_active: boolean | null
          account_id: string | null
          quantity: number | null
          average_cost: number | null
          market_value: number | null
          profit_loss: number | null
          profit_loss_percentage: number | null
          day_change: number | null
          day_change_rate: number | null
          weight: number | null
          volatility: number | null
          beta: number | null
          sharpe_ratio: number | null
          max_drawdown: number | null
          last_updated: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          name: string
          type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'real_estate' | 'option' | 'futures'
          exchange?: string | null
          currency?: string | null
          current_price?: number | null
          market_cap?: number | null
          description?: string | null
          is_active?: boolean | null
          account_id?: string | null
          quantity?: number | null
          average_cost?: number | null
          market_value?: number | null
          profit_loss?: number | null
          profit_loss_percentage?: number | null
          day_change?: number | null
          day_change_rate?: number | null
          weight?: number | null
          volatility?: number | null
          beta?: number | null
          sharpe_ratio?: number | null
          max_drawdown?: number | null
          last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          name?: string
          type?: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'real_estate' | 'option' | 'futures'
          exchange?: string | null
          currency?: string | null
          current_price?: number | null
          market_cap?: number | null
          description?: string | null
          is_active?: boolean | null
          account_id?: string | null
          quantity?: number | null
          average_cost?: number | null
          market_value?: number | null
          profit_loss?: number | null
          profit_loss_percentage?: number | null
          day_change?: number | null
          day_change_rate?: number | null
          weight?: number | null
          volatility?: number | null
          beta?: number | null
          sharpe_ratio?: number | null
          max_drawdown?: number | null
          last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw' | 'split' | 'merge' | 'bonus' | 'rights'
          symbol: string | null
          name: string | null
          quantity: number | null
          price: number | null
          amount: number
          fee: number | null
          tax: number | null
          currency: string | null
          exchange: string | null
          notes: string | null
          transaction_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw' | 'split' | 'merge' | 'bonus' | 'rights'
          symbol?: string | null
          name?: string | null
          quantity?: number | null
          price?: number | null
          amount: number
          fee?: number | null
          tax?: number | null
          currency?: string | null
          exchange?: string | null
          notes?: string | null
          transaction_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          type?: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw' | 'split' | 'merge' | 'bonus' | 'rights'
          symbol?: string | null
          name?: string | null
          quantity?: number | null
          price?: number | null
          amount?: number
          fee?: number | null
          tax?: number | null
          currency?: string | null
          exchange?: string | null
          notes?: string | null
          transaction_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      investment_plans: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          target_amount: number | null
          current_amount: number | null
          target_date: string | null
          status: 'active' | 'completed' | 'paused' | 'cancelled' | null
          risk_level: 'low' | 'medium' | 'high' | null
          asset_allocation: any | null
          notes: string | null
          title: string | null
          category: string | null
          expected_return: number | null
          actual_return: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          target_amount?: number | null
          current_amount?: number | null
          target_date?: string | null
          status?: 'active' | 'completed' | 'paused' | 'cancelled' | null
          risk_level?: 'low' | 'medium' | 'high' | null
          asset_allocation?: any | null
          notes?: string | null
          title?: string | null
          category?: string | null
          expected_return?: number | null
          actual_return?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          target_amount?: number | null
          current_amount?: number | null
          target_date?: string | null
          status?: 'active' | 'completed' | 'paused' | 'cancelled' | null
          risk_level?: 'low' | 'medium' | 'high' | null
          asset_allocation?: any | null
          notes?: string | null
          title?: string | null
          category?: string | null
          expected_return?: number | null
          actual_return?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          tags: string[] | null
          mood: number | null
          market_condition: string | null
          lessons_learned: string | null
          action_items: string[] | null
          is_public: boolean | null
          emotion_score: number | null
          related_transactions: string[] | null
          review_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          tags?: string[] | null
          mood?: number | null
          market_condition?: string | null
          lessons_learned?: string | null
          action_items?: string[] | null
          is_public?: boolean | null
          emotion_score?: number | null
          related_transactions?: string[] | null
          review_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          tags?: string[] | null
          mood?: number | null
          market_condition?: string | null
          lessons_learned?: string | null
          action_items?: string[] | null
          is_public?: boolean | null
          emotion_score?: number | null
          related_transactions?: string[] | null
          review_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// 类型化的Supabase客户端
export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>