import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { ReportData, ReportConfig } from '../../lib/services/pdf-report.service';

// 注册中文字体（如果需要）
// Font.register({
//   family: 'NotoSansCJK',
//   src: '/fonts/NotoSansCJK-Regular.ttf'
// });

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
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    width: 100,
  },
  value: {
    fontSize: 10,
    color: '#1f2937',
    flex: 1,
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
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#dc2626',
  },
  neutral: {
    color: '#6b7280',
  },
});

interface PDFReportTemplateProps {
  data: ReportData;
  config: ReportConfig;
  statistics?: any;
}

export const PDFReportTemplate: React.FC<PDFReportTemplateProps> = ({ 
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

  const getReportTitle = () => {
    if (config.customTitle) return config.customTitle;
    
    switch (data.reportType) {
      case 'assets':
        return 'AssetWise 资产分析报告';
      case 'transactions':
        return 'AssetWise 交易记录报告';
      case 'reviews':
        return 'AssetWise 复盘日志报告';
      case 'comprehensive':
        return 'AssetWise 综合投资报告';
      default:
        return 'AssetWise 投资报告';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 报告头部 */}
        <View style={styles.header}>
          <Text style={styles.title}>{getReportTitle()}</Text>
          <Text style={styles.subtitle}>
            生成时间: {formatDate(data.reportDate)} | 用户: {data.user.username} | 专业版报告
          </Text>
        </View>

        {/* 用户信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>用户信息</Text>
          <View style={styles.row}>
            <Text style={styles.label}>用户名:</Text>
            <Text style={styles.value}>{data.user.username}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>邮箱:</Text>
            <Text style={styles.value}>{data.user.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>订阅类型:</Text>
            <Text style={styles.value}>
              {data.user.subscription_type === 'free' && '免费版'}
              {data.user.subscription_type === 'pro' && '专业版'}
              {data.user.subscription_type === 'premium' && '旗舰版'}
            </Text>
          </View>
        </View>

        {/* 报告摘要 */}
        {config.includeSummary && statistics && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>报告摘要</Text>
            
            {data.reportType === 'assets' && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>总资产价值:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(statistics.totalValue)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>总成本:</Text>
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
              </>
            )}

            {data.reportType === 'transactions' && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>交易总数:</Text>
                  <Text style={styles.summaryValue}>{statistics.transactionCount}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>总交易金额:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(statistics.totalAmount)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>总手续费:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(statistics.totalFees)}
                  </Text>
                </View>
              </>
            )}

            {data.reportType === 'reviews' && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>复盘总数:</Text>
                  <Text style={styles.summaryValue}>{statistics.reviewCount}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>平均情绪分数:</Text>
                  <Text style={styles.summaryValue}>
                    {statistics.avgEmotionScore.toFixed(1)}/10
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>积极情绪:</Text>
                  <Text style={styles.summaryValue}>
                    {statistics.emotionStats.positive} 次
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* 页脚 */}
        <Text style={styles.footer}>
          AssetWise 专业版投资管理系统 | 本报告仅供参考，投资有风险，决策需谨慎
        </Text>
      </Page>
    </Document>
  );
};
