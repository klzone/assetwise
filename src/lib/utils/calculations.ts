/**
 * AssetWise 数据计算工具
 * 提供资产、交易、收益等相关的计算函数
 */

import {
  Asset,
  Transaction,
  InvestmentPlan,
  PortfolioStats,
  AssetAllocation,
  PerformanceMetrics,
  TransactionType,
  AssetType,
  CurrencyCode
} from '../types/core.types';

// ============= 基础计算函数 =============

/** 计算百分比变化 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/** 计算复合年增长率 (CAGR) */
export const calculateCAGR = (
  beginningValue: number,
  endingValue: number,
  numberOfYears: number
): number => {
  if (beginningValue <= 0 || numberOfYears <= 0) return 0;
  return (Math.pow(endingValue / beginningValue, 1 / numberOfYears) - 1) * 100;
};

/** 计算年化收益率 */
export const calculateAnnualizedReturn = (
  totalReturn: number,
  days: number
): number => {
  if (days <= 0) return 0;
  const years = days / 365.25;
  return ((Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100);
};

/** 计算夏普比率 */
export const calculateSharpeRatio = (
  portfolioReturn: number,
  riskFreeRate: number,
  volatility: number
): number => {
  if (volatility === 0) return 0;
  return (portfolioReturn - riskFreeRate) / volatility;
};

/** 计算波动率 */
export const calculateVolatility = (returns: number[]): number => {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
  
  return Math.sqrt(variance) * Math.sqrt(252); // 年化波动率
};

/** 计算最大回撤 */
export const calculateMaxDrawdown = (values: number[]): number => {
  if (values.length < 2) return 0;
  
  let maxDrawdown = 0;
  let peak = values[0];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i];
    } else {
      const drawdown = (peak - values[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown * 100;
};

// ============= 资产计算函数 =============

/** 计算资产当前市值 */
export const calculateMarketValue = (quantity: number, currentPrice: number): number => {
  return quantity * currentPrice;
};

/** 计算资产总成本 */
export const calculateTotalCost = (quantity: number, averageCost: number): number => {
  return quantity * averageCost;
};

/** 计算未实现盈亏 */
export const calculateUnrealizedPnL = (
  quantity: number,
  currentPrice: number,
  averageCost: number
): number => {
  return (currentPrice - averageCost) * quantity;
};

/** 计算未实现盈亏百分比 */
export const calculateUnrealizedPnLPercent = (
  currentPrice: number,
  averageCost: number
): number => {
  return calculatePercentageChange(currentPrice, averageCost);
};

/** 更新资产数据 */
export const updateAssetCalculations = (
  asset: Asset,
  currentPrice: number
): Partial<Asset> => {
  const marketValue = calculateMarketValue(asset.quantity, currentPrice);
  const totalCost = calculateTotalCost(asset.quantity, asset.average_cost);
  const unrealizedPnL = calculateUnrealizedPnL(asset.quantity, currentPrice, asset.average_cost);
  const unrealizedPnLPercent = calculateUnrealizedPnLPercent(currentPrice, asset.average_cost);
  const dailyChange = currentPrice - (asset.current_price || currentPrice);
  const dailyChangePercent = calculatePercentageChange(currentPrice, asset.current_price || currentPrice);

  return {
    current_price: currentPrice,
    market_value: marketValue,
    total_cost: totalCost,
    unrealized_pnl: unrealizedPnL,
    unrealized_pnl_percent: unrealizedPnLPercent,
    total_pnl: unrealizedPnL + (asset.realized_pnl || 0),
    daily_change: dailyChange,
    daily_change_percent: dailyChangePercent,
    last_price_update: new Date().toISOString()
  };
};

// ============= 交易计算函数 =============

/** 计算交易金额 */
export const calculateTransactionAmount = (
  type: TransactionType,
  quantity: number,
  price: number
): number => {
  switch (type) {
    case 'buy':
    case 'transfer_in':
      return quantity * price;
    case 'sell':
    case 'transfer_out':
      return quantity * price;
    case 'dividend':
    case 'interest':
      return quantity; // 对于分红和利息，quantity就是金额
    case 'fee':
      return -Math.abs(quantity); // 手续费为负数
    default:
      return quantity * price;
  }
};

/** 计算平均成本价 */
export const calculateAverageCost = (
  currentQuantity: number,
  currentAverageCost: number,
  transactionQuantity: number,
  transactionPrice: number,
  transactionType: TransactionType
): number => {
  if (transactionType === 'sell') {
    // 卖出不改变平均成本
    return currentAverageCost;
  }
  
  if (transactionType === 'buy') {
    const currentValue = currentQuantity * currentAverageCost;
    const transactionValue = transactionQuantity * transactionPrice;
    const newQuantity = currentQuantity + transactionQuantity;
    
    if (newQuantity === 0) return 0;
    return (currentValue + transactionValue) / newQuantity;
  }
  
  return currentAverageCost;
};

/** 计算交易后的持仓数量 */
export const calculateNewQuantity = (
  currentQuantity: number,
  transactionQuantity: number,
  transactionType: TransactionType
): number => {
  switch (transactionType) {
    case 'buy':
    case 'transfer_in':
      return currentQuantity + transactionQuantity;
    case 'sell':
    case 'transfer_out':
      return Math.max(0, currentQuantity - transactionQuantity);
    case 'split':
      return currentQuantity * transactionQuantity; // 拆股比例
    case 'merge':
      return currentQuantity / transactionQuantity; // 合股比例
    default:
      return currentQuantity;
  }
};

/** 计算已实现盈亏 */
export const calculateRealizedPnL = (
  sellQuantity: number,
  sellPrice: number,
  averageCost: number,
  fee: number = 0
): number => {
  return (sellPrice - averageCost) * sellQuantity - fee;
};

// ============= 投资组合计算函数 =============

/** 计算投资组合统计 */
export const calculatePortfolioStats = (assets: Asset[]): PortfolioStats => {
  const activeAssets = assets.filter(asset => asset.is_active);
  
  const totalAssets = activeAssets.reduce((sum, asset) => sum + asset.market_value, 0);
  const totalCost = activeAssets.reduce((sum, asset) => sum + asset.total_cost, 0);
  const totalPnL = activeAssets.reduce((sum, asset) => sum + asset.total_pnl, 0);
  const dailyPnL = activeAssets.reduce((sum, asset) => sum + asset.daily_change * asset.quantity, 0);
  
  return {
    total_assets: totalAssets,
    total_cost: totalCost,
    total_market_value: totalAssets,
    total_pnl: totalPnL,
    total_pnl_percent: calculatePercentageChange(totalAssets, totalCost),
    daily_pnl: dailyPnL,
    daily_pnl_percent: calculatePercentageChange(totalAssets, totalAssets - dailyPnL),
    asset_count: assets.length,
    active_asset_count: activeAssets.length,
    last_updated: new Date().toISOString()
  };
};

/** 计算资产分配 */
export const calculateAssetAllocation = (assets: Asset[]): AssetAllocation[] => {
  const activeAssets = assets.filter(asset => asset.is_active);
  const totalValue = activeAssets.reduce((sum, asset) => sum + asset.market_value, 0);
  
  if (totalValue === 0) return [];
  
  // 按资产类型分组
  const allocationMap = new Map<AssetType, {
    value: number;
    pnl: number;
    count: number;
  }>();
  
  activeAssets.forEach(asset => {
    const existing = allocationMap.get(asset.type) || { value: 0, pnl: 0, count: 0 };
    allocationMap.set(asset.type, {
      value: existing.value + asset.market_value,
      pnl: existing.pnl + asset.total_pnl,
      count: existing.count + 1
    });
  });
  
  return Array.from(allocationMap.entries()).map(([type, data]) => ({
    type,
    name: getAssetTypeName(type),
    value: data.value,
    percentage: (data.value / totalValue) * 100,
    pnl: data.pnl,
    pnl_percent: calculatePercentageChange(data.value, data.value - data.pnl)
  })).sort((a, b) => b.value - a.value);
};

/** 获取资产类型中文名称 */
export const getAssetTypeName = (type: AssetType): string => {
  const typeNames: Record<AssetType, string> = {
    stock: '股票',
    fund: '基金',
    bond: '债券',
    crypto: '加密货币',
    commodity: '商品',
    real_estate: '房地产',
    cash: '现金',
    other: '其他'
  };
  return typeNames[type] || type;
};

// ============= 性能指标计算函数 =============

/** 计算性能指标 */
export const calculatePerformanceMetrics = (
  assets: Asset[],
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): PerformanceMetrics => {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const years = daysDiff / 365.25;
  
  // 计算总收益
  const totalValue = assets.reduce((sum, asset) => sum + asset.market_value, 0);
  const totalCost = assets.reduce((sum, asset) => sum + asset.total_cost, 0);
  const totalReturn = calculatePercentageChange(totalValue, totalCost);
  
  // 计算年化收益率
  const annualizedReturn = calculateAnnualizedReturn(totalReturn, daysDiff);
  
  // 计算交易胜率
  const sellTransactions = transactions.filter(t => t.type === 'sell');
  const profitableTrades = sellTransactions.filter(t => {
    // 这里需要根据实际的成本计算盈亏
    return t.price > (t as any).averageCost; // 简化计算
  });
  const winRate = sellTransactions.length > 0 ? 
    (profitableTrades.length / sellTransactions.length) * 100 : 0;
  
  // 简化的其他指标计算
  const volatility = 15; // 默认波动率，实际应该根据历史数据计算
  const maxDrawdown = 5; // 默认最大回撤，实际应该根据历史净值计算
  const sharpeRatio = calculateSharpeRatio(annualizedReturn, 3, volatility); // 假设无风险利率3%
  
  return {
    total_return: totalReturn,
    annualized_return: annualizedReturn,
    sharpe_ratio: sharpeRatio,
    max_drawdown: maxDrawdown,
    volatility: volatility,
    win_rate: winRate,
    profit_loss_ratio: 1.5, // 默认盈亏比
    period_start: startDate.toISOString(),
    period_end: endDate.toISOString()
  };
};

// ============= 投资计划计算函数 =============

/** 计算投资计划进度 */
export const calculatePlanProgress = (
  plan: InvestmentPlan,
  currentAssets: Asset[]
): number => {
  if (plan.target_amount <= 0) return 0;
  
  // 计算关联资产的当前总值
  const relatedAssets = currentAssets.filter(asset => 
    plan.asset_ids.includes(asset.id)
  );
  
  const currentValue = relatedAssets.reduce((sum, asset) => sum + asset.market_value, 0);
  
  return Math.min((currentValue / plan.target_amount) * 100, 100);
};

/** 计算计划时间进度 */
export const calculatePlanTimeProgress = (plan: InvestmentPlan): number => {
  const now = new Date();
  const startDate = new Date(plan.start_date);
  const targetDate = new Date(plan.target_date);
  
  const totalDays = targetDate.getTime() - startDate.getTime();
  const elapsedDays = now.getTime() - startDate.getTime();
  
  if (totalDays <= 0) return 100;
  
  return Math.min((elapsedDays / totalDays) * 100, 100);
};

/** 计算计划实际收益率 */
export const calculatePlanActualReturn = (
  plan: InvestmentPlan,
  currentAssets: Asset[]
): number => {
  const relatedAssets = currentAssets.filter(asset => 
    plan.asset_ids.includes(asset.id)
  );
  
  const currentValue = relatedAssets.reduce((sum, asset) => sum + asset.market_value, 0);
  const totalCost = relatedAssets.reduce((sum, asset) => sum + asset.total_cost, 0);
  
  if (totalCost <= 0) return 0;
  
  return calculatePercentageChange(currentValue, totalCost);
};

// ============= 货币转换函数 =============

/** 货币转换汇率 (简化版本，实际应该从API获取) */
const EXCHANGE_RATES: Record<string, number> = {
  'CNY_USD': 0.14,
  'USD_CNY': 7.2,
  'CNY_EUR': 0.13,
  'EUR_CNY': 7.8,
  'CNY_JPY': 20.5,
  'JPY_CNY': 0.049,
  'CNY_HKD': 1.1,
  'HKD_CNY': 0.91,
  'CNY_GBP': 0.11,
  'GBP_CNY': 9.1
};

/** 货币转换 */
export const convertCurrency = (
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  const rateKey = `${fromCurrency}_${toCurrency}`;
  const rate = EXCHANGE_RATES[rateKey];
  
  if (rate) {
    return amount * rate;
  }
  
  // 通过CNY中转
  if (fromCurrency !== 'CNY' && toCurrency !== 'CNY') {
    const toCNY = convertCurrency(amount, fromCurrency, 'CNY');
    return convertCurrency(toCNY, 'CNY', toCurrency);
  }
  
  return amount; // 无法转换时返回原值
};

// ============= 格式化函数 =============

/** 格式化货币 */
export const formatCurrency = (
  amount: number,
  currency: CurrencyCode = 'CNY',
  showSymbol: boolean = true
): string => {
  const symbols: Record<CurrencyCode, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    HKD: 'HK$',
    GBP: '£'
  };
  
  const formatted = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
  
  const symbol = showSymbol ? symbols[currency] : '';
  const sign = amount < 0 ? '-' : '';
  
  return `${sign}${symbol}${formatted}`;
};

/** 格式化百分比 */
export const formatPercentage = (
  value: number,
  decimals: number = 2,
  showSign: boolean = true
): string => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/** 格式化数量 */
export const formatQuantity = (quantity: number, decimals: number = 4): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(quantity);
};

// ============= 风险计算函数 =============

/** 计算投资组合风险等级 */
export const calculatePortfolioRisk = (assets: Asset[]): number => {
  if (assets.length === 0) return 1;
  
  const riskWeights: Record<AssetType, number> = {
    cash: 1,
    bond: 2,
    fund: 3,
    stock: 4,
    real_estate: 3,
    commodity: 4,
    crypto: 5,
    other: 3
  };
  
  const totalValue = assets.reduce((sum, asset) => sum + asset.market_value, 0);
  if (totalValue === 0) return 1;
  
  const weightedRisk = assets.reduce((sum, asset) => {
    const weight = asset.market_value / totalValue;
    const risk = riskWeights[asset.type] || 3;
    return sum + (weight * risk);
  }, 0);
  
  return Math.round(weightedRisk);
};

/** 计算集中度风险 */
export const calculateConcentrationRisk = (assets: Asset[]): number => {
  const totalValue = assets.reduce((sum, asset) => sum + asset.market_value, 0);
  if (totalValue === 0) return 0;
  
  // 计算最大单一资产占比
  const maxWeight = Math.max(...assets.map(asset => asset.market_value / totalValue));
  
  // 计算前5大资产占比
  const sortedAssets = assets.sort((a, b) => b.market_value - a.market_value);
  const top5Weight = sortedAssets.slice(0, 5).reduce((sum, asset) => 
    sum + (asset.market_value / totalValue), 0
  );
  
  // 集中度风险评分 (0-100)
  return Math.min(maxWeight * 100 + top5Weight * 50, 100);
};

