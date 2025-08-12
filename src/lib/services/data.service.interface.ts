/**
 * AssetWise 数据服务接口定义
 * 定义所有数据操作的标准接口
 */

import {
  Asset,
  Transaction,
  InvestmentPlan,
  ReviewLog,
  PortfolioStats,
  AssetAllocation,
  PerformanceMetrics,
  MarketData,
  CreateAssetForm,
  CreateTransactionForm,
  CreatePlanForm,
  CreateReviewForm,
  AssetQuery,
  TransactionQuery,
  PlanQuery,
  ReviewQuery,
  ApiResponse,
  PaginatedResponse,
  EntityId,
  UserId,
  Timestamp
} from '../types/core.types';

// ============= 基础服务接口 =============

/** 基础CRUD服务接口 */
export interface BaseService<T, CreateForm, Query> {
  /** 获取所有记录 */
  getAll(userId: UserId, query?: Query): Promise<PaginatedResponse<T>>;
  
  /** 根据ID获取单条记录 */
  getById(id: EntityId, userId: UserId): Promise<ApiResponse<T>>;
  
  /** 创建新记录 */
  create(data: CreateForm, userId: UserId): Promise<ApiResponse<T>>;
  
  /** 更新记录 */
  update(id: EntityId, data: Partial<T>, userId: UserId): Promise<ApiResponse<T>>;
  
  /** 删除记录 */
  delete(id: EntityId, userId: UserId): Promise<ApiResponse<boolean>>;
  
  /** 批量删除 */
  batchDelete(ids: EntityId[], userId: UserId): Promise<ApiResponse<boolean>>;
}

// ============= 资产服务接口 =============

export interface AssetService extends BaseService<Asset, CreateAssetForm, AssetQuery> {
  /** 获取资产统计信息 */
  getStats(userId: UserId): Promise<ApiResponse<PortfolioStats>>;
  
  /** 获取资产分配 */
  getAllocation(userId: UserId): Promise<ApiResponse<AssetAllocation[]>>;
  
  /** 更新资产价格 */
  updatePrice(id: EntityId, price: number, userId: UserId): Promise<ApiResponse<Asset>>;
  
  /** 批量更新价格 */
  batchUpdatePrices(updates: Array<{id: EntityId, price: number}>, userId: UserId): Promise<ApiResponse<Asset[]>>;
  
  /** 获取资产历史价格 */
  getPriceHistory(id: EntityId, startDate: Timestamp, endDate: Timestamp, userId: UserId): Promise<ApiResponse<Array<{date: Timestamp, price: number}>>>;
  
  /** 计算资产收益 */
  calculateReturns(id: EntityId, userId: UserId): Promise<ApiResponse<PerformanceMetrics>>;
  
  /** 搜索资产 */
  search(keyword: string, userId: UserId): Promise<ApiResponse<Asset[]>>;
  
  /** 获取热门资产 */
  getTrending(userId: UserId): Promise<ApiResponse<Asset[]>>;
  
  /** 导出资产数据 */
  export(userId: UserId, format: 'json' | 'csv' | 'excel'): Promise<ApiResponse<string>>;
  
  /** 导入资产数据 */
  import(data: any[], userId: UserId): Promise<ApiResponse<{success: number, failed: number, errors: string[]}>>;
}

// ============= 交易服务接口 =============

export interface TransactionService extends BaseService<Transaction, CreateTransactionForm, TransactionQuery> {
  /** 获取资产的交易记录 */
  getByAsset(assetId: EntityId, userId: UserId, query?: TransactionQuery): Promise<PaginatedResponse<Transaction>>;
  
  /** 获取交易统计 */
  getStats(userId: UserId, startDate?: Timestamp, endDate?: Timestamp): Promise<ApiResponse<{
    totalTransactions: number;
    totalVolume: number;
    totalFees: number;
    buyCount: number;
    sellCount: number;
    profitTransactions: number;
    lossTransactions: number;
  }>>;
  
  /** 计算交易盈亏 */
  calculatePnL(assetId: EntityId, userId: UserId): Promise<ApiResponse<{
    realizedPnL: number;
    unrealizedPnL: number;
    totalReturn: number;
    returnPercent: number;
  }>>;
  
  /** 获取交易日历 */
  getCalendar(userId: UserId, year: number, month?: number): Promise<ApiResponse<Array<{
    date: string;
    transactions: Transaction[];
    totalAmount: number;
  }>>>;
  
  /** 验证交易数据 */
  validate(data: CreateTransactionForm): Promise<ApiResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>>;
  
  /** 批量导入交易 */
  batchImport(transactions: CreateTransactionForm[], userId: UserId): Promise<ApiResponse<{
    success: number;
    failed: number;
    errors: Array<{row: number, error: string}>;
  }>>;
}

// ============= 投资计划服务接口 =============

export interface PlanService extends BaseService<InvestmentPlan, CreatePlanForm, PlanQuery> {
  /** 更新计划进度 */
  updateProgress(id: EntityId, userId: UserId): Promise<ApiResponse<InvestmentPlan>>;
  
  /** 获取计划统计 */
  getStats(userId: UserId): Promise<ApiResponse<{
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    averageProgress: number;
  }>>;
  
  /** 获取计划性能 */
  getPerformance(id: EntityId, userId: UserId): Promise<ApiResponse<{
    expectedReturn: number;
    actualReturn: number;
    timeProgress: number;
    amountProgress: number;
    riskAdjustedReturn: number;
  }>>;
  
  /** 获取计划建议 */
  getSuggestions(id: EntityId, userId: UserId): Promise<ApiResponse<{
    suggestions: string[];
    riskWarnings: string[];
    optimizations: string[];
  }>>;
  
  /** 复制计划 */
  duplicate(id: EntityId, userId: UserId): Promise<ApiResponse<InvestmentPlan>>;
  
  /** 归档计划 */
  archive(id: EntityId, userId: UserId): Promise<ApiResponse<boolean>>;
}

// ============= 复盘日志服务接口 =============

export interface ReviewService extends BaseService<ReviewLog, CreateReviewForm, ReviewQuery> {
  /** 获取标签列表 */
  getTags(userId: UserId): Promise<ApiResponse<string[]>>;
  
  /** 获取关键词列表 */
  getKeywords(userId: UserId): Promise<ApiResponse<string[]>>;
  
  /** 搜索日志 */
  search(keyword: string, userId: UserId): Promise<ApiResponse<ReviewLog[]>>;
  
  /** 获取日志统计 */
  getStats(userId: UserId): Promise<ApiResponse<{
    totalReviews: number;
    reviewsByType: Record<string, number>;
    averageRating: number;
    mostUsedTags: Array<{tag: string, count: number}>;
    reviewFrequency: Array<{date: string, count: number}>;
  }>>;
  
  /** 生成复盘报告 */
  generateReport(userId: UserId, startDate: Timestamp, endDate: Timestamp): Promise<ApiResponse<{
    summary: string;
    insights: string[];
    recommendations: string[];
    performance: PerformanceMetrics;
  }>>;
  
  /** 导出日志 */
  export(userId: UserId, format: 'json' | 'pdf' | 'markdown'): Promise<ApiResponse<string>>;
  
  /** 获取模板 */
  getTemplates(type: string): Promise<ApiResponse<Array<{
    name: string;
    content: string;
    tags: string[];
  }>>>;
}

// ============= 市场数据服务接口 =============

export interface MarketDataService {
  /** 获取实时价格 */
  getRealTimePrice(symbol: string): Promise<ApiResponse<MarketData>>;
  
  /** 批量获取实时价格 */
  getBatchRealTimePrices(symbols: string[]): Promise<ApiResponse<MarketData[]>>;
  
  /** 获取历史数据 */
  getHistoricalData(symbol: string, startDate: Timestamp, endDate: Timestamp, interval: string): Promise<ApiResponse<MarketData[]>>;
  
  /** 搜索股票/基金 */
  searchSecurities(keyword: string): Promise<ApiResponse<Array<{
    symbol: string;
    name: string;
    type: string;
    market: string;
  }>>>;
  
  /** 获取市场概况 */
  getMarketOverview(): Promise<ApiResponse<{
    indices: MarketData[];
    topGainers: MarketData[];
    topLosers: MarketData[];
    mostActive: MarketData[];
  }>>;
  
  /** 订阅价格更新 */
  subscribePriceUpdates(symbols: string[], callback: (data: MarketData) => void): Promise<() => void>;
}

// ============= 分析服务接口 =============

export interface AnalyticsService {
  /** 获取投资组合分析 */
  getPortfolioAnalysis(userId: UserId): Promise<ApiResponse<{
    allocation: AssetAllocation[];
    performance: PerformanceMetrics;
    riskMetrics: {
      beta: number;
      alpha: number;
      correlation: number;
      var: number; // Value at Risk
    };
    diversification: {
      score: number;
      suggestions: string[];
    };
  }>>;
  
  /** 获取风险分析 */
  getRiskAnalysis(userId: UserId): Promise<ApiResponse<{
    overallRisk: number;
    riskByAsset: Array<{assetId: EntityId, risk: number}>;
    concentrationRisk: number;
    recommendations: string[];
  }>>;
  
  /** 获取收益归因分析 */
  getReturnAttribution(userId: UserId, startDate: Timestamp, endDate: Timestamp): Promise<ApiResponse<{
    totalReturn: number;
    assetContribution: Array<{assetId: EntityId, contribution: number}>;
    sectorContribution: Array<{sector: string, contribution: number}>;
    allocationEffect: number;
    selectionEffect: number;
  }>>;
  
  /** 获取趋势分析 */
  getTrendAnalysis(userId: UserId): Promise<ApiResponse<{
    trends: Array<{
      period: string;
      direction: 'up' | 'down' | 'sideways';
      strength: number;
      confidence: number;
    }>;
    patterns: string[];
    signals: Array<{
      type: 'buy' | 'sell' | 'hold';
      asset: string;
      confidence: number;
      reason: string;
    }>;
  }>>;
}

// ============= 报告服务接口 =============

export interface ReportService {
  /** 生成投资组合报告 */
  generatePortfolioReport(userId: UserId, options: {
    startDate: Timestamp;
    endDate: Timestamp;
    format: 'pdf' | 'excel' | 'html';
    sections: string[];
  }): Promise<ApiResponse<string>>;
  
  /** 生成交易报告 */
  generateTransactionReport(userId: UserId, options: {
    startDate: Timestamp;
    endDate: Timestamp;
    assetIds?: EntityId[];
    format: 'pdf' | 'excel' | 'csv';
  }): Promise<ApiResponse<string>>;
  
  /** 生成税务报告 */
  generateTaxReport(userId: UserId, taxYear: number): Promise<ApiResponse<{
    capitalGains: number;
    capitalLosses: number;
    dividends: number;
    interest: number;
    transactions: Transaction[];
    reportUrl: string;
  }>>;
  
  /** 生成定期报告 */
  generatePeriodicReport(userId: UserId, period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<ApiResponse<{
    reportUrl: string;
    summary: string;
    highlights: string[];
  }>>;
  
  /** 获取报告历史 */
  getReportHistory(userId: UserId): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    createdAt: Timestamp;
    url: string;
    status: 'generating' | 'completed' | 'failed';
  }>>>;
}

// ============= 通知服务接口 =============

export interface NotificationService {
  /** 发送通知 */
  send(userId: UserId, notification: {
    type: 'price_alert' | 'plan_update' | 'system' | 'reminder';
    title: string;
    message: string;
    data?: any;
  }): Promise<ApiResponse<boolean>>;
  
  /** 获取通知列表 */
  getNotifications(userId: UserId, query?: {
    type?: string;
    read?: boolean;
    limit?: number;
  }): Promise<PaginatedResponse<{
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: Timestamp;
  }>>;
  
  /** 标记为已读 */
  markAsRead(userId: UserId, notificationIds: string[]): Promise<ApiResponse<boolean>>;
  
  /** 设置价格提醒 */
  setPriceAlert(userId: UserId, alert: {
    assetId: EntityId;
    condition: 'above' | 'below';
    price: number;
    enabled: boolean;
  }): Promise<ApiResponse<boolean>>;
  
  /** 获取价格提醒 */
  getPriceAlerts(userId: UserId): Promise<ApiResponse<Array<{
    id: string;
    assetId: EntityId;
    condition: 'above' | 'below';
    price: number;
    enabled: boolean;
    createdAt: Timestamp;
  }>>>;
}

// ============= 数据同步服务接口 =============

export interface SyncService {
  /** 同步到云端 */
  syncToCloud(userId: UserId): Promise<ApiResponse<{
    success: boolean;
    syncedItems: number;
    errors: string[];
  }>>;
  
  /** 从云端同步 */
  syncFromCloud(userId: UserId): Promise<ApiResponse<{
    success: boolean;
    updatedItems: number;
    conflicts: Array<{
      type: string;
      localItem: any;
      cloudItem: any;
    }>;
  }>>;
  
  /** 获取同步状态 */
  getSyncStatus(userId: UserId): Promise<ApiResponse<{
    lastSync: Timestamp;
    pendingItems: number;
    conflicts: number;
    status: 'synced' | 'pending' | 'error';
  }>>;
  
  /** 解决冲突 */
  resolveConflicts(userId: UserId, resolutions: Array<{
    id: string;
    resolution: 'local' | 'cloud' | 'merge';
  }>): Promise<ApiResponse<boolean>>;
  
  /** 备份数据 */
  backup(userId: UserId): Promise<ApiResponse<{
    backupId: string;
    url: string;
    size: number;
  }>>;
  
  /** 恢复数据 */
  restore(userId: UserId, backupId: string): Promise<ApiResponse<boolean>>;
}

// ============= 服务工厂接口 =============

export interface ServiceFactory {
  /** 获取资产服务 */
  getAssetService(): AssetService;
  
  /** 获取交易服务 */
  getTransactionService(): TransactionService;
  
  /** 获取计划服务 */
  getPlanService(): PlanService;
  
  /** 获取复盘服务 */
  getReviewService(): ReviewService;
  
  /** 获取市场数据服务 */
  getMarketDataService(): MarketDataService;
  
  /** 获取分析服务 */
  getAnalyticsService(): AnalyticsService;
  
  /** 获取报告服务 */
  getReportService(): ReportService;
  
  /** 获取通知服务 */
  getNotificationService(): NotificationService;
  
  /** 获取同步服务 */
  getSyncService(): SyncService;
}