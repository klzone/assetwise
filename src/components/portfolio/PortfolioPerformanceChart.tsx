'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUpIcon, TrendingDownIcon, CalendarIcon } from 'lucide-react';
import { Portfolio, PortfolioPerformance } from '@/lib/types/portfolio.types';
import { PortfolioService } from '@/lib/services/portfolio.service';

interface PortfolioPerformanceChartProps {
  portfolio: Portfolio;
}

export function PortfolioPerformanceChart({ portfolio }: PortfolioPerformanceChartProps) {
  const [performanceData, setPerformanceData] = useState<PortfolioPerformance[]>([]);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M');
  const [loading, setLoading] = useState(true);

  const portfolioService = new PortfolioService();

  useEffect(() => {
    loadPerformanceData();
  }, [portfolio.id, timeRange]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      // 这里应该从服务获取真实的业绩数据
      // 现在生成模拟数据
      const mockData = generateMockPerformanceData();
      setPerformanceData(mockData);
    } catch (error) {
      console.error('加载业绩数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockPerformanceData = (): PortfolioPerformance[] => {
    const data: PortfolioPerformance[] = [];
    const startDate = new Date();
    const days = timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '6M' ? 180 : timeRange === '1Y' ? 365 : 365;
    
    startDate.setDate(startDate.getDate() - days);
    
    let currentValue = portfolio.total_value * 0.9; // 假设起始值
    let currentReturn = -5; // 假设起始收益率
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // 模拟价格波动
      const change = (Math.random() - 0.5) * 0.02; // ±1%的随机波动
      currentValue *= (1 + change);
      currentReturn += change * 100;
      
      data.push({
        id: `perf-${i}`,
        portfolio_id: portfolio.id,
        date: date.toISOString().split('T')[0],
        total_value: currentValue,
        total_return_percentage: currentReturn,
        daily_return_percentage: change * 100,
        benchmark_return_percentage: currentReturn * 0.8, // 假设基准收益
        created_at: date.toISOString(),
        updated_at: date.toISOString()
      });
    }
    
    return data;
  };

  const formatChartData = () => {
    return performanceData.map(item => ({
      date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      value: item.total_value,
      return: item.total_return_percentage,
      benchmark: item.benchmark_return_percentage,
      dailyReturn: item.daily_return_percentage
    }));
  };

  const calculateMetrics = () => {
    if (performanceData.length === 0) return null;
    
    const latest = performanceData[performanceData.length - 1];
    const earliest = performanceData[0];
    
    const totalReturn = latest.total_return_percentage - earliest.total_return_percentage;
    const totalValue = latest.total_value;
    const maxValue = Math.max(...performanceData.map(d => d.total_value));
    const minValue = Math.min(...performanceData.map(d => d.total_value));
    const volatility = calculateVolatility();
    const sharpeRatio = calculateSharpeRatio(totalReturn, volatility);
    
    return {
      totalReturn,
      totalValue,
      maxValue,
      minValue,
      volatility,
      sharpeRatio,
      maxDrawdown: calculateMaxDrawdown()
    };
  };

  const calculateVolatility = () => {
    if (performanceData.length < 2) return 0;
    
    const returns = performanceData.map(d => d.daily_return_percentage);
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252); // 年化波动率
  };

  const calculateSharpeRatio = (totalReturn: number, volatility: number) => {
    const riskFreeRate = 3; // 假设无风险利率3%
    if (volatility === 0) return 0;
    return (totalReturn - riskFreeRate) / volatility;
  };

  const calculateMaxDrawdown = () => {
    if (performanceData.length === 0) return 0;
    
    let maxDrawdown = 0;
    let peak = performanceData[0].total_value;
    
    for (const data of performanceData) {
      if (data.total_value > peak) {
        peak = data.total_value;
      }
      const drawdown = (peak - data.total_value) / peak * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  };

  const chartData = formatChartData();
  const metrics = calculateMetrics();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">加载业绩数据...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 业绩指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总收益率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(metrics?.totalReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(metrics?.totalReturn || 0) >= 0 ? '+' : ''}{(metrics?.totalReturn || 0).toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">年化波动率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.volatility || 0).toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">夏普比率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.sharpeRatio || 0).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">最大回撤</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{(metrics?.maxDrawdown || 0).toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 时间范围选择和图表 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>投资组合表现</CardTitle>
              <CardDescription>资产价值和收益率变化趋势</CardDescription>
            </div>
            <div className="flex space-x-2">
              {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 资产价值图表 */}
            <div>
              <h4 className="font-medium mb-3">资产价值变化</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`¥${value.toLocaleString()}`, '资产价值']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 收益率对比图表 */}
            <div>
              <h4 className="font-medium mb-3">收益率对比</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="return" 
                      stroke="#8884d8" 
                      name="投资组合收益率"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#82ca9d" 
                      name="基准收益率"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 业绩分析 */}
      <Card>
        <CardHeader>
          <CardTitle>业绩分析</CardTitle>
          <CardDescription>投资组合的风险收益特征分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 收益分析 */}
            <div className="space-y-4">
              <h4 className="font-medium">收益分析</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">期间收益率</span>
                  <span className={`font-medium ${(metrics?.totalReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(metrics?.totalReturn || 0) >= 0 ? '+' : ''}{(metrics?.totalReturn || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">年化收益率</span>
                  <span className="font-medium">
                    {((metrics?.totalReturn || 0) * (365 / (performanceData.length || 1))).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">最高价值</span>
                  <span className="font-medium">¥{(metrics?.maxValue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">最低价值</span>
                  <span className="font-medium">¥{(metrics?.minValue || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 风险分析 */}
            <div className="space-y-4">
              <h4 className="font-medium">风险分析</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">年化波动率</span>
                  <span className="font-medium">{(metrics?.volatility || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">最大回撤</span>
                  <span className="font-medium text-red-600">-{(metrics?.maxDrawdown || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">夏普比率</span>
                  <Badge variant={(metrics?.sharpeRatio || 0) > 1 ? 'default' : (metrics?.sharpeRatio || 0) > 0.5 ? 'secondary' : 'destructive'}>
                    {(metrics?.sharpeRatio || 0).toFixed(2)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">风险等级</span>
                  <Badge variant={portfolio.risk_level === 'high' ? 'destructive' : 
                                portfolio.risk_level === 'medium' ? 'default' : 'secondary'}>
                    {portfolio.risk_level === 'high' ? '高风险' : 
                     portfolio.risk_level === 'medium' ? '中风险' : '低风险'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* 业绩评价 */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">业绩评价</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {(metrics?.sharpeRatio || 0) > 1 ? (
                <p>• 优秀：夏普比率大于1，风险调整后收益表现优秀</p>
              ) : (metrics?.sharpeRatio || 0) > 0.5 ? (
                <p>• 良好：夏普比率在0.5-1之间，风险调整后收益表现良好</p>
              ) : (
                <p>• 需要改进：夏普比率较低，建议优化投资组合配置</p>
              )}
              
              {(metrics?.maxDrawdown || 0) < 10 ? (
                <p>• 回撤控制良好，最大回撤小于10%</p>
              ) : (metrics?.maxDrawdown || 0) < 20 ? (
                <p>• 回撤控制一般，最大回撤在10-20%之间</p>
              ) : (
                <p>• 回撤较大，建议关注风险控制</p>
              )}
              
              {(metrics?.volatility || 0) < 15 ? (
                <p>• 波动率较低，投资组合相对稳定</p>
              ) : (metrics?.volatility || 0) < 25 ? (
                <p>• 波动率适中，符合中等风险特征</p>
              ) : (
                <p>• 波动率较高，属于高风险投资组合</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
