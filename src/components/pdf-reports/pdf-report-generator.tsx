'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store';
import type { ReportConfig } from '@/lib/services/pdf-report.service';

// 简化的 ReportConfig 类型定义
// 简化的 toast 函数
const toast = {
  error: (message: string) => console.error(message),
  success: (message: string) => console.log(message),
};

interface PDFReportGeneratorProps {
  className?: string;
}

export const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({ className }) => {
  const { user } = useUserStore();
  const [reportType, setReportType] = useState<'assets' | 'transactions' | 'reviews' | 'comprehensive'>('assets');
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
    includePerformanceAnalysis: true,
    includeRiskAnalysis: true,
    customTitle: '',
  });
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined,
  });



  // 检查是否为专业版或旗舰版用户
  const isProfessional = user?.subscription_type === 'professional' || user?.subscription_type === 'flagship';

  const handleGenerateReport = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (!isProfessional) {
      toast.error('PDF报告生成功能仅限专业版用户使用');
      return;
    }

    setIsGenerating(true);

    try {
      // 准备配置
      const reportConfig: ReportConfig = {
        ...config,
        includePerformanceAnalysis: !!config.includePerformanceAnalysis, // Ensure boolean
        includeRiskAnalysis: !!config.includeRiskAnalysis, // Ensure boolean
        dateRange: dateRange.start && dateRange.end ? {
          start: dateRange.start,
          end: dateRange.end,
        } : undefined,
      };

      // 动态导入服务以避免SSR问题
      const { PDFReportService } = await import('@/lib/services/pdf-report.service');

      // 动态导入 stores (或者直接使用 hooks 如果是在组件顶层，但这里是在函数内部)
      // 注意：在组件内部使用 store hooks 是响应式的，但在 async 函数中我们需要获取当前状态
      // 我们需要导入 store 实例来获取 getState()
      const { useAccountStore, useTransactionStore, useAssetStore, useReviewLogStore } = await import('@/store');

      const pdfService = new PDFReportService();

      // 获取数据 (从 store 中获取当前状态)
      const accounts = useAccountStore.getState().accounts;
      const transactions = useTransactionStore.getState().transactions;
      const assets = useAssetStore.getState().assets;
      const reviews = useReviewLogStore.getState().reviewLogs;

      // 构造符合 User 接口的用户对象
      const reportUser = {
        id: user.id,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        subscription_type: user.subscription_type,
        created_at: new Date().toISOString(), // AuthUser 可能没有 created_at，使用当前时间或默认值
      };

      // 生成报告数据
      const reportData = await pdfService.generateBasicReportData(
        reportUser,
        accounts,
        transactions,
        assets,
        reviews,
        reportConfig
      );

      // 生成PDF
      pdfService.generatePDF(reportData, reportConfig);

      toast.success('PDF报告生成成功！');
    } catch (error) {
      console.error('生成报告失败:', error);
      toast.error('生成报告失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'assets':
        return '资产分析报告';
      case 'transactions':
        return '交易记录报告';
      case 'reviews':
        return '复盘日志报告';
      case 'comprehensive':
        return '综合投资报告';
      default:
        return '投资报告';
    }
  };

  if (!isProfessional) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            PDF报告生成
          </CardTitle>
          <CardDescription>
            专业版独享功能 - 生成专业的投资分析PDF报告
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">专业版功能</h3>
            <p className="text-muted-foreground mb-4">
              PDF报告生成功能仅限专业版用户使用
            </p>
            <Button variant="outline" disabled>
              升级到专业版
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF报告生成
          <Crown className="h-4 w-4 text-yellow-500" />
        </CardTitle>
        <CardDescription>
          生成专业的投资分析PDF报告，支持多种报告类型和自定义配置
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 报告类型选择 */}
        <div className="space-y-2">
          <Label htmlFor="report-type">报告类型</Label>
          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择报告类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assets">资产分析报告</SelectItem>
              <SelectItem value="transactions">交易记录报告</SelectItem>
              <SelectItem value="reviews">复盘日志报告</SelectItem>
              <SelectItem value="comprehensive">综合投资报告</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 自定义标题 */}
        <div className="space-y-2">
          <Label htmlFor="custom-title">自定义标题（可选）</Label>
          <Input
            id="custom-title"
            placeholder={`默认: ${getReportTypeLabel(reportType)}`}
            value={config.customTitle}
            onChange={(e) => setConfig({ ...config, customTitle: e.target.value })}
          />
        </div>

        {/* 日期范围选择 */}
        <div className="space-y-2">
          <Label>日期范围（可选）</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full max-w-[200px] justify-start text-left font-normal truncate",
                    !dateRange.start && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {dateRange.start ? format(dateRange.start, "yyyy-MM-dd", { locale: zhCN }) : "开始日期"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.start}
                  onSelect={(date: Date | undefined) => setDateRange({ ...dateRange, start: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full max-w-[200px] justify-start text-left font-normal truncate",
                    !dateRange.end && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {dateRange.end ? format(dateRange.end, "yyyy-MM-dd", { locale: zhCN }) : "结束日期"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.end}
                  onSelect={(date: Date | undefined) => setDateRange({ ...dateRange, end: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 报告配置选项 */}
        <div className="space-y-3">
          <Label>报告内容</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-summary"
                checked={config.includeSummary}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, includeSummary: checked as boolean })
                }
              />
              <Label htmlFor="include-summary">包含摘要信息</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-details"
                checked={config.includeDetails}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, includeDetails: checked as boolean })
                }
              />
              <Label htmlFor="include-details">包含详细数据</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={config.includeCharts}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, includeCharts: checked as boolean })
                }
              />
              <Label htmlFor="include-charts">包含图表（占位符）</Label>
            </div>
          </div>
        </div>

        {/* 生成按钮 */}
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          {isGenerating ? '正在生成...' : '生成PDF报告'}
        </Button>
      </CardContent>
    </Card>
  );
};
