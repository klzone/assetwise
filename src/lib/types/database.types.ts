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
          type: 'securities' | 'fund' | 'cash' | 'crypto' | 'bank'
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
          id?: string
          user_id: string
          name: string
          type: 'securities' | 'fund' | 'cash' | 'crypto' | 'bank'
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
          type?: 'securities' | 'fund' | 'cash' | 'crypto' | 'bank'
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
          id: string
          user_id: string
          account_id: string | null
          type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw'
          symbol: string | null
          name: string | null
          quantity: number | null
          price: number | null
          amount: number
          fee: number | null
          tax: number | null
          notes: string | null
          transaction_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw'
          symbol?: string | null
          name?: string | null
          quantity?: number | null
          price?: number | null
          amount: number
          fee?: number | null
          tax?: number | null
          notes?: string | null
          transaction_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          type?: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw'
          symbol?: string | null
          name?: string | null
          quantity?: number | null
          price?: number | null
          amount?: number
          fee?: number | null
          tax?: number | null
          notes?: string | null
          transaction_date?: string
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
          performance_rating: number | null
          lessons_learned: string | null
          review_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          tags?: string[] | null
          performance_rating?: number | null
          lessons_learned?: string | null
          review_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          tags?: string[] | null
          performance_rating?: number | null
          lessons_learned?: string | null
          review_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          symbol: string
          name: string
          type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund'
          current_price: number | null
          quantity: number
          average_cost: number
          total_value: number
          profit_loss: number
          profit_loss_percentage: number
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          symbol: string
          name: string
          type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund'
          current_price?: number | null
          quantity: number
          average_cost: number
          total_value: number
          profit_loss: number
          profit_loss_percentage: number
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          symbol?: string
          name?: string
          type?: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund'
          current_price?: number | null
          quantity?: number
          average_cost?: number
          total_value?: number
          profit_loss?: number
          profit_loss_percentage?: number
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      investment_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_amount: number
          current_amount: number
          target_date: string
          status: 'active' | 'completed' | 'paused' | 'cancelled'
          risk_level: 'low' | 'medium' | 'high'
          category: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund'
          expected_return: number
          actual_return: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_amount: number
          current_amount?: number
          target_date: string
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          risk_level: 'low' | 'medium' | 'high'
          category: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund'
          expected_return?: number
          actual_return?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_amount?: number
          current_amount?: number
          target_date?: string
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          risk_level?: 'low' | 'medium' | 'high'
          category?: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund'
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
      asset_type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund'
      transaction_type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw'
      plan_status: 'active' | 'completed' | 'paused' | 'cancelled'
      risk_level: 'low' | 'medium' | 'high'
      account_type: 'securities' | 'fund' | 'cash' | 'crypto' | 'bank'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
