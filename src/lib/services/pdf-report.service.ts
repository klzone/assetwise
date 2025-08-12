import { User, Account, Transaction, Asset, ReviewLog } from '../types/data.types';
import { errorHandlerService } from './error-handler.service';

export interface ReportData {
  user: User;
  accounts: Account[];
  transactions: Transaction[];
  assets: Asset[];
  reviews: ReviewLog[];
  reportDate: Date;
  reportType: 'assets' | 'transactions' | 'reviews' | 'comprehensive';
}

export interface ReportConfig {
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  includePerformanceAnalysis: boolean;
  includeRiskAnalysis: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  customTitle?: string;
  language?: 'zh' | 'en';
  currency?: 'CNY' | 'USD' | 'EUR';
  theme?: 'light' | 'dark';
}

export interface ReportAnalytics {
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  assetAllocation: Array<{
    category: string;
    value: number;
    percentage: number;
  }>;
  performanceHistory: Array<{
    date: string;
    value: number;
    return: number;
  }>;
}

export class PDFReportService {
  constructor() {
    // 初始化服务
  }

  /**
   * 生成基础报告数据
   */
  async generateBasicReportData(
    userData: User,
    accounts: Account[],
    transactions: Transaction[],
    assets: Asset[],
    reviews: ReviewLog[],
    config: ReportConfig
  ): Promise<ReportData> {
    try {
      // 根据日期范围过滤数据
      let filteredTransactions = transactions;
      let filteredReviews = reviews;

      if (config.dateRange) {
        filteredTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= config.dateRange!.start &&
                 transactionDate <= config.dateRange!.end;
        });

        filteredReviews = reviews.filter(r => {
          const reviewDate = new Date(r.created_at);
          return reviewDate >= config.dateRange!.start &&
                 reviewDate <= config.dateRange!.end;
        });
      }

      return {
        user: userData,
        accounts,
        transactions: filteredTransactions,
        assets,
        reviews: filteredReviews,
        reportDate: new Date(),
        reportType: config.includePerformanceAnalysis ? 'comprehensive' : 'assets'
      };
    } catch (error) {
      errorHandlerService.handleError(error, 'DATA_ERROR', userData.id?.toString());
      throw error;
    }
  }

  /**
   * 计算基础统计数据
   */
  calculateBasicStatistics(data: ReportData): {
    totalAssets: number;
    totalTransactions: number;
    totalReviews: number;
    dateRange: { start: string; end: string };
  } {
    const totalAssets = data.assets.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
    const totalTransactions = data.transactions.length;
    const totalReviews = data.reviews.length;

    // 计算日期范围
    const allDates = [
      ...data.transactions.map(t => new Date(t.transaction_date)),
      ...data.reviews.map(r => new Date(r.created_at))
    ].filter(date => !isNaN(date.getTime()));

    const startDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
    const endDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();

    return {
      totalAssets,
      totalTransactions,
      totalReviews,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    };
  }

  /**
   * 生成报告摘要
   */
  generateReportSummary(data: ReportData, config: ReportConfig): string {
    const stats = this.calculateBasicStatistics(data);
    const { language = 'zh' } = config;

    if (language === 'en') {
      return `Investment Report Summary: ${stats.totalAssets} total assets, ${stats.totalTransactions} transactions, ${stats.totalReviews} reviews from ${stats.dateRange.start} to ${stats.dateRange.end}.`;
    }

    return `投资报告摘要：总资产 ${stats.totalAssets.toLocaleString()} 元，${stats.totalTransactions} 笔交易，${stats.totalReviews} 条复盘记录，时间范围：${stats.dateRange.start} 至 ${stats.dateRange.end}。`;
  }

}
