import { getDatabase } from './database'
import { AssetData } from '@/components/assets/asset-card'

// SQLite到Supabase的数据同步助手
export class SQLiteSyncHelper {
  private static instance: SQLiteSyncHelper
  
  static getInstance(): SQLiteSyncHelper {
    if (!SQLiteSyncHelper.instance) {
      SQLiteSyncHelper.instance = new SQLiteSyncHelper()
    }
    return SQLiteSyncHelper.instance
  }

  // 从SQLite数据库读取资产数据
  async getAssetsFromSQLite(): Promise<AssetData[]> {
    try {
      const db = getDatabase()
      if (!db) {
        console.log('数据库未初始化，返回空数组')
        return []
      }

      // 查询资产数据，联合账户表获取用户信息
      const query = `
        SELECT 
          a.id,
          a.symbol,
          a.name,
          a.type,
          a.quantity,
          a.avg_cost,
          a.current_price,
          a.market_value,
          a.updated_at,
          acc.user_id
        FROM assets a
        JOIN accounts acc ON a.account_id = acc.id
        WHERE acc.is_active = 1
        ORDER BY a.updated_at DESC
      `

      const rows = db.prepare(query).all()
      
      console.log(`从SQLite数据库读取到 ${rows.length} 条资产数据`)

      // 转换为AssetData格式
      const assets: AssetData[] = rows.map((row: any) => {
        const totalCost = (row.avg_cost || 0) * (row.quantity || 0)
        const totalValue = row.market_value || ((row.current_price || 0) * (row.quantity || 0))
        const profitLoss = totalValue - totalCost
        const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0

        return {
          id: `sqlite_${row.id}`, // 添加前缀区分SQLite数据
          name: row.name || '',
          symbol: row.symbol || '',
          logo: '', // SQLite中没有logo字段
          category: this.mapTypeToCategory(row.type),
          currentPrice: parseFloat(row.current_price) || 0,
          purchasePrice: parseFloat(row.avg_cost) || 0,
          quantity: parseFloat(row.quantity) || 0,
          totalValue: totalValue,
          totalCost: totalCost,
          profitLoss: profitLoss,
          profitLossPercent: profitLossPercent,
          dayChange: 0, // SQLite中没有日涨跌数据
          dayChangePercent: 0,
          allocation: 0, // 需要重新计算
          lastUpdated: new Date(row.updated_at).toLocaleString('zh-CN'),
          riskLevel: 'medium' // 默认风险等级
        }
      })

      // 重新计算配置占比
      this.recalculateAllocations(assets)

      return assets
    } catch (error) {
      console.error('从SQLite读取资产数据失败:', error)
      return []
    }
  }

  // 将SQLite资产数据同步到Supabase
  async syncSQLiteToSupabase(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      console.log('开始从SQLite同步数据到Supabase...')
      
      // 1. 读取SQLite中的资产数据
      const sqliteAssets = await this.getAssetsFromSQLite()
      
      if (sqliteAssets.length === 0) {
        return {
          success: true,
          message: 'SQLite数据库中没有资产数据',
          count: 0
        }
      }

      console.log(`准备同步 ${sqliteAssets.length} 条资产数据到云端`)

      // 2. 连接Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // 3. 获取当前用户
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return {
          success: false,
          message: '用户未登录，无法同步到云端',
          count: 0
        }
      }

      // 4. 转换数据格式以适配Supabase
      const assetsForSupabase = sqliteAssets.map(asset => ({
        id: asset.id.replace('sqlite_', ''), // 移除前缀
        user_id: user.id,
        name: asset.name,
        symbol: asset.symbol,
        type: asset.category,
        current_price: asset.currentPrice,
        average_cost: asset.purchasePrice,
        quantity: asset.quantity,
        market_value: asset.totalValue,
        profit_loss: asset.profitLoss,
        profit_loss_percentage: asset.profitLossPercent,
        day_change: asset.dayChange,
        day_change_rate: asset.dayChangePercent,
        weight: asset.allocation,
        last_updated: new Date().toISOString()
      }))

      // 5. 批量上传到Supabase
      let successCount = 0
      const errors: string[] = []

      for (const assetData of assetsForSupabase) {
        try {
          const { error } = await supabase
            .from('assets')
            .upsert([assetData], { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })

          if (error) {
            console.error(`同步资产 ${assetData.name} 失败:`, error)
            errors.push(`${assetData.name}: ${error.message}`)
          } else {
            successCount++
            console.log(`✅ 成功同步资产: ${assetData.name}`)
          }
        } catch (error) {
          console.error(`同步资产 ${assetData.name} 异常:`, error)
          errors.push(`${assetData.name}: ${error}`)
        }
      }

      const message = errors.length > 0 
        ? `同步完成: ${successCount}/${sqliteAssets.length} 成功，${errors.length} 个错误`
        : `成功同步 ${successCount} 条资产数据到云端`

      return {
        success: successCount > 0,
        message,
        count: successCount
      }

    } catch (error) {
      console.error('SQLite到Supabase同步失败:', error)
      return {
        success: false,
        message: `同步失败: ${error}`,
        count: 0
      }
    }
  }

  // 获取SQLite中的交易记录
  async getTransactionsFromSQLite(): Promise<any[]> {
    try {
      const db = getDatabase()
      if (!db) return []

      const query = `
        SELECT 
          t.*,
          acc.user_id,
          a.symbol as asset_symbol,
          a.name as asset_name
        FROM transactions t
        JOIN accounts acc ON t.account_id = acc.id
        LEFT JOIN assets a ON t.asset_id = a.id
        WHERE acc.is_active = 1
        ORDER BY t.transaction_date DESC
        LIMIT 100
      `

      const rows = db.prepare(query).all()
      console.log(`从SQLite读取到 ${rows.length} 条交易记录`)
      
      return rows
    } catch (error) {
      console.error('从SQLite读取交易记录失败:', error)
      return []
    }
  }

  // 类型映射：SQLite类型 -> AssetData类型
  private mapTypeToCategory(sqliteType: string): string {
    const typeMap: { [key: string]: string } = {
      'stock': '股票',
      'fund': '基金',
      'bond': '债券',
      'cash': '现金',
      'crypto': '虚拟货币'
    }
    return typeMap[sqliteType] || '股票'
  }

  // 重新计算配置占比
  private recalculateAllocations(assets: AssetData[]): void {
    const totalValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0)
    
    assets.forEach(asset => {
      asset.allocation = totalValue > 0 ? (asset.totalValue / totalValue) * 100 : 0
    })
  }

  // 检查SQLite数据库状态
  async checkSQLiteStatus(): Promise<{ hasData: boolean; assetCount: number; lastUpdate: string }> {
    try {
      const db = getDatabase()
      if (!db) {
        return { hasData: false, assetCount: 0, lastUpdate: '数据库未初始化' }
      }

      const countQuery = `
        SELECT COUNT(*) as count 
        FROM assets a
        JOIN accounts acc ON a.account_id = acc.id
        WHERE acc.is_active = 1
      `
      
      const countResult = db.prepare(countQuery).get() as { count: number }
      const assetCount = countResult?.count || 0

      let lastUpdate = '无数据'
      if (assetCount > 0) {
        const lastUpdateQuery = `
          SELECT MAX(updated_at) as last_update
          FROM assets a
          JOIN accounts acc ON a.account_id = acc.id
          WHERE acc.is_active = 1
        `
        const updateResult = db.prepare(lastUpdateQuery).get() as { last_update: string }
        lastUpdate = updateResult?.last_update 
          ? new Date(updateResult.last_update).toLocaleString('zh-CN')
          : '未知'
      }

      return {
        hasData: assetCount > 0,
        assetCount,
        lastUpdate
      }
    } catch (error) {
      console.error('检查SQLite状态失败:', error)
      return { hasData: false, assetCount: 0, lastUpdate: '检查失败' }
    }
  }
}

// 导出单例实例
export const sqliteSyncHelper = SQLiteSyncHelper.getInstance()