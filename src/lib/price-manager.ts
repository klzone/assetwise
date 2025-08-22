import { AssetData } from '@/components/assets/asset-card'

// 价格数据接口
export interface PriceData {
  symbol: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  lastUpdated: string
  source: 'manual' | 'api' | 'mock'
}

// 价格历史记录
export interface PriceHistory {
  symbol: string
  date: string
  price: number
  volume?: number
}

const PRICE_STORAGE_KEY = 'assetwise_prices'
const PRICE_HISTORY_KEY = 'assetwise_price_history'

export class PriceManager {
  private static instance: PriceManager
  private updateInProgress = false

  static getInstance(): PriceManager {
    if (!PriceManager.instance) {
      PriceManager.instance = new PriceManager()
    }
    return PriceManager.instance
  }

  // 获取存储的价格数据
  getStoredPrices(): Record<string, PriceData> {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(PRICE_STORAGE_KEY)
        return data ? JSON.parse(data) : {}
      }
    } catch (error) {
      console.error('读取价格数据失败:', error)
    }
    return {}
  }

  // 保存价格数据
  savePriceData(prices: Record<string, PriceData>): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(prices))
      }
    } catch (error) {
      console.error('保存价格数据失败:', error)
    }
  }

  // 手动更新单个资产价格
  updateAssetPrice(symbol: string, newPrice: number): PriceData {
    const prices = this.getStoredPrices()
    const currentData = prices[symbol]
    
    const previousClose = currentData?.currentPrice || newPrice
    const change = newPrice - previousClose
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

    const priceData: PriceData = {
      symbol,
      currentPrice: newPrice,
      previousClose,
      change,
      changePercent,
      lastUpdated: new Date().toLocaleString('zh-CN'),
      source: 'manual'
    }

    prices[symbol] = priceData
    this.savePriceData(prices)
    
    // 保存价格历史
    this.savePriceHistory(symbol, newPrice)
    
    return priceData
  }

  // 批量更新价格（从API获取）
  async updatePricesFromAPI(symbols: string[]): Promise<Record<string, PriceData>> {
    if (this.updateInProgress) {
      console.log('价格更新正在进行中...')
      return this.getStoredPrices()
    }

    this.updateInProgress = true
    const prices = this.getStoredPrices()

    try {
      // 注意：此处不再模拟价格波动，只更新时间戳
      // 实际项目中，这里应该调用真实的API获取价格数据
      for (const symbol of symbols) {
        await new Promise(resolve => setTimeout(resolve, 100)) // 轻微延迟，避免界面卡顿
        
        // 获取资产信息
        const assetInfo = this.getAssetInfo(symbol)
        const currentData = prices[symbol]
        
        if (currentData) {
          // 只更新时间戳，保持价格不变
          prices[symbol] = {
            ...currentData,
            lastUpdated: new Date().toLocaleString('zh-CN')
          }
        } else {
          // 如果是首次添加资产，使用初始价格
          const initialPrice = assetInfo?.purchasePrice || 0
          prices[symbol] = {
            symbol,
            currentPrice: initialPrice,
            previousClose: initialPrice,
            change: 0,
            changePercent: 0,
            lastUpdated: new Date().toLocaleString('zh-CN'),
            source: 'manual'
          }
        }
        
        // 注意：不再自动生成历史价格记录
        // 历史价格只在手动更新时记录
      }

      this.savePriceData(prices)
      console.log(`已更新 ${symbols.length} 个资产的价格数据`)
      
    } catch (error) {
      console.error('从API更新价格失败:', error)
    } finally {
      this.updateInProgress = false
    }

    return prices
  }

  // 生成模拟价格（用于演示）
  private generateMockPrice(symbol: string): number {
    const mockPrices: Record<string, number> = {
      'AAPL': 150,
      'TSLA': 200,
      'MSFT': 300,
      'GOOGL': 2500,
      'AMZN': 3000,
      'NVDA': 400,
      'META': 250,
      'NFLX': 400,
      'AMD': 100,
      'INTC': 50
    }
    
    return mockPrices[symbol] || Math.random() * 200 + 50
  }

  // 获取资产的当前价格数据
  getAssetPriceData(symbol: string): PriceData | null {
    const prices = this.getStoredPrices()
    return prices[symbol] || null
  }

  // 计算资产的盈亏信息
  calculateAssetProfitLoss(asset: AssetData, currentPrice?: number): {
    currentPrice: number
    totalValue: number
    profitLoss: number
    profitLossPercent: number
    dayChange: number
    dayChangePercent: number
  } {
    const priceData = this.getAssetPriceData(asset.symbol)
    const price = currentPrice || priceData?.currentPrice || asset.purchasePrice

    // 计算总价值
    const totalValue = price * asset.quantity
    
    // 确保总成本正确计算
    const totalCost = asset.totalCost || (asset.purchasePrice * asset.quantity)
    
    // 计算盈亏
    const profitLoss = totalValue - totalCost
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0

    const dayChange = priceData?.change || 0
    const dayChangePercent = priceData?.changePercent || 0

    return {
      currentPrice: Math.round(price * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      profitLoss: Math.round(profitLoss * 100) / 100,
      profitLossPercent: Math.round(profitLossPercent * 100) / 100,
      dayChange: Math.round(dayChange * 100) / 100,
      dayChangePercent: Math.round(dayChangePercent * 100) / 100
    }
  }

  // 保存价格历史记录
  private savePriceHistory(symbol: string, price: number): void {
    try {
      if (typeof window !== 'undefined') {
        const historyData = localStorage.getItem(PRICE_HISTORY_KEY)
        const history: PriceHistory[] = historyData ? JSON.parse(historyData) : []
        
        const today = new Date().toISOString().split('T')[0]
        const existingIndex = history.findIndex(h => h.symbol === symbol && h.date === today)
        
        const newRecord: PriceHistory = {
          symbol,
          date: today,
          price: Math.round(price * 100) / 100
        }

        if (existingIndex >= 0) {
          history[existingIndex] = newRecord
        } else {
          history.push(newRecord)
        }

        // 只保留最近30天的数据
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const filteredHistory = history.filter(h => new Date(h.date) >= thirtyDaysAgo)

        localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(filteredHistory))
      }
    } catch (error) {
      console.error('保存价格历史失败:', error)
    }
  }

  // 获取价格历史记录
  getPriceHistory(symbol: string, days: number = 30): PriceHistory[] {
    try {
      if (typeof window !== 'undefined') {
        const historyData = localStorage.getItem(PRICE_HISTORY_KEY)
        const history: PriceHistory[] = historyData ? JSON.parse(historyData) : []
        
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() - days)
        
        return history
          .filter(h => h.symbol === symbol && new Date(h.date) >= targetDate)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }
    } catch (error) {
      console.error('获取价格历史失败:', error)
    }
    return []
  }

  // 初始化资产价格（如果没有价格数据）
  initializeAssetPrice(asset: AssetData): void {
    const priceData = this.getAssetPriceData(asset.symbol)
    if (!priceData) {
      // 使用当前价格或购买价格作为初始价格（确保不为0）
      const initialPrice = asset.currentPrice || asset.purchasePrice || 1; // 至少为1，避免价格为0
      if (initialPrice > 0) {
        this.updateAssetPrice(asset.symbol, initialPrice)
      }
    }
  }

  // 获取所有需要更新的资产符号
  getSymbolsNeedingUpdate(assets: AssetData[]): string[] {
    const prices = this.getStoredPrices()
    const now = Date.now()
    const updateThreshold = 5 * 60 * 1000 // 5分钟

    return assets
      .map(asset => asset.symbol)
      .filter(symbol => {
        const priceData = prices[symbol]
        if (!priceData) return true
        
        const lastUpdate = new Date(priceData.lastUpdated).getTime()
        return now - lastUpdate > updateThreshold
      })
  }
  
  // 获取资产信息
  getAssetInfo(symbol: string): AssetData | null {
    try {
      if (typeof window !== 'undefined') {
        const assetsData = localStorage.getItem('assetwise_assets')
        if (assetsData) {
          const assets: AssetData[] = JSON.parse(assetsData)
          return assets.find(asset => asset.symbol === symbol) || null
        }
      }
    } catch (error) {
      console.error('获取资产信息失败:', error)
    }
    return null
  }
  
  // 判断是否为现金类资产
  isCashAsset(asset: AssetData | null): boolean {
    if (!asset) return false
    
    // 根据资产类别或名称判断是否为现金类资产
    const cashCategories = ['现金', '存款', '货币基金', '活期', '定期']
    const cashNames = ['备用金', '现金', '存款', '货币', '余额宝', '零钱通']
    
    // 检查类别
    if (asset.category && cashCategories.some(cat => asset.category?.includes(cat))) {
      return true
    }
    
    // 检查名称
    if (asset.name && cashNames.some(name => asset.name?.includes(name))) {
      return true
    }
    
    return false
  }
}

// 导出单例实例
export const priceManager = PriceManager.getInstance()