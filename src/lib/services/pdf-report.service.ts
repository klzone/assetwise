import { User, Account, Transaction, Asset, ReviewLog } from '../types/data.types';
import { errorHandler } from './error-handler.service';

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

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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
          // @ts-ignore - created_at might be missing in some types or named differently
          const dateStr = r.created_at || r.createdAt || r.date || new Date().toISOString();
          const reviewDate = new Date(dateStr);
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
      // @ts-ignore
      errorHandler.handleError(error, 'DATA_ERROR', userData.id?.toString());
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
    const totalAssets = data.assets.reduce((sum, asset) => sum + (asset.total_value || 0), 0);
    const totalTransactions = data.transactions.length;
    const totalReviews = data.reviews.length;

    // 计算日期范围
    const allDates = [
      ...data.transactions.map(t => new Date(t.transaction_date)),
      ...data.reviews.map(r => {
        // @ts-ignore
        const dateStr = r.created_at || r.createdAt || r.date || new Date().toISOString();
        return new Date(dateStr);
      })
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

  /**
   * 生成并下载PDF报告
   */
  generatePDF(data: ReportData, config: ReportConfig): void {
    const doc = new jsPDF();
    const stats = this.calculateBasicStatistics(data);

    // 设置字体 (这里假设默认字体支持中文，或者需要加载中文字体，为简化起见，我们使用英文或尽量简单的中文)
    // 注意：jsPDF 默认不支持中文，需要 addFont。这里为了演示，我们先用英文标题，或者假设已配置字体。
    // 实际生产中需要引入中文字体文件。
    // doc.addFont('path/to/font.ttf', 'MyFont', 'normal');
    // doc.setFont('MyFont');

    // 标题
    doc.setFontSize(20);
    doc.text(config.customTitle || 'AssetWise Investment Report', 14, 22);

    // 日期
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 30);
    doc.text(`Period: ${stats.dateRange.start} to ${stats.dateRange.end}`, 14, 35);

    let yPos = 45;

    // 摘要
    if (config.includeSummary) {
      doc.setFontSize(14);
      doc.text('Summary', 14, yPos);
      yPos += 10;
      doc.setFontSize(10);
      const summary = this.generateReportSummary(data, { ...config, language: 'en' }); // Force EN for PDF safety if no font
      const splitSummary = doc.splitTextToSize(summary, 180);
      doc.text(splitSummary, 14, yPos);
      yPos += splitSummary.length * 7 + 10;
    }

    // 资产列表
    if (config.includeDetails && data.assets.length > 0) {
      doc.setFontSize(14);
      doc.text('Assets Portfolio', 14, yPos);
      yPos += 5;

      const assetRows = data.assets.map(asset => {
        const costBasis = asset.quantity * asset.average_price;
        const currentValue = asset.total_value || 0;
        const gainLoss = currentValue - costBasis;

        return [
          asset.symbol || '',
          asset.name || '',
          asset.quantity.toString(),
          costBasis.toFixed(2),
          currentValue.toFixed(2),
          gainLoss.toFixed(2)
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Symbol', 'Name', 'Quantity', 'Cost', 'Value', 'Gain/Loss']],
        body: assetRows,
      });

      // @ts-ignore
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // 交易记录
    if (config.includeDetails && data.transactions.length > 0) {
      // Check for page break
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Recent Transactions', 14, yPos);
      yPos += 5;

      const transRows = data.transactions.slice(0, 50).map(t => [ // Limit to 50 for PDF
        format(new Date(t.transaction_date), 'yyyy-MM-dd'),
        t.type || '',
        t.symbol || '',
        t.amount.toFixed(2),
        (t.price || 0).toFixed(2)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Type', 'Symbol', 'Amount', 'Price']],
        body: transRows,
      });

      // @ts-ignore
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // 保存
    doc.save(`AssetWise-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
}
