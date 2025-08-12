import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReportData, ReportConfig } from '../../lib/services/pdf-report.service';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
  },
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
    textAlign: 'left',
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
  },
  tableCellNumber: {
    fontSize: 9,
    flex: 1,
    textAlign: 'right',
  },
  summary: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#dc2626',
  },
  neutral: {
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#f3f4f6',
    border: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

interface AssetReportTemplateProps {
  data: ReportData;
  config: ReportConfig;
  statistics: any;
}

export const AssetReportTemplate: React.FC<AssetReportTemplateProps> = ({ 
  data, 
  config, 
  statistics 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN');
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 报告头部 */}
        <View style={styles.header}>
          <Text style={styles.title}>AssetWise 资产分析报告</Text>
          <Text style={styles.subtitle}>
            生成时间: {formatDate(data.reportDate)} | 用户: {data.user.username} | 专业版报告
          </Text>
        </View>

        {/* 资产概览 */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>资产概览</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>总资产价值:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(statistics.totalValue)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>总投入成本:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(statistics.totalCost)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>盈亏金额:</Text>
            <Text style={[
              styles.summaryValue,
              statistics.totalGainLoss >= 0 ? styles.positive : styles.negative
            ]}>
              {formatCurrency(statistics.totalGainLoss)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>盈亏比例:</Text>
            <Text style={[
              styles.summaryValue,
              statistics.gainLossPercentage >= 0 ? styles.positive : styles.negative
            ]}>
              {formatPercentage(statistics.gainLossPercentage)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>持仓数量:</Text>
            <Text style={styles.summaryValue}>{data.assets.length} 只</Text>
          </View>
        </View>

        {/* 资产配置图表占位符 */}
        {config.includeCharts && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>资产配置分布</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>资产配置饼图</Text>
              <Text style={styles.chartText}>（图表功能将在后续版本中实现）</Text>
            </View>
          </View>
        )}

        {/* 详细资产列表 */}
        {config.includeDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>详细资产列表</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellHeader}>股票代码</Text>
                <Text style={styles.tableCellHeader}>股票名称</Text>
                <Text style={styles.tableCellHeader}>持仓数量</Text>
                <Text style={styles.tableCellHeader}>平均成本</Text>
                <Text style={styles.tableCellHeader}>当前价格</Text>
                <Text style={styles.tableCellHeader}>市值</Text>
                <Text style={styles.tableCellHeader}>盈亏</Text>
              </View>
              {data.assets.map((asset, index) => {
                const costBasis = asset.quantity * asset.avg_cost;
                const gainLoss = asset.market_value - costBasis;
                const gainLossPercentage = costBasis > 0
                  ? (gainLoss / costBasis) * 100
                  : 0;
                
                return (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{asset.symbol}</Text>
                    <Text style={styles.tableCell}>{asset.name}</Text>
                    <Text style={styles.tableCellNumber}>{asset.quantity}</Text>
                    <Text style={styles.tableCellNumber}>
                      {formatCurrency(asset.avg_cost || 0)}
                    </Text>
                    <Text style={styles.tableCellNumber}>
                      {formatCurrency(asset.current_price || 0)}
                    </Text>
                    <Text style={styles.tableCellNumber}>
                      {formatCurrency(asset.market_value || 0)}
                    </Text>
                    <Text style={[
                      styles.tableCellNumber,
                      gainLoss >= 0 ? styles.positive : styles.negative
                    ]}>
                      {formatCurrency(gainLoss)} ({formatPercentage(gainLossPercentage)})
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 账户信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关联账户</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellHeader}>账户名称</Text>
              <Text style={styles.tableCellHeader}>账户类型</Text>
              <Text style={styles.tableCellHeader}>券商</Text>
              <Text style={styles.tableCellHeader}>余额</Text>
              <Text style={styles.tableCellHeader}>状态</Text>
            </View>
            {data.accounts.map((account, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{account.name}</Text>
                <Text style={styles.tableCell}>{account.type}</Text>
                <Text style={styles.tableCell}>{account.broker || '-'}</Text>
                <Text style={styles.tableCellNumber}>
                  {formatCurrency(account.balance)}
                </Text>
                <Text style={styles.tableCell}>
                  {account.is_active ? '活跃' : '停用'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 页脚 */}
        <Text style={styles.footer}>
          AssetWise 专业版投资管理系统 | 本报告仅供参考，投资有风险，决策需谨慎
        </Text>
      </Page>
    </Document>
  );
};
