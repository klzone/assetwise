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
      assetName: newAsset.name,
      assetSymbol: newAsset.symbol,
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
      
      // 立即执行云端同步删除操作
      this.syncDeletedAssetToCloud(id, asset.name)
      
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

  // 从云端拉取数据（仅在用户主动操作时执行）
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

      console.log('📥 用户主动从云端拉取数据，将覆盖本地数据...')

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

      // 如果云端没有数据，返回空数组
      if (!cloudAssets || cloudAssets.length === 0) {
        console.log('云端无数据，清空本地数据')
        this.saveLocalAssets([])
        this.clearLocalChanges()
        return []
      }

      // 转换云端数据格式
      const convertedAssets = this.convertCloudAssetsToLocal(cloudAssets)
      
      // 直接使用云端数据覆盖本地数据（用户主动拉取）
      this.saveLocalAssets(convertedAssets)
      this.clearLocalChanges()
      
      console.log('✅ 从云端拉取数据完成:', convertedAssets.length, '项资产')
      return convertedAssets
    } catch (error) {
      console.error('❌ 从云端拉取失败:', error)
      return this.getLocalAssets()
    }
  }

  // 转换云端数据格式到本地格式
  private convertCloudAssetsToLocal(cloudAssets: any[]): AssetData[] {
    return cloudAssets.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      logo: '', // 数据库中没有logo字段
      category: asset.type, // type -> category
      currentPrice: parseFloat(asset.current_price) || 0,
      purchasePrice: parseFloat(asset.average_cost) || 0, // average_cost -> purchasePrice
      quantity: parseFloat(asset.quantity) || 0,
      totalValue: parseFloat(asset.total_value) || parseFloat(asset.market_value) || 0, // 使用正确的字段名
      totalCost: parseFloat(asset.average_cost) * parseFloat(asset.quantity) || 0, // 计算总成本
      profitLoss: parseFloat(asset.profit_loss) || 0,
      profitLossPercent: parseFloat(asset.profit_loss_percentage) || 0, // profit_loss_percentage -> profitLossPercent
      dayChange: parseFloat(asset.day_change) || 0,
      dayChangePercent: parseFloat(asset.day_change_rate) || 0, // day_change_rate -> dayChangePercent
      allocation: parseFloat(asset.weight) || 0, // weight -> allocation
      lastUpdated: new Date(asset.last_updated || asset.updated_at).toLocaleString('zh-CN'),
      riskLevel: 'medium' // 数据库中没有risk_level字段
    }))
  }

  // 智能合并本地和云端资产数据
  private intelligentMergeAssets(localAssets: AssetData[], cloudAssets: AssetData[]): AssetData[] {
    const merged = new Map<string, AssetData>()
    const processedIds = new Set<string>()
    
    // 首先处理云端数据
    cloudAssets.forEach(cloudAsset => {
      merged.set(cloudAsset.id, cloudAsset)
      processedIds.add(cloudAsset.id)
    })
    
    // 然后处理本地数据
    localAssets.forEach(localAsset => {
      if (processedIds.has(localAsset.id)) {
        // 如果ID相同，比较更新时间
        const cloudAsset = merged.get(localAsset.id)!
        const localTime = new Date(localAsset.lastUpdated).getTime()
        const cloudTime = new Date(cloudAsset.lastUpdated).getTime()
        
        // 如果本地数据更新，使用本地数据
        if (localTime > cloudTime) {
          console.log(`使用本地更新的资产数据: ${localAsset.name}`)
          merged.set(localAsset.id, localAsset)
        }
      } else {
        // 检查是否有相同名称和符号的资产（可能是重复资产）
        const duplicateAsset = Array.from(merged.values()).find(asset => 
          asset.name === localAsset.name && asset.symbol === localAsset.symbol
        )
        
        if (duplicateAsset) {
          console.log(`发现重复资产，合并数据: ${localAsset.name}`)
          // 合并数量和成本
          duplicateAsset.quantity += localAsset.quantity
          duplicateAsset.totalCost += localAsset.totalCost
          duplicateAsset.totalValue = duplicateAsset.quantity * duplicateAsset.currentPrice
          duplicateAsset.profitLoss = duplicateAsset.totalValue - duplicateAsset.totalCost
          duplicateAsset.profitLossPercent = duplicateAsset.totalCost > 0 ? 
            (duplicateAsset.profitLoss / duplicateAsset.totalCost) * 100 : 0
          duplicateAsset.purchasePrice = duplicateAsset.totalCost / duplicateAsset.quantity
        } else {
          // 本地独有的资产，直接添加
          merged.set(localAsset.id, localAsset)
        }
      }
    })
    
    return Array.from(merged.values())
  }

  // 合并本地和云端资产数据，避免重复（保留原方法以兼容）
  private mergeAssets(localAssets: AssetData[], cloudAssets: AssetData[]): AssetData[] {
    return this.intelligentMergeAssets(localAssets, cloudAssets)
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

  // 删除交易记录
  deleteTransaction(transactionId: string): boolean {
    try {
      const transactions = this.getTransactions()
      const transactionIndex = transactions.findIndex(t => t.id === transactionId)
      
      if (transactionIndex === -1) {
        console.error('未找到要删除的交易记录:', transactionId)
        return false
      }
      
      // 删除交易记录
      const deletedTransaction = transactions.splice(transactionIndex, 1)[0]
      this.saveTransactions(transactions)
      
      // 标记需要同步
      this.markNeedsSync()
      
      console.log('删除交易记录成功:', deletedTransaction.id)
      return true
    } catch (error) {
      console.error('删除交易记录失败:', error)
      return false
    }
  }

  // 更新交易记录
  updateTransaction(transactionId: string, updates: Partial<Transaction>): boolean {
    try {
      const transactions = this.getTransactions()
      const transactionIndex = transactions.findIndex(t => t.id === transactionId)
      
      if (transactionIndex === -1) {
        console.error('未找到要更新的交易记录:', transactionId)
        return false
      }
      
      // 更新交易记录
      transactions[transactionIndex] = {
        ...transactions[transactionIndex],
        ...updates,
        // 保持原有的ID和创建时间
        id: transactions[transactionIndex].id,
        createdAt: transactions[transactionIndex].createdAt
      }
      
      this.saveTransactions(transactions)
      
      // 标记需要同步
      this.markNeedsSync()
      
      console.log('更新交易记录成功:', transactionId)
      return true
    } catch (error) {
      console.error('更新交易记录失败:', error)
      return false
    }
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
    try {
      const assets = this.getLocalAssets()
      const assetIndex = assets.findIndex(asset => asset.id === assetId)
      
      if (assetIndex === -1) {
        console.error('未找到要卖出的资产:', assetId)
        return false
      }
      
      const asset = assets[assetIndex]
      
      // 验证卖出数量不超过持有数量
      if (sellData.sellQuantity > asset.quantity) {
        console.error('卖出数量超过持有数量:', sellData.sellQuantity, '>', asset.quantity)
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
      
      console.log(`卖出资产 ${asset.name}:`, {
        sellQuantity: sellData.sellQuantity,
        sellPrice: sellData.sellPrice,
        sellTotal,
        profit,
        profitPercent,
        remainingQuantity
      })
      
      // 先添加卖出交易记录，确保记录被创建
      const transaction = this.addTransaction({
        assetId: asset.id,
        assetName: asset.name,
        assetSymbol: asset.symbol,
        type: TransactionType.SELL,
        date: sellData.sellDate,
        price: sellData.sellPrice,
        quantity: sellData.sellQuantity,
        totalAmount: sellTotal,
        profit: profit,
        profitRate: profitPercent,
        notes: sellData.notes || `卖出 ${asset.name} ${sellData.sellQuantity} 股，单价 ¥${sellData.sellPrice}`
      })
      
      console.log('创建卖出交易记录:', transaction)
      
      if (remainingQuantity > 0) {
        // 计算剩余资产的成本（按比例分配）
        const remainingCost = costPerUnit * remainingQuantity
        const remainingValue = remainingQuantity * asset.currentPrice
        const remainingProfitLoss = remainingValue - remainingCost
        const remainingProfitLossPercent = remainingCost > 0 ? (remainingProfitLoss / remainingCost) * 100 : 0
        
        // 更新资产数量和相关数据
        const updateSuccess = this.updateAsset(assetId, {
          quantity: remainingQuantity,
          totalValue: remainingValue,
          totalCost: remainingCost,
          profitLoss: remainingProfitLoss,
          profitLossPercent: remainingProfitLossPercent,
          lastUpdated: new Date().toLocaleString('zh-CN')
        })
        
        if (!updateSuccess) {
          console.error('更新资产失败')
          return false
        }
        
        console.log(`卖出后剩余: 数量=${remainingQuantity}, 成本=${remainingCost.toFixed(2)}, 价值=${remainingValue.toFixed(2)}, 盈亏=${remainingProfitLoss.toFixed(2)}`)
      } else {
        // 如果全部卖出，则软删除资产
        const deleteSuccess = this.deleteAsset(assetId)
        if (!deleteSuccess) {
          console.error('删除资产失败')
          return false
        }
        console.log(`全部卖出，资产 ${asset.name} 已删除`)
      }
      
      // 立即同步卖出操作到云端
      this.syncSellOperationToCloud(assetId, asset.name, sellData, remainingQuantity > 0)
      
      // 验证交易记录是否正确创建
      const allTransactions = this.getTransactions()
      const sellTransactions = allTransactions.filter(t => 
        t.assetId === assetId && 
        t.type === TransactionType.SELL &&
        Math.abs(new Date(t.date).getTime() - new Date(sellData.sellDate).getTime()) < 60000 // 1分钟内
      )
      
      console.log(`验证交易记录: 找到 ${sellTransactions.length} 条相关卖出记录`)
      
      return true
    } catch (error) {
      console.error('卖出资产时发生错误:', error)
      return false
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

  // 立即同步删除的资产到云端
  private async syncDeletedAssetToCloud(assetId: string, assetName: string): Promise<void> {
    try {
      console.log(`🗑️ 立即同步删除资产到云端: ${assetName} (${assetId})`);
      
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // 获取当前用户
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('用户未登录，无法同步删除:', userError)
        this.markNeedsSync() // 标记稍后同步
        return
      }

      // 立即从云端删除资产
      const { error: deleteError } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', user.id)
      
      if (deleteError) {
        console.error(`云端删除资产失败 ${assetName}:`, deleteError)
        this.markNeedsSync() // 标记稍后重试
      } else {
        console.log(`✅ 成功从云端删除资产: ${assetName}`)
      }
    } catch (error) {
      console.error(`同步删除资产到云端失败 ${assetName}:`, error)
      this.markNeedsSync() // 标记稍后重试
    }
  }

  // 立即同步卖出操作到云端
  private async syncSellOperationToCloud(
    assetId: string, 
    assetName: string, 
    sellData: SellTransactionData, 
    hasRemainingQuantity: boolean
  ): Promise<void> {
    try {
      console.log(`💰 立即同步卖出操作到云端: ${assetName} (${assetId})`);
      
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // 获取当前用户
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('用户未登录，无法同步卖出操作:', userError)
        this.markNeedsSync()
        return
      }

      if (hasRemainingQuantity) {
        // 部分卖出：更新云端资产数据
        const updatedAsset = this.getLocalAssets().find(asset => asset.id === assetId)
        if (updatedAsset) {
          const assetData = this.convertLocalAssetToCloudFormat(updatedAsset, user.id)
          
          const { error: updateError } = await supabase
            .from('assets')
            .update(assetData)
            .eq('id', assetId)
            .eq('user_id', user.id)
          
          if (updateError) {
            console.error(`更新云端资产失败 ${assetName}:`, updateError)
            this.markNeedsSync()
          } else {
            console.log(`✅ 成功更新云端资产: ${assetName}`)
          }
        }
      } else {
        // 全部卖出：删除云端资产
        await this.syncDeletedAssetToCloud(assetId, assetName)
      }

      // 同步交易记录到云端
      await this.syncTransactionToCloud(assetId, sellData, user.id)

    } catch (error) {
      console.error(`同步卖出操作到云端失败 ${assetName}:`, error)
      this.markNeedsSync()
    }
  }

  // 转换本地资产格式到云端格式
  private convertLocalAssetToCloudFormat(localAsset: any, userId: string): any {
    const mapCategoryToType = (category: string): string => {
      const typeMap: { [key: string]: string } = {
        '股票': 'stock', '科技股': 'stock', '金融股': 'stock', '消费股': 'stock',
        '虚拟货币': 'crypto', '比特币': 'crypto', '以太坊': 'crypto',
        '基金': 'fund', '债券': 'bond', '大宗商品': 'commodity'
      };
      return typeMap[category] || 'stock';
    };

    return {
      id: localAsset.id,
      user_id: userId,
      name: localAsset.name || '',
      symbol: localAsset.symbol || '',
      type: mapCategoryToType(localAsset.category),
      current_price: localAsset.currentPrice || 0,
      average_cost: localAsset.purchasePrice || 0,
      quantity: localAsset.quantity || 0,
      total_value: localAsset.totalValue || 0,
      profit_loss: localAsset.profitLoss || 0,
      profit_loss_percentage: localAsset.profitLossPercent || 0,
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // 同步交易记录到云端
  private async syncTransactionToCloud(assetId: string, sellData: SellTransactionData, userId: string): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // 获取对应的资产信息
      const asset = this.getAllAssets().find(a => a.id === assetId)
      if (!asset) return

      const transactionData = {
        id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        type: 'sell' as const,
        symbol: asset.symbol,
        name: asset.name,
        quantity: sellData.sellQuantity,
        price: sellData.sellPrice,
        amount: sellData.sellPrice * sellData.sellQuantity,
        fee: 0,
        tax: 0,
        notes: sellData.notes || `卖出 ${asset.name}`,
        transaction_date: new Date(sellData.sellDate).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData])

      if (transactionError) {
        console.error('同步交易记录到云端失败:', transactionError)
      } else {
        console.log('✅ 成功同步交易记录到云端')
      }
    } catch (error) {
      console.error('同步交易记录异常:', error)
    }
  }

  // 标记需要同步
  private markNeedsSync(): void {
    try {
      if (typeof window !== 'undefined') {
        // 设置当前时间戳，表示有本地更改需要同步
        localStorage.setItem(SYNC_KEY, Date.now().toString())
        localStorage.setItem('assetwise_local_changes', 'true')
      }
    } catch (error) {
      console.error('标记同步状态失败:', error)
    }
  }

  // 检查是否有本地未同步的更改
  hasLocalChanges(): boolean {
    try {
      if (typeof window !== 'undefined') {
        const hasChanges = localStorage.getItem('assetwise_local_changes') === 'true'
        const lastSync = parseInt(localStorage.getItem(SYNC_KEY) || '0')
        const timeSinceLastSync = Date.now() - lastSync
        
        // 如果有标记的本地更改，或者最近5分钟内有操作，认为有本地更改
        return hasChanges || timeSinceLastSync < 5 * 60 * 1000
      }
    } catch (error) {
      console.error('检查本地更改状态失败:', error)
    }
    return false
  }

  // 清除本地更改标记
  clearLocalChanges(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('assetwise_local_changes')
      }
    } catch (error) {
      console.error('清除本地更改标记失败:', error)
    }
  }
}

// 导出单例实例
export const assetStorage = AssetStorage.getInstance()