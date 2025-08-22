/**
 * 统一数据服务层
 * 为仪表盘、交易记录和资产信息页面提供统一的数据接口
 */

import { AssetData } from '@/components/assets/asset-card'
import { Transaction, TransactionType } from './transaction-types'
import { assetStorage } from './asset-storage'

// 仪表盘统计数据接口
export interface DashboardStats {
  totalValue: number;           // 总资产价值
  totalCost: number;           // 总投入成本
  totalProfit: number;         // 总盈亏
  totalProfitPercent: number;  // 总收益率
  todayProfit: number;         // 今日收益
  todayProfitPercent: number;  // 今日收益率
  assetCount: number;          // 持仓数量
  annualizedReturn: number;    // 年化收益率
}

// 资产配置数据接口
export interface AssetAllocation {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

// 收益趋势数据接口
export interface ProfitTrendData {
  date: string;
  profit: number;
  totalValue: number;
  profitPercent: number;
}

// 资产表现数据接口
export interface AssetPerformanceData {
  name: string;
  symbol: string;
  profitLoss: number;
  profitPercent: number;
  value: number;
}

// 热门资产数据接口
export interface PopularAssetData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// 交易记录扩展接口（包含资产信息）
export interface TransactionWithAsset extends Transaction {
  assetName: string;
  assetSymbol: string;
  profit?: number;
  profitRate?: number;
  status: 'completed' | 'pending' | 'failed';
}

class DataService {
  private static instance: DataService;

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * 获取仪表盘统计数据
   */
  getDashboardStats(): DashboardStats {
    const assets = assetStorage.getAssetsWithLatestPrices();
    
    const totalValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
    const totalCost = assets.reduce((sum, asset) => sum + asset.totalCost, 0);
    const totalProfit = totalValue - totalCost;
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    
    // 计算今日收益（基于日涨跌）
    const todayProfit = assets.reduce((sum, asset) => {
      return sum + (asset.dayChange * asset.quantity);
    }, 0);
    const todayProfitPercent = totalValue > 0 ? (todayProfit / totalValue) * 100 : 0;
    
    // 简化的年化收益率计算（假设持有1年）
    const annualizedReturn = totalProfitPercent;
    
    return {
      totalValue,
      totalCost,
      totalProfit,
      totalProfitPercent,
      todayProfit,
      todayProfitPercent,
      assetCount: assets.length,
      annualizedReturn
    };
  }

  /**
   * 获取资产配置数据
   */
  getAssetAllocation(): AssetAllocation[] {
    const assets = assetStorage.getAssetsWithLatestPrices();
    const totalValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
    
    // 按分类聚合资产
    const categoryMap = new Map<string, number>();
    assets.forEach(asset => {
      const category = this.getCategoryGroup(asset.category);
      const currentValue = categoryMap.get(category) || 0;
      categoryMap.set(category, currentValue + asset.totalValue);
    });
    
    // 转换为配置数据
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    
    let colorIndex = 0;
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: colors[colorIndex++ % colors.length]
    }));
  }

  /**
   * 获取收益趋势数据（模拟30天数据）
   */
  getProfitTrendData(): ProfitTrendData[] {
    const assets = assetStorage.getAssetsWithLatestPrices();
    const currentTotalValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
    const currentTotalCost = assets.reduce((sum, asset) => sum + asset.totalCost, 0);
    const currentProfit = currentTotalValue - currentTotalCost;
    
    // 生成过去30天的模拟数据
    const data: ProfitTrendData[] = [];
    const today = new Date();
    
    // 使用固定的伪随机数序列，避免服务端和客户端不一致
    const fixedRandomValues = [
      0.95, 1.02, 0.88, 1.15, 0.92, 1.08, 0.85, 1.12, 0.98, 1.05,
      0.91, 1.18, 0.87, 1.09, 0.94, 1.06, 0.89, 1.14, 0.96, 1.03,
      0.93, 1.11, 0.86, 1.07, 0.99, 1.04, 0.90, 1.16, 0.97, 1.01
    ];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // 使用固定的随机因子避免水合错误
      const randomFactor = fixedRandomValues[29 - i] || 1.0;
      const trendFactor = 1 + (i * 0.005); // 整体上升趋势
      
      // 计算当天的总价值和盈亏
      const dayTotalValue = currentTotalCost * randomFactor * trendFactor;
      const dayProfit = dayTotalValue - currentTotalCost;
      const dayProfitPercent = currentTotalCost > 0 ? (dayProfit / currentTotalCost) * 100 : 0;
      
      data.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        profit: Math.round(dayProfit),
        totalValue: Math.round(dayTotalValue),
        profitPercent: Number(dayProfitPercent.toFixed(2))
      });
    }
    
    return data;
  }

  /**
   * 获取资产表现数据
   */
  getAssetPerformanceData(): AssetPerformanceData[] {
    const assets = assetStorage.getAssetsWithLatestPrices();
    
    return assets
      .map(asset => ({
        name: asset.name,
        symbol: asset.symbol,
        profitLoss: asset.profitLoss,
        profitPercent: asset.profitLossPercent,
        value: asset.totalValue
      }))
      .sort((a, b) => b.profitPercent - a.profitPercent)
      .slice(0, 10); // 取前10个表现最好的资产
  }

  /**
   * 获取热门资产数据（模拟市场热门资产）
   */
  getPopularAssets(): PopularAssetData[] {
    // 模拟热门资产数据
    return [
      {
        name: '比特币',
        symbol: 'BTC',
        price: 45000,
        change: 1200,
        changePercent: 2.74
      },
      {
        name: '以太坊',
        symbol: 'ETH',
        price: 2800,
        change: -50,
        changePercent: -1.75
      },
      {
        name: '苹果公司',
        symbol: 'AAPL',
        price: 175.43,
        change: 2.15,
        changePercent: 1.24
      },
      {
        name: '特斯拉',
        symbol: 'TSLA',
        price: 205.80,
        change: -3.20,
        changePercent: -1.53
      },
      {
        name: '黄金ETF',
        symbol: 'GLD',
        price: 185.50,
        change: 1.80,
        changePercent: 0.98
      }
    ];
  }

  /**
   * 获取交易记录（包含资产信息）
   */
  getTransactionsWithAssets(): TransactionWithAsset[] {
    const transactions = assetStorage.getTransactions();
    const assets = assetStorage.getLocalAssets();
    
    return transactions.map(transaction => {
      const asset = assets.find(a => a.id === transaction.assetId);
      
      // 计算交易盈亏（仅对卖出交易）
      let profit: number | undefined;
      let profitRate: number | undefined;
      
      if (transaction.type === TransactionType.SELL && asset) {
        const costPerUnit = asset.totalCost / asset.quantity;
        const sellProfit = (transaction.price - costPerUnit) * transaction.quantity;
        profit = sellProfit;
        profitRate = costPerUnit > 0 ? (sellProfit / (costPerUnit * transaction.quantity)) * 100 : 0;
      }
      
      return {
        ...transaction,
        assetName: asset?.name || '未知资产',
        assetSymbol: asset?.symbol || 'UNKNOWN',
        profit,
        profitRate,
        status: 'completed' as const // 所有交易默认为已完成状态
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * 获取最新交易记录（用于仪表盘显示）
   */
  getRecentTransactions(limit: number = 5): TransactionWithAsset[] {
    return this.getTransactionsWithAssets().slice(0, limit);
  }

  /**
   * 获取交易统计数据
   */
  getTransactionStats() {
    const transactions = this.getTransactionsWithAssets();
    
    const totalTransactions = transactions.length;
    const buyTransactions = transactions.filter(t => t.type === TransactionType.BUY);
    const sellTransactions = transactions.filter(t => t.type === TransactionType.SELL);
    
    const totalBuyAmount = buyTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalSellAmount = sellTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    
    // 计算总盈亏（仅来自已完成的卖出交易）
    const totalProfit = sellTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    
    return {
      totalTransactions,
      totalBuyAmount,
      totalSellAmount,
      totalProfit,
      buyCount: buyTransactions.length,
      sellCount: sellTransactions.length
    };
  }

  /**
   * 添加买入交易
   */
  addBuyTransaction(assetId: string, price: number, quantity: number, date: Date, notes?: string): Transaction {
    return assetStorage.addTransaction({
      assetId,
      type: TransactionType.BUY,
      price,
      quantity,
      date,
      totalAmount: price * quantity,
      notes
    });
  }

  /**
   * 添加卖出交易
   */
  addSellTransaction(assetId: string, price: number, quantity: number, date: Date, notes?: string): Transaction {
    return assetStorage.addTransaction({
      assetId,
      type: TransactionType.SELL,
      price,
      quantity,
      date,
      totalAmount: price * quantity,
      notes
    });
  }

  /**
   * 获取资产的交易历史
   */
  getAssetTransactionHistory(assetId: string): TransactionWithAsset[] {
    const transactions = this.getTransactionsWithAssets();
    return transactions.filter(t => t.assetId === assetId);
  }

  /**
   * 将资产分类映射到主要分组
   */
  private getCategoryGroup(category: string): string {
    const categoryGroups: { [key: string]: string } = {
      // 股票类
      '股票': '股票',
      '科技股': '股票',
      '金融股': '股票',
      '消费股': '股票',
      '医疗股': '股票',
      '能源股': '股票',
      '工业股': '股票',
      '房地产股': '股票',
      '公用事业股': '股票',
      
      // 虚拟货币类
      '虚拟货币': '数字货币',
      '比特币': '数字货币',
      '以太坊': '数字货币',
      '其他主流币': '数字货币',
      '山寨币': '数字货币',
      '稳定币': '数字货币',
      'DeFi代币': '数字货币',
      'NFT': '数字货币',
      
      // 基金类
      '基金': '基金',
      '股票基金': '基金',
      '债券基金': '基金',
      '混合基金': '基金',
      '货币基金': '基金',
      'ETF基金': '基金',
      '指数基金': '基金',
      'QDII基金': '基金',
      
      // 债券类
      '债券': '债券',
      '国债': '债券',
      '企业债': '债券',
      '可转债': '债券',
      '地方债': '债券',
      '金融债': '债券',
      '短期债券': '债券',
      '长期债券': '债券',
      
      // 房地产类
      '房地产': '房地产',
      '住宅': '房地产',
      '商业地产': '房地产',
      '工业地产': '房地产',
      'REITs': '房地产',
      '土地': '房地产',
      '海外房产': '房地产',
      '房地产基金': '房地产',
      
      // 现金类
      '现金': '现金',
      '活期存款': '现金',
      '定期存款': '现金',
      '银行理财': '现金',
      '国债逆回购': '现金',
      '大额存单': '现金',
      
      // 其他类
      '保险': '其他',
      '贵金属': '其他',
      '大宗商品': '其他',
      '另类投资': '其他'
    };
    
    return categoryGroups[category] || '其他';
  }

  /**
   * 刷新所有数据
   */
  async refreshAllData(): Promise<void> {
    // 刷新资产价格
    const assets = assetStorage.getLocalAssets();
    const symbols = assets.map(asset => asset.symbol);
    
    // 这里可以调用价格管理器更新价格
    // await priceManager.updatePricesFromAPI(symbols);
    
    // 重新计算资产数据
    assetStorage.getAssetsWithLatestPrices();
  }

  /**
   * 同步数据到云端
   */
  async syncToCloud(): Promise<boolean> {
    const assets = assetStorage.getLocalAssets();
    return await assetStorage.syncToCloud(assets);
  }

  /**
   * 从云端同步数据
   */
  async syncFromCloud(): Promise<AssetData[]> {
    return await assetStorage.syncFromCloud();
  }

  /**
   * 清理重复数据
   */
  cleanupDuplicateData(): void {
    assetStorage.cleanupDuplicateAssets();
    assetStorage.cleanupDuplicateTransactions();
  }
}

// 导出单例实例
export const dataService = DataService.getInstance();