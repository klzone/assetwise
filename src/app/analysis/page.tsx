'use client'

import React, { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, PieChart, Activity, Target, AlertTriangle, Calculator, Brain, Lightbulb, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LocaleProvider } from '@/contexts/locale-context'

// 资产分析页面 - 深度分析投资表现和趋势
export default function AnalysisPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('1Y')
  const [selectedAsset, setSelectedAsset] = useState('all')

  // 模拟分析数据
  const analysisData = {
    // 投资表现分析
    performance: {
      totalReturn: 150000,
      totalReturnPercent: 15.0,
      annualizedReturn: 12.5,
      volatility: 18.2,
      sharpeRatio: 1.25,
      maxDrawdown: -8.5,
      winRate: 68.5,
      bestMonth: { date: '2024-03', return: 8.2 },
      worstMonth: { date: '2024-08', return: -5.1 }
    },

    // 资产类别表现
    categoryPerformance: [
      { category: '房地产', return: 13.33, volatility: 5.2, sharpeRatio: 2.1, allocation: 73.9 },
      { category: '股票', return: 16.95, volatility: 22.1, sharpeRatio: 0.8, allocation: 15.3 },
      { category: '虚拟货币', return: 12.5, volatility: 45.8, sharpeRatio: 0.3, allocation: 2.0 },
      { category: '现金', return: 3.15, volatility: 0.1, sharpeRatio: 15.0, allocation: 4.5 },
      { category: '基金', return: 7.8, volatility: 15.2, sharpeRatio: 0.5, allocation: 0.9 },
      { category: '债券', return: 2.5, volatility: 3.1, sharpeRatio: 0.8, allocation: 0.9 },
      { category: '保险', return: 4.17, volatility: 1.2, sharpeRatio: 3.5, allocation: 1.1 },
      { category: '贵金属', return: 7.14, volatility: 12.8, sharpeRatio: 0.6, allocation: 0.4 }
    ],

    // 风险分析
    riskAnalysis: {
      portfolioRisk: 'medium',
      concentrationRisk: 'high', // 房地产占比过高
      liquidityRisk: 'medium',
      currencyRisk: 'low',
      interestRateRisk: 'low',
      marketRisk: 'medium'
    },

    // 投资建议
    recommendations: [
      {
        type: 'warning',
        title: '资产配置过于集中',
        description: '房地产占比73.9%，建议分散投资降低集中度风险',
        priority: 'high',
        action: '减持房地产，增加股票和债券配置'
      },
      {
        type: 'info',
        title: '现金配置偏低',
        description: '现金及等价物仅占4.5%，建议保持10-15%的流动性',
        priority: 'medium',
        action: '增加货币基金或银行理财配置'
      },
      {
        type: 'success',
        title: '债券配置不足',
        description: '债券仅占0.9%，建议增加至10-15%以降低组合波动',
        priority: 'medium',
        action: '配置国债或高等级企业债'
      },
      {
        type: 'info',
        title: '虚拟货币风险较高',
        description: '虚拟货币波动率45.8%，建议控制在5%以内',
        priority: 'low',
        action: '适当减持高风险数字资产'
      }
    ],

    // 市场趋势分析
    marketTrends: {
      stockMarket: { trend: 'bullish', confidence: 75, description: '科技股表现强劲，市场情绪乐观' },
      bondMarket: { trend: 'neutral', confidence: 60, description: '利率预期稳定，债券收益率波动较小' },
      realEstate: { trend: 'bearish', confidence: 65, description: '政策调控持续，房地产市场承压' },
      crypto: { trend: 'volatile', confidence: 45, description: '监管不确定性增加，波动性较大' },
      commodities: { trend: 'bullish', confidence: 70, description: '通胀预期推动大宗商品价格上涨' }
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return '低风险'
      case 'medium': return '中等风险'
      case 'high': return '高风险'
      default: return '未知'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'neutral': return <Activity className="h-4 w-4 text-gray-600" />
      case 'volatile': return <Activity className="h-4 w-4 text-orange-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'info': return <Lightbulb className="h-5 w-5 text-blue-600" />
      case 'success': return <Target className="h-5 w-5 text-green-600" />
      default: return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <LocaleProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">资产分析</h1>
            <p className="text-muted-foreground mt-2">
              深度分析您的投资表现，发现投资机会，优化资产配置策略
            </p>
          </div>
          <div className="flex gap-2">
            {['1M', '3M', '6M', '1Y', '3Y', '5Y'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        {/* 关键指标概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">年化收益率</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analysisData.performance.annualizedReturn.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                总收益 ¥{analysisData.performance.totalReturn.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">夏普比率</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analysisData.performance.sharpeRatio.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                风险调整后收益
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最大回撤</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {analysisData.performance.maxDrawdown.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                历史最大损失
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">胜率</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analysisData.performance.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                盈利月份占比
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 详细分析标签页 */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">表现分析</TabsTrigger>
            <TabsTrigger value="risk">风险分析</TabsTrigger>
            <TabsTrigger value="trends">市场趋势</TabsTrigger>
            <TabsTrigger value="recommendations">投资建议</TabsTrigger>
          </TabsList>

          {/* 表现分析 */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    资产类别表现
                  </CardTitle>
                  <CardDescription>
                    各资产类别的收益率和风险指标对比
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.categoryPerformance.map((item) => (
                      <div key={item.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.category}</span>
                          <div className="text-right">
                            <div className={`font-medium ${
                              item.return >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.return >= 0 ? '+' : ''}{item.return.toFixed(2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              配置: {item.allocation.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">波动率: </span>
                            <span>{item.volatility.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">夏普: </span>
                            <span>{item.sharpeRatio.toFixed(1)}</span>
                          </div>
                        </div>
                        <Progress value={item.allocation} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    历史表现
                  </CardTitle>
                  <CardDescription>
                    {selectedPeriod} 期间的投资组合表现趋势
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">表现图表</h3>
                    <p>显示投资组合的历史收益曲线</p>
                    <p className="text-sm mt-2">功能开发中...</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>关键表现指标</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      +{analysisData.performance.bestMonth.return}%
                    </div>
                    <div className="text-sm text-muted-foreground">最佳月份</div>
                    <div className="text-xs text-muted-foreground">
                      {analysisData.performance.bestMonth.date}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {analysisData.performance.worstMonth.return}%
                    </div>
                    <div className="text-sm text-muted-foreground">最差月份</div>
                    <div className="text-xs text-muted-foreground">
                      {analysisData.performance.worstMonth.date}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {analysisData.performance.volatility.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">年化波动率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {analysisData.performance.winRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">胜率</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 风险分析 */}
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    风险评估
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">投资组合风险</span>
                    <Badge className={getRiskColor(analysisData.riskAnalysis.portfolioRisk)}>
                      {getRiskText(analysisData.riskAnalysis.portfolioRisk)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">集中度风险</span>
                    <Badge className={getRiskColor(analysisData.riskAnalysis.concentrationRisk)}>
                      {getRiskText(analysisData.riskAnalysis.concentrationRisk)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">流动性风险</span>
                    <Badge className={getRiskColor(analysisData.riskAnalysis.liquidityRisk)}>
                      {getRiskText(analysisData.riskAnalysis.liquidityRisk)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">汇率风险</span>
                    <Badge className={getRiskColor(analysisData.riskAnalysis.currencyRisk)}>
                      {getRiskText(analysisData.riskAnalysis.currencyRisk)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">利率风险</span>
                    <Badge className={getRiskColor(analysisData.riskAnalysis.interestRateRisk)}>
                      {getRiskText(analysisData.riskAnalysis.interestRateRisk)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">市场风险</span>
                    <Badge className={getRiskColor(analysisData.riskAnalysis.marketRisk)}>
                      {getRiskText(analysisData.riskAnalysis.marketRisk)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>风险分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    风险分布图表
                    <br />
                    <small>功能开发中...</small>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 市场趋势 */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  市场趋势分析
                </CardTitle>
                <CardDescription>
                  基于市场数据和技术指标的趋势判断
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analysisData.marketTrends).map(([market, data]) => (
                    <div key={market} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(data.trend)}
                          <h4 className="font-medium">
                            {market === 'stockMarket' && '股票市场'}
                            {market === 'bondMarket' && '债券市场'}
                            {market === 'realEstate' && '房地产市场'}
                            {market === 'crypto' && '虚拟货币市场'}
                            {market === 'commodities' && '大宗商品市场'}
                          </h4>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            信心度: {data.confidence}%
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{data.description}</p>
                      <Progress value={data.confidence} className="mt-2 h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 投资建议 */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  智能投资建议
                </CardTitle>
                <CardDescription>
                  基于您的投资组合分析生成的个性化建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {getRecommendationIcon(rec.type)}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{rec.title}</h4>
                            <Badge variant={
                              rec.priority === 'high' ? 'destructive' :
                              rec.priority === 'medium' ? 'default' : 'secondary'
                            }>
                              {rec.priority === 'high' && '高优先级'}
                              {rec.priority === 'medium' && '中优先级'}
                              {rec.priority === 'low' && '低优先级'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {rec.description}
                          </p>
                          <div className="text-sm font-medium text-blue-600">
                            建议行动: {rec.action}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LocaleProvider>
  )
}