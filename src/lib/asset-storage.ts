import { AssetData } from '@/components/assets/asset-card'
import { priceManager } from './price-manager'
import { SellTransactionData, Transaction, TransactionType } from './transaction-types'

const STORAGE_KEY = 'assetwise_assets'
const SYNC_KEY = 'assetwise_sync_timestamp'
const TRANSACTIONS_KEY = 'assetwise_transactions'

export interface AssetStorageData {
  assets: AssetData[]
  lastSync: number
  version: number
}

// 交易记录存储数据
export interface TransactionStorageData {
  transactions: Transaction[]
  lastSync: number
  version: number
}

// 本地存储管理
export class AssetStorage {
  private static instance: AssetStorage
  private syncInProgress = false

  static getInstance(): AssetStorage {
    if (!AssetStorage.instance) {
      AssetStorage.instance = new AssetStorage()
    }
    return AssetStorage.instance
  }

  // 获取本地资产数据（过滤已删除的资产）
  getLocalAssets(): AssetData[] {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          const parsed: AssetStorageData = JSON.parse(data)
          const assets = parsed.assets || []
          
          // 过滤掉已删除的资产
          const activeAssets = assets.filter(asset => !asset.isDeleted)
          
          // 自动清理重复资产
          const cleanedAssets = this.removeDuplicateAssets(activeAssets)
          if (cleanedAssets.length !== activeAssets.length) {
            console.log(`清理了 ${activeAssets.length - cleanedAssets.length} 个重复资产`)
            this.saveLocalAssets(cleanedAssets)
            return cleanedAssets
          }
          
          return activeAssets
        }
      }
    } catch (error) {
      console.error('读取本地资产数据失败:', error)
    }
    return []
  }

  // 获取所有资产数据（包括已删除的，用于同步）
  getAllAssets(): AssetData[] {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          const parsed: AssetStorageData = JSON.parse(data)
          return parsed.assets || []
        }
      }
    } catch (error) {
      console.error('读取所有资产数据失败:', error)
    }
    return []
  }

  // 保存资产到本地存储
  saveLocalAssets(assets: AssetData[]): void {
    try {
      if (typeof window !== 'undefined') {
        const storageData: AssetStorageData = {
          assets,
          lastSync: Date.now(),
          version: 1
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
        localStorage.setItem(SYNC_KEY, Date.now().toString())
      }
    } catch (error) {
      console.error('保存本地资产数据失败:', error)
    }
  }

  // 添加新资产
  addAsset(asset: Omit<AssetData, 'id'>): AssetData {
    // 确保计算正确的总成本
    const totalCost = asset.purchasePrice * asset.quantity;
    
    const newAsset: AssetData = {
      ...asset,
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      totalCost: totalCost, // 确保总成本正确设置
      lastUpdated: new Date().toLocaleString('zh-CN')
    }

    const assets = this.getLocalAssets()
    const updatedAssets = [...assets, newAsset]
    
    // 创建买入交易记录
    this.addTransaction({
      assetId: newAsset.id,
      type: TransactionType.BUY,
      date: new Date(), // 今天的日期
      price: asset.purchasePrice,
      quantity: asset.quantity,
      totalAmount: totalCost,
      notes: '初始买入'
    })
    
    // 初始化价格数据
    priceManager.initializeAssetPrice(newAsset)
    
    // 重新计算配置占比和盈亏
    this.recalculateAssetsWithPrices(updatedAssets)
    this.saveLocalAssets(updatedAssets)
    
    // 触发云端同步
    this.syncToCloud(updatedAssets)
    
    return newAsset
  }

  // 更新资产
  updateAsset(id: string, updates: Partial<AssetData>): boolean {
    const assets = this.getLocalAssets()
    const index = assets.findIndex(asset => asset.id === id)
    
    if (index === -1) return false
    
    // 标记是否需要重新计算盈亏（如果手动设置了盈亏相关字段，则不重新计算）
    const hasManualProfitLoss = updates.profitLoss !== undefined || updates.profitLossPercent !== undefined
    
    // 如果更新了价格或数量，重新计算总成本和总价值（但不覆盖手动设置的值）
    if (updates.purchasePrice !== undefined || updates.quantity !== undefined) {
      const purchasePrice = updates.purchasePrice !== undefined ? updates.purchasePrice : assets[index].purchasePrice;
      const quantity = updates.quantity !== undefined ? updates.quantity : assets[index].quantity;
      // 只有在没有手动设置总成本时才重新计算
      if (updates.totalCost === undefined) {
        updates.totalCost = purchasePrice * quantity;
      }
    }
    
    // 如果更新了当前价格，重新计算总价值（但不覆盖手动设置的值）
    if (updates.currentPrice !== undefined && updates.totalValue === undefined) {
      const quantity = updates.quantity !== undefined ? updates.quantity : assets[index].quantity;
      updates.totalValue = updates.currentPrice * quantity;
    }
    
    assets[index] = {
      ...assets[index],
      ...updates,
      lastUpdated: new Date().toLocaleString('zh-CN')
    }
    
    // 只有在没有手动设置盈亏数据时才重新计算
    if (!hasManualProfitLoss) {
      this.recalculateAssetsWithPrices(assets)
    } else {
      // 只重新计算配置占比
      this.recalculateAllocations(assets)
    }
    
    this.saveLocalAssets(assets)
    this.syncToCloud(assets)
    
    return true
  }

  // 删除资产（软删除，添加删除标记）
  deleteAsset(id: string): boolean {
    try {
      const data = this.getStorageData()
      const assetIndex = data.assets.findIndex(asset => asset.id === id)
      
      if (assetIndex === -1) {
        return false
      }
      
      // 添加删除标记而不是直接删除
      const asset = data.assets[assetIndex]
      asset.isDeleted = true
      asset.deletedAt = new Date().toISOString()
      asset.lastUpdated = new Date().toISOString()
      
      // 保存数据
      this.saveStorageData(data)
      
      // 标记需要同步
      this.markNeedsSync()
      
      return true
    } catch (error) {
      console.error('删除资产失败:', error)
      return false
    }
  }

  // 永久删除资产（真正删除）
  permanentDeleteAsset(id: string): boolean {
    try {
      const data = this.getStorageData()
      const assetIndex = data.assets.findIndex(asset => asset.id === id)
      
      if (assetIndex === -1) {
        return false
      }
      
      // 删除资产
      data.assets.splice(assetIndex, 1)
      
      // 删除相关交易记录
      const transactions = this.getTransactions()
      const filteredTransactions = transactions.filter(transaction => transaction.assetId !== id)
      this.saveTransactions(filteredTransactions)
      
      // 保存资产数据
      this.saveStorageData(data)
      
      // 标记需要同步
      this.markNeedsSync()
      
      console.log(`永久删除资产成功: ${id}`)
      return true
    } catch (error) {
      console.error('永久删除资产失败:', error)
      return false
    }
  }

  // 重新计算资产数据（包含价格信息）
  private recalculateAssetsWithPrices(assets: AssetData[]): void {
    assets.forEach(asset => {
      // 确保总成本正确计算
      if (!asset.totalCost || asset.totalCost <= 0) {
        asset.totalCost = asset.purchasePrice * asset.quantity;
      }
      
      // 获取当前价格数据并计算盈亏
      const profitLoss = priceManager.calculateAssetProfitLoss(asset)
      
      // 更新资产的计算字段
      asset.currentPrice = profitLoss.currentPrice
      asset.totalValue = profitLoss.totalValue
      asset.profitLoss = profitLoss.profitLoss
      asset.profitLossPercent = profitLoss.profitLossPercent
      asset.dayChange = profitLoss.dayChange
      asset.dayChangePercent = profitLoss.dayChangePercent
    })
    
    // 重新计算配置占比
    this.recalculateAllocations(assets)
  }

  // 重新计算资产配置占比
  private recalculateAllocations(assets: AssetData[]): void {
    const totalValue = assets.reduce((sum, asset) => sum + (asset.totalValue || 0), 0)
    
    assets.forEach(asset => {
      asset.allocation = totalValue > 0 ? (asset.totalValue / totalValue) * 100 : 0
    })
  }

  // 获取资产数据（包含最新价格信息）
  getAssetsWithLatestPrices(): AssetData[] {
    const assets = this.getLocalAssets()
    this.recalculateAssetsWithPrices(assets)
    return assets
  }

  // 云端同步（真实 Supabase 实现）
  async syncToCloud(assets?: AssetData[]): Promise<boolean> {
    if (this.syncInProgress) {
      console.log('同步正在进行中，跳过本次同步')
      return false
    }
    
    this.syncInProgress = true
    
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // 获取当前用户
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('用户未登录:', userError)
        return false
      }

      // 获取所有资产（包括已删除的）进行同步
      const allAssets = assets || this.getAllAssets()
      console.log('开始同步资产到云端:', allAssets.length, '项资产（包括已删除）')

      // 处理已删除的资产
      const deletedAssets = allAssets.filter(asset => asset.isDeleted)
      if (deletedAssets.length > 0) {
        console.log('处理已删除的资产:', deletedAssets.length, '项')
        for (const deletedAsset of deletedAssets) {
          try {
            const { error: deleteError } = await supabase
              .from('assets')
              .delete()
              .eq('id', deletedAsset.id)
              .eq('user_id', user.id)
            
            if (deleteError) {
              console.error(`删除云端资产 ${deletedAsset.name} 失败:`, deleteError)
            } else {
              console.log(`成功删除云端资产: ${deletedAsset.name}`)
            }
          } catch (error) {
            console.error(`删除云端资产 ${deletedAsset.name} 异常:`, error)
          }
        }
      }

      // 处理活跃资产
      const activeAssets = allAssets.filter(asset => !asset.isDeleted)
      console.log('同步活跃资产:', activeAssets.length, '项')

      // 转换资产数据格式以适配数据库字段
      const assetsForDB = activeAssets.map(asset => {
        // 将字符串ID转换为UUID格式，如果不是UUID则生成新的
        let assetId = asset.id
        if (!asset.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // 如果不是UUID格式，生成一个基于原ID的确定性UUID
          const crypto = require('crypto')
          const hash = crypto.createHash('md5').update(asset.id).digest('hex')
          assetId = [
            hash.substr(0, 8),
            hash.substr(8, 4),
            hash.substr(12, 4),
            hash.substr(16, 4),
            hash.substr(20, 12)
          ].join('-')
        }

        // 映射资产类型到数据库枚举
        const mapCategoryToType = (category: string): string => {
          const typeMap: { [key: string]: string } = {
            '股票': 'stock',
            '科技股': 'stock',
            '金融股': 'stock',
            '消费股': 'stock',
            '医疗股': 'stock',
            '能源股': 'stock',
            '工业股': 'stock',
            '房地产股': 'stock',
            '公用事业股': 'stock',
            '虚拟货币': 'crypto',
            '比特币': 'crypto',
            '以太坊': 'crypto',
            '其他主流币': 'crypto',
            '山寨币': 'crypto',
            '稳定币': 'crypto',
            'DeFi代币': 'crypto',
            'NFT': 'crypto',
            '基金': 'fund',
            '股票基金': 'fund',
            '债券基金': 'fund',
            '混合基金': 'fund',
            '货币基金': 'fund',
            'ETF基金': 'fund',
            '指数基金': 'fund',
            'QDII基金': 'fund',
            '债券': 'bond',
            '国债': 'bond',
            '企业债': 'bond',
            '可转债': 'bond',
            '地方债': 'bond',
            '金融债': 'bond',
            '短期债券': 'bond',
            '长期债券': 'bond',
            '大宗商品': 'commodity',
            '原油': 'commodity',
            '天然气': 'commodity',
            '农产品': 'commodity',
            '工业金属': 'commodity',
            '商品期货': 'commodity',
            '商品基金': 'commodity',
            '贵金属': 'commodity',
            '黄金': 'commodity',
            '白银': 'commodity',
            '铂金': 'commodity',
            '钯金': 'commodity',
            '黄金ETF': 'commodity',
            '贵金属基金': 'commodity'
          }
          return typeMap[category] || 'stock'
        }

        return {
          id: assetId,
          user_id: user.id,
          name: asset.name || '',
          symbol: asset.symbol || '',
          type: mapCategoryToType(asset.category), // 正确映射类型
          current_price: asset.currentPrice || 0,
          average_cost: asset.purchasePrice || 0,
          quantity: asset.quantity || 0,
          total_value: asset.totalValue || 0, // 使用正确的字段名
          profit_loss: asset.profitLoss || 0,
          profit_loss_percentage: asset.profitLossPercent || 0,
          last_updated: new Date().toISOString()
        }
      })

      console.log('准备同步的数据:', assetsForDB)

      // 逐个插入或更新资产数据，确保每个都成功
      let successCount = 0
      for (const assetData of assetsForDB) {
        try {
          const { error: upsertError } = await supabase
            .from('assets')
            .upsert([assetData], { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })

          if (upsertError) {
            console.error(`同步资产 ${assetData.name} 失败:`, upsertError)
          } else {
            successCount++
            console.log(`成功同步资产: ${assetData.name}`)
          }
        } catch (error) {
          console.error(`同步资产 ${assetData.name} 异常:`, error)
        }
      }
      
      console.log(`资产数据同步完成: ${successCount}/${activeAssets.length} 项成功`)
      return successCount === activeAssets.length
    } catch (error) {
      console.error('云端同步失败:', error)
      return false
    } finally {
      this.syncInProgress = false
    }
  }

  // 从云端同步数据（真实 Supabase 实现）
  async syncFromCloud(): Promise<AssetData[]> {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // 获取当前用户
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('用户未登录:', userError)
        return this.getLocalAssets()
      }

      // 先将本地数据同步到云端，确保不丢失本地新增的数据
      const localAssets = this.getLocalAssets()
      if (localAssets.length > 0) {
        console.log('先同步本地数据到云端...')
        await this.syncToCloud(localAssets)
      }

      // 从云端获取资产数据
      const { data: cloudAssets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('从云端获取数据失败:', error)
        return this.getLocalAssets()
      }

      // 如果云端没有数据，保持本地数据不变
      if (!cloudAssets || cloudAssets.length === 0) {
        console.log('云端暂无数据，保持本地数据')
        return localAssets
      }

      // 转换数据格式 - 修复字段映射
      const convertedAssets: AssetData[] = cloudAssets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        logo: '', // 数据库中没有logo字段
        category: asset.type, // type -> category
        currentPrice: parseFloat(asset.current_price) || 0,
        purchasePrice: parseFloat(asset.average_cost) || 0, // average_cost -> purchasePrice
        quantity: parseFloat(asset.quantity) || 0,
        totalValue: parseFloat(asset.market_value) || 0, // market_value -> totalValue
        totalCost: parseFloat(asset.average_cost) * parseFloat(asset.quantity) || 0, // 计算总成本
        profitLoss: parseFloat(asset.profit_loss) || 0,
        profitLossPercent: parseFloat(asset.profit_loss_percentage) || 0, // profit_loss_percentage -> profitLossPercent
        dayChange: parseFloat(asset.day_change) || 0,
        dayChangePercent: parseFloat(asset.day_change_rate) || 0, // day_change_rate -> dayChangePercent
        allocation: parseFloat(asset.weight) || 0, // weight -> allocation
        lastUpdated: new Date(asset.last_updated || asset.updated_at).toLocaleString('zh-CN'),
        riskLevel: 'medium' // 数据库中没有risk_level字段
      }))

      // 合并本地和云端数据，避免数据丢失
      const mergedAssets = this.mergeAssets(localAssets, convertedAssets)
      
      // 保存合并后的数据到本地存储
      this.saveLocalAssets(mergedAssets)
      
      console.log('从云端同步数据完成:', mergedAssets.length, '项资产')
      return mergedAssets
    } catch (error) {
      console.error('从云端同步失败:', error)
      return this.getLocalAssets()
    }
  }

  // 合并本地和云端资产数据，避免重复
  private mergeAssets(localAssets: AssetData[], cloudAssets: AssetData[]): AssetData[] {
    const merged = new Map<string, AssetData>()
    
    // 先添加云端数据
    cloudAssets.forEach(asset => {
      // 使用资产的唯一标识符（名称+符号）来检测重复
      const uniqueKey = `${asset.name}-${asset.symbol}`.toLowerCase()
      
      // 检查是否已存在相同的资产
      let existingKey = null
      for (const [key, existingAsset] of merged.entries()) {
        const existingUniqueKey = `${existingAsset.name}-${existingAsset.symbol}`.toLowerCase()
        if (existingUniqueKey === uniqueKey) {
          existingKey = key
          break
        }
      }
      
      if (existingKey) {
        // 如果存在重复，合并数量和成本
        const existing = merged.get(existingKey)!
        existing.quantity += asset.quantity
        existing.totalCost += asset.totalCost
        existing.totalValue = existing.quantity * existing.currentPrice
        existing.profitLoss = existing.totalValue - existing.totalCost
        existing.profitLossPercent = existing.totalCost > 0 ? (existing.profitLoss / existing.totalCost) * 100 : 0
        existing.purchasePrice = existing.totalCost / existing.quantity // 重新计算平均成本
      } else {
        merged.set(asset.id, asset)
      }
    })
    
    // 再添加本地数据，避免重复
    localAssets.forEach(localAsset => {
      const uniqueKey = `${localAsset.name}-${localAsset.symbol}`.toLowerCase()
      
      // 检查是否已存在相同的资产
      let existingEntry = null
      for (const [key, existingAsset] of merged.entries()) {
        const existingUniqueKey = `${existingAsset.name}-${existingAsset.symbol}`.toLowerCase()
        if (existingUniqueKey === uniqueKey) {
          existingEntry = { key, asset: existingAsset }
          break
        }
      }
      
      if (existingEntry) {
        // 比较更新时间，选择更新的版本，或合并数据
        const localTime = new Date(localAsset.lastUpdated).getTime()
        const cloudTime = new Date(existingEntry.asset.lastUpdated).getTime()
        
        if (localTime > cloudTime) {
          // 本地数据更新，替换云端数据
          merged.set(existingEntry.key, localAsset)
        } else {
          // 云端数据更新，但可能需要合并数量
          const existing = existingEntry.asset
          if (Math.abs(existing.quantity - localAsset.quantity) > 0.001) {
            // 数量不同，可能需要合并
            console.log(`检测到资产 ${localAsset.name} 数量差异，本地: ${localAsset.quantity}, 云端: ${existing.quantity}`)
          }
        }
      } else {
        // 本地有但云端没有的资产，直接添加
        merged.set(localAsset.id, localAsset)
      }
    })
    
    return Array.from(merged.values())
  }

  // 获取同步状态
  getSyncStatus(): { lastSync: number; needsSync: boolean } {
    let lastSync = 0
    try {
      if (typeof window !== 'undefined') {
        lastSync = parseInt(localStorage.getItem(SYNC_KEY) || '0')
      }
    } catch (error) {
      console.error('获取同步状态失败:', error)
    }
    
    const needsSync = Date.now() - lastSync > 5 * 60 * 1000 // 5分钟未同步
    
    return { lastSync, needsSync }
  }

  // 获取交易记录
  getTransactions(): Transaction[] {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(TRANSACTIONS_KEY)
        if (data) {
          const parsed: TransactionStorageData = JSON.parse(data)
          return parsed.transactions || []
        }
      }
    } catch (error) {
      console.error('读取交易记录失败:', error)
    }
    return []
  }

  // 保存交易记录
  saveTransactions(transactions: Transaction[]): void {
    try {
      if (typeof window !== 'undefined') {
        const storageData: TransactionStorageData = {
          transactions,
          lastSync: Date.now(),
          version: 1
        }
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(storageData))
      }
    } catch (error) {
      console.error('保存交易记录失败:', error)
    }
  }

  // 添加交易记录
  addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }

    const transactions = this.getTransactions()
    
    // 检查是否存在重复的交易记录（防止重复添加）
    const isDuplicate = transactions.some(t => 
      t.assetId === transaction.assetId &&
      t.type === transaction.type &&
      t.date === transaction.date &&
      t.price === transaction.price &&
      t.quantity === transaction.quantity &&
      Math.abs(new Date(t.createdAt).getTime() - Date.now()) < 5000 // 5秒内的重复交易
    )
    
    if (isDuplicate) {
      console.log('检测到重复交易记录，跳过添加')
      return transactions.find(t => 
        t.assetId === transaction.assetId &&
        t.type === transaction.type &&
        t.date === transaction.date &&
        t.price === transaction.price &&
        t.quantity === transaction.quantity
      )!
    }

    const updatedTransactions = [...transactions, newTransaction]
    this.saveTransactions(updatedTransactions)
    
    console.log('添加交易记录:', newTransaction)
    return newTransaction
  }

  // 获取资产的交易记录
  getAssetTransactions(assetId: string): Transaction[] {
    const transactions = this.getTransactions()
    return transactions.filter(transaction => transaction.assetId === assetId)
  }

  // 清理重复的交易记录
  cleanupDuplicateTransactions(): void {
    const transactions = this.getTransactions()
    const uniqueTransactions: Transaction[] = []
    const seen = new Set<string>()

    transactions.forEach(transaction => {
      // 创建唯一标识符
      const key = `${transaction.assetId}-${transaction.type}-${transaction.date}-${transaction.price}-${transaction.quantity}`
      
      if (!seen.has(key)) {
        seen.add(key)
        uniqueTransactions.push(transaction)
      }
    })

    if (uniqueTransactions.length !== transactions.length) {
      console.log(`清理了 ${transactions.length - uniqueTransactions.length} 条重复交易记录`)
      this.saveTransactions(uniqueTransactions)
    }
  }

  // 清理重复的资产记录
  private removeDuplicateAssets(assets: AssetData[]): AssetData[] {
    const uniqueAssets = new Map<string, AssetData>()
    
    assets.forEach(asset => {
      // 使用名称和符号的组合作为唯一标识符
      const uniqueKey = `${asset.name}-${asset.symbol}`.toLowerCase().trim()
      
      if (uniqueAssets.has(uniqueKey)) {
        // 如果存在重复，合并数据
        const existing = uniqueAssets.get(uniqueKey)!
        
        // 合并数量和成本
        const totalQuantity = existing.quantity + asset.quantity
        const totalCost = existing.totalCost + asset.totalCost
        const averagePrice = totalCost / totalQuantity
        
        // 更新现有资产
        existing.quantity = totalQuantity
        existing.totalCost = totalCost
        existing.purchasePrice = averagePrice
        existing.totalValue = totalQuantity * existing.currentPrice
        existing.profitLoss = existing.totalValue - existing.totalCost
        existing.profitLossPercent = existing.totalCost > 0 ? (existing.profitLoss / existing.totalCost) * 100 : 0
        
        // 使用更新时间较晚的记录
        const existingTime = new Date(existing.lastUpdated).getTime()
        const assetTime = new Date(asset.lastUpdated).getTime()
        if (assetTime > existingTime) {
          existing.lastUpdated = asset.lastUpdated
        }
        
        console.log(`合并重复资产: ${asset.name} (${asset.symbol})`)
      } else {
        uniqueAssets.set(uniqueKey, { ...asset })
      }
    })
    
    return Array.from(uniqueAssets.values())
  }

  // 手动清理重复资产（供外部调用）
  cleanupDuplicateAssets(): void {
    const assets = this.getLocalAssets()
    const cleanedAssets = this.removeDuplicateAssets(assets)
    
    if (cleanedAssets.length !== assets.length) {
      console.log(`清理了 ${assets.length - cleanedAssets.length} 个重复资产`)
      this.saveLocalAssets(cleanedAssets)
    }
  }

  // 卖出资产
  sellAsset(assetId: string, sellData: SellTransactionData): boolean {
    const assets = this.getLocalAssets()
    const assetIndex = assets.findIndex(asset => asset.id === assetId)
    
    if (assetIndex === -1) return false
    
    const asset = assets[assetIndex]
    
    // 验证卖出数量不超过持有数量
    if (sellData.sellQuantity > asset.quantity) {
      console.error('卖出数量超过持有数量')
      return false
    }
    
    // 计算剩余数量
    const remainingQuantity = asset.quantity - sellData.sellQuantity
    
    // 计算卖出总额和盈亏
    const sellTotal = sellData.sellPrice * sellData.sellQuantity
    const costPerUnit = asset.totalCost / asset.quantity
    const costTotal = costPerUnit * sellData.sellQuantity
    const profit = sellTotal - costTotal
    const profitPercent = costTotal > 0 ? (profit / costTotal) * 100 : 0
    
    // 添加卖出交易记录
    this.addTransaction({
      assetId: asset.id,
      type: TransactionType.SELL,
      date: sellData.sellDate,
      price: sellData.sellPrice,
      quantity: sellData.sellQuantity,
      totalAmount: sellTotal,
      notes: sellData.notes
    })
    
    if (remainingQuantity > 0) {
      // 计算剩余资产的成本（按比例分配）
      const remainingCost = costPerUnit * remainingQuantity
      const remainingValue = remainingQuantity * asset.currentPrice
      const remainingProfitLoss = remainingValue - remainingCost
      const remainingProfitLossPercent = remainingCost > 0 ? (remainingProfitLoss / remainingCost) * 100 : 0
      
      // 更新资产数量和相关数据
      this.updateAsset(assetId, {
        quantity: remainingQuantity,
        totalValue: remainingValue,
        totalCost: remainingCost,
        profitLoss: remainingProfitLoss,
        profitLossPercent: remainingProfitLossPercent
      })
      
      console.log(`卖出后剩余: 数量=${remainingQuantity}, 成本=${remainingCost}, 价值=${remainingValue}, 盈亏=${remainingProfitLoss}`)
      return true
    } else {
      // 如果全部卖出，则删除资产
      this.deleteAsset(assetId)
      return true
    }
  }

  // 获取存储数据
  private getStorageData(): AssetStorageData {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          return JSON.parse(data)
        }
      }
    } catch (error) {
      console.error('读取存储数据失败:', error)
    }
    return { assets: [], lastSync: 0, version: 1 }
  }

  // 保存存储数据
  private saveStorageData(data: AssetStorageData): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }
    } catch (error) {
      console.error('保存存储数据失败:', error)
    }
  }

  // 标记需要同步
  private markNeedsSync(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SYNC_KEY, '0') // 设置为0表示需要同步
      }
    } catch (error) {
      console.error('标记同步状态失败:', error)
    }
  }
}

// 导出单例实例
export const assetStorage = AssetStorage.getInstance()