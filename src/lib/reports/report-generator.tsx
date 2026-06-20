/**
 * 智能报表生成器
 * 支持自动化报表生成、模板定制和多格式导出
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { 
  DataAnalysisManager, 
  StatisticalSummary, 
  AnalysisResult, 
  DataPoint 
} from './data-analysis';
import { 
  TimeSeriesChart, 
  AreaChart, 
  BarChart, 
  PieChart 
} from '@/components/charts/enhanced-charts';

// 报表模板定义
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  defaultDateRange: 'last7days' | 'last30days' | 'last3months' | 'last6months' | 'last12months';
  autoGenerate: boolean;
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface ReportSection {
  id: string;
  type: 'chart' | 'table' | 'metrics' | 'insights' | 'custom';
  title: string;
  subtitle?: string;
  config: any;
  dataSource: string;
  filters?: any[];
}

// 预定义报表模板
export const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'portfolio-overview',
    name: '投资组合概览',
    description: '全面的投资组合表现分析报告',
    defaultDateRange: 'last30days',
    autoGenerate: true,
    schedule: 'weekly',
    sections: [
      {
        id: 'portfolio-value-trend',
        type: 'chart',
        title: '投资组合价值趋势',
        subtitle: '过去30天的价值变化',
        config: {
          chartType: 'line',
          metrics: ['totalValue', 'pnl'],
          showTrendline: true,
        },
        dataSource: 'portfolio',
      },
      {
        id: 'asset-allocation',
        type: 'chart',
        title: '资产配置',
        subtitle: '按资产类型分布',
        config: {
          chartType: 'pie',
          groupBy: 'assetType',
        },
        dataSource: 'assets',
      },
      {
        id: 'performance-metrics',
        type: 'metrics',
        title: '关键指标',
        config: {
          metrics: ['totalReturn', 'roi', 'volatility', 'sharpeRatio'],
          period: '30d',
        },
        dataSource: 'portfolio',
      },
      {
        id: 'top-performers',
        type: 'table',
        title: '表现最佳资产',
        config: {
          limit: 10,
          sortBy: 'return',
          columns: ['symbol', 'name', 'return', 'value'],
        },
        dataSource: 'assets',
      },
      {
        id: 'insights',
        type: 'insights',
        title: '智能分析',
        config: {
          includeRecommendations: true,
          includeTrends: true,
          includeRisks: true,
        },
        dataSource: 'analysis',
      },
    ],
  },
  {
    id: 'monthly-summary',
    name: '月度总结',
    description: '月度投资表现和市场分析',
    defaultDateRange: 'last30days',
    autoGenerate: true,
    schedule: 'monthly',
    sections: [
      {
        id: 'monthly-performance',
        type: 'chart',
        title: '月度表现对比',
        config: {
          chartType: 'bar',
          compareWith: 'previousMonth',
        },
        dataSource: 'portfolio',
      },
      {
        id: 'sector-analysis',
        type: 'chart',
        title: '行业表现分析',
        config: {
          chartType: 'bar',
          groupBy: 'sector',
          metrics: ['return', 'volume'],
        },
        dataSource: 'assets',
      },
    ],
  },
  {
    id: 'risk-assessment',
    name: '风险评估报告',
    description: '投资组合风险分析和建议',
    defaultDateRange: 'last3months',
    autoGenerate: false,
    sections: [
      {
        id: 'volatility-analysis',
        type: 'chart',
        title: '波动率分析',
        config: {
          chartType: 'area',
          metrics: ['volatility', 'beta'],
        },
        dataSource: 'risk',
      },
      {
        id: 'correlation-matrix',
        type: 'custom',
        title: '相关性矩阵',
        config: {
          componentType: 'CorrelationMatrix',
        },
        dataSource: 'correlations',
      },
    ],
  },
];

// 报表生成器类
export class ReportGenerator {
  private dataCache = new Map<string, any>();
  
  /**
   * 生成报表
   */
  async generateReport(
    template: ReportTemplate,
    dateRange: { start: Date; end: Date },
    customData?: Record<string, any>
  ): Promise<GeneratedReport> {
    const startTime = Date.now();
    
    try {
      // 准备数据
      const reportData = await this.prepareReportData(template, dateRange, customData);
      
      // 生成各个部分
      const sections = await Promise.all(
        template.sections.map(section => this.generateSection(section, reportData))
      );
      
      // 生成摘要
      const summary = await this.generateSummary(reportData, sections);
      
      const report: GeneratedReport = {
        id: `${template.id}-${Date.now()}`,
        templateId: template.id,
        title: template.name,
        generatedAt: new Date(),
        dateRange,
        summary,
        sections,
        metadata: {
          generationTime: Date.now() - startTime,
          dataPoints: this.countDataPoints(reportData),
          version: '1.0.0',
        },
      };
      
      return report;
    } catch (error) {
      throw new Error(`报表生成失败: ${error.message}`);
    }
  }

  /**
   * 准备报表数据
   */
  private async prepareReportData(
    template: ReportTemplate,
    dateRange: { start: Date; end: Date },
    customData?: Record<string, any>
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = { ...customData };
    
    // 根据数据源获取数据
    const dataSources = new Set(template.sections.map(s => s.dataSource));
    
    for (const source of dataSources) {
      if (!this.dataCache.has(`${source}-${dateRange.start}-${dateRange.end}`)) {
        const sourceData = await this.fetchDataSource(source, dateRange);
        this.dataCache.set(`${source}-${dateRange.start}-${dateRange.end}`, sourceData);
      }
      data[source] = this.dataCache.get(`${source}-${dateRange.start}-${dateRange.end}`);
    }
    
    return data;
  }

  /**
   * 获取数据源数据
   */
  private async fetchDataSource(source: string, dateRange: { start: Date; end: Date }): Promise<any> {
    // 这里应该连接到实际的数据源
    // 现在返回模拟数据
    switch (source) {
      case 'portfolio':
        return this.generateMockPortfolioData(dateRange);
      case 'assets':
        return this.generateMockAssetData(dateRange);
      case 'analysis':
        return this.generateMockAnalysisData(dateRange);
      case 'risk':
        return this.generateMockRiskData(dateRange);
      default:
        return {};
    }
  }

  /**
   * 生成报表部分
   */
  private async generateSection(
    section: ReportSection,
    reportData: Record<string, any>
  ): Promise<GeneratedSection> {
    const sectionData = reportData[section.dataSource] || [];
    
    let content: React.ReactNode;
    let insights: string[] = [];
    
    switch (section.type) {
      case 'chart':
        content = this.generateChartSection(section, sectionData);
        break;
      case 'table':
        content = this.generateTableSection(section, sectionData);
        break;
      case 'metrics':
        content = this.generateMetricsSection(section, sectionData);
        break;
      case 'insights':
        const analysisResult = await DataAnalysisManager.comprehensiveAnalysis(sectionData);
        content = this.generateInsightsSection(section, analysisResult);
        insights = analysisResult.recommendations;
        break;
      case 'custom':
        content = this.generateCustomSection(section, sectionData);
        break;
      default:
        content = <div>未知的部分类型: {section.type}</div>;
    }
    
    return {
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      content,
      insights,
      dataCount: Array.isArray(sectionData) ? sectionData.length : 0,
    };
  }

  /**
   * 生成图表部分
   */
  private generateChartSection(section: ReportSection, data: any[]): React.ReactNode {
    const { config } = section;
    
    switch (config.chartType) {
      case 'line':
        return (
          <TimeSeriesChart
            data={data}
            height={400}
            lines={config.metrics?.map((metric: string, index: number) => ({
              key: metric,
              name: metric,
              color: undefined, // 使用默认颜色
            })) || [{ key: 'value', name: '数值' }]}
          />
        );
      case 'area':
        return (
          <AreaChart
            data={data}
            height={400}
            areas={config.metrics?.map((metric: string) => ({
              key: metric,
              name: metric,
            })) || [{ key: 'value', name: '数值' }]}
          />
        );
      case 'bar':
        return (
          <BarChart
            data={data}
            height={400}
            bars={config.metrics?.map((metric: string) => ({
              key: metric,
              name: metric,
            })) || [{ key: 'value', name: '数值' }]}
          />
        );
      case 'pie':
        return (
          <PieChart
            data={data}
            height={400}
          />
        );
      default:
        return <div>不支持的图表类型: {config.chartType}</div>;
    }
  }

  /**
   * 生成表格部分
   */
  private generateTableSection(section: ReportSection, data: any[]): React.ReactNode {
    const { config } = section;
    const sortedData = data
      .sort((a, b) => (b[config.sortBy] || 0) - (a[config.sortBy] || 0))
      .slice(0, config.limit || 10);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-muted">
              {config.columns.map((column: string) => (
                <th key={column} className="px-4 py-2 text-left">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr key={index} className="border-b">
                {config.columns.map((column: string) => (
                  <td key={column} className="px-4 py-2">
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /**
   * 生成指标部分
   */
  private generateMetricsSection(section: ReportSection, data: any[]): React.ReactNode {
    const { config } = section;
    
    // 计算指标
    const metrics = config.metrics.map((metric: string) => {
      const values = data.map(d => d[metric] || 0);
      const current = values[values.length - 1] || 0;
      const previous = values[values.length - 2] || 0;
      const change = current - previous;
      const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
      
      return {
        name: metric,
        value: current,
        change,
        changePercent,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      };
    });
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-card p-4 rounded-lg border">
            <div className="text-sm text-muted-foreground">{metric.name}</div>
            <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
            <div className={`text-sm ${
              metric.trend === 'up' ? 'text-green-600' : 
              metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    );
  }

  /**
   * 生成洞察部分
   */
  private generateInsightsSection(section: ReportSection, analysis: any): React.ReactNode {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">趋势分析</h4>
            <div className={`text-lg font-bold ${
              analysis.trend.trend === 'up' ? 'text-green-600' : 
              analysis.trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {analysis.trend.trend === 'up' ? '↗️ 上升' : 
               analysis.trend.trend === 'down' ? '↘️ 下降' : '➡️ 平稳'}
            </div>
            <div className="text-sm text-muted-foreground">
              置信度: {analysis.trend.confidence.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">波动性</h4>
            <div className="text-lg font-bold">
              {((analysis.statistics.std / analysis.statistics.mean) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">变异系数</div>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">异常值</h4>
            <div className="text-lg font-bold">
              {analysis.outliers.outliers.length}
            </div>
            <div className="text-sm text-muted-foreground">检测到的异常点</div>
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <h4 className="font-semibold mb-2">智能建议</h4>
          <ul className="space-y-2">
            {analysis.recommendations.map((recommendation: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  /**
   * 生成自定义部分
   */
  private generateCustomSection(section: ReportSection, data: any[]): React.ReactNode {
    // 这里可以根据 componentType 渲染不同的自定义组件
    return <div>自定义组件: {section.config.componentType}</div>;
  }

  /**
   * 生成报表摘要
   */
  private async generateSummary(
    reportData: Record<string, any>,
    sections: GeneratedSection[]
  ): Promise<ReportSummary> {
    // 统计数据点数量
    const totalDataPoints = this.countDataPoints(reportData);
    
    // 提取关键洞察
    const keyInsights = sections
      .flatMap(section => section.insights)
      .slice(0, 5); // 取前5个洞察
    
    // 生成执行摘要
    const executiveSummary = this.generateExecutiveSummary(reportData, sections);
    
    return {
      executiveSummary,
      keyInsights,
      dataQuality: {
        totalDataPoints,
        completeness: this.calculateCompleteness(reportData),
        accuracy: 0.95, // 模拟值
      },
      generationMetrics: {
        sectionsGenerated: sections.length,
        chartsCreated: sections.filter(s => s.content?.type?.name?.includes('Chart')).length,
        analysisPerformed: sections.filter(s => s.insights.length > 0).length,
      },
    };
  }

  // 辅助方法
  private countDataPoints(data: Record<string, any>): number {
    return Object.values(data).reduce((total, dataset) => {
      return total + (Array.isArray(dataset) ? dataset.length : 0);
    }, 0);
  }

  private calculateCompleteness(data: Record<string, any>): number {
    // 简化的完整性计算
    const datasets = Object.values(data).filter(Array.isArray);
    if (datasets.length === 0) return 1;
    
    const completeness = datasets.map(dataset => {
      const totalFields = dataset.length * (dataset[0] ? Object.keys(dataset[0]).length : 0);
      const filledFields = dataset.reduce((count, item) => {
        return count + Object.values(item).filter(value => value != null).length;
      }, 0);
      return totalFields > 0 ? filledFields / totalFields : 1;
    });
    
    return completeness.reduce((sum, val) => sum + val, 0) / completeness.length;
  }

  private generateExecutiveSummary(
    reportData: Record<string, any>,
    sections: GeneratedSection[]
  ): string {
    // 简化的执行摘要生成
    const totalSections = sections.length;
    const insightsCount = sections.reduce((sum, section) => sum + section.insights.length, 0);
    
    return `本报表包含 ${totalSections} 个分析部分，生成了 ${insightsCount} 条智能洞察。报表涵盖了投资组合的各个方面，为投资决策提供了全面的数据支持。`;
  }

  // 模拟数据生成方法
  private generateMockPortfolioData(dateRange: { start: Date; end: Date }): DataPoint[] {
    const data: DataPoint[] = [];
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      data.push({
        time: date,
        value: 100000 + Math.random() * 50000,
        totalValue: 100000 + Math.random() * 50000,
        pnl: (Math.random() - 0.5) * 10000,
      });
    }
    
    return data;
  }

  private generateMockAssetData(dateRange: { start: Date; end: Date }): any[] {
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', return: 15.2, value: 25000, assetType: 'Stock', sector: 'Technology' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', return: 12.8, value: 20000, assetType: 'Stock', sector: 'Technology' },
      { symbol: 'BTC', name: 'Bitcoin', return: 25.5, value: 15000, assetType: 'Crypto', sector: 'Cryptocurrency' },
    ];
  }

  private generateMockAnalysisData(dateRange: { start: Date; end: Date }): DataPoint[] {
    return this.generateMockPortfolioData(dateRange);
  }

  private generateMockRiskData(dateRange: { start: Date; end: Date }): DataPoint[] {
    const data: DataPoint[] = [];
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      data.push({
        time: date,
        value: Math.random() * 0.5,
        volatility: Math.random() * 0.3,
        beta: 0.5 + Math.random() * 1.0,
      });
    }
    
    return data;
  }
}

// 类型定义
export interface GeneratedReport {
  id: string;
  templateId: string;
  title: string;
  generatedAt: Date;
  dateRange: { start: Date; end: Date };
  summary: ReportSummary;
  sections: GeneratedSection[];
  metadata: {
    generationTime: number;
    dataPoints: number;
    version: string;
  };
}

export interface GeneratedSection {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  insights: string[];
  dataCount: number;
}

export interface ReportSummary {
  executiveSummary: string;
  keyInsights: string[];
  dataQuality: {
    totalDataPoints: number;
    completeness: number;
    accuracy: number;
  };
  generationMetrics: {
    sectionsGenerated: number;
    chartsCreated: number;
    analysisPerformed: number;
  };
}

// 报表组件
export const ReportViewer: React.FC<{
  report: GeneratedReport;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
}> = ({ report, onExport }) => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* 报表头部 */}
      <div className="border-b pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{report.title}</h1>
            <p className="text-muted-foreground mt-2">
              生成时间: {format(report.generatedAt, 'yyyy-MM-dd HH:mm:ss')}
            </p>
            <p className="text-muted-foreground">
              数据范围: {format(report.dateRange.start, 'yyyy-MM-dd')} 至 {format(report.dateRange.end, 'yyyy-MM-dd')}
            </p>
          </div>
          
          {onExport && (
            <div className="space-x-2">
              <button onClick={() => onExport('pdf')} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
                导出 PDF
              </button>
              <button onClick={() => onExport('excel')} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
                导出 Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 执行摘要 */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">执行摘要</h2>
        <p className="text-muted-foreground mb-4">{report.summary.executiveSummary}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{report.summary.dataQuality.totalDataPoints}</div>
            <div className="text-sm text-muted-foreground">数据点</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{(report.summary.dataQuality.completeness * 100).toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">数据完整性</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{report.summary.generationMetrics.sectionsGenerated}</div>
            <div className="text-sm text-muted-foreground">分析部分</div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">关键洞察</h3>
          <ul className="space-y-1">
            {report.summary.keyInsights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span className="text-sm">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 报表内容 */}
      <div className="space-y-8">
        {report.sections.map((section) => (
          <div key={section.id} className="bg-card p-6 rounded-lg border">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              {section.subtitle && (
                <p className="text-muted-foreground">{section.subtitle}</p>
              )}
            </div>
            
            <div className="mb-4">
              {section.content}
            </div>
            
            {section.insights.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">分析洞察</h4>
                <ul className="space-y-1">
                  {section.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};