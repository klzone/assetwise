// AssetWise 新数据库类型定义
// 基于重新设计的数据库结构

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
          full_name: string | null
          avatar_url: string | null
          // 新增字段
          phone: string | null
          location: string | null
          bio: string | null
          // 订阅信息
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
          id: string  // 修改为UUID字符串
          user_id: string
          name: string
          type: 'securities' | 'stock' | 'fund' | 'cash' | 'crypto' | 'bank' | 'futures' | 'forex' | 'commodity' | 'insurance' | 'pension' | 'education' | 'real_estate' | 'p2p' | 'bond' | 'option'
          broker: string | null
          account_number: string | null
          currency: string
          balance: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          type: 'securities' | 'stock' | 'fund' | 'cash' | 'crypto' | 'bank' | 'futures' | 'forex' | 'commodity' | 'insurance' | 'pension' | 'education' | 'real_estate' | 'p2p' | 'bond' | 'option'
          broker?: string | null
          account_number?: string | null
          currency?: string
          balance?: number
          description?: string | null
          is_active?: boolean
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
          currency?: string
          balance?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string  // 修改为UUID字符串
          user_id: string
          account_id: string | null  // 修改为UUID字符串
          type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw' | 'split' | 'merge' | 'bonus' | 'rights'
          symbol: string | null
          name: string | null
          quantity: number | null
          price: number | null
          amount: number
          fee: number
          tax: number
          currency: string | null
          exchange: string | null
          notes: string | null
          transaction_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          account_id?: string | null
          type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw' | 'split' | 'merge' | 'bonus' | 'rights'
          symbol?: string | null
          name?: string | null
          quantity?: number | null
          price?: number | null
          amount: number
          fee?: number
          tax?: number
          currency?: string | null
          exchange?: string | null
          notes?: string | null
          transaction_date?: string
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
          fee?: number
          tax?: number
          currency?: string | null
          exchange?: string | null
          notes?: string | null
          transaction_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: number  // 改为数字ID
          user_id: string
          title: string
          content: string
          tags: string[] | null
          // 情绪分析字段
          emotion_score: number | null
          mood: 'positive' | 'neutral' | 'negative' | null
          // 关联数据
          related_transactions: number[] | null
          // 扩展字段
          lessons_learned: string | null
          next_plan: string | null
          profit: number | null
          profit_rate: number | null
          // 日期
          review_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          content: string
          tags?: string[] | null
          emotion_score?: number | null
          mood?: 'positive' | 'neutral' | 'negative' | null
          related_transactions?: number[] | null
          lessons_learned?: string | null
          next_plan?: string | null
          profit?: number | null
          profit_rate?: number | null
          review_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          content?: string
          tags?: string[] | null
          emotion_score?: number | null
          mood?: 'positive' | 'neutral' | 'negative' | null
          related_transactions?: number[] | null
          lessons_learned?: string | null
          next_plan?: string | null
          profit?: number | null
          profit_rate?: number | null
          review_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: number  // 改为数字ID
          user_id: string
          account_id: number | null  // 改为数字ID
          symbol: string
          name: string
          type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'cash'
          // 价格和数量
          current_price: number | null
          quantity: number
          average_cost: number
          market_value: number
          // 收益分析
          profit_loss: number
          profit_loss_percentage: number
          day_change: number
          day_change_rate: number
          weight: number
          // 风险分析字段
          volatility: number | null
          beta: number | null
          sharpe_ratio: number | null
          max_drawdown: number | null
          // 时间戳
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          account_id?: number | null
          symbol: string
          name: string
          type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'cash'
          current_price?: number | null
          quantity: number
          average_cost: number
          market_value: number
          profit_loss: number
          profit_loss_percentage: number
          day_change?: number
          day_change_rate?: number
          weight?: number
          volatility?: number | null
          beta?: number | null
          sharpe_ratio?: number | null
          max_drawdown?: number | null
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          account_id?: number | null
          symbol?: string
          name?: string
          type?: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'cash'
          current_price?: number | null
          quantity?: number
          average_cost?: number
          market_value?: number
          profit_loss?: number
          profit_loss_percentage?: number
          day_change?: number
          day_change_rate?: number
          weight?: number
          volatility?: number | null
          beta?: number | null
          sharpe_ratio?: number | null
          max_drawdown?: number | null
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      investment_plans: {
        Row: {
          id: number  // 改为数字ID
          user_id: string
          title: string
          description: string | null
          target_amount: number
          current_amount: number
          target_date: string
          status: 'active' | 'completed' | 'paused' | 'cancelled'
          risk_level: 'low' | 'medium' | 'high'
          category: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'cash'
          expected_return: number
          actual_return: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          description?: string | null
          target_amount: number
          current_amount?: number
          target_date: string
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          risk_level: 'low' | 'medium' | 'high'
          category: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'cash'
          expected_return?: number
          actual_return?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          target_amount?: number
          current_amount?: number
          target_date?: string
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          risk_level?: 'low' | 'medium' | 'high'
          category?: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'cash'
          expected_return?: number
          actual_return?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_type: 'free' | 'professional' | 'flagship'
      asset_type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'cash'
      transaction_type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw' | 'split' | 'merge'
      plan_status: 'active' | 'completed' | 'paused' | 'cancelled'
      risk_level: 'low' | 'medium' | 'high'
      account_type: 'securities' | 'fund' | 'cash' | 'crypto' | 'bank'
      mood_type: 'positive' | 'neutral' | 'negative'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
