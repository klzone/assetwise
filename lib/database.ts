import { supabase } from './supabase'
import type { Database } from './supabase'

// 类型别名
type Tables = Database['public']['Tables']
type Asset = Tables['assets']['Row']
type AssetInsert = Tables['assets']['Insert']
type AssetUpdate = Tables['assets']['Update']
type Transaction = Tables['transactions']['Row']
type TransactionInsert = Tables['transactions']['Insert']
type TransactionUpdate = Tables['transactions']['Update']
type Account = Tables['accounts']['Row']
type AccountInsert = Tables['accounts']['Insert']
type AccountUpdate = Tables['accounts']['Update']
type Profile = Tables['profiles']['Row']
type InvestmentPlan = Tables['investment_plans']['Row']
type Review = Tables['reviews']['Row']

// ===== 资产管理 =====

// 获取用户所有资产
export async function getUserAssets(userId: string) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        accounts (
          name,
          type,
          broker
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取用户资产失败:', error)
    return { data: null, error }
  }
}

// 创建新资产
export async function createAsset(asset: AssetInsert) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .insert(asset)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('创建资产失败:', error)
    return { data: null, error }
  }
}

// 更新资产
export async function updateAsset(assetId: string, updates: AssetUpdate) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('更新资产失败:', error)
    return { data: null, error }
  }
}

// 删除资产（软删除）
export async function deleteAsset(assetId: string) {
  try {
    const { data, error } = await supabase
      .from('assets')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('删除资产失败:', error)
    return { data: null, error }
  }
}

// ===== 交易管理 =====

// 获取用户所有交易记录
export async function getUserTransactions(userId: string, limit?: number) {
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        accounts (
          name,
          type,
          broker
        )
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取用户交易记录失败:', error)
    return { data: null, error }
  }
}

// 创建新交易记录
export async function createTransaction(transaction: TransactionInsert) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single()

    if (error) throw error

    // 如果是买入或卖出交易，更新对应资产的持仓信息
    if (data && (transaction.type === 'buy' || transaction.type === 'sell') && transaction.symbol) {
      await updateAssetPosition(transaction.user_id, transaction.symbol, transaction.type, transaction.quantity || 0, transaction.price || 0)
    }

    return { data, error: null }
  } catch (error) {
    console.error('创建交易记录失败:', error)
    return { data: null, error }
  }
}

// 更新交易记录
export async function updateTransaction(transactionId: string, updates: TransactionUpdate) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('更新交易记录失败:', error)
    return { data: null, error }
  }
}

// 删除交易记录
export async function deleteTransaction(transactionId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('删除交易记录失败:', error)
    return { data: null, error }
  }
}

// ===== 账户管理 =====

// 获取用户所有账户
export async function getUserAccounts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取用户账户失败:', error)
    return { data: null, error }
  }
}

// 创建新账户
export async function createAccount(account: AccountInsert) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('创建账户失败:', error)
    return { data: null, error }
  }
}

// 更新账户
export async function updateAccount(accountId: string, updates: AccountUpdate) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('更新账户失败:', error)
    return { data: null, error }
  }
}

// ===== 投资计划管理 =====

// 获取用户投资计划
export async function getUserInvestmentPlans(userId: string) {
  try {
    const { data, error } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取投资计划失败:', error)
    return { data: null, error }
  }
}

// ===== 投资回顾管理 =====

// 获取用户投资回顾
export async function getUserReviews(userId: string, limit?: number) {
  try {
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .order('review_date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取投资回顾失败:', error)
    return { data: null, error }
  }
}

// ===== 统计分析 =====

// 获取用户投资组合概览
export async function getPortfolioOverview(userId: string) {
  try {
    // 获取总资产价值
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('market_value, profit_loss')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (assetsError) throw assetsError

    // 获取账户余额
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (accountsError) throw accountsError

    // 计算总值
    const totalAssetValue = assets?.reduce((sum: number, asset) => sum + (Number(asset.market_value) || 0), 0) || 0
    const totalCashBalance = accounts?.reduce((sum: number, account) => sum + (Number(account.balance) || 0), 0) || 0
    const totalProfitLoss = assets?.reduce((sum: number, asset) => sum + (Number(asset.profit_loss) || 0), 0) || 0

    const overview = {
      totalValue: totalAssetValue + totalCashBalance,
      totalAssetValue,
      totalCashBalance,
      totalProfitLoss,
      profitLossPercentage: totalAssetValue > 0 ? (totalProfitLoss / totalAssetValue) * 100 : 0,
      assetCount: assets?.length || 0,
      accountCount: accounts?.length || 0
    }

    return { data: overview, error: null }
  } catch (error) {
    console.error('获取投资组合概览失败:', error)
    return { data: null, error }
  }
}

// ===== 辅助函数 =====

// 更新资产持仓信息
async function updateAssetPosition(userId: string, symbol: string, transactionType: string, quantity: number, price: number) {
  try {
    // 查找现有资产
    const { data: existingAsset, error: findError } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .eq('is_active', true)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      throw findError
    }

    if (existingAsset) {
      // 更新现有资产
      const currentQuantity = Number(existingAsset.quantity) || 0
      const currentAverageCost = Number(existingAsset.average_cost) || 0

      let newQuantity: number
      let newAverageCost: number

      if (transactionType === 'buy') {
        newQuantity = currentQuantity + quantity
        newAverageCost = ((currentQuantity * currentAverageCost) + (quantity * price)) / newQuantity
      } else { // sell
        newQuantity = Math.max(0, currentQuantity - quantity)
        newAverageCost = currentAverageCost // 卖出时平均成本不变
      }

      await supabase
        .from('assets')
        .update({
          quantity: newQuantity,
          average_cost: newAverageCost,
          market_value: newQuantity * (Number(existingAsset.current_price) || price),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAsset.id)
    } else if (transactionType === 'buy') {
      // 创建新资产（仅在买入时）
      await supabase
        .from('assets')
        .insert({
          user_id: userId,
          symbol: symbol,
          name: symbol, // 可以后续通过API获取真实名称
          type: 'stock', // 默认类型，可以后续更新
          quantity: quantity,
          average_cost: price,
          current_price: price,
          market_value: quantity * price
        })
    }
  } catch (error) {
    console.error('更新资产持仓失败:', error)
  }
}

// 导出所有类型
export type {
  Asset,
  AssetInsert,
  AssetUpdate,
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  Account,
  AccountInsert,
  AccountUpdate,
  Profile,
  InvestmentPlan,
  Review
}